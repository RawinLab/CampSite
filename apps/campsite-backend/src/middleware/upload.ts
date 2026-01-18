import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';

// Constants
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

/**
 * File filter to validate image types
 */
const imageFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  callback: FileFilterCallback
): void => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    callback(null, true);
  } else {
    callback(
      new Error(`Invalid file type. Allowed types: jpeg, png, webp`)
    );
  }
};

/**
 * Multer configuration for single photo upload
 * Uses memory storage to keep file in buffer for Supabase upload
 */
export const uploadPhoto = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
  fileFilter: imageFileFilter,
});

/**
 * Multer configuration for multiple photo uploads (max 5)
 */
export const uploadPhotos = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 5,
  },
  fileFilter: imageFileFilter,
});

// Export constants for use elsewhere
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE,
  ALLOWED_MIME_TYPES,
  MAX_PHOTOS_PER_CAMPSITE: 20,
};
