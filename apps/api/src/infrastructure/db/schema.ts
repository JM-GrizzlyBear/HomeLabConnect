import {
  boolean,
  date,
  doublePrecision,
  foreignKey,
  pgEnum,
  pgTable,
  text,
  time,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

// Implemented so far: `roles`, `users`. Add patients, appointments,
// chat, etc. as you build each feature, then run `pnpm db:generate &&
// pnpm db:migrate`.

export const dayOfWeekEnum = pgEnum("day_of_week", [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
]);

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

// Add table: med_team_members
export const medTeamMembers = pgTable(
  "med_team_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().unique("med_team_members_user_id_unique"),
    licenseNumber: varchar("license_number", { length: 120 }),
    specialization: varchar("specialization", { length: 160 }),
    serviceAreaCity: varchar("service_area_city", { length: 120 }),
    isAvailable: boolean("is_available").notNull().default(true),
    rating: doublePrecision("rating"),
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
      name: "med_team_members_user_id_users_id_fk",
    }),
  }),
);

export type MedTeamMemberRow = typeof medTeamMembers.$inferSelect;
export type NewMedTeamMemberRow = typeof medTeamMembers.$inferInsert;

// Add table: med_team_shifts
export const medTeamShifts = pgTable(
  "med_team_shifts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    medTeamMemberId: uuid("med_team_member_id").notNull(),
    dayOfWeek: dayOfWeekEnum("day_of_week").notNull(),
    shiftStart: time("shift_start").notNull(), // e.g. "08:00:00"
    shiftEnd: time("shift_end").notNull(), // e.g. "17:00:00"
    isActive: boolean("is_active").notNull().default(true),
    effectiveFrom: date("effective_from", { mode: "string" }).notNull(),
    effectiveUntil: date("effective_until", { mode: "string" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    memberFk: foreignKey({
      columns: [t.medTeamMemberId],
      foreignColumns: [medTeamMembers.id],
      name: "med_team_shifts_member_id_med_team_members_id_fk",
    }),
    uniqSchedule: uniqueIndex(
      "med_team_shifts_member_day_start_from_unique",
    ).on(t.medTeamMemberId, t.dayOfWeek, t.shiftStart, t.effectiveFrom),
  }),
);

export type MedTeamShiftRow = typeof medTeamShifts.$inferSelect;
export type NewMedTeamShiftRow = typeof medTeamShifts.$inferInsert;
