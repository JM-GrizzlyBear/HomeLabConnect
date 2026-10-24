import { describe, expect, it } from "vitest";
import {
  addDays,
  businessDate,
  monthDay,
  weekdayOf,
} from "../../../src/domain/time/businessDate.js";

describe("business dates", () => {
  it("use Philippine time, so late evening UTC is already the next day", () => {
    expect(businessDate(new Date("2026-01-15T15:59:59Z"))).toBe("2026-01-15");
    expect(businessDate(new Date("2026-01-15T16:00:00Z"))).toBe("2026-01-16");
  });

  it("add days across months and years", () => {
    expect(addDays("2026-12-30", 3)).toBe("2027-01-02");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("know the weekday and the month-day", () => {
    expect(weekdayOf("2026-10-04")).toBe(0); // a Sunday
    expect(weekdayOf("2026-10-03")).toBe(6); // a Saturday
    expect(monthDay("2026-12-25")).toBe("12-25");
  });
});
