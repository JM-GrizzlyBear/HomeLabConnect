import { addDays, weekdayOf } from "../time/businessDate.js";
import type { Series } from "./DashboardQueries.js";

/** A whole percentage, 0 when there's nothing to divide by. */
export function percent(part: number, whole: number): number {
  return whole > 0 ? Math.round((part / whole) * 100) : 0;
}

/** The `days` business dates ending `today`, oldest first. */
export function lastDays(today: string, days: number): string[] {
  return Array.from({ length: days }, (_, i) => addDays(today, i - days + 1));
}

/** The values of a series on those dates (0 for a quiet day). */
export function valuesOn(series: Series, dates: readonly string[]): number[] {
  return dates.map((date) => series.get(date) ?? 0);
}

const WEEKDAY_INITIALS = ["S", "M", "T", "W", "Th", "F", "S"];
/** "M", "T", "W", "Th"… for each date. */
export function weekdayInitials(dates: readonly string[]): string[] {
  return dates.map((date) => WEEKDAY_INITIALS[weekdayOf(date)]!);
}

const MONTH_INITIALS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
/** "YYYY-MM" for each month of `year` up to `month` (1–12), with its initial. */
export function monthsOf(year: number, month: number): { key: string; label: string }[] {
  return Array.from({ length: month }, (_, i) => ({
    key: `${year}-${String(i + 1).padStart(2, "0")}`,
    label: MONTH_INITIALS[i]!,
  }));
}

/** The `count` months ending with `year`-`month`, as "YYYY-MM", oldest first. */
export function lastMonths(year: number, month: number, count: number): string[] {
  return Array.from({ length: count }, (_, i) => {
    const index = year * 12 + (month - 1) - (count - 1 - i);
    return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, "0")}`;
  });
}

/** The biggest `keep` slices, with the rest summed as "Others". */
export function topSlices(
  slices: readonly { label: string; value: number }[],
  keep: number,
): { label: string; value: number }[] {
  const sorted = [...slices].sort((a, b) => b.value - a.value);
  const rest = sorted.slice(keep).reduce((sum, slice) => sum + slice.value, 0);
  return rest > 0 ? [...sorted.slice(0, keep), { label: "Others", value: rest }] : sorted;
}

/** "5h", "1.5d" or "—": how long something took on average. */
export function formatHours(hours: number | null): string {
  if (hours === null) return "—";
  if (hours < 48) return `${Math.round(hours)}h`;
  return `${Math.round((hours / 24) * 10) / 10}d`;
}

const pesoFormat = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});
/** 320000 centavos → "₱3,200". */
export function formatPesos(centavos: number): string {
  return pesoFormat.format(Math.round(centavos / 100));
}
