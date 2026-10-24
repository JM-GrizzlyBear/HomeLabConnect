import {
  isRosterPeriodStart,
  moveToPeriod,
  ROSTER_PERIOD_DAYS,
} from "../../domain/scheduling/roster.js";
import { InvalidRoster, RosterPeriodNotEmpty } from "../../domain/scheduling/schedulingErrors.js";
import { addDays } from "../../domain/time/businessDate.js";
import type { MedTeamRepository } from "../../domain/scheduling/MedTeamRepository.js";
import type { StaffDirectory } from "../../domain/scheduling/StaffDirectory.js";

export interface CopyPreviousRostersInput {
  periodStart: string;
}

/**
 * Fills an empty period with the previous period's rosters, so the same teams
 * carry on. People who left (or stopped being med team) and retired teams are
 * skipped; a team whose lead left is skipped too, so someone picks a new lead.
 * Returns how many rosters were copied.
 */
export class CopyPreviousRosters {
  constructor(
    private readonly teams: MedTeamRepository,
    private readonly staff: StaffDirectory,
  ) {}

  async execute({ periodStart }: CopyPreviousRostersInput): Promise<number> {
    if (!isRosterPeriodStart(periodStart)) {
      throw new InvalidRoster("Rosters start on the first Monday of a two-week period.");
    }
    if ((await this.teams.listRosters(periodStart)).length > 0) throw new RosterPeriodNotEmpty();

    const [previous, teams, medTeam] = await Promise.all([
      this.teams.listRosters(addDays(periodStart, -ROSTER_PERIOD_DAYS)),
      this.teams.list(),
      this.staff.listActive("med_team"),
    ]);
    const activeTeams = new Set(teams.filter((team) => team.isActive).map((team) => team.id));
    const stillHere = new Set(medTeam.map((person) => person.id));

    const copies = moveToPeriod(previous, periodStart)
      .filter((roster) => activeTeams.has(roster.teamId))
      .map((roster) => ({
        ...roster,
        memberIds: roster.memberIds.filter((id) => stillHere.has(id)),
      }))
      .filter((roster) => roster.leadUserId && stillHere.has(roster.leadUserId));

    for (const roster of copies) await this.teams.saveRoster(roster);
    return copies.length;
  }
}
