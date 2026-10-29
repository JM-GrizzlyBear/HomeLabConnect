import { assertCan } from "../../domain/appointments/appointment.js";
import { type AppointmentEmails, notifyPatient } from "../ports/AppointmentEmails.js";
import type { Notifier } from "../notifications/Notifier.js";
import { alertRefundNeeded } from "../notifications/staffAlerts.js";
import type { Clock } from "../ports/Clock.js";
import { type AppointmentOutput, toAppointmentOutput } from "./appointmentOutput.js";
import { assignIfAutomatic } from "./assignIfAutomatic.js";
import type { AvailabilityRepositories } from "./GetAvailability.js";
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
    private readonly repositories: AvailabilityRepositories,
    private readonly emails: AppointmentEmails,
    private readonly notifier: Notifier,
    private readonly clock: Clock,
  ) {}

  async execute({
    id,
    actorId,
    decision,
    reason,
  }: DecideAppointmentInput): Promise<AppointmentOutput> {
    const viewer = { userId: actorId, canViewAll: true };
    const appointment = await findVisible(this.repositories.appointments, id, viewer);
    assertCan(decision, appointment.status);

    const accepted = decision === "accept";
    await this.repositories.appointments.changeStatus(id, {
      status: accepted ? "confirmed" : "rejected",
      actorId,
      event: accepted ? "confirmed" : "rejected",
      note: reason,
      decisionNote: accepted ? null : reason,
    });
    if (accepted) await assignIfAutomatic(id, this.repositories, this.notifier);
    const updated = await findVisible(this.repositories.appointments, id, viewer);
    await notifyPatient(this.emails, accepted ? "confirmed" : "rejected", updated);
    if (!accepted) await alertRefundNeeded(this.notifier, updated);
    const { settings } = await this.repositories.settings.get();
    return toAppointmentOutput(updated, settings.cancelCutoffHours, this.clock.now());
  }
}
