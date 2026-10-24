import { promotionStatus, type PromotionStatus } from "../../domain/catalog/promotion.js";
import type { PromotionRecord } from "../ports/promotionRepository.js";

export interface PromotionOutput extends PromotionRecord {
  status: PromotionStatus;
}

export function toPromotionOutput(record: PromotionRecord, now: Date): PromotionOutput {
  return { ...record, status: promotionStatus(record, now) };
}
