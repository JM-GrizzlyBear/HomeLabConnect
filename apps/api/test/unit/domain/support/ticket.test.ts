import { describe, expect, it } from "vitest";
import { TicketClosed } from "../../../../src/domain/support/supportErrors.js";
import {
  canReopen,
  formatTicketCode,
  isOnShift,
  pickAgent,
  statusAfterMessage,
} from "../../../../src/domain/support/ticket.js";

// 2026-01-15T08:00Z is 4:00 PM on Thursday 15 January in Manila
const NOW = new Date("2026-01-15T08:00:00Z");
const DAY_MS = 24 * 60 * 60 * 1000;

describe("pickAgent", () => {
  it("picks whoever has the fewest open tickets", () => {
    expect(
      pickAgent([
        { id: "a", open: 3, lastAssignedAt: null },
        { id: "b", open: 1, lastAssignedAt: NOW },
      ]),
    ).toBe("b");
  });

  it("on a tie, picks whoever got a ticket longest ago (never counts as longest)", () => {
    const earlier = new Date(NOW.getTime() - 60_000);
    expect(
      pickAgent([
        { id: "a", open: 1, lastAssignedAt: NOW },
        { id: "b", open: 1, lastAssignedAt: earlier },
      ]),
    ).toBe("b");
    expect(
      pickAgent([
        { id: "a", open: 1, lastAssignedAt: earlier },
        { id: "b", open: 1, lastAssignedAt: null },
      ]),
    ).toBe("b");
  });

  it("is null with nobody to pick", () => {
    expect(pickAgent([])).toBeNull();
  });
});

describe("isOnShift", () => {
  const shift = (start: string, end: string) => [{ date: "2026-01-15", start, end }];

  it("counts a shift covering this minute in Manila time, up to (not at) its end", () => {
    expect(isOnShift(NOW, { shifts: shift("08:00", "17:00"), leave: [] })).toBe(true);
    expect(isOnShift(NOW, { shifts: shift("16:00", "17:00"), leave: [] })).toBe(true);
    expect(isOnShift(NOW, { shifts: shift("06:00", "16:00"), leave: [] })).toBe(false);
  });

  it("isn't on shift on a day off, on another day's shift, or on leave", () => {
    expect(isOnShift(NOW, { shifts: [], leave: [] })).toBe(false);
    expect(
      isOnShift(NOW, {
        shifts: [{ date: "2026-01-14", start: "08:00", end: "17:00" }],
        leave: [],
      }),
    ).toBe(false);
    expect(
      isOnShift(NOW, {
        shifts: shift("08:00", "17:00"),
        leave: [{ startsOn: "2026-01-15", endsOn: "2026-01-16" }],
      }),
    ).toBe(false);
  });
});

describe("statusAfterMessage", () => {
  const assigned = {
    status: "assigned" as const,
    closedAt: null,
    assignee: { id: "a", name: "A" },
  };

  it("waits on the patient after an agent replies, and goes back to support when they answer", () => {
    expect(statusAfterMessage(assigned, "agent", NOW)).toBe("waiting_on_patient");
    expect(statusAfterMessage({ ...assigned, status: "waiting_on_patient" }, "patient", NOW)).toBe(
      "assigned",
    );
    expect(
      statusAfterMessage({ ...assigned, assignee: null, status: "open" }, "patient", NOW),
    ).toBe("open");
  });

  it("lets the patient reopen a closed ticket within a week, and nobody after", () => {
    const closed = {
      ...assigned,
      status: "closed" as const,
      closedAt: new Date(NOW.getTime() - DAY_MS),
    };
    expect(statusAfterMessage(closed, "patient", NOW)).toBe("assigned");
    expect(() => statusAfterMessage(closed, "agent", NOW)).toThrow(TicketClosed);
    const old = { ...closed, closedAt: new Date(NOW.getTime() - 8 * DAY_MS) };
    expect(() => statusAfterMessage(old, "patient", NOW)).toThrow(TicketClosed);
  });
});

describe("canReopen", () => {
  it("is only for closed tickets, for 7 days", () => {
    expect(canReopen({ status: "assigned", closedAt: null }, NOW)).toBe(false);
    expect(
      canReopen({ status: "closed", closedAt: new Date(NOW.getTime() - 7 * DAY_MS) }, NOW),
    ).toBe(true);
    expect(
      canReopen({ status: "closed", closedAt: new Date(NOW.getTime() - 7 * DAY_MS - 1) }, NOW),
    ).toBe(false);
  });
});

it("formats ticket codes", () => {
  expect(formatTicketCode(12)).toBe("TKT-000012");
});
