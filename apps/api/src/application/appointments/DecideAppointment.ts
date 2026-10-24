import { assertCan } from "../../domain/appointments/appointment.js";
import type { AppointmentRepository } from "../../domain/appointments/AppointmentRepository.js";
import type { SettingsRepository } from "../../domain/settings/SettingsRepository.js";
import { type AppointmentEmails, notifyPatient } from "../ports/AppointmentEmails.js";
import type { Clock } from "../ports/Clock.js";
import { type AppointmentOutput, toAppointmentOutput } from "./appointmentOutput.js";
import { findVisible } from "./GetAppointment.js";

export interface DecideAppointmentInput {
  id: string;
  actorId: string;
  decision: "accept" | "reject";
  /** Required to reject: shown to the patient. */
  reason: string | null;
}

/** Staff accept or reject a pending booking. A pending booking already holds its place. */
export class DecideAppointment {
  constructor(
    private readonly appointments: AppointmentRepository,
    private readonly settings: SettingsRepository,
    private readonly emails: AppointmentEmails,
    private readonly clock: Clock,
  ) {}

  async execute({
    id,
    actorId,
    decision,
    reason,
  }: DecideAppointmentInput): Promise<AppointmentOutput> {
    const viewer = { userId: actorId, canViewAll: true };
    const appointment = await findVisible(this.appointments, id, viewer);
    assertCan(decision, appointment.status);

    const accepted = decision === "accept";
    await this.appointments.changeStatus(id, {
      status: accepted ? "confirmed" : "rejected",
      actorId,
      event: accepted ? "confirmed" : "rejected",
      note: reason,
      decisionNote: accepted ? null : reason,
    });
    const updated = await findVisible(this.appointments, id, viewer);
    await notifyPatient(this.emails, accepted ? "confirmed" : "rejected", updated);
    const { settings } = await this.settings.get();
    return toAppointmentOutput(updated, settings.cancelCutoffHours, this.clock.now());
  }
}
