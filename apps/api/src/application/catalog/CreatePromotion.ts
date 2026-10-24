import type { PromotionDetails } from "../../domain/catalog/promotion.js";
import type { Clock } from "../ports/clock.js";
import type { LabProcedureRepository } from "../ports/labProcedureRepository.js";
import type { PromotionRepository } from "../ports/promotionRepository.js";
import { checkPromotionForSave } from "./checkPromotionDetails.js";
import { type PromotionOutput, toPromotionOutput } from "./promotionOutput.js";

/** An admin sets up a sale. It starts and ends on its own dates. */
export class CreatePromotion {
  constructor(
    private readonly promotions: PromotionRepository,
    private readonly procedures: LabProcedureRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: PromotionDetails): Promise<PromotionOutput> {
    const details = await checkPromotionForSave(this.promotions, this.procedures, input, null);
    return toPromotionOutput(await this.promotions.create(details), this.clock.now());
  }
}
