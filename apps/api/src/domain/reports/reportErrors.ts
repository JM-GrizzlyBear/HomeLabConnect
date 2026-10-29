import { DomainError } from "../errors/domainError.js";

export class InvalidReportRange extends DomainError {
  readonly kind = "validation";

  constructor(message: string) {
    super(message, "invalid_report_range");
  }
}

export class SavedReportNotFound extends DomainError {
  readonly kind = "not_found";

  constructor() {
    super("Saved report not found.", "saved_report_not_found");
  }
}

/** The user already has a saved report with that name. */
export class SavedReportNameTaken extends DomainError {
  readonly kind = "conflict";

  constructor(name: string) {
    super(`You already have a report called "${name}".`, "saved_report_name_taken");
  }
}
