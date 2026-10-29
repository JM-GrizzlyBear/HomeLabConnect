import { DomainError } from "../errors/domainError.js";

export class TicketNotFound extends DomainError {
  readonly kind = "not_found";

  constructor() {
    super("Ticket not found.", "ticket_not_found");
  }
}

export class MessageNotFound extends DomainError {
  readonly kind = "not_found";

  constructor() {
    super("Message not found.", "message_not_found");
  }
}

/** An empty message, a file that isn't a PDF or photo, or an agent who can't take tickets. */
export class InvalidTicket extends DomainError {
  readonly kind = "validation";

  constructor(message: string) {
    super(message, "invalid_ticket");
  }
}

/** Nobody can write in it any more (the patient's reopen window has passed). */
export class TicketClosed extends DomainError {
  readonly kind = "conflict";

  constructor(message: string) {
    super(message, "ticket_closed");
  }
}

/** Claimed by someone else, rated twice, or rated before it's closed. */
export class TicketNotAllowed extends DomainError {
  readonly kind = "conflict";

  constructor(message: string) {
    super(message, "ticket_not_allowed");
  }
}
