/** Business rule: a temporary password works for 7 days, whether first issued or reissued. */
export const TEMPORARY_PASSWORD_TTL_DAYS = 7;

export function temporaryPasswordExpiry(issuedAt: Date): Date {
  return new Date(issuedAt.getTime() + TEMPORARY_PASSWORD_TTL_DAYS * 24 * 60 * 60_000);
}
