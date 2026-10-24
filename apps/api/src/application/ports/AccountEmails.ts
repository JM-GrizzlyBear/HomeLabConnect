export interface TemporaryPasswordEmail {
  to: string;
  firstName: string;
  temporaryPassword: string;
  expiresAt: Date;
}

/** Port: the account emails the system sends. Throws if the email could not be sent. */
export interface AccountEmails {
  /** A new staff account's first temporary password. */
  sendStaffWelcome(email: TemporaryPasswordEmail): Promise<void>;
  /** A replacement temporary password issued by an admin. */
  sendTemporaryPasswordReissued(email: TemporaryPasswordEmail): Promise<void>;
}
