import type { LabProcedure, LabProcedureList, ProcedureCategory } from "@homelabconnect/shared";
import type { LabProcedureRecord } from "../../../application/ports/labProcedureRepository.js";
import type { ProcedureCategoryRecord } from "../../../application/ports/procedureCategoryRepository.js";
import type { ListLabProceduresOutput } from "../../../application/use-cases/listLabProcedures.js";
import type { HttpResponse } from "../httpTypes.js";

function toCategory(category: ProcedureCategoryRecord): ProcedureCategory {
  return { id: category.id, name: category.name, procedureCount: category.procedureCount };
}

function toProcedure(procedure: LabProcedureRecord): LabProcedure {
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
    createdAt: procedure.createdAt.toISOString(),
    updatedAt: procedure.updatedAt.toISOString(),
  };
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
  procedure: LabProcedureRecord,
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
