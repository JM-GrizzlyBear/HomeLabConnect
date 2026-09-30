import { describe, expect, it } from "vitest";
import {
  centavosToPesos,
  formatFasting,
  formatPeso,
  formatTurnaround,
  pesosToCentavos,
} from "../../src/format/catalog";

describe("money", () => {
  it("formats centavos as pesos", () => {
    expect(formatPeso(35_000)).toBe("₱350.00");
    expect(formatPeso(450_050)).toBe("₱4,500.50");
    expect(centavosToPesos(180_000)).toBe("1800.00");
  });

  it.each([
    ["850", 85_000],
    ["850.5", 85_050],
    ["850.05", 85_005],
    ["₱1,250.00", 125_000],
    [" 0.99 ", 99],
  ])("reads %s as %i centavos", (text, centavos) => {
    expect(pesosToCentavos(text)).toBe(centavos);
  });

  it.each(["", "abc", "-5", "1.234", "1.2.3"])("rejects %j", (text) => {
    expect(pesosToCentavos(text)).toBeNull();
  });
});

describe("catalog text", () => {
  it("shows turnaround in hours or whole days", () => {
    expect(formatTurnaround(1)).toBe("1 hour");
    expect(formatTurnaround(24)).toBe("24 hours");
    expect(formatTurnaround(30)).toBe("30 hours");
    expect(formatTurnaround(72)).toBe("3 days");
  });

  it("shows fasting", () => {
    expect(formatFasting(0)).toBe("No fasting");
    expect(formatFasting(8)).toBe("Fast 8 hours");
  });
});
