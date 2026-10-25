import { randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type { FileStorage, FileUpload } from "../../application/ports/FileStorage.js";
import type { StoredPhoto } from "../../domain/media/photo.js";

const EXTENSIONS: Record<FileUpload["mimeType"], string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "application/pdf": ".pdf",
};

/** Keeps attachments in a folder on this machine (development and tests). */
export class LocalFileStorage implements FileStorage {
  constructor(
    private readonly directory: string,
    private readonly publicPath = "/api/uploads/attachments",
  ) {}

  async save(file: FileUpload): Promise<StoredPhoto> {
    const storageKey = `${randomUUID()}${EXTENSIONS[file.mimeType]}`;
    await mkdir(this.directory, { recursive: true });
    await writeFile(path.join(this.directory, storageKey), file.data);
    return { storageKey, url: `${this.publicPath}/${storageKey}` };
  }

  async delete(storageKey: string): Promise<void> {
    // basename() blocks paths like "../../secret", so only files in our folder can be deleted
    await rm(path.join(this.directory, path.basename(storageKey)), { force: true });
  }
}
