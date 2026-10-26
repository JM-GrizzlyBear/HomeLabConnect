import { CardPaymentsUnavailable } from "../../domain/payments/paymentErrors.js";
import { type AppointmentEmails, notifyPatient } from "../ports/AppointmentEmails.js";
import type { Clock } from "../ports/Clock.js";
import type { PaymentGateway } from "../ports/PaymentGateway.js";
import type { PaymentRepositories } from "./paymentRepositories.js";

export interface HandlePaymentWebhookInput {
  rawBody: Uint8Array;
  signature: string;
}

/**
 * Stripe tells us a checkout was paid (or expired). Each event is handled once, however many
 * times it arrives; the patient gets a "payment received" email.
 */
export class HandlePaymentWebhook {
  constructor(
    private readonly repositories: PaymentRepositories,
    private readonly gateway: PaymentGateway | null,
    private readonly emails: AppointmentEmails,
    private readonly clock: Clock,
  ) {}

  async execute({ rawBody, signature }: HandlePaymentWebhookInput): Promise<void> {
    if (!this.gateway) throw new CardPaymentsUnavailable();
    const { appointments, payments } = this.repositories;
    const event = await this.gateway.parseWebhook(rawBody, signature);
    if (event.type === "other" || !event.reference) return;
    if (!(await payments.recordWebhookEvent(event.eventId))) return;

    const payment = await payments.findByReference(event.reference);
    if (!payment) return;
    if (event.type === "checkout_expired") {
      if (payment.status === "pending") await payments.markExpired(payment.id);
      return;
    }
    if (!(await payments.markPaid(payment.id, this.clock.now()))) return;
    const appointment = await appointments.findById(payment.appointmentId);
    if (appointment) await notifyPatient(this.emails, "payment_received", appointment);
  }
}
