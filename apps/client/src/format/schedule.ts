import type { ScheduleDay } from "@homelabconnect/shared";
import {
  addDays,
  addMonths,
  endOfMonth,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { formatTime } from "./settings";

const iso = (date: Date) => format(date, "yyyy-MM-dd");

/** The Monday of the week containing `date` ("YYYY-MM-DD"), or of this week. */
export function mondayOf(date?: string): string {
  return iso(startOfWeek(date ? parseISO(date) : new Date(), { weekStartsOn: 1 }));
}

/** The first day of the month containing `date`, or of this month. */
export function monthOf(date?: string): string {
  return iso(startOfMonth(date ? parseISO(date) : new Date()));
}

/** The first day of the month `months` after the month starting `month`. */
export function shiftMonth(month: string, months: number): string {
  return iso(addMonths(parseISO(month), months));
}

/** The last day of the month starting `month`. */
export function monthEnd(month: string): string {
  return iso(endOfMonth(parseISO(month)));
}

/** "YYYY-MM-DD" plus `days`. */
export function shiftDate(date: string, days: number): string {
  return iso(addDays(parseISO(date), days));
}

/** The `count` dates starting on `from`. */
export function datesFrom(from: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => shiftDate(from, i));
}

/** Every date in the month starting `month`. */
export function datesOfMonth(month: string): string[] {
  return datesFrom(month, Number(monthEnd(month).slice(8)));
}

/** "6:00 AM – 2:00 PM", "Day off", "Christmas Day (closed)" or "On leave". */
export function describeDay(day: ScheduleDay): string {
  switch (day.status) {
    case "working":
      return `${formatTime(day.start ?? "")} – ${formatTime(day.end ?? "")}`;
    case "closed":
      return `${day.label ?? "Closed"} (closed)`;
    case "leave":
      return "On leave";
    default:
      return "Day off";
  }
}

/** Short form for the board: "6:00 AM–2:00 PM", "Off", "Closed", "Leave". */
export function describeDayShort(day: ScheduleDay): string {
  switch (day.status) {
    case "working":
      return `${formatTime(day.start ?? "")}–${formatTime(day.end ?? "")}`;
    case "closed":
      return "Closed";
    case "leave":
      return "Leave";
    default:
      return "Off";
  }
}
