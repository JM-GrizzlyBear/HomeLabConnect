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

export async function fetchCategories(
  token: string,
  signal?: AbortSignal,
): Promise<ProcedureCategory[]> {
  return procedureCategoryListSchema.parse(
    await apiRequest("/catalog/categories", { token, signal }),
  );
}

export async function createCategory(token: string, name: string): Promise<ProcedureCategory> {
  return procedureCategorySchema.parse(
    await apiRequest("/catalog/categories", { method: "POST", body: { name }, token }),
  );
}

export async function renameCategory(
  token: string,
  id: string,
  name: string,
): Promise<ProcedureCategory> {
  return procedureCategorySchema.parse(
    await apiRequest(`/catalog/categories/${id}`, { method: "PUT", body: { name }, token }),
  );
}

export async function deleteCategory(token: string, id: string): Promise<void> {
  await apiRequest(`/catalog/categories/${id}`, { method: "DELETE", token });
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
  token: string,
  query: ListLabProceduresQuery,
  signal?: AbortSignal,
): Promise<LabProcedureList> {
  return labProcedureListSchema.parse(
    await apiRequest(`/catalog/procedures${queryString(query)}`, { token, signal }),
  );
}

export async function fetchPromotions(
  token: string,
  query: ListPromotionsQuery,
  signal?: AbortSignal,
): Promise<Promotion[]> {
  return promotionListSchema.parse(
    await apiRequest(`/catalog/promotions${queryString(query)}`, { token, signal }),
  );
}

export async function fetchPromotion(
  token: string,
  id: string,
  signal?: AbortSignal,
): Promise<Promotion> {
  return promotionSchema.parse(await apiRequest(`/catalog/promotions/${id}`, { token, signal }));
}

export async function createPromotion(
  token: string,
  request: PromotionRequest,
): Promise<Promotion> {
  return promotionSchema.parse(
    await apiRequest("/catalog/promotions", { method: "POST", body: request, token }),
  );
}

export async function updatePromotion(
  token: string,
  id: string,
  request: PromotionRequest,
): Promise<Promotion> {
  return promotionSchema.parse(
    await apiRequest(`/catalog/promotions/${id}`, { method: "PUT", body: request, token }),
  );
}

export async function setPromotionStatus(
  token: string,
  id: string,
  isActive: boolean,
): Promise<Promotion> {
  return promotionSchema.parse(
    await apiRequest(`/catalog/promotions/${id}/status`, {
      method: "PATCH",
      body: { isActive },
      token,
    }),
  );
}

export async function fetchProcedure(
  token: string,
  id: string,
  signal?: AbortSignal,
): Promise<LabProcedure> {
  return labProcedureSchema.parse(await apiRequest(`/catalog/procedures/${id}`, { token, signal }));
}

export async function createProcedure(
  token: string,
  request: LabProcedureRequest,
): Promise<LabProcedure> {
  return labProcedureSchema.parse(
    await apiRequest("/catalog/procedures", { method: "POST", body: request, token }),
  );
}

export async function updateProcedure(
  token: string,
  id: string,
  request: LabProcedureRequest,
): Promise<LabProcedure> {
  return labProcedureSchema.parse(
    await apiRequest(`/catalog/procedures/${id}`, { method: "PUT", body: request, token }),
  );
}

export async function setProcedureStatus(
  token: string,
  id: string,
  isActive: boolean,
): Promise<LabProcedure> {
  return labProcedureSchema.parse(
    await apiRequest(`/catalog/procedures/${id}/status`, {
      method: "PATCH",
      body: { isActive },
      token,
    }),
  );
}
