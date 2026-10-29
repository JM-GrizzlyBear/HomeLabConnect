import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type { FileUpload } from "../../application/ports/FileStorage.js";
import type {
  FileDelivery,
  PrivateFileStorage,
} from "../../application/ports/PrivateFileStorage.js";

/**
 * Keeps private files in a folder the app never serves directly (development and tests): each
 * one is read and sent only after the access check.
 */
export class LocalPrivateFileStorage implements PrivateFileStorage {
  constructor(private readonly directory: string) {}

  async save(file: FileUpload): Promise<{ storageKey: string }> {
    const storageKey = randomUUID();
    await mkdir(this.directory, { recursive: true });
    await writeFile(this.pathOf(storageKey), file.data);
    return { storageKey };
  }

  async delete(storageKey: string): Promise<void> {
    await rm(this.pathOf(storageKey), { force: true });
  }

  async open(
    storageKey: string,
    file: { mimeType: string; filename: string },
  ): Promise<FileDelivery> {
    const data = new Uint8Array(await readFile(this.pathOf(storageKey)));
    return { kind: "content", data, ...file };
  }

  /** basename() blocks paths like "../../secret", so only files in our folder are touched. */
  private pathOf(storageKey: string): string {
    return path.join(this.directory, path.basename(storageKey));
  }
}
