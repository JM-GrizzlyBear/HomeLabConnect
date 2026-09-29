import { date, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { timestamps } from "./columns.js";
import { users } from "./users.js";

/** Patient-only profile data. One row per patient user. */
export const patients = pgTable("patients", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  birthDate: date("birth_date"),
  address: text("address"),
  ...timestamps,
});
