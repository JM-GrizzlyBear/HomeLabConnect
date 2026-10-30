import {
  type CreateStaffRequest,
  type ListUsersQuery,
  type PermissionOverrideView,
  type UpdateUserRequest,
  type UserPermissions,
  userPermissionsSchema,
  type TemporaryPasswordResponse,
  temporaryPasswordResponseSchema,
  type UserList,
  userListSchema,
  type UserSummary,
  userSummarySchema,
} from "@homelabconnect/shared";
import { apiRequest } from "./apiClient";

export async function fetchUsers(query: ListUsersQuery, signal?: AbortSignal): Promise<UserList> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  const search = params.size > 0 ? `?${params}` : "";
  return userListSchema.parse(await apiRequest(`/users${search}`, { signal }));
}

export async function createStaff(request: CreateStaffRequest): Promise<TemporaryPasswordResponse> {
  return temporaryPasswordResponseSchema.parse(
    await apiRequest("/users/staff", { method: "POST", body: request }),
  );
}

export async function setUserStatus(userId: string, isActive: boolean): Promise<UserSummary> {
  return userSummarySchema.parse(
    await apiRequest(`/users/${userId}/status`, { method: "PATCH", body: { isActive } }),
  );
}

export async function reissueTemporaryPassword(userId: string): Promise<TemporaryPasswordResponse> {
  return temporaryPasswordResponseSchema.parse(
    await apiRequest(`/users/${userId}/temporary-password`, { method: "POST" }),
  );
}

/** Where the "Export CSV" link points, with the same filters as the list. */
export function usersExportUrl(query: Omit<ListUsersQuery, "page" | "pageSize">): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  return `/api/users/export${params.size > 0 ? `?${params}` : ""}`;
}

export async function updateUser(userId: string, changes: UpdateUserRequest): Promise<UserSummary> {
  return userSummarySchema.parse(
    await apiRequest(`/users/${userId}`, { method: "PATCH", body: changes }),
  );
}

export async function fetchUserPermissions(
  userId: string,
  signal?: AbortSignal,
): Promise<UserPermissions> {
  return userPermissionsSchema.parse(await apiRequest(`/users/${userId}/permissions`, { signal }));
}

export async function setUserOverrides(
  userId: string,
  overrides: PermissionOverrideView[],
): Promise<UserPermissions> {
  return userPermissionsSchema.parse(
    await apiRequest(`/users/${userId}/permissions`, { method: "PUT", body: { overrides } }),
  );
}
