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

export async function fetchRoles(token: string, signal?: AbortSignal): Promise<RoleList> {
  return roleListSchema.parse(await apiRequest("/roles", { token, signal }));
}

export async function fetchRole(
  token: string,
  id: string,
  signal?: AbortSignal,
): Promise<CustomRole> {
  return customRoleSchema.parse(await apiRequest(`/roles/${id}`, { token, signal }));
}

export async function createRole(
  token: string,
  request: CreateCustomRoleRequest,
): Promise<CustomRole> {
  return customRoleSchema.parse(
    await apiRequest("/roles", { method: "POST", body: request, token }),
  );
}

export async function updateRole(
  token: string,
  id: string,
  request: UpdateCustomRoleRequest,
): Promise<CustomRole> {
  return customRoleSchema.parse(
    await apiRequest(`/roles/${id}`, { method: "PUT", body: request, token }),
  );
}

export async function deleteRole(token: string, id: string): Promise<void> {
  await apiRequest(`/roles/${id}`, { method: "DELETE", token });
}

export async function assignRole(
  token: string,
  userId: string,
  customRoleId: string | null,
): Promise<UserSummary> {
  return userSummarySchema.parse(
    await apiRequest(`/users/${userId}/role`, { method: "PUT", body: { customRoleId }, token }),
  );
}
