import { describe, expect, it } from "vitest";
import {
  assertNoClash,
  type ClosedDay,
  closesOn,
  isBookableDate,
} from "../../../../src/domain/settings/closedDay.js";
import { ClosedDayExists } from "../../../../src/domain/settings/settingsErrors.js";
import { DEFAULT_SETTINGS } from "../../../../src/domain/settings/systemSettings.js";

const christmas: ClosedDay = {
  id: "c",
  date: "2026-12-25",
  name: "Christmas Day",
  kind: "holiday",
  repeatsYearly: true,
};
const outing: ClosedDay = {
  id: "o",
  date: "2026-10-09",
  name: "Company outing",
  kind: "special_day_off",
  repeatsYearly: false,
};

describe("closesOn", () => {
  it("closes a yearly day in every year, and a one-time day only once", () => {
    expect(closesOn(christmas, "2031-12-25")).toBe(true);
    expect(closesOn(outing, "2026-10-09")).toBe(true);
    expect(closesOn(outing, "2027-10-09")).toBe(false);
  });
});

describe("assertNoClash", () => {
  it("refuses a second entry on a date that's already closed", () => {
    expect(() => assertNoClash({ ...outing }, [outing], null)).toThrow(ClosedDayExists);
    expect(() =>
      assertNoClash({ ...outing, date: "2027-12-25", repeatsYearly: false }, [christmas], null),
    ).toThrow("already closed every year");
  });

  it("allows editing an entry in place and different dates", () => {
    expect(() => assertNoClash(outing, [outing], outing.id)).not.toThrow();
    expect(() =>
      assertNoClash({ ...outing, date: "2026-10-10" }, [outing, christmas], null),
    ).not.toThrow();
  });
});

describe("isBookableDate", () => {
  // Thursday 2026-10-01, 10:00 in Manila.
  const now = new Date("2026-10-01T02:00:00Z");
  const settings = { ...DEFAULT_SETTINGS, minNoticeHours: 24, bookingWindowDays: 30 };

  it("allows an open day inside the window", () => {
    expect(isBookableDate("2026-10-05", now, settings, [christmas, outing])).toBe(true);
  });

  it("refuses closed days, yearly ones included", () => {
    expect(isBookableDate("2026-10-09", now, settings, [outing])).toBe(false);
    const lateYear = new Date("2027-12-01T02:00:00Z");
    expect(isBookableDate("2027-12-25", lateYear, settings, [christmas])).toBe(false);
  });

  it("refuses weekdays that aren't visit days", () => {
    const weekdaysOnly = { ...settings, visitDays: [1, 2, 3, 4, 5] };
    expect(isBookableDate("2026-10-04", now, weekdaysOnly, [])).toBe(false); // Sunday
    expect(isBookableDate("2026-10-05", now, weekdaysOnly, [])).toBe(true); // Monday
  });

  it("respects the minimum notice and the booking window", () => {
    expect(isBookableDate("2026-10-01", now, settings, [])).toBe(false); // today
    expect(isBookableDate("2026-10-02", now, settings, [])).toBe(true); // 24h from now
    expect(isBookableDate("2026-10-31", now, settings, [])).toBe(true); // 30 days
    expect(isBookableDate("2026-11-01", now, settings, [])).toBe(false);
  });
});
