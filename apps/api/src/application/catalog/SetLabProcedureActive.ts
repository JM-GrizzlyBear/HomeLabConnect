import { ProcedureNotFound } from "../../domain/catalog/catalogErrors.js";
import type {
  LabProcedureRecord,
  LabProcedureRepository,
} from "../ports/labProcedureRepository.js";

export interface SetLabProcedureActiveInput {
  id: string;
  isActive: boolean;
}

/** Takes a procedure off the catalogue, or puts it back. Nothing is deleted. */
export class SetLabProcedureActive {
  constructor(private readonly procedures: LabProcedureRepository) {}

  async execute({ id, isActive }: SetLabProcedureActiveInput): Promise<LabProcedureRecord> {
    const procedure = await this.procedures.findById(id);
    if (!procedure) throw new ProcedureNotFound();
    if (procedure.isActive === isActive) return procedure;

    await this.procedures.setActive(id, isActive);
    return { ...procedure, isActive };
  }
}
