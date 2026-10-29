import type { FileUpload } from "./FileStorage.js";

/** How to hand a private file to someone allowed to see it. */
export type FileDelivery =
  | { kind: "redirect"; url: string }
  | { kind: "content"; data: Uint8Array; mimeType: string; filename: string };

/**
 * Port: files that must never have a public link (lab results). Each is only handed out after
 * an access check, as a link that expires within minutes or as the bytes themselves.
 */
export interface PrivateFileStorage {
  save(file: FileUpload): Promise<{ storageKey: string }>;
  /** Deleting a file that's already gone is fine. */
  delete(storageKey: string): Promise<void>;
  open(storageKey: string, file: { mimeType: string; filename: string }): Promise<FileDelivery>;
}
