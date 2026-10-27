import { assertRefund, type PaymentWithAppointment } from "../../domain/payments/payment.js";
import { InvalidRefund, PaymentNotFound } from "../../domain/payments/paymentErrors.js";
import { type AppointmentEmails, notifyPatient } from "../ports/AppointmentEmails.js";
import type { PaymentGateway } from "../ports/PaymentGateway.js";
import type { PaymentRepositories } from "./paymentRepositories.js";

export interface RefundPaymentInput {
  paymentId: string;
  amountCentavos: number;
  reason: string;
  actorId: string;
}

/**
 * An admin gives back part or all of a payment. Card payments are refunded through Stripe;
 * cash refunds are handed over in person and only recorded here.
 */
export class RefundPayment {
  constructor(
    private readonly repositories: PaymentRepositories,
    private readonly gateway: PaymentGateway | null,
    private readonly emails: AppointmentEmails,
  ) {}

  async execute(input: RefundPaymentInput): Promise<PaymentWithAppointment> {
    const { appointments, payments } = this.repositories;
    const payment = await payments.findById(input.paymentId);
    if (!payment) throw new PaymentNotFound();
    assertRefund(payment, input.amountCentavos);

    if (payment.provider === "stripe") {
      if (!this.gateway || !payment.providerReference) {
        throw new InvalidRefund("Card refunds need Stripe to be set up.");
      }
      await this.gateway.refund(payment.providerReference, input.amountCentavos);
    }
    await payments.addRefund({
      paymentId: payment.id,
      amountCentavos: input.amountCentavos,
      reason: input.reason.trim(),
      actorId: input.actorId,
    });

    const appointment = await appointments.findById(payment.appointmentId);
    if (appointment) await notifyPatient(this.emails, "payment_refunded", appointment);
    const updated = await payments.findById(payment.id);
    if (!updated) throw new PaymentNotFound();
    return updated;
  }
}
