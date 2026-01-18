/**
 * Google Places API Integration Zod Schemas
 * Module 12 - Google Places Data Ingestion
 */

import { z } from 'zod';

// ============================================================================
// ENUM SCHEMAS
// ============================================================================

export const syncStatusSchema = z.enum(['pending', 'processing', 'completed', 'failed']);
export const importCandidateStatusSchema = z.enum(['pending', 'approved', 'rejected', 'imported']);
export const campsiteStatusSchema = z.enum(['pending', 'approved', 'rejected']);

// ============================================================================
// GOOGLE PLACES API SCHEMAS (for validation of API responses)
// ============================================================================

export const googlePlaceGeometrySchema = z.object({
  location: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  viewport: z.object({
    northeast: z.object({
      lat: z.number(),
      lng: z.number(),
    }),
    southwest: z.object({
      lat: z.number(),
      lng: z.number(),
    }),
  }).optional(),
});

export const googlePlacePhotoSchema = z.object({
  photo_reference: z.string(),
  height: z.number(),
  width: z.number(),
  html_attributions: z.array(z.string()),
});

export const googlePlaceReviewSchema = z.object({
  author_name: z.string(),
  author_url: z.string().optional(),
  language: z.string().optional(),
  profile_photo_url: z.string().optional(),
  rating: z.number().min(1).max(5),
  relative_time_description: z.string(),
  text: z.string(),
  time: z.number(),
});

export const googlePlaceOpeningHoursSchema = z.object({
  open_now: z.boolean().optional(),
  periods: z.array(z.object({
    open: z.object({
      day: z.number().min(0).max(6),
      time: z.string().regex(/^\d{4}$/),
    }),
    close: z.object({
      day: z.number().min(0).max(6),
      time: z.string().regex(/^\d{4}$/),
    }).optional(),
  })).optional(),
  weekday_text: z.array(z.string()).optional(),
});

export const googlePlacePlusCodeSchema = z.object({
  compound_code: z.string().optional(),
  global_code: z.string(),
});

export const googlePlaceDetailsSchema = z.object({
  place_id: z.string(),
  name: z.string(),
  formatted_address: z.string(),
  geometry: googlePlaceGeometrySchema,
  formatted_phone_number: z.string().optional(),
  international_phone_number: z.string().optional(),
  website: z.string().url().optional(),
  rating: z.number().min(1).max(5).optional(),
  user_ratings_total: z.number().int().nonnegative().optional(),
  price_level: z.number().int().min(0).max(4).optional(),
  photos: z.array(googlePlacePhotoSchema).optional(),
  reviews: z.array(googlePlaceReviewSchema).optional(),
  types: z.array(z.string()),
  business_status: z.string().optional(),
  opening_hours: googlePlaceOpeningHoursSchema.optional(),
  plus_code: googlePlacePlusCodeSchema.optional(),
  url: z.string().url().optional(),
});

export const googlePlaceSearchResultSchema = z.object({
  business_status: z.string().optional(),
  formatted_address: z.string(),
  geometry: googlePlaceGeometrySchema,
  icon: z.string().url(),
  icon_background_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  name: z.string(),
  opening_hours: z.object({
    open_now: z.boolean(),
  }).optional(),
  photos: z.array(googlePlacePhotoSchema).optional(),
  place_id: z.string(),
  plus_code: googlePlacePlusCodeSchema.optional(),
  price_level: z.number().int().min(0).max(4).optional(),
  rating: z.number().min(1).max(5).optional(),
  reference: z.string(),
  types: z.array(z.string()),
  user_ratings_total: z.number().int().nonnegative().optional(),
});

// ============================================================================
// API REQUEST SCHEMAS
// ============================================================================

export const triggerSyncRequestSchema = z.object({
  syncType: z.enum(['full', 'incremental']).default('incremental'),
  provinces: z.array(z.string()).optional(),
  maxPlaces: z.number().int().positive().max(5000).optional(),
});

export type TriggerSyncRequestInput = z.infer<typeof triggerSyncRequestSchema>;

export const triggerSyncResponseSchema = z.object({
  success: z.literal(true),
  syncLogId: z.string().uuid(),
  message: z.string(),
  estimatedDuration: z.string(),
});

export const syncLogsQuerySchema = z.object({
  status: syncStatusSchema.optional(),
  limit: z.coerce.number().int().positive().max(100).default(20),
  offset: z.coerce.number().int().nonnegative().default(0),
});

export type SyncLogsQueryInput = z.infer<typeof syncLogsQuerySchema>;

export const importCandidatesQuerySchema = z.object({
  status: importCandidateStatusSchema.optional(),
  minConfidence: z.coerce.number().min(0).max(1).optional(),
  isDuplicate: z.coerce.boolean().optional(),
  provinceId: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).default(20),
  offset: z.coerce.number().int().nonnegative().default(0),
});

export type ImportCandidatesQueryInput = z.infer<typeof importCandidatesQuerySchema>;

export const approveCandidateRequestSchema = z.object({
  edits: z.object({
    name: z.string().min(1).max(200).optional(),
    name_th: z.string().min(1).max(200).optional(),
    description: z.string().max(5000).optional(),
    description_th: z.string().max(5000).optional(),
    address: z.string().min(1).max(500).optional(),
    phone: z.string().max(20).optional(),
    email: z.string().email().optional(),
    website: z.string().url().optional(),
    price_min: z.number().int().nonnegative().optional(),
    price_max: z.number().int().nonnegative().optional(),
  }).optional(),
  assignToOwnerId: z.string().uuid().optional(),
  markAsFeatured: z.boolean().optional(),
});

export type ApproveCandidateRequestInput = z.infer<typeof approveCandidateRequestSchema>;

export const rejectCandidateRequestSchema = z.object({
  reason: z.string().min(1).max(500),
  notes: z.string().max(2000).optional(),
});

export type RejectCandidateRequestInput = z.infer<typeof rejectCandidateRequestSchema>;

export const bulkApproveRequestSchema = z.object({
  candidateIds: z.array(z.string().uuid()).min(1).max(100),
  autoAssignOwner: z.boolean().default(false),
});

export type BulkApproveRequestInput = z.infer<typeof bulkApproveRequestSchema>;

export const triggerAIProcessingRequestSchema = z.object({
  rawPlaceIds: z.array(z.string().uuid()).optional(),
  processAll: z.boolean().default(false),
});

export type TriggerAIProcessingRequestInput = z.infer<typeof triggerAIProcessingRequestSchema>;

// ============================================================================
// DATABASE SCHEMAS (for validation of database records)
// ============================================================================

export const googlePlaceRawSchema = z.object({
  id: z.string().uuid(),
  place_id: z.string(),
  place_hash: z.string().optional(),
  raw_data: googlePlaceDetailsSchema,
  data_fetched_at: z.coerce.date(),
  sync_status: syncStatusSchema,
  processed_at: z.coerce.date().optional(),
  is_imported: z.boolean(),
  imported_to_campsite_id: z.string().uuid().optional(),
  imported_at: z.coerce.date().optional(),
  has_photos: z.boolean(),
  photo_count: z.number().int().nonnegative(),
  has_reviews: z.boolean(),
  review_count: z.number().int().nonnegative(),
  rating: z.number().min(1).max(5).optional(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export const googlePlacePhotoRecordSchema = z.object({
  id: z.string().uuid(),
  google_place_id: z.string(),
  photo_reference: z.string(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  storage_path: z.string().optional(),
  original_url: z.string().url().optional(),
  thumbnail_url: z.string().url().optional(),
  download_status: syncStatusSchema,
  downloaded_at: z.coerce.date().optional(),
  created_at: z.coerce.date(),
});

export const googlePlaceReviewRecordSchema = z.object({
  id: z.string().uuid(),
  google_place_id: z.string(),
  raw_data: googlePlaceReviewSchema,
  author_name: z.string(),
  author_profile_url: z.string().url().optional(),
  rating: z.number().int().min(1).max(5),
  text_content: z.string(),
  relative_time_description: z.string(),
  reviewed_at: z.coerce.date(),
  is_imported: z.boolean(),
  imported_to_review_id: z.string().uuid().optional(),
  created_at: z.coerce.date(),
});

export const importCandidateSchema = z.object({
  id: z.string().uuid(),
  google_place_raw_id: z.string().uuid(),
  confidence_score: z.number().min(0).max(1),
  is_duplicate: z.boolean(),
  duplicate_of_campsite_id: z.string().uuid().optional(),
  processed_data: z.object({
    name: z.string().min(1).max(200),
    name_th: z.string().min(1).max(200).optional(),
    description: z.string().max(5000).optional(),
    description_th: z.string().max(5000).optional(),
    address: z.string().min(1).max(500),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    province_id: z.number().int().positive(),
    phone: z.string().max(20).optional(),
    email: z.string().email().optional(),
    website: z.string().url().optional(),
    facebook_url: z.string().url().optional(),
    instagram_url: z.string().url().optional(),
    price_min: z.number().int().nonnegative().optional(),
    price_max: z.number().int().nonnegative().optional(),
    type_id: z.number().int().positive(),
    photos: z.array(z.string().url()),
    google_rating: z.number().min(1).max(5).optional(),
    google_review_count: z.number().int().nonnegative().optional(),
  }),
  suggested_province_id: z.number().int().positive(),
  suggested_type_id: z.number().int().positive(),
  suggested_status: campsiteStatusSchema,
  validation_warnings: z.array(z.string()),
  missing_fields: z.array(z.string()),
  status: importCandidateStatusSchema,
  reviewed_by: z.string().uuid().optional(),
  reviewed_at: z.coerce.date().optional(),
  imported_to_campsite_id: z.string().uuid().optional(),
  imported_at: z.coerce.date().optional(),
  admin_notes: z.string().optional(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export const syncLogSchema = z.object({
  id: z.string().uuid(),
  sync_type: z.string(),
  triggered_by: z.string(),
  started_at: z.coerce.date(),
  completed_at: z.coerce.date().optional(),
  duration_seconds: z.number().int().nonnegative().optional(),
  status: syncStatusSchema,
  places_found: z.number().int().nonnegative(),
  places_updated: z.number().int().nonnegative(),
  photos_downloaded: z.number().int().nonnegative(),
  reviews_fetched: z.number().int().nonnegative(),
  api_requests_made: z.number().int().nonnegative(),
  estimated_cost_usd: z.number().nonnegative().optional(),
  error_message: z.string().optional(),
  error_details: z.unknown().optional(),
  config_snapshot: z.object({
    type: z.enum(['full', 'incremental']),
    provinces: z.array(z.string()).optional(),
    max_places: z.number().int().positive().optional(),
    download_photos: z.boolean().optional(),
    fetch_reviews: z.boolean().optional(),
  }).optional(),
  created_at: z.coerce.date(),
});

// ============================================================================
// RESPONSE SCHEMAS (for API responses)
// ============================================================================

export const successResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
  });

export const paginatedResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: z.array(dataSchema),
    pagination: z.object({
      total: z.number().int().nonnegative(),
      limit: z.number().int().positive(),
      offset: z.number().int().nonnegative(),
    }),
  });

export const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  code: z.string().optional(),
  details: z.unknown().optional(),
});
