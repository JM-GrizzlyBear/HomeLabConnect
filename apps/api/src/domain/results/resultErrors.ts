import { DomainError } from "../errors/domainError.js";

export class ResultNotFound extends DomainError {
  readonly kind = "not_found";

  constructor() {
    super("Result not found.", "result_not_found");
  }
}

/** Not a PDF or photo, too big, or a comment that's too long. */
export class InvalidResult extends DomainError {
  readonly kind = "validation";

  constructor(message: string) {
    super(message, "invalid_result");
  }
}

/** The visit or test can't take a result now (not collected, or already released). */
export class ResultNotAllowed extends DomainError {
  readonly kind = "conflict";

  constructor(message: string) {
    super(message, "result_not_allowed");
  }
}
