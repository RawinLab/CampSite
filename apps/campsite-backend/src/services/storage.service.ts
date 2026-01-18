import { randomUUID } from 'crypto';
import { supabaseAdmin } from '../lib/supabase';
import { AppError } from '../middleware/errorHandler';
import logger from '../utils/logger';

// Constants
const STORAGE_BUCKET = 'campsite-photos';
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

// Custom storage errors
export class StorageError extends AppError {
  constructor(message: string, code: string, statusCode: number = 400) {
    super(message, statusCode, code);
    this.name = 'StorageError';
  }
}

export const createUploadFailedError = (details?: string) =>
  new StorageError(
    details ? `Upload failed: ${details}` : 'Failed to upload file',
    'UPLOAD_FAILED',
    500
  );

export const createDeleteFailedError = (details?: string) =>
  new StorageError(
    details ? `Delete failed: ${details}` : 'Failed to delete file',
    'DELETE_FAILED',
    500
  );

/**
 * Get file extension from filename or mimetype
 */
function getFileExtension(filename: string, mimetype?: string): string {
  // Try to get from filename first
  const parts = filename.toLowerCase().split('.');
  if (parts.length > 1) {
    const ext = parts[parts.length - 1];
    if (ALLOWED_EXTENSIONS.includes(ext)) {
      return ext;
    }
  }

  // Fall back to mimetype
  if (mimetype) {
    const mimeToExt: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
    };
    return mimeToExt[mimetype] || 'jpg';
  }

  return 'jpg';
}

/**
 * Generate a unique filename for storage
 */
function generateUniqueFilename(
  campsiteId: string,
  originalFilename: string,
  mimetype?: string
): string {
  const extension = getFileExtension(originalFilename, mimetype);
  const uniqueId = randomUUID();
  return `${campsiteId}/${uniqueId}.${extension}`;
}

/**
 * Get MIME type from extension
 */
function getMimeType(extension: string): string {
  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
  };
  return mimeTypes[extension] || 'application/octet-stream';
}

/**
 * Extract storage path from a public URL
 */
function extractStoragePathFromUrl(url: string): string | null {
  // URL format: https://{project}.supabase.co/storage/v1/object/public/{bucket}/{path}
  const bucketPath = `storage/v1/object/public/${STORAGE_BUCKET}/`;
  const bucketIndex = url.indexOf(bucketPath);

  if (bucketIndex === -1) {
    return null;
  }

  return url.substring(bucketIndex + bucketPath.length);
}

/**
 * Upload a campsite photo to Supabase Storage
 *
 * @param file - Buffer containing the file data
 * @param filename - Original filename
 * @param mimetype - File MIME type
 * @param campsiteId - Campsite ID for organizing files
 * @returns Public URL of the uploaded file
 * @throws StorageError if upload fails
 */
export async function uploadCampsitePhoto(
  file: Buffer,
  filename: string,
  mimetype: string,
  campsiteId: string
): Promise<string> {
  const storagePath = generateUniqueFilename(campsiteId, filename, mimetype);
  const extension = storagePath.split('.').pop() || 'jpg';
  const contentType = getMimeType(extension);

  logger.info(`Uploading campsite photo to ${storagePath}`);

  // Upload to Supabase Storage
  const { data, error } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, file, {
      contentType,
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    logger.error('Supabase storage upload error:', error);
    throw createUploadFailedError(error.message);
  }

  // Get public URL
  const { data: urlData } = supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(data.path);

  logger.info(`Photo uploaded successfully: ${urlData.publicUrl}`);
  return urlData.publicUrl;
}

/**
 * Delete a campsite photo from Supabase Storage
 *
 * @param photoUrl - Public URL of the photo to delete
 * @throws StorageError if deletion fails
 */
export async function deleteCampsitePhoto(photoUrl: string): Promise<void> {
  const storagePath = extractStoragePathFromUrl(photoUrl);

  if (!storagePath) {
    logger.warn(`Could not extract storage path from URL: ${photoUrl}`);
    // Don't throw error - the URL might be an external URL or already deleted
    return;
  }

  logger.info(`Deleting campsite photo: ${storagePath}`);

  const { error } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .remove([storagePath]);

  if (error) {
    logger.error('Supabase storage delete error:', error);
    throw createDeleteFailedError(error.message);
  }

  logger.info('Photo deleted successfully');
}

/**
 * Delete multiple campsite photos
 * Continues even if some deletions fail
 *
 * @param photoUrls - Array of photo URLs to delete
 */
export async function deleteCampsitePhotos(photoUrls: string[]): Promise<void> {
  const storagePaths: string[] = [];

  for (const url of photoUrls) {
    const path = extractStoragePathFromUrl(url);
    if (path) {
      storagePaths.push(path);
    }
  }

  if (storagePaths.length === 0) {
    return;
  }

  logger.info(`Deleting ${storagePaths.length} campsite photos`);

  const { error } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .remove(storagePaths);

  if (error) {
    logger.error('Supabase storage batch delete error:', error);
    // Don't throw - we don't want to fail the operation if storage cleanup fails
  }
}

// Export storage service as an object for easier mocking in tests
export const storageService = {
  uploadCampsitePhoto,
  deleteCampsitePhoto,
  deleteCampsitePhotos,
  STORAGE_BUCKET,
};
