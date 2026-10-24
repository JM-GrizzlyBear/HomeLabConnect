import type {
  ProcedureCategoryRecord,
  ProcedureCategoryRepository,
} from "../ports/procedureCategoryRepository.js";

export class ListProcedureCategories {
  constructor(private readonly categories: ProcedureCategoryRepository) {}

  async execute(): Promise<ProcedureCategoryRecord[]> {
    return this.categories.list();
  }
}
