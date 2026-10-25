import { z } from "zod";

export const appointmentStatusSchema = z.enum([
  "pending",
  "confirmed",
  "reschedule_proposed",
  "on_the_way",
  "collected",
  "not_collected",
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
  /** Set once the visit is recorded: whether this test's sample was taken. */
  collected: z.boolean().nullable(),
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
  team: z.object({ id: z.uuid(), name: z.string() }).nullable(),
  collectionNote: z.string().nullable(),
  returnOf: z.object({ id: z.uuid(), code: z.string() }).nullable(),
  returnVisits: z.array(z.object({ id: z.uuid(), code: z.string() })),
  routePosition: z.number().int().nullable(),
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

/** Give a visit to a team, or take it away (null). */
export const assignTeamRequestSchema = z.object({ teamId: z.uuid().nullable() });

export const teamChoiceSchema = z.object({
  teamId: z.uuid(),
  name: z.string(),
  visitsThatDay: z.number().int(),
  available: z.boolean(),
});
export const teamChoicesSchema = z.array(teamChoiceSchema);

export const myVisitsQuerySchema = z.object({ date: z.iso.date("Not a valid date.") });

/** What the med team records about a visit. */
export const recordVisitRequestSchema = z.discriminatedUnion("outcome", [
  z.object({ outcome: z.literal("on_the_way") }),
  z.object({
    outcome: z.literal("collected"),
    collectedProcedureIds: z.array(z.uuid()).min(1, "Tick at least one test."),
    note: z.string().trim().max(500, "Keep this under 500 characters.").nullable(),
  }),
  z.object({
    outcome: z.literal("not_collected"),
    reason: z
      .string()
      .trim()
      .min(3, "Say why the samples couldn't be collected.")
      .max(500, "Keep this under 500 characters."),
  }),
]);

export const attachmentSchema = z.object({
  id: z.uuid(),
  filename: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number().int(),
  url: z.string(),
  uploadedBy: z.object({ id: z.uuid(), name: z.string() }),
  createdAt: z.iso.datetime(),
});

export const appointmentNoteSchema = z.object({
  id: z.uuid(),
  author: z.object({ id: z.uuid(), name: z.string() }),
  body: z.string(),
  sharedWithPatient: z.boolean(),
  attachments: z.array(attachmentSchema),
  createdAt: z.iso.datetime(),
});
export const appointmentNotesSchema = z.array(appointmentNoteSchema);

/** Sent as a multipart form (a file may come with it), so every field arrives as text. */
export const addNoteRequestSchema = z.object({
  body: z.string().max(2000, "Keep notes under 2000 characters.").default(""),
  sharedWithPatient: z
    .union([z.boolean(), z.enum(["true", "false"])])
    .default(false)
    .transform((value) => value === true || value === "true"),
});

export const attachmentParamsSchema = z.object({
  id: z.uuid("Not a valid id."),
  attachmentId: z.uuid("Not a valid id."),
});

export const returnVisitRequestSchema = z.object({
  date: z.iso.date("Choose a date."),
  slot: slotSchema,
});

export const routeTeamsQuerySchema = z.object({ date: z.iso.date("Not a valid date.") });
export const routeTeamsSchema = z.array(z.object({ id: z.uuid(), name: z.string() }));
export const routeQuerySchema = z.object({
  teamId: z.uuid("Choose a team."),
  date: z.iso.date("Not a valid date."),
});
export const reorderRouteRequestSchema = routeQuerySchema.extend({
  appointmentIds: z.array(z.uuid()).min(1, "The route has no visits."),
});

export type AppointmentStatus = z.infer<typeof appointmentStatusSchema>;
export type AppointmentNoteView = z.infer<typeof appointmentNoteSchema>;
export type RouteTeam = z.infer<typeof routeTeamsSchema>[number];
export type TeamChoice = z.infer<typeof teamChoiceSchema>;
export type RecordVisitRequest = z.infer<typeof recordVisitRequestSchema>;
export type BookAppointmentRequest = z.infer<typeof bookAppointmentRequestSchema>;
export type ClosedReason = z.infer<typeof closedReasonSchema>;
export type DayAvailability = z.infer<typeof dayAvailabilitySchema>;
export type AppointmentLineView = z.infer<typeof appointmentLineSchema>;
export type Quote = z.infer<typeof quoteSchema>;
export type AppointmentView = z.infer<typeof appointmentSchema>;
export type AppointmentList = z.infer<typeof appointmentListSchema>;
export type ProposeTimeRequest = z.infer<typeof proposeTimeRequestSchema>;
