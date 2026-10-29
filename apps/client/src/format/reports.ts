import type { ReportKind, ReportPeriod, ReportPreset } from "@homelabconnect/shared";
import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  parseISO,
  startOfMonth,
  startOfYear,
  subMonths,
} from "date-fns";

export const reportKindLabels: Record<ReportKind, string> = {
  revenue: "Revenue",
  bookings: "Bookings & visits",
  tests: "Tests",
};

export const reportPeriodLabels: Record<ReportPeriod, string> = {
  day: "Day",
  week: "Week",
  month: "Month",
};

export const reportPresetLabels: Record<ReportPreset, string> = {
  this_month: "This month",
  last_month: "Last month",
  last_30_days: "Last 30 days",
  this_year: "This year",
};

const iso = (date: Date) => format(date, "yyyy-MM-dd");

/** The dates a preset means today (so a saved "This month" always means this month). */
export function presetRange(
  preset: ReportPreset,
  today = new Date(),
): { from: string; to: string } {
  switch (preset) {
    case "this_month":
      return { from: iso(startOfMonth(today)), to: iso(today) };
    case "last_month": {
      const last = subMonths(today, 1);
      return { from: iso(startOfMonth(last)), to: iso(endOfMonth(last)) };
    }
    case "last_30_days":
      return { from: iso(addDays(today, -29)), to: iso(today) };
    case "this_year":
      return { from: iso(startOfYear(today)), to: iso(today) };
  }
}

/** A row's period, named the way people say it: "Jan 15", "Jan 12 – 18", "January 2026". */
export function periodLabel(start: string, period: ReportPeriod): string {
  const date = parseISO(start);
  if (period === "day") return format(date, "EEE, MMM d");
  if (period === "month") return format(date, "MMMM yyyy");
  const end = endOfWeek(date, { weekStartsOn: 1 });
  return `${format(date, "MMM d")} – ${format(end, date.getMonth() === end.getMonth() ? "d" : "MMM d")}`;
}

/** The short label under a bar: the day of the month (days, weeks) or the month. */
export function barLabel(start: string, period: ReportPeriod): string {
  const date = parseISO(start);
  if (period === "month") return format(date, "MMM");
  return format(date, "d");
}
