import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  jsonb,
  pgTable,
  smallint,
  text,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import type { SystemSettings } from "../../../domain/settings/systemSettings.js";
import { timestamps, timestamptz } from "./columns.js";
import { users } from "./users.js";

/**
 * The one row of system settings (id is always 1). Stored as JSON and merged
 * over the defaults when read, so a setting added later needs no data migration.
 */
export const systemSettings = pgTable(
  "system_settings",
  {
    id: smallint("id").primaryKey().default(1),
    data: jsonb("data").$type<Partial<SystemSettings>>().notNull(),
    updatedBy: uuid("updated_by").references(() => users.id, { onDelete: "set null" }),
    updatedAt: timestamptz("updated_at").notNull().defaultNow(),
  },
  (table) => [check("system_settings_single_row", sql`${table.id} = 1`)],
);

/** Holidays and special days off: nobody can book these dates. */
export const holidays = pgTable(
  "holidays",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** For a yearly one, only the month and day matter. */
    date: date("date").notNull(),
    name: text("name").notNull(),
    kind: text("kind", { enum: ["holiday", "special_day_off"] }).notNull(),
    repeatsYearly: boolean("repeats_yearly").notNull().default(false),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (table) => [uniqueIndex("holidays_date_repeats_idx").on(table.date, table.repeatsYearly)],
);
