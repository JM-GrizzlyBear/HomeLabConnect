import { randomUUID } from "node:crypto";
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import type {
  PhotoPurpose,
  PhotoStorage,
  PhotoUpload,
} from "../../application/ports/PhotoStorage.js";
import type { StoredPhoto } from "../../domain/media/photo.js";

export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  /** Folder inside the Cloudinary media library. */
  folder: string;
}

/**
 * Reads the "API environment variable" from the Cloudinary dashboard:
 * cloudinary://<api key>:<api secret>@<cloud name>
 */
export function parseCloudinaryUrl(value: string): Omit<CloudinaryConfig, "folder"> {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("CLOUDINARY_URL is not a valid URL.");
  }
  const apiKey = decodeURIComponent(url.username);
  const apiSecret = decodeURIComponent(url.password);
  const cloudName = url.hostname;
  // "<your_api_key>" left in from Cloudinary's example counts as missing
  const isPlaceholder = /[<>]/.test(`${apiKey}${apiSecret}${cloudName}`);
  if (url.protocol !== "cloudinary:" || !apiKey || !apiSecret || !cloudName || isPlaceholder) {
    throw new Error("CLOUDINARY_URL should look like cloudinary://API_KEY:API_SECRET@CLOUD_NAME.");
  }
  return { cloudName, apiKey, apiSecret };
}

/** Keeps photos in Cloudinary, so they survive restarts and redeploys (Render's disk doesn't). */
export class CloudinaryPhotoStorage implements PhotoStorage {
  private readonly folder: string;

  constructor(config: CloudinaryConfig) {
    cloudinary.config({
      cloud_name: config.cloudName,
      api_key: config.apiKey,
      api_secret: config.apiSecret,
      secure: true, // always https links
    });
    this.folder = config.folder;
  }

  async save(photo: PhotoUpload, purpose: PhotoPurpose): Promise<StoredPhoto> {
    const folder = `${this.folder}/${purpose}`;
    // A random name: nobody can guess other photos, and two uploads never collide
    const publicId = `${folder}/${randomUUID()}`;

    const uploaded = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          public_id: publicId,
          asset_folder: folder, // shows the photos in this folder in the dashboard
          resource_type: "image",
          allowed_formats: ["jpg", "png", "webp"],
          overwrite: false,
        },
        (error, result) => {
          if (error || !result) reject(new Error(error?.message ?? "Cloudinary upload failed."));
          else resolve(result);
        },
      );
      stream.end(Buffer.from(photo.data));
    });

    // The link the browser loads: a 400×400 square centred on the face, in the best
    // format and quality for each browser. Resized copies leave out hidden data such as GPS.
    const url = cloudinary.url(uploaded.public_id, {
      secure: true,
      version: uploaded.version,
      urlAnalytics: false, // a clean link, without Cloudinary's tracking parameter
      transformation: [
        { width: 400, height: 400, crop: "fill", gravity: "face" },
        { fetch_format: "auto", quality: "auto" },
      ],
    });

    return { storageKey: uploaded.public_id, url };
  }

  async delete(storageKey: string): Promise<void> {
    // Only ever delete inside our own folder
    if (!storageKey.startsWith(`${this.folder}/`)) return;

    const result: { result?: string } = await cloudinary.uploader.destroy(storageKey, {
      resource_type: "image",
      invalidate: true,
    });
    // "not found" is fine: the photo is already gone
    if (result.result !== "ok" && result.result !== "not found") {
      throw new Error(`Cloudinary delete failed: ${result.result ?? "unknown"}.`);
    }
  }
}
