import { PromotionNotFound } from "../../domain/catalog/catalogErrors.js";
import type { Clock } from "../ports/clock.js";
import type { PromotionRepository } from "../ports/promotionRepository.js";
import { type PromotionOutput, toPromotionOutput } from "./promotionOutput.js";

export interface SetPromotionActiveInput {
  id: string;
  isActive: boolean;
}

/** Switches a promotion off early, or back on. Its dates still decide when it runs. */
export class SetPromotionActive {
  constructor(
    private readonly promotions: PromotionRepository,
    private readonly clock: Clock,
  ) {}

  async execute({ id, isActive }: SetPromotionActiveInput): Promise<PromotionOutput> {
    const promotion = await this.promotions.findById(id);
    if (!promotion) throw new PromotionNotFound();
    if (promotion.isActive !== isActive) await this.promotions.setActive(id, isActive);
    return toPromotionOutput({ ...promotion, isActive }, this.clock.now());
  }
}
