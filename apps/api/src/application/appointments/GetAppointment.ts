import type { Appointment } from "../../domain/appointments/appointment.js";
import { AppointmentNotFound } from "../../domain/appointments/appointmentErrors.js";
import type { AppointmentRepository } from "../../domain/appointments/AppointmentRepository.js";
import type { SettingsRepository } from "../../domain/settings/SettingsRepository.js";
import type { Clock } from "../ports/Clock.js";
import { type AppointmentOutput, toAppointmentOutput } from "./appointmentOutput.js";

export interface AppointmentViewer {
  userId: string;
  /** Staff with appointments.view_all see everyone's; patients only their own. */
  canViewAll: boolean;
}

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

export interface GetAppointmentInput {
  id: string;
  viewer: AppointmentViewer;
}

export class GetAppointment {
  constructor(
    private readonly appointments: AppointmentRepository,
    private readonly settings: SettingsRepository,
    private readonly clock: Clock,
  ) {}

  async execute({ id, viewer }: GetAppointmentInput): Promise<AppointmentOutput> {
    const [appointment, { settings }] = await Promise.all([
      findVisible(this.appointments, id, viewer),
      this.settings.get(),
    ]);
    return toAppointmentOutput(appointment, settings.cancelCutoffHours, this.clock.now());
  }
}
