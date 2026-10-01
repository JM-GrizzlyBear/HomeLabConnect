import { DomainError } from "../errors/domainError.js";

export class InvalidSettings extends DomainError {
  readonly kind = "validation";
  constructor(message: string) {
    super(message, "invalid_settings");
  }
}

export class ClosedDayNotFound extends DomainError {
  readonly kind = "not_found";
  constructor() {
    super("Closed day not found.", "closed_day_not_found");
  }
}

export class ClosedDayExists extends DomainError {
  readonly kind = "conflict";
  constructor(message: string) {
    super(message, "closed_day_exists");
  }
}

export class InvalidClosedDay extends DomainError {
  readonly kind = "validation";
  constructor(message: string) {
    super(message, "invalid_closed_day");
  }
}
