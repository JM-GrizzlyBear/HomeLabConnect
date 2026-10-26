import { index, integer, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { appointments } from "./appointments.js";
import { timestamps, timestamptz } from "./columns.js";
import { users } from "./users.js";

/** Money taken for an appointment: a Stripe card checkout or cash at the visit. Centavos. */
export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    appointmentId: uuid("appointment_id")
      .notNull()
      .references(() => appointments.id),
    provider: text("provider", { enum: ["stripe", "cash"] }).notNull(),
    status: text("status", {
      enum: ["pending", "paid", "partially_refunded", "refunded", "failed", "expired"],
    }).notNull(),
    amountCentavos: integer("amount_centavos").notNull(),
    refundedCentavos: integer("refunded_centavos").notNull().default(0),
    /** Stripe's checkout session id; null for cash. */
    providerReference: text("provider_reference").unique(),
    /** Where the patient pays, while the checkout is open. */
    checkoutUrl: text("checkout_url"),
    /** Who took a cash payment. */
    recordedBy: uuid("recorded_by").references(() => users.id),
    paidAt: timestamptz("paid_at"),
    ...timestamps,
  },
  (table) => [
    index("payments_appointment_idx").on(table.appointmentId),
    index("payments_created_idx").on(table.createdAt),
  ],
);

/** Money given back: through Stripe for card payments, by hand for cash. */
export const paymentRefunds = pgTable(
  "payment_refunds",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    paymentId: uuid("payment_id")
      .notNull()
      .references(() => payments.id, { onDelete: "cascade" }),
    amountCentavos: integer("amount_centavos").notNull(),
    reason: text("reason").notNull(),
    refundedBy: uuid("refunded_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
  },
  (table) => [index("payment_refunds_payment_idx").on(table.paymentId)],
);

/** Stripe events already handled, so a repeated delivery changes nothing. */
export const paymentWebhookEvents = pgTable("payment_webhook_events", {
  eventId: text("event_id").primaryKey(),
  receivedAt: timestamptz("received_at").notNull().defaultNow(),
});
