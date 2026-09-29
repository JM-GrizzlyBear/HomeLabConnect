import { and, eq, isNull } from "drizzle-orm";
import type { NewSession, SessionRepository } from "../../application/ports/sessionRepository.js";
import type { Session } from "../../domain/identity/session.js";
import type { Database } from "./client.js";
import { sessions } from "./schema/index.js";

type SessionRow = typeof sessions.$inferSelect;

function toSession(row: SessionRow): Session {
  return {
    id: row.id,
    userId: row.userId,
    createdAt: row.createdAt,
    expiresAt: row.expiresAt,
    revokedAt: row.revokedAt,
  };
}

export class DrizzleSessionRepository implements SessionRepository {
  constructor(private readonly db: Database) {}

  async create(session: NewSession): Promise<Session> {
    const [row] = await this.db.insert(sessions).values(session).returning();
    if (!row) throw new Error("Insert into sessions returned no row.");
    return toSession(row);
  }

  async findById(id: string): Promise<Session | null> {
    const [row] = await this.db.select().from(sessions).where(eq(sessions.id, id));
    return row ? toSession(row) : null;
  }

  async revoke(id: string, at: Date): Promise<void> {
    await this.db
      .update(sessions)
      .set({ revokedAt: at })
      .where(and(eq(sessions.id, id), isNull(sessions.revokedAt)));
  }
}
