import type { HandlePaymentWebhook } from "../../../application/payments/HandlePaymentWebhook.js";
import { InvalidWebhook } from "../../../domain/payments/paymentErrors.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";

/** Stripe calls this; the body arrives as the raw bytes it signed. */
export class HandlePaymentWebhookController implements Controller {
  constructor(private readonly handlePaymentWebhook: HandlePaymentWebhook) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const signature = request.headers["stripe-signature"];
    if (typeof signature !== "string" || !(request.body instanceof Uint8Array)) {
      throw new InvalidWebhook();
    }
    await this.handlePaymentWebhook.execute({ rawBody: request.body, signature });
    return { status: 200, body: { received: true } };
  }
}
