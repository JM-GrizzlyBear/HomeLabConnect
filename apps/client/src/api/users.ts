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

export async function fetchUsers(
  token: string,
  query: ListUsersQuery,
  signal?: AbortSignal,
): Promise<UserList> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  const search = params.size > 0 ? `?${params}` : "";
  return userListSchema.parse(await apiRequest(`/users${search}`, { token, signal }));
}

export async function createStaff(
  token: string,
  request: CreateStaffRequest,
): Promise<TemporaryPasswordResponse> {
  return temporaryPasswordResponseSchema.parse(
    await apiRequest("/users/staff", { method: "POST", body: request, token }),
  );
}

export async function setUserStatus(
  token: string,
  userId: string,
  isActive: boolean,
): Promise<UserSummary> {
  return userSummarySchema.parse(
    await apiRequest(`/users/${userId}/status`, { method: "PATCH", body: { isActive }, token }),
  );
}

export async function reissueTemporaryPassword(
  token: string,
  userId: string,
): Promise<TemporaryPasswordResponse> {
  return temporaryPasswordResponseSchema.parse(
    await apiRequest(`/users/${userId}/temporary-password`, { method: "POST", token }),
  );
}
