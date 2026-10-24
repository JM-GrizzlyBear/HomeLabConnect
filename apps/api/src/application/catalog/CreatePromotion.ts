import type { PromotionDetails } from "../../domain/catalog/promotion.js";
import type { Clock } from "../ports/Clock.js";
import type { LabProcedureRepository } from "../../domain/catalog/LabProcedureRepository.js";
import type { PromotionRepository } from "../../domain/catalog/PromotionRepository.js";
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
