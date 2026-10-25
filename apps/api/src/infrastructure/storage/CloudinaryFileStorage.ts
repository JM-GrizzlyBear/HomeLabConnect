import { randomUUID } from "node:crypto";
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import type { FileStorage, FileUpload } from "../../application/ports/FileStorage.js";
import type { StoredPhoto } from "../../domain/media/photo.js";
import type { CloudinaryConfig } from "./CloudinaryPhotoStorage.js";

/**
 * Keeps attachments (photos and PDFs) in Cloudinary, unchanged: no cropping, so a request form
 * stays readable. Cloudinary serves PDFs as "image" resources too.
 */
export class CloudinaryFileStorage implements FileStorage {
  private readonly folder: string;

  constructor(config: CloudinaryConfig) {
    cloudinary.config({
      cloud_name: config.cloudName,
      api_key: config.apiKey,
      api_secret: config.apiSecret,
      secure: true,
    });
    this.folder = `${config.folder}/attachments`;
  }

  async save(file: FileUpload): Promise<StoredPhoto> {
    const uploaded = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          // A random name: nobody can guess other files, and two uploads never collide
          public_id: `${this.folder}/${randomUUID()}`,
          asset_folder: this.folder,
          resource_type: "image",
          allowed_formats: ["jpg", "png", "webp", "pdf"],
          overwrite: false,
        },
        (error, result) => {
          if (error || !result) reject(new Error(error?.message ?? "Cloudinary upload failed."));
          else resolve(result);
        },
      );
      stream.end(Buffer.from(file.data));
    });
    return { storageKey: uploaded.public_id, url: uploaded.secure_url };
  }

  async delete(storageKey: string): Promise<void> {
    // Only ever delete inside our own folder
    if (!storageKey.startsWith(`${this.folder}/`)) return;
    const result: { result?: string } = await cloudinary.uploader.destroy(storageKey, {
      resource_type: "image",
      invalidate: true,
    });
    if (result.result !== "ok" && result.result !== "not found") {
      throw new Error(`Cloudinary delete failed: ${result.result ?? "unknown"}.`);
    }
  }
}
