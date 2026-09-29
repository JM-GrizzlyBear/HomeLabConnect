import { WeakPassword } from "./identityErrors.js";

/**
 * Business rule for new passwords: 8–72 characters with at least one letter
 * and one number. The 72 limit is bcrypt's; longer input would be silently cut.
 */
export function assertPasswordIsStrong(password: string): void {
  if (password.length < 8) throw new WeakPassword("Password must be at least 8 characters.");
  if (new TextEncoder().encode(password).length > 72) {
    throw new WeakPassword("Password must be at most 72 characters.");
  }
  if (!/[A-Za-z]/.test(password)) throw new WeakPassword("Password must contain a letter.");
  if (!/[0-9]/.test(password)) throw new WeakPassword("Password must contain a number.");
}
