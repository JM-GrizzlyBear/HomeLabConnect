import type { LabProcedureDetails } from "../../domain/catalog/labProcedure.js";
import type {
  LabProcedureRecord,
  LabProcedureRepository,
} from "../ports/labProcedureRepository.js";
import type { ProcedureCategoryRepository } from "../ports/procedureCategoryRepository.js";
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
