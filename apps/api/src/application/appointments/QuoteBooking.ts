import { type AppointmentLine, totalsOf } from "../../domain/appointments/appointment.js";
import { InvalidBooking } from "../../domain/appointments/appointmentErrors.js";
import type { LabProcedureRepository } from "../../domain/catalog/LabProcedureRepository.js";
import type { PromotionRepository } from "../../domain/catalog/PromotionRepository.js";
import { priceProcedures } from "../catalog/priceProcedures.js";
import type { Clock } from "../ports/Clock.js";

export interface QuoteBookingInput {
  procedureIds: readonly string[];
}

export interface QuoteOutput {
  lines: AppointmentLine[];
  subtotalCentavos: number;
  discountCentavos: number;
  totalCentavos: number;
}

/** Today's price of each test, with the best running promotion. Only active tests can be booked. */
export class QuoteBooking {
  constructor(
    private readonly procedures: LabProcedureRepository,
    private readonly promotions: PromotionRepository,
    private readonly clock: Clock,
  ) {}

  async execute({ procedureIds }: QuoteBookingInput): Promise<QuoteOutput> {
    const ids = [...new Set(procedureIds)];
    if (ids.length === 0) throw new InvalidBooking("Choose at least one test.");
    if (ids.length > 20) throw new InvalidBooking("Book at most 20 tests in one visit.");

    const records = await Promise.all(ids.map(async (id) => await this.procedures.findById(id)));
    if (records.some((record) => !record?.isActive)) {
      throw new InvalidBooking("One of the chosen tests is no longer available.");
    }
    const priced = await priceProcedures(
      records.filter((record) => record !== null),
      this.promotions,
      this.clock,
    );
    const lines = priced.map((procedure) => ({
      procedureId: procedure.id,
      code: procedure.code,
      name: procedure.name,
      priceCentavos: procedure.priceCentavos,
      promotionId: procedure.promotion?.id ?? null,
      promotionName: procedure.promotion?.name ?? null,
      discountCentavos: procedure.promotion
        ? procedure.priceCentavos - procedure.promotion.discountedPriceCentavos
        : 0,
    }));
    return { lines, ...totalsOf(lines) };
  }
}
