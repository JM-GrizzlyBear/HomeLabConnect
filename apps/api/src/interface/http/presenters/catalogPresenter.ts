import type {
  LabProcedure,
  LabProcedureList,
  ProcedureCategory,
  Promotion,
} from "@homelabconnect/shared";
import type { LabProcedureRecord } from "../../../application/ports/labProcedureRepository.js";
import type { ProcedureCategoryRecord } from "../../../application/ports/procedureCategoryRepository.js";
import type { ListLabProceduresOutput } from "../../../application/use-cases/listLabProcedures.js";
import type { PricedProcedure } from "../../../application/use-cases/priceProcedures.js";
import type { PromotionOutput } from "../../../application/use-cases/promotionOutput.js";
import type { HttpResponse } from "../httpTypes.js";

function toCategory(category: ProcedureCategoryRecord): ProcedureCategory {
  return { id: category.id, name: category.name, procedureCount: category.procedureCount };
}

/** A procedure without `promotion` (e.g. right after saving it) is shown at its list price. */
function toProcedure(procedure: LabProcedureRecord & Partial<PricedProcedure>): LabProcedure {
  return {
    id: procedure.id,
    code: procedure.code,
    name: procedure.name,
    category: { id: procedure.category.id, name: procedure.category.name },
    priceCentavos: procedure.priceCentavos,
    specimen: procedure.specimen,
    turnaroundHours: procedure.turnaroundHours,
    fastingHours: procedure.fastingHours,
    preparation: procedure.preparation,
    description: procedure.description,
    isActive: procedure.isActive,
    promotion: procedure.promotion ?? null,
    createdAt: procedure.createdAt.toISOString(),
    updatedAt: procedure.updatedAt.toISOString(),
  };
}

function toPromotion(promotion: PromotionOutput): Promotion {
  return {
    id: promotion.id,
    name: promotion.name,
    description: promotion.description,
    discountType: promotion.discountType,
    value: promotion.value,
    startsOn: promotion.startsOn,
    endsOn: promotion.endsOn,
    appliesTo: promotion.appliesTo,
    procedureIds: promotion.procedureIds,
    isActive: promotion.isActive,
    status: promotion.status,
    createdAt: promotion.createdAt.toISOString(),
    updatedAt: promotion.updatedAt.toISOString(),
  };
}

export function presentPromotion(
  promotion: PromotionOutput,
  status = 200,
): HttpResponse<Promotion> {
  return { status, body: toPromotion(promotion) };
}

export function presentPromotionList(promotions: PromotionOutput[]): HttpResponse<Promotion[]> {
  return { status: 200, body: promotions.map(toPromotion) };
}

export function presentCategory(
  category: ProcedureCategoryRecord,
  status = 200,
): HttpResponse<ProcedureCategory> {
  return { status, body: toCategory(category) };
}

export function presentCategoryList(
  categories: ProcedureCategoryRecord[],
): HttpResponse<ProcedureCategory[]> {
  return { status: 200, body: categories.map(toCategory) };
}

export function presentProcedure(
  procedure: LabProcedureRecord & Partial<PricedProcedure>,
  status = 200,
): HttpResponse<LabProcedure> {
  return { status, body: toProcedure(procedure) };
}

export function presentProcedureList(
  output: ListLabProceduresOutput,
): HttpResponse<LabProcedureList> {
  return {
    status: 200,
    body: {
      items: output.items.map(toProcedure),
      total: output.total,
      page: output.page,
      pageSize: output.pageSize,
    },
  };
}
