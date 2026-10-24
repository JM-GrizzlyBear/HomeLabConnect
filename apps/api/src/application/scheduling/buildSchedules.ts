import { effectiveDay, type ScheduleDay } from "../../domain/scheduling/shift.js";
import { InvalidDateRange } from "../../domain/scheduling/schedulingErrors.js";
import { addDays } from "../../domain/time/businessDate.js";
import type { ClosedDayRepository } from "../../domain/settings/ClosedDayRepository.js";
import type { LeaveRepository } from "../../domain/scheduling/LeaveRepository.js";
import type { ShiftRepository } from "../../domain/scheduling/ShiftRepository.js";

/** The longest range a schedule request may cover. */
export const MAX_SCHEDULE_DAYS = 62;

/** Every date from `from` to `to`, both included. Throws for a backwards or too-long range. */
export function datesBetween(from: string, to: string): string[] {
  if (to < from) throw new InvalidDateRange("The end date can't be before the start.");
  const dates: string[] = [];
  for (let date = from; date <= to; date = addDays(date, 1)) {
    dates.push(date);
    if (dates.length > MAX_SCHEDULE_DAYS) {
      throw new InvalidDateRange(`Ask for at most ${MAX_SCHEDULE_DAYS} days at a time.`);
    }
  }
  return dates;
}

export interface ScheduleRepositories {
  shifts: ShiftRepository;
  closedDays: ClosedDayRepository;
  leave: LeaveRepository;
}

/** Shared by My Schedule and the shift board: each person's effective days in a range. */
export async function buildSchedules(
  userIds: readonly string[],
  from: string,
  to: string,
  { shifts, closedDays, leave }: ScheduleRepositories,
): Promise<Map<string, ScheduleDay[]>> {
  const dates = datesBetween(from, to);
  const [scheduled, closed, approved] = await Promise.all([
    shifts.shiftsFor(userIds, from, to),
    closedDays.list(),
    leave.approvedDays(userIds, from, to),
  ]);
  return new Map(
    userIds.map((userId) => [
      userId,
      dates.map((date) =>
        effectiveDay(date, {
          shifts: scheduled.get(userId) ?? [],
          closedDays: closed,
          leave: approved.get(userId) ?? [],
        }),
      ),
    ]),
  );
}
