import { PermissionDenied } from "../../domain/access/accessErrors.js";
import type { Appointment } from "../../domain/appointments/appointment.js";
import { AppointmentNotFound } from "../../domain/appointments/appointmentErrors.js";
import { CASH_STATUSES } from "../../domain/payments/payment.js";
import { PaymentNotAllowed } from "../../domain/payments/paymentErrors.js";
import { type AppointmentViewer, findViewable } from "../appointments/GetAppointment.js";
import { type AppointmentEmails, notifyPatient } from "../ports/AppointmentEmails.js";
import type { Clock } from "../ports/Clock.js";
import type { PaymentRepositories } from "./paymentRepositories.js";

export interface RecordCashPaymentInput {
  appointmentId: string;
  actor: AppointmentViewer;
}

/**
 * The med team took cash for the whole total at the visit. Only the visit's own team, or
 * staff who see every appointment, may record it.
 */
export class RecordCashPayment {
  constructor(
    private readonly repositories: PaymentRepositories,
    private readonly emails: AppointmentEmails,
    private readonly clock: Clock,
  ) {}

  async execute({ appointmentId, actor }: RecordCashPaymentInput): Promise<Appointment> {
    const { appointments, payments } = this.repositories;
    const { appointment, access } = await findViewable(this.repositories, appointmentId, actor);
    if (access === "patient") throw new PermissionDenied();
    if (appointment.paymentStatus !== "unpaid") {
      throw new PaymentNotAllowed("This appointment is already paid.");
    }
    if (!CASH_STATUSES.includes(appointment.status)) {
      throw new PaymentNotAllowed("Cash is taken at the visit, once the team is on the way.");
    }

    const payment = await payments.recordCash({
      appointmentId,
      amountCentavos: appointment.totalCentavos,
      actorId: actor.userId,
      paidAt: this.clock.now(),
    });
    if (!payment) throw new PaymentNotAllowed("This appointment is already paid.");
    const updated = await appointments.findById(appointmentId);
    if (!updated) throw new AppointmentNotFound();
    await notifyPatient(this.emails, "payment_received", updated);
    return updated;
  }
}
