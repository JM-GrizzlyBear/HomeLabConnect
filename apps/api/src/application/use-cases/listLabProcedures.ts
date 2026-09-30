import type {
  LabProcedureRecord,
  LabProcedureRepository,
} from "../ports/labProcedureRepository.js";

export interface ListLabProceduresInput {
  search: string | null;
  categoryId: string | null;
  isActive: boolean | null;
  /** Only people who manage the catalogue see inactive procedures. */
  includeInactive: boolean;
  page: number;
  pageSize: number;
}

export interface ListLabProceduresOutput {
  items: LabProcedureRecord[];
  total: number;
  page: number;
  pageSize: number;
}

/** The catalogue: everyone sees active procedures; managers can filter by status. */
export class ListLabProcedures {
  constructor(private readonly procedures: LabProcedureRepository) {}

  async execute({
    includeInactive,
    ...input
  }: ListLabProceduresInput): Promise<ListLabProceduresOutput> {
    const { items, total } = await this.procedures.list({
      ...input,
      search: input.search?.trim() || null,
      isActive: includeInactive ? input.isActive : true,
    });
    return { items, total, page: input.page, pageSize: input.pageSize };
  }
}
