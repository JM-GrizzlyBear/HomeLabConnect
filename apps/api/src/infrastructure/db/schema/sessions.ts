import { index, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { timestamptz } from "./columns.js";
import { users } from "./users.js";

/** One row per sign-in. Tokens carry the session id, so revoking the row signs the token out. */
export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
    expiresAt: timestamptz("expires_at").notNull(),
    revokedAt: timestamptz("revoked_at"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
  },
  (table) => [index("sessions_user_id_idx").on(table.userId)],
);
