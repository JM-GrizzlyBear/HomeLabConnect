import { ProcedureNotFound } from "../../domain/catalog/catalogErrors.js";
import type { LabProcedureDetails } from "../../domain/catalog/labProcedure.js";
import type {
  LabProcedureRecord,
  LabProcedureRepository,
} from "../../domain/catalog/LabProcedureRepository.js";
import type { ProcedureCategoryRepository } from "../../domain/catalog/ProcedureCategoryRepository.js";
import { checkDetailsForSave } from "./checkProcedureDetails.js";

export interface UpdateLabProcedureInput extends LabProcedureDetails {
  id: string;
}

/** An admin changes a procedure's details. Its active status is changed separately. */
export class UpdateLabProcedure {
  constructor(
    private readonly procedures: LabProcedureRepository,
    private readonly categories: ProcedureCategoryRepository,
  ) {}

  async execute({ id, ...input }: UpdateLabProcedureInput): Promise<LabProcedureRecord> {
    if (!(await this.procedures.findById(id))) throw new ProcedureNotFound();
    const details = await checkDetailsForSave(this.procedures, this.categories, input, id);

    await this.procedures.update(id, details);
    const updated = await this.procedures.findById(id);
    if (!updated) throw new ProcedureNotFound();
    return updated;
  }
}
