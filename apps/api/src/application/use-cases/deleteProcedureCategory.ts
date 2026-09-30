import { CategoryNotFound } from "../../domain/catalog/catalogErrors.js";
import { assertCategoryEmpty } from "../../domain/catalog/procedureCategory.js";
import type { ProcedureCategoryRepository } from "../ports/procedureCategoryRepository.js";

export interface DeleteProcedureCategoryInput {
  id: string;
}

/** Deletes a category that holds no procedures. */
export class DeleteProcedureCategory {
  constructor(private readonly categories: ProcedureCategoryRepository) {}

  async execute({ id }: DeleteProcedureCategoryInput): Promise<void> {
    const category = await this.categories.findById(id);
    if (!category) throw new CategoryNotFound();
    assertCategoryEmpty(category.procedureCount);
    await this.categories.delete(id);
  }
}
