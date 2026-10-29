import {
  bigint,
  index,
  integer,
  pgTable,
  primaryKey,
  smallint,
  text,
  uuid,
} from "drizzle-orm/pg-core";
import { appointments } from "./appointments.js";
import { timestamps, timestamptz } from "./columns.js";
import { users } from "./users.js";

/** A patient's request for help, and where it stands. Its chat is in chat_messages. */
export const supportTickets = pgTable(
  "support_tickets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Shown as TKT-000012. */
    number: integer("number").generatedAlwaysAsIdentity().notNull().unique(),
    patientUserId: uuid("patient_user_id")
      .notNull()
      .references(() => users.id),
    subject: text("subject").notNull(),
    category: text("category", {
      enum: ["booking", "payment", "results", "account", "other"],
    }).notNull(),
    priority: text("priority", { enum: ["low", "normal", "high"] })
      .notNull()
      .default("normal"),
    status: text("status", { enum: ["open", "assigned", "waiting_on_patient", "closed"] })
      .notNull()
      .default("open"),
    /** The visit it's about, if any. */
    appointmentId: uuid("appointment_id").references(() => appointments.id, {
      onDelete: "set null",
    }),
    assignedTo: uuid("assigned_to").references(() => users.id),
    assignedAt: timestamptz("assigned_at"),
    closedAt: timestamptz("closed_at"),
    closedBy: uuid("closed_by").references(() => users.id),
    /** 1–5, given by the patient once it's closed. */
    rating: smallint("rating"),
    ratingComment: text("rating_comment"),
    lastMessageAt: timestamptz("last_message_at").notNull(),
    ...timestamps,
  },
  (table) => [
    index("support_tickets_status_assignee_idx").on(table.status, table.assignedTo),
    index("support_tickets_patient_idx").on(table.patientUserId, table.createdAt),
  ],
);

/** One message in a ticket's chat: text, a private file (PDF or photo), or both. */
export const chatMessages = pgTable(
  "chat_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Keeps messages in the order they were written, even within the same millisecond. */
    seq: bigint("seq", { mode: "number" }).generatedAlwaysAsIdentity().notNull(),
    ticketId: uuid("ticket_id")
      .notNull()
      .references(() => supportTickets.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id),
    body: text("body").notNull(),
    attachmentFilename: text("attachment_filename"),
    attachmentMimeType: text("attachment_mime_type"),
    attachmentSizeBytes: integer("attachment_size_bytes"),
    attachmentStorageKey: text("attachment_storage_key"),
    createdAt: timestamptz("created_at").notNull(),
  },
  (table) => [index("chat_messages_ticket_idx").on(table.ticketId, table.seq)],
);

/** How far each person has read a ticket's chat (by message seq), for unread counts. */
export const chatParticipants = pgTable(
  "chat_participants",
  {
    ticketId: uuid("ticket_id")
      .notNull()
      .references(() => supportTickets.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    lastReadSeq: bigint("last_read_seq", { mode: "number" }).notNull().default(0),
  },
  (table) => [primaryKey({ columns: [table.ticketId, table.userId] })],
);
