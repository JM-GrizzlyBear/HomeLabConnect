import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { PROFILE_PHOTO_MAX_BYTES } from "../../domain/media/photo.js";

// Keep the file in memory: the use case checks it and decides where it's stored
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: PROFILE_PHOTO_MAX_BYTES, files: 1, fields: 5 },
}).single("photo");

const limitMessages: Record<string, string> = {
  LIMIT_FILE_SIZE: "The photo must be 2 MB or smaller.",
  LIMIT_FILE_COUNT: "Choose one photo.",
  LIMIT_UNEXPECTED_FILE: 'Send the photo in the "photo" field.',
};

/** Reads one photo from a multipart form, turning upload problems into a 400 under "photo". */
export function uploadPhoto(req: Request, res: Response, next: NextFunction): void {
  upload(req, res, (error: unknown) => {
    if (error instanceof multer.MulterError) {
      const message = limitMessages[error.code] ?? "Couldn't read the photo.";
      res.status(400).json({
        error: { code: "invalid_request", message, issues: [{ path: "photo", message }] },
      });
      return;
    }
    next(error);
  });
}
