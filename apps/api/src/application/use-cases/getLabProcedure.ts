import { ProcedureNotFound } from "../../domain/catalog/catalogErrors.js";
import type { Clock } from "../ports/clock.js";
import type { LabProcedureRepository } from "../ports/labProcedureRepository.js";
import type { PromotionRepository } from "../ports/promotionRepository.js";
import { type PricedProcedure, priceProcedures } from "./priceProcedures.js";

export interface GetLabProcedureInput {
  id: string;
  /** Only people who manage the catalogue see inactive procedures. */
  includeInactive: boolean;
}

/** One procedure with today's sale price, if any. */
export class GetLabProcedure {
  constructor(
    private readonly procedures: LabProcedureRepository,
    private readonly promotions: PromotionRepository,
    private readonly clock: Clock,
  ) {}

  async execute({ id, includeInactive }: GetLabProcedureInput): Promise<PricedProcedure> {
    const procedure = await this.procedures.findById(id);
    if (!procedure || (!procedure.isActive && !includeInactive)) throw new ProcedureNotFound();
    const [priced] = await priceProcedures([procedure], this.promotions, this.clock);
    if (!priced) throw new ProcedureNotFound();
    return priced;
  }
}
