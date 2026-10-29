import { and, count, desc, eq, ilike, inArray, like, or, sql, type SQL } from "drizzle-orm";
import {
  AUDIT_GROUPS,
  type AuditEntry,
  type AuditLog,
  type AuditQuery,
  type NewAuditEntry,
} from "../../domain/audit/auditEntry.js";
import type { Database } from "./client.js";
import { likePattern } from "./likePattern.js";
import { auditLogs, users } from "./schema/index.js";

const actorName = sql<string>`${users.firstName} || ' ' || ${users.lastName}`;
/** The day of an entry, Philippine time. */
const businessDay = sql`(${auditLogs.at} at time zone 'Asia/Manila')::date`;

export class DrizzleAuditLog implements AuditLog {
  constructor(private readonly db: Database) {}

  async record(entry: NewAuditEntry & { at: Date }): Promise<void> {
    await this.db.insert(auditLogs).values(entry);
  }

  async list(query: AuditQuery): Promise<{ items: AuditEntry[]; total: number }> {
    const filters: SQL[] = [];
    if (query.group) {
      const prefixes: readonly string[] = AUDIT_GROUPS[query.group];
      const exact = prefixes.filter((prefix) => !prefix.endsWith("."));
      const matches: SQL[] = prefixes
        .filter((prefix) => prefix.endsWith("."))
        .map((prefix) => like(auditLogs.action, `${prefix}%`));
      if (exact.length > 0) matches.push(inArray(auditLogs.action, exact));
      filters.push(or(...matches) as SQL);
    }
    if (query.from) filters.push(sql`${businessDay} >= ${query.from}`);
    if (query.to) filters.push(sql`${businessDay} <= ${query.to}`);
    if (query.q) {
      const pattern = likePattern(query.q);
      filters.push(
        or(
          ilike(actorName, pattern),
          ilike(users.email, pattern),
          ilike(auditLogs.summary, pattern),
        ) as SQL,
      );
    }
    const where = filters.length > 0 ? and(...filters) : undefined;

    const [{ total } = { total: 0 }] = await this.db
      .select({ total: count() })
      .from(auditLogs)
      .leftJoin(users, eq(users.id, auditLogs.actorId))
      .where(where);
    const rows = await this.db
      .select({ entry: auditLogs, actorName, actorEmail: users.email })
      .from(auditLogs)
      .leftJoin(users, eq(users.id, auditLogs.actorId))
      .where(where)
      .orderBy(desc(auditLogs.at), desc(auditLogs.seq))
      .limit(query.pageSize)
      .offset((query.page - 1) * query.pageSize);

    return {
      total,
      items: rows.map(({ entry, actorName: name, actorEmail }) => ({
        ...entry,
        actor: entry.actorId && actorEmail ? { id: entry.actorId, name, email: actorEmail } : null,
      })),
    };
  }
}
