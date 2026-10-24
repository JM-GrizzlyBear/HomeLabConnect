import { CategoryNameTaken, CategoryNotFound } from "../../domain/catalog/catalogErrors.js";
import type {
  ProcedureCategoryRecord,
  ProcedureCategoryRepository,
} from "../../domain/catalog/ProcedureCategoryRepository.js";

export interface RenameProcedureCategoryInput {
  id: string;
  name: string;
}

export class RenameProcedureCategory {
  constructor(private readonly categories: ProcedureCategoryRepository) {}

  async execute({ id, name }: RenameProcedureCategoryInput): Promise<ProcedureCategoryRecord> {
    const category = await this.categories.findById(id);
    if (!category) throw new CategoryNotFound();
    const trimmed = name.trim();
    const sameName = await this.categories.findByName(trimmed);
    if (sameName && sameName.id !== id) throw new CategoryNameTaken();

    await this.categories.rename(id, trimmed);
    return { ...category, name: trimmed };
  }
}
