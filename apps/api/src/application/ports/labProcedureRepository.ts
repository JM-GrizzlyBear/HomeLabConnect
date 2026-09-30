import type { LabProcedure, LabProcedureDetails } from "../../domain/catalog/labProcedure.js";
import type { ProcedureCategory } from "../../domain/catalog/procedureCategory.js";

/** A procedure with its category's name, for lists and detail pages. */
export interface LabProcedureRecord extends LabProcedure {
  category: ProcedureCategory;
  createdAt: Date;
  updatedAt: Date;
}

export interface LabProcedureListQuery {
  /** Matches code or name. */
  search: string | null;
  categoryId: string | null;
  isActive: boolean | null;
  page: number;
  pageSize: number;
}

export interface LabProcedureListPage {
  items: LabProcedureRecord[];
  total: number;
}

/** Port: the lab procedures patients book. */
export interface LabProcedureRepository {
  /** Sorted by category name, then procedure name. */
  list(query: LabProcedureListQuery): Promise<LabProcedureListPage>;
  findById(id: string): Promise<LabProcedureRecord | null>;
  /** Exact match on the normalised (uppercase) code. */
  findByCode(code: string): Promise<LabProcedure | null>;
  /** Case-insensitive. */
  findByName(name: string): Promise<LabProcedure | null>;
  /** Throws ProcedureCodeTaken or ProcedureNameTaken on a duplicate. */
  create(details: LabProcedureDetails): Promise<LabProcedureRecord>;
  /** Throws ProcedureCodeTaken or ProcedureNameTaken on a duplicate. */
  update(id: string, details: LabProcedureDetails): Promise<void>;
  setActive(id: string, isActive: boolean): Promise<void>;
}
