import { InvalidPromotion, PromotionNameTaken } from "../../domain/catalog/catalogErrors.js";
import { checkPromotionDetails, type PromotionDetails } from "../../domain/catalog/promotion.js";
import type { LabProcedureRepository } from "../ports/labProcedureRepository.js";
import type { PromotionRepository } from "../ports/promotionRepository.js";

/**
 * Shared by create and update: the domain rules, a name no other promotion
 * uses, and procedures that exist. `ownId` is the promotion being edited.
 */
export async function checkPromotionForSave(
  promotions: PromotionRepository,
  procedures: LabProcedureRepository,
  input: PromotionDetails,
  ownId: string | null,
): Promise<PromotionDetails> {
  const details = checkPromotionDetails(input);

  const sameName = await promotions.findByName(details.name);
  if (sameName && sameName.id !== ownId) throw new PromotionNameTaken();

  const existing = await procedures.findExistingIds(details.procedureIds);
  if (existing.length !== details.procedureIds.length) {
    throw new InvalidPromotion("One of the chosen procedures no longer exists.");
  }
  return details;
}
