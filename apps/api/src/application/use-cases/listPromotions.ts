import type { PromotionStatus } from "../../domain/catalog/promotion.js";
import type { Clock } from "../ports/clock.js";
import type { PromotionRepository } from "../ports/promotionRepository.js";
import { type PromotionOutput, toPromotionOutput } from "./promotionOutput.js";

export interface ListPromotionsInput {
  status: PromotionStatus | null;
  /** Only people who manage promotions see ones that aren't running. */
  includeAll: boolean;
}

export class ListPromotions {
  constructor(
    private readonly promotions: PromotionRepository,
    private readonly clock: Clock,
  ) {}

  async execute({ status, includeAll }: ListPromotionsInput): Promise<PromotionOutput[]> {
    const now = this.clock.now();
    const wanted = includeAll ? status : "running";
    const all = (await this.promotions.list()).map((record) => toPromotionOutput(record, now));
    return wanted ? all.filter((promotion) => promotion.status === wanted) : all;
  }
}
