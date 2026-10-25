import type { Appointment } from "../../domain/appointments/appointment.js";
import { rosterPeriodOf } from "../../domain/scheduling/roster.js";
import type { AvailabilityRepositories } from "./GetAvailability.js";

export interface ListMyVisitsInput {
  userId: string;
  date: string;
}

/** The visits of the med team(s) the user is on for that date's roster period, by time. */
export class ListMyVisits {
  constructor(private readonly repositories: AvailabilityRepositories) {}

  async execute({ userId, date }: ListMyVisitsInput): Promise<Appointment[]> {
    const teamIds = await myTeamIds(this.repositories, userId, date);
    if (teamIds.length === 0) return [];
    return await this.repositories.appointments.listForTeams(teamIds, date);
  }
}

/** The teams whose roster includes the user for the period containing `date`. */
export async function myTeamIds(
  { teams }: Pick<AvailabilityRepositories, "teams">,
  userId: string,
  date: string,
): Promise<string[]> {
  const rosters = await teams.listRosters(rosterPeriodOf(date));
  return rosters
    .filter((roster) => roster.memberIds.includes(userId))
    .map((roster) => roster.teamId);
}
