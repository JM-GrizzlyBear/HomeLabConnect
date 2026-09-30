import type { ProcedureCategory } from "../../domain/catalog/procedureCategory.js";

export interface ProcedureCategoryRecord extends ProcedureCategory {
  /** Active and inactive procedures in the category. */
  procedureCount: number;
}

/** Port: the categories procedures are grouped in. */
export interface ProcedureCategoryRepository {
  /** Sorted by name. */
  list(): Promise<ProcedureCategoryRecord[]>;
  findById(id: string): Promise<ProcedureCategoryRecord | null>;
  /** Case-insensitive. */
  findByName(name: string): Promise<ProcedureCategory | null>;
  /** Throws CategoryNameTaken on a duplicate name. */
  create(name: string): Promise<ProcedureCategoryRecord>;
  /** Throws CategoryNameTaken on a duplicate name. */
  rename(id: string, name: string): Promise<void>;
  delete(id: string): Promise<void>;
}
