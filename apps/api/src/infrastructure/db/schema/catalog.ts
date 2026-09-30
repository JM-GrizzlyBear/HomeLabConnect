import { sql } from "drizzle-orm";
import { boolean, check, integer, pgTable, text, uniqueIndex, uuid } from "drizzle-orm/pg-core";
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
