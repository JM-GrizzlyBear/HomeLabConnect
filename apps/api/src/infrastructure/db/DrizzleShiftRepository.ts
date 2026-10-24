import { and, eq, gte, inArray, lte } from "drizzle-orm";
import type { ShiftRepository } from "../../domain/scheduling/ShiftRepository.js";
import type { ShiftDay, ShiftHours } from "../../domain/scheduling/shift.js";
import type { Database } from "./client.js";
import { employeeShiftDays } from "./schema/index.js";

export class DrizzleShiftRepository implements ShiftRepository {
  constructor(private readonly db: Database) {}

  async shiftsFor(
    userIds: readonly string[],
    from: string,
    to: string,
  ): Promise<Map<string, ShiftDay[]>> {
    const grouped = new Map<string, ShiftDay[]>(userIds.map((id) => [id, []]));
    if (userIds.length === 0) return grouped;
    const rows = await this.db
      .select()
      .from(employeeShiftDays)
      .where(
        and(
          inArray(employeeShiftDays.userId, [...userIds]),
          gte(employeeShiftDays.date, from),
          lte(employeeShiftDays.date, to),
        ),
      )
      .orderBy(employeeShiftDays.date);
    for (const row of rows) {
      grouped.get(row.userId)?.push({ date: row.date, start: row.startTime, end: row.endTime });
    }
    return grouped;
  }

  async setDays(userId: string, dates: readonly string[], hours: ShiftHours | null): Promise<void> {
    if (dates.length === 0) return;
    if (!hours) {
      await this.db
        .delete(employeeShiftDays)
        .where(
          and(eq(employeeShiftDays.userId, userId), inArray(employeeShiftDays.date, [...dates])),
        );
      return;
    }
    const times = { startTime: hours.start, endTime: hours.end };
    await this.db
      .insert(employeeShiftDays)
      .values(dates.map((date) => ({ userId, date, ...times })))
      .onConflictDoUpdate({
        target: [employeeShiftDays.userId, employeeShiftDays.date],
        set: times,
      });
  }
}
