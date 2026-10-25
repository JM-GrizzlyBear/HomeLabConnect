import { describe, expect, it } from "vitest";
import { pickTeam, teamChoices } from "../../../../src/domain/appointments/teamAssignment.js";

const teams = [
  { id: "t-north", name: "Team North" },
  { id: "t-east", name: "Team East" },
  { id: "t-south", name: "Team South" },
];

describe("teamChoices", () => {
  it("marks a team busy at the slot, or full for the day, as unavailable", () => {
    const loads = new Map([
      ["t-north", { total: 1, slots: ["08:00"] }],
      ["t-east", { total: 2, slots: ["06:00", "07:00"] }],
    ]);

    expect(teamChoices(teams, loads, "08:00", 2)).toEqual([
      { teamId: "t-east", name: "Team East", visitsThatDay: 2, available: false },
      { teamId: "t-north", name: "Team North", visitsThatDay: 1, available: false },
      { teamId: "t-south", name: "Team South", visitsThatDay: 0, available: true },
    ]);
  });
});

describe("pickTeam", () => {
  it("picks the free team with the fewest visits that day, ties A–Z", () => {
    const loads = new Map([
      ["t-north", { total: 1, slots: ["06:00"] }],
      ["t-east", { total: 1, slots: ["07:00"] }],
      ["t-south", { total: 3, slots: ["09:00", "10:00", "11:00"] }],
    ]);
    expect(pickTeam(teamChoices(teams, loads, "08:00", 8))?.name).toBe("Team East");
  });

  it("returns null when no team is free", () => {
    const loads = new Map(teams.map((team) => [team.id, { total: 1, slots: ["08:00"] }]));
    expect(pickTeam(teamChoices(teams, loads, "08:00", 8))).toBeNull();
  });
});
