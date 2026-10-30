import { index, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { timestamptz } from "./columns.js";
import { users } from "./users.js";

/** "Forgot password?" links. The token itself is never stored, only its SHA-256 hash. */
export const passwordResets = pgTable(
  "password_resets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamptz("expires_at").notNull(),
    usedAt: timestamptz("used_at"),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
  },
  (table) => [index("password_resets_user_idx").on(table.userId)],
);
