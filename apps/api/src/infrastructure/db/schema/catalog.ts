import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  integer,
  pgTable,
  primaryKey,
  text,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { timestamps } from "./columns.js";

/** Groups of procedures, e.g. "Hematology". */
export const procedureCategories = pgTable(
  "procedure_categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex("procedure_categories_name_lower_idx").on(sql`lower(${table.name})`)],
);

/** Lab tests patients can book. Deactivated, never deleted. Prices are centavos. */
export const labProcedures = pgTable(
  "lab_procedures",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: text("code").notNull().unique("lab_procedures_code_unique"),
    name: text("name").notNull(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => procedureCategories.id, { onDelete: "restrict" }),
    priceCentavos: integer("price_centavos").notNull(),
    specimen: text("specimen", { enum: ["blood", "urine", "stool", "swab", "other"] }).notNull(),
    turnaroundHours: integer("turnaround_hours").notNull(),
    fastingHours: integer("fasting_hours").notNull().default(0),
    preparation: text("preparation"),
    description: text("description"),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("lab_procedures_name_lower_idx").on(sql`lower(${table.name})`),
    check("lab_procedures_price_positive", sql`${table.priceCentavos} > 0`),
  ],
);

/**
 * Sales on some or all procedures. `value` is a percent or centavos off.
 * The dates are whole days in Philippine time, both included.
 */
export const promotions = pgTable(
  "promotions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    description: text("description"),
    discountType: text("discount_type", { enum: ["percent", "fixed"] }).notNull(),
    value: integer("value").notNull(),
    startsOn: date("starts_on").notNull(),
    /** null: no end date. */
    endsOn: date("ends_on"),
    appliesTo: text("applies_to", { enum: ["all", "selected"] }).notNull(),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("promotions_name_lower_idx").on(sql`lower(${table.name})`),
    check("promotions_value_positive", sql`${table.value} > 0`),
    // Passes for a null end date too: a CHECK only fails on false, not unknown.
    check("promotions_dates_in_order", sql`${table.endsOn} >= ${table.startsOn}`),
  ],
);

/** The procedures a promotion covers when it applies to selected ones only. */
export const promotionProcedures = pgTable(
  "promotion_procedures",
  {
    promotionId: uuid("promotion_id")
      .notNull()
      .references(() => promotions.id, { onDelete: "cascade" }),
    procedureId: uuid("procedure_id")
      .notNull()
      .references(() => labProcedures.id, { onDelete: "restrict" }),
  },
  (table) => [primaryKey({ columns: [table.promotionId, table.procedureId] })],
);
