import {
  boolean,
  date,
  doublePrecision,
  foreignKey,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

// Implemented so far: `roles`, `users`. Add patients, appointments,
// chat, etc. as you build each feature, then run `pnpm db:generate &&
// pnpm db:migrate`.

export const userRoleEnum = pgEnum("user_role", [
  "patient",
  "med_team",
  "doctor",
  "support",
  "admin",
]);

export const genderEnum = pgEnum("gender", [
  "male",
  "female",
  "other",
  "prefer_not_to_say",
]);

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

export const patients = pgTable(
  "patients",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().unique("patients_user_id_unique"),
    dateOfBirth: date("date_of_birth", { mode: "string" }),
    gender: genderEnum("gender"),
    address1: varchar("address_1", { length: 255 }),
    address2: varchar("address_2", { length: 255 }),
    city: varchar("city", { length: 120 }),
    province: varchar("province", { length: 120 }),
    postalCode: varchar("postal_code", { length: 20 }),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    emergencyContactName: varchar("emergency_contact_name", { length: 160 }),
    emergencyContactPhone: varchar("emergency_contact_phone", { length: 40 }),
    medicalNotes: text("medical_notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    userFk: foreignKey({
      columns: [t.userId],
      foreignColumns: [users.id],
      name: "patients_user_id_users_id_fk",
    }),
  }),
);

export type PatientRow = typeof patients.$inferSelect;
export type NewPatientRow = typeof patients.$inferInsert;
