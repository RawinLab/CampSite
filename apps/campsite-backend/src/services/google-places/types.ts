/**
 * Google Places Service Types
 * Internal types used by Google Places services
 */

export interface GooglePlacesErrorDetails {
  code: string;
  message: string;
  details?: unknown;
}

export class GooglePlacesError extends Error {
  constructor(
    public code: string,
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
