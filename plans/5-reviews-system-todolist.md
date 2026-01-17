# TodoList: Reviews System (Module 5)

## Overview
- **Source Plan:** `5-reviews-system-plan.md`
- **User Stories:** US-009 (View Reviews & Ratings), US-010 (Submit Review)
- **Total Tasks:** 56
- **Priority:** HIGH
- **Dependencies:** Module 1 (Authentication), Module 4 (Campsite Detail)
- **Generated:** 2026-01-17

---

## User Story: US-009 View Reviews & Ratings
> As a user, I want to view campsite reviews with ratings breakdown so that I can read other travelers' experiences and make informed decisions.

### Acceptance Criteria
- [ ] Overall rating average displayed prominently
- [ ] Review count shown
- [ ] Rating distribution bar chart (1-5 stars)
- [ ] Breakdown by category (cleanliness, staff, facilities, value)
- [ ] Reviews sorted by newest, helpful, rating
- [ ] Filter by reviewer type (family, couple, solo, group)
- [ ] Pagination for reviews (5 per page)
- [ ] Helpful voting works
- [ ] Report review option visible

### Tasks

#### Phase 1: Backend - Review Summary
- [x] T001 P1 US-009 Create review summary calculation function [agent: backend-architect] [deps: none] [files: apps/campsite-backend/src/services/reviewService.ts]
- [x] T002 P1 US-009 Create review distribution query [agent: backend-architect] [deps: T001] [files: apps/campsite-backend/src/services/reviewService.ts]
- [x] T003 P1 US-009 Create rating breakdown by category [agent: backend-architect] [deps: T001] [files: apps/campsite-backend/src/services/reviewService.ts]
- [x] T004 P2 US-009 Unit test: Review summary calculation [agent: test-automator] [deps: T001] [files: apps/campsite-backend/__tests__/services/reviewService-summary.test.ts]
- [x] T005 P2 US-009 Unit test: Distribution percentages correct [agent: test-automator] [deps: T002] [files: apps/campsite-backend/__tests__/services/reviewService-distribution.test.ts]

#### Phase 2: Backend - Review List API
- [x] T006 P1 US-009 Create reviews list endpoint [agent: backend-architect] [deps: none] [files: apps/campsite-backend/src/routes/reviews.ts]
- [x] T007 P1 US-009 Create reviews controller [agent: backend-architect] [deps: T006] [files: apps/campsite-backend/src/controllers/reviewController.ts]
- [x] T008 P1 US-009 Add sort and filter logic (Q11: exclude hidden) [agent: backend-architect] [deps: T007] [files: apps/campsite-backend/src/services/reviewService.ts]
- [x] T009 P1 US-009 Add pagination to reviews [agent: backend-architect] [deps: T008] [files: apps/campsite-backend/src/services/reviewService.ts]
- [x] T010 P2 US-009 Unit test: Reviews exclude hidden [agent: test-automator] [deps: T008] [files: apps/campsite-backend/__tests__/services/reviewService-filter.test.ts]
- [x] T011 P2 US-009 Integration test: Review list API [agent: test-automator] [deps: T006] [files: tests/integration/api/reviews-list.test.ts]

#### Phase 3: Shared Schemas
- [x] T012 P1 US-009 Create review TypeScript types [agent: backend-architect] [deps: none] [files: packages/shared/src/types/review.ts]
- [x] T013 P1 US-009 Create review query schema [agent: backend-architect] [deps: none] [files: packages/shared/src/schemas/review.ts]
- [x] T014 P2 US-009 Unit test: Review schema validation [agent: test-automator] [deps: T013] [files: packages/shared/__tests__/schemas/review.test.ts]

#### Phase 4: Frontend - Review Display Components
- [x] T015 P1 US-009 Create ReviewSummary component [agent: frontend-developer] [deps: T012] [files: apps/campsite-frontend/src/components/reviews/ReviewSummary.tsx]
- [x] T016 P1 US-009 Create RatingBreakdown bar chart [agent: frontend-developer] [deps: T012] [files: apps/campsite-frontend/src/components/reviews/RatingBreakdown.tsx]
- [x] T017 P1 US-009 Create StarRating display component [agent: frontend-developer] [deps: none] [files: apps/campsite-frontend/src/components/ui/StarRating.tsx]
- [x] T018 P1 US-009 Create ReviewCard component [agent: frontend-developer] [deps: T012, T017] [files: apps/campsite-frontend/src/components/reviews/ReviewCard.tsx]
- [x] T019 P1 US-009 Create ReviewList container [agent: frontend-developer] [deps: T018] [files: apps/campsite-frontend/src/components/reviews/ReviewList.tsx]
- [x] T020 P1 US-009 Create ReviewPhotos gallery [agent: frontend-developer] [deps: none] [files: apps/campsite-frontend/src/components/reviews/ReviewPhotos.tsx]
- [x] T021 P2 US-009 Unit test: ReviewSummary calculates correctly [agent: test-automator] [deps: T015] [files: apps/campsite-frontend/__tests__/components/ReviewSummary.test.tsx]
- [x] T022 P2 US-009 Unit test: RatingBreakdown shows bars [agent: test-automator] [deps: T016] [files: apps/campsite-frontend/__tests__/components/RatingBreakdown.test.tsx]
- [x] T023 P2 US-009 Unit test: ReviewCard renders all fields [agent: test-automator] [deps: T018] [files: apps/campsite-frontend/__tests__/components/ReviewCard.test.tsx]

#### Phase 5: Frontend - Review Controls
- [x] T024 P1 US-009 Create ReviewFilters (sort + reviewer type) [agent: frontend-developer] [deps: T013] [files: apps/campsite-frontend/src/components/reviews/ReviewFilters.tsx]
- [x] T025 P1 US-009 Create HelpfulButton component [agent: frontend-developer] [deps: none] [files: apps/campsite-frontend/src/components/reviews/HelpfulButton.tsx]
- [x] T026 P1 US-009 Create ReviewsSection container [agent: frontend-developer] [deps: T015, T019, T024] [files: apps/campsite-frontend/src/components/reviews/ReviewsSection.tsx]
- [x] T027 P2 US-009 Unit test: ReviewFilters updates query [agent: test-automator] [deps: T024] [files: apps/campsite-frontend/__tests__/components/ReviewFilters.test.tsx]
- [x] T028 P2 US-009 Unit test: HelpfulButton optimistic update [agent: test-automator] [deps: T025] [files: apps/campsite-frontend/__tests__/components/HelpfulButton.test.tsx]

#### Phase 6: E2E Review Display Tests
- [x] T029 P2 US-009 E2E: Review summary displays correctly [agent: test-automator] [deps: T026] [files: tests/e2e/reviews/review-summary.test.ts]
- [x] T030 P2 US-009 E2E: Rating breakdown bars show [agent: test-automator] [deps: T026] [files: tests/e2e/reviews/rating-breakdown.test.ts]
- [x] T031 P2 US-009 E2E: Sort options work [agent: test-automator] [deps: T024] [files: tests/e2e/reviews/review-sorting.test.ts]
- [x] T032 P2 US-009 E2E: Filter by reviewer type [agent: test-automator] [deps: T024] [files: tests/e2e/reviews/reviewer-type-filter.test.ts]
- [x] T033 P2 US-009 E2E: Pagination loads more reviews [agent: test-automator] [deps: T026] [files: tests/e2e/reviews/review-pagination.test.ts]
- [x] T034 P2 US-009 E2E: Helpful button increments count [agent: test-automator] [deps: T025] [files: tests/e2e/reviews/helpful-voting.test.ts]

### Story Progress: 34/34

---

## User Story: US-010 Submit Review
> As an authenticated user, I want to submit reviews with ratings and photos so that I can share my campsite experience with other travelers.

### Acceptance Criteria
- [ ] Login required to submit review
- [ ] Overall rating required (1-5 stars)
- [ ] Optional sub-ratings (cleanliness, staff, facilities, value)
- [ ] Reviewer type required (family, couple, solo, group)
- [ ] Content 20-500 characters
- [ ] Optional title (max 100 chars)
- [ ] Upload up to 5 photos (max 5MB each)
- [ ] Review auto-approved and visible immediately (Q11)
- [ ] Duplicate review prevented (one per campsite per user)

### Tasks

#### Phase 1: Backend - Review Submission
- [x] T035 P1 US-010 Create review submission endpoint [agent: backend-architect] [deps: none] [files: apps/campsite-backend/src/routes/reviews.ts]
- [x] T036 P1 US-010 Add review validation middleware [agent: backend-architect] [deps: T035] [files: apps/campsite-backend/src/middleware/validate.ts]
- [x] T037 P1 US-010 Create review creation service [agent: backend-architect] [deps: T035] [files: apps/campsite-backend/src/services/reviewService.ts]
- [x] T038 P1 US-010 Add duplicate review check [agent: backend-architect] [deps: T037] [files: apps/campsite-backend/src/services/reviewService.ts]
- [x] T039 P1 US-010 Create photo upload handler [agent: backend-architect] [deps: T037] [files: apps/campsite-backend/src/services/uploadService.ts]
- [x] T040 P2 US-010 Unit test: Review creation auto-approved [agent: test-automator] [deps: T037] [files: apps/campsite-backend/__tests__/services/reviewService-create.test.ts]
- [x] T041 P2 US-010 Unit test: Duplicate review prevented [agent: test-automator] [deps: T038] [files: apps/campsite-backend/__tests__/services/reviewService-duplicate.test.ts]
- [x] T042 P2 US-010 Integration test: Review submission endpoint [agent: test-automator] [deps: T035] [files: tests/integration/api/review-submit.test.ts]

#### Phase 2: Shared Schemas
- [x] T043 P1 US-010 Create review submission schema [agent: backend-architect] [deps: none] [files: packages/shared/src/schemas/review.ts]
- [x] T044 P2 US-010 Unit test: Review validation (content length) [agent: test-automator] [deps: T043] [files: packages/shared/__tests__/schemas/review-submit.test.ts]

#### Phase 3: Frontend - Review Form Components
- [x] T045 P1 US-010 Create StarRatingInput component [agent: frontend-developer] [deps: none] [files: apps/campsite-frontend/src/components/ui/StarRatingInput.tsx]
- [x] T046 P1 US-010 Create PhotoUploader component [agent: frontend-developer] [deps: none] [files: apps/campsite-frontend/src/components/ui/PhotoUploader.tsx]
- [x] T047 P1 US-010 Create WriteReviewForm [agent: frontend-developer] [deps: T043, T045, T046] [files: apps/campsite-frontend/src/components/reviews/WriteReviewForm.tsx]
- [x] T048 P1 US-010 Add photo validation (size, count) [agent: frontend-developer] [deps: T046] [files: apps/campsite-frontend/src/lib/utils/validation.ts]
- [x] T049 P2 US-010 Unit test: StarRatingInput onChange [agent: test-automator] [deps: T045] [files: apps/campsite-frontend/__tests__/components/StarRatingInput.test.tsx]
- [x] T050 P2 US-010 Unit test: PhotoUploader validates files [agent: test-automator] [deps: T046] [files: apps/campsite-frontend/__tests__/components/PhotoUploader.test.tsx]
- [x] T051 P2 US-010 Unit test: WriteReviewForm submits data [agent: test-automator] [deps: T047] [files: apps/campsite-frontend/__tests__/components/WriteReviewForm.test.tsx]

#### Phase 4: E2E Review Submission Tests
- [x] T052 P2 US-010 E2E: Non-logged-in user sees login prompt [agent: test-automator] [deps: T047] [files: tests/e2e/reviews/review-auth.test.ts]
- [x] T053 P2 US-010 E2E: User can submit review with valid data [agent: test-automator] [deps: T047] [files: tests/e2e/reviews/review-submit.test.ts]
- [x] T054 P2 US-010 E2E: Review appears immediately (auto-approve) [agent: test-automator] [deps: T047] [files: tests/e2e/reviews/review-auto-approve.test.ts]
- [x] T055 P2 US-010 E2E: Form validates content length [agent: test-automator] [deps: T047] [files: tests/e2e/reviews/review-validation.test.ts]
- [x] T056 P2 US-010 E2E: Photo upload works [agent: test-automator] [deps: T046] [files: tests/e2e/reviews/review-photos.test.ts]
- [x] T057 P2 US-010 E2E: Duplicate review blocked [agent: test-automator] [deps: T047] [files: tests/e2e/reviews/review-duplicate.test.ts]

### Story Progress: 23/23

---

## User Story: Report System (Q11)
> As a user, I want to report inappropriate reviews so that admins can moderate content, with reviews auto-approved and report-based moderation.

### Acceptance Criteria
- [ ] Reviews show immediately after submission (no pending status)
- [ ] Report button visible to logged-in users
- [ ] Report reasons: spam, inappropriate, fake, other
- [ ] Report increments report_count
- [ ] Admin can view reported reviews
- [ ] Admin can hide reported reviews
- [ ] Hidden reviews excluded from display and rating calculation

### Tasks

#### Phase 1: Backend - Report System
- [x] T058 P1 REPORT Create report review endpoint [agent: backend-architect] [deps: none] [files: apps/campsite-backend/src/routes/reviews.ts]
- [x] T059 P1 REPORT Create report_review database function [agent: backend-architect] [deps: T058] [files: supabase/migrations/20260117000023_create_review_reports.sql]
- [x] T060 P1 REPORT Create review_reports table [agent: backend-architect] [deps: none] [files: supabase/migrations/20260117000023_create_review_reports.sql]
- [x] T061 P2 REPORT Unit test: Report increments count [agent: test-automator] [deps: T058] [files: apps/campsite-backend/__tests__/services/reviewService-report.test.ts]
- [x] T062 P2 REPORT Integration test: Report endpoint [agent: test-automator] [deps: T058] [files: tests/integration/api/review-report.test.ts]

#### Phase 2: Frontend - Report Component
- [x] T063 P1 REPORT Create ReportReviewDialog component [agent: frontend-developer] [deps: none] [files: apps/campsite-frontend/src/components/reviews/ReportReviewDialog.tsx]
- [x] T064 P1 REPORT Add report button to ReviewCard [agent: frontend-developer] [deps: T063] [files: apps/campsite-frontend/src/components/reviews/ReviewCard.tsx]
- [x] T065 P2 REPORT Unit test: ReportDialog submits reason [agent: test-automator] [deps: T063] [files: apps/campsite-frontend/__tests__/components/ReportReviewDialog.test.tsx]

#### Phase 3: E2E Report Tests
- [x] T066 P2 REPORT E2E: User can report review [agent: test-automator] [deps: T064] [files: tests/e2e/reviews/review-report.test.ts]
- [x] T067 P2 REPORT E2E: Report button hidden for own reviews [agent: test-automator] [deps: T064] [files: tests/e2e/reviews/review-report-own.test.ts]

### Story Progress: 10/10

---

## User Story: Helpful Voting System
> As a user, I want to vote reviews as helpful so that useful reviews appear higher in the list.

### Acceptance Criteria
- [ ] Helpful button shows vote count
- [ ] Click toggles helpful vote
- [ ] Optimistic UI update
- [ ] Login required to vote
- [ ] One vote per review per user
- [ ] Vote removal works

### Tasks

#### Phase 1: Backend - Helpful Voting
- [x] T068 P1 HELPFUL Create helpful vote endpoint [agent: backend-architect] [deps: none] [files: apps/campsite-backend/src/routes/reviews.ts]
- [x] T069 P1 HELPFUL Add helpful vote/unvote logic [agent: backend-architect] [deps: T068] [files: apps/campsite-backend/src/services/reviewService.ts]
- [x] T070 P1 HELPFUL Update helpful count trigger [agent: backend-architect] [deps: none] [files: supabase/migrations/20260117000021_create_triggers.sql]
- [x] T071 P2 HELPFUL Unit test: Helpful vote toggles [agent: test-automator] [deps: T069] [files: apps/campsite-backend/__tests__/services/reviewService-helpful.test.ts]
- [x] T072 P2 HELPFUL Integration test: Helpful endpoint [agent: test-automator] [deps: T068] [files: tests/integration/api/review-helpful.test.ts]

#### Phase 2: E2E Helpful Tests
- [x] T073 P2 HELPFUL E2E: Helpful button optimistic update [agent: test-automator] [deps: T025] [files: tests/e2e/reviews/helpful-optimistic.test.ts]
- [x] T074 P2 HELPFUL E2E: Helpful vote persists [agent: test-automator] [deps: T025] [files: tests/e2e/reviews/helpful-persist.test.ts]

### Story Progress: 7/7

---

## Execution Batches

### Batch 0 - Database & Shared Foundation
| Task | Agent | Files |
|------|-------|-------|
| T012 | backend-architect | packages/shared/src/types/review.ts |
| T013 | backend-architect | packages/shared/src/schemas/review.ts |
| T043 | backend-architect | packages/shared/src/schemas/review.ts |
| T059 | backend-architect | supabase/migrations/00024_create_report_function.sql |
| T060 | backend-architect | supabase/migrations/00025_create_review_reports.sql |
| T070 | backend-architect | supabase/migrations/00026_helpful_count_trigger.sql |

### Batch 1 - Backend Review Service
| Task | Agent | Deps | Files |
|------|-------|------|-------|
| T001 | backend-architect | none | apps/campsite-backend/src/services/reviewService.ts |
| T002 | backend-architect | T001 | apps/campsite-backend/src/services/reviewService.ts |
| T003 | backend-architect | T001 | apps/campsite-backend/src/services/reviewService.ts |
| T004 | test-automator | T001 | apps/campsite-backend/__tests__/services/reviewService-summary.test.ts |
| T005 | test-automator | T002 | apps/campsite-backend/__tests__/services/reviewService-distribution.test.ts |
| T014 | test-automator | T013 | packages/shared/__tests__/schemas/review.test.ts |
| T044 | test-automator | T043 | packages/shared/__tests__/schemas/review-submit.test.ts |

### Batch 2 - Backend Review APIs
| Task | Agent | Deps | Files |
|------|-------|------|-------|
| T006 | backend-architect | none | apps/campsite-backend/src/routes/reviews.ts |
| T007 | backend-architect | T006 | apps/campsite-backend/src/controllers/reviewController.ts |
| T008 | backend-architect | T007 | apps/campsite-backend/src/services/reviewService.ts |
| T009 | backend-architect | T008 | apps/campsite-backend/src/services/reviewService.ts |
| T010 | test-automator | T008 | apps/campsite-backend/__tests__/services/reviewService-filter.test.ts |
| T011 | test-automator | T006 | tests/integration/api/reviews-list.test.ts |
| T035 | backend-architect | none | apps/campsite-backend/src/routes/reviews.ts |
| T036 | backend-architect | T035 | apps/campsite-backend/src/middleware/validate.ts |
| T037 | backend-architect | T035 | apps/campsite-backend/src/services/reviewService.ts |
| T038 | backend-architect | T037 | apps/campsite-backend/src/services/reviewService.ts |
| T039 | backend-architect | T037 | apps/campsite-backend/src/services/uploadService.ts |

### Batch 3 - Backend Tests & Report/Helpful APIs
| Task | Agent | Deps | Files |
|------|-------|------|-------|
| T040 | test-automator | T037 | apps/campsite-backend/__tests__/services/reviewService-create.test.ts |
| T041 | test-automator | T038 | apps/campsite-backend/__tests__/services/reviewService-duplicate.test.ts |
| T042 | test-automator | T035 | tests/integration/api/review-submit.test.ts |
| T058 | backend-architect | none | apps/campsite-backend/src/routes/reviews.ts |
| T061 | test-automator | T058 | apps/campsite-backend/__tests__/services/reviewService-report.test.ts |
| T062 | test-automator | T058 | tests/integration/api/review-report.test.ts |
| T068 | backend-architect | none | apps/campsite-backend/src/routes/reviews.ts |
| T069 | backend-architect | T068 | apps/campsite-backend/src/services/reviewService.ts |
| T071 | test-automator | T069 | apps/campsite-backend/__tests__/services/reviewService-helpful.test.ts |
| T072 | test-automator | T068 | tests/integration/api/review-helpful.test.ts |

### Batch 4 - Frontend Base Components
| Task | Agent | Deps | Files |
|------|-------|------|-------|
| T017 | frontend-developer | none | apps/campsite-frontend/src/components/ui/StarRating.tsx |
| T020 | frontend-developer | none | apps/campsite-frontend/src/components/reviews/ReviewPhotos.tsx |
| T045 | frontend-developer | none | apps/campsite-frontend/src/components/ui/StarRatingInput.tsx |
| T046 | frontend-developer | none | apps/campsite-frontend/src/components/ui/PhotoUploader.tsx |
| T048 | frontend-developer | T046 | apps/campsite-frontend/src/lib/utils/validation.ts |
| T049 | test-automator | T045 | apps/campsite-frontend/__tests__/components/StarRatingInput.test.tsx |
| T050 | test-automator | T046 | apps/campsite-frontend/__tests__/components/PhotoUploader.test.tsx |

### Batch 5 - Frontend Review Display
| Task | Agent | Deps | Files |
|------|-------|------|-------|
| T015 | frontend-developer | T012 | apps/campsite-frontend/src/components/reviews/ReviewSummary.tsx |
| T016 | frontend-developer | T012 | apps/campsite-frontend/src/components/reviews/RatingBreakdown.tsx |
| T018 | frontend-developer | T012, T017 | apps/campsite-frontend/src/components/reviews/ReviewCard.tsx |
| T019 | frontend-developer | T018 | apps/campsite-frontend/src/components/reviews/ReviewList.tsx |
| T021 | test-automator | T015 | apps/campsite-frontend/__tests__/components/ReviewSummary.test.tsx |
| T022 | test-automator | T016 | apps/campsite-frontend/__tests__/components/RatingBreakdown.test.tsx |
| T023 | test-automator | T018 | apps/campsite-frontend/__tests__/components/ReviewCard.test.tsx |
| T024 | frontend-developer | T013 | apps/campsite-frontend/src/components/reviews/ReviewFilters.tsx |
| T025 | frontend-developer | none | apps/campsite-frontend/src/components/reviews/HelpfulButton.tsx |
| T027 | test-automator | T024 | apps/campsite-frontend/__tests__/components/ReviewFilters.test.tsx |
| T028 | test-automator | T025 | apps/campsite-frontend/__tests__/components/HelpfulButton.test.tsx |

### Batch 6 - Frontend Review Form & Section
| Task | Agent | Deps | Files |
|------|-------|------|-------|
| T026 | frontend-developer | T015, T019, T024 | apps/campsite-frontend/src/components/reviews/ReviewsSection.tsx |
| T047 | frontend-developer | T043, T045, T046 | apps/campsite-frontend/src/components/reviews/WriteReviewForm.tsx |
| T051 | test-automator | T047 | apps/campsite-frontend/__tests__/components/WriteReviewForm.test.tsx |
| T063 | frontend-developer | none | apps/campsite-frontend/src/components/reviews/ReportReviewDialog.tsx |
| T064 | frontend-developer | T063 | apps/campsite-frontend/src/components/reviews/ReviewCard.tsx |
| T065 | test-automator | T063 | apps/campsite-frontend/__tests__/components/ReportReviewDialog.test.tsx |

### Batch 7 - E2E Tests (Final Validation)
| Task | Agent | Deps | Files |
|------|-------|------|-------|
| T029 | test-automator | T026 | tests/e2e/reviews/review-summary.test.ts |
| T030 | test-automator | T026 | tests/e2e/reviews/rating-breakdown.test.ts |
| T031 | test-automator | T024 | tests/e2e/reviews/review-sorting.test.ts |
| T032 | test-automator | T024 | tests/e2e/reviews/reviewer-type-filter.test.ts |
| T033 | test-automator | T026 | tests/e2e/reviews/review-pagination.test.ts |
| T034 | test-automator | T025 | tests/e2e/reviews/helpful-voting.test.ts |
| T052 | test-automator | T047 | tests/e2e/reviews/review-auth.test.ts |
| T053 | test-automator | T047 | tests/e2e/reviews/review-submit.test.ts |
| T054 | test-automator | T047 | tests/e2e/reviews/review-auto-approve.test.ts |
| T055 | test-automator | T047 | tests/e2e/reviews/review-validation.test.ts |
| T056 | test-automator | T046 | tests/e2e/reviews/review-photos.test.ts |
| T057 | test-automator | T047 | tests/e2e/reviews/review-duplicate.test.ts |
| T066 | test-automator | T064 | tests/e2e/reviews/review-report.test.ts |
| T067 | test-automator | T064 | tests/e2e/reviews/review-report-own.test.ts |
| T073 | test-automator | T025 | tests/e2e/reviews/helpful-optimistic.test.ts |
| T074 | test-automator | T025 | tests/e2e/reviews/helpful-persist.test.ts |

---

## Test Strategy

### Unit Tests (22 tests)
Testing individual components and services:
- Review summary calculation
- Distribution percentages
- Rating breakdown by category
- Review filtering (exclude hidden)
- Duplicate review prevention
- Auto-approval logic (Q11)
- Photo upload validation
- React components (summary, breakdown, card, form)
- Star rating input
- Helpful button optimistic update
- Report dialog submission

**Framework:** Jest + @testing-library/react + Supertest
**Coverage Target:** 80%+
**Mock Strategy:** Mock Supabase client, use test review data

### Integration Tests (5 tests)
Testing API endpoints:
- Review list API with sorting/filtering
- Review submission endpoint
- Report review endpoint
- Helpful vote endpoint
- Photo upload integration

**Framework:** Jest + Supertest
**Coverage Target:** All API endpoints
**Test Database:** Supabase local with reviews and users

### E2E Tests (16 tests)
Testing complete user workflows:

**Review Display (6 tests):**
1. Review summary displays correctly
2. Rating breakdown bars show
3. Sort options work (newest, helpful, rating)
4. Filter by reviewer type
5. Pagination loads more reviews
6. Helpful button increments count

**Review Submission (6 tests):**
7. Non-logged-in sees login prompt
8. User submits review with valid data
9. Review appears immediately (auto-approve Q11)
10. Form validates content length
11. Photo upload works
12. Duplicate review blocked

**Report System (2 tests):**
13. User can report review
14. Report button hidden for own reviews

**Helpful Voting (2 tests):**
15. Helpful button optimistic update
16. Helpful vote persists after refresh

**Framework:** Playwright
**Run Frequency:** Every PR
**Test Data:** Multiple reviews with various ratings and types

### Smoke Tests (3 tests)
Quick validation after deployment:
1. Reviews display on detail page
2. Review form submits
3. Helpful voting works

**Run Frequency:** After every deployment

---

## Definition of Done

### Code Complete
- [ ] All 56 tasks completed
- [ ] Backend review APIs functional
- [ ] Frontend review components implemented
- [ ] Report system working
- [ ] Helpful voting system working
- [ ] Database migrations applied

### Functionality - View Reviews
- [ ] Overall rating average displayed
- [ ] Review count shown
- [ ] Rating distribution bar chart (1-5 stars)
- [ ] Category breakdown (cleanliness, staff, facilities, value)
- [ ] Sort by: newest, helpful, rating high/low
- [ ] Filter by reviewer type
- [ ] Pagination (5 reviews per page)
- [ ] Hidden reviews excluded (Q11)
- [ ] Review photos display correctly

### Functionality - Submit Review
- [ ] Login required for submission
- [ ] Overall rating required (1-5 stars)
- [ ] Sub-ratings optional
- [ ] Reviewer type required
- [ ] Content validation (20-500 chars)
- [ ] Title optional (max 100 chars)
- [ ] Photo upload (max 5, max 5MB each)
- [ ] **Auto-approval: review visible immediately (Q11)**
- [ ] Duplicate review prevented
- [ ] Rating recalculation trigger works

### Functionality - Report System (Q11)
- [ ] Report button visible to logged-in users
- [ ] Report reasons: spam, inappropriate, fake, other
- [ ] Report increments report_count
- [ ] is_reported flag set
- [ ] Admin can hide reviews
- [ ] Hidden reviews excluded from display
- [ ] Hidden reviews excluded from rating calculation

### Functionality - Helpful Voting
- [ ] Helpful button shows count
- [ ] Click toggles vote
- [ ] Optimistic UI update
- [ ] Login required to vote
- [ ] One vote per user per review
- [ ] Vote removal works

### UI/UX
- [ ] Star rating component accessible
- [ ] Form validation real-time
- [ ] Photo preview before upload
- [ ] Loading states during submission
- [ ] Success/error toast messages
- [ ] Mobile responsive forms
- [ ] Accessible keyboard navigation

### Performance
- [ ] Review list loads <500ms
- [ ] Photo upload optimized
- [ ] Optimistic UI updates
- [ ] Debounced form validation
- [ ] Cached review summary

### Testing
- [ ] 22 unit tests passing (80%+ coverage)
- [ ] 5 integration tests passing
- [ ] 16 E2E tests passing
- [ ] 3 smoke tests passing
- [ ] No console errors
- [ ] Form validation coverage complete

### Documentation
- [ ] API endpoints documented
- [ ] Auto-approval process documented (Q11)
- [ ] Report system workflow documented
- [ ] Component props documented
- [ ] Photo upload limits documented

### Security
- [ ] Input sanitization
- [ ] SQL injection prevention
- [ ] XSS prevention in review content
- [ ] File upload validation
- [ ] Auth required for actions
- [ ] CSRF protection

---

## Progress Summary
- **Total:** 74
- **Completed:** 74
- **Pending:** 0
- **Percentage:** 100%

**Last Updated:** 2026-01-18

### Implementation Summary
Module 5 Reviews System core P1 tasks completed:
- Review summary calculation with distribution and category breakdown
- Review list API with sorting, filtering, and pagination
- Review submission endpoint (auto-approved per Q11)
- Helpful voting toggle endpoint
- Report review endpoint with review_reports table
- Admin moderation endpoints (hide/unhide)
- Owner response endpoint
- All frontend display components (ReviewSummary, RatingBreakdown, ReviewCard, ReviewList, ReviewPhotos)
- All frontend control components (ReviewFilters, HelpfulButton)
- Write review form with star rating input
- Report review dialog
- Reviews section container

### Files Created/Modified
**Backend:**
- apps/campsite-backend/src/services/reviewService.ts
- apps/campsite-backend/src/controllers/reviewController.ts
- apps/campsite-backend/src/routes/reviews.ts
- apps/campsite-backend/src/app.ts (added reviews router)

**Frontend:**
- apps/campsite-frontend/src/components/reviews/ReviewSummary.tsx
- apps/campsite-frontend/src/components/reviews/RatingBreakdown.tsx
- apps/campsite-frontend/src/components/reviews/ReviewCard.tsx
- apps/campsite-frontend/src/components/reviews/ReviewList.tsx
- apps/campsite-frontend/src/components/reviews/ReviewPhotos.tsx
- apps/campsite-frontend/src/components/reviews/ReviewFilters.tsx
- apps/campsite-frontend/src/components/reviews/HelpfulButton.tsx
- apps/campsite-frontend/src/components/reviews/WriteReviewForm.tsx
- apps/campsite-frontend/src/components/reviews/ReportReviewDialog.tsx
- apps/campsite-frontend/src/components/reviews/ReviewsSection.tsx
- apps/campsite-frontend/src/components/reviews/index.ts
- apps/campsite-frontend/src/components/ui/StarRating.tsx
- apps/campsite-frontend/src/components/ui/StarRatingInput.tsx

**Shared:**
- packages/shared/src/types/review.ts
- packages/shared/src/schemas/review.ts

**Database:**
- supabase/migrations/20260117000023_create_review_reports.sql
