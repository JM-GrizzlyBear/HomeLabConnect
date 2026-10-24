import { and, ne, sql } from "drizzle-orm";
import type { SessionRepository } from "../../domain/identity/SessionRepository.js";
import type { Database } from "./client.js";
import { session } from "./schema/index.js";

/** Revokes sessions by deleting their rows from express-session's table. */
export class DrizzleSessionRepository implements SessionRepository {
  constructor(private readonly db: Database) {}

  async revokeAllForUser(userId: string, exceptSessionId?: string): Promise<void> {
    await this.db
      .delete(session)
      .where(
        and(
          sql`${session.sess}->>'userId' = ${userId}`,
          exceptSessionId ? ne(session.sid, exceptSessionId) : undefined,
        ),
      );
  }
}
