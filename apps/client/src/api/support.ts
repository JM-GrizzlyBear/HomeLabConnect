import {
  type RateTicketRequest,
  supportAgentsSchema,
  type TicketCategory,
  type TicketDetail,
  ticketDetailSchema,
  type TicketMessage,
  ticketMessageSchema,
  type TicketPriority,
  type TicketQueueQuery,
  type TicketSummary,
  ticketSummariesSchema,
  ticketSummarySchema,
} from "@homelabconnect/shared";
import { apiRequest } from "./apiClient";

export async function fetchMyTickets(signal?: AbortSignal): Promise<TicketSummary[]> {
  return ticketSummariesSchema.parse(await apiRequest("/support/tickets/mine", { signal }));
}

export async function fetchTicketQueue(
  filters: Partial<TicketQueueQuery>,
  signal?: AbortSignal,
): Promise<TicketSummary[]> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  return ticketSummariesSchema.parse(await apiRequest(`/support/tickets?${params}`, { signal }));
}

/** Opening a ticket counts its messages as read. */
export async function fetchTicket(id: string, signal?: AbortSignal): Promise<TicketDetail> {
  return ticketDetailSchema.parse(await apiRequest(`/support/tickets/${id}`, { signal }));
}

export async function openTicket(ticket: {
  subject: string;
  category: TicketCategory;
  appointmentId: string | null;
  message: string;
  file: File | null;
}): Promise<TicketSummary> {
  const form = new FormData();
  form.append("subject", ticket.subject);
  form.append("category", ticket.category);
  if (ticket.appointmentId) form.append("appointmentId", ticket.appointmentId);
  form.append("message", ticket.message);
  if (ticket.file) form.append("file", ticket.file);
  return ticketSummarySchema.parse(
    await apiRequest("/support/tickets", { method: "POST", body: form }),
  );
}

export async function postMessage(
  ticketId: string,
  message: { body: string; file: File | null },
): Promise<TicketMessage> {
  const form = new FormData();
  form.append("message", message.body);
  if (message.file) form.append("file", message.file);
  return ticketMessageSchema.parse(
    await apiRequest(`/support/tickets/${ticketId}/messages`, { method: "POST", body: form }),
  );
}

export async function claimTicket(id: string): Promise<void> {
  await apiRequest(`/support/tickets/${id}/claim`, { method: "POST" });
}

export async function reassignTicket(id: string, assigneeId: string): Promise<void> {
  await apiRequest(`/support/tickets/${id}/assignee`, {
    method: "PATCH",
    body: { assigneeId },
  });
}

export async function setTicketPriority(id: string, priority: TicketPriority): Promise<void> {
  await apiRequest(`/support/tickets/${id}/priority`, { method: "PATCH", body: { priority } });
}

export async function closeTicket(id: string): Promise<void> {
  await apiRequest(`/support/tickets/${id}/close`, { method: "POST" });
}

export async function rateTicket(id: string, rating: RateTicketRequest): Promise<void> {
  await apiRequest(`/support/tickets/${id}/rating`, { method: "POST", body: rating });
}

export async function fetchSupportAgents(signal?: AbortSignal) {
  return supportAgentsSchema.parse(await apiRequest("/support/agents", { signal }));
}
