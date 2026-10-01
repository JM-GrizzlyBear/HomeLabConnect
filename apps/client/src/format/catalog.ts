import {
  type DiscountType,
  formatPeso,
  type PromotionStatus,
  type Specimen,
} from "@homelabconnect/shared";
import { formatDate } from "./dates";

export {
  centavosToPesos,
  discountedPriceCentavos,
  formatPeso,
  pesosToCentavos,
} from "@homelabconnect/shared";

export const specimenLabels: Record<Specimen, string> = {
  blood: "Blood",
  urine: "Urine",
  stool: "Stool",
  swab: "Swab",
  other: "Other",
};

/** 24 → "24 hours", 72 → "3 days", 30 → "30 hours". */
export function formatTurnaround(hours: number): string {
  if (hours >= 48 && hours % 24 === 0) return `${hours / 24} days`;
  return hours === 1 ? "1 hour" : `${hours} hours`;
}

/** 0 → "No fasting", 8 → "Fast 8 hours". */
export function formatFasting(hours: number): string {
  if (hours === 0) return "No fasting";
  return hours === 1 ? "Fast 1 hour" : `Fast ${hours} hours`;
}

/** ("percent", 20) → "20% off"; ("fixed", 20000) → "₱200.00 off". */
export function formatDiscount(discountType: DiscountType, value: number): string {
  return discountType === "percent" ? `${value}% off` : `${formatPeso(value)} off`;
}

/** "Jan 10, 2026 – Jan 16, 2026", one date for a one-day sale, or "From Jan 10, 2026" with no end. */
export function formatDateRange(startsOn: string, endsOn: string | null): string {
  if (endsOn === null) return `From ${formatDate(startsOn)}`;
  if (startsOn === endsOn) return formatDate(startsOn);
  return `${formatDate(startsOn)} – ${formatDate(endsOn)}`;
}

export const promotionStatusLabels: Record<PromotionStatus, string> = {
  scheduled: "Scheduled",
  running: "Running",
  ended: "Ended",
  off: "Off",
};
