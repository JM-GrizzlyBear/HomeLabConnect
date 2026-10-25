import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { ATTACHMENT_MAX_BYTES, PROFILE_PHOTO_MAX_BYTES } from "../../domain/media/photo.js";

/**
 * Reads at most one file from a multipart form, in `field`, into memory: the use case checks
 * it and decides where it's stored. Upload problems become a 400 under that field.
 */
function uploadFile(field: string, maxBytes: number, noun: string) {
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxBytes, files: 1, fields: 5 },
  }).single(field);
  const sizeMb = Math.round(maxBytes / (1024 * 1024));
  const limitMessages: Record<string, string> = {
    LIMIT_FILE_SIZE: `The ${noun} must be ${sizeMb} MB or smaller.`,
    LIMIT_FILE_COUNT: `Choose one ${noun}.`,
    LIMIT_UNEXPECTED_FILE: `Send the ${noun} in the "${field}" field.`,
  };

  return (req: Request, res: Response, next: NextFunction): void => {
    upload(req, res, (error: unknown) => {
      if (error instanceof multer.MulterError) {
        const message = limitMessages[error.code] ?? `Couldn't read the ${noun}.`;
        res.status(400).json({
          error: { code: "invalid_request", message, issues: [{ path: field, message }] },
        });
        return;
      }
      next(error);
    });
  };
}

/** Profile photos: one in the "photo" field, up to 2 MB. */
export const uploadPhoto = uploadFile("photo", PROFILE_PHOTO_MAX_BYTES, "photo");

/** Note attachments: one photo or PDF in the "file" field, up to 5 MB. */
export const uploadAttachment = uploadFile("file", ATTACHMENT_MAX_BYTES, "file");
