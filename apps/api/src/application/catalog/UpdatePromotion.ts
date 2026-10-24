import { PromotionNotFound } from "../../domain/catalog/catalogErrors.js";
import type { PromotionDetails } from "../../domain/catalog/promotion.js";
import type { Clock } from "../ports/Clock.js";
import type { LabProcedureRepository } from "../../domain/catalog/LabProcedureRepository.js";
import type { PromotionRepository } from "../../domain/catalog/PromotionRepository.js";
import { checkPromotionForSave } from "./checkPromotionDetails.js";
import { type PromotionOutput, toPromotionOutput } from "./promotionOutput.js";

export interface UpdatePromotionInput extends PromotionDetails {
  id: string;
}

/** An admin changes a promotion. Switching it on or off is separate. */
export class UpdatePromotion {
  constructor(
    private readonly promotions: PromotionRepository,
    private readonly procedures: LabProcedureRepository,
    private readonly clock: Clock,
  ) {}

  async execute({ id, ...input }: UpdatePromotionInput): Promise<PromotionOutput> {
    if (!(await this.promotions.findById(id))) throw new PromotionNotFound();
    const details = await checkPromotionForSave(this.promotions, this.procedures, input, id);

    await this.promotions.update(id, details);
    const updated = await this.promotions.findById(id);
    if (!updated) throw new PromotionNotFound();
    return toPromotionOutput(updated, this.clock.now());
  }
}
