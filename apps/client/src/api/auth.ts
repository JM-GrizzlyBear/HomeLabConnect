import {
  type ChangePasswordRequest,
  type CurrentUser,
  currentUserSchema,
  type LoginRequest,
  type LoginResponse,
  loginResponseSchema,
  type RegisterPatientRequest,
} from "@homelabconnect/shared";
import { apiRequest } from "./apiClient";

export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  return loginResponseSchema.parse(
    await apiRequest("/auth/login", { method: "POST", body: credentials }),
  );
}

export async function register(request: RegisterPatientRequest): Promise<CurrentUser> {
  return currentUserSchema.parse(
    await apiRequest("/auth/register", { method: "POST", body: request }),
  );
}

export async function fetchCurrentUser(token: string, signal?: AbortSignal): Promise<CurrentUser> {
  return currentUserSchema.parse(await apiRequest("/auth/me", { token, signal }));
}

export async function changePassword(
  token: string,
  request: ChangePasswordRequest,
): Promise<CurrentUser> {
  return currentUserSchema.parse(
    await apiRequest("/auth/password", { method: "PUT", body: request, token }),
  );
}

export async function logout(token: string): Promise<void> {
  await apiRequest("/auth/logout", { method: "POST", token });
}
