import { CategoryNameTaken } from "../../domain/catalog/catalogErrors.js";
import type {
  ProcedureCategoryRecord,
  ProcedureCategoryRepository,
} from "../../domain/catalog/ProcedureCategoryRepository.js";

export interface CreateProcedureCategoryInput {
  name: string;
}

export class CreateProcedureCategory {
  constructor(private readonly categories: ProcedureCategoryRepository) {}

  async execute({ name }: CreateProcedureCategoryInput): Promise<ProcedureCategoryRecord> {
    const trimmed = name.trim();
    if (await this.categories.findByName(trimmed)) throw new CategoryNameTaken();
    return this.categories.create(trimmed);
  }
}
