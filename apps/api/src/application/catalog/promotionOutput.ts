import { promotionStatus, type PromotionStatus } from "../../domain/catalog/promotion.js";
import type { PromotionRecord } from "../../domain/catalog/PromotionRepository.js";

export interface PromotionOutput extends PromotionRecord {
  status: PromotionStatus;
}

export function toPromotionOutput(record: PromotionRecord, now: Date): PromotionOutput {
  return { ...record, status: promotionStatus(record, now) };
}
