import type { PaymentGateway } from "../../application/ports/PaymentGateway.js";
import type { Config } from "../config.js";
import { StripePaymentGateway } from "./StripePaymentGateway.js";

/** Stripe when STRIPE_SECRET_KEY is set; otherwise null, and only cash can be taken. */
export function createPaymentGateway(config: Config): PaymentGateway | null {
  if (!config.stripeSecretKey) return null;
  return new StripePaymentGateway({
    secretKey: config.stripeSecretKey,
    webhookSecret: config.stripeWebhookSecret,
    appUrl: config.appUrl,
  });
}
