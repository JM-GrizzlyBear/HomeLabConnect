import type { Appointment } from "../../domain/appointments/appointment.js";
import { AppointmentNotFound } from "../../domain/appointments/appointmentErrors.js";
import type { AppointmentRepository } from "../../domain/appointments/AppointmentRepository.js";
import type { MedTeamRepository } from "../../domain/scheduling/MedTeamRepository.js";
import type { SettingsRepository } from "../../domain/settings/SettingsRepository.js";
import type { Clock } from "../ports/Clock.js";
import { type AppointmentOutput, toAppointmentOutput } from "./appointmentOutput.js";
import { myTeamIds } from "./ListMyVisits.js";

export interface AppointmentViewer {
  userId: string;
  /** Staff with appointments.view_all see everyone's; patients only their own. */
  canViewAll: boolean;
  /** Med team with visits.view_assigned also see the visits of a team they're rostered on. */
  canViewAssigned?: boolean;
}

/** How the viewer may see an appointment: as staff, as its med team, or as its patient. */
export type AppointmentAccess = "staff" | "team" | "patient";

/** Loads an appointment the viewer may see; someone else's answers 404, as if it didn't exist. */
export async function findVisible(
  appointments: AppointmentRepository,
  id: string,
  viewer: AppointmentViewer,
): Promise<Appointment> {
  const appointment = await appointments.findById(id);
  if (!appointment) throw new AppointmentNotFound();
  if (!viewer.canViewAll && appointment.patientId !== viewer.userId) {
    throw new AppointmentNotFound();
  }
  return appointment;
}

/**
 * Like findVisible, but also lets in members of the visit's med team, and says how the viewer
 * got in (patients see less, e.g. only the notes shared with them).
 */
export async function findViewable(
  { appointments, teams }: { appointments: AppointmentRepository; teams: MedTeamRepository },
  id: string,
  viewer: AppointmentViewer,
): Promise<{ appointment: Appointment; access: AppointmentAccess }> {
  const appointment = await appointments.findById(id);
  if (!appointment) throw new AppointmentNotFound();
  if (viewer.canViewAll) return { appointment, access: "staff" };
  if (appointment.patientId === viewer.userId) return { appointment, access: "patient" };
  if (viewer.canViewAssigned && appointment.team) {
    const mine = await myTeamIds({ teams }, viewer.userId, appointment.date);
    if (mine.includes(appointment.team.id)) return { appointment, access: "team" };
  }
  throw new AppointmentNotFound();
}

export interface GetAppointmentInput {
  id: string;
  viewer: AppointmentViewer;
}

export class GetAppointment {
  constructor(
    private readonly appointments: AppointmentRepository,
    private readonly teams: MedTeamRepository,
    private readonly settings: SettingsRepository,
    private readonly clock: Clock,
  ) {}

  async execute({ id, viewer }: GetAppointmentInput): Promise<AppointmentOutput> {
    const [{ appointment }, { settings }] = await Promise.all([
      findViewable({ appointments: this.appointments, teams: this.teams }, id, viewer),
      this.settings.get(),
    ]);
    return toAppointmentOutput(appointment, settings.cancelCutoffHours, this.clock.now());
  }
}
