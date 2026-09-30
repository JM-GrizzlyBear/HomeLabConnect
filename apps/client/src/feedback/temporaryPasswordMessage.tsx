import type { TemporaryPasswordResponse } from "@homelabconnect/shared";
import { CopyableSecret } from "@/components/CopyableSecret";
import { formatDateTime } from "@/format/dates";
import type { MessageOptions } from "./feedbackContext";

/**
 * The success dialog after issuing a temporary password: where it went, when
 * it expires, and, if the email failed, the password itself to hand over.
 */
export function temporaryPasswordMessage(
  result: TemporaryPasswordResponse,
  title: string,
): MessageOptions {
  const { user, emailSent, temporaryPassword, temporaryPasswordExpiresAt } = result;
  const expiry = formatDateTime(temporaryPasswordExpiresAt);

  if (emailSent) {
    return {
      title,
      description: (
        <>
          A temporary password was emailed to <strong>{user.email}</strong>. It expires on {expiry},
          and {user.firstName} must change it the first time they sign in.
        </>
      ),
    };
  }
  return {
    title,
    description: (
      <>
        We couldn't email <strong>{user.email}</strong>. Give them this temporary password yourself.
        It won't be shown again and expires on {expiry}.
      </>
    ),
    content: temporaryPassword && (
      <CopyableSecret value={temporaryPassword} label="Temporary password" />
    ),
    closeLabel: "I've saved it",
  };
}
