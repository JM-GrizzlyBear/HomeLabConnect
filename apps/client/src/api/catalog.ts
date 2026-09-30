import {
  type LabProcedure,
  type LabProcedureList,
  labProcedureListSchema,
  type LabProcedureRequest,
  labProcedureSchema,
  type ListLabProceduresQuery,
  type ProcedureCategory,
  procedureCategoryListSchema,
  procedureCategorySchema,
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

export async function fetchProcedures(
  token: string,
  query: ListLabProceduresQuery,
  signal?: AbortSignal,
): Promise<LabProcedureList> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  const search = params.size > 0 ? `?${params}` : "";
  return labProcedureListSchema.parse(
    await apiRequest(`/catalog/procedures${search}`, { token, signal }),
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
