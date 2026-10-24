import { describe, expect, it } from "vitest";
import { InvalidPromotion } from "../../../../src/domain/catalog/catalogErrors.js";
import {
  bestPromotion,
  checkPromotionDetails,
  discountedPrice,
  type Promotion,
  type PromotionDetails,
  promotionStatus,
} from "../../../../src/domain/catalog/promotion.js";

const seniorWeek: PromotionDetails = {
  name: "Senior Week",
  description: null,
  discountType: "percent",
  value: 20,
  startsOn: "2026-01-10",
  endsOn: "2026-01-16",
  appliesTo: "all",
  procedureIds: [],
};

const promotion = (changes: Partial<Promotion> = {}): Promotion => ({
  id: "p1",
  isActive: true,
  ...seniorWeek,
  ...changes,
});

describe("checkPromotionDetails", () => {
  it("trims the name and drops procedures when it applies to all of them", () => {
    expect(
      checkPromotionDetails({ ...seniorWeek, name: "  Senior Week ", procedureIds: ["x"] }),
    ).toEqual(seniorWeek);
  });

  it("drops duplicate procedures", () => {
    const details = checkPromotionDetails({
      ...seniorWeek,
      appliesTo: "selected",
      procedureIds: ["a", "b", "a"],
    });
    expect(details.procedureIds).toEqual(["a", "b"]);
  });

  it.each([
    ["a blank name", { name: " " }],
    ["0%", { value: 0 }],
    ["over 100%", { value: 101 }],
    ["a fraction", { value: 12.5 }],
    ["an end before the start", { startsOn: "2026-01-16", endsOn: "2026-01-15" }],
    ["selected with no procedures", { appliesTo: "selected" as const, procedureIds: [] }],
  ])("rejects %s", (_label, change) => {
    expect(() => checkPromotionDetails({ ...seniorWeek, ...change })).toThrow(InvalidPromotion);
  });

  it("allows a one-day sale and a large peso discount", () => {
    expect(() =>
      checkPromotionDetails({
        ...seniorWeek,
        discountType: "fixed",
        value: 500_000,
        endsOn: seniorWeek.startsOn,
      }),
    ).not.toThrow();
  });
});

describe("promotionStatus", () => {
  it.each([
    ["2026-01-09T12:00:00Z", "scheduled"],
    ["2026-01-09T16:00:00Z", "running"], // Jan 10, 00:00 in Manila
    ["2026-01-16T15:59:00Z", "running"], // last minute of Jan 16 in Manila
    ["2026-01-16T16:00:00Z", "ended"],
  ])("at %s it's %s", (now, status) => {
    expect(promotionStatus(promotion(), new Date(now))).toBe(status);
  });

  it("never ends without an end date, but still waits for its first day", () => {
    const standing = promotion({ endsOn: null });
    expect(promotionStatus(standing, new Date("2036-06-01T00:00:00Z"))).toBe("running");
    expect(promotionStatus(standing, new Date("2026-01-01T00:00:00Z"))).toBe("scheduled");
    expect(() => checkPromotionDetails({ ...seniorWeek, endsOn: null })).not.toThrow();
  });

  it("is off when switched off, whatever the dates", () => {
    expect(promotionStatus(promotion({ isActive: false }), new Date("2026-01-12T00:00:00Z"))).toBe(
      "off",
    );
  });
});

describe("discountedPrice", () => {
  it("takes a percent off, rounded to the centavo", () => {
    expect(discountedPrice(35_000, seniorWeek)).toBe(28_000);
    expect(discountedPrice(33_333, { ...seniorWeek, value: 15 })).toBe(28_333);
  });

  it("takes pesos off but never goes below ₱0", () => {
    const fixed = { ...seniorWeek, discountType: "fixed" as const, value: 20_000 };
    expect(discountedPrice(85_000, fixed)).toBe(65_000);
    expect(discountedPrice(15_000, fixed)).toBe(0);
  });
});

describe("bestPromotion", () => {
  const now = new Date("2026-01-12T00:00:00Z");
  const cbc = { id: "cbc", priceCentavos: 35_000 };

  it("picks the lowest price among running promotions that cover the procedure", () => {
    const promotions = [
      promotion({ id: "all-20", name: "20% off" }),
      promotion({
        id: "cbc-100",
        name: "₱100 off CBC",
        discountType: "fixed",
        value: 10_000,
        appliesTo: "selected",
        procedureIds: ["cbc"],
      }),
      promotion({
        id: "other",
        name: "50% off FBS",
        value: 50,
        appliesTo: "selected",
        procedureIds: ["fbs"],
      }),
      promotion({
        id: "later",
        name: "Next month",
        value: 90,
        startsOn: "2026-02-01",
        endsOn: "2026-02-28",
      }),
    ];

    expect(bestPromotion(cbc, promotions, now)).toEqual({
      // ₱350 − ₱100 = ₱250 beats 20% off (₱280).
      id: "cbc-100",
      name: "₱100 off CBC",
      discountedPriceCentavos: 25_000,
    });
  });

  it("is null when nothing lowers the price", () => {
    expect(bestPromotion(cbc, [promotion({ isActive: false })], now)).toBeNull();
    expect(bestPromotion(cbc, [], now)).toBeNull();
  });
});
