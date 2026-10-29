import type { Appointment } from "../../domain/appointments/appointment.js";
import { TeamUnavailable } from "../../domain/appointments/appointmentErrors.js";
import { pickTeam, teamChoices } from "../../domain/appointments/teamAssignment.js";
import type { Notifier } from "../notifications/Notifier.js";
import { alertTeam } from "../notifications/staffAlerts.js";
import type { AvailabilityRepositories } from "./GetAvailability.js";
import { teamsOnDutyOn } from "./teamsOnDuty.js";

/**
 * With Settings → team assignment = automatic, gives a just-confirmed visit to the free team
 * with the fewest visits that day. Leaves it unassigned (for staff) if no team is free.
 * Returns the updated appointment when a team was given, and tells that team.
 */
export async function assignIfAutomatic(
  id: string,
  repositories: AvailabilityRepositories,
  notifier: Notifier,
): Promise<Appointment | null> {
  const { appointments, teams, settings, ...schedules } = repositories;
  const { settings: rules } = await settings.get();
  if (rules.teamAssignment !== "auto") return null;
  const appointment = await appointments.findById(id);
  if (!appointment || appointment.status !== "confirmed" || appointment.team) return null;

  const [onDuty, loads] = await Promise.all([
    teamsOnDutyOn(appointment.date, teams, schedules),
    appointments.teamLoads(appointment.date, id),
  ]);
  const team = pickTeam(teamChoices(onDuty, loads, appointment.slot, rules.visitsPerTeamPerDay));
  if (!team) return null;
  try {
    await appointments.assignTeam(id, team.teamId, rules.visitsPerTeamPerDay, null);
  } catch (error) {
    // Another visit took the team at the same moment: staff assign this one by hand
    if (error instanceof TeamUnavailable) return null;
    throw error;
  }
  const assigned = await appointments.findById(id);
  if (assigned) await alertTeam(notifier, teams, assigned, "visit_assigned");
  return assigned;
}
