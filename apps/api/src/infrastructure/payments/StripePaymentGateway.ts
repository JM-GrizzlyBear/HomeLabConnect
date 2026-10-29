import Stripe from "stripe";
import type {
  Checkout,
  PaymentEvent,
  PaymentGateway,
} from "../../application/ports/PaymentGateway.js";
import { InvalidWebhook } from "../../domain/payments/paymentErrors.js";

export interface StripeOptions {
  secretKey: string;
  /** Signs the webhooks Stripe sends; without it every webhook is refused. */
  webhookSecret: string | undefined;
  /** The web app's address, for the pages Stripe sends the patient back to. */
  appUrl: string;
}

/** Card payments through Stripe Checkout, in pesos. */
export class StripePaymentGateway implements PaymentGateway {
  private readonly stripe: Stripe;

  constructor(private readonly options: StripeOptions) {
    this.stripe = new Stripe(options.secretKey);
  }

  async createCheckout(input: {
    appointmentId: string;
    code: string;
    description: string;
    amountCentavos: number;
    customerEmail: string;
    expiresAt: Date;
  }): Promise<Checkout> {
    const back = (outcome: "success" | "cancel") =>
      new URL(
        `/app/payments/${outcome}?appointment=${input.appointmentId}`,
        this.options.appUrl,
      ).toString();
    const session = await this.stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: input.customerEmail,
      client_reference_id: input.appointmentId,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "php",
            unit_amount: input.amountCentavos,
            product_data: { name: `Home visit ${input.code}`, description: input.description },
          },
        },
      ],
      metadata: { appointmentId: input.appointmentId },
      expires_at: Math.floor(input.expiresAt.getTime() / 1000),
      success_url: back("success"),
      cancel_url: back("cancel"),
    });
    if (!session.url) throw new Error("Stripe returned a checkout without a URL.");
    return { reference: session.id, url: session.url };
  }

  async parseWebhook(rawBody: Uint8Array, signature: string): Promise<PaymentEvent> {
    if (!this.options.webhookSecret) throw new InvalidWebhook();
    let event: Stripe.Event;
    try {
      event = await this.stripe.webhooks.constructEventAsync(
        rawBody,
        signature,
        this.options.webhookSecret,
      );
    } catch {
      throw new InvalidWebhook();
    }
    if (
      event.type === "checkout.session.completed" &&
      event.data.object.payment_status === "paid"
    ) {
      return { eventId: event.id, type: "checkout_completed", reference: event.data.object.id };
    }
    if (event.type === "checkout.session.expired") {
      return { eventId: event.id, type: "checkout_expired", reference: event.data.object.id };
    }
    return { eventId: event.id, type: "other", reference: null };
  }

  async expireCheckout(reference: string): Promise<void> {
    await this.stripe.checkout.sessions.expire(reference);
  }

  async refund(reference: string, amountCentavos: number): Promise<void> {
    const session = await this.stripe.checkout.sessions.retrieve(reference);
    const paymentIntent =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id;
    if (!paymentIntent) throw new Error(`Checkout ${reference} has no payment to refund.`);
    await this.stripe.refunds.create({ payment_intent: paymentIntent, amount: amountCentavos });
  }
}
