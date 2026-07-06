import {
  boolean,
  doublePrecision,
  foreignKey,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { users } from "./users";

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
