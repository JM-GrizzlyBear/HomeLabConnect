import { InvalidEmail } from "./identityErrors.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** An email address, normalised to lower case so lookups and uniqueness ignore case. */
export class Email {
  private constructor(readonly value: string) {}

  static of(raw: string): Email {
    const normalised = raw.trim().toLowerCase();
    if (normalised.length > 254 || !EMAIL_PATTERN.test(normalised)) throw new InvalidEmail();
    return new Email(normalised);
  }
}
