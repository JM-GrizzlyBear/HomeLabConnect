import { describe, expect, it } from "vitest";
import {
  assertRange,
  periodKey,
  periodsBetween,
  rate,
} from "../../../../src/domain/reports/report.js";
import { InvalidReportRange } from "../../../../src/domain/reports/reportErrors.js";

describe("report periods", () => {
  it("names a period by its first day; weeks start on Monday", () => {
    expect(periodKey("2026-01-15", "day")).toBe("2026-01-15");
    expect(periodKey("2026-01-15", "week")).toBe("2026-01-12"); // Thursday → Monday
    expect(periodKey("2026-01-18", "week")).toBe("2026-01-12"); // Sunday → the Monday before
    expect(periodKey("2026-01-15", "month")).toBe("2026-01-01");
  });

  it("lists every period touching the range, quiet ones included", () => {
    expect(periodsBetween({ from: "2026-01-30", to: "2026-02-02" }, "day")).toEqual([
      "2026-01-30",
      "2026-01-31",
      "2026-02-01",
      "2026-02-02",
    ]);
    expect(periodsBetween({ from: "2026-01-14", to: "2026-01-27" }, "week")).toEqual([
      "2026-01-12",
      "2026-01-19",
      "2026-01-26",
    ]);
    expect(periodsBetween({ from: "2025-11-20", to: "2026-01-05" }, "month")).toEqual([
      "2025-11-01",
      "2025-12-01",
      "2026-01-01",
    ]);
  });

  it("refuses a backwards range or one over a year", () => {
    expect(() => assertRange({ from: "2026-02-01", to: "2026-01-01" })).toThrow(InvalidReportRange);
    expect(() => assertRange({ from: "2025-01-01", to: "2026-01-02" })).toThrow("366 days");
    expect(() => assertRange({ from: "2025-01-01", to: "2026-01-01" })).not.toThrow();
  });

  it("rounds rates and never divides by zero", () => {
    expect(rate(2, 3)).toBe(67);
    expect(rate(0, 0)).toBe(0);
  });
});
