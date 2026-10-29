import type {
  AgentWorkload,
  MessageAttachment,
  Ticket,
  TicketCategory,
  TicketMessage,
  TicketPriority,
  TicketStatus,
  TicketSummary,
} from "./ticket.js";

export interface NewTicket {
  patientId: string;
  subject: string;
  category: TicketCategory;
  appointmentId: string | null;
  assigneeId: string | null;
  at: Date;
}

export interface NewMessage {
  authorId: string;
  body: string;
  attachment: MessageAttachment | null;
  at: Date;
}

export interface TicketQueueFilter {
  scope: "mine" | "unassigned" | "all";
  status: TicketStatus | "active";
  category: TicketCategory | null;
  priority: TicketPriority | null;
  q: string | null;
}

export type TicketChanges = Partial<{
  status: TicketStatus;
  priority: TicketPriority;
  assigneeId: string | null;
  closedAt: Date | null;
  closedBy: string | null;
  rating: number;
  ratingComment: string | null;
}>;

/** Port: support tickets, their chat, and who has read how far. */
export interface TicketRepository {
  /** The ticket with its first message, read by its author. */
  create(ticket: NewTicket, firstMessage: Omit<NewMessage, "at" | "authorId">): Promise<Ticket>;
  findById(id: string): Promise<Ticket | null>;
  /** A patient's tickets, newest activity first; `unread` counts for `viewerId`. */
  listForPatient(patientId: string, viewerId: string): Promise<TicketSummary[]>;
  /** The support queue, high priority first, then newest activity (at most 200). */
  listQueue(filter: TicketQueueFilter, viewerId: string): Promise<TicketSummary[]>;
  /** Oldest first. */
  messages(ticketId: string): Promise<TicketMessage[]>;
  findMessage(id: string): Promise<TicketMessage | null>;
  /** Adds the message (read by its author) and moves the ticket to `status`. */
  addMessage(ticketId: string, message: NewMessage, status: TicketStatus): Promise<TicketMessage>;
  /** Assigning sets when it was assigned too. */
  update(id: string, changes: TicketChanges, at: Date): Promise<void>;
  /** Everything in the ticket so far counts as read by this user. */
  markRead(ticketId: string, userId: string): Promise<void>;
  /** Each agent's open tickets and when they last got one; every agent asked for is included. */
  workload(agentIds: readonly string[]): Promise<AgentWorkload[]>;
}
