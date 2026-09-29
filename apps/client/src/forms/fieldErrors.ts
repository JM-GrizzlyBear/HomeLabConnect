interface Issue {
  path: readonly PropertyKey[] | string;
  message: string;
}

/** Turns Zod or API validation issues into `{ field: firstMessage }` for showing under inputs. */
export function toFieldErrors(issues: readonly Issue[]): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const field = typeof issue.path === "string" ? issue.path : issue.path.map(String).join(".");
    errors[field] ??= issue.message;
  }
  return errors;
}
