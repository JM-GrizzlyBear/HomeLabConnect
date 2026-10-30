/** How long a "Forgot password?" link works. */
export const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;

export interface PasswordReset {
  id: string;
  userId: string;
  expiresAt: Date;
  usedAt: Date | null;
}

/**
 * Port: password reset links. Only a hash of each token is kept, so a copy of the database
 * can't be used to reset anyone's password.
 */
export interface PasswordResetRepository {
  create(reset: { userId: string; token: string; expiresAt: Date }): Promise<void>;
  findByToken(token: string): Promise<PasswordReset | null>;
  /** Uses it up; false when it was already used (two tabs racing). */
  markUsed(id: string, at: Date): Promise<boolean>;
}
