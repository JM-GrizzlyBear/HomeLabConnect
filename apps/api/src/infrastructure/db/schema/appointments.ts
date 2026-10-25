import {
  boolean,
  date,
  index,
  integer,
  pgTable,
  primaryKey,
  smallint,
  text,
  uuid,
} from "drizzle-orm/pg-core";
import { timestamps, timestamptz } from "./columns.js";
import { labProcedures, promotions } from "./catalog.js";
import { medTeams } from "./scheduling.js";
import { users } from "./users.js";

export const appointmentStatuses = [
  "pending",
  "confirmed",
  "reschedule_proposed",
  "on_the_way",
  "collected",
  "not_collected",
  "rejected",
  "cancelled",
] as const;

/** A home visit a patient booked. Money is centavos, copied from the prices when booked. */
export const appointments = pgTable(
  "appointments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Shown as HLC-000123. */
    number: integer("number").generatedAlwaysAsIdentity().notNull().unique(),
    patientUserId: uuid("patient_user_id")
      .notNull()
      .references(() => users.id),
    visitDate: date("visit_date").notNull(),
    /** "HH:MM", Philippine time. */
    slotStart: text("slot_start").notNull(),
    status: text("status", { enum: appointmentStatuses }).notNull(),
    address: text("address").notNull(),
    landmark: text("landmark"),
    patientNotes: text("patient_notes"),
    subtotalCentavos: integer("subtotal_centavos").notNull(),
    discountCentavos: integer("discount_centavos").notNull(),
    totalCentavos: integer("total_centavos").notNull(),
    paymentStatus: text("payment_status", { enum: ["unpaid"] })
      .notNull()
      .default("unpaid"),
    /** Why staff rejected or cancelled it, shown to the patient. */
    decisionNote: text("decision_note"),
    /** The med team going on the visit. */
    teamId: uuid("team_id").references(() => medTeams.id),
    /** What the team noted when collecting, or why they couldn't. */
    collectionNote: text("collection_note"),
    ...timestamps,
  },
  (table) => [
    index("appointments_visit_idx").on(table.visitDate, table.slotStart, table.status),
    index("appointments_patient_idx").on(table.patientUserId, table.visitDate),
    index("appointments_team_idx").on(table.teamId, table.visitDate),
  ],
);

/** The tests on an appointment, with each price and promotion as they were when booked. */
export const appointmentProcedures = pgTable(
  "appointment_procedures",
  {
    appointmentId: uuid("appointment_id")
      .notNull()
      .references(() => appointments.id, { onDelete: "cascade" }),
    procedureId: uuid("procedure_id")
      .notNull()
      .references(() => labProcedures.id),
    position: smallint("position").notNull(),
    code: text("code").notNull(),
    name: text("name").notNull(),
    priceCentavos: integer("price_centavos").notNull(),
    promotionId: uuid("promotion_id").references(() => promotions.id, { onDelete: "set null" }),
    promotionName: text("promotion_name"),
    discountCentavos: integer("discount_centavos").notNull(),
    /** Set when the visit is recorded: whether this test's sample was taken. */
    collected: boolean("collected"),
  },
  (table) => [primaryKey({ columns: [table.appointmentId, table.procedureId] })],
);

/** A new time staff offered; the patient accepts or declines it. */
export const rescheduleProposals = pgTable(
  "reschedule_proposals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    appointmentId: uuid("appointment_id")
      .notNull()
      .references(() => appointments.id, { onDelete: "cascade" }),
    proposedDate: date("proposed_date").notNull(),
    proposedSlot: text("proposed_slot").notNull(),
    reason: text("reason").notNull(),
    proposedBy: uuid("proposed_by")
      .notNull()
      .references(() => users.id),
    status: text("status", { enum: ["open", "accepted", "declined", "withdrawn"] })
      .notNull()
      .default("open"),
    ...timestamps,
  },
  (table) => [index("reschedule_proposals_appointment_idx").on(table.appointmentId)],
);

/** Everything that happened to an appointment, for its history and the audit trail. */
export const appointmentEvents = pgTable(
  "appointment_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    appointmentId: uuid("appointment_id")
      .notNull()
      .references(() => appointments.id, { onDelete: "cascade" }),
    at: timestamptz("at").notNull().defaultNow(),
    actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
    kind: text("kind").notNull(),
    note: text("note"),
  },
  (table) => [index("appointment_events_appointment_idx").on(table.appointmentId, table.at)],
);
