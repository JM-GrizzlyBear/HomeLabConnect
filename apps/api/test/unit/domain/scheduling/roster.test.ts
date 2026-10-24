import { describe, expect, it } from "vitest";
import {
  checkRoster,
  isRosterPeriodStart,
  type Roster,
  rosterPeriodEnd,
  rosterPeriodOf,
} from "../../../../src/domain/scheduling/roster.js";
import { InvalidRoster, RosterClash } from "../../../../src/domain/scheduling/schedulingErrors.js";

describe("roster periods", () => {
  it.each([
    ["2026-01-05", "2026-01-05"], // the anchor Monday
    ["2026-01-18", "2026-01-05"], // the Sunday after next
    ["2026-01-19", "2026-01-19"],
    ["2026-10-01", "2026-09-28"],
    ["2026-01-04", "2025-12-22"], // before the anchor
  ])("%s falls in the period starting %s", (date, start) => {
    expect(rosterPeriodOf(date)).toBe(start);
  });

  it("is two weeks long and starts on a Monday", () => {
    expect(rosterPeriodEnd("2026-09-28")).toBe("2026-10-11");
    expect(isRosterPeriodStart("2026-09-28")).toBe(true);
    expect(isRosterPeriodStart("2026-10-05")).toBe(false);
  });
});

describe("checkRoster", () => {
  const eligible = new Map([
    ["juan", "Juan Dela Cruz"],
    ["paolo", "Paolo Garcia"],
    ["mia", "Mia Lopez"],
  ]);
  const makati: Roster = {
    teamId: "makati",
    periodStart: "2026-09-28",
    leadUserId: "juan",
    memberIds: ["juan", "paolo", "juan"],
  };

  it("accepts a lead among the members and drops duplicates", () => {
    expect(checkRoster(makati, { eligible, otherRosters: [] }).memberIds).toEqual([
      "juan",
      "paolo",
    ]);
  });

  it("allows clearing a roster", () => {
    expect(() =>
      checkRoster({ ...makati, leadUserId: null, memberIds: [] }, { eligible, otherRosters: [] }),
    ).not.toThrow();
  });

  it.each([
    ["a period that doesn't start on its Monday", { periodStart: "2026-09-29" }],
    ["someone who isn't active med team", { memberIds: ["juan", "doctor"] }],
    ["no lead", { leadUserId: null }],
    ["a lead who isn't a member", { leadUserId: "mia" }],
  ])("refuses %s", (_label, change) => {
    expect(() => checkRoster({ ...makati, ...change }, { eligible, otherRosters: [] })).toThrow(
      InvalidRoster,
    );
  });

  it("refuses someone already on another team that period", () => {
    const otherRosters = [
      {
        teamId: "qc",
        periodStart: "2026-09-28",
        leadUserId: "paolo",
        memberIds: ["paolo"],
        teamName: "Team QC",
      },
    ];
    expect(() => checkRoster(makati, { eligible, otherRosters })).toThrow(
      new RosterClash("Paolo Garcia", "Team QC"),
    );
  });
});
