export interface RequestIssue {
  path: string;
  message: string;
}

/** The request body or query didn't match the shared contract. */
export class InvalidRequest extends Error {
  constructor(readonly issues: RequestIssue[]) {
    super("Request is not valid.");
    this.name = "InvalidRequest";
  }
}

/** The part of a Zod schema we rely on, so this layer doesn't import Zod itself. */
interface Schema<T> {
  safeParse(input: unknown):
    | { success: true; data: T }
    | {
        success: false;
        error: { issues: readonly { path: readonly PropertyKey[]; message: string }[] };
      };
}

/** Validates input against a shared contract schema, throwing InvalidRequest on failure. */
export function parseRequest<T>(schema: Schema<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (result.success) return result.data;
  throw new InvalidRequest(
    result.error.issues.map((issue) => ({
      path: issue.path.map(String).join("."),
      message: issue.message,
    })),
  );
}
