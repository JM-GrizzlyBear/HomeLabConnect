import type { Promotion, PromotionDetails } from "../../domain/catalog/promotion.js";

export interface PromotionRecord extends Promotion {
  createdAt: Date;
  updatedAt: Date;
}

/** Port: sales and discounts on procedures. */
export interface PromotionRepository {
  /** Newest first by start date. There are few promotions, so no paging. */
  list(): Promise<PromotionRecord[]>;
  /** Active promotions whose dates include `date` ("YYYY-MM-DD"). */
  listRunningOn(date: string): Promise<Promotion[]>;
  findById(id: string): Promise<PromotionRecord | null>;
  /** Case-insensitive. */
  findByName(name: string): Promise<Promotion | null>;
  /** Throws PromotionNameTaken on a duplicate name. */
  create(details: PromotionDetails): Promise<PromotionRecord>;
  /** Replaces every detail, including the procedure list. Throws PromotionNameTaken on a duplicate. */
  update(id: string, details: PromotionDetails): Promise<void>;
  setActive(id: string, isActive: boolean): Promise<void>;
}
