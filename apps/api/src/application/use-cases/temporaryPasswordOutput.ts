import type { User } from "../../domain/identity/user.js";
import { toUserOutput, type UserOutput } from "./userOutput.js";

/** The result of issuing a temporary password, for a new staff account or a reissue. */
export interface TemporaryPasswordOutput {
  user: UserOutput;
  temporaryPasswordExpiresAt: Date;
  emailSent: boolean;
  /** Only set when the email failed, so the admin can hand the password over in person. */
  temporaryPassword: string | null;
}

/**
 * Emails the temporary password. A failed email doesn't undo the change: the
 * password goes back to the admin instead of being lost.
 */
export async function deliverTemporaryPassword(
  user: User,
  temporaryPassword: string,
  expiresAt: Date,
  send: () => Promise<void>,
): Promise<TemporaryPasswordOutput> {
  let emailSent = true;
  try {
    await send();
  } catch {
    emailSent = false;
  }
  return {
    user: toUserOutput(user),
    temporaryPasswordExpiresAt: expiresAt,
    emailSent,
    temporaryPassword: emailSent ? null : temporaryPassword,
  };
}
