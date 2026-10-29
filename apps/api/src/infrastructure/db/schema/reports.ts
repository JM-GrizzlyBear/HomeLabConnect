import { date, pgTable, text, unique, uuid } from "drizzle-orm/pg-core";
import { timestamptz } from "./columns.js";
import { users } from "./users.js";

/** A report a user saved to open again. Only its owner sees it. */
export const savedReports = pgTable(
  "saved_reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    kind: text("kind", { enum: ["revenue", "bookings", "tests"] }).notNull(),
    period: text("period", { enum: ["day", "week", "month"] }).notNull(),
    /** A relative range ("this_month"); then from/to are null. */
    preset: text("preset", { enum: ["this_month", "last_month", "last_30_days", "this_year"] }),
    from: date("from"),
    to: date("to"),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
  },
  (table) => [unique("saved_reports_user_name_unique").on(table.userId, table.name)],
);
