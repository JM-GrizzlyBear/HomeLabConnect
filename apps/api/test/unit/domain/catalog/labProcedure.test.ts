import { describe, expect, it } from "vitest";
import { CategoryInUse, InvalidProcedure } from "../../../../src/domain/catalog/catalogErrors.js";
import {
  checkProcedureDetails,
  type LabProcedureDetails,
} from "../../../../src/domain/catalog/labProcedure.js";
import { assertCategoryEmpty } from "../../../../src/domain/catalog/procedureCategory.js";

const cbc: LabProcedureDetails = {
  code: "CBC",
  name: "Complete Blood Count",
  categoryId: "c1",
  priceCentavos: 35_000,
  specimen: "blood",
  turnaroundHours: 24,
  fastingHours: 0,
  preparation: null,
  description: null,
};

describe("checkProcedureDetails", () => {
  it("normalises the code and trims the name", () => {
    expect(checkProcedureDetails({ ...cbc, code: " lipid-panel ", name: "  Lipid  " })).toEqual({
      ...cbc,
      code: "LIPID-PANEL",
      name: "Lipid",
    });
  });

  it.each([
    ["a one-letter code", { code: "C" }],
    ["a code with spaces", { code: "CB C" }],
    ["a double dash", { code: "CB--C" }],
    ["a blank name", { name: "  " }],
    ["a free procedure", { priceCentavos: 0 }],
    ["a price in fractions of a centavo", { priceCentavos: 100.5 }],
    ["a price over ₱1,000,000", { priceCentavos: 100_000_001 }],
    ["zero turnaround", { turnaroundHours: 0 }],
    ["a turnaround over 30 days", { turnaroundHours: 721 }],
    ["negative fasting", { fastingHours: -1 }],
    ["fasting over a day", { fastingHours: 25 }],
  ])("rejects %s", (_label, change) => {
    expect(() => checkProcedureDetails({ ...cbc, ...change })).toThrow(InvalidProcedure);
  });

  it("accepts the limits", () => {
    expect(() =>
      checkProcedureDetails({
        ...cbc,
        priceCentavos: 100_000_000,
        turnaroundHours: 720,
        fastingHours: 24,
      }),
    ).not.toThrow();
  });
});

describe("assertCategoryEmpty", () => {
  it("allows deleting an empty category and refuses one in use", () => {
    expect(() => assertCategoryEmpty(0)).not.toThrow();
    expect(() => assertCategoryEmpty(2)).toThrow(CategoryInUse);
  });
});
