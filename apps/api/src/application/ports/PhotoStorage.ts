import type { PhotoType, StoredPhoto } from "../../domain/media/photo.js";

/** A photo as it arrives: raw bytes plus its (checked) type. */
export interface PhotoUpload {
  data: Uint8Array;
  mimeType: PhotoType;
}

/** What the photo is for. Profile photos become small squares. */
export type PhotoPurpose = "profile";

/** Port: where photos are kept (Cloudinary in production, a local folder in development). */
export interface PhotoStorage {
  save(photo: PhotoUpload, purpose: PhotoPurpose): Promise<StoredPhoto>;
  /** Deleting a photo that's already gone is fine. */
  delete(storageKey: string): Promise<void>;
}
