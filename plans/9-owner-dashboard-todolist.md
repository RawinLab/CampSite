# TodoList: Owner Dashboard (Module 9)

## Overview
- **Source Plan:** `9-owner-dashboard-plan.md`
- **User Stories:** US-020 (Analytics Dashboard), US-021 (Listing Management), US-022 (Inquiry Management)
- **Total Tasks:** 62
- **Priority:** HIGH
- **Dependencies:** Module 1 (Auth), Module 2 (API), Module 8 (Inquiry)
- **Generated:** 2026-01-17

---

## User Story: US-020 Owner Analytics Dashboard
> As a campsite owner, I want to view analytics for my listings so that I can track performance and engagement.

### Acceptance Criteria
- [ ] Dashboard displays core metrics (search impressions, views, clicks, inquiries)
- [ ] Month-over-month change indicators shown
- [ ] Charts display 30-day trends
- [ ] Analytics refresh in real-time
- [ ] Only owner's own data visible
- [ ] Mobile responsive design
- [ ] Loading states with skeletons
- [ ] Empty states for new owners

### Tasks

#### Phase 1: Database & Analytics Infrastructure
- [ ] T001 P1 US-020 Create analytics_events table migration [agent: backend-architect] [deps: none] [files: supabase/migrations/20260117200000_create_analytics_events.sql]
- [ ] T002 P1 US-020 Create indexes for analytics queries [agent: backend-architect] [deps: T001] [files: supabase/migrations/20260117200001_analytics_indexes.sql]
- [ ] T003 P1 US-020 Create analytics RLS policies [agent: backend-architect] [deps: T001] [files: supabase/migrations/20260117200002_analytics_rls.sql]
- [ ] T004 P1 US-020 Create analytics aggregation views [agent: backend-architect] [deps: T001] [files: supabase/migrations/20260117200003_analytics_views.sql]
- [ ] T005 P2 US-020 Unit test: Verify analytics_events schema [agent: test-automator] [deps: T001] [files: apps/campsite-backend/__tests__/db/analytics-schema.test.ts]
- [ ] T006 P2 US-020 Unit test: Verify analytics RLS policies [agent: test-automator] [deps: T003] [files: apps/campsite-backend/__tests__/db/analytics-rls.test.ts]

#### Phase 2: Backend API - Analytics
- [x] T007 P1 US-020 Create analytics service [agent: backend-architect] [deps: T001] [files: apps/campsite-backend/src/services/analytics.service.ts]
- [x] T008 P1 US-020 Create dashboard stats endpoint [agent: backend-architect] [deps: T007] [files: apps/campsite-backend/src/routes/dashboard.ts]
- [x] T009 P1 US-020 Create analytics charts endpoint [agent: backend-architect] [deps: T007] [files: apps/campsite-backend/src/routes/dashboard.ts]
- [x] T010 P1 US-020 Add owner guard middleware [agent: backend-architect] [deps: none] [files: apps/campsite-backend/src/middleware/owner-guard.ts]
- [ ] T011 P2 US-020 Unit test: Analytics service calculates stats correctly [agent: test-automator] [deps: T007] [files: apps/campsite-backend/__tests__/services/analytics.test.ts]
- [ ] T012 P2 US-020 Unit test: Dashboard stats endpoint returns correct data [agent: test-automator] [deps: T008] [files: apps/campsite-backend/__tests__/routes/dashboard-stats.test.ts]
- [ ] T013 P2 US-020 Integration test: Analytics queries perform efficiently [agent: test-automator] [deps: T002] [files: tests/integration/analytics-performance.test.ts]

#### Phase 3: Shared Types & Schemas
- [x] T014 P1 US-020 Create analytics TypeScript types [agent: backend-architect] [deps: none] [files: packages/shared/src/types/analytics.ts]
- [x] T015 P1 US-020 Create dashboard stats response schema [agent: backend-architect] [deps: T014] [files: packages/shared/src/schemas/dashboard.ts]
- [ ] T016 P2 US-020 Unit test: Verify analytics types [agent: test-automator] [deps: T014] [files: packages/shared/__tests__/types/analytics.test.ts]

#### Phase 4: Frontend Components - Dashboard Overview
- [x] T017 P1 US-020 Create StatCard component [agent: frontend-developer] [deps: none] [files: apps/campsite-frontend/src/components/dashboard/StatCard.tsx]
- [x] T018 P1 US-020 Create AnalyticsChart component [agent: frontend-developer] [deps: none] [files: apps/campsite-frontend/src/components/dashboard/AnalyticsChart.tsx]
- [x] T019 P1 US-020 Create DashboardSkeleton component [agent: frontend-developer] [deps: none] [files: apps/campsite-frontend/src/components/dashboard/DashboardSkeleton.tsx]
- [x] T020 P1 US-020 Create dashboard layout [agent: frontend-developer] [deps: none] [files: apps/campsite-frontend/src/app/dashboard/layout.tsx]
- [x] T021 P1 US-020 Create dashboard overview page [agent: frontend-developer] [deps: T017, T018, T020] [files: apps/campsite-frontend/src/app/dashboard/page.tsx]
- [x] T022 P1 US-020 Create dashboard loading state [agent: frontend-developer] [deps: T019] [files: apps/campsite-frontend/src/app/dashboard/loading.tsx]
- [ ] T023 P2 US-020 Unit test: StatCard renders correctly [agent: test-automator] [deps: T017] [files: apps/campsite-frontend/__tests__/components/StatCard.test.tsx]
- [ ] T024 P2 US-020 Unit test: AnalyticsChart displays data [agent: test-automator] [deps: T018] [files: apps/campsite-frontend/__tests__/components/AnalyticsChart.test.tsx]
- [ ] T025 P2 US-020 Unit test: Dashboard layout restricts non-owners [agent: test-automator] [deps: T020] [files: apps/campsite-frontend/__tests__/app/dashboard-layout.test.tsx]

#### Phase 5: E2E Tests - Analytics
- [ ] T026 P2 US-020 E2E: Owner can view dashboard [agent: test-automator] [deps: T021] [files: tests/e2e/dashboard/owner-dashboard.test.ts]
- [ ] T027 P2 US-020 E2E: Stats cards display correctly [agent: test-automator] [deps: T021] [files: tests/e2e/dashboard/analytics-stats.test.ts]
- [ ] T028 P2 US-020 E2E: Charts load with 30-day data [agent: test-automator] [deps: T021] [files: tests/e2e/dashboard/analytics-charts.test.ts]
- [ ] T029 P2 US-020 E2E: Non-owner redirected from dashboard [agent: test-automator] [deps: T020] [files: tests/e2e/dashboard/access-control.test.ts]

### Story Progress: 0/29

---

## User Story: US-021 Listing Management
> As a campsite owner, I want to manage my campsite listings including photos and amenities so that I can keep my information up to date.

### Acceptance Criteria
- [ ] Owner can view all their campsites
- [ ] Owner can create new campsite (pending approval)
- [ ] Owner can edit campsite details
- [ ] Owner can upload/reorder/delete photos
- [ ] Owner can manage amenities
- [ ] Photo upload limited to 20 images, 5MB each
- [ ] Drag-and-drop photo reordering works
- [ ] Primary photo can be set
- [ ] Form validation prevents invalid data
- [ ] Changes saved immediately with feedback

### Tasks

#### Phase 1: Backend API - Campsite Management
- [x] T030 P1 US-021 Create owner campsites endpoint [agent: backend-architect] [deps: T010] [files: apps/campsite-backend/src/routes/dashboard.ts]
- [x] T031 P1 US-021 Create create campsite endpoint [agent: backend-architect] [deps: T010] [files: apps/campsite-backend/src/routes/dashboard.ts]
- [x] T032 P1 US-021 Create update campsite endpoint [agent: backend-architect] [deps: T010] [files: apps/campsite-backend/src/routes/dashboard.ts]
- [x] T033 P1 US-021 Create photo upload endpoint [agent: backend-architect] [deps: T010] [files: apps/campsite-backend/src/routes/dashboard.ts]
- [x] T034 P1 US-021 Create photo reorder endpoint [agent: backend-architect] [deps: T010] [files: apps/campsite-backend/src/routes/dashboard.ts]
- [x] T035 P1 US-021 Create photo delete endpoint [agent: backend-architect] [deps: T010] [files: apps/campsite-backend/src/routes/dashboard.ts]
- [x] T036 P1 US-021 Create amenities update endpoint [agent: backend-architect] [deps: T010] [files: apps/campsite-backend/src/routes/dashboard.ts]
- [ ] T037 P2 US-021 Unit test: Only owner can update their campsites [agent: test-automator] [deps: T032] [files: apps/campsite-backend/__tests__/routes/campsite-ownership.test.ts]
- [ ] T038 P2 US-021 Unit test: Photo upload validates file size [agent: test-automator] [deps: T033] [files: apps/campsite-backend/__tests__/routes/photo-upload.test.ts]
- [ ] T039 P2 US-021 Integration test: Photo upload to Supabase Storage [agent: test-automator] [deps: T033] [files: tests/integration/photo-storage.test.ts]

#### Phase 2: Shared Types - Campsite
- [x] T040 P1 US-021 Create campsite form schemas [agent: backend-architect] [deps: none] [files: packages/shared/src/schemas/campsite.ts]
- [x] T041 P1 US-021 Create photo upload schema [agent: backend-architect] [deps: none] [files: packages/shared/src/schemas/photo.ts]
- [ ] T042 P2 US-021 Unit test: Campsite schema validation [agent: test-automator] [deps: T040] [files: packages/shared/__tests__/schemas/campsite.test.ts]

#### Phase 3: Frontend - Campsite List & Create
- [x] T043 P1 US-021 Create CampsiteTable component [agent: frontend-developer] [deps: none] [files: apps/campsite-frontend/src/components/dashboard/CampsiteTable.tsx]
- [x] T044 P1 US-021 Create campsites list page [agent: frontend-developer] [deps: T043] [files: apps/campsite-frontend/src/app/dashboard/campsites/page.tsx]
- [x] T045 P1 US-021 Create BasicInfoStep component [agent: frontend-developer] [deps: T040] [files: apps/campsite-frontend/src/components/dashboard/campsite-wizard/BasicInfoStep.tsx]
- [x] T046 P1 US-021 Create LocationStep component [agent: frontend-developer] [deps: T040] [files: apps/campsite-frontend/src/components/dashboard/campsite-wizard/LocationStep.tsx]
- [x] T047 P1 US-021 Create PhotosStep component [agent: frontend-developer] [deps: T041] [files: apps/campsite-frontend/src/components/dashboard/campsite-wizard/PhotosStep.tsx]
- [x] T048 P1 US-021 Create AmenitiesStep component [agent: frontend-developer] [deps: none] [files: apps/campsite-frontend/src/components/dashboard/campsite-wizard/AmenitiesStep.tsx]
- [x] T049 P1 US-021 Create new campsite wizard page [agent: frontend-developer] [deps: T045, T046, T047, T048] [files: apps/campsite-frontend/src/app/dashboard/campsites/new/page.tsx]
- [ ] T050 P2 US-021 Unit test: CampsiteTable displays data [agent: test-automator] [deps: T043] [files: apps/campsite-frontend/__tests__/components/CampsiteTable.test.tsx]
- [ ] T051 P2 US-021 Unit test: Wizard steps navigate correctly [agent: test-automator] [deps: T049] [files: apps/campsite-frontend/__tests__/app/campsite-wizard.test.tsx]

#### Phase 4: Frontend - Photo Management
- [x] T052 P1 US-021 Create PhotosManager component [agent: frontend-developer] [deps: T041] [files: apps/campsite-frontend/src/components/dashboard/PhotosManager.tsx]
- [x] T053 P1 US-021 Create DraggablePhotoGrid component [agent: frontend-developer] [deps: none] [files: apps/campsite-frontend/src/components/dashboard/DraggablePhotoGrid.tsx]
- [x] T054 P1 US-021 Create FileUploader component [agent: frontend-developer] [deps: none] [files: apps/campsite-frontend/src/components/ui/FileUploader.tsx]
- [x] T055 P1 US-021 Create edit campsite page [agent: frontend-developer] [deps: T052] [files: apps/campsite-frontend/src/app/dashboard/campsites/[id]/page.tsx]
- [ ] T056 P2 US-021 Unit test: FileUploader validates file types [agent: test-automator] [deps: T054] [files: apps/campsite-frontend/__tests__/components/FileUploader.test.tsx]
- [ ] T057 P2 US-021 Unit test: DraggablePhotoGrid reorders photos [agent: test-automator] [deps: T053] [files: apps/campsite-frontend/__tests__/components/DraggablePhotoGrid.test.tsx]

#### Phase 5: E2E Tests - Listing Management
- [ ] T058 P2 US-021 E2E: Owner can view campsite list [agent: test-automator] [deps: T044] [files: tests/e2e/dashboard/campsite-list.test.ts]
- [ ] T059 P2 US-021 E2E: Owner can create new campsite [agent: test-automator] [deps: T049] [files: tests/e2e/dashboard/create-campsite.test.ts]
- [ ] T060 P2 US-021 E2E: Owner can edit campsite details [agent: test-automator] [deps: T055] [files: tests/e2e/dashboard/edit-campsite.test.ts]
- [ ] T061 P2 US-021 E2E: Owner can upload photos [agent: test-automator] [deps: T052] [files: tests/e2e/dashboard/upload-photos.test.ts]
- [ ] T062 P2 US-021 E2E: Owner can reorder photos [agent: test-automator] [deps: T053] [files: tests/e2e/dashboard/reorder-photos.test.ts]
- [ ] T063 P2 US-021 E2E: Owner can set primary photo [agent: test-automator] [deps: T052] [files: tests/e2e/dashboard/set-primary-photo.test.ts]
- [ ] T064 P2 US-021 E2E: Owner can delete photo [agent: test-automator] [deps: T052] [files: tests/e2e/dashboard/delete-photo.test.ts]
- [ ] T065 P2 US-021 E2E: Owner can manage amenities [agent: test-automator] [deps: T048] [files: tests/e2e/dashboard/manage-amenities.test.ts]

#### Phase 6: Smoke Tests
- [ ] T066 P2 US-021 Smoke test: Dashboard loads for owner [agent: test-automator] [deps: T021] [files: tests/e2e/smoke/dashboard-load.test.ts]
- [ ] T067 P2 US-021 Smoke test: Campsite list accessible [agent: test-automator] [deps: T044] [files: tests/e2e/smoke/campsite-list-load.test.ts]
- [ ] T068 P2 US-021 Smoke test: New campsite form loads [agent: test-automator] [deps: T049] [files: tests/e2e/smoke/new-campsite-load.test.ts]

### Story Progress: 0/39

---

## User Story: US-022 Inquiry Management
> As a campsite owner, I want to view and respond to inquiries so that I can communicate with potential guests.

### Acceptance Criteria
- [ ] Owner can view all inquiries for their campsites
- [ ] Inquiries filtered by status (new, in_progress, resolved, closed)
- [ ] Unread inquiries highlighted
- [ ] Owner can reply to inquiries
- [ ] Reply sends email notification to guest
- [ ] Owner can update inquiry status
- [ ] Inquiry list paginated (20 per page)
- [ ] Real-time unread count badge

### Tasks

#### Phase 1: Backend API - Inquiry Management
- [x] T069 P1 US-022 Create owner inquiries list endpoint [agent: backend-architect] [deps: T010] [files: apps/campsite-backend/src/routes/dashboard.ts]
- [x] T070 P1 US-022 Create inquiry detail endpoint [agent: backend-architect] [deps: T010] [files: apps/campsite-backend/src/routes/dashboard.ts]
- [x] T071 P1 US-022 Create inquiry reply endpoint [agent: backend-architect] [deps: T010] [files: apps/campsite-backend/src/routes/dashboard.ts]
- [x] T072 P1 US-022 Create inquiry status update endpoint [agent: backend-architect] [deps: T010] [files: apps/campsite-backend/src/routes/dashboard.ts]
- [x] T073 P1 US-022 Create email notification service [agent: backend-architect] [deps: none] [files: apps/campsite-backend/src/services/email.service.ts]
- [ ] T074 P2 US-022 Unit test: Only owner can reply to their inquiries [agent: test-automator] [deps: T071] [files: apps/campsite-backend/__tests__/routes/inquiry-ownership.test.ts]
- [ ] T075 P2 US-022 Unit test: Reply sends email notification [agent: test-automator] [deps: T073] [files: apps/campsite-backend/__tests__/services/email.test.ts]
- [ ] T076 P2 US-022 Integration test: Email service sends successfully [agent: test-automator] [deps: T073] [files: tests/integration/email-delivery.test.ts]

#### Phase 2: Frontend - Inquiry Components
- [x] T077 P1 US-022 Create InquiryCard component [agent: frontend-developer] [deps: none] [files: apps/campsite-frontend/src/components/dashboard/InquiryCard.tsx]
- [x] T078 P1 US-022 Create InquiryReplyForm component [agent: frontend-developer] [deps: none] [files: apps/campsite-frontend/src/components/dashboard/InquiryReplyForm.tsx]
- [x] T079 P1 US-022 Create inquiries list page [agent: frontend-developer] [deps: T077] [files: apps/campsite-frontend/src/app/dashboard/inquiries/page.tsx]
- [x] T080 P1 US-022 Create inquiry detail page [agent: frontend-developer] [deps: T078] [files: apps/campsite-frontend/src/app/dashboard/inquiries/[id]/page.tsx]
- [ ] T081 P2 US-022 Unit test: InquiryCard displays correctly [agent: test-automator] [deps: T077] [files: apps/campsite-frontend/__tests__/components/InquiryCard.test.tsx]
- [ ] T082 P2 US-022 Unit test: InquiryReplyForm validates [agent: test-automator] [deps: T078] [files: apps/campsite-frontend/__tests__/components/InquiryReplyForm.test.tsx]

#### Phase 3: E2E Tests - Inquiry Management
- [ ] T083 P2 US-022 E2E: Owner can view inquiry list [agent: test-automator] [deps: T079] [files: tests/e2e/dashboard/inquiry-list.test.ts]
- [ ] T084 P2 US-022 E2E: Owner can filter inquiries by status [agent: test-automator] [deps: T079] [files: tests/e2e/dashboard/inquiry-filter.test.ts]
- [ ] T085 P2 US-022 E2E: Owner can view inquiry detail [agent: test-automator] [deps: T080] [files: tests/e2e/dashboard/inquiry-detail.test.ts]
- [ ] T086 P2 US-022 E2E: Owner can reply to inquiry [agent: test-automator] [deps: T080] [files: tests/e2e/dashboard/inquiry-reply.test.ts]
- [ ] T087 P2 US-022 E2E: Owner can update inquiry status [agent: test-automator] [deps: T080] [files: tests/e2e/dashboard/inquiry-status.test.ts]
- [ ] T088 P2 US-022 E2E: Guest receives email notification [agent: test-automator] [deps: T071] [files: tests/e2e/dashboard/inquiry-email.test.ts]

### Story Progress: 0/20

---

## Execution Batches

### Batch 0 - Database Foundation
| Task | Agent | Files |
|------|-------|-------|
| T001 | backend-architect | supabase/migrations/20260117200000_create_analytics_events.sql |
| T014 | backend-architect | packages/shared/src/types/analytics.ts |
| T040 | backend-architect | packages/shared/src/schemas/campsite.ts |
| T041 | backend-architect | packages/shared/src/schemas/photo.ts |

### Batch 1 - Database Configuration
| Task | Agent | Deps | Files |
|------|-------|------|-------|
| T002 | backend-architect | T001 | supabase/migrations/20260117200001_analytics_indexes.sql |
| T003 | backend-architect | T001 | supabase/migrations/20260117200002_analytics_rls.sql |
| T004 | backend-architect | T001 | supabase/migrations/20260117200003_analytics_views.sql |
| T005 | test-automator | T001 | apps/campsite-backend/__tests__/db/analytics-schema.test.ts |
| T006 | test-automator | T003 | apps/campsite-backend/__tests__/db/analytics-rls.test.ts |
| T015 | backend-architect | T014 | packages/shared/src/schemas/dashboard.ts |
| T016 | test-automator | T014 | packages/shared/__tests__/types/analytics.test.ts |
| T042 | test-automator | T040 | packages/shared/__tests__/schemas/campsite.test.ts |

### Batch 2 - Backend Services & Middleware
| Task | Agent | Deps | Files |
|------|-------|------|-------|
| T007 | backend-architect | T001 | apps/campsite-backend/src/services/analytics.service.ts |
| T010 | backend-architect | none | apps/campsite-backend/src/middleware/owner-guard.ts |
| T073 | backend-architect | none | apps/campsite-backend/src/services/email.service.ts |

### Batch 3 - Backend API Endpoints
| Task | Agent | Deps | Files |
|------|-------|------|-------|
| T008 | backend-architect | T007 | apps/campsite-backend/src/routes/dashboard.ts |
| T009 | backend-architect | T007 | apps/campsite-backend/src/routes/dashboard.ts |
| T011 | test-automator | T007 | apps/campsite-backend/__tests__/services/analytics.test.ts |
| T012 | test-automator | T008 | apps/campsite-backend/__tests__/routes/dashboard-stats.test.ts |
| T013 | test-automator | T002 | tests/integration/analytics-performance.test.ts |
| T030 | backend-architect | T010 | apps/campsite-backend/src/routes/dashboard.ts |
| T031 | backend-architect | T010 | apps/campsite-backend/src/routes/dashboard.ts |
| T032 | backend-architect | T010 | apps/campsite-backend/src/routes/dashboard.ts |
| T033 | backend-architect | T010 | apps/campsite-backend/src/routes/dashboard.ts |
| T034 | backend-architect | T010 | apps/campsite-backend/src/routes/dashboard.ts |
| T035 | backend-architect | T010 | apps/campsite-backend/src/routes/dashboard.ts |
| T036 | backend-architect | T010 | apps/campsite-backend/src/routes/dashboard.ts |
| T069 | backend-architect | T010 | apps/campsite-backend/src/routes/dashboard.ts |
| T070 | backend-architect | T010 | apps/campsite-backend/src/routes/dashboard.ts |
| T071 | backend-architect | T010 | apps/campsite-backend/src/routes/dashboard.ts |
| T072 | backend-architect | T010 | apps/campsite-backend/src/routes/dashboard.ts |

### Batch 4 - Backend Tests
| Task | Agent | Deps | Files |
|------|-------|------|-------|
| T037 | test-automator | T032 | apps/campsite-backend/__tests__/routes/campsite-ownership.test.ts |
| T038 | test-automator | T033 | apps/campsite-backend/__tests__/routes/photo-upload.test.ts |
| T039 | test-automator | T033 | tests/integration/photo-storage.test.ts |
| T074 | test-automator | T071 | apps/campsite-backend/__tests__/routes/inquiry-ownership.test.ts |
| T075 | test-automator | T073 | apps/campsite-backend/__tests__/services/email.test.ts |
| T076 | test-automator | T073 | tests/integration/email-delivery.test.ts |

### Batch 5 - Frontend Base Components
| Task | Agent | Deps | Files |
|------|-------|------|-------|
| T017 | frontend-developer | none | apps/campsite-frontend/src/components/dashboard/StatCard.tsx |
| T018 | frontend-developer | none | apps/campsite-frontend/src/components/dashboard/AnalyticsChart.tsx |
| T019 | frontend-developer | none | apps/campsite-frontend/src/components/dashboard/DashboardSkeleton.tsx |
| T020 | frontend-developer | none | apps/campsite-frontend/src/app/dashboard/layout.tsx |
| T043 | frontend-developer | none | apps/campsite-frontend/src/components/dashboard/CampsiteTable.tsx |
| T053 | frontend-developer | none | apps/campsite-frontend/src/components/dashboard/DraggablePhotoGrid.tsx |
| T054 | frontend-developer | none | apps/campsite-frontend/src/components/ui/FileUploader.tsx |
| T077 | frontend-developer | none | apps/campsite-frontend/src/components/dashboard/InquiryCard.tsx |
| T078 | frontend-developer | none | apps/campsite-frontend/src/components/dashboard/InquiryReplyForm.tsx |

### Batch 6 - Frontend Dashboard Pages
| Task | Agent | Deps | Files |
|------|-------|------|-------|
| T021 | frontend-developer | T017, T018, T020 | apps/campsite-frontend/src/app/dashboard/page.tsx |
| T022 | frontend-developer | T019 | apps/campsite-frontend/src/app/dashboard/loading.tsx |
| T023 | test-automator | T017 | apps/campsite-frontend/__tests__/components/StatCard.test.tsx |
| T024 | test-automator | T018 | apps/campsite-frontend/__tests__/components/AnalyticsChart.test.tsx |
| T025 | test-automator | T020 | apps/campsite-frontend/__tests__/app/dashboard-layout.test.tsx |
| T044 | frontend-developer | T043 | apps/campsite-frontend/src/app/dashboard/campsites/page.tsx |
| T050 | test-automator | T043 | apps/campsite-frontend/__tests__/components/CampsiteTable.test.tsx |
| T079 | frontend-developer | T077 | apps/campsite-frontend/src/app/dashboard/inquiries/page.tsx |
| T081 | test-automator | T077 | apps/campsite-frontend/__tests__/components/InquiryCard.test.tsx |
| T082 | test-automator | T078 | apps/campsite-frontend/__tests__/components/InquiryReplyForm.test.tsx |

### Batch 7 - Frontend Campsite Wizard
| Task | Agent | Deps | Files |
|------|-------|------|-------|
| T045 | frontend-developer | T040 | apps/campsite-frontend/src/components/dashboard/campsite-wizard/BasicInfoStep.tsx |
| T046 | frontend-developer | T040 | apps/campsite-frontend/src/components/dashboard/campsite-wizard/LocationStep.tsx |
| T047 | frontend-developer | T041 | apps/campsite-frontend/src/components/dashboard/campsite-wizard/PhotosStep.tsx |
| T048 | frontend-developer | none | apps/campsite-frontend/src/components/dashboard/campsite-wizard/AmenitiesStep.tsx |
| T049 | frontend-developer | T045, T046, T047, T048 | apps/campsite-frontend/src/app/dashboard/campsites/new/page.tsx |
| T051 | test-automator | T049 | apps/campsite-frontend/__tests__/app/campsite-wizard.test.tsx |

### Batch 8 - Frontend Photo Management
| Task | Agent | Deps | Files |
|------|-------|------|-------|
| T052 | frontend-developer | T041 | apps/campsite-frontend/src/components/dashboard/PhotosManager.tsx |
| T055 | frontend-developer | T052 | apps/campsite-frontend/src/app/dashboard/campsites/[id]/page.tsx |
| T056 | test-automator | T054 | apps/campsite-frontend/__tests__/components/FileUploader.test.tsx |
| T057 | test-automator | T053 | apps/campsite-frontend/__tests__/components/DraggablePhotoGrid.test.tsx |
| T080 | frontend-developer | T078 | apps/campsite-frontend/src/app/dashboard/inquiries/[id]/page.tsx |

### Batch 9 - E2E Tests Analytics
| Task | Agent | Deps | Files |
|------|-------|------|-------|
| T026 | test-automator | T021 | tests/e2e/dashboard/owner-dashboard.test.ts |
| T027 | test-automator | T021 | tests/e2e/dashboard/analytics-stats.test.ts |
| T028 | test-automator | T021 | tests/e2e/dashboard/analytics-charts.test.ts |
| T029 | test-automator | T020 | tests/e2e/dashboard/access-control.test.ts |

### Batch 10 - E2E Tests Campsite Management
| Task | Agent | Deps | Files |
|------|-------|------|-------|
| T058 | test-automator | T044 | tests/e2e/dashboard/campsite-list.test.ts |
| T059 | test-automator | T049 | tests/e2e/dashboard/create-campsite.test.ts |
| T060 | test-automator | T055 | tests/e2e/dashboard/edit-campsite.test.ts |
| T061 | test-automator | T052 | tests/e2e/dashboard/upload-photos.test.ts |
| T062 | test-automator | T053 | tests/e2e/dashboard/reorder-photos.test.ts |
| T063 | test-automator | T052 | tests/e2e/dashboard/set-primary-photo.test.ts |
| T064 | test-automator | T052 | tests/e2e/dashboard/delete-photo.test.ts |
| T065 | test-automator | T048 | tests/e2e/dashboard/manage-amenities.test.ts |

### Batch 11 - E2E Tests Inquiry Management
| Task | Agent | Deps | Files |
|------|-------|------|-------|
| T083 | test-automator | T079 | tests/e2e/dashboard/inquiry-list.test.ts |
| T084 | test-automator | T079 | tests/e2e/dashboard/inquiry-filter.test.ts |
| T085 | test-automator | T080 | tests/e2e/dashboard/inquiry-detail.test.ts |
| T086 | test-automator | T080 | tests/e2e/dashboard/inquiry-reply.test.ts |
| T087 | test-automator | T080 | tests/e2e/dashboard/inquiry-status.test.ts |
| T088 | test-automator | T071 | tests/e2e/dashboard/inquiry-email.test.ts |

### Batch 12 - Smoke Tests
| Task | Agent | Deps | Files |
|------|-------|------|-------|
| T066 | test-automator | T021 | tests/e2e/smoke/dashboard-load.test.ts |
| T067 | test-automator | T044 | tests/e2e/smoke/campsite-list-load.test.ts |
| T068 | test-automator | T049 | tests/e2e/smoke/new-campsite-load.test.ts |

---

## Test Strategy

### Unit Tests (25 tests)
Testing individual components and business logic:
- Database schema and RLS policies
- Analytics calculation logic
- API endpoint validation
- React components (StatCard, Charts, Forms)
- Photo upload validation
- Email service functionality

**Framework:** Jest + @testing-library/react + Supertest
**Coverage Target:** 80%+
**Mock Strategy:** Mock Supabase client, Resend email service

### Integration Tests (4 tests)
Testing component interactions:
- Analytics query performance
- Photo upload to Supabase Storage
- Email delivery via Resend
- Real-time analytics updates

**Framework:** Jest + Testcontainers
**Coverage Target:** Critical paths (analytics, photos, emails)

### E2E Tests (21 tests)
Testing complete user workflows:

**Analytics (4 tests):**
1. Owner views dashboard with stats
2. Stats cards display correctly
3. Charts load with 30-day data
4. Non-owner redirected

**Campsite Management (8 tests):**
5. View campsite list
6. Create new campsite
7. Edit campsite details
8. Upload photos
9. Reorder photos
10. Set primary photo
11. Delete photo
12. Manage amenities

**Inquiry Management (6 tests):**
13. View inquiry list
14. Filter inquiries by status
15. View inquiry detail
16. Reply to inquiry
17. Update inquiry status
18. Guest receives email notification

**Framework:** Playwright
**Run Frequency:** Every PR
**Test Data:** Seeded test database

### Smoke Tests (3 tests)
Quick validation after deployment:
1. Dashboard loads for owner
2. Campsite list accessible
3. New campsite form loads

**Run Frequency:** After every deployment
**Timeout:** 30 seconds max

---

## Definition of Done

### Code Complete
- [ ] All 88 tasks completed
- [ ] Database migrations applied
- [ ] All API endpoints functional
- [ ] All frontend pages responsive
- [ ] Photo upload working
- [ ] Email notifications sending

### Functionality
- [ ] Owner can view analytics dashboard
- [ ] Core metrics display correctly (impressions, views, clicks, inquiries)
- [ ] Charts show 30-day trends
- [ ] Owner can view all their campsites
- [ ] Owner can create new campsite (pending approval)
- [ ] Owner can edit campsite details
- [ ] Owner can upload photos (max 20, 5MB each)
- [ ] Owner can reorder photos with drag-and-drop
- [ ] Owner can set primary photo
- [ ] Owner can delete photos
- [ ] Owner can manage amenities
- [ ] Owner can view inquiries
- [ ] Owner can filter inquiries by status
- [ ] Owner can reply to inquiries
- [ ] Guest receives email when owner replies
- [ ] Owner can update inquiry status

### Security
- [ ] Only owners can access dashboard
- [ ] Owners can only view their own data
- [ ] Owners can only modify their own campsites
- [ ] Photo upload validates file size and type
- [ ] RLS policies enforce ownership
- [ ] SQL injection prevented
- [ ] XSS protection on user input

### Performance
- [ ] Dashboard loads in < 2 seconds
- [ ] Analytics queries use indexes
- [ ] Photo upload shows progress
- [ ] Lazy loading for campsite list
- [ ] Optimistic UI updates
- [ ] Image optimization (WebP, responsive)

### Testing
- [ ] 25 unit tests passing (80%+ coverage)
- [ ] 4 integration tests passing
- [ ] 21 E2E tests passing
- [ ] 3 smoke tests passing
- [ ] No flaky tests
- [ ] All tests documented

### UI/UX
- [ ] Mobile responsive (320px - 1920px)
- [ ] Skeleton screens during loading
- [ ] Empty states for new owners
- [ ] Success/error toast notifications
- [ ] Form validation with helpful errors
- [ ] Drag-and-drop photo reordering
- [ ] Image preview before upload
- [ ] Unread inquiry badge

### Documentation
- [ ] API endpoints documented
- [ ] Component props documented
- [ ] Analytics calculation explained
- [ ] Photo upload limits documented
- [ ] Email templates documented

---

## Progress Summary
- **Total:** 88
- **Completed:** 35 (all P1 implementation tasks)
- **Pending:** 53 (P2 tests and database migrations)
- **Percentage:** 40%

**Last Updated:** 2026-01-17

### P1 Implementation Complete
All 35 P1 implementation tasks completed:
- Backend: analytics service, dashboard routes, email service
- Shared: analytics types, dashboard schemas, photo schemas
- Frontend: StatCard, AnalyticsChart, DashboardSkeleton, CampsiteTable, InquiryCard, InquiryReplyForm, PhotosManager, DraggablePhotoGrid, FileUploader
- Wizard: BasicInfoStep, LocationStep, PhotosStep, AmenitiesStep
- Pages: dashboard layout, overview, campsites list, new campsite, edit campsite, inquiries list, inquiry detail
