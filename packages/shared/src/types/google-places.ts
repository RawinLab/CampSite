/**
 * Google Places API Integration Types
 * Module 12 - Google Places Data Ingestion
 */

// ============================================================================
// ENUMS
// ============================================================================

export type SyncStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type ImportCandidateStatus = 'pending' | 'approved' | 'rejected' | 'imported';

// ============================================================================
// GOOGLE PLACES API TYPES
// ============================================================================

export interface GooglePlaceDetails {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: GooglePlaceGeometry;
  formatted_phone_number?: string;
  international_phone_number?: string;
  website?: string;
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
  photos?: GooglePlacePhoto[];
  reviews?: GooglePlaceReview[];
  types: string[];
  business_status?: string;
  opening_hours?: GooglePlaceOpeningHours;
  plus_code?: GooglePlacePlusCode;
  url?: string;
}

export interface GooglePlaceGeometry {
  location: {
    lat: number;
    lng: number;
  };
  viewport?: {
    northeast: { lat: number; lng: number };
    southwest: { lat: number; lng: number };
  };
}

export interface GooglePlacePhoto {
  photo_reference: string;
  height: number;
  width: number;
  html_attributions: string[];
}

export interface GooglePlaceReview {
  author_name: string;
  author_url?: string;
  language?: string;
  profile_photo_url?: string;
  rating: number;
  relative_time_description: string;
  text: string;
  time: number;
}

export interface GooglePlaceOpeningHours {
  open_now?: boolean;
  periods?: GooglePlaceOpeningPeriod[];
  weekday_text?: string[];
}

export interface GooglePlaceOpeningPeriod {
  open: { day: number; time: string };
  close?: { day: number; time: string };
}

export interface GooglePlacePlusCode {
  compound_code?: string;
  global_code: string;
}

export interface GooglePlaceSearchResult {
  business_status: string;
  formatted_address: string;
  geometry: GooglePlaceGeometry;
  icon: string;
  icon_background_color: string;
  name: string;
  opening_hours?: {
    open_now: boolean;
  };
  photos?: GooglePlacePhoto[];
  place_id: string;
  plus_code?: GooglePlacePlusCode;
  price_level?: number;
  rating?: number;
  reference: string;
  types: string[];
  user_ratings_total?: number;
}

// ============================================================================
// DATABASE TYPES
// ============================================================================

export interface GooglePlaceRaw {
  id: string;
  place_id: string;
  place_hash?: string;
  raw_data: GooglePlaceDetails;
  data_fetched_at: Date;
  sync_status: SyncStatus;
  processed_at?: Date;
  is_imported: boolean;
  imported_to_campsite_id?: string;
  imported_at?: Date;
  has_photos: boolean;
  photo_count: number;
  has_reviews: boolean;
  review_count: number;
  rating?: number;
  created_at: Date;
  updated_at: Date;
}

export interface GooglePlacePhotoRecord {
  id: string;
  google_place_id: string;
  photo_reference: string;
  width?: number;
  height?: number;
  storage_path?: string;
  original_url?: string;
  thumbnail_url?: string;
  download_status: SyncStatus;
  downloaded_at?: Date;
  created_at: Date;
}

export interface GooglePlaceReviewRecord {
  id: string;
  google_place_id: string;
  raw_data: GooglePlaceReview;
  author_name: string;
  author_profile_url?: string;
  rating: number;
  text_content: string;
  relative_time_description: string;
  reviewed_at: Date;
  is_imported: boolean;
  imported_to_review_id?: string;
  created_at: Date;
}

export interface ImportCandidate {
  id: string;
  google_place_raw_id: string;
  confidence_score: number;
  is_duplicate: boolean;
  duplicate_of_campsite_id?: string;
  processed_data: ProcessedCampsiteData;
  suggested_province_id: number;
  suggested_type_id: number;
  suggested_status: CampsiteStatus;
  validation_warnings: string[];
  missing_fields: string[];
  status: ImportCandidateStatus;
  reviewed_by?: string;
  reviewed_at?: Date;
  imported_to_campsite_id?: string;
  imported_at?: Date;
  admin_notes?: string;
  created_at: Date;
  updated_at: Date;

  // Denormalized fields for easier querying
  place_id?: string;
  name?: string;
  address?: string;
  photos?: string[];
  rating?: number;
}

export type CampsiteStatus = 'pending' | 'approved' | 'rejected';

export interface ProcessedCampsiteData {
  // Basic Info
  name: string;
  name_th?: string;
  description?: string;
  description_th?: string;

  // Location
  address: string;
  latitude: number;
  longitude: number;
  province_id: number;

  // Contact
  phone?: string;
  email?: string;
  website?: string;
  facebook_url?: string;
  instagram_url?: string;

  // Pricing (estimated from Google data)
  price_min?: number;
  price_max?: number;

  // Type
  type_id: number;

  // Photos (local URLs after download)
  photos: string[];

  // Rating from Google (for reference only, not imported as user reviews)
  google_rating?: number;
  google_review_count?: number;
}

export interface SyncLog {
  id: string;
  sync_type: string;
  triggered_by: string;
  started_at: Date;
  completed_at?: Date;
  duration_seconds?: number;
  status: SyncStatus;
  places_found: number;
  places_updated: number;
  photos_downloaded: number;
  reviews_fetched: number;
  api_requests_made: number;
  estimated_cost_usd?: number;
  error_message?: string;
  error_details?: unknown;
  config_snapshot?: SyncConfigSnapshot;
  created_at: Date;
}

export interface SyncConfigSnapshot {
  type: 'full' | 'incremental';
  provinces?: string[];
  max_places?: number;
  download_photos?: boolean;
  fetch_reviews?: boolean;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface TriggerSyncRequest {
  syncType: 'full' | 'incremental';
  provinces?: string[];
  maxPlaces?: number;
}

export interface TriggerSyncResponse {
  success: true;
  syncLogId: string;
  message: string;
  estimatedDuration: string;
}

export interface SyncLogsQuery {
  status?: SyncStatus;
  limit?: number;
  offset?: number;
}

export interface SyncLogsResponse {
  success: true;
  data: SyncLog[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

export interface ImportCandidatesQuery {
  status?: ImportCandidateStatus;
  minConfidence?: number;
  isDuplicate?: boolean;
  provinceId?: number;
  limit?: number;
  offset?: number;
}

export interface ImportCandidatesResponse {
  success: true;
  data: ImportCandidate[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

export interface ImportCandidateDetailResponse {
  success: true;
  data: {
    id: string;
    googlePlaceRaw: GooglePlaceRaw;
    processedData: ProcessedCampsiteData;
    duplicateComparison: DuplicateComparison;
    confidenceBreakdown: ConfidenceBreakdown;
  };
}

export interface DuplicateComparison {
  isDuplicate: boolean;
  duplicateOfCampsiteId?: string;
  similarityScore?: number;
  similarCampsites: SimilarCampsite[];
}

export interface SimilarCampsite {
  campsiteId: string;
  name: string;
  similarityScore: number;
  distanceKm: number;
  address: string;
}

export interface ConfidenceBreakdown {
  overall: number;
  locationMatch: number;
  dataCompleteness: number;
  provinceMatch: number;
  typeMatch: number;
}

export interface ApproveCandidateRequest {
  edits?: Partial<ProcessedCampsiteData>;
  assignToOwnerId?: string;
  markAsFeatured?: boolean;
}

export interface ApproveCandidateResponse {
  success: true;
  campsiteId: string;
  message: string;
}

export interface RejectCandidateRequest {
  reason: string;
  notes?: string;
}

export interface RejectCandidateResponse {
  success: true;
  message: string;
}

export interface BulkApproveRequest {
  candidateIds: string[];
  autoAssignOwner?: boolean;
}

export interface BulkApproveResponse {
  success: true;
  imported: string[];
  failed: Array<{
    candidateId: string;
    error: string;
  }>;
  message: string;
}

export interface TriggerAIProcessingRequest {
  rawPlaceIds?: string[];
  processAll?: boolean;
}

export interface TriggerAIProcessingResponse {
  success: true;
  message: string;
  placesToProcess: number;
}

// ============================================================================
// SERVICE TYPES
// ============================================================================

export interface SyncConfig {
  type: 'full' | 'incremental';
  provinces?: string[];
  maxPlaces?: number;
  downloadPhotos?: boolean;
  fetchReviews?: boolean;
}

export interface SyncStatus {
  id: string;
  status: SyncStatus;
  progress: {
    current: number;
    total: number;
    phase: string;
  };
  statistics: {
    placesFound: number;
    placesUpdated: number;
    photosDownloaded: number;
    reviewsFetched: number;
    apiRequestsMade: number;
    estimatedCostUsd: number;
  };
}

export interface AIProcessingResult {
  confidenceScore: number;
  isDuplicate: boolean;
  duplicateOfCampsiteId?: string;
  processedData: ProcessedCampsiteData;
  validationWarnings: string[];
  suggestedProvinceId: number;
  suggestedTypeId: number;
}

export interface DuplicateDetection {
  isDuplicate: boolean;
  duplicateOfCampsiteId?: string;
  similarityScore: number;
  similarCampsites: SimilarCampsite[];
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export class GooglePlacesError extends Error {
  constructor(
    public code: GooglePlacesErrorCode,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'GooglePlacesError';
  }
}

export type GooglePlacesErrorCode =
  | 'GP_001' // API key invalid
  | 'GP_002' // Quota exceeded
  | 'GP_003' // Photo download failed
  | 'GP_004' // Storage upload failed
  | 'GP_005' // AI processing failed
  | 'GP_006' // Province match failed
  | 'GP_007' // Duplicate detection error
  | 'GP_008'; // Sync already in progress
