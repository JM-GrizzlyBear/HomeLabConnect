import type {
  TicketDetail,
  TicketMessage as TicketMessageView,
  TicketSummary as TicketSummaryView,
} from "@homelabconnect/shared";
import type { TicketDetailOutput } from "../../../application/support/ReadTickets.js";
import type {
  Person,
  Ticket,
  TicketMessage,
  TicketSummary,
} from "../../../domain/support/ticket.js";
import type { HttpResponse } from "../httpTypes.js";

function toSummaryView(ticket: TicketSummary): TicketSummaryView {
  return {
    id: ticket.id,
    code: ticket.code,
    subject: ticket.subject,
    category: ticket.category,
    priority: ticket.priority,
    status: ticket.status,
    patient: { id: ticket.patient.id, name: ticket.patient.name },
    assignee: ticket.assignee,
    appointment: ticket.appointment,
    lastMessageAt: ticket.lastMessageAt.toISOString(),
    unread: ticket.unread,
    createdAt: ticket.createdAt.toISOString(),
  };
}

function toMessageView(message: TicketMessage): TicketMessageView {
  return {
    id: message.id,
    author: message.author,
    fromPatient: message.fromPatient,
    body: message.body,
    attachment: message.attachment && {
      filename: message.attachment.filename,
      mimeType: message.attachment.mimeType,
      sizeBytes: message.attachment.sizeBytes,
      url: `/api/support/messages/${message.id}/attachment`,
    },
    createdAt: message.createdAt.toISOString(),
  };
}

export function presentTickets(tickets: TicketSummary[]): HttpResponse<TicketSummaryView[]> {
  return { status: 200, body: tickets.map(toSummaryView) };
}

export function presentNewTicket(ticket: Ticket): HttpResponse<TicketSummaryView> {
  return { status: 201, body: toSummaryView({ ...ticket, unread: 0 }) };
}

export function presentTicket(ticket: TicketDetailOutput): HttpResponse<TicketDetail> {
  return {
    status: 200,
    body: {
      ...toSummaryView(ticket),
      patientContact: { email: ticket.patient.email, phone: ticket.patient.phone },
      closedAt: ticket.closedAt?.toISOString() ?? null,
      rating: ticket.rating,
      ratingComment: ticket.ratingComment,
      canReopen: ticket.canReopen,
      messages: ticket.messages.map(toMessageView),
      context: ticket.context && {
        appointment: ticket.context.appointment,
        otherTickets: ticket.context.otherTickets.map(toSummaryView),
      },
    },
  };
}

export function presentMessage(message: TicketMessage): HttpResponse<TicketMessageView> {
  return { status: 201, body: toMessageView(message) };
}

export function presentAgents(agents: Person[]): HttpResponse<Person[]> {
  return { status: 200, body: agents };
}
