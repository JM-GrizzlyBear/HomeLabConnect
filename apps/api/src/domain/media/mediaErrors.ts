import { DomainError } from "../errors/domainError.js";

export class InvalidPhoto extends DomainError {
  readonly kind = "validation";

  constructor(message = "Choose a JPG, PNG or WebP photo.") {
    super(message, "invalid_photo");
  }
}
