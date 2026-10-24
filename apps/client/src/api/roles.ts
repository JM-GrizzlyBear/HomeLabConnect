import {
  type CreateCustomRoleRequest,
  type CustomRole,
  customRoleSchema,
  type RoleList,
  roleListSchema,
  type UpdateCustomRoleRequest,
  type UserSummary,
  userSummarySchema,
} from "@homelabconnect/shared";
import { apiRequest } from "./apiClient";

export async function fetchRoles(signal?: AbortSignal): Promise<RoleList> {
  return roleListSchema.parse(await apiRequest("/roles", { signal }));
}

export async function fetchRole(id: string, signal?: AbortSignal): Promise<CustomRole> {
  return customRoleSchema.parse(await apiRequest(`/roles/${id}`, { signal }));
}

export async function createRole(request: CreateCustomRoleRequest): Promise<CustomRole> {
  return customRoleSchema.parse(await apiRequest("/roles", { method: "POST", body: request }));
}

export async function updateRole(
  id: string,
  request: UpdateCustomRoleRequest,
): Promise<CustomRole> {
  return customRoleSchema.parse(await apiRequest(`/roles/${id}`, { method: "PUT", body: request }));
}

export async function deleteRole(id: string): Promise<void> {
  await apiRequest(`/roles/${id}`, { method: "DELETE" });
}

export async function assignRole(
  userId: string,
  customRoleId: string | null,
): Promise<UserSummary> {
  return userSummarySchema.parse(
    await apiRequest(`/users/${userId}/role`, { method: "PUT", body: { customRoleId } }),
  );
}
