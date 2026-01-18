# 📄 Product Requirements Document (PRD)
## Google Places API Integration - Camping Data Ingestion

**Document Version:** 1.0
**Last Updated:** January 18, 2026
**Status:** Draft
**Feature Phase:** Module 12 - Data Enrichment

---

## TABLE OF CONTENTS

1. [Executive Summary](#executive-summary)
2. [Problem Statement](#problem-statement)
3. [Solution Overview](#solution-overview)
4. [Core Features](#core-features)
5. [User Stories](#user-stories)
6. [Data Flow Architecture](#data-flow-architecture)
7. [Success Metrics](#success-metrics)
8. [Roadmap](#roadmap)
9. [Risks & Mitigation](#risks--mitigation)

---

## EXECUTIVE SUMMARY

### Overview
Integrate Google Places API to automatically discover, ingest, and enrich camping site data across Thailand. This feature enables the platform to maintain an up-to-date database of campsites without relying solely on manual owner submissions.

### Key Points
- **Data Source:** Google Places API (Text Search, Nearby Search, Place Details)
- **Update Frequency:** Weekly automated sync
- **Two-Stage Process:** Raw ingestion → AI processing → Campsite import
- **Target Coverage:** All 77 provinces in Thailand
- **Cost Estimate:** ~$40-100/month for 1,000-2,500 campsites

### Business Value
| Benefit | Impact |
|---------|--------|
| **Automated Discovery** | Find campsites that haven't registered on platform |
| **Data Freshness** | Keep information (hours, photos, reviews) up-to-date |
| **Reduced Manual Work** | Eliminate manual data entry for basic campsite info |
| **Competitive Advantage** | Comprehensive coverage vs competitors |

---

## PROBLEM STATEMENT

### Current Pain Points

#### For Platform
- 🔴 **Limited Discovery**
  - Relying solely on owner registrations misses many campsites
  - No systematic way to discover new campsites across Thailand
  - Manual research is time-consuming and incomplete

#### For Users
- 🔴 **Incomplete Database**
  - Users can't find all available campsites
  - Missing information for smaller/newer campsites
  - Outdated contact information and photos

#### For Admins
- 🔴 **Manual Maintenance**
  - No automated way to verify/update existing data
  - Difficult to identify duplicate listings
  - Time-consuming to research and add new campsites manually

---

## SOLUTION OVERVIEW

### Vision Statement
*Automatically discover and maintain a comprehensive database of camping sites across Thailand using Google Places API as a primary data source, enhanced with AI-powered data processing.*

### Solution Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Google Places API                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐     │
│  │ Text Search  │  │Nearby Search │  │    Place Details         │     │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     Stage 1: Raw Data Ingestion                        │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │              Scheduled Job (Weekly - Cron)                      │   │
│  │  • Search by province                                         │   │
│  │  • Fetch place details                                        │   │
│  │  • Store raw JSON                                             │   │
│  │  • Download photos to Supabase Storage                        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                  │                                      │
│                                  ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                   Raw Data Tables (Supabase)                    │   │
│  │  • google_places_raw              - Raw API responses           │   │
│  │  • google_places_photos           - Photo references            │   │
│  │  • google_places_reviews          - Raw review data             │   │
│  │  • sync_logs                      - Execution history           │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                   Stage 2: AI Processing Pipeline                      │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    Admin Dashboard UI                           │   │
│  │  • Review pending raw places                                   │   │
│  │  • View duplicates/similarities                                │   │
│  │  • Trigger AI processing                                       │   │
│  │  • Approve/Reject imports                                      │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                  │                                      │
│                                  ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    AI Processing Service                        │   │
│  │  • Deduplication (vs existing campsites)                       │   │
│  │  • Data validation & enrichment                                │   │
│  │  • Thai language processing                                    │   │
│  │  • Province matching                                           │   │
│  │  • Campsite type classification                                │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                  │                                      │
│                                  ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                   Import Candidates Table                       │   │
│  │  • google_places_import_candidates                             │   │
│  │    - AI-processed data ready for review                        │   │
│  │    - Confidence scores                                         │   │
│  │    - Duplicate warnings                                        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                  Stage 3: Admin Approval & Import                     │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     Admin Action                                │   │
│  │  1. Review candidate data                                      │   │
│  │  2. Edit if needed                                             │   │
│  │  3. Approve → Creates campsite record                          │   │
│  │  4. Assign owner (or leave unassigned)                         │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## CORE FEATURES

### Feature 1: Raw Data Ingestion (Automated)

**Description:** Scheduled job that fetches camping site data from Google Places API and stores raw responses.

**Capabilities:**
- Text Search by queries (e.g., "camping Bangkok", "ลานกางเต็นท์ เชียงใหม่")
- Nearby Search by province coordinates
- Place Details fetch for full information
- Photo reference storage
- Review data extraction
- Automatic retry on API failures

**Search Strategy:**
| Search Type | Queries | Coverage |
|-------------|---------|----------|
| Province-based | 77 provinces × 2 queries (TH, EN) | 154 searches |
| Keyword variations | "camping", "glamping", "ที่พักแคมป์ปิ้ง" | ~50 searches |
| Regional centers | Major city coordinates | ~20 searches |

**Data Stored per Place:**
```json
{
  "place_id": "ChIJN1t_tDeuEmsRUsoyG83frY4",
  "name": "Beautiful Camping Ground",
  "name_th": "ลานกางเต็นท์สวยงาม",
  "formatted_address": "123 Camping Rd, Bangkok, Thailand",
  "geometry": { "lat": 14.0695, "lng": 100.7738 },
  "formatted_phone_number": "+66 2 123 4567",
  "website": "https://www.campingsite.com",
  "rating": 4.5,
  "user_ratings_total": 250,
  "price_level": 2,
  "photos": ["photo_ref_1", "photo_ref_2", ...],
  "reviews": [...],
  "types": ["campground", "lodging", "point_of_interest"],
  "business_status": "OPERATIONAL",
  "opening_hours": { "open_now": true, ... }
}
```

### Feature 2: Photo Storage & Management

**Description:** Download and store campsite photos from Google Places API to Supabase Storage.

**Capabilities:**
- Fetch photos using photo_reference
- Store in Supabase Storage bucket (`google-places-photos`)
- Generate optimized thumbnails
- Store local URLs in database
- Handle API quota limits

**Storage Structure:**
```
google-places-photos/
├── {place_id}/
│   ├── photo_1_original.jpg
│   ├── photo_1_thumbnail.jpg
│   ├── photo_2_original.jpg
│   └── photo_2_thumbnail.jpg
```

### Feature 3: Sync Management

**Description:** Track and manage sync operations.

**Capabilities:**
- Scheduled execution (weekly cron)
- Manual trigger from admin dashboard
- Sync history and logs
- Error tracking and retry
- API quota monitoring
- Progress tracking

**Sync Log Fields:**
- Started/ended timestamps
- Status (running, completed, failed)
- Places found
- Places updated
- Places created
- API requests made
- Cost estimate
- Errors encountered

### Feature 4: AI Data Processing

**Description:** Process raw data using AI to prepare for import.

**Capabilities:**
- **Deduplication:** Match against existing campsites by name, location, phone
- **Province Detection:** Match coordinates to Thai provinces
- **Type Classification:** Classify as camping/glamping/tented resort/etc.
- **Data Validation:** Check for required fields, valid coordinates
- **Thai Language Support:** Extract and process Thai names/descriptions
- **Confidence Scoring:** Rate quality of data match

**AI Outputs:**
```json
{
  "confidence_score": 0.92,
  "is_duplicate": false,
  "duplicate_of": null,
  "matched_province_id": 2,
  "matched_type_id": 1,
  "name_en": "Beautiful Camping Ground",
  "name_th": "ลานกางเต็นท์สวยงาม",
  "suggested_status": "pending",
  "warnings": ["No price information found"],
  "processed_data": {
    "name": "Beautiful Camping Ground",
    "description": "...",
    "address": "...",
    "latitude": 14.0695,
    "longitude": 100.7738,
    "phone": "+66 2 123 4567",
    "website": "https://...",
    "rating_average": 4.5,
    "review_count": 250,
    "province_id": 2,
    "type_id": 1
  }
}
```

### Feature 5: Admin Import Dashboard

**Description:** Admin UI for reviewing and importing processed candidates.

**Capabilities:**
- List of import candidates with filters
- Side-by-side comparison with existing campsites
- Edit data before import
- Approve/Reject individual or bulk
- Assign to owner accounts
- View raw Google Places data
- See AI confidence scores and warnings

---

## USER STORIES

### For Admin Users

| ID | Story | Priority |
|----|-------|----------|
| **GP-001** | As an admin, I want to trigger a manual Google Places sync so I can update campsite data on demand | High |
| **GP-002** | As an admin, I want to view sync history and logs so I can troubleshoot issues | High |
| **GP-003** | As an admin, I want to review AI-processed candidates before importing so I maintain data quality | High |
| **GP-004** | As an admin, I want to see duplicate warnings so I don't create duplicate listings | High |
| **GP-005** | As an admin, I want to bulk approve candidates so I can efficiently import many campsites | Medium |
| **GP-006** | As an admin, I want to edit candidate data before import so I can correct AI errors | Medium |
| **GP-007** | As an admin, I want to assign imported campsites to owner accounts so owners can manage them | Medium |

### For System

| ID | Story | Priority |
|----|-------|----------|
| **GP-101** | As a system, I want to automatically sync Google Places data weekly so data stays fresh | High |
| **GP-102** | As a system, I want to retry failed API requests so I don't lose data | High |
| **GP-103** | As a system, I want to monitor API quota usage so I don't exceed limits | High |
| **GP-104** | As a system, I want to deduplicate against existing campsites so I don't create duplicates | High |

---

## DATA FLOW ARCHITECTURE

### Detailed Data Flow

```
┌────────────────────────────────────────────────────────────────────────────┐
│                         WEEKLY SCHEDULED SYNC                              │
│                           (Cron Job)                                      │
└────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌────────────────────────────────────────────────────────────────────────────┐
│  1. TEXT SEARCH PHASE                                                      │
│     ┌──────────────────────────────────────────────────────────────────┐  │
│     │ For each province:                                               │  │
│     │   - Search "camping {province}" (EN)                             │  │
│     │   - Search "ลานกางเต็นท์ {province}" (TH)                          │  │
│     │   - Extract place_ids                                            │  │
│     │   - Store in google_places_raw                                   │  │
│     └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌────────────────────────────────────────────────────────────────────────────┐
│  2. PLACE DETAILS PHASE                                                    │
│     ┌──────────────────────────────────────────────────────────────────┐  │
│     │ For each unique place_id:                                        │  │
│     │   - Fetch Place Details                                         │  │
│     │   - Update google_places_raw with full data                      │  │
│     │   - Extract photo references                                     │  │
│     │   - Store in google_places_photos                                │  │
│     │   - Extract reviews                                              │  │
│     │   - Store in google_places_reviews                               │  │
│     └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌────────────────────────────────────────────────────────────────────────────┐
│  3. PHOTO DOWNLOAD PHASE                                                   │
│     ┌──────────────────────────────────────────────────────────────────┐  │
│     │ For each photo reference:                                        │  │
│     │   - Download from Google Places API                             │  │
│     │   - Store in Supabase Storage                                   │  │
│     │   - Generate thumbnail                                          │  │
│     │   - Update google_places_photos with URLs                       │  │
│     └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌────────────────────────────────────────────────────────────────────────────┐
│  4. SYNC COMPLETION                                                         │
│     ┌──────────────────────────────────────────────────────────────────┐  │
│     │ Update sync_logs:                                                │  │
│     │   - Set status = 'completed'                                     │  │
│     │   - Record statistics                                           │  │
│     │   - Calculate API cost                                          │  │
│     └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌────────────────────────────────────────────────────────────────────────────┐
│  5. AI PROCESSING (On-Demand)                                             │
│     ┌──────────────────────────────────────────────────────────────────┐  │
│     │ Triggered by Admin or scheduled after sync:                      │  │
│     │   - Find new/updated raw places                                  │  │
│     │   - Run deduplication vs existing campsites                      │  │
│     │   - Classify province and type                                   │  │
│     │   - Generate confidence scores                                   │  │
│     │   - Create google_places_import_candidates records               │  │
│     └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌────────────────────────────────────────────────────────────────────────────┐
│  6. ADMIN REVIEW & IMPORT                                                  │
│     ┌──────────────────────────────────────────────────────────────────┐  │
│     │ Admin action via Dashboard:                                       │  │
│     │   - Review candidates with AI suggestions                        │  │
│     │   - Edit if necessary                                            │  │
│     │   - Approve → Creates campsite record                            │  │
│     │   - Assign owner (optional)                                      │  │
│     │   - Link photos to campsite_photos                               │  │
│     │   - Mark google_places_raw as 'imported'                         │  │
│     └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## SUCCESS METRICS

### Data Coverage Metrics
| Metric | Target | Measurement |
|--------|--------|-------------|
| **Total Campsites Discovered** | 1,000+ | Count of unique places in google_places_raw |
| **Province Coverage** | 77/77 (100%) | Number of provinces with ≥1 campsite |
| **Data Freshness** | Weekly | Time between syncs |
| **Import Rate** | 60%+ | % of raw places imported as campsites |

### Data Quality Metrics
| Metric | Target | Measurement |
|--------|--------|-------------|
| **Duplicate Detection** | <2% false positives | Duplicate accuracy rate |
| **Province Match Rate** | 95%+ | % correctly matched to province |
| **Type Classification** | 90%+ | % correctly classified campsite type |
| **Required Field Completeness** | 85%+ | % with name, address, coordinates |

### Cost Metrics
| Metric | Target | Measurement |
|--------|--------|-------------|
| **Monthly API Cost** | <$100 | Google Places API billing |
| **Cost per Campsite** | <$0.10 | Total cost / campsites discovered |
| **Storage Cost** | <$10/month | Supabase Storage for photos |

---

## ROADMAP

### Phase 1: Foundation (Week 1-2)
- [ ] Set up Google Cloud project and API key
- [ ] Create raw data tables (migrations)
- [ ] Build sync service framework
- [ ] Implement Text Search ingestion
- [ ] Implement Place Details fetch
- [ ] Basic sync logging

### Phase 2: Photo & Review Storage (Week 3)
- [ ] Photo download service
- [ ] Supabase Storage integration
- [ ] Thumbnail generation
- [ ] Review data extraction
- [ ] Update sync with photos/reviews

### Phase 3: AI Processing (Week 4-5)
- [ ] Deduplication algorithm
- [ ] Province matching service
- [ ] Type classification
- [ ] Confidence scoring
- [ ] Import candidates table
- [ ] Processing job

### Phase 4: Admin Dashboard (Week 6)
- [ ] Sync management UI
- [ ] Sync history view
- [ ] Candidate review list
- [ ] Side-by-side comparison
- [ ] Approve/Reject actions
- [ ] Bulk import

### Phase 5: Testing & Launch (Week 7-8)
- [ ] Unit tests for sync service
- [ ] Integration tests for AI processing
- [ ] E2E tests for admin dashboard
- [ ] Load testing with real data
- [ ] Cost monitoring
- [ ] Documentation

---

## RISKS & MITIGATION

### Technical Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **API Rate Limits** | Sync incomplete | Implement exponential backoff, spread requests over time |
| **API Cost Overrun** | Budget exceeded | Set cost alerts, implement request quotas, monitor daily |
| **Duplicate Data** | Poor UX | Multi-factor deduplication (name, location, phone, website) |
| **Low Data Quality** | Incorrect imports | AI confidence scoring, manual admin review required |
| **Thai Language Issues** | Mismatched provinces | Use coordinates + geocoding for province detection |
| **Photo Storage Limits** | Cost overrun | Compress images, limit to 3 photos per place |

### Business Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Terms of Service** | Legal issues | Review Google Places API ToS, ensure compliance |
| **Owner Pushback** | Relationship issues | Allow owners to claim/import their listings |
| **Data Staleness** | Outdated info | Weekly sync + manual update triggers |
| **Competitor Data** | Copying | Unique data beyond Google (reviews, inquiries) |

### Operational Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Sync Failures** | Missing data | Retry logic, error notifications, manual trigger |
| **Import Errors** | Bad data in production | Validation checks, staging environment first |
| **Admin Overload** | Too many candidates | Filter by confidence score, prioritize high-quality |

---

## APPENDICES

### A. Google Places API Endpoints Used

| Endpoint | Purpose | Cost per Request |
|----------|---------|------------------|
| `/maps/api/place/textsearch/json` | Search by query | $0.017 |
| `/maps/api/place/nearbysearch/json` | Search by location | $0.017 |
| `/maps/api/place/details/json` | Get place details | $0.032 |
| `/maps/api/place/photo` | Get photo | $0.007 |

### B. Cost Estimate Calculation

**For 1,000 campsites:**
```
Text Search: 77 provinces × 2 queries = 154 × $0.017 = $2.62
Nearby Search: ~50 × $0.017 = $0.85
Place Details: 1,000 × $0.032 = $32.00
Photos: 1,000 × 3 photos × $0.007 = $21.00
─────────────────────────────────────────────
Total: ~$56.47 per sync
Monthly: ~$226 (4 syncs) or ~$56 (1 sync/month)
```

**Recommended:** Weekly sync with incremental updates (only changed/new places) = ~$100-150/month

### C. Related Documents
- [SRS-GooglePlaces-Integration.md](./SRS-GooglePlaces-Integration.md) - Technical specifications
- [DATABASE-SCHEMA.md](./DATABASE-SCHEMA.md) - Existing database schema
- [google_places_api_guide.md](../docs/google_places_api_guide.md) - API implementation guide

---

**End of PRD - Google Places API Integration**
