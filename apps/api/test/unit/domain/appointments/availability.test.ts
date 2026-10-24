import { describe, expect, it } from "vitest";
import { assertCan, totalsOf } from "../../../../src/domain/appointments/appointment.js";
import {
  AppointmentStatusConflict,
  SlotNotBookable,
} from "../../../../src/domain/appointments/appointmentErrors.js";
import {
  assertBookableSlot,
  type BookingSettings,
  dayAvailability,
  slotStarts,
} from "../../../../src/domain/appointments/availability.js";

// Thursday 2026-01-15, 4:00 PM in the Philippines
const now = new Date("2026-01-15T08:00:00Z");
const settings: BookingSettings = {
  visitDays: [1, 2, 3, 4, 5, 6],
  visitStart: "06:00",
  visitEnd: "09:00",
  slotMinutes: 60,
  minNoticeHours: 24,
  bookingWindowDays: 30,
  visitsPerTeamPerDay: 2,
};
const noBookings = { bySlot: new Map<string, number>(), total: 0 };
const closedDays = [
  {
    date: "2026-01-20",
    name: "Team outing",
    kind: "special_day_off" as const,
    repeatsYearly: false,
  },
];

describe("slotStarts", () => {
  it("fits whole slots between the visit hours", () => {
    expect(slotStarts(settings)).toEqual(["06:00", "07:00", "08:00"]);
    expect(slotStarts({ visitStart: "06:00", visitEnd: "08:00", slotMinutes: 90 })).toEqual([
      "06:00",
    ]);
  });
});

describe("dayAvailability", () => {
  it("gives each slot one place per team on duty", () => {
    const day = dayAvailability("2026-01-17", now, settings, [], 2, noBookings);
    expect(day.closedReason).toBeNull();
    expect(day.slots).toEqual([
      { start: "06:00", left: 2 },
      { start: "07:00", left: 2 },
      { start: "08:00", left: 2 },
    ]);
  });

  it("takes booked places off their slot, and stops at the daily cap", () => {
    const booked = {
      bySlot: new Map([
        ["06:00", 2],
        ["07:00", 1],
      ]),
      total: 3,
    };
    const day = dayAvailability("2026-01-17", now, settings, [], 2, booked);
    // 2 teams × 2 visits a day = 4, so only one place is left in the whole day
    expect(day.slots.map((slot) => slot.left)).toEqual([0, 1, 1]);

    const full = dayAvailability("2026-01-17", now, settings, [], 2, { ...booked, total: 4 });
    expect(full.closedReason).toBe("full");
  });

  it("says why a day can't be booked", () => {
    const reason = (date: string, teams = 1) =>
      dayAvailability(date, now, settings, closedDays, teams, noBookings).closedReason;
    expect(reason("2026-01-14")).toBe("past");
    // Tomorrow's slots all start less than 24 hours from now
    expect(reason("2026-01-16")).toBe("too_soon");
    expect(reason("2026-01-18")).toBe("not_a_visit_day"); // a Sunday
    expect(reason("2026-01-20")).toBe("closed_day");
    expect(reason("2026-03-01")).toBe("too_far");
    expect(reason("2026-01-17", 0)).toBe("no_teams");
  });

  it("names the closed day", () => {
    expect(dayAvailability("2026-01-20", now, settings, closedDays, 1, noBookings).label).toBe(
      "Team outing",
    );
  });
});

describe("assertBookableSlot", () => {
  it("accepts a listed slot with enough notice", () => {
    expect(() => assertBookableSlot("2026-01-17", "07:00", now, settings, [])).not.toThrow();
  });

  it("refuses an off-grid time, too little notice and a closed day", () => {
    expect(() => assertBookableSlot("2026-01-17", "07:30", now, settings, [])).toThrow(
      "Pick one of the listed visit times.",
    );
    expect(() => assertBookableSlot("2026-01-16", "08:00", now, settings, [])).toThrow(
      SlotNotBookable,
    );
    expect(() => assertBookableSlot("2026-01-20", "08:00", now, settings, closedDays)).toThrow(
      "We're closed on that day.",
    );
  });
});

describe("appointment rules", () => {
  it("only accepts or rejects pending bookings", () => {
    expect(() => assertCan("accept", "pending")).not.toThrow();
    expect(() => assertCan("accept", "cancelled")).toThrow(AppointmentStatusConflict);
    expect(() => assertCan("cancel", "rejected")).toThrow(AppointmentStatusConflict);
    expect(() => assertCan("answer_proposal", "reschedule_proposed")).not.toThrow();
  });

  it("adds up prices and discounts", () => {
    const line = { procedureId: "p", code: "C", name: "N", promotionId: null, promotionName: null };
    expect(
      totalsOf([
        { ...line, priceCentavos: 35_000, discountCentavos: 7_000 },
        { ...line, priceCentavos: 50_000, discountCentavos: 0 },
      ]),
    ).toEqual({ subtotalCentavos: 85_000, discountCentavos: 7_000, totalCentavos: 78_000 });
  });
});
