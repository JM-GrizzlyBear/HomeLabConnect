import { checkRoster, type Roster } from "../../domain/scheduling/roster.js";
import { InvalidRoster, TeamNotFound } from "../../domain/scheduling/schedulingErrors.js";
import type { MedTeamRepository } from "../../domain/scheduling/MedTeamRepository.js";
import { fullName, type StaffDirectory } from "../../domain/scheduling/StaffDirectory.js";

/**
 * A team lead or admin sets who is on a team, and who leads it, for one
 * two-week period. An empty member list clears the roster.
 */
export class SaveRoster {
  constructor(
    private readonly teams: MedTeamRepository,
    private readonly staff: StaffDirectory,
  ) {}

  async execute(input: Roster): Promise<Roster> {
    const team = await this.teams.findById(input.teamId);
    if (!team) throw new TeamNotFound();
    if (!team.isActive && input.memberIds.length > 0) {
      throw new InvalidRoster("Reactivate the team before giving it a roster.");
    }

    const [teams, rosters, medTeam] = await Promise.all([
      this.teams.list(),
      this.teams.listRosters(input.periodStart),
      this.staff.listActive("med_team"),
    ]);
    const teamNames = new Map(teams.map((other) => [other.id, other.name]));
    const roster = checkRoster(input, {
      eligible: new Map(medTeam.map((person) => [person.id, fullName(person)])),
      otherRosters: rosters.map((other) => ({
        ...other,
        teamName: teamNames.get(other.teamId) ?? "another team",
      })),
    });
    await this.teams.saveRoster(roster);
    return roster;
  }
}
