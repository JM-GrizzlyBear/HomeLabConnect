import { describe, expect, it } from "vitest";
import { InvalidShift } from "../../../../src/domain/scheduling/schedulingErrors.js";
import {
  checkHours,
  checkShiftDates,
  effectiveDay,
  type ScheduleSources,
} from "../../../../src/domain/scheduling/shift.js";

const sources: ScheduleSources = {
  shifts: [
    { date: "2026-10-05", start: "08:00", end: "17:00" },
    { date: "2026-12-25", start: "08:00", end: "12:00" },
  ],
  closedDays: [
    { date: "2025-12-25", name: "Christmas Day", kind: "holiday", repeatsYearly: true },
    { date: "2026-10-09", name: "Company outing", kind: "special_day_off", repeatsYearly: false },
  ],
  leave: [],
};

describe("effectiveDay", () => {
  it("is working on a scheduled day and off on any other", () => {
    expect(effectiveDay("2026-10-05", sources)).toEqual({
      date: "2026-10-05",
      status: "working",
      start: "08:00",
      end: "17:00",
      label: null,
    });
    expect(effectiveDay("2026-10-06", sources).status).toBe("off");
  });

  it("shows a closed day unless someone was scheduled on it on purpose", () => {
    expect(effectiveDay("2026-10-09", sources)).toMatchObject({
      status: "closed",
      label: "Company outing",
    });
    expect(effectiveDay("2026-12-25", sources).status).toBe("working");
  });

  it("shows leave over a scheduled day, keeping the hours it covers", () => {
    const onLeave = effectiveDay("2026-10-05", {
      ...sources,
      leave: [{ startsOn: "2026-10-05", endsOn: "2026-10-07" }],
    });
    expect(onLeave).toMatchObject({ status: "leave", start: "08:00", end: "17:00" });
  });
});

describe("checkHours and checkShiftDates", () => {
  it.each([
    ["off the half hour", { start: "08:15", end: "17:00" }],
    ["ending before it starts", { start: "17:00", end: "08:00" }],
    ["ending when it starts", { start: "08:00", end: "08:00" }],
  ])("refuses hours %s", (_label, hours) => {
    expect(() => checkHours(hours)).toThrow(InvalidShift);
  });

  it("sorts and de-duplicates dates, and refuses none or too many", () => {
    expect(checkShiftDates(["2026-10-07", "2026-10-05", "2026-10-07"])).toEqual([
      "2026-10-05",
      "2026-10-07",
    ]);
    expect(() => checkShiftDates([])).toThrow(InvalidShift);
    const tooMany = Array.from(
      { length: 63 },
      (_, i) => `2026-0${1 + Math.floor(i / 28)}-${String((i % 28) + 1).padStart(2, "0")}`,
    );
    expect(() => checkShiftDates(tooMany)).toThrow(InvalidShift);
  });
});
