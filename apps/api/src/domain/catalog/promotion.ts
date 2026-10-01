import { businessDate } from "../time/businessDate.js";
import { InvalidPromotion } from "./catalogErrors.js";
import { MAX_PRICE_CENTAVOS } from "./labProcedure.js";

export type DiscountType = "percent" | "fixed";
/** Every procedure, or only the ones listed in `procedureIds`. */
export type PromotionScope = "all" | "selected";
export type PromotionStatus = "scheduled" | "running" | "ended" | "off";

/** What an admin fills in for a promotion. Dates are "YYYY-MM-DD", both days included. */
export interface PromotionDetails {
  name: string;
  description: string | null;
  discountType: DiscountType;
  /** Percent (1–100), or centavos off. */
  value: number;
  startsOn: string;
  /** null: no end date (e.g. a standing senior/PWD discount); it runs until switched off. */
  endsOn: string | null;
  appliesTo: PromotionScope;
  procedureIds: string[];
}

/** A sale on some or all procedures, e.g. "Senior & PWD Week: 20% off". */
export interface Promotion extends PromotionDetails {
  id: string;
  /** An admin can switch a promotion off before it ends. */
  isActive: boolean;
}

const rules: { holds(details: PromotionDetails): boolean; message: string }[] = [
  { holds: ({ name }) => name.length > 0, message: "A promotion needs a name." },
  {
    holds: ({ discountType, value }) =>
      Number.isInteger(value) &&
      value >= 1 &&
      value <= (discountType === "percent" ? 100 : MAX_PRICE_CENTAVOS),
    message: "A percent discount is 1–100; a peso discount is above ₱0.",
  },
  {
    holds: ({ startsOn, endsOn }) => endsOn === null || endsOn >= startsOn,
    message: "The last day can't be before the first.",
  },
  {
    holds: ({ appliesTo, procedureIds }) => appliesTo === "all" || procedureIds.length > 0,
    message: "Choose at least one procedure.",
  },
];

/**
 * Trims the name, drops duplicate procedures (and all of them when it applies
 * to every procedure), then applies the rules. Throws on the first broken one.
 */
export function checkPromotionDetails(input: PromotionDetails): PromotionDetails {
  const details = {
    ...input,
    name: input.name.trim(),
    procedureIds: input.appliesTo === "all" ? [] : [...new Set(input.procedureIds)],
  };
  const broken = rules.find((rule) => !rule.holds(details));
  if (broken) throw new InvalidPromotion(broken.message);
  return details;
}

export function promotionStatus(promotion: Promotion, now: Date): PromotionStatus {
  if (!promotion.isActive) return "off";
  const today = businessDate(now);
  if (today < promotion.startsOn) return "scheduled";
  if (promotion.endsOn !== null && today > promotion.endsOn) return "ended";
  return "running";
}

export function appliesToProcedure(promotion: Promotion, procedureId: string): boolean {
  return promotion.appliesTo === "all" || promotion.procedureIds.includes(procedureId);
}

/** The price after the promotion's discount, never below ₱0. */
export function discountedPrice(priceCentavos: number, promotion: PromotionDetails): number {
  const off =
    promotion.discountType === "percent"
      ? Math.round((priceCentavos * promotion.value) / 100)
      : promotion.value;
  return Math.max(0, priceCentavos - off);
}

export interface AppliedPromotion {
  id: string;
  name: string;
  discountedPriceCentavos: number;
}

/**
 * Of the promotions running at `now` that cover this procedure, the one giving
 * the lowest price. Null when none applies or none lowers the price.
 */
export function bestPromotion(
  procedure: { id: string; priceCentavos: number },
  promotions: readonly Promotion[],
  now: Date,
): AppliedPromotion | null {
  let best: AppliedPromotion | null = null;
  for (const promotion of promotions) {
    if (promotionStatus(promotion, now) !== "running") continue;
    if (!appliesToProcedure(promotion, procedure.id)) continue;
    const price = discountedPrice(procedure.priceCentavos, promotion);
    if (price < procedure.priceCentavos && (!best || price < best.discountedPriceCentavos)) {
      best = { id: promotion.id, name: promotion.name, discountedPriceCentavos: price };
    }
  }
  return best;
}
