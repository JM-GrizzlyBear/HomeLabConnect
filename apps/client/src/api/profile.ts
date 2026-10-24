import {
  type Profile,
  type ProfilePhoto,
  profilePhotoSchema,
  profileSchema,
  type UpdateProfileRequest,
} from "@homelabconnect/shared";
import { apiRequest } from "./apiClient";

export async function fetchProfile(signal?: AbortSignal): Promise<Profile> {
  return profileSchema.parse(await apiRequest("/users/me/profile", { signal }));
}

export async function updateProfile(request: UpdateProfileRequest): Promise<Profile> {
  return profileSchema.parse(
    await apiRequest("/users/me/profile", { method: "PATCH", body: request }),
  );
}

export async function uploadProfilePhoto(photo: File): Promise<ProfilePhoto> {
  const form = new FormData();
  form.append("photo", photo);
  return profilePhotoSchema.parse(
    await apiRequest("/users/me/photo", { method: "PUT", body: form }),
  );
}

export async function removeProfilePhoto(): Promise<ProfilePhoto> {
  return profilePhotoSchema.parse(await apiRequest("/users/me/photo", { method: "DELETE" }));
}
