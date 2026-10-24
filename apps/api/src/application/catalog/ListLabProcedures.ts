import type { Clock } from "../ports/Clock.js";
import type { LabProcedureRepository } from "../../domain/catalog/LabProcedureRepository.js";
import type { PromotionRepository } from "../../domain/catalog/PromotionRepository.js";
import { type PricedProcedure, priceProcedures } from "./priceProcedures.js";

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
  items: PricedProcedure[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * The catalogue with today's sale prices: everyone sees active procedures;
 * managers can filter by status.
 */
export class ListLabProcedures {
  constructor(
    private readonly procedures: LabProcedureRepository,
    private readonly promotions: PromotionRepository,
    private readonly clock: Clock,
  ) {}

  async execute({
    includeInactive,
    ...input
  }: ListLabProceduresInput): Promise<ListLabProceduresOutput> {
    const { items, total } = await this.procedures.list({
      ...input,
      search: input.search?.trim() || null,
      isActive: includeInactive ? input.isActive : true,
    });
    return {
      items: await priceProcedures(items, this.promotions, this.clock),
      total,
      page: input.page,
      pageSize: input.pageSize,
    };
  }
}
