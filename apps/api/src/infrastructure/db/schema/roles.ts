import { pgTable, text } from "drizzle-orm/pg-core";

/** The five base roles. The id is the role key (e.g. "admin") so rows read clearly. */
export const roles = pgTable("roles", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
});
