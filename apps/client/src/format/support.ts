import type { TicketCategory, TicketPriority, TicketStatus } from "@homelabconnect/shared";

type Variant = "secondary" | "success" | "warning" | "destructive" | "outline" | "muted";

export const ticketCategoryLabels: Record<TicketCategory, string> = {
  booking: "Booking",
  payment: "Payment",
  results: "Results",
  account: "Account",
  other: "Other",
};

export const ticketPriorityLabels: Record<TicketPriority, string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
};

export const ticketPriorityVariants: Record<TicketPriority, Variant> = {
  low: "muted",
  normal: "outline",
  high: "destructive",
};

/** How support sees a ticket's status. */
export const ticketStatusLabels: Record<TicketStatus, string> = {
  open: "Unassigned",
  assigned: "Assigned",
  waiting_on_patient: "Waiting on patient",
  closed: "Closed",
};

/** How the patient sees it: whose turn it is. */
export const patientTicketStatusLabels: Record<TicketStatus, string> = {
  open: "Waiting for support",
  assigned: "Waiting for support",
  waiting_on_patient: "Support replied",
  closed: "Closed",
};

export const ticketStatusVariants: Record<TicketStatus, Variant> = {
  open: "warning",
  assigned: "secondary",
  waiting_on_patient: "success",
  closed: "muted",
};
