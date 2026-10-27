import type { AppointmentStatus, AppointmentView, ClosedReason } from "@homelabconnect/shared";
import { format, parseISO } from "date-fns";
import { formatTime } from "./settings";

export const appointmentStatusLabels: Record<AppointmentStatus, string> = {
  pending: "Waiting for review",
  confirmed: "Confirmed",
  reschedule_proposed: "New time proposed",
  on_the_way: "Team on the way",
  collected: "Samples collected",
  not_collected: "Not collected",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

export const appointmentStatusVariants: Record<
  AppointmentStatus,
  "secondary" | "success" | "destructive" | "outline"
> = {
  pending: "secondary",
  confirmed: "success",
  reschedule_proposed: "outline",
  on_the_way: "secondary",
  collected: "success",
  not_collected: "destructive",
  rejected: "destructive",
  cancelled: "outline",
};

export const closedReasonLabels: Record<ClosedReason, string> = {
  past: "Past",
  too_soon: "Too soon",
  too_far: "Not open yet",
  not_a_visit_day: "No visits",
  closed_day: "Closed",
  no_teams: "No team",
  full: "Full",
};

export const eventLabels: Record<string, string> = {
  booked: "Booked",
  confirmed: "Confirmed",
  rejected: "Rejected",
  cancelled: "Cancelled",
  reschedule_proposed: "New time proposed",
  reschedule_accepted: "New time accepted",
  reschedule_declined: "New time declined",
  team_assigned: "Team assigned",
  team_unassigned: "Team removed",
  on_the_way: "Team on the way",
  collected: "Samples collected",
  not_collected: "Couldn't collect",
  return_scheduled: "Return visit",
  paid: "Paid",
  refunded: "Refunded",
};

/** A Google Maps search for an address, for directions on the phone. */
export function mapsLink(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

/** Tests left to collect on a finished visit: what a return visit would be for. */
export function missedTests(appointment: AppointmentView) {
  if (appointment.status === "not_collected") return appointment.lines;
  if (appointment.status === "collected")
    return appointment.lines.filter((line) => line.collected === false);
  return [];
}

/** "Sat, Jan 17, 2026 · 8:00 AM". */
export function formatVisit(date: string, slot: string): string {
  return `${format(parseISO(date), "EEE, MMM d, yyyy")} · ${formatTime(slot)}`;
}

/** Visits still to come, as opposed to past or closed ones. */
export function isUpcoming(appointment: AppointmentView, today: string): boolean {
  return (
    appointment.date >= today &&
    ["pending", "confirmed", "reschedule_proposed", "on_the_way"].includes(appointment.status)
  );
}
