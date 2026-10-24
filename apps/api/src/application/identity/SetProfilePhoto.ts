import { UserNotFound } from "../../domain/identity/identityErrors.js";
import type { UserRepository } from "../../domain/identity/UserRepository.js";
import { InvalidPhoto } from "../../domain/media/mediaErrors.js";
import { detectPhotoType, PROFILE_PHOTO_MAX_BYTES } from "../../domain/media/photo.js";
import type { PhotoStorage } from "../ports/PhotoStorage.js";

export interface SetProfilePhotoInput {
  userId: string;
  data: Uint8Array;
}

export interface ProfilePhotoOutput {
  photoUrl: string | null;
}

/** Anyone signed in sets or replaces their own profile photo. The old one is deleted. */
export class SetProfilePhoto {
  constructor(
    private readonly users: UserRepository,
    private readonly photos: PhotoStorage,
  ) {}

  async execute({ userId, data }: SetProfilePhotoInput): Promise<ProfilePhotoOutput> {
    if (data.byteLength > PROFILE_PHOTO_MAX_BYTES) {
      throw new InvalidPhoto("The photo must be 2 MB or smaller.");
    }
    // Trust the file's first bytes, not the type the browser claims
    const mimeType = detectPhotoType(data);
    if (!mimeType) throw new InvalidPhoto();

    const user = await this.users.findById(userId);
    if (!user) throw new UserNotFound();

    const previousKey = user.photoStorageKey;
    const stored = await this.photos.save({ data, mimeType }, "profile");
    await this.users.setPhoto(userId, stored);
    if (previousKey) await this.photos.delete(previousKey);
    return { photoUrl: stored.url };
  }
}
