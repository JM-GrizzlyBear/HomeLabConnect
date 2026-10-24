import {
  CategoryNotFound,
  ProcedureCodeTaken,
  ProcedureNameTaken,
} from "../../domain/catalog/catalogErrors.js";
import {
  checkProcedureDetails,
  type LabProcedureDetails,
} from "../../domain/catalog/labProcedure.js";
import type { LabProcedureRepository } from "../../domain/catalog/LabProcedureRepository.js";
import type { ProcedureCategoryRepository } from "../../domain/catalog/ProcedureCategoryRepository.js";

/**
 * Shared by create and update: the domain rules, an existing category, and a
 * code and name no other procedure uses. `ownId` is the procedure being edited.
 */
export async function checkDetailsForSave(
  procedures: LabProcedureRepository,
  categories: ProcedureCategoryRepository,
  input: LabProcedureDetails,
  ownId: string | null,
): Promise<LabProcedureDetails> {
  const details = checkProcedureDetails(input);
  if (!(await categories.findById(details.categoryId))) throw new CategoryNotFound();

  const [sameCode, sameName] = await Promise.all([
    procedures.findByCode(details.code),
    procedures.findByName(details.name),
  ]);
  if (sameCode && sameCode.id !== ownId) throw new ProcedureCodeTaken();
  if (sameName && sameName.id !== ownId) throw new ProcedureNameTaken();
  return details;
}
