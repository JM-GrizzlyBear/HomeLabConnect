import { and, asc, eq, sql } from "drizzle-orm";
import type { MedTeamRepository } from "../../application/ports/medTeamRepository.js";
import type { MedTeam, MedTeamDetails } from "../../domain/scheduling/medTeam.js";
import type { Roster } from "../../domain/scheduling/roster.js";
import { TeamNameTaken } from "../../domain/scheduling/schedulingErrors.js";
import type { Database } from "./client.js";
import { isUniqueViolation } from "./errors.js";
import { medTeams, teamRosterMembers, teamRosters } from "./schema/index.js";

const teamColumns = {
  id: medTeams.id,
  name: medTeams.name,
  area: medTeams.area,
  isActive: medTeams.isActive,
};

export class DrizzleMedTeamRepository implements MedTeamRepository {
  constructor(private readonly db: Database) {}

  async list(): Promise<MedTeam[]> {
    return this.db.select(teamColumns).from(medTeams).orderBy(asc(medTeams.name));
  }

  async findById(id: string): Promise<MedTeam | null> {
    const [row] = await this.db.select(teamColumns).from(medTeams).where(eq(medTeams.id, id));
    return row ?? null;
  }

  async findByName(name: string): Promise<MedTeam | null> {
    const [row] = await this.db
      .select(teamColumns)
      .from(medTeams)
      .where(eq(sql`lower(${medTeams.name})`, name.trim().toLowerCase()));
    return row ?? null;
  }

  async create(details: MedTeamDetails): Promise<MedTeam> {
    const [row] = await this.write(() =>
      this.db.insert(medTeams).values(details).returning(teamColumns),
    );
    if (!row) throw new Error("Insert into med_teams returned no row.");
    return row;
  }

  async update(id: string, details: MedTeamDetails): Promise<void> {
    await this.write(() => this.db.update(medTeams).set(details).where(eq(medTeams.id, id)));
  }

  async setActive(id: string, isActive: boolean): Promise<void> {
    await this.db.update(medTeams).set({ isActive }).where(eq(medTeams.id, id));
  }

  async listRosters(periodStart: string): Promise<Roster[]> {
    const rows = await this.db
      .select({
        id: teamRosters.id,
        teamId: teamRosters.teamId,
        leadUserId: teamRosters.leadUserId,
        memberId: teamRosterMembers.userId,
      })
      .from(teamRosters)
      .leftJoin(teamRosterMembers, eq(teamRosterMembers.rosterId, teamRosters.id))
      .where(eq(teamRosters.periodStart, periodStart));

    const byRoster = new Map<string, Roster>();
    for (const row of rows) {
      const roster = byRoster.get(row.id) ?? {
        teamId: row.teamId,
        periodStart,
        leadUserId: row.leadUserId,
        memberIds: [],
      };
      if (row.memberId) roster.memberIds.push(row.memberId);
      byRoster.set(row.id, roster);
    }
    return [...byRoster.values()];
  }

  async saveRoster(roster: Roster): Promise<void> {
    await this.db.transaction(async (tx) => {
      const where = and(
        eq(teamRosters.teamId, roster.teamId),
        eq(teamRosters.periodStart, roster.periodStart),
      );
      // Members go with the roster row (ON DELETE CASCADE), so replace both.
      await tx.delete(teamRosters).where(where);
      if (roster.memberIds.length === 0 || !roster.leadUserId) return;
      const [row] = await tx
        .insert(teamRosters)
        .values({
          teamId: roster.teamId,
          periodStart: roster.periodStart,
          leadUserId: roster.leadUserId,
        })
        .returning({ id: teamRosters.id });
      if (!row) throw new Error("Insert into team_rosters returned no row.");
      await tx
        .insert(teamRosterMembers)
        .values(roster.memberIds.map((userId) => ({ rosterId: row.id, userId })));
    });
  }

  private async write<T>(work: () => Promise<T>): Promise<T> {
    try {
      return await work();
    } catch (error) {
      if (isUniqueViolation(error)) throw new TeamNameTaken();
      throw error;
    }
  }
}
