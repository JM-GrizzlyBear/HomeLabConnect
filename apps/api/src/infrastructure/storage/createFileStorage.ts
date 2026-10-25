import path from "node:path";
import type { FileStorage } from "../../application/ports/FileStorage.js";
import type { Config } from "../config.js";
import { CloudinaryFileStorage } from "./CloudinaryFileStorage.js";
import { parseCloudinaryUrl } from "./CloudinaryPhotoStorage.js";
import { LocalFileStorage } from "./LocalFileStorage.js";

/** Same switch as photos: PHOTO_STORAGE=cloudinary → Cloudinary; "local" → uploads/attachments. */
export function createFileStorage(config: Config): FileStorage {
  if (config.photoStorage === "local") {
    return new LocalFileStorage(path.join(config.uploadsDir, "attachments"));
  }
  if (!config.cloudinaryUrl) {
    throw new Error("CLOUDINARY_URL is missing (needed when PHOTO_STORAGE=cloudinary).");
  }
  return new CloudinaryFileStorage({
    ...parseCloudinaryUrl(config.cloudinaryUrl),
    folder: config.cloudinaryFolder,
  });
}
