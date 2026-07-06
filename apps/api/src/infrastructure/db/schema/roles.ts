import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { userRoleEnum } from "./enums";

export const roles = pgTable("roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  // .unique() creates a real UNIQUE CONSTRAINT (not just an index), which
  // Postgres requires as the target of a foreign key.
  role: userRoleEnum("role").notNull().unique("roles_role_unique"),
  description: text("description").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type RoleRow = typeof roles.$inferSelect;
export type NewRoleRow = typeof roles.$inferInsert;
