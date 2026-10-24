import type { LabProcedureDetails } from "../../domain/catalog/labProcedure.js";
import type {
  LabProcedureRecord,
  LabProcedureRepository,
} from "../../domain/catalog/LabProcedureRepository.js";
import type { ProcedureCategoryRepository } from "../../domain/catalog/ProcedureCategoryRepository.js";
import { checkDetailsForSave } from "./checkProcedureDetails.js";

/** An admin adds a procedure to the catalogue. It starts active. */
export class CreateLabProcedure {
  constructor(
    private readonly procedures: LabProcedureRepository,
    private readonly categories: ProcedureCategoryRepository,
  ) {}

  async execute(input: LabProcedureDetails): Promise<LabProcedureRecord> {
    const details = await checkDetailsForSave(this.procedures, this.categories, input, null);
    return this.procedures.create(details);
  }
}
