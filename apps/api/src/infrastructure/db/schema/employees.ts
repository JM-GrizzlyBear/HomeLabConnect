import { date, pgTable, uuid } from "drizzle-orm/pg-core";
import { timestamps } from "./columns.js";
import { users } from "./users.js";

/** Staff-only data (med team, doctors, support, admins). One row per staff user. */
export const employees = pgTable("employees", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  hiredOn: date("hired_on"),
  ...timestamps,
});
