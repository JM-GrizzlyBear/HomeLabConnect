import { bigint, index, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { timestamptz } from "./columns.js";
import { users } from "./users.js";

/** Sign-ins and admin changes, for tracing who did what. Rows are only ever added. */
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Keeps entries in the order they were written, even within the same millisecond. */
    seq: bigint("seq", { mode: "number" }).generatedAlwaysAsIdentity().notNull(),
    at: timestamptz("at").notNull().defaultNow(),
    /** Null for a failed sign-in, or once the user is gone. */
    actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
    /** "<area>.<verb>", e.g. "auth.login_failed", "roles.update". */
    action: text("action").notNull(),
    targetType: text("target_type"),
    targetId: text("target_id"),
    summary: text("summary"),
    ip: text("ip"),
    userAgent: text("user_agent"),
  },
  (table) => [
    index("audit_logs_at_idx").on(table.at.desc(), table.seq.desc()),
    index("audit_logs_action_idx").on(table.action, table.at),
  ],
);
