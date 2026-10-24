import { assertCan } from "../../domain/appointments/appointment.js";
import { CancelCutoffPassed } from "../../domain/appointments/appointmentErrors.js";
import type { AppointmentRepository } from "../../domain/appointments/AppointmentRepository.js";
import type { SettingsRepository } from "../../domain/settings/SettingsRepository.js";
import { type AppointmentEmails, notifyPatient } from "../ports/AppointmentEmails.js";
import type { Clock } from "../ports/Clock.js";
import { type AppointmentOutput, toAppointmentOutput } from "./appointmentOutput.js";
import { type AppointmentViewer, findVisible } from "./GetAppointment.js";

export interface CancelAppointmentInput {
  id: string;
  /** Staff (canViewAll) may cancel any time; a patient only their own, before the cut-off. */
  actor: AppointmentViewer;
  reason: string | null;
}

export class CancelAppointment {
  constructor(
    private readonly appointments: AppointmentRepository,
    private readonly settings: SettingsRepository,
    private readonly emails: AppointmentEmails,
    private readonly clock: Clock,
  ) {}

  async execute({ id, actor, reason }: CancelAppointmentInput): Promise<AppointmentOutput> {
    const appointment = await findVisible(this.appointments, id, actor);
    assertCan("cancel", appointment.status);
    const { settings } = await this.settings.get();
    const now = this.clock.now();
    const isPatient = appointment.patientId === actor.userId;
    if (
      isPatient &&
      !toAppointmentOutput(appointment, settings.cancelCutoffHours, now).cancellableUntil
    ) {
      throw new CancelCutoffPassed(settings.cancelCutoffHours);
    }

    await this.appointments.changeStatus(id, {
      status: "cancelled",
      actorId: actor.userId,
      event: "cancelled",
      note: reason,
      decisionNote: isPatient ? null : reason,
    });
    const updated = await findVisible(this.appointments, id, actor);
    if (!isPatient) await notifyPatient(this.emails, "cancelled", updated);
    return toAppointmentOutput(updated, settings.cancelCutoffHours, now);
  }
}
