// Times of day as "HH:MM" (24-hour), e.g. visit hours and shifts.

const HALF_HOUR = /^([01]\d|2[0-3]):(00|30)$/;

/** True for "06:00" or "06:30": schedules use half-hour steps. */
export function isHalfHour(time: string): boolean {
  return HALF_HOUR.test(time);
}

/** "06:30" → 390. */
export function minutesOf(time: string): number {
  const [hours = "0", minutes = "0"] = time.split(":");
  return Number(hours) * 60 + Number(minutes);
}
