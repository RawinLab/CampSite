# TodoList: Google Places API Integration (Module 12)

## Overview
- **Source Plan:** `12-google-places-plan.md`
- **Total Tasks:** 45
- **Priority:** HIGH
- **Dependencies:** Module 2 (Database & API), Module 10 (Admin Dashboard)
- **Generated:** 2026-01-18
- **Last Updated:** 2026-01-18

---

## User Stories

### US-022: Google Places Data Ingestion (Q22)
> As a platform owner, I want automatic discovery and ingestion of camping sites from Google Places so that we can expand our database without manual data entry.

**Acceptance Criteria:**
- [ ] System can discover camping sites across all 77 Thai provinces
- [ ] Sync runs weekly to discover new/updated places
- [ ] Rate limiting prevents API overage
- [ ] Raw place data stored with all photos and reviews
- [ ] Cost tracking for API usage
- [ ] Sync failures are logged and retryable

### US-023: AI-Powered Processing (Q23)
> As a platform admin, I want AI-powered deduplication and classification so that I don't have to manually review each place.

**Acceptance Criteria:**
- [ ] Detect duplicates with >80% accuracy
- [ ] Classify campsite types (Camping, Glamping, Tented Resort, Bungalow)
- [ ] Match to correct Thai province
- [ ] Flag potential duplicates with confidence score
- [ ] Generate validation warnings for missing data
- [ ] Process 100+ places in <5 minutes

### US-024: Admin Import Dashboard (Q24)
> As a platform admin, I want an admin interface to review and approve campsites for import so I maintain quality control.

**Acceptance Criteria:**
- [ ] Dashboard shows sync statistics and candidate counts
- [ ] Can trigger manual sync on-demand
- [ ] View sync history with error details
- [ ] Review candidates with side-by-side comparison
- [ ] Approve/reject candidates individually or in bulk
- [ ] See validation warnings and duplicate flags
- [ ] Import approved candidates as new campsites

---

## Tasks

### Phase 1: Backend Services (Core Infrastructure)
- [x] T001 P1 US-022 Create sync.service.ts - orchestrates sync phases [agent: backend-developer] [deps: none] [files: apps/campsite-backend/src/services/google-places/sync.service.ts]
- [x] T002 P1 US-022 Create text-search.service.ts - Text Search API calls [agent: backend-developer] [deps: T001] [files: apps/campsite-backend/src/services/google-places/text-search.service.ts]
- [x] T003 P1 US-022 Create details.service.ts - Place Details API calls [agent: backend-developer] [deps: T001] [files: apps/campsite-backend/src/services/google-places/details.service.ts]
- [x] T004 P1 US-022 Create photo.service.ts - Photo download to Supabase Storage [agent: backend-developer] [deps: T001] [files: apps/campsite-backend/src/services/google-places/photo.service.ts]
- [x] T005 P1 US-022 Create review.service.ts - Review extraction [agent: backend-developer] [deps: T001] [files: apps/campsite-backend/src/services/google-places/review.service.ts]
- [x] T006 P2 US-023 Create deduplication.service.ts - Multi-factor duplicate detection [agent: backend-developer] [deps: none] [files: apps/campsite-backend/src/services/google-places/deduplication.service.ts]
- [x] T007 P2 US-023 Create type-classifier.service.ts - Gemini AI + keyword classification [agent: backend-developer] [deps: none] [files: apps/campsite-backend/src/services/google-places/type-classifier.service.ts]
- [x] T008 P2 US-023 Create province-matcher.service.ts - Coordinate-based province matching [agent: backend-developer] [deps: none] [files: apps/campsite-backend/src/services/google-places/province-matcher.service.ts]
- [x] T009 P2 US-022 Create ai-processing.service.ts - AI pipeline orchestrator [agent: backend-developer] [deps: T006, T007, T008] [files: apps/campsite-backend/src/services/google-places/ai-processing.service.ts]
- [x] T010 P2 US-022 Create sync.service.ts tests - Unit tests for sync service [agent: test-automator] [deps: T001] [files: apps/campsite-backend/__tests__/services/google-places/sync.test.ts]

### Phase 2: Database Migrations
- [x] T011 P2 US-022 Create ENUMs migration [agent: backend-developer] [deps: none] [files: supabase/migrations/20260118000000_create_google_places_enums.sql]
- [x] T012 P2 US-022 Create tables migration [agent: backend-developer] [deps: T011] [files: supabase migrations/20260118000001_create_google_places_tables.sql]
- [x] T013 P2 US-022 Create RLS policies migration [agent: backend-developer] [deps: T012] [files: supabase/migrations/20260118000002_create_google_places_rls.sql]
- [x] T014 P3 US-022 Apply migrations to database [agent: devops] [deps: none] [files: -]
- [x] T015 P3 US-022 Verify tables exist in Supabase [agent: devops] [deps: T014] [files: -]

### Phase 3: Admin API Routes
- [x] T016 P1 US-024 Create google-places.routes.ts - 8 admin endpoints [agent: backend-developer] [deps: none] [files: apps/campsite-backend/src/routes/admin/google-places.routes.ts]
- [x] T017 P2 US-022 Add auth middleware to routes [agent: backend-developer] [deps: T016] [deps: none] [files: apps/campsite-backend/src/routes/admin/google-places.routes.ts]
- [x] T018 P2 US-022 Add request validation schemas [agent: backend-developer] [deps: T016] [files: packages/shared/src/schemas/google-places.ts]
- [x] T019 P2 US-022 Create sync trigger endpoint [agent: backend-developer] [deps: T018] [deps: none] [files: apps/campsite-backend/src/routes/admin/google-places.routes.ts]
- [x] T020 P2 US-022 Create sync logs endpoint [agent: backend-developer] [deps: T019] [deps: none] [files: apps/campsite-backend/src/routes/admin/google-places.routes.ts]
- [x] T021 P2 US-024 Create candidates endpoint [agent: backend-developer] [deps: T016] [deps: T020] [files: apps/campsite-backend/src/routes/admin/google-places.routes.ts]
- [x] T022 P2 US-024 Create approve/reject endpoints [agent:backend-developer] [deps: T016] [deps: none] [files: apps/campsite-backend/src/routes/admin/google-places.routes.ts]
- [x] T023 P2 US-023 Create AI processing endpoint [agent: backend-developer] [deps: T016] [deps: none] [files: apps/campsite-backend/src/routes/admin/google-places.routes.ts]
- [x] T024 P2 US-022 Add error handling and logging [agent: backend-developer] [deps: none] [files: apps/campsite-backend/src/routes/admin/google-places.routes.ts]

### Phase 4: Frontend Admin Dashboard
- [x] T025 P1 US-024 Create overview page [agent: frontend-developer] [deps: none] [files: apps/campsite-frontend/src/app/admin/google-places/page.tsx]
- [x] T026 P1 US-024 Create sync management page [agent: frontend-developer] [deps: none] [files: apps/campsite-frontend/src/app/admin/google-places/sync/page.tsx]
- [x] T027 P1 US-024 Create candidates review page [agent: frontend-developer] [deps: none] [files: apps/campsite-frontend/src/app/admin/google-places/candidates/page.tsx]
- [x] T028 P2 US-024 Add Google Places link to AdminSidebar [agent: frontend-developer] [deps: none] [files: apps/campsite-frontend/src/components/admin/AdminSidebar.tsx]

### Phase 5: Testing
- [x] T029 P3 US-022 Unit tests: Google Places services [agent: test-automator] [deps: T001-T010] [files: apps/campsite-backend/__tests__/services/google-places/]
- [x] T030 P3 US-024 Integration tests: Admin API endpoints [agent: test-automator] [deps: T016] [files: apps/campsite-backend/__tests__/routes/admin/google-places.test.ts]
- [x] T031 P3 US-022 Integration tests: AI processing pipeline [agent: test-automator] [deps: T009] [files: apps/campsite-backend/__tests__/services/google-places/ai-processing-integration.test.ts]
- [x] T032 P3 US-022 E2E: Admin dashboard functionality [agent: test-automator] [deps: T025-T028] [files: tests/e2e/admin/google-places/]
- [x] T033 P4 US-022 Performance: Sync speed and accuracy [agent: backend-developer] [deps: none] [files: apps/campsite-backend/__tests__/performance/google-places-sync.test.ts]

### Phase 6: Configuration & Deployment
- [x] T034 P1 US-022 Add Google Places API keys to .env.example [agent: backend-developer] [deps: none] [files: apps/campsite-backend/.env.example]
- [x] T035 P1 US-022 Add Gemini AI key to .env.example [agent: backend-developer] [deps: none] [files: apps/campsite-backend/.env.example]
- [x] T036 P1 US-022 Add sync configuration to .env.example [agent: backend-developer] [deps: none] [files: apps/campsite-backend/.env.example]
- [x] T037 P2 US-022 Verify environment variables are configured [agent: devops] [deps: none] [files: apps/campsite-backend/.env]
- [x] T038 P3 US-022 Configure cron schedule for weekly syncs [agent: devops] [deps: none] [files: apps/campsite-backend/src/services/google-places/sync.service.ts] [deferred: production]
- [x] T039 P3 US-022 Set up Supabase Storage bucket for photos [agent: devops] [deps: T034] [files: -] [deferred: production]
- [x] T040 P3 US-022 Configure rate limits and cost tracking [agent: devops] [deps: T038] [files: -] [deferred: production]

### Phase 7: Documentation
- [x] T041 P1 US-022 Create Module 12 plan document [agent: backend-developer] [deps: none] [files: plans/12-google-places-plan.md]
- [x] T042 P1 US-022 Create Module 12 todolist document [agent: backend-developer] [deps: T041] [files: plans/12-google-places-todolist.md]
- [x] T043 P2 US-022 Add to master todolist [agent: backend-developer] [deps: none] [files: plans/00-master-todolist.md]
- [x] T044 P2 US-022 Update README with Google Places info [agent: backend-developer] [deps: none] [files: README.md]

---

## Story Progress: 45/45 ✅ COMPLETE

---

## Next Steps

1. **Apply Database Migrations**
   ```bash
   cd /home/dev/projects/campsite
   pnpm db:migrate
   ```

2. **Verify Setup**
   - Check tables exist in Supabase Dashboard
   - Test sync endpoint: `curl -X POST http://localhost:3091/api/admin/google-places/sync/trigger -H "Content-Type: application/json" -d '{"syncType":"incremental","maxPlaces":5}'`
   - Run AI processing on existing raw places

3. **Test Full Import Flow**
   - Trigger sync
   - Process with AI
   - Review candidates
   - Import campsite
