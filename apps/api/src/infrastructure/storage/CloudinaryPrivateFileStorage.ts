import { randomUUID } from "node:crypto";
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import type { FileUpload } from "../../application/ports/FileStorage.js";
import type {
  FileDelivery,
  PrivateFileStorage,
} from "../../application/ports/PrivateFileStorage.js";
import type { CloudinaryConfig } from "./CloudinaryPhotoStorage.js";

/** How long a download link works once handed out. */
const LINK_SECONDS = 5 * 60;

const FORMATS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

/**
 * Keeps private files in Cloudinary as "authenticated" assets: they have no public link, and
 * each download link is signed and expires after a few minutes.
 */
export class CloudinaryPrivateFileStorage implements PrivateFileStorage {
  private readonly folder: string;

  constructor(config: CloudinaryConfig) {
    cloudinary.config({
      cloud_name: config.cloudName,
      api_key: config.apiKey,
      api_secret: config.apiSecret,
      secure: true,
    });
    this.folder = `${config.folder}/results`;
  }

  async save(file: FileUpload): Promise<{ storageKey: string }> {
    const uploaded = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          public_id: `${this.folder}/${randomUUID()}`,
          asset_folder: this.folder,
          resource_type: "image",
          type: "authenticated",
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
    return { storageKey: uploaded.public_id };
  }

  async delete(storageKey: string): Promise<void> {
    // Only ever delete inside our own folder
    if (!storageKey.startsWith(`${this.folder}/`)) return;
    const result: { result?: string } = await cloudinary.uploader.destroy(storageKey, {
      resource_type: "image",
      type: "authenticated",
      invalidate: true,
    });
    if (result.result !== "ok" && result.result !== "not found") {
      throw new Error(`Cloudinary delete failed: ${result.result ?? "unknown"}.`);
    }
  }

  async open(storageKey: string, file: { mimeType: string }): Promise<FileDelivery> {
    const url = cloudinary.utils.private_download_url(storageKey, FORMATS[file.mimeType] ?? "pdf", {
      resource_type: "image",
      type: "authenticated",
      expires_at: Math.floor(Date.now() / 1000) + LINK_SECONDS,
    });
    return { kind: "redirect", url };
  }
}
