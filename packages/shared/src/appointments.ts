import { z } from "zod";

export const appointmentStatusSchema = z.enum([
  "pending",
  "confirmed",
  "reschedule_proposed",
  "rejected",
  "cancelled",
]);

const slotSchema = z.string().regex(/^\d{2}:\d{2}$/, "Choose a time.");
const reasonSchema = z
  .string()
  .trim()
  .min(3, "Tell the patient why.")
  .max(500, "Keep this under 500 characters.");

/** What a patient sends to book a home visit. */
export const bookAppointmentRequestSchema = z.object({
  procedureIds: z
    .array(z.uuid())
    .min(1, "Choose at least one test.")
    .max(20, "Book at most 20 tests in one visit.")
    .refine((ids) => new Set(ids).size === ids.length, "Each test only once."),
  date: z.iso.date("Choose a date."),
  slot: slotSchema,
  address: z
    .string()
    .trim()
    .min(5, "Enter the address for the visit.")
    .max(300, "Keep the address under 300 characters."),
  landmark: z.string().trim().max(200, "Keep this under 200 characters.").nullable(),
  notes: z.string().trim().max(500, "Keep this under 500 characters.").nullable(),
});

export const closedReasonSchema = z.enum([
  "past",
  "too_soon",
  "too_far",
  "not_a_visit_day",
  "closed_day",
  "no_teams",
  "full",
]);

export const dayAvailabilitySchema = z.object({
  date: z.iso.date(),
  closedReason: closedReasonSchema.nullable(),
  label: z.string().nullable(),
  slots: z.array(z.object({ start: z.string(), left: z.number().int() })),
});

export const availabilitySchema = z.array(dayAvailabilitySchema);

export const appointmentLineSchema = z.object({
  procedureId: z.uuid(),
  code: z.string(),
  name: z.string(),
  priceCentavos: z.number().int(),
  promotionName: z.string().nullable(),
  discountCentavos: z.number().int(),
});

export const quoteSchema = z.object({
  lines: z.array(appointmentLineSchema),
  subtotalCentavos: z.number().int(),
  discountCentavos: z.number().int(),
  totalCentavos: z.number().int(),
});

export const appointmentEventSchema = z.object({
  at: z.iso.datetime(),
  actorName: z.string().nullable(),
  kind: z.string(),
  note: z.string().nullable(),
});

export const appointmentSchema = z.object({
  id: z.uuid(),
  code: z.string(),
  patient: z.object({
    id: z.uuid(),
    name: z.string(),
    email: z.string(),
    phone: z.string().nullable(),
  }),
  date: z.iso.date(),
  slot: z.string(),
  status: appointmentStatusSchema,
  address: z.string(),
  landmark: z.string().nullable(),
  notes: z.string().nullable(),
  lines: z.array(appointmentLineSchema),
  subtotalCentavos: z.number().int(),
  discountCentavos: z.number().int(),
  totalCentavos: z.number().int(),
  paymentStatus: z.enum(["unpaid"]),
  decisionNote: z.string().nullable(),
  proposal: z.object({ date: z.iso.date(), slot: z.string(), reason: z.string() }).nullable(),
  /** Until when the patient may still cancel; null once they can't. */
  cancellableUntil: z.iso.datetime().nullable(),
  events: z.array(appointmentEventSchema),
  createdAt: z.iso.datetime(),
});

export const myAppointmentsSchema = z.array(appointmentSchema);

export const appointmentListSchema = z.object({
  items: z.array(appointmentSchema),
  total: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
});

/** Staff: reject, cancel. */
export const appointmentReasonRequestSchema = z.object({ reason: reasonSchema });
/** A patient cancelling their own visit; the reason is optional. */
export const cancelAppointmentRequestSchema = z.object({
  reason: z.string().trim().max(500, "Keep this under 500 characters.").nullable(),
});
export const proposeTimeRequestSchema = z.object({
  date: z.iso.date("Choose a date."),
  slot: slotSchema,
  reason: reasonSchema,
});

export const appointmentIdParamsSchema = z.object({ id: z.uuid("Not a valid id.") });

/** At most two months of days at a time. */
export const availabilityQuerySchema = z.object({
  from: z.iso.date("Not a valid date."),
  to: z.iso.date("Not a valid date."),
});

/** `?procedureIds=a,b,c`. */
export const quoteQuerySchema = z.object({
  procedureIds: z
    .string()
    .transform((value) => value.split(",").filter(Boolean))
    .pipe(z.array(z.uuid("Not a valid id.")).min(1, "Choose at least one test.").max(20)),
});

export const listAppointmentsQuerySchema = z.object({
  status: appointmentStatusSchema.optional(),
  from: z.iso.date().optional(),
  to: z.iso.date().optional(),
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

/** The patient's answer to a new time. */
export const proposalAnswerRequestSchema = z.object({ accept: z.boolean() });

export type AppointmentStatus = z.infer<typeof appointmentStatusSchema>;
export type BookAppointmentRequest = z.infer<typeof bookAppointmentRequestSchema>;
export type ClosedReason = z.infer<typeof closedReasonSchema>;
export type DayAvailability = z.infer<typeof dayAvailabilitySchema>;
export type AppointmentLineView = z.infer<typeof appointmentLineSchema>;
export type Quote = z.infer<typeof quoteSchema>;
export type AppointmentView = z.infer<typeof appointmentSchema>;
export type AppointmentList = z.infer<typeof appointmentListSchema>;
export type ProposeTimeRequest = z.infer<typeof proposeTimeRequestSchema>;
