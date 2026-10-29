import { and, asc, desc, eq, ilike, inArray, isNull, ne, or, sql, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { formatAppointmentCode } from "../../domain/appointments/appointment.js";
import {
  type AgentWorkload,
  formatTicketCode,
  type Ticket,
  type TicketMessage,
  type TicketStatus,
  type TicketSummary,
} from "../../domain/support/ticket.js";
import type {
  NewMessage,
  NewTicket,
  TicketChanges,
  TicketQueueFilter,
  TicketRepository,
} from "../../domain/support/TicketRepository.js";
import type { Database } from "./client.js";
import { likePattern } from "./likePattern.js";
import {
  appointments,
  chatMessages,
  chatParticipants,
  supportTickets,
  users,
} from "./schema/index.js";

type Executor = Pick<Database, "insert" | "select" | "update">;

const patient = alias(users, "patient");
const assignee = alias(users, "assignee");
const ticketCode = sql`'TKT-' || lpad(${supportTickets.number}::text, 6, '0')`;
const priorityOrder = sql`case ${supportTickets.priority} when 'high' then 0 when 'normal' then 1 else 2 end`;

/** Messages from others in the ticket that `viewerId` hasn't read yet. */
const unreadFor = (viewerId: string) =>
  sql<number>`(
    select count(*) from ${chatMessages}
    where ${chatMessages.ticketId} = ${supportTickets.id}
      and ${chatMessages.authorId} <> ${viewerId}
      and ${chatMessages.seq} > coalesce((
        select ${chatParticipants.lastReadSeq} from ${chatParticipants}
        where ${chatParticipants.ticketId} = ${supportTickets.id}
          and ${chatParticipants.userId} = ${viewerId}
      ), 0)
  )`.mapWith(Number);

const ticketColumns = {
  id: supportTickets.id,
  number: supportTickets.number,
  subject: supportTickets.subject,
  category: supportTickets.category,
  priority: supportTickets.priority,
  status: supportTickets.status,
  closedAt: supportTickets.closedAt,
  rating: supportTickets.rating,
  ratingComment: supportTickets.ratingComment,
  lastMessageAt: supportTickets.lastMessageAt,
  createdAt: supportTickets.createdAt,
  patientId: patient.id,
  patientFirstName: patient.firstName,
  patientLastName: patient.lastName,
  patientEmail: patient.email,
  patientPhone: patient.phone,
  assigneeId: assignee.id,
  assigneeFirstName: assignee.firstName,
  assigneeLastName: assignee.lastName,
  appointmentId: appointments.id,
  appointmentNumber: appointments.number,
};

type TicketRow = {
  [K in keyof typeof ticketColumns]: (typeof ticketColumns)[K]["_"]["data"] | null;
};

function toTicket(row: TicketRow): Ticket {
  return {
    id: row.id!,
    code: formatTicketCode(row.number!),
    patient: {
      id: row.patientId!,
      name: `${row.patientFirstName} ${row.patientLastName}`,
      email: row.patientEmail!,
      phone: row.patientPhone,
    },
    subject: row.subject!,
    category: row.category!,
    priority: row.priority!,
    status: row.status!,
    appointment:
      row.appointmentId && row.appointmentNumber !== null
        ? { id: row.appointmentId, code: formatAppointmentCode(row.appointmentNumber) }
        : null,
    assignee: row.assigneeId
      ? { id: row.assigneeId, name: `${row.assigneeFirstName} ${row.assigneeLastName}` }
      : null,
    closedAt: row.closedAt,
    rating: row.rating,
    ratingComment: row.ratingComment,
    lastMessageAt: row.lastMessageAt!,
    createdAt: row.createdAt!,
  };
}

export class DrizzleTicketRepository implements TicketRepository {
  constructor(private readonly db: Database) {}

  async create(
    ticket: NewTicket,
    firstMessage: Omit<NewMessage, "at" | "authorId">,
  ): Promise<Ticket> {
    const id = await this.db.transaction(async (tx) => {
      const [row] = await tx
        .insert(supportTickets)
        .values({
          patientUserId: ticket.patientId,
          subject: ticket.subject,
          category: ticket.category,
          appointmentId: ticket.appointmentId,
          status: ticket.assigneeId ? "assigned" : "open",
          assignedTo: ticket.assigneeId,
          assignedAt: ticket.assigneeId ? ticket.at : null,
          lastMessageAt: ticket.at,
          createdAt: ticket.at,
          updatedAt: ticket.at,
        })
        .returning({ id: supportTickets.id });
      if (!row) throw new Error("Insert into support_tickets returned no row.");
      await this.insertMessage(tx, row.id, {
        ...firstMessage,
        authorId: ticket.patientId,
        at: ticket.at,
      });
      return row.id;
    });
    return (await this.findById(id))!;
  }

  async findById(id: string): Promise<Ticket | null> {
    const [row] = await this.selectTickets().where(eq(supportTickets.id, id));
    return row ? toTicket(row) : null;
  }

  async listForPatient(patientId: string, viewerId: string): Promise<TicketSummary[]> {
    return await this.summaries(eq(supportTickets.patientUserId, patientId), viewerId, [
      desc(supportTickets.lastMessageAt),
    ]);
  }

  async listQueue(filter: TicketQueueFilter, viewerId: string): Promise<TicketSummary[]> {
    const conditions: (SQL | undefined)[] = [
      filter.scope === "mine" ? eq(supportTickets.assignedTo, viewerId) : undefined,
      filter.scope === "unassigned" ? isNull(supportTickets.assignedTo) : undefined,
      filter.status === "active"
        ? ne(supportTickets.status, "closed")
        : eq(supportTickets.status, filter.status),
      filter.category ? eq(supportTickets.category, filter.category) : undefined,
      filter.priority ? eq(supportTickets.priority, filter.priority) : undefined,
    ];
    if (filter.q) {
      const pattern = likePattern(filter.q);
      conditions.push(
        or(
          ilike(supportTickets.subject, pattern),
          ilike(patient.email, pattern),
          sql`${patient.firstName} || ' ' || ${patient.lastName} ilike ${pattern}`,
          sql`${ticketCode} ilike ${pattern}`,
        ),
      );
    }
    return await this.summaries(
      and(...conditions),
      viewerId,
      [asc(priorityOrder), desc(supportTickets.lastMessageAt)],
      200,
    );
  }

  async messages(ticketId: string): Promise<TicketMessage[]> {
    return await this.loadMessages(eq(chatMessages.ticketId, ticketId));
  }

  async findMessage(id: string): Promise<TicketMessage | null> {
    const [message] = await this.loadMessages(eq(chatMessages.id, id));
    return message ?? null;
  }

  async addMessage(
    ticketId: string,
    message: NewMessage,
    status: TicketStatus,
  ): Promise<TicketMessage> {
    const id = await this.db.transaction(async (tx) => {
      const id = await this.insertMessage(tx, ticketId, message);
      await tx
        .update(supportTickets)
        .set({ status, lastMessageAt: message.at, updatedAt: message.at })
        .where(eq(supportTickets.id, ticketId));
      return id;
    });
    return (await this.findMessage(id))!;
  }

  async update(id: string, changes: TicketChanges, at: Date): Promise<void> {
    const { assigneeId, ...rest } = changes;
    await this.db
      .update(supportTickets)
      .set({
        ...rest,
        ...(assigneeId !== undefined ? { assignedTo: assigneeId, assignedAt: at } : {}),
        updatedAt: at,
      })
      .where(eq(supportTickets.id, id));
  }

  async markRead(ticketId: string, userId: string): Promise<void> {
    const latest = sql<number>`(
      select coalesce(max(${chatMessages.seq}), 0) from ${chatMessages}
      where ${chatMessages.ticketId} = ${ticketId}
    )`;
    await this.db
      .insert(chatParticipants)
      .values({ ticketId, userId, lastReadSeq: latest })
      .onConflictDoUpdate({
        target: [chatParticipants.ticketId, chatParticipants.userId],
        set: { lastReadSeq: latest },
      });
  }

  async workload(agentIds: readonly string[]): Promise<AgentWorkload[]> {
    if (agentIds.length === 0) return [];
    const rows = await this.db
      .select({
        id: supportTickets.assignedTo,
        open: sql<number>`count(*) filter (where ${supportTickets.status} <> 'closed')`.mapWith(
          Number,
        ),
        lastAssignedAt: sql<Date | null>`max(${supportTickets.assignedAt})`.mapWith((value) =>
          value ? new Date(value) : null,
        ),
      })
      .from(supportTickets)
      .where(inArray(supportTickets.assignedTo, [...agentIds]))
      .groupBy(supportTickets.assignedTo);
    return agentIds.map(
      (id) => rows.find((row) => row.id === id) ?? { id, open: 0, lastAssignedAt: null },
    ) as AgentWorkload[];
  }

  private selectTickets() {
    return this.db
      .select(ticketColumns)
      .from(supportTickets)
      .innerJoin(patient, eq(patient.id, supportTickets.patientUserId))
      .leftJoin(assignee, eq(assignee.id, supportTickets.assignedTo))
      .leftJoin(appointments, eq(appointments.id, supportTickets.appointmentId));
  }

  private async summaries(
    where: SQL | undefined,
    viewerId: string,
    orderBy: SQL[],
    limit = 500,
  ): Promise<TicketSummary[]> {
    const rows = await this.db
      .select({ ...ticketColumns, unread: unreadFor(viewerId) })
      .from(supportTickets)
      .innerJoin(patient, eq(patient.id, supportTickets.patientUserId))
      .leftJoin(assignee, eq(assignee.id, supportTickets.assignedTo))
      .leftJoin(appointments, eq(appointments.id, supportTickets.appointmentId))
      .where(where)
      .orderBy(...orderBy)
      .limit(limit);
    return rows.map((row) => ({ ...toTicket(row), unread: row.unread }));
  }

  private async loadMessages(where: SQL): Promise<TicketMessage[]> {
    const rows = await this.db
      .select({
        message: chatMessages,
        authorFirstName: users.firstName,
        authorLastName: users.lastName,
        patientId: supportTickets.patientUserId,
      })
      .from(chatMessages)
      .innerJoin(users, eq(users.id, chatMessages.authorId))
      .innerJoin(supportTickets, eq(supportTickets.id, chatMessages.ticketId))
      .where(where)
      .orderBy(asc(chatMessages.seq));
    return rows.map(({ message, authorFirstName, authorLastName, patientId }) => ({
      id: message.id,
      ticketId: message.ticketId,
      author: { id: message.authorId, name: `${authorFirstName} ${authorLastName}` },
      fromPatient: message.authorId === patientId,
      body: message.body,
      attachment: message.attachmentStorageKey
        ? {
            filename: message.attachmentFilename ?? "file",
            mimeType: message.attachmentMimeType ?? "application/octet-stream",
            sizeBytes: message.attachmentSizeBytes ?? 0,
            storageKey: message.attachmentStorageKey,
          }
        : null,
      createdAt: message.createdAt,
    }));
  }

  /** Saves a message and counts it as read by its author. */
  private async insertMessage(tx: Executor, ticketId: string, message: NewMessage) {
    const [row] = await tx
      .insert(chatMessages)
      .values({
        ticketId,
        authorId: message.authorId,
        body: message.body,
        attachmentFilename: message.attachment?.filename,
        attachmentMimeType: message.attachment?.mimeType,
        attachmentSizeBytes: message.attachment?.sizeBytes,
        attachmentStorageKey: message.attachment?.storageKey,
        createdAt: message.at,
      })
      .returning({ id: chatMessages.id, seq: chatMessages.seq });
    if (!row) throw new Error("Insert into chat_messages returned no row.");
    await tx
      .insert(chatParticipants)
      .values({ ticketId, userId: message.authorId, lastReadSeq: row.seq })
      .onConflictDoUpdate({
        target: [chatParticipants.ticketId, chatParticipants.userId],
        set: { lastReadSeq: row.seq },
      });
    return row.id;
  }
}
