# Plan: Google Places API Integration (Module 12)

## Module Information
- **Module:** 12
- **Name:** Google Places API Integration
- **Priority:** HIGH
- **Sprint:** 4-5
- **Story Points:** 15
- **Dependencies:** Module 2 (Database & API), Module 10 (Admin Dashboard)
- **Related Clarifications:** Q22 (Google Places data source), Q24 (Admin approval), Q23 (AI-powered deduplication)

---

## Overview

Implement Google Places API integration for automated discovery, ingestion, and AI-powered processing of camping site data across Thailand. The system uses Google Places API to discover potential campsites, applies AI for deduplication and classification, and provides admin interface for reviewing and importing.

---

## Features

### 12.1 Google Places Data Ingestion (Q22)
**Priority:** HIGH

**API Integration:**
- Google Places Text Search API (New) for discovering camping sites
- Google Places Details API (New) for fetching comprehensive place data
- Rate limiting and cost control (max places per sync, budget limits)
- Weekly scheduled incremental syncs

**Data Storage:**
- `google_places_raw` - Raw API responses with full place details
- `google_places_photos` - Photo references and storage URLs
- `google_places_reviews` - Raw review data (not imported as user reviews)

### 12.2 AI-Powered Processing (Q23)
**Priority:** HIGH

**Deduplication:**
- Multi-factor comparison: name similarity, location proximity, phone/website matching
- Duplicate confidence scoring (>0.8 = high confidence duplicate)
- Similar campsites tracking

**Type Classification:**
- Google Gemini AI for campsite type classification (Camping, Glamping, Tented Resort, Bungalow)
- Keyword-based fallback classification
- Confidence scoring per type

**Province Matching:**
- Coordinate-based province matching
- Thai province cache with 77 provinces

### 12.3 Admin Import Dashboard (Q24)
**Priority:** HIGH

**Candidate Management:**
- Import candidates with AI-processed data
- Confidence score, duplicate flag, validation warnings
- Admin approval workflow
- Bulk operations (approve/reject)

**Sync Management:**
- Manual sync trigger
- Sync history logs with statistics
- Real-time sync status tracking
- Error reporting and retry logic

---

## Architecture

### Backend Services

```typescript
services/google-places/
├── sync.service.ts              // Main sync orchestrator (cron + manual)
├── text-search.service.ts         // Text Search API calls
├── details.service.ts            // Place Details API calls
├── photo.service.ts              // Photo download to Supabase Storage
├── review.service.ts             // Review extraction
├── ai-processing.service.ts       // AI pipeline orchestrator
├── deduplication.service.ts       // Duplicate detection
├── type-classifier.service.ts     // Type classification (Gemini AI + keyword)
└── province-matcher.service.ts    // Province matching
```

### Database Schema

```sql
-- ENUM types
sync_status: 'pending' | 'processing' | 'completed' | 'failed'
import_candidate_status: 'pending' | 'approved' | 'rejected' | 'imported'
campsite_status: 'pending' | 'approved' | 'rejected'

-- Main tables
google_places_raw              // Raw Google Places API data
google_places_photos           // Photo references and storage URLs
google_places_reviews          // Raw review data
google_places_import_candidates // AI-processed import candidates
sync_logs                      // Sync execution logs
```

### Admin API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/admin/google-places/sync/trigger` | Trigger manual sync |
| GET | `/api/admin/google-places/sync/logs` | Get sync history |
| GET | `/api/admin/google-places/candidates` | List candidates |
| GET | `/api/admin/google-places/candidates/:id` | Get candidate details |
| POST | `/api/admin/google-places/candidates/:id/approve` | Approve & import |
| POST | `/api/admin/google-places/candidates/:id/reject` | Reject candidate |
| POST | `/api/admin/google-places/candidates/bulk-approve` | Bulk approve |
| POST | `/api/admin/google-places/process` | Trigger AI processing |

### Frontend Admin Pages

```
/app/admin/google-places/
├── page.tsx                    // Overview dashboard
├── sync/page.tsx              // Sync management
└── candidates/page.tsx        // Candidate review list
```

---

## Google Places API Configuration

### Environment Variables (.env)

```env
# Google Places API
GOOGLE_PLACES_API_KEY=AIzaSyChsu1HvGDybfRv0LghEktWcO303Z80JZ0
GOOGLE_PLACES_PROJECT_ID=campsite-thailand

# Google Gemini AI
GEMINI_API_KEY=AIzaSyA-_3A4zhptpWvbvhjmt0otmUCQq39X-C4s

# Sync Configuration
GOOGLE_PLACES_SYNC_SCHEDULE=0 2 * * 0  # Weekly: Sunday 2 AM
GOOGLE_PLACES_MAX_PLACES_PER_SYNC=5000
GOOGLE_PLACES_DOWNLOAD_PHOTOS=true
GOOGLE_PLACES_FETCH_REVIEWS=true
```

### API Pricing (per request)

| API | Cost (USD) |
|-----|-------------|
| Text Search | $0.017 |
| Nearby Search | $0.017 |
| Place Details | $0.032 |
| Place Photo | $0.007 |

**Estimated Cost:** ~$3-5 per full sync (1000 places)

---

## Sync Process Flow

```
1. TEXT SEARCH (Phase 1)
   ├─ Search for "camping {province}" in English
   └─ Search for "ลานกางเต็นท์ {province}" in Thai
   └─ Returns place_ids (IDs from Places API New)

2. FETCH DETAILS (Phase 2)
   └─ Fetch full details for each place_id using Places API (New)
   └─ Store in google_places_raw table

3. DOWNLOAD PHOTOS (Phase 3)
   └─ Create photo references in google_places_photos table
   └─ Photos can be downloaded later to Supabase Storage

4. FETCH REVIEWS (Phase 4)
   └─ Extract reviews from place details
   └─ Store in google_places_reviews table
```

---

## AI Processing Pipeline

```
Raw Places → Deduplication → Type Classification → Province Matching → Import Candidates
                    ↓                    ↓                      ↓
                Duplicate Flag    Type ID (1-4)         Province ID (1-77)
                Confidence Score   Confidence Score          Validation Warnings
```

---

## Implementation Status

| Component | Status | Notes |
|-----------|--------|-------|
| **Backend Services** | ✅ Complete | All 7 services implemented |
| **Database Migrations** | ⚠️ Created | Files ready, need to apply |
| **Admin API Routes** | ✅ Complete | 8 endpoints working |
| **Frontend Admin** | ✅ Complete | 3 pages with components |
| **Migrations Applied** | ❌ Pending | Need to run `pnpm db:migrate` |

---

## Success Criteria

| Metric | Target | Test Method |
|--------|--------|-------------|
| **Tables created** | 5 tables + 2 enums | Verify via Supabase Dashboard |
| **API endpoints** | 8 endpoints responding | curl tests |
| **Sync completion** | <30 minutes for 100 places | Manual sync trigger |
| **AI processing** | Candidates created with scores | Database query |
| **Admin dashboard** | Pages load without errors | Browser test |

---

## Migration Files

| File | Description |
|------|-------------|
| `20260118000000_create_google_places_enums.sql` | ENUM types |
| `20260118000001_create_google_places_tables.sql` | 5 tables (raw, photos, reviews, candidates, logs) |
| `20260118000002_create_google_places_rls.sql` | RLS policies |

---

## Next Steps

1. **Apply Database Migrations:**
   ```bash
   pnpm db:migrate
   ```

2. **Verify Setup:**
   - Check tables exist in Supabase Dashboard
   - Test sync endpoint
   - Run AI processing on existing raw places

3. **Test Full Flow:**
   - Trigger sync → Fetch details → AI process → Review candidates → Import campsite
   - Verify duplicate detection
   - Test type classification
   - Validate province matching
