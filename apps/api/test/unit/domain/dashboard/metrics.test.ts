import { describe, expect, it } from "vitest";
import {
  formatHours,
  formatPesos,
  lastDays,
  lastMonths,
  monthsOf,
  percent,
  topSlices,
  valuesOn,
  weekdayInitials,
} from "../../../../src/domain/dashboard/metrics.js";
import { inGroup } from "../../../../src/domain/audit/auditEntry.js";

describe("dashboard metrics", () => {
  it("rounds percentages and never divides by zero", () => {
    expect(percent(1, 3)).toBe(33);
    expect(percent(0, 0)).toBe(0);
  });

  it("lists the last days, oldest first, with their weekday initials", () => {
    const days = lastDays("2026-01-17", 3);
    expect(days).toEqual(["2026-01-15", "2026-01-16", "2026-01-17"]);
    expect(weekdayInitials(days)).toEqual(["Th", "F", "S"]);
    expect(valuesOn(new Map([["2026-01-16", 4]]), days)).toEqual([0, 4, 0]);
  });

  it("lists months across a new year", () => {
    expect(lastMonths(2026, 2, 3)).toEqual(["2025-12", "2026-01", "2026-02"]);
    expect(monthsOf(2026, 3).map((month) => month.label)).toEqual(["J", "F", "M"]);
  });

  it("keeps the biggest slices and sums the rest", () => {
    const slices = [
      { label: "CBC", value: 1 },
      { label: "Lipid", value: 5 },
      { label: "TSH", value: 2 },
      { label: "Urine", value: 3 },
    ];
    expect(topSlices(slices, 2)).toEqual([
      { label: "Lipid", value: 5 },
      { label: "Urine", value: 3 },
      { label: "Others", value: 3 },
    ]);
  });

  it("formats durations and pesos", () => {
    expect(formatHours(null)).toBe("—");
    expect(formatHours(5.4)).toBe("5h");
    expect(formatHours(60)).toBe("2.5d");
    expect(formatPesos(320_000)).toBe("₱3,200");
  });
});

describe("audit groups", () => {
  it("tells a sign-in from a failed one", () => {
    expect(inGroup("auth.login", "sign_ins")).toBe(true);
    expect(inGroup("auth.login_failed", "sign_ins")).toBe(false);
    expect(inGroup("auth.login_failed", "failed_sign_ins")).toBe(true);
    expect(inGroup("roles.update", "users")).toBe(true);
  });
});
