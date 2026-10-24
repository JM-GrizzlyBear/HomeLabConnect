import type { ShiftDay, ShiftHours } from "./shift.js";

/** Port: the days each staff member works, and the hours. */
export interface ShiftRepository {
  /** Shifts from `from` to `to` (inclusive), by user id; everyone asked for gets a list. */
  shiftsFor(userIds: readonly string[], from: string, to: string): Promise<Map<string, ShiftDay[]>>;
  /** Puts the person to work on each date with these hours, or takes them off with null. */
  setDays(userId: string, dates: readonly string[], hours: ShiftHours | null): Promise<void>;
}
