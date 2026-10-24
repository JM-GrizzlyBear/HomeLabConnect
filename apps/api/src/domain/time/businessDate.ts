// The business runs on Philippine time (UTC+8, no daylight saving). Calendar
// rules (promotions, closed days, booking windows) use whole days in that zone,
// written as "YYYY-MM-DD" so they compare as plain strings.

const BUSINESS_UTC_OFFSET_MS = 8 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** The business day `now` falls on, as "YYYY-MM-DD". */
export function businessDate(now: Date): string {
  return new Date(now.getTime() + BUSINESS_UTC_OFFSET_MS).toISOString().slice(0, 10);
}

/** "YYYY-MM-DD" plus `days` (may be negative). */
export function addDays(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

/** 0 = Sunday … 6 = Saturday, for a "YYYY-MM-DD" date. */
export function weekdayOf(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

/** The moment a business date and "HH:MM" time happen, e.g. a visit's start. */
export function businessDateTime(date: string, time: string): Date {
  return new Date(Date.parse(`${date}T${time}:00Z`) - BUSINESS_UTC_OFFSET_MS);
}

/** "MM-DD" of a "YYYY-MM-DD" date, for yearly matches. */
export function monthDay(date: string): string {
  return date.slice(5);
}
