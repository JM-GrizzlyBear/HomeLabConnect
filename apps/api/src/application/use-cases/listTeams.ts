import type { MedTeam } from "../../domain/scheduling/medTeam.js";
import { rosterPeriodEnd, rosterPeriodOf } from "../../domain/scheduling/roster.js";
import { businessDate } from "../../domain/time/businessDate.js";
import type { Clock } from "../ports/clock.js";
import type { MedTeamRepository } from "../ports/medTeamRepository.js";
import { fullName, type StaffDirectory } from "../ports/staffDirectory.js";

export interface Person {
  id: string;
  name: string;
}

export interface TeamWithRoster extends MedTeam {
  lead: Person | null;
  members: Person[];
}

export interface TeamBoard {
  periodStart: string;
  periodEnd: string;
  teams: TeamWithRoster[];
  /** Active med team staff on no team this period. */
  unassigned: Person[];
}

export interface ListTeamsInput {
  /** Any day in the wanted period; today when null. */
  date: string | null;
  /** Only people who manage teams see deactivated ones. */
  includeInactive: boolean;
}

/** Every team with who is on it for one two-week period, plus who isn't on any team. */
export class ListTeams {
  constructor(
    private readonly teams: MedTeamRepository,
    private readonly staff: StaffDirectory,
    private readonly clock: Clock,
  ) {}

  async execute({ date, includeInactive }: ListTeamsInput): Promise<TeamBoard> {
    const periodStart = rosterPeriodOf(date ?? businessDate(this.clock.now()));
    const [teams, rosters, medTeam] = await Promise.all([
      this.teams.list(),
      this.teams.listRosters(periodStart),
      this.staff.listActive("med_team"),
    ]);
    const names = new Map(medTeam.map((person) => [person.id, fullName(person)]));
    const person = (id: string): Person => ({ id, name: names.get(id) ?? "Former staff" });

    const shown = teams.filter((team) => includeInactive || team.isActive);
    const assigned = new Set(
      rosters
        .filter((roster) => shown.some((team) => team.id === roster.teamId && team.isActive))
        .flatMap((roster) => roster.memberIds),
    );
    return {
      periodStart,
      periodEnd: rosterPeriodEnd(periodStart),
      teams: shown.map((team) => {
        const roster = rosters.find((candidate) => candidate.teamId === team.id);
        return {
          ...team,
          lead: roster?.leadUserId ? person(roster.leadUserId) : null,
          members: (roster?.memberIds ?? [])
            .map(person)
            .sort((a, b) => a.name.localeCompare(b.name)),
        };
      }),
      unassigned: medTeam
        .filter((member) => !assigned.has(member.id))
        .map((member) => person(member.id)),
    };
  }
}
