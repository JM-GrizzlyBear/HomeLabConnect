import { randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type { PhotoStorage, PhotoUpload } from "../../application/ports/PhotoStorage.js";
import type { StoredPhoto } from "../../domain/media/photo.js";

const EXTENSIONS: Record<PhotoUpload["mimeType"], string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

/** Keeps photos in a folder on this machine (development and tests), served at `publicPath`. */
export class LocalPhotoStorage implements PhotoStorage {
  constructor(
    private readonly directory: string,
    private readonly publicPath = "/api/uploads",
  ) {}

  async save(photo: PhotoUpload): Promise<StoredPhoto> {
    // A random name: nobody can guess other photos, and two uploads never collide
    const storageKey = `${randomUUID()}${EXTENSIONS[photo.mimeType]}`;
    await mkdir(this.directory, { recursive: true });
    await writeFile(path.join(this.directory, storageKey), photo.data);
    return { storageKey, url: `${this.publicPath}/${storageKey}` };
  }

  async delete(storageKey: string): Promise<void> {
    // basename() blocks paths like "../../secret", so only files in our folder can be deleted
    await rm(path.join(this.directory, path.basename(storageKey)), { force: true });
  }
}
