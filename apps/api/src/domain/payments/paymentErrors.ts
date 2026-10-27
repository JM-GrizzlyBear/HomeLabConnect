import { DomainError } from "../errors/domainError.js";

export class PaymentNotFound extends DomainError {
  readonly kind = "not_found";

  constructor() {
    super("Payment not found.", "payment_not_found");
  }
}

/** Stripe isn't set up (no secret key), so only cash can be taken. */
export class CardPaymentsUnavailable extends DomainError {
  readonly kind = "conflict";

  constructor() {
    super(
      "Card payments aren't available yet. Please pay in cash at the visit.",
      "card_payments_unavailable",
    );
  }
}

/** The appointment can't be paid now: already paid, ₱0, or not in a payable status. */
export class PaymentNotAllowed extends DomainError {
  readonly kind = "conflict";

  constructor(message: string) {
    super(message, "payment_not_allowed");
  }
}

export class InvalidRefund extends DomainError {
  readonly kind = "validation";

  constructor(message: string) {
    super(message, "invalid_refund");
  }
}

/** A webhook whose signature doesn't check out: not from Stripe, or tampered with. */
export class InvalidWebhook extends DomainError {
  readonly kind = "validation";

  constructor() {
    super("Invalid webhook signature.", "invalid_webhook");
  }
}
