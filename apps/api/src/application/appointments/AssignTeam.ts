import { assertCan } from "../../domain/appointments/appointment.js";
import { TeamUnavailable } from "../../domain/appointments/appointmentErrors.js";
import { type TeamChoice, teamChoices } from "../../domain/appointments/teamAssignment.js";
import type { Notifier } from "../notifications/Notifier.js";
import { alertTeam } from "../notifications/staffAlerts.js";
import type { Clock } from "../ports/Clock.js";
import { type AppointmentOutput, toAppointmentOutput } from "./appointmentOutput.js";
import type { AvailabilityRepositories } from "./GetAvailability.js";
import { findVisible } from "./GetAppointment.js";
import { teamsOnDutyOn } from "./teamsOnDuty.js";

const staff = (userId: string) => ({ userId, canViewAll: true });

/** The teams on duty on the visit's date, and which can take it at its time. */
export class ListTeamChoices {
  constructor(private readonly repositories: AvailabilityRepositories) {}

  async execute({ id, actorId }: { id: string; actorId: string }): Promise<TeamChoice[]> {
    const { appointments, teams, settings, ...schedules } = this.repositories;
    const appointment = await findVisible(appointments, id, staff(actorId));
    const [{ settings: rules }, onDuty, loads] = await Promise.all([
      settings.get(),
      teamsOnDutyOn(appointment.date, teams, schedules),
      appointments.teamLoads(appointment.date, id),
    ]);
    return teamChoices(onDuty, loads, appointment.slot, rules.visitsPerTeamPerDay);
  }
}

export interface AssignTeamInput {
  id: string;
  actorId: string;
  /** null takes the visit away from its team. */
  teamId: string | null;
}

/** Staff give a confirmed visit to a med team on duty that's free at its time; the team is told. */
export class AssignTeam {
  constructor(
    private readonly repositories: AvailabilityRepositories,
    private readonly notifier: Notifier,
    private readonly clock: Clock,
  ) {}

  async execute({ id, actorId, teamId }: AssignTeamInput): Promise<AppointmentOutput> {
    const { appointments, settings } = this.repositories;
    const appointment = await findVisible(appointments, id, staff(actorId));
    assertCan("assign_team", appointment.status);
    const { settings: rules } = await settings.get();

    if (teamId) {
      const choices = await new ListTeamChoices(this.repositories).execute({ id, actorId });
      const choice = choices.find((candidate) => candidate.teamId === teamId);
      if (!choice) throw new TeamUnavailable("That team isn't on duty that day.");
      if (!choice.available) {
        throw new TeamUnavailable(
          "That team already has a visit at that time or is full that day.",
        );
      }
    }
    await appointments.assignTeam(id, teamId, rules.visitsPerTeamPerDay, actorId);
    const updated = await findVisible(appointments, id, staff(actorId));
    if (teamId && teamId !== appointment.team?.id) {
      await alertTeam(this.notifier, this.repositories.teams, updated, "visit_assigned", actorId);
    }
    return toAppointmentOutput(updated, rules.cancelCutoffHours, this.clock.now());
  }
}
