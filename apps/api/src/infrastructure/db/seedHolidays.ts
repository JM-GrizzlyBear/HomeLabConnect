import { eq } from "drizzle-orm";
import type { Database } from "./client.js";
import { holidays } from "./schema/index.js";

/**
 * A starting list: the Philippine regular holidays that fall on the same date
 * every year. Admins edit or remove these and add their own (Holy Week and
 * other moving dates are added per year). Existing rows are left alone.
 */
const fixedHolidays: { monthDay: string; name: string }[] = [
  { monthDay: "01-01", name: "New Year's Day" },
  { monthDay: "05-01", name: "Labor Day" },
  { monthDay: "06-12", name: "Independence Day" },
  { monthDay: "11-30", name: "Bonifacio Day" },
  { monthDay: "12-25", name: "Christmas Day" },
  { monthDay: "12-30", name: "Rizal Day" },
];

/**
 * Adds each one whose month and day isn't already closed every year, so a
 * re-seed in a later year doesn't duplicate them. Returns how many were added.
 */
export async function seedHolidays(db: Database, now = new Date()): Promise<number> {
  const year = now.getUTCFullYear();
  const yearly = await db
    .select({ date: holidays.date })
    .from(holidays)
    .where(eq(holidays.repeatsYearly, true));
  const taken = new Set(yearly.map((row) => row.date.slice(5)));
  const missing = fixedHolidays.filter((holiday) => !taken.has(holiday.monthDay));
  if (missing.length === 0) return 0;

  await db.insert(holidays).values(
    missing.map((holiday) => ({
      date: `${year}-${holiday.monthDay}`,
      name: holiday.name,
      kind: "holiday" as const,
      repeatsYearly: true,
    })),
  );
  return missing.length;
}
