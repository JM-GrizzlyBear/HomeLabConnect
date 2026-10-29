import path from "node:path";
import type { PrivateFileStorage } from "../../application/ports/PrivateFileStorage.js";
import type { Config } from "../config.js";
import { CloudinaryPrivateFileStorage } from "./CloudinaryPrivateFileStorage.js";
import { parseCloudinaryUrl } from "./CloudinaryPhotoStorage.js";
import { LocalPrivateFileStorage } from "./LocalPrivateFileStorage.js";

/**
 * Same switch as photos: PHOTO_STORAGE=cloudinary → Cloudinary (authenticated assets);
 * "local" → apps/api/private-uploads/results, a folder the app never serves directly.
 */
export function createPrivateFileStorage(config: Config): PrivateFileStorage {
  if (config.photoStorage === "local") {
    return new LocalPrivateFileStorage(
      path.join(config.uploadsDir, "..", "private-uploads", "results"),
    );
  }
  if (!config.cloudinaryUrl) {
    throw new Error("CLOUDINARY_URL is missing (needed when PHOTO_STORAGE=cloudinary).");
  }
  return new CloudinaryPrivateFileStorage({
    ...parseCloudinaryUrl(config.cloudinaryUrl),
    folder: config.cloudinaryFolder,
  });
}
