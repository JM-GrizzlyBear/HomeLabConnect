import {
  boolean,
  foreignKey,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { userRoleEnum } from "./enums";
import { roles } from "./roles";

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    role: userRoleEnum("role").notNull(),
    lastName: varchar("last_name", { length: 80 }).notNull(),
    firstName: varchar("first_name", { length: 80 }).notNull(),
    middleName: varchar("middle_name", { length: 80 }),
    phone: varchar("phone", { length: 40 }),
    avatar: text("avatar"),
    isActive: boolean("is_active").notNull().default(true),
    emailVerified: boolean("email_verified").notNull().default(false),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    emailIdx: uniqueIndex("users_email_unique").on(t.email),
    roleFk: foreignKey({
      columns: [t.role],
      foreignColumns: [roles.role],
      name: "users_role_roles_role_fk",
    }),
  }),
);

export type UserRow = typeof users.$inferSelect;
export type NewUserRow = typeof users.$inferInsert;
