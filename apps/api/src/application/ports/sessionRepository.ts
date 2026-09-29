import type { Session } from "../../domain/identity/session.js";

export interface NewSession {
  userId: string;
  expiresAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
}

/** Port: server-side record of every sign-in, so a token can be revoked before it expires. */
export interface SessionRepository {
  create(session: NewSession): Promise<Session>;
  findById(id: string): Promise<Session | null>;
  revoke(id: string, at: Date): Promise<void>;
}
