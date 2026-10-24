import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  jsonb,
  pgTable,
  primaryKey,
  smallint,
  text,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { timestamps, timestamptz } from "./columns.js";
import { users } from "./users.js";

/** Med teams that go out on home visits. Deactivated, never deleted. */
export const medTeams = pgTable(
  "med_teams",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    area: text("area"),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps,
  },
  (table) => [uniqueIndex("med_teams_name_lower_idx").on(sql`lower(${table.name})`)],
);

/** Who leads a team for one two-week period (starting on `period_start`, a Monday). */
export const teamRosters = pgTable(
  "team_rosters",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => medTeams.id, { onDelete: "cascade" }),
    periodStart: date("period_start").notNull(),
    leadUserId: uuid("lead_user_id")
      .notNull()
      .references(() => users.id),
    ...timestamps,
  },
  (table) => [uniqueIndex("team_rosters_team_period_idx").on(table.teamId, table.periodStart)],
);

/** Who is on a team for its roster's period. One team per person per period (checked in the app). */
export const teamRosterMembers = pgTable(
  "team_roster_members",
  {
    rosterId: uuid("roster_id")
      .notNull()
      .references(() => teamRosters.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
  },
  (table) => [primaryKey({ columns: [table.rosterId, table.userId] })],
);

/** The days each staff member works, set month by month. A date without a row is a day off. */
export const employeeShiftDays = pgTable(
  "employee_shift_days",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    /** "HH:MM". */
    startTime: text("start_time").notNull(),
    endTime: text("end_time").notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.date] })],
);

/** A staff member's leave request. Its approval steps are fixed when it's filed. */
export const leaveRequests = pgTable("leave_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type", { enum: ["vacation", "sick", "emergency", "other"] }).notNull(),
  startsOn: date("starts_on").notNull(),
  endsOn: date("ends_on").notNull(),
  reason: text("reason").notNull(),
  status: text("status", { enum: ["pending", "approved", "rejected", "cancelled"] })
    .notNull()
    .default("pending"),
  /** e.g. ["team_lead", "admin"]. */
  chain: jsonb("chain").$type<("team_lead" | "admin")[]>().notNull(),
  currentStep: smallint("current_step").notNull().default(0),
  /** The requester's team lead when it was filed. */
  teamLeadId: uuid("team_lead_id").references(() => users.id, { onDelete: "set null" }),
  ...timestamps,
});

/** One approve or reject on one step of a leave request. */
export const leaveDecisions = pgTable(
  "leave_decisions",
  {
    requestId: uuid("request_id")
      .notNull()
      .references(() => leaveRequests.id, { onDelete: "cascade" }),
    step: smallint("step").notNull(),
    approverId: uuid("approver_id")
      .notNull()
      .references(() => users.id),
    decision: text("decision", { enum: ["approved", "rejected"] }).notNull(),
    note: text("note"),
    decidedAt: timestamptz("decided_at").notNull(),
  },
  (table) => [primaryKey({ columns: [table.requestId, table.step] })],
);
