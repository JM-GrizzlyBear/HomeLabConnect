import { type AppliedPromotion, bestPromotion } from "../../domain/catalog/promotion.js";
import { businessDate } from "../../domain/time/businessDate.js";
import type { Clock } from "../ports/Clock.js";
import type { LabProcedureRecord } from "../../domain/catalog/LabProcedureRepository.js";
import type { PromotionRepository } from "../../domain/catalog/PromotionRepository.js";

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
