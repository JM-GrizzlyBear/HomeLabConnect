import {
  type ChangePasswordRequest,
  type CurrentUser,
  currentUserSchema,
  type LoginRequest,
  type LoginResponse,
  loginResponseSchema,
  type RegisterPatientRequest,
  type SessionUser,
  sessionUserSchema,
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

export async function fetchCurrentUser(signal?: AbortSignal): Promise<SessionUser> {
  return sessionUserSchema.parse(await apiRequest("/auth/me", { signal }));
}

export async function changePassword(request: ChangePasswordRequest): Promise<SessionUser> {
  return sessionUserSchema.parse(
    await apiRequest("/auth/password", { method: "PUT", body: request }),
  );
}

export async function logout(): Promise<void> {
  await apiRequest("/auth/logout", { method: "POST" });
}
