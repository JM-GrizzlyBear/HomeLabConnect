import { index, integer, pgTable, text, unique, uuid } from "drizzle-orm/pg-core";
import { appointments } from "./appointments.js";
import { labProcedures } from "./catalog.js";
import { timestamptz } from "./columns.js";
import { users } from "./users.js";

/**
 * A doctor's result for one test of a visit: a private file (PDF or photo) and a comment.
 * A draft until released; patients see released results once the visit is paid.
 */
export const testResults = pgTable(
  "test_results",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    appointmentId: uuid("appointment_id")
      .notNull()
      .references(() => appointments.id, { onDelete: "cascade" }),
    procedureId: uuid("procedure_id")
      .notNull()
      .references(() => labProcedures.id),
    filename: text("filename").notNull(),
    mimeType: text("mime_type", {
      enum: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
    }).notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    /** Where the private file is kept; never a public link. */
    storageKey: text("storage_key").notNull(),
    comment: text("comment"),
    uploadedBy: uuid("uploaded_by")
      .notNull()
      .references(() => users.id),
    uploadedAt: timestamptz("uploaded_at").notNull().defaultNow(),
    releasedBy: uuid("released_by").references(() => users.id),
    releasedAt: timestamptz("released_at"),
  },
  (table) => [
    unique("test_results_appointment_procedure_unique").on(table.appointmentId, table.procedureId),
    index("test_results_appointment_idx").on(table.appointmentId),
  ],
);
