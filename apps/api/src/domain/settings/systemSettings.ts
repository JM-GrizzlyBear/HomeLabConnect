import { isHalfHour, minutesOf } from "../time/clockTime.js";
import { InvalidSettings } from "./settingsErrors.js";

export type BookingApproval = "staff" | "automatic";
export type TeamAssignment = "manual" | "auto";
export const SLOT_LENGTHS = [30, 60, 90] as const;

/** Rules an admin can change without a deploy. Times are "HH:MM", Philippine time. */
export interface SystemSettings {
  /** Weekdays visits happen, 0 = Sunday … 6 = Saturday. */
  visitDays: number[];
  visitStart: string;
  visitEnd: string;
  slotMinutes: number;
  /** How long before a visit it must be booked. */
  minNoticeHours: number;
  /** How far ahead patients can book. */
  bookingWindowDays: number;
  /** Patients can cancel up to this long before the visit. */
  cancelCutoffHours: number;
  visitsPerTeamPerDay: number;
  /** "staff": someone accepts each booking; "automatic": bookings are confirmed straight away. */
  bookingApproval: BookingApproval;
  /** "auto": the team on shift with the fewest visits that day gets it. */
  teamAssignment: TeamAssignment;
}

export const DEFAULT_SETTINGS: SystemSettings = {
  visitDays: [0, 1, 2, 3, 4, 5, 6],
  visitStart: "06:00",
  visitEnd: "12:00",
  slotMinutes: 60,
  minNoticeHours: 24,
  bookingWindowDays: 30,
  cancelCutoffHours: 24,
  visitsPerTeamPerDay: 8,
  bookingApproval: "staff",
  teamAssignment: "manual",
};

const isWholeBetween = (value: number, min: number, max: number) =>
  Number.isInteger(value) && value >= min && value <= max;

const rules: { holds(settings: SystemSettings): boolean; message: string }[] = [
  {
    holds: ({ visitDays }) =>
      visitDays.length > 0 && visitDays.every((day) => isWholeBetween(day, 0, 6)),
    message: "Choose at least one visit day.",
  },
  {
    holds: ({ visitStart, visitEnd }) => isHalfHour(visitStart) && isHalfHour(visitEnd),
    message: "Visit hours are on the hour or half hour.",
  },
  {
    holds: ({ visitStart, visitEnd }) => minutesOf(visitEnd) > minutesOf(visitStart),
    message: "Visits must end after they start.",
  },
  {
    holds: ({ slotMinutes }) => (SLOT_LENGTHS as readonly number[]).includes(slotMinutes),
    message: "A time slot is 30, 60 or 90 minutes.",
  },
  {
    holds: ({ visitStart, visitEnd, slotMinutes }) =>
      minutesOf(visitEnd) - minutesOf(visitStart) >= slotMinutes,
    message: "At least one time slot must fit in the visit hours.",
  },
  {
    holds: ({ bookingWindowDays }) => isWholeBetween(bookingWindowDays, 1, 180),
    message: "Patients can book 1–180 days ahead.",
  },
  {
    holds: ({ minNoticeHours, bookingWindowDays }) =>
      isWholeBetween(minNoticeHours, 0, 168) && minNoticeHours < bookingWindowDays * 24,
    message: "Minimum notice is 0–168 hours and shorter than the booking window.",
  },
  {
    holds: ({ cancelCutoffHours }) => isWholeBetween(cancelCutoffHours, 0, 168),
    message: "The cancellation cut-off is 0–168 hours.",
  },
  {
    holds: ({ visitsPerTeamPerDay }) => isWholeBetween(visitsPerTeamPerDay, 1, 50),
    message: "A team can take 1–50 visits a day.",
  },
];

/** Sorts and de-duplicates the visit days, then applies the rules. Throws on the first broken one. */
export function checkSettings(input: SystemSettings): SystemSettings {
  const settings = { ...input, visitDays: [...new Set(input.visitDays)].sort((a, b) => a - b) };
  const broken = rules.find((rule) => !rule.holds(settings));
  if (broken) throw new InvalidSettings(broken.message);
  return settings;
}
