import {
  boolean,
  date,
  foreignKey,
  pgTable,
  time,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { dayOfWeekEnum } from "./enums";
import { medTeamMembers } from "./med-team-members";

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
