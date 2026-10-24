import { UserNotFound } from "../../domain/identity/identityErrors.js";
import type { UserRepository } from "../../domain/identity/UserRepository.js";
import type { PhotoStorage } from "../ports/PhotoStorage.js";
import type { ProfilePhotoOutput } from "./SetProfilePhoto.js";

export interface RemoveProfilePhotoInput {
  userId: string;
}

/** Removes the signed-in user's profile photo, from the profile and from storage. */
export class RemoveProfilePhoto {
  constructor(
    private readonly users: UserRepository,
    private readonly photos: PhotoStorage,
  ) {}

  async execute({ userId }: RemoveProfilePhotoInput): Promise<ProfilePhotoOutput> {
    const user = await this.users.findById(userId);
    if (!user) throw new UserNotFound();

    const previousKey = user.photoStorageKey;
    await this.users.setPhoto(userId, null);
    if (previousKey) await this.photos.delete(previousKey);
    return { photoUrl: null };
  }
}
