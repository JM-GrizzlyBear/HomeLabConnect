import type { LeaveDays, ShiftDay } from "../scheduling/shift.js";
import { effectiveDay } from "../scheduling/shift.js";
import { businessDate, businessTime } from "../time/businessDate.js";
import { TicketClosed } from "./supportErrors.js";

export type TicketCategory = "booking" | "payment" | "results" | "account" | "other";
export type TicketPriority = "low" | "normal" | "high";
/** open: no agent yet · assigned · waiting_on_patient: the agent replied · closed. */
export type TicketStatus = "open" | "assigned" | "waiting_on_patient" | "closed";

export const TICKET_MESSAGE_MAX_LENGTH = 2000;
/** How long after closing a patient's reply still reopens the ticket. */
export const REOPEN_WINDOW_DAYS = 7;

export interface Person {
  id: string;
  name: string;
}

export interface Ticket {
  id: string;
  /** "TKT-000012". */
  code: string;
  patient: Person & { email: string; phone: string | null };
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  appointment: { id: string; code: string } | null;
  assignee: Person | null;
  closedAt: Date | null;
  rating: number | null;
  ratingComment: string | null;
  lastMessageAt: Date;
  createdAt: Date;
}

/** A ticket in a list, with how many messages from others the viewer hasn't read. */
export interface TicketSummary extends Ticket {
  unread: number;
}

export interface MessageAttachment {
  filename: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  author: Person;
  fromPatient: boolean;
  body: string;
  attachment: MessageAttachment | null;
  createdAt: Date;
}

export function formatTicketCode(number: number): string {
  return `TKT-${String(number).padStart(6, "0")}`;
}

/** How the viewer relates to a ticket: its patient, support, or neither (it's hidden). */
export type TicketAccess = "patient" | "agent" | null;

export interface TicketViewer {
  userId: string;
  canViewQueue: boolean;
  canHandle: boolean;
  canClose: boolean;
}

export function ticketAccess(ticket: Ticket, viewer: TicketViewer): TicketAccess {
  if (ticket.patient.id === viewer.userId) return "patient";
  if (ticket.assignee?.id === viewer.userId || viewer.canViewQueue) return "agent";
  return null;
}

/** A closed ticket the patient can reopen by replying, within a week of closing. */
export function canReopen(ticket: Pick<Ticket, "status" | "closedAt">, now: Date): boolean {
  if (ticket.status !== "closed" || !ticket.closedAt) return false;
  return now.getTime() - ticket.closedAt.getTime() <= REOPEN_WINDOW_DAYS * 24 * 60 * 60 * 1000;
}

/**
 * Where a ticket goes when someone writes in it: an agent's reply waits on the patient, and a
 * patient's message (re)opens it for its agent. Agents can't write in a closed ticket; the
 * patient can, within the reopen window.
 */
export function statusAfterMessage(
  ticket: Pick<Ticket, "status" | "closedAt" | "assignee">,
  from: "patient" | "agent",
  now: Date,
): TicketStatus {
  if (ticket.status === "closed" && (from === "agent" || !canReopen(ticket, now))) {
    throw new TicketClosed(
      from === "agent"
        ? "This ticket is closed."
        : "This ticket was closed over a week ago. Open a new ticket instead.",
    );
  }
  if (from === "agent") return "waiting_on_patient";
  return ticket.assignee ? "assigned" : "open";
}

export interface AgentWorkload {
  id: string;
  /** Tickets assigned to them that aren't closed. */
  open: number;
  lastAssignedAt: Date | null;
}

/** The least busy agent: fewest open tickets, then the one who got a ticket longest ago. */
export function pickAgent(agents: readonly AgentWorkload[]): string | null {
  const sorted = [...agents].sort(
    (a, b) =>
      a.open - b.open ||
      (a.lastAssignedAt?.getTime() ?? 0) - (b.lastAssignedAt?.getTime() ?? 0) ||
      a.id.localeCompare(b.id),
  );
  return sorted[0]?.id ?? null;
}

/** On shift right now: a shift today (Philippine time) covering this minute, and not on leave. */
export function isOnShift(
  now: Date,
  sources: { shifts: readonly ShiftDay[]; leave: readonly LeaveDays[] },
): boolean {
  const day = effectiveDay(businessDate(now), { ...sources, closedDays: [] });
  if (day.status !== "working" || !day.start || !day.end) return false;
  const time = businessTime(now);
  return day.start <= time && time < day.end;
}
