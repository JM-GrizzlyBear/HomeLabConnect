/**
 * What kind of rule was broken. The interface layer maps each kind to an
 * HTTP status; the domain itself knows nothing about HTTP.
 */
export type DomainErrorKind =
  "validation" | "unauthorized" | "forbidden" | "not_found" | "conflict";

/** Base class for every business rule violation. */
export abstract class DomainError extends Error {
  abstract readonly kind: DomainErrorKind;

  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}
