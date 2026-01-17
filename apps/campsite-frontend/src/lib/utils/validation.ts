/**
 * Validation utilities for the Camping Thailand platform
 */

/**
 * Photo validation constants
 */
export const PHOTO_VALIDATION = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_COUNT: 5,
  ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
} as const;

/**
 * Validation result type
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate a single photo file
 * @param file - The file to validate
 * @returns Validation result with error message if invalid
 */
export function validatePhotoFile(file: File): ValidationResult {
  // Check file size
  if (file.size > PHOTO_VALIDATION.MAX_SIZE) {
    return {
      valid: false,
      error: 'ไฟล์ใหญ่เกินไป (สูงสุด 5MB)',
    };
  }

  // Check file type
  if (!(PHOTO_VALIDATION.ALLOWED_TYPES as readonly string[]).includes(file.type)) {
    return {
      valid: false,
      error: 'รองรับเฉพาะไฟล์รูปภาพ (JPG, PNG, WEBP)',
    };
  }

  return { valid: true };
}

/**
 * Validate photo count when adding new photos
 * @param current - Current number of photos
 * @param adding - Number of photos being added
 * @returns Validation result with error message if invalid
 */
export function validatePhotoCount(current: number, adding: number): ValidationResult {
  if (current + adding > PHOTO_VALIDATION.MAX_COUNT) {
    return {
      valid: false,
      error: 'อัพโหลดได้สูงสุด 5 รูป',
    };
  }

  return { valid: true };
}

/**
 * Format file size in human-readable format
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "2.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${units[i]}`;
}

/**
 * Validate multiple photo files at once
 * @param files - Array of files to validate
 * @param currentCount - Current number of photos already uploaded
 * @returns Validation result with error message if any file is invalid
 */
export function validatePhotoFiles(
  files: File[],
  currentCount: number = 0
): ValidationResult {
  // Check count first
  const countResult = validatePhotoCount(currentCount, files.length);
  if (!countResult.valid) {
    return countResult;
  }

  // Validate each file
  for (const file of files) {
    const fileResult = validatePhotoFile(file);
    if (!fileResult.valid) {
      return fileResult;
    }
  }

  return { valid: true };
}

/**
 * Get file extension from filename
 * @param filename - The filename to extract extension from
 * @returns The file extension in lowercase (without dot)
 */
export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1) return '';
  return filename.slice(lastDot + 1).toLowerCase();
}

/**
 * Check if a file type is an allowed image type
 * @param type - The MIME type to check
 * @returns True if the type is allowed
 */
export function isAllowedImageType(type: string): boolean {
  return (PHOTO_VALIDATION.ALLOWED_TYPES as readonly string[]).includes(type);
}
