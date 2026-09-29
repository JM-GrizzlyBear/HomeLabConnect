const UNIQUE_VIOLATION = "23505";

/** True for a Postgres unique-constraint error, whether or not Drizzle wrapped it. */
export function isUniqueViolation(error: unknown): boolean {
  for (let current = error; current instanceof Error; current = current.cause) {
    if ((current as { code?: unknown }).code === UNIQUE_VIOLATION) return true;
  }
  return false;
}
