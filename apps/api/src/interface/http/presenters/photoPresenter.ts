import type { ProfilePhoto } from "@homelabconnect/shared";
import type { ProfilePhotoOutput } from "../../../application/identity/SetProfilePhoto.js";
import type { HttpResponse } from "../httpTypes.js";

export function presentProfilePhoto(output: ProfilePhotoOutput): HttpResponse<ProfilePhoto> {
  return { status: 200, body: { photoUrl: output.photoUrl } };
}
