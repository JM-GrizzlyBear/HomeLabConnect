import { CategoryInUse } from "./catalogErrors.js";

/** A group of procedures shown together, e.g. "Hematology". */
export interface ProcedureCategory {
  id: string;
  name: string;
}

/** Business rule: a category that still holds procedures can't be deleted. */
export function assertCategoryEmpty(procedureCount: number): void {
  if (procedureCount > 0) throw new CategoryInUse(procedureCount);
}
