import { type ClosedDayDetails, closesOn } from "../settings/closedDay.js";
import type { SystemSettings } from "../settings/systemSettings.js";
import { addDays, businessDate, businessDateTime, weekdayOf } from "../time/businessDate.js";
import { minutesOf } from "../time/clockTime.js";
import { SlotNotBookable } from "./appointmentErrors.js";

export type BookingSettings = Pick<
  SystemSettings,
  | "visitDays"
  | "visitStart"
  | "visitEnd"
  | "slotMinutes"
  | "minNoticeHours"
  | "bookingWindowDays"
  | "visitsPerTeamPerDay"
>;

/** Why a whole day can't be booked. */
export type ClosedReason =
  "past" | "too_soon" | "too_far" | "not_a_visit_day" | "closed_day" | "no_teams" | "full";

export interface SlotAvailability {
  /** "HH:MM". */
  start: string;
  /** Places still free (0 when full or too soon). */
  left: number;
}

export interface DayAvailability {
  date: string;
  /** null when at least one slot is free. */
  closedReason: ClosedReason | null;
  /** The holiday's name, for closed days. */
  label: string | null;
  slots: SlotAvailability[];
}

/** Visits already booked that day: per slot start, and in total. */
export interface DayBookings {
  bySlot: ReadonlyMap<string, number>;
  total: number;
}

const toTime = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

/** Every slot start between the visit hours, e.g. 06:00, 07:00 … 11:00 for 06:00–12:00 in hours. */
export function slotStarts(
  settings: Pick<BookingSettings, "visitStart" | "visitEnd" | "slotMinutes">,
): string[] {
  const starts: string[] = [];
  const end = minutesOf(settings.visitEnd);
  for (
    let at = minutesOf(settings.visitStart);
    at + settings.slotMinutes <= end;
    at += settings.slotMinutes
  ) {
    starts.push(toTime(at));
  }
  return starts;
}

/** Whole-day rules that don't depend on bookings, in the order a patient would hit them. */
function dayClosedReason(
  date: string,
  now: Date,
  settings: BookingSettings,
  closedDays: readonly ClosedDayDetails[],
): { reason: ClosedReason; label: string | null } | null {
  if (date < businessDate(now)) return { reason: "past", label: null };
  if (date > addDays(businessDate(now), settings.bookingWindowDays))
    return { reason: "too_far", label: null };
  if (!settings.visitDays.includes(weekdayOf(date)))
    return { reason: "not_a_visit_day", label: null };
  const closed = closedDays.find((closedDay) => closesOn(closedDay, date));
  if (closed) return { reason: "closed_day", label: closed.name };
  return null;
}

/** A slot is far enough ahead when it starts at least the minimum notice from now. */
function hasNotice(date: string, slot: string, now: Date, settings: BookingSettings): boolean {
  return (
    businessDateTime(date, slot).getTime() >= now.getTime() + settings.minNoticeHours * 60 * 60_000
  );
}

/**
 * Business rule: what a patient can book on one day. Each team on duty takes one visit per
 * slot, and at most `visitsPerTeamPerDay` visits in the day.
 */
export function dayAvailability(
  date: string,
  now: Date,
  settings: BookingSettings,
  closedDays: readonly ClosedDayDetails[],
  teamsOnDuty: number,
  bookings: DayBookings,
): DayAvailability {
  const closed = dayClosedReason(date, now, settings, closedDays);
  if (closed) return { date, closedReason: closed.reason, label: closed.label, slots: [] };
  const starts = slotStarts(settings);
  if (!starts.some((start) => hasNotice(date, start, now, settings))) {
    return { date, closedReason: "too_soon", label: null, slots: [] };
  }
  if (teamsOnDuty === 0) return { date, closedReason: "no_teams", label: null, slots: [] };
  const dayLeft = Math.max(0, teamsOnDuty * settings.visitsPerTeamPerDay - bookings.total);
  const slots = starts.map((start) => ({
    start,
    left: hasNotice(date, start, now, settings)
      ? Math.min(dayLeft, Math.max(0, teamsOnDuty - (bookings.bySlot.get(start) ?? 0)))
      : 0,
  }));
  const anyFree = slots.some((slot) => slot.left > 0);
  return { date, closedReason: anyFree ? null : "full", label: null, slots };
}

const closedMessages: Record<ClosedReason, string> = {
  past: "That date has passed.",
  too_soon: "That date is too soon to book.",
  too_far: "That date is too far ahead to book yet.",
  not_a_visit_day: "There are no home visits on that day.",
  closed_day: "We're closed on that day.",
  no_teams: "No team is available that day.",
  full: "That day is fully booked.",
};

/**
 * Business rule for a booking request: the date can be booked and `slot` is one of its
 * slot starts with enough notice. Capacity is checked separately, when the booking is saved.
 */
export function assertBookableSlot(
  date: string,
  slot: string,
  now: Date,
  settings: BookingSettings,
  closedDays: readonly ClosedDayDetails[],
): void {
  const closed = dayClosedReason(date, now, settings, closedDays);
  if (closed) throw new SlotNotBookable(closedMessages[closed.reason]);
  if (!slotStarts(settings).includes(slot)) {
    throw new SlotNotBookable("Pick one of the listed visit times.");
  }
  if (!hasNotice(date, slot, now, settings)) {
    throw new SlotNotBookable(`Please book at least ${settings.minNoticeHours} hours ahead.`);
  }
}

/** The limits a booking must stay within when it's saved. */
export function capacityOf(
  teamsOnDuty: number,
  settings: Pick<BookingSettings, "visitsPerTeamPerDay">,
) {
  return { perSlot: teamsOnDuty, perDay: teamsOnDuty * settings.visitsPerTeamPerDay };
}
