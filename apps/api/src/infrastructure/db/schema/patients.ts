import {
  date,
  doublePrecision,
  foreignKey,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { genderEnum } from "./enums";
import { users } from "./users";

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
