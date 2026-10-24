import { type ClosedDayDetails, closesOn } from "../settings/closedDay.js";
import { isHalfHour, minutesOf } from "../time/clockTime.js";
import { InvalidShift } from "./schedulingErrors.js";

/** Working hours, "HH:MM" in half-hour steps. */
export interface ShiftHours {
  start: string;
  end: string;
}

/** One working day for one person. A date without one is a day off. */
export interface ShiftDay extends ShiftHours {
  date: string;
}

/** An approved leave's days, both included. */
export interface LeaveDays {
  startsOn: string;
  endsOn: string;
}

export type DayStatus = "working" | "off" | "closed" | "leave";

/** What one person's day actually looks like after leave and closed days. */
export interface ScheduleDay {
  date: string;
  status: DayStatus;
  /** The shift's hours. Kept on leave days too, so it's clear what the leave covers. */
  start: string | null;
  end: string | null;
  /** The closed day's name. */
  label: string | null;
}

/** The most dates one change may cover: a month and a bit. */
export const MAX_SHIFT_DATES = 62;

/** Business rule: hours are on the half hour and end after they start. */
export function checkHours(hours: ShiftHours): ShiftHours {
  if (!isHalfHour(hours.start) || !isHalfHour(hours.end)) {
    throw new InvalidShift("Shifts start and end on the hour or half hour.");
  }
  if (minutesOf(hours.end) <= minutesOf(hours.start)) {
    throw new InvalidShift("A shift must end after it starts.");
  }
  return hours;
}

/** Drops duplicate dates and checks there's a sensible number of them. */
export function checkShiftDates(dates: readonly string[]): string[] {
  const unique = [...new Set(dates)].sort();
  if (unique.length === 0) throw new InvalidShift("Choose at least one day.");
  if (unique.length > MAX_SHIFT_DATES) {
    throw new InvalidShift(`Change at most ${MAX_SHIFT_DATES} days at a time.`);
  }
  return unique;
}

export interface ScheduleSources {
  shifts: readonly ShiftDay[];
  closedDays: readonly (ClosedDayDetails & { name: string })[];
  leave: readonly LeaveDays[];
}

/**
 * One person's day, by priority: approved leave (even on a day they were
 * scheduled), then a scheduled shift (someone can be put to work on a closed
 * day on purpose), then a closed day, otherwise a day off.
 */
export function effectiveDay(date: string, sources: ScheduleSources): ScheduleDay {
  const shift = sources.shifts.find((candidate) => candidate.date === date) ?? null;
  const hours = { start: shift?.start ?? null, end: shift?.end ?? null };

  if (sources.leave.some((leave) => leave.startsOn <= date && date <= leave.endsOn)) {
    return { date, status: "leave", ...hours, label: null };
  }
  if (shift) return { date, status: "working", ...hours, label: null };
  const closed = sources.closedDays.find((closedDay) => closesOn(closedDay, date));
  if (closed) return { date, status: "closed", start: null, end: null, label: closed.name };
  return { date, status: "off", start: null, end: null, label: null };
}
