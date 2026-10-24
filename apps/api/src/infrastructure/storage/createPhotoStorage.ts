import type { PhotoStorage } from "../../application/ports/PhotoStorage.js";
import type { Config } from "../config.js";
import { CloudinaryPhotoStorage, parseCloudinaryUrl } from "./CloudinaryPhotoStorage.js";
import { LocalPhotoStorage } from "./LocalPhotoStorage.js";

/** PHOTO_STORAGE=cloudinary → Cloudinary; "local" (the default) → the uploads folder. */
export function createPhotoStorage(config: Config): PhotoStorage {
  if (config.photoStorage === "local") return new LocalPhotoStorage(config.uploadsDir);

  if (!config.cloudinaryUrl) {
    throw new Error("CLOUDINARY_URL is missing (needed when PHOTO_STORAGE=cloudinary).");
  }
  return new CloudinaryPhotoStorage({
    ...parseCloudinaryUrl(config.cloudinaryUrl),
    folder: config.cloudinaryFolder,
  });
}
