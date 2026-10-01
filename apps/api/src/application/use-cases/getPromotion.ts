import { PromotionNotFound } from "../../domain/catalog/catalogErrors.js";
import type { Clock } from "../ports/clock.js";
import type { PromotionRepository } from "../ports/promotionRepository.js";
import { type PromotionOutput, toPromotionOutput } from "./promotionOutput.js";

export interface GetPromotionInput {
  id: string;
  /** Only people who manage promotions see ones that aren't running. */
  includeAll: boolean;
}

export class GetPromotion {
  constructor(
    private readonly promotions: PromotionRepository,
    private readonly clock: Clock,
  ) {}

  async execute({ id, includeAll }: GetPromotionInput): Promise<PromotionOutput> {
    const record = await this.promotions.findById(id);
    if (!record) throw new PromotionNotFound();
    const promotion = toPromotionOutput(record, this.clock.now());
    if (!includeAll && promotion.status !== "running") throw new PromotionNotFound();
    return promotion;
  }
}
