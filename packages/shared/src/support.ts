import { z } from "zod";
import { appointmentStatusSchema, paymentStatusSchema } from "./appointments.js";

export const ticketCategorySchema = z.enum(["booking", "payment", "results", "account", "other"]);
export const ticketPrioritySchema = z.enum(["low", "normal", "high"]);
/** open: no agent yet · assigned · waiting_on_patient: the agent replied · closed. */
export const ticketStatusSchema = z.enum(["open", "assigned", "waiting_on_patient", "closed"]);

export const TICKET_MESSAGE_MAX_LENGTH = 2000;

const messageText = z
  .string()
  .trim()
  .max(
    TICKET_MESSAGE_MAX_LENGTH,
    `Keep the message under ${TICKET_MESSAGE_MAX_LENGTH} characters.`,
  );

/** The text fields of a new ticket (a multipart form; the first message may carry a "file"). */
export const openTicketFieldsSchema = z.object({
  subject: z
    .string()
    .trim()
    .min(1, "Say what it's about.")
    .max(120, "Keep the subject under 120 characters."),
  category: z.enum(ticketCategorySchema.options, "Choose a category."),
  /** One of the patient's own visits; empty for none. */
  appointmentId: z.union([z.uuid("Not a valid visit."), z.literal("")]).optional(),
  message: messageText.min(1, "Write your message."),
});

/** A chat message (a multipart form): text, a "file", or both. */
export const postMessageFieldsSchema = z.object({ message: messageText.default("") });

export const ticketQueueQuerySchema = z.object({
  scope: z.enum(["mine", "unassigned", "all"]).default("mine"),
  /** "active" is every status but closed. */
  status: z.union([ticketStatusSchema, z.literal("active")]).default("active"),
  category: ticketCategorySchema.optional(),
  priority: ticketPrioritySchema.optional(),
  q: z.string().trim().max(100).optional(),
});

export const ticketIdParamsSchema = z.object({ id: z.uuid("Not a valid id.") });

export const setTicketPriorityRequestSchema = z.object({ priority: ticketPrioritySchema });
export const reassignTicketRequestSchema = z.object({ assigneeId: z.uuid("Choose an agent.") });
export const rateTicketRequestSchema = z.object({
  rating: z.number().int().min(1, "Choose 1 to 5 stars.").max(5, "Choose 1 to 5 stars."),
  comment: z.string().trim().max(500, "Keep the comment under 500 characters.").nullable(),
});

const personSchema = z.object({ id: z.uuid(), name: z.string() });

export const ticketSummarySchema = z.object({
  id: z.uuid(),
  /** "TKT-000012". */
  code: z.string(),
  subject: z.string(),
  category: ticketCategorySchema,
  priority: ticketPrioritySchema,
  status: ticketStatusSchema,
  patient: personSchema,
  assignee: personSchema.nullable(),
  appointment: z.object({ id: z.uuid(), code: z.string() }).nullable(),
  lastMessageAt: z.iso.datetime(),
  /** Messages from others the viewer hasn't seen. */
  unread: z.number().int(),
  createdAt: z.iso.datetime(),
});
export const ticketSummariesSchema = z.array(ticketSummarySchema);

export const ticketMessageSchema = z.object({
  id: z.uuid(),
  author: personSchema,
  /** Written by the patient (the other side is support). */
  fromPatient: z.boolean(),
  body: z.string(),
  attachment: z
    .object({
      filename: z.string(),
      mimeType: z.string(),
      sizeBytes: z.number().int(),
      url: z.string(),
    })
    .nullable(),
  createdAt: z.iso.datetime(),
});

export const ticketDetailSchema = ticketSummarySchema.extend({
  patientContact: z.object({ email: z.string(), phone: z.string().nullable() }),
  closedAt: z.iso.datetime().nullable(),
  rating: z.number().int().nullable(),
  ratingComment: z.string().nullable(),
  /** A closed ticket the patient can still reopen by replying. */
  canReopen: z.boolean(),
  messages: z.array(ticketMessageSchema),
  /** For support only: the linked visit, and the patient's other tickets. */
  context: z
    .object({
      appointment: z
        .object({
          id: z.uuid(),
          code: z.string(),
          date: z.iso.date(),
          slot: z.string(),
          status: appointmentStatusSchema,
          totalCentavos: z.number().int(),
          paymentStatus: paymentStatusSchema,
        })
        .nullable(),
      otherTickets: ticketSummariesSchema,
    })
    .nullable(),
});

export const supportAgentsSchema = z.array(personSchema);

/** What the server pushes over /api/events. */
export const appEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("ticket.message"),
    ticketId: z.uuid(),
    subject: z.string(),
    actorId: z.uuid(),
    actorName: z.string(),
  }),
  z.object({
    type: z.literal("ticket.updated"),
    ticketId: z.uuid(),
    subject: z.string(),
    actorId: z.uuid(),
    change: z.enum(["opened", "assigned", "priority", "closed", "rated"]),
    assigneeId: z.uuid().nullable(),
  }),
]);

export type TicketCategory = z.infer<typeof ticketCategorySchema>;
export type TicketPriority = z.infer<typeof ticketPrioritySchema>;
export type TicketStatus = z.infer<typeof ticketStatusSchema>;
export type TicketQueueQuery = z.infer<typeof ticketQueueQuerySchema>;
export type TicketSummary = z.infer<typeof ticketSummarySchema>;
export type TicketMessage = z.infer<typeof ticketMessageSchema>;
export type TicketDetail = z.infer<typeof ticketDetailSchema>;
export type RateTicketRequest = z.infer<typeof rateTicketRequestSchema>;
export type AppEvent = z.infer<typeof appEventSchema>;
