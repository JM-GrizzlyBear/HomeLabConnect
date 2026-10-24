import {
  type LabProcedure,
  type LabProcedureList,
  labProcedureListSchema,
  type LabProcedureRequest,
  labProcedureSchema,
  type ListLabProceduresQuery,
  type ListPromotionsQuery,
  type ProcedureCategory,
  procedureCategoryListSchema,
  procedureCategorySchema,
  type Promotion,
  promotionListSchema,
  type PromotionRequest,
  promotionSchema,
} from "@homelabconnect/shared";
import { apiRequest } from "./apiClient";

export async function fetchCategories(signal?: AbortSignal): Promise<ProcedureCategory[]> {
  return procedureCategoryListSchema.parse(await apiRequest("/catalog/categories", { signal }));
}

export async function createCategory(name: string): Promise<ProcedureCategory> {
  return procedureCategorySchema.parse(
    await apiRequest("/catalog/categories", { method: "POST", body: { name } }),
  );
}

export async function renameCategory(id: string, name: string): Promise<ProcedureCategory> {
  return procedureCategorySchema.parse(
    await apiRequest(`/catalog/categories/${id}`, { method: "PUT", body: { name } }),
  );
}

export async function deleteCategory(id: string): Promise<void> {
  await apiRequest(`/catalog/categories/${id}`, { method: "DELETE" });
}

/** "?a=1&b=2" from the defined, non-empty values, or "". */
function queryString(query: object): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  return params.size > 0 ? `?${params}` : "";
}

export async function fetchProcedures(
  query: ListLabProceduresQuery,
  signal?: AbortSignal,
): Promise<LabProcedureList> {
  return labProcedureListSchema.parse(
    await apiRequest(`/catalog/procedures${queryString(query)}`, { signal }),
  );
}

export async function fetchPromotions(
  query: ListPromotionsQuery,
  signal?: AbortSignal,
): Promise<Promotion[]> {
  return promotionListSchema.parse(
    await apiRequest(`/catalog/promotions${queryString(query)}`, { signal }),
  );
}

export async function fetchPromotion(id: string, signal?: AbortSignal): Promise<Promotion> {
  return promotionSchema.parse(await apiRequest(`/catalog/promotions/${id}`, { signal }));
}

export async function createPromotion(request: PromotionRequest): Promise<Promotion> {
  return promotionSchema.parse(
    await apiRequest("/catalog/promotions", { method: "POST", body: request }),
  );
}

export async function updatePromotion(id: string, request: PromotionRequest): Promise<Promotion> {
  return promotionSchema.parse(
    await apiRequest(`/catalog/promotions/${id}`, { method: "PUT", body: request }),
  );
}

export async function setPromotionStatus(id: string, isActive: boolean): Promise<Promotion> {
  return promotionSchema.parse(
    await apiRequest(`/catalog/promotions/${id}/status`, {
      method: "PATCH",
      body: { isActive },
    }),
  );
}

export async function fetchProcedure(id: string, signal?: AbortSignal): Promise<LabProcedure> {
  return labProcedureSchema.parse(await apiRequest(`/catalog/procedures/${id}`, { signal }));
}

export async function createProcedure(request: LabProcedureRequest): Promise<LabProcedure> {
  return labProcedureSchema.parse(
    await apiRequest("/catalog/procedures", { method: "POST", body: request }),
  );
}

export async function updateProcedure(
  id: string,
  request: LabProcedureRequest,
): Promise<LabProcedure> {
  return labProcedureSchema.parse(
    await apiRequest(`/catalog/procedures/${id}`, { method: "PUT", body: request }),
  );
}

export async function setProcedureStatus(id: string, isActive: boolean): Promise<LabProcedure> {
  return labProcedureSchema.parse(
    await apiRequest(`/catalog/procedures/${id}/status`, {
      method: "PATCH",
      body: { isActive },
    }),
  );
}
