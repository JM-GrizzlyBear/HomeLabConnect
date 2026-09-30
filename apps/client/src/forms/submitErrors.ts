import { ApiError } from "../api/apiClient";
import type { Feedback } from "../feedback/feedbackContext";
import { toFieldErrors } from "./fieldErrors";

interface SubmitErrorOptions {
  /** Title of the error dialog, e.g. "Couldn't save your profile". */
  title: string;
  feedback: Feedback;
  setFieldErrors(errors: Record<string, string>): void;
  /** API error codes that belong under one field, e.g. { email_taken: "email" }. */
  fieldByCode?: Record<string, string>;
}

/**
 * Routes a failed submit: problems with a specific field go inline under that
 * field; anything else (wrong password, server down, account deactivated)
 * opens an error dialog.
 */
export function handleSubmitError(
  error: unknown,
  { title, feedback, setFieldErrors, fieldByCode = {} }: SubmitErrorOptions,
): void {
  if (!(error instanceof ApiError)) {
    feedback.error({ title, description: "Could not reach the server. Try again." });
    return;
  }
  const field = fieldByCode[error.code];
  if (field) {
    setFieldErrors({ [field]: error.message });
  } else if (error.issues.length > 0) {
    setFieldErrors(toFieldErrors(error.issues));
  } else {
    feedback.error({ title, description: error.message });
  }
}
