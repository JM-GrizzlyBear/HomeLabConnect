const UNIQUE_VIOLATION = "23505";

/** True for a Postgres unique-constraint error, whether or not Drizzle wrapped it. */
export function isUniqueViolation(error: unknown): boolean {
  return uniqueViolationConstraint(error) !== null;
}

/**
 * The name of the unique constraint or index a Postgres error broke, e.g.
 * "lab_procedures_code_unique", or null when it isn't a unique violation.
 */
export function uniqueViolationConstraint(error: unknown): string | null {
  for (let current = error; current instanceof Error; current = current.cause) {
    const { code, constraint } = current as { code?: unknown; constraint?: unknown };
    if (code === UNIQUE_VIOLATION) return typeof constraint === "string" ? constraint : "";
  }
  return null;
}
