export interface Session {
  id: string;
  userId: string;
  createdAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
}

/** Business rule: a session works until it expires or is revoked, whichever comes first. */
export function isSessionActive(session: Session, now: Date): boolean {
  return session.revokedAt === null && session.expiresAt.getTime() > now.getTime();
}
