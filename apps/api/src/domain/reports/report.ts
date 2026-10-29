import { addDays, weekdayOf } from "../time/businessDate.js";
import { InvalidReportRange } from "./reportErrors.js";

export const REPORT_KINDS = ["revenue", "bookings", "tests"] as const;
export type ReportKind = (typeof REPORT_KINDS)[number];

export const REPORT_PERIODS = ["day", "week", "month"] as const;
export type ReportPeriod = (typeof REPORT_PERIODS)[number];

/** Date ranges a saved report keeps relative (so "This month" is always this month). */
export const REPORT_PRESETS = ["this_month", "last_month", "last_30_days", "this_year"] as const;
export type ReportPreset = (typeof REPORT_PRESETS)[number];

export interface ReportRange {
  /** Business dates "YYYY-MM-DD", inclusive, Philippine time. */
  from: string;
  to: string;
}

export const MAX_REPORT_DAYS = 366;

/** Business rule: a range runs forwards and covers at most a year. */
export function assertRange({ from, to }: ReportRange): void {
  if (from > to) throw new InvalidReportRange("The start date must be on or before the end date.");
  if (addDays(from, MAX_REPORT_DAYS - 1) < to) {
    throw new InvalidReportRange(`Pick at most ${MAX_REPORT_DAYS} days.`);
  }
}

/**
 * The period a date belongs to, named by its first day: the date itself, the Monday of its
 * week, or the 1st of its month.
 */
export function periodKey(date: string, period: ReportPeriod): string {
  if (period === "day") return date;
  if (period === "month") return `${date.slice(0, 7)}-01`;
  return addDays(date, -((weekdayOf(date) + 6) % 7));
}

/** Every period touching the range, in order, so quiet ones still get a row. */
export function periodsBetween({ from, to }: ReportRange, period: ReportPeriod): string[] {
  const keys: string[] = [];
  let key = periodKey(from, period);
  while (key <= to) {
    keys.push(key);
    key = nextPeriod(key, period);
  }
  return keys;
}

function nextPeriod(key: string, period: ReportPeriod): string {
  if (period === "day") return addDays(key, 1);
  if (period === "week") return addDays(key, 7);
  const [year, month] = key.split("-").map(Number) as [number, number];
  return month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, "0")}-01`;
}

/** Whole percent, 0 when there's nothing to divide by. */
export function rate(part: number, whole: number): number {
  return whole > 0 ? Math.round((part / whole) * 100) : 0;
}
