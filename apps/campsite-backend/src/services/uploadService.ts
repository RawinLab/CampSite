import { randomUUID } from 'crypto';
import { supabaseAdmin } from '../lib/supabase';
import { AppError } from '../middleware/errorHandler';

// Constants
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];
const STORAGE_BUCKET = 'review-photos';

// Custom upload errors
export class UploadError extends AppError {
  constructor(message: string, code: string, statusCode: number = 400) {
    super(message, statusCode, code);
    this.name = 'UploadError';
  }
}

export const createFileSizeError = (maxSizeMB: number = 5) =>
  new UploadError(
    `File size exceeds maximum allowed size of ${maxSizeMB}MB`,
    'FILE_SIZE_EXCEEDED'
  );

export const createInvalidFileTypeError = (allowedTypes: string[] = ALLOWED_EXTENSIONS) =>
  new UploadError(
    `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
    'INVALID_FILE_TYPE'
  );

export const createUploadFailedError = (details?: string) =>
  new UploadError(
    details ? `Upload failed: ${details}` : 'Failed to upload file',
    'UPLOAD_FAILED',
    500
  );

export const createDeleteFailedError = (details?: string) =>
  new UploadError(
    details ? `Delete failed: ${details}` : 'Failed to delete file',
    'DELETE_FAILED',
    500
  );

/**
 * Get file extension from filename
 */
function getFileExtension(filename: string): string {
  const parts = filename.toLowerCase().split('.');
  return parts.length > 1 ? parts[parts.length - 1] : '';
}

/**
 * Validate file extension
 */
function isValidExtension(filename: string): boolean {
  const extension = getFileExtension(filename);
  return ALLOWED_EXTENSIONS.includes(extension);
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
 * Upload a review photo to Supabase Storage
 *
 * @param file - Buffer containing the file data
 * @param filename - Original filename (used to extract extension)
 * @param userId - User ID for path organization
 * @returns Public URL of the uploaded file
 * @throws UploadError if validation fails or upload fails
 */
export async function uploadReviewPhoto(
  file: Buffer,
  filename: string,
  userId: string
): Promise<string> {
  // Validate file size
  if (file.length > MAX_FILE_SIZE) {
    throw createFileSizeError();
  }

  // Validate file extension
  if (!isValidExtension(filename)) {
    throw createInvalidFileTypeError();
  }

  // Generate unique filename
  const extension = getFileExtension(filename);
  const uniqueFilename = `${randomUUID()}.${extension}`;
  const storagePath = `${userId}/${uniqueFilename}`;

  // Get MIME type for proper content-type header
  const mimeType = getMimeType(extension);

  // Upload to Supabase Storage
  const { data, error } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, file, {
      contentType: mimeType,
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Supabase upload error:', error);
    throw createUploadFailedError(error.message);
  }

  // Get public URL
  const { data: urlData } = supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

/**
 * Delete a review photo from Supabase Storage
 *
 * @param photoUrl - Public URL of the photo to delete
 * @throws UploadError if deletion fails
 */
export async function deleteReviewPhoto(photoUrl: string): Promise<void> {
  // Extract storage path from public URL
  // URL format: https://{project}.supabase.co/storage/v1/object/public/{bucket}/{path}
  const bucketPath = `storage/v1/object/public/${STORAGE_BUCKET}/`;
  const bucketIndex = photoUrl.indexOf(bucketPath);

  if (bucketIndex === -1) {
    throw createDeleteFailedError('Invalid photo URL format');
  }

  const storagePath = photoUrl.substring(bucketIndex + bucketPath.length);

  if (!storagePath) {
    throw createDeleteFailedError('Could not extract storage path from URL');
  }

  // Delete from Supabase Storage
  const { error } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .remove([storagePath]);

  if (error) {
    console.error('Supabase delete error:', error);
    throw createDeleteFailedError(error.message);
  }
}

/**
 * Upload multiple review photos
 *
 * @param files - Array of objects containing file buffer and filename
 * @param userId - User ID for path organization
 * @param maxPhotos - Maximum number of photos allowed (default: 5)
 * @returns Array of public URLs
 * @throws UploadError if validation fails or upload fails
 */
export async function uploadReviewPhotos(
  files: Array<{ buffer: Buffer; filename: string }>,
  userId: string,
  maxPhotos: number = 5
): Promise<string[]> {
  // Validate number of photos
  if (files.length > maxPhotos) {
    throw new UploadError(
      `Maximum ${maxPhotos} photos allowed per review`,
      'TOO_MANY_FILES'
    );
  }

  // Upload all photos in parallel
  const uploadPromises = files.map((file) =>
    uploadReviewPhoto(file.buffer, file.filename, userId)
  );

  const urls = await Promise.all(uploadPromises);
  return urls;
}

/**
 * Delete multiple review photos
 *
 * @param photoUrls - Array of photo URLs to delete
 */
export async function deleteReviewPhotos(photoUrls: string[]): Promise<void> {
  // Delete all photos in parallel, but don't fail if some deletions fail
  const deletePromises = photoUrls.map(async (url) => {
    try {
      await deleteReviewPhoto(url);
    } catch (error) {
      console.error(`Failed to delete photo: ${url}`, error);
      // Continue with other deletions
    }
  });

  await Promise.all(deletePromises);
}

// Export constants for use in validation middleware
export const UPLOAD_CONSTANTS = {
  MAX_FILE_SIZE,
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS,
  MAX_PHOTOS_PER_REVIEW: 5,
  STORAGE_BUCKET,
};
