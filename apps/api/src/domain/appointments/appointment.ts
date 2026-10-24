import { AppointmentStatusConflict } from "./appointmentErrors.js";

export type AppointmentStatus =
  "pending" | "confirmed" | "reschedule_proposed" | "rejected" | "cancelled";

export type PaymentStatus = "unpaid";

/** Statuses that hold a place in their time slot. */
export const ACTIVE_STATUSES: readonly AppointmentStatus[] = [
  "pending",
  "confirmed",
  "reschedule_proposed",
];

/** One test on an appointment, with its price as it was when booked. */
export interface AppointmentLine {
  procedureId: string;
  code: string;
  name: string;
  priceCentavos: number;
  promotionId: string | null;
  promotionName: string | null;
  /** What the promotion took off this test. */
  discountCentavos: number;
}

export interface AppointmentEvent {
  at: Date;
  actorName: string | null;
  kind: AppointmentEventKind;
  note: string | null;
}

export type AppointmentEventKind =
  | "booked"
  | "confirmed"
  | "rejected"
  | "cancelled"
  | "reschedule_proposed"
  | "reschedule_accepted"
  | "reschedule_declined";

export interface RescheduleProposal {
  id: string;
  date: string;
  slot: string;
  reason: string;
  proposedBy: string;
}

export interface Appointment {
  id: string;
  /** "HLC-000123". */
  code: string;
  patientId: string;
  patientName: string;
  patientPhone: string | null;
  patientEmail: string;
  /** Business date "YYYY-MM-DD" and slot start "HH:MM", Philippine time. */
  date: string;
  slot: string;
  status: AppointmentStatus;
  address: string;
  landmark: string | null;
  notes: string | null;
  lines: AppointmentLine[];
  subtotalCentavos: number;
  discountCentavos: number;
  totalCentavos: number;
  paymentStatus: PaymentStatus;
  /** Why staff rejected or cancelled it. */
  decisionNote: string | null;
  openProposal: RescheduleProposal | null;
  events: AppointmentEvent[];
  createdAt: Date;
}

/** Totals of a set of lines. */
export function totalsOf(lines: readonly AppointmentLine[]) {
  const subtotalCentavos = lines.reduce((sum, line) => sum + line.priceCentavos, 0);
  const discountCentavos = lines.reduce((sum, line) => sum + line.discountCentavos, 0);
  return { subtotalCentavos, discountCentavos, totalCentavos: subtotalCentavos - discountCentavos };
}

export function formatAppointmentCode(number: number): string {
  return `HLC-${String(number).padStart(6, "0")}`;
}

type Action = "accept" | "reject" | "cancel" | "propose" | "answer_proposal";

/** Which statuses each action may start from. */
const allowedFrom: Record<Action, readonly AppointmentStatus[]> = {
  accept: ["pending"],
  reject: ["pending"],
  cancel: ["pending", "confirmed", "reschedule_proposed"],
  propose: ["pending", "confirmed"],
  answer_proposal: ["reschedule_proposed"],
};

const describe: Record<AppointmentStatus, string> = {
  pending: "waiting for review",
  confirmed: "confirmed",
  reschedule_proposed: "waiting for the patient's answer to a new time",
  rejected: "rejected",
  cancelled: "cancelled",
};

/** Business rule: each action only applies in certain statuses. */
export function assertCan(action: Action, status: AppointmentStatus): void {
  if (!allowedFrom[action].includes(status)) {
    throw new AppointmentStatusConflict(`This appointment is ${describe[status]}.`);
  }
}
