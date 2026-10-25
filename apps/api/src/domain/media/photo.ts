/** Where a saved photo lives. */
export interface StoredPhoto {
  /** What the browser loads. */
  url: string;
  /** What's needed to delete it later. */
  storageKey: string;
}

export type PhotoType = "image/jpeg" | "image/png" | "image/webp";

export const PROFILE_PHOTO_MAX_BYTES = 2 * 1024 * 1024;

/**
 * The real type of a photo, from its first bytes, or null when it isn't a JPG, PNG or WebP.
 * The browser's word for a file's type can be faked (rename virus.exe to photo.jpg);
 * the signature every JPG, PNG and WebP starts with can't.
 */
export function detectPhotoType(data: Uint8Array): PhotoType | null {
  const startsWith = (bytes: number[], offset = 0) =>
    bytes.every((byte, i) => data[offset + i] === byte);

  if (startsWith([0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  // "RIFF" ....  "WEBP"
  if (startsWith([0x52, 0x49, 0x46, 0x46]) && startsWith([0x57, 0x45, 0x42, 0x50], 8)) {
    return "image/webp";
  }
  return null;
}

export type AttachmentType = PhotoType | "application/pdf";

export const ATTACHMENT_MAX_BYTES = 5 * 1024 * 1024;

/** A photo's type, or "application/pdf" for a PDF (it starts with "%PDF-"); null for anything else. */
export function detectAttachmentType(data: Uint8Array): AttachmentType | null {
  const pdf = [0x25, 0x50, 0x44, 0x46, 0x2d];
  if (pdf.every((byte, i) => data[i] === byte)) return "application/pdf";
  return detectPhotoType(data);
}
