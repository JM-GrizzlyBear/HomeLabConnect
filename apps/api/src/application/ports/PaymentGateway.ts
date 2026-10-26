/** A card checkout the patient is sent to. */
export interface Checkout {
  /** The provider's id for it, kept as the payment's reference. */
  reference: string;
  url: string;
}

/** What a webhook said happened, once its signature checks out. */
export interface PaymentEvent {
  eventId: string;
  type: "checkout_completed" | "checkout_expired" | "other";
  /** The checkout it is about (null for other events). */
  reference: string | null;
}

/** Port: the card payment provider (Stripe). */
export interface PaymentGateway {
  createCheckout(input: {
    appointmentId: string;
    code: string;
    description: string;
    amountCentavos: number;
    customerEmail: string;
    expiresAt: Date;
  }): Promise<Checkout>;
  /** Checks the signature and reads the event; throws InvalidWebhook if it isn't genuine. */
  parseWebhook(rawBody: Uint8Array, signature: string): Promise<PaymentEvent>;
  /** Gives back part or all of a paid checkout. */
  refund(reference: string, amountCentavos: number): Promise<void>;
}
