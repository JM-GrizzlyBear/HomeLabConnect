import { DomainError } from "../errors/domainError.js";

export class NotificationNotFound extends DomainError {
  readonly kind = "not_found";

  constructor() {
    super("Notification not found.", "notification_not_found");
  }
}
