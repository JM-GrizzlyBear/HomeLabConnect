import type { ClosedDayKind } from "@homelabconnect/shared";

/** Weekdays in the order people read a week, Monday first. 0 = Sunday. */
export const weekdays = [
  { value: 1, short: "Mon", label: "Monday" },
  { value: 2, short: "Tue", label: "Tuesday" },
  { value: 3, short: "Wed", label: "Wednesday" },
  { value: 4, short: "Thu", label: "Thursday" },
  { value: 5, short: "Fri", label: "Friday" },
  { value: 6, short: "Sat", label: "Saturday" },
  { value: 0, short: "Sun", label: "Sunday" },
];

/** "06:30" → "6:30 AM". */
export function formatTime(time: string): string {
  const [hours = 0, minutes = 0] = time.split(":").map(Number);
  const suffix = hours < 12 ? "AM" : "PM";
  return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

/** Half-hour choices from 5:00 AM to 8:00 PM, for visit hours. */
export const timeOptions = Array.from({ length: 31 }, (_, i) => {
  const minutes = 5 * 60 + i * 30;
  const value = `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
  return { value, label: formatTime(value) };
});

export const closedDayKindLabels: Record<ClosedDayKind, string> = {
  holiday: "Holiday",
  special_day_off: "Special day off",
};
