import { describe, expect, it } from "vitest";
import { InvalidSettings } from "../../../src/domain/settings/settingsErrors.js";
import {
  checkSettings,
  DEFAULT_SETTINGS,
  minutesOf,
} from "../../../src/domain/settings/systemSettings.js";

describe("checkSettings", () => {
  it("accepts the defaults: every day, 06:00–12:00, 1-hour slots", () => {
    expect(checkSettings(DEFAULT_SETTINGS)).toEqual(DEFAULT_SETTINGS);
    expect(DEFAULT_SETTINGS.visitDays).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it("sorts and de-duplicates the visit days", () => {
    expect(checkSettings({ ...DEFAULT_SETTINGS, visitDays: [5, 1, 5, 3] }).visitDays).toEqual([
      1, 3, 5,
    ]);
  });

  it.each([
    ["no visit days", { visitDays: [] }],
    ["a weekday of 7", { visitDays: [7] }],
    ["a time off the half hour", { visitStart: "06:15" }],
    ["an end before the start", { visitStart: "12:00", visitEnd: "06:00" }],
    ["a 45-minute slot", { slotMinutes: 45 }],
    ["a slot longer than the hours", { visitStart: "06:00", visitEnd: "07:00", slotMinutes: 90 }],
    ["a 0-day window", { bookingWindowDays: 0 }],
    ["notice as long as the window", { minNoticeHours: 48, bookingWindowDays: 2 }],
    ["a cut-off over a week", { cancelCutoffHours: 169 }],
    ["no visits per team", { visitsPerTeamPerDay: 0 }],
  ])("rejects %s", (_label, change) => {
    expect(() => checkSettings({ ...DEFAULT_SETTINGS, ...change })).toThrow(InvalidSettings);
  });

  it("reads times as minutes", () => {
    expect(minutesOf("06:30")).toBe(390);
  });
});
