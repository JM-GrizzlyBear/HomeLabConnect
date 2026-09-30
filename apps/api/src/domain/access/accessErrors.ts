import { DomainError } from "../errors/domainError.js";

/** The signed-in user lacks the permission a route needs. */
export class PermissionDenied extends DomainError {
  readonly kind = "forbidden";
  constructor() {
    super("You do not have access to this resource.", "forbidden");
  }
}
