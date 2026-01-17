import { z } from 'zod';

// Constants
export const MAX_PHOTOS_PER_CAMPSITE = 20;
export const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'] as const;

// Photo Types
export interface CampsitePhotoInput {
  file: File;
  alt_text?: string;
  is_primary?: boolean;
}

export interface CampsitePhotoResponse {
  id: string;
  campsite_id: string;
  url: string;
  alt_text: string | null;
  is_primary: boolean;
  sort_order: number;
  width: number | null;
  height: number | null;
  file_size: number | null;
  created_at: string;
}

// Schema for photo metadata (when creating)
export const photoCreateSchema = z.object({
  url: z.string().url(),
  alt_text: z.string().max(200).optional().nullable(),
  is_primary: z.boolean().optional().default(false),
  sort_order: z.number().min(0).optional().default(0),
  width: z.number().positive().optional().nullable(),
  height: z.number().positive().optional().nullable(),
  file_size: z.number().positive().optional().nullable(),
});

export type PhotoCreateInput = z.infer<typeof photoCreateSchema>;

// Schema for updating photo metadata
export const photoUpdateSchema = z.object({
  alt_text: z.string().max(200).optional().nullable(),
  is_primary: z.boolean().optional(),
});

export type PhotoUpdateInput = z.infer<typeof photoUpdateSchema>;

// Schema for setting primary photo
export const setPrimaryPhotoSchema = z.object({
  photo_id: z.string().uuid(),
});

export type SetPrimaryPhotoInput = z.infer<typeof setPrimaryPhotoSchema>;

// Schema for photo reordering
export const reorderPhotosSchema = z.object({
  order: z.array(z.object({
    id: z.string().uuid(),
    sort_order: z.number().min(0),
  })),
});

export type ReorderPhotosInput = z.infer<typeof reorderPhotosSchema>;

// Validation helper
export function validatePhotoFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_PHOTO_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed (${MAX_PHOTO_SIZE_BYTES / 1024 / 1024}MB)`,
    };
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type as typeof ALLOWED_IMAGE_TYPES[number])) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`,
    };
  }

  return { valid: true };
}
