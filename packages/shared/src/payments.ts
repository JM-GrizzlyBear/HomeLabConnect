import { z } from "zod";
import { appointmentStatusSchema } from "./appointments.js";

export const paymentProviderSchema = z.enum(["stripe", "cash"]);
export const paymentRecordStatusSchema = z.enum([
  "pending",
  "paid",
  "partially_refunded",
  "refunded",
  "failed",
  "expired",
]);

export const paymentRefundSchema = z.object({
  id: z.uuid(),
  amountCentavos: z.number().int(),
  reason: z.string(),
  createdAt: z.iso.datetime(),
});

export const paymentSchema = z.object({
  id: z.uuid(),
  appointmentId: z.uuid(),
  provider: paymentProviderSchema,
  status: paymentRecordStatusSchema,
  amountCentavos: z.number().int(),
  refundedCentavos: z.number().int(),
  paidAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  refunds: z.array(paymentRefundSchema),
});

/** A payment in the staff and patient lists, with its appointment. */
export const paymentListItemSchema = paymentSchema.extend({
  appointment: z.object({
    code: z.string(),
    date: z.iso.date(),
    status: appointmentStatusSchema,
    patient: z.object({ id: z.uuid(), name: z.string() }),
  }),
  /** Paid, but the visit was cancelled or rejected: an admin should refund it. */
  needsRefund: z.boolean(),
});

export const paymentListSchema = z.object({
  items: z.array(paymentListItemSchema),
  total: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
});

export const myPaymentsSchema = z.array(paymentListItemSchema);

export const appointmentPaymentsSchema = z.object({
  /** Whether patients can pay by card (Stripe is set up). */
  cardEnabled: z.boolean(),
  payments: z.array(paymentSchema),
});

/** Where to send the patient to pay. */
export const checkoutSchema = z.object({ url: z.url() });

const yes = z
  .enum(["true", "false"])
  .optional()
  .transform((value) => value === "true");

/** The filters of All Payments and Refunds; the export takes the same ones without paging. */
export const paymentFiltersSchema = z.object({
  status: paymentRecordStatusSchema.optional(),
  provider: paymentProviderSchema.optional(),
  from: z.iso.date().optional(),
  to: z.iso.date().optional(),
  q: z.string().trim().max(100).optional(),
  needsRefund: yes,
  refundable: yes,
});

export const listPaymentsQuerySchema = paymentFiltersSchema.extend({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const paymentIdParamsSchema = z.object({ id: z.uuid("Not a valid id.") });

export const refundRequestSchema = z.object({
  amountCentavos: z.number().int("Enter whole centavos.").positive("Enter an amount above ₱0."),
  reason: z
    .string()
    .trim()
    .min(3, "Say why you're refunding it.")
    .max(500, "Keep this under 500 characters."),
});

export type PaymentProvider = z.infer<typeof paymentProviderSchema>;
export type PaymentRecordStatus = z.infer<typeof paymentRecordStatusSchema>;
export type PaymentView = z.infer<typeof paymentSchema>;
export type PaymentListItem = z.infer<typeof paymentListItemSchema>;
export type PaymentList = z.infer<typeof paymentListSchema>;
export type AppointmentPayments = z.infer<typeof appointmentPaymentsSchema>;
export type RefundRequest = z.infer<typeof refundRequestSchema>;
export type PaymentFiltersQuery = z.infer<typeof paymentFiltersSchema>;
