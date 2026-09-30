import { ProcedureNotFound } from "../../domain/catalog/catalogErrors.js";
import type {
  LabProcedureRecord,
  LabProcedureRepository,
} from "../ports/labProcedureRepository.js";

export interface GetLabProcedureInput {
  id: string;
  /** Only people who manage the catalogue see inactive procedures. */
  includeInactive: boolean;
}

export class GetLabProcedure {
  constructor(private readonly procedures: LabProcedureRepository) {}

  async execute({ id, includeInactive }: GetLabProcedureInput): Promise<LabProcedureRecord> {
    const procedure = await this.procedures.findById(id);
    if (!procedure || (!procedure.isActive && !includeInactive)) throw new ProcedureNotFound();
    return procedure;
  }
}
