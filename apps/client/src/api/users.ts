import {
  type CreateStaffRequest,
  type ListUsersQuery,
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
