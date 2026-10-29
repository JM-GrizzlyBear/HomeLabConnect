/** What a patient hears about their visit (the same moments as their emails). */
export type PatientNoticeKind =
  | "received"
  | "confirmed"
  | "rejected"
  | "new_time_proposed"
  | "cancelled"
  | "payment_received"
  | "payment_refunded"
  | "results_ready"
  | "results_ready_unpaid";

/** What staff hear about: work waiting for them, or a change to their work. */
export type StaffNoticeKind =
  | "booking_pending"
  | "visit_assigned"
  | "visit_changed"
  | "visit_cancelled"
  | "results_to_review"
  | "leave_to_decide"
  | "leave_decided"
  | "refund_needed";

export type NotificationKind = PatientNoticeKind | StaffNoticeKind;

/** One line in someone's bell. */
export interface Notification {
  id: string;
  userId: string;
  kind: NotificationKind;
  title: string;
  body: string;
  /** The page it's about, e.g. "/app/appointments/<id>". */
  link: string;
  readAt: Date | null;
  createdAt: Date;
}

/** A notification before it's saved: what to say, and where it leads. */
export type Notice = Pick<Notification, "kind" | "title" | "body" | "link">;

/** The visit a notice is about. */
export interface VisitRef {
  id: string;
  code: string;
  /** Business date "YYYY-MM-DD" and slot "HH:MM", Philippine time. */
  date: string;
  slot: string;
}

const dayFormat = new Intl.DateTimeFormat("en-PH", {
  weekday: "short",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

/** "Sat, Jan 17 at 8:00 AM". */
export function visitWhen(date: string, slot: string): string {
  const [hours = 0, minutes = 0] = slot.split(":").map(Number);
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  const time = `${hour12}:${String(minutes).padStart(2, "0")} ${hours < 12 ? "AM" : "PM"}`;
  return `${dayFormat.format(new Date(`${date}T00:00:00Z`))} at ${time}`;
}

const VISIT_TEXT: Record<
  PatientNoticeKind | Exclude<StaffNoticeKind, "leave_to_decide" | "leave_decided">,
  (code: string, when: string) => { title: string; body: string }
> = {
  received: (code, when) => ({
    title: `Booking ${code} received`,
    body: `We'll confirm your visit on ${when} soon.`,
  }),
  confirmed: (code, when) => ({
    title: `Visit ${code} confirmed`,
    body: `Our team will see you on ${when}.`,
  }),
  rejected: (code) => ({
    title: `Booking ${code} wasn't accepted`,
    body: "Open it to see why.",
  }),
  new_time_proposed: (code) => ({
    title: `A new time for ${code}`,
    body: "Open it to accept or decline the time we proposed.",
  }),
  cancelled: (code, when) => ({
    title: `Visit ${code} cancelled`,
    body: `Your visit on ${when} won't go ahead.`,
  }),
  payment_received: (code) => ({ title: `Payment received for ${code}`, body: "Thank you!" }),
  payment_refunded: (code) => ({
    title: `Refund for ${code}`,
    body: "Open it to see the amount.",
  }),
  results_ready: (code) => ({
    title: `Results ready for ${code}`,
    body: "Open My Results to view them.",
  }),
  results_ready_unpaid: (code) => ({
    title: `Results ready for ${code}`,
    body: "Pay for the visit to view them.",
  }),
  booking_pending: (code, when) => ({
    title: `New booking ${code}`,
    body: `For ${when}. Accept or reject it.`,
  }),
  visit_assigned: (code, when) => ({
    title: `Visit ${code} assigned to your team`,
    body: `On ${when}.`,
  }),
  visit_changed: (code, when) => ({
    title: `Visit ${code} moved`,
    body: `It's now on ${when}.`,
  }),
  visit_cancelled: (code, when) => ({
    title: `Visit ${code} cancelled`,
    body: `The visit on ${when} won't go ahead.`,
  }),
  results_to_review: (code) => ({
    title: `Samples collected for ${code}`,
    body: "Upload and release the results.",
  }),
  refund_needed: (code) => ({
    title: `Refund needed for ${code}`,
    body: "It was paid but won't go ahead (or was paid twice).",
  }),
};

/** What to say about a visit, for the patient or for staff. */
export function visitNotice(
  kind: keyof typeof VISIT_TEXT,
  visit: VisitRef,
  link = `/app/appointments/${visit.id}`,
): Notice {
  return { kind, ...VISIT_TEXT[kind](visit.code, visitWhen(visit.date, visit.slot)), link };
}

/** What to say about a leave request: to its approver, or to its requester once decided. */
export function leaveNotice(
  kind: "leave_to_decide" | "leave_decided",
  leave: { requesterName: string; startsOn: string; endsOn: string; status: string },
): Notice {
  const days =
    leave.startsOn === leave.endsOn ? leave.startsOn : `${leave.startsOn} to ${leave.endsOn}`;
  if (kind === "leave_to_decide") {
    return {
      kind,
      title: `Leave request from ${leave.requesterName}`,
      body: `${days}. Approve or reject it.`,
      link: "/app/scheduling/leave",
    };
  }
  return {
    kind,
    title: `Your leave was ${leave.status}`,
    body: days,
    link: "/app/scheduling/my-leave",
  };
}
