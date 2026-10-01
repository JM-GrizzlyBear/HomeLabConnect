import { addDays, businessDate, monthDay, weekdayOf } from "../time/businessDate.js";
import { ClosedDayExists, InvalidClosedDay } from "./settingsErrors.js";
import type { SystemSettings } from "./systemSettings.js";

export type ClosedDayKind = "holiday" | "special_day_off";

/** A date nobody can book, e.g. Christmas or a company outing. */
export interface ClosedDayDetails {
  /** "YYYY-MM-DD". For a yearly one, only the month and day matter. */
  date: string;
  name: string;
  kind: ClosedDayKind;
  /** Closed on this month and day every year (fixed-date holidays like Dec 25). */
  repeatsYearly: boolean;
}

export interface ClosedDay extends ClosedDayDetails {
  id: string;
}

/** True when `closedDay` closes `date`. */
export function closesOn(closedDay: ClosedDayDetails, date: string): boolean {
  return closedDay.repeatsYearly
    ? monthDay(closedDay.date) === monthDay(date)
    : closedDay.date === date;
}

/** Trims the name and checks it's there. */
export function checkClosedDay(input: ClosedDayDetails): ClosedDayDetails {
  const details = { ...input, name: input.name.trim() };
  if (!details.name) throw new InvalidClosedDay("A closed day needs a name.");
  return details;
}

/**
 * Business rule: a date is closed at most once. A yearly closed day covers its
 * month and day in every year, so it clashes with any other entry on that
 * month and day.
 */
export function assertNoClash(
  details: ClosedDayDetails,
  existing: readonly ClosedDay[],
  ownId: string | null,
): void {
  const clash = existing.find(
    (other) =>
      other.id !== ownId &&
      (details.repeatsYearly || other.repeatsYearly
        ? monthDay(other.date) === monthDay(details.date)
        : other.date === details.date),
  );
  if (clash) {
    throw new ClosedDayExists(
      clash.repeatsYearly
        ? `That day is already closed every year (${clash.name}).`
        : `That day is already closed (${clash.name}).`,
    );
  }
}

/**
 * Business rule for booking: the date is an open weekday, isn't a closed day,
 * is at least the minimum notice away, and is inside the booking window.
 * Works on whole business days; M5 checks the exact time slot on top of this.
 */
export function isBookableDate(
  date: string,
  now: Date,
  settings: Pick<SystemSettings, "visitDays" | "minNoticeHours" | "bookingWindowDays">,
  closedDays: readonly ClosedDayDetails[],
): boolean {
  const earliest = businessDate(new Date(now.getTime() + settings.minNoticeHours * 60 * 60_000));
  const latest = addDays(businessDate(now), settings.bookingWindowDays);
  return (
    settings.visitDays.includes(weekdayOf(date)) &&
    !closedDays.some((closedDay) => closesOn(closedDay, date)) &&
    date >= earliest &&
    date <= latest
  );
}
