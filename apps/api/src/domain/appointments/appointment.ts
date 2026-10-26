import { AppointmentStatusConflict } from "./appointmentErrors.js";

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "reschedule_proposed"
  | "on_the_way"
  | "collected"
  | "not_collected"
  | "rejected"
  | "cancelled";

export const PAYMENT_STATUSES = ["unpaid", "paid", "partially_refunded", "refunded"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

/** Statuses that hold a place in their time slot (and in their team's day). */
export const PLACE_HOLDING_STATUSES: readonly AppointmentStatus[] = [
  "pending",
  "confirmed",
  "reschedule_proposed",
  "on_the_way",
  "collected",
  "not_collected",
];

/** Statuses a patient may still cancel from (before the cut-off). */
export const CANCELLABLE_STATUSES: readonly AppointmentStatus[] = [
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
  /** Set when the visit is recorded: whether this test's sample was taken. */
  collected: boolean | null;
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
  | "reschedule_declined"
  | "team_assigned"
  | "team_unassigned"
  | "on_the_way"
  | "collected"
  | "not_collected"
  | "return_scheduled"
  | "paid"
  | "refunded";

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
  /** The med team going on the visit. */
  team: { id: string; name: string } | null;
  /** What the med team noted when collecting, or why they couldn't. */
  collectionNote: string | null;
  /** The visit this one returns to, for tests that weren't collected. */
  returnOf: { id: string; code: string } | null;
  /** Return visits scheduled from this one. */
  returnVisits: { id: string; code: string }[];
  /** Its place in the team's route that day; null means "by time". */
  routePosition: number | null;
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

type Action =
  | "accept"
  | "reject"
  | "cancel"
  | "propose"
  | "answer_proposal"
  | "assign_team"
  | "start_visit"
  | "record_visit";

/** Which statuses each action may start from. */
const allowedFrom: Record<Action, readonly AppointmentStatus[]> = {
  accept: ["pending"],
  reject: ["pending"],
  cancel: ["pending", "confirmed", "reschedule_proposed"],
  propose: ["pending", "confirmed"],
  answer_proposal: ["reschedule_proposed"],
  assign_team: ["confirmed"],
  start_visit: ["confirmed"],
  record_visit: ["on_the_way"],
};

const describe: Record<AppointmentStatus, string> = {
  pending: "waiting for review",
  confirmed: "confirmed",
  reschedule_proposed: "waiting for the patient's answer to a new time",
  on_the_way: "in progress: the team is on the way",
  collected: "done: the samples were collected",
  not_collected: "closed: the samples couldn't be collected",
  rejected: "rejected",
  cancelled: "cancelled",
};

/** Business rule: each action only applies in certain statuses. */
export function assertCan(action: Action, status: AppointmentStatus): void {
  if (!allowedFrom[action].includes(status)) {
    throw new AppointmentStatusConflict(`This appointment is ${describe[status]}.`);
  }
}

/**
 * Business rule: a return visit is for the tests whose samples weren't taken. It can follow a
 * visit that wasn't collected at all, or one where some tests were missed.
 */
export function missedTests(appointment: Pick<Appointment, "status" | "lines">): AppointmentLine[] {
  if (appointment.status === "not_collected") return appointment.lines;
  if (appointment.status === "collected") {
    return appointment.lines.filter((line) => line.collected === false);
  }
  return [];
}

/** Business rule: a new route order must list each of the day's visits exactly once. */
export function isSameVisits(current: readonly string[], ordered: readonly string[]): boolean {
  return (
    current.length === ordered.length &&
    new Set(ordered).size === ordered.length &&
    ordered.every((id) => current.includes(id))
  );
}
