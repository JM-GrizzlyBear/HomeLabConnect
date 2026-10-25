import type { AttachmentType, StoredPhoto } from "../../domain/media/photo.js";

/** A file as it arrives: raw bytes, its (checked) type and the name it had. */
export interface FileUpload {
  data: Uint8Array;
  mimeType: AttachmentType;
  filename: string;
}

/** Port: where attachments are kept (Cloudinary in production, a local folder in development). */
export interface FileStorage {
  save(file: FileUpload): Promise<StoredPhoto>;
  /** Deleting a file that's already gone is fine. */
  delete(storageKey: string): Promise<void>;
}
