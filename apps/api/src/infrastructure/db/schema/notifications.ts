import { sql } from "drizzle-orm";
import { index, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { timestamptz } from "./columns.js";
import { users } from "./users.js";

/** One line in someone's bell: what happened, and the page it's about. */
export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** e.g. "confirmed", "booking_pending" (see domain/notifications). */
    kind: text("kind").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    /** An in-app path, e.g. /app/appointments/<id>. */
    link: text("link").notNull(),
    readAt: timestamptz("read_at"),
    createdAt: timestamptz("created_at").notNull(),
  },
  (table) => [
    index("notifications_user_idx").on(table.userId, table.createdAt.desc()),
    index("notifications_unread_idx")
      .on(table.userId)
      .where(sql`${table.readAt} is null`),
  ],
);
