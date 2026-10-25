import { PermissionDenied } from "../../domain/access/accessErrors.js";
import { type Appointment, isSameVisits } from "../../domain/appointments/appointment.js";
import { InvalidVisitRecord } from "../../domain/appointments/appointmentErrors.js";
import type { AvailabilityRepositories } from "./GetAvailability.js";
import { myTeamIds } from "./ListMyVisits.js";
import { teamsOnDutyOn } from "./teamsOnDuty.js";

/** Who is looking at routes: routes.manage sees and orders any team's; the med team its own. */
export interface RouteViewer {
  userId: string;
  canManage: boolean;
}

/** The teams whose route the viewer can open on a date. */
export class ListRouteTeams {
  constructor(private readonly repositories: AvailabilityRepositories) {}

  async execute({ date, viewer }: { date: string; viewer: RouteViewer }) {
    const { teams, ...rest } = this.repositories;
    if (viewer.canManage) {
      const onDuty = await teamsOnDutyOn(date, teams, rest);
      return onDuty.map((team) => ({ id: team.id, name: team.name }));
    }
    const [mine, all] = await Promise.all([
      myTeamIds({ teams }, viewer.userId, date),
      teams.list(),
    ]);
    return all
      .filter((team) => mine.includes(team.id))
      .map((team) => ({ id: team.id, name: team.name }));
  }
}

async function assertCanSee(
  repositories: AvailabilityRepositories,
  teamId: string,
  date: string,
  viewer: RouteViewer,
): Promise<void> {
  if (viewer.canManage) return;
  const mine = await myTeamIds(repositories, viewer.userId, date);
  if (!mine.includes(teamId)) throw new PermissionDenied();
}

/** A team's visits for a day, in route order (saved order first, then by time). */
export class GetDailyRoute {
  constructor(private readonly repositories: AvailabilityRepositories) {}

  async execute({
    teamId,
    date,
    viewer,
  }: {
    teamId: string;
    date: string;
    viewer: RouteViewer;
  }): Promise<Appointment[]> {
    await assertCanSee(this.repositories, teamId, date, viewer);
    return await this.repositories.appointments.listForTeams([teamId], date);
  }
}

/** routes.manage: puts a team's visits for a day in a new order. */
export class ReorderRoute {
  constructor(private readonly repositories: AvailabilityRepositories) {}

  async execute(input: {
    teamId: string;
    date: string;
    appointmentIds: readonly string[];
  }): Promise<Appointment[]> {
    const { appointments } = this.repositories;
    const current = await appointments.listForTeams([input.teamId], input.date);
    if (
      !isSameVisits(
        current.map((visit) => visit.id),
        input.appointmentIds,
      )
    ) {
      throw new InvalidVisitRecord("The route changed meanwhile. Reload it and try again.");
    }
    await appointments.setRoute(input.appointmentIds);
    return await appointments.listForTeams([input.teamId], input.date);
  }
}
