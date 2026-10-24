import { and, eq, gte, inArray, notExists } from "drizzle-orm";
import { addDays, businessDate, weekdayOf } from "../../domain/time/businessDate.js";
import type { Database } from "./client.js";
import { employeeShiftDays, users } from "./schema/index.js";

/** Usual hours by role, as [weekdays, start, end]. Admins get none. */
const usual: Record<string, [number[], string, string]> = {
  med_team: [[1, 2, 3, 4, 5, 6], "06:00", "14:00"],
  doctor: [[1, 2, 3, 4, 5], "08:00", "17:00"],
  support: [[1, 2, 3, 4, 5, 6], "08:00", "17:00"],
};

/** How many days ahead the seed fills: this month and next, roughly. */
const DAYS_AHEAD = 60;

/**
 * Gives every active staff member with no shifts from today on their usual
 * days for the next two months. People who already have upcoming shifts are
 * left alone. Returns how many people got shifts.
 */
export async function seedShifts(db: Database, now = new Date()): Promise<number> {
  const today = businessDate(now);
  const withoutShifts = await db
    .select({ id: users.id, role: users.roleId })
    .from(users)
    .where(
      and(
        eq(users.isActive, true),
        inArray(users.roleId, Object.keys(usual)),
        notExists(
          db
            .select()
            .from(employeeShiftDays)
            .where(and(eq(employeeShiftDays.userId, users.id), gte(employeeShiftDays.date, today))),
        ),
      ),
    );

  const dates = Array.from({ length: DAYS_AHEAD }, (_, i) => addDays(today, i));
  const rows = withoutShifts.flatMap((person) => {
    const hours = usual[person.role];
    if (!hours) return [];
    const [weekdays, startTime, endTime] = hours;
    return dates
      .filter((date) => weekdays.includes(weekdayOf(date)))
      .map((date) => ({ userId: person.id, date, startTime, endTime }));
  });
  if (rows.length > 0) await db.insert(employeeShiftDays).values(rows).onConflictDoNothing();
  return withoutShifts.length;
}
