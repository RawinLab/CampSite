# 📋 Software Requirements Specification (SRS)
## Google Places API Integration - Camping Data Ingestion

**Document Version:** 1.0
**Last Updated:** January 18, 2026
**Author:** Technical Lead
**Status:** Draft → Implementation

---

## TABLE OF CONTENTS

1. [Introduction](#introduction)
2. [System Architecture](#system-architecture)
3. [Database Schema Extensions](#database-schema-extensions)
4. [API Specifications](#api-specifications)
5. [Service Specifications](#service-specifications)
6. [External Integrations](#external-integrations)
7. [Non-Functional Requirements](#non-functional-requirements)
8. [Security Considerations](#security-considerations)

---

## INTRODUCTION

### Purpose
This SRS defines technical requirements for integrating Google Places API into the Camping Thailand platform for automated campsite data discovery and ingestion.

### Scope
**In Scope:**
- Google Places API integration (Text Search, Nearby Search, Place Details, Place Photos)
- Raw data storage in Supabase
- Scheduled sync service (cron/worker)
- Photo download and storage
- AI processing pipeline for data enrichment
- Admin dashboard for import management

**Out of Scope:**
- Real-time sync (on-demand only)
- Automatic import without admin approval
- Google Maps JavaScript API (frontend only)
- Payment processing for API costs

### Dependencies
- Existing: `DATABASE-SCHEMA.md`, `PRD-GooglePlaces-Integration.md`
- External: Google Places API, Supabase Storage, OpenAI API (for AI processing)

---

## SYSTEM ARCHITECTURE

### Component Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CAMPFIRE MONOREPO                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      apps/campsite-backend                          │   │
│  │                                                                      │   │
│  │  ┌──────────────────────────────────────────────────────────────┐   │   │
│  │  │                 Google Places Sync Service                   │   │   │
│  │  │  • src/services/google-places/sync.service.ts               │   │   │
│  │  │  • src/services/google-places/text-search.service.ts        │   │   │
│  │  │  • src/services/google-places/details.service.ts            │   │   │
│  │  │  • src/services/google-places/photo.service.ts              │   │   │
│  │  │  • src/services/google-places/review.service.ts             │   │   │
│  │  └──────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  ┌──────────────────────────────────────────────────────────────┐   │   │
│  │  │                    AI Processing Service                     │   │   │
│  │  │  • src/services/google-places/ai-processing.service.ts      │   │   │
│  │  │  • src/services/google-places/deduplication.service.ts      │   │   │
│  │  │  • src/services/google-places/province-matcher.service.ts   │   │   │
│  │  │  • src/services/google-places/type-classifier.service.ts    │   │   │
│  │  └──────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  ┌──────────────────────────────────────────────────────────────┐   │   │
│  │  │                     Admin API Routes                         │   │   │
│  │  │  • src/routes/admin/google-places.routes.ts                 │   │   │
│  │  │    - POST /admin/google-places/sync/trigger                 │   │   │
│  │  │    - GET  /admin/google-places/sync/logs                    │   │   │
│  │  │    - GET  /admin/google-places/candidates                  │   │   │
│  │  │    - POST /admin/google-places/candidates/:id/approve       │   │   │
│  │  │    - POST /admin/google-places/candidates/:id/reject        │   │   │
│  │  └──────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     apps/campsite-frontend                         │   │
│  │                                                                      │   │
│  │  ┌──────────────────────────────────────────────────────────────┐   │   │
│  │  │              Admin Dashboard Pages                           │   │   │
│  │  │  • src/app/admin/google-places/page.tsx                     │   │   │
│  │  │  • src/app/admin/google-places/sync/page.tsx                │   │   │
│  │  │  • src/app/admin/google-places/candidates/page.tsx          │   │   │
│  │  │  • src/components/admin/google-places/*                     │   │   │
│  │  └──────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        packages/shared                              │   │
│  │                                                                      │   │
│  │  ┌──────────────────────────────────────────────────────────────┐   │   │
│  │  │              Shared Types & Schemas                          │   │   │
│  │  │  • src/types/google-places.ts                                │   │   │
│  │  │  • src/schemas/google-places.ts                              │   │   │
│  │  └──────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Technology Stack
| Component | Technology |
|-----------|------------|
| Backend Service | TypeScript + Node.js |
| HTTP Client | axios |
| Scheduling | node-cron |
| Image Processing | sharp |
| AI Processing | OpenAI API (GPT-4) |
| Storage | Supabase Storage |
| Database | Supabase PostgreSQL |
| Queue (Optional) | BullMQ / Redis |

---

## DATABASE SCHEMA EXTENSIONS

### New Tables

#### 1. google_places_raw
Stores raw JSON responses from Google Places API.

```sql
CREATE TYPE sync_status AS ENUM ('pending', 'processing', 'completed', 'failed');

CREATE TABLE google_places_raw (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Google Places identifiers
    place_id TEXT NOT NULL UNIQUE, -- Google's place_id
    place_hash TEXT UNIQUE, -- MD5 of name+address for deduplication

    -- Raw API response
    raw_data JSONB NOT NULL, -- Full Place Details response
    data_fetched_at TIMESTAMPTZ DEFAULT NOW(),

    -- Processing status
    sync_status sync_status DEFAULT 'pending',
    processed_at TIMESTAMPTZ,

    -- Import tracking
    is_imported BOOLEAN DEFAULT FALSE,
    imported_to_campsite_id UUID REFERENCES campsites(id),
    imported_at TIMESTAMPTZ,

    -- Quality indicators
    has_photos BOOLEAN DEFAULT FALSE,
    photo_count INT DEFAULT 0,
    has_reviews BOOLEAN DEFAULT FALSE,
    review_count INT DEFAULT 0,
    rating DECIMAL(2,1),

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_google_places_raw_place_id ON google_places_raw(place_id);
CREATE INDEX idx_google_places_raw_status ON google_places_raw(sync_status);
CREATE INDEX idx_google_places_raw_imported ON google_places_raw(is_imported) WHERE is_imported = FALSE;
CREATE INDEX idx_google_places_raw_rating ON google_places_raw(rating DESC);
CREATE INDEX idx_google_places_raw_location ON google_places_raw USING GIST (
    ll_to_earth(
        (raw_data->'geometry'->>'lat')::decimal,
        (raw_data->'geometry'->>'lng')::decimal
    )
);

-- Trigger for updated_at
CREATE TRIGGER set_google_places_raw_updated_at
    BEFORE UPDATE ON google_places_raw
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

#### 2. google_places_photos
Stores photo references and local URLs.

```sql
CREATE TABLE google_places_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    google_place_id TEXT NOT NULL REFERENCES google_places_raw(place_id) ON DELETE CASCADE,

    -- Google Places photo info
    photo_reference TEXT NOT NULL,
    width INT,
    height INT,

    -- Local storage info
    storage_path TEXT, -- Supabase Storage path
    original_url TEXT,
    thumbnail_url TEXT,

    -- Processing status
    download_status sync_status DEFAULT 'pending',
    downloaded_at TIMESTAMPTZ,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_google_places_photos_place_id ON google_places_photos(google_place_id);
CREATE INDEX idx_google_places_photos_status ON google_places_photos(download_status);
```

#### 3. google_places_reviews
Stores raw review data from Google Places.

```sql
CREATE TABLE google_places_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    google_place_id TEXT NOT NULL REFERENCES google_places_raw(place_id) ON DELETE CASCADE,

    -- Raw review data
    raw_data JSONB NOT NULL, -- Full review object from Google
    author_name TEXT,
    author_profile_url TEXT,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    text_content TEXT,
    relative_time_description TEXT,
    reviewed_at TIMESTAMPTZ,

    -- Processing
    is_imported BOOLEAN DEFAULT FALSE,
    imported_to_review_id UUID REFERENCES reviews(id),

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_google_places_reviews_place_id ON google_places_reviews(google_place_id);
CREATE INDEX idx_google_places_reviews_imported ON google_places_reviews(is_imported);
```

#### 4. google_places_import_candidates
AI-processed candidates ready for admin review.

```sql
CREATE TYPE import_candidate_status AS ENUM ('pending', 'approved', 'rejected', 'imported');

CREATE TABLE google_places_import_candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    google_place_raw_id UUID NOT NULL REFERENCES google_places_raw(id) ON DELETE CASCADE,

    -- AI processing results
    confidence_score DECIMAL(3,2) CHECK (confidence_score BETWEEN 0 AND 1),
    is_duplicate BOOLEAN DEFAULT FALSE,
    duplicate_of_campsite_id UUID REFERENCES campsites(id),

    -- Mapped data (from AI processing)
    processed_data JSONB NOT NULL, -- Campsite-ready data structure

    -- AI suggestions
    suggested_province_id INT REFERENCES provinces(id),
    suggested_type_id INT REFERENCES campsite_types(id),
    suggested_status campsite_status DEFAULT 'pending',

    -- Validation & warnings
    validation_warnings JSONB DEFAULT '[]', -- Array of warning messages
    missing_fields TEXT[] DEFAULT '{}',

    -- Import status
    status import_candidate_status DEFAULT 'pending',
    reviewed_by UUID REFERENCES profiles(id),
    reviewed_at TIMESTAMPTZ,
    imported_to_campsite_id UUID REFERENCES campsites(id),
    imported_at TIMESTAMPTZ,

    -- Admin notes
    admin_notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_google_places_candidates_status ON google_places_import_candidates(status);
CREATE INDEX idx_google_places_candidates_confidence ON google_places_import_candidates(confidence_score DESC);
CREATE INDEX idx_google_places_candidates_duplicate ON google_places_import_candidates(is_duplicate) WHERE is_duplicate = TRUE;

-- Trigger for updated_at
CREATE TRIGGER set_google_places_candidates_updated_at
    BEFORE UPDATE ON google_places_import_candidates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

#### 5. sync_logs
Track sync execution history.

```sql
CREATE TABLE sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Execution info
    sync_type TEXT NOT NULL DEFAULT 'google_places', -- 'google_places', 'full', 'incremental'
    triggered_by TEXT DEFAULT 'system', -- 'system', 'admin', 'api'

    -- Timestamps
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_seconds INT,

    -- Status
    status sync_status NOT NULL DEFAULT 'running',

    -- Statistics
    places_found INT DEFAULT 0,
    places_updated INT DEFAULT 0,
    photos_downloaded INT DEFAULT 0,
    reviews_fetched INT DEFAULT 0,
    api_requests_made INT DEFAULT 0,

    -- Cost tracking
    estimated_cost_usd DECIMAL(10,2),

    -- Error tracking
    error_message TEXT,
    error_details JSONB,

    -- Configuration snapshot
    config_snapshot JSONB, -- Search queries, options used

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sync_logs_started_at ON sync_logs(started_at DESC);
CREATE INDEX idx_sync_logs_status ON sync_logs(status);
```

### Supabase Storage Bucket

**Bucket:** `google-places-photos`

**Folder Structure:**
```
google-places-photos/
├── {place_id}/
│   ├── original/
│   │   ├── {photo_id}.jpg
│   │   └── {photo_id}.jpg
│   └── thumbnails/
│       ├── {photo_id}_thumb.jpg
│       └── {photo_id}_thumb.jpg
```

**RLS Policy:**
- Public read access for thumbnails
- Authenticated write access for admins

---

## API SPECIFICATIONS

### Admin Endpoints

#### POST /api/admin/google-places/sync/trigger
Manually trigger a Google Places sync.

**Request:**
```json
{
  "syncType": "full" | "incremental",
  "provinces": ["bangkok", "chiang-mai"], // Optional: specific provinces
  "maxPlaces": 1000 // Optional: limit
}
```

**Response:** 202 Accepted
```json
{
  "success": true,
  "syncLogId": "uuid",
  "message": "Sync started",
  "estimatedDuration": "15-30 minutes"
}
```

#### GET /api/admin/google-places/sync/logs
Get sync execution history.

**Query Params:**
- `status`: Filter by status
- `limit`: Number of records
- `offset`: Pagination offset

**Response:** 200 OK
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "syncType": "full",
      "status": "completed",
      "startedAt": "2026-01-18T10:00:00Z",
      "completedAt": "2026-01-18T10:25:00Z",
      "durationSeconds": 1500,
      "placesFound": 1234,
      "placesUpdated": 456,
      "photosDownloaded": 3690,
      "apiRequestsMade": 2500,
      "estimatedCostUsd": 56.47
    }
  ],
  "pagination": { "total": 50, "limit": 20, "offset": 0 }
}
```

#### GET /api/admin/google-places/candidates
Get import candidates.

**Query Params:**
- `status`: Filter by status (pending, approved, rejected, imported)
- `minConfidence`: Minimum confidence score
- `isDuplicate`: Filter duplicates
- `provinceId`: Filter by province

**Response:** 200 OK
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "googlePlaceRawId": "uuid",
      "placeId": "ChIJN1t_tDeuEmsRUsoyG83frY4",
      "name": "Beautiful Camping Ground",
      "address": "123 Camping Rd, Bangkok",
      "confidenceScore": 0.92,
      "isDuplicate": false,
      "suggestedProvinceId": 1,
      "suggestedTypeId": 1,
      "status": "pending",
      "photos": ["url1", "url2", "url3"],
      "rating": 4.5,
      "validationWarnings": []
    }
  ]
}
```

#### GET /api/admin/google-places/candidates/:id
Get single candidate details with comparison.

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "googlePlaceRaw": { ... },
    "processedData": { ... },
    "duplicateComparison": {
      "isDuplicate": false,
      "similarCampsites": [
        {
          "campsiteId": "uuid",
          "name": "Similar Camp",
          "similarityScore": 0.75,
          "distanceKm": 2.3
        }
      ]
    },
    "confidenceBreakdown": {
      "overall": 0.92,
      "locationMatch": 1.0,
      "dataCompleteness": 0.85,
      "provinceMatch": 1.0,
      "typeMatch": 0.9
    }
  }
}
```

#### POST /api/admin/google-places/candidates/:id/approve
Approve and import a candidate.

**Request:**
```json
{
  "edits": { // Optional edits before import
    "name": "Corrected Name",
    "description": "Better description",
    "priceMin": 1000
  },
  "assignToOwnerId": "uuid", // Optional: assign to owner
  "markAsFeatured": false
}
```

**Response:** 200 OK
```json
{
  "success": true,
  "campsiteId": "uuid",
  "message": "Campsite imported successfully"
}
```

#### POST /api/admin/google-places/candidates/:id/reject
Reject a candidate.

**Request:**
```json
{
  "reason": "duplicate",
  "notes": "Already exists as campsite ID: xxx"
}
```

**Response:** 200 OK
```json
{
  "success": true,
  "message": "Candidate rejected"
}
```

#### POST /api/admin/google-places/candidates/bulk-approve
Bulk approve candidates.

**Request:**
```json
{
  "candidateIds": ["uuid1", "uuid2", "uuid3"],
  "autoAssignOwner": false
}
```

**Response:** 200 OK
```json
{
  "success": true,
  "imported": ["campsiteId1", "campsiteId2", "campsiteId3"],
  "failed": [],
  "message": "3 campsites imported"
}
```

#### POST /api/admin/google-places/process
Trigger AI processing for pending raw places.

**Request:**
```json
{
  "rawPlaceIds": ["uuid1", "uuid2"], // Optional: specific IDs
  "processAll": true // Process all pending
}
```

**Response:** 202 Accepted
```json
{
  "success": true,
  "message": "Processing started",
  "placesToProcess": 150
}
```

---

## SERVICE SPECIFICATIONS

### 1. Google Places Sync Service

**File:** `apps/campsite-backend/src/services/google-places/sync.service.ts`

**Interface:**
```typescript
interface GooglePlacesSyncService {
  // Start a new sync
  startSync(config: SyncConfig): Promise<SyncLog>;

  // Get sync status
  getSyncStatus(syncLogId: string): Promise<SyncStatus>;

  // Cancel running sync
  cancelSync(syncLogId: string): Promise<void>;
}

interface SyncConfig {
  type: 'full' | 'incremental';
  provinces?: string[]; // Empty = all provinces
  maxPlaces?: number;
  downloadPhotos?: boolean;
  fetchReviews?: boolean;
}

interface SyncStatus {
  id: string;
  status: 'running' | 'completed' | 'failed';
  progress: {
    current: number;
    total: number;
    phase: string;
  };
  statistics: SyncStatistics;
}
```

**Key Methods:**
```typescript
class GooglePlacesSyncService {
  async startSync(config: SyncConfig): Promise<SyncLog> {
    // 1. Create sync log
    // 2. Execute text search for each province
    // 3. Fetch place details
    // 4. Download photos
    // 5. Fetch reviews
    // 6. Update sync log
  }

  private async textSearchPhase(provinces: Province[]): Promise<Set<string>> {
    // Search by province (EN + TH)
    // Return unique place_ids
  }

  private async fetchDetailsPhase(placeIds: string[]): Promise<void> {
    // Fetch place details for each ID
    // Store in google_places_raw
  }

  private async downloadPhotosPhase(placeId: string): Promise<void> {
    // Download photos from Google
    // Upload to Supabase Storage
    // Update google_places_photos
  }
}
```

### 2. Text Search Service

**File:** `apps/campsite-backend/src/services/google-places/text-search.service.ts`

```typescript
class GooglePlacesTextSearchService {
  async searchByQuery(query: string): Promise<GooglePlaceSearchResult[]>;
  async searchByProvince(province: Province, language: 'en' | 'th'): Promise<string[]>;
}
```

### 3. Place Details Service

**File:** `apps/campsite-backend/src/services/google-places/details.service.ts`

```typescript
class GooglePlacesDetailsService {
  async getPlaceDetails(placeId: string): Promise<GooglePlaceDetails>;
  async batchGetPlaceDetails(placeIds: string[]): Promise<GooglePlaceDetails[]>;

  private saveRawData(data: GooglePlaceDetails): Promise<GooglePlaceRaw>;
}
```

### 4. Photo Service

**File:** `apps/campsite-backend/src/services/google-places/photo.service.ts`

```typescript
class GooglePlacesPhotoService {
  async downloadPhoto(photoReference: string, placeId: string): Promise<PhotoUrls>;

  private async generateThumbnail(buffer: Buffer): Promise<Buffer>;
  private async uploadToSupabase(buffer: Buffer, path: string): Promise<string>;
}
```

### 5. AI Processing Service

**File:** `apps/campsite-backend/src/services/google-places/ai-processing.service.ts`

```typescript
interface AIProcessingResult {
  confidenceScore: number;
  isDuplicate: boolean;
  duplicateOfCampsiteId?: string;
  processedData: ProcessedCampsiteData;
  validationWarnings: string[];
  suggestedProvinceId: number;
  suggestedTypeId: number;
}

class AIProcessingService {
  async processRawPlace(rawPlace: GooglePlaceRaw): Promise<AIProcessingResult>;

  private async detectDuplicates(rawPlace: GooglePlaceRaw): Promise<DuplicateDetection>;
  private async matchProvince(lat: number, lng: number): Promise<number>;
  private async classifyType(rawPlace: GooglePlaceRaw): Promise<number>;
  private async enrichData(rawPlace: GooglePlaceRaw): Promise<ProcessedCampsiteData>;
}
```

### 6. Deduplication Service

**File:** `apps/campsite-backend/src/services/google-places/deduplication.service.ts`

```typescript
interface DuplicateDetection {
  isDuplicate: boolean;
  duplicateOfCampsiteId?: string;
  similarityScore: number;
  similarCampsites: SimilarCampsite[];
}

class DeduplicationService {
  async detectDuplicate(rawPlace: GooglePlaceRaw): Promise<DuplicateDetection>;

  private compareByName(name: string): Promise<Campsite[]>;
  private compareByLocation(lat: number, lng: number, radiusKm: number): Promise<Campsite[]>;
  private compareByPhone(phone: string): Promise<Campsite>;
  private compareByWebsite(website: string): Promise<Campsite>;
  private calculateSimilarity(rawPlace: GooglePlaceRaw, campsite: Campsite): number;
}
```

### 7. Province Matcher Service

**File:** `apps/campsite-backend/src/services/google-places/province-matcher.service.ts`

```typescript
class ProvinceMatcherService {
  async matchByCoordinates(lat: number, lng: number): Promise<Province>;
  async matchByName(name: string): Promise<Province | null>;
}
```

---

## EXTERNAL INTEGRATIONS

### Google Places API

**Base URL:** `https://maps.googleapis.com/maps/api`

**Authentication:**
```typescript
const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
```

**Rate Limiting:**
- Max 50 QPS per API key
- Implement exponential backoff
- Track request count in sync_logs

**Error Handling:**
```typescript
interface GooglePlacesError {
  status: 'OVER_QUERY_LIMIT' | 'REQUEST_DENIED' | 'INVALID_REQUEST' | 'UNKNOWN_ERROR';
  errorMessage?: string;
}
```

### Supabase Storage

**Bucket Configuration:**
```typescript
const BUCKET_NAME = 'google-places-photos';

// Upload
const { data, error } = await supabase.storage
  .from(BUCKET_NAME)
  .upload(path, buffer);

// Get public URL
const url = supabase.storage
  .from(BUCKET_NAME)
  .getPublicUrl(path);
```

### OpenAI API (for AI Processing)

**Purpose:** Data enrichment, classification, deduplication

**Model:** GPT-4-turbo

**Example Prompt:**
```typescript
const prompt = `
Analyze this Google Places data for a camping site in Thailand:
${JSON.stringify(rawPlace)}

Tasks:
1. Determine if it's a legitimate camping/glamping site
2. Match to Thai province (77 provinces)
3. Classify type: camping, glamping, tented resort, bungalow
4. Check if duplicates exist in our database
5. Extract structured data for campsite import
6. Provide confidence score (0-1)

Response format: JSON
`;
```

---

## NON-FUNCTIONAL REQUIREMENTS

### Performance

| Requirement | Target |
|-------------|--------|
| **Sync Completion Time** | <30 minutes for full sync |
| **Photo Download** | <2 seconds per photo |
| **API Response Time** | <500ms for admin endpoints |
| **AI Processing** | <5 seconds per place |

### Scalability

| Requirement | Target |
|-------------|--------|
| **Concurrent Syncs** | Support 1 sync at a time (queue others) |
| **Places per Sync** | Handle 5,000+ places |
| **Photos per Sync** | Handle 15,000+ photos |
| **Database Growth** | Handle 100K+ raw places |

### Reliability

| Requirement | Target |
|-------------|--------|
| **Sync Success Rate** | >95% |
| **API Retry Success** | >80% on retry |
| **Data Integrity** | Zero data loss |
| **Uptime** | >99% for sync service |

### Maintainability

| Requirement | Target |
|-------------|--------|
| **Code Coverage** | >80% for sync services |
| **Documentation** | All public APIs documented |
| **Logging** | Comprehensive logging for debugging |
| **Monitoring** | Sync status visible in admin dashboard |

---

## SECURITY CONSIDATIONS

### API Key Management

```typescript
// Environment variables
GOOGLE_PLACES_API_KEY=xxx // Backend only, never exposed
OPENAI_API_KEY=xxx // Backend only

// Never include in frontend code
// Use Supabase RLS for storage access
```

### Data Privacy

- **Google Places Data:** Comply with Google Places API Terms of Service
- **User Data:** No personal data stored in raw tables
- **Reviews:** Google reviews are public, but don't import as user reviews

### Access Control

**RLS Policies:**
```sql
-- Only admins can access google_places tables
CREATE POLICY "Admins can view raw places"
    ON google_places_raw FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE auth_user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Only admins can trigger sync
CREATE POLICY "Admins can insert sync logs"
    ON sync_logs FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE auth_user_id = auth.uid()
            AND role = 'admin'
        )
    );
```

### Rate Limiting

```typescript
// Backend rate limiting for admin endpoints
import rateLimit from 'express-rate-limit';

const googlePlacesLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 sync triggers per hour
  message: 'Too many sync requests'
});
```

---

## APPENDICES

### A. Environment Variables

```env
# Google Places API
GOOGLE_PLACES_API_KEY=AIzaSyD...
GOOGLE_PLACES_PROJECT_ID=campsite-thailand

# OpenAI API (for AI processing)
OPENAI_API_KEY=sk-...

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx
SUPABASE_STORAGE_BUCKET=google-places-photos

# Sync Configuration
GOOGLE_PLACES_SYNC_SCHEDULE=0 2 * * 0 # Weekly: Sunday 2 AM
GOOGLE_PLACES_MAX_PLACES_PER_SYNC=5000
GOOGLE_PLACES_DOWNLOAD_PHOTOS=true
GOOGLE_PLACES_FETCH_REVIEWS=true
```

### B. Cron Schedule

**Default:** Weekly on Sunday at 2 AM
```
0 2 * * 0 # Sunday 2:00 AM
```

**Configuration:** Can be overridden via environment variable.

### C. Error Codes

| Code | Description |
|------|-------------|
| `GP_001` | Google Places API key invalid |
| `GP_002` | Google Places API quota exceeded |
| `GP_003` | Photo download failed |
| `GP_004` | Supabase storage upload failed |
| `GP_005` | AI processing failed |
| `GP_006` | Province match failed |
| `GP_007` | Duplicate detection error |

### D. Related Documents
- [PRD-GooglePlaces-Integration.md](./PRD-GooglePlaces-Integration.md) - Product requirements
- [DATABASE-SCHEMA.md](./DATABASE-SCHEMA.md) - Existing database schema
- [CLARIFICATIONS.md](./CLARIFICATIONS.md) - General clarifications

---

**End of SRS - Google Places API Integration**
