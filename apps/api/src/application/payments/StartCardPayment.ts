import { CHECKOUT_MINUTES, PAYABLE_STATUSES } from "../../domain/payments/payment.js";
import { CardPaymentsUnavailable, PaymentNotAllowed } from "../../domain/payments/paymentErrors.js";
import { findVisible } from "../appointments/GetAppointment.js";
import type { Clock } from "../ports/Clock.js";
import type { PaymentGateway } from "../ports/PaymentGateway.js";
import type { PaymentRepositories } from "./paymentRepositories.js";

export interface StartCardPaymentInput {
  appointmentId: string;
  patientId: string;
}

/**
 * The patient pays their confirmed visit by card: opens a Stripe checkout (or reuses the one
 * still open) and returns where to send them. Someone else's visit answers 404.
 */
export class StartCardPayment {
  constructor(
    private readonly repositories: PaymentRepositories,
    private readonly gateway: PaymentGateway | null,
    private readonly clock: Clock,
  ) {}

  async execute({ appointmentId, patientId }: StartCardPaymentInput): Promise<{ url: string }> {
    const { appointments, payments } = this.repositories;
    const appointment = await findVisible(appointments, appointmentId, {
      userId: patientId,
      canViewAll: false,
    });
    if (!this.gateway) throw new CardPaymentsUnavailable();
    if (appointment.paymentStatus !== "unpaid") {
      throw new PaymentNotAllowed("This appointment is already paid.");
    }
    if (!PAYABLE_STATUSES.includes(appointment.status)) {
      throw new PaymentNotAllowed("You can pay once your appointment is confirmed.");
    }

    const now = this.clock.now();
    // Reuse a checkout that stays open for at least five more minutes
    const reusable = (await payments.listForAppointment(appointmentId)).find(
      (payment) =>
        payment.provider === "stripe" &&
        payment.status === "pending" &&
        payment.checkoutUrl !== null &&
        payment.createdAt.getTime() + (CHECKOUT_MINUTES - 5) * 60_000 > now.getTime(),
    );
    if (reusable?.checkoutUrl) return { url: reusable.checkoutUrl };

    const checkout = await this.gateway.createCheckout({
      appointmentId,
      code: appointment.code,
      description: appointment.lines.map((line) => line.name).join(", "),
      amountCentavos: appointment.totalCentavos,
      customerEmail: appointment.patientEmail,
      expiresAt: new Date(now.getTime() + CHECKOUT_MINUTES * 60_000),
    });
    await payments.createPending({
      appointmentId,
      amountCentavos: appointment.totalCentavos,
      reference: checkout.reference,
      checkoutUrl: checkout.url,
    });
    return { url: checkout.url };
  }
}
