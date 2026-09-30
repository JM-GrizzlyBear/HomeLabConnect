import { type Profile, profileSchema, type UpdateProfileRequest } from "@homelabconnect/shared";
import { apiRequest } from "./apiClient";

export async function fetchProfile(token: string, signal?: AbortSignal): Promise<Profile> {
  return profileSchema.parse(await apiRequest("/users/me/profile", { token, signal }));
}

export async function updateProfile(
  token: string,
  request: UpdateProfileRequest,
): Promise<Profile> {
  return profileSchema.parse(
    await apiRequest("/users/me/profile", { method: "PATCH", body: request, token }),
  );
}
