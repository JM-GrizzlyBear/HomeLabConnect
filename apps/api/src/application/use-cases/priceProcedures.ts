import {
  type AppliedPromotion,
  bestPromotion,
  businessDate,
} from "../../domain/catalog/promotion.js";
import type { Clock } from "../ports/clock.js";
import type { LabProcedureRecord } from "../ports/labProcedureRepository.js";
import type { PromotionRepository } from "../ports/promotionRepository.js";

/** A procedure with today's best promotion, if one lowers its price. */
export interface PricedProcedure extends LabProcedureRecord {
  promotion: AppliedPromotion | null;
}

/** Adds each procedure's best running promotion. One query for all of them. */
export async function priceProcedures(
  records: readonly LabProcedureRecord[],
  promotions: PromotionRepository,
  clock: Clock,
): Promise<PricedProcedure[]> {
  if (records.length === 0) return [];
  const now = clock.now();
  const running = await promotions.listRunningOn(businessDate(now));
  return records.map((record) => ({ ...record, promotion: bestPromotion(record, running, now) }));
}
