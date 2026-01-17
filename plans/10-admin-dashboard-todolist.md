# TodoList: Admin Dashboard (Module 10)

## Overview
- **Source Plan:** `10-admin-dashboard-plan.md`
- **User Stories:** US-023 (Campsite Approval), US-024 (Owner Request Approval), US-025 (Review Moderation)
- **Total Tasks:** 58
- **Priority:** HIGH
- **Dependencies:** Module 1 (Auth), Module 9 (Owner Dashboard)
- **Generated:** 2026-01-17

---

## User Story: US-023 Campsite Approval Queue (Q8)
> As an admin, I want to review and approve pending campsites so that only quality listings appear on the platform.

### Acceptance Criteria
- [ ] Admin can view all pending campsites
- [ ] Campsite details displayed for review
- [ ] Admin can approve campsite
- [ ] Admin can reject campsite with reason
- [ ] Owner notified when campsite approved/rejected
- [ ] Approved campsites visible to public
- [ ] Rejected campsites return to owner with feedback
- [ ] Badge shows pending count in sidebar

### Tasks

#### Phase 1: Database & Backend Foundation
- [ ] T001 P1 US-023 Create admin role guard middleware [agent: backend-architect] [deps: none] [files: apps/campsite-backend/src/middleware/admin-guard.ts]
- [ ] T002 P1 US-023 Create pending campsites endpoint [agent: backend-architect] [deps: T001] [files: apps/campsite-backend/src/routes/admin.ts]
- [ ] T003 P1 US-023 Create approve campsite endpoint [agent: backend-architect] [deps: T001] [files: apps/campsite-backend/src/routes/admin.ts]
- [ ] T004 P1 US-023 Create reject campsite endpoint [agent: backend-architect] [deps: T001] [files: apps/campsite-backend/src/routes/admin.ts]
- [ ] T005 P1 US-023 Create notification service [agent: backend-architect] [deps: none] [files: apps/campsite-backend/src/services/notification.service.ts]
- [ ] T006 P2 US-023 Unit test: Admin guard blocks non-admin [agent: test-automator] [deps: T001] [files: apps/campsite-backend/__tests__/middleware/admin-guard.test.ts]
- [ ] T007 P2 US-023 Unit test: Approve updates status correctly [agent: test-automator] [deps: T003] [files: apps/campsite-backend/__tests__/routes/approve-campsite.test.ts]
- [ ] T008 P2 US-023 Unit test: Reject sends notification [agent: test-automator] [deps: T004, T005] [files: apps/campsite-backend/__tests__/routes/reject-campsite.test.ts]
- [ ] T009 P2 US-023 Integration test: Approval workflow end-to-end [agent: test-automator] [deps: T003] [files: tests/integration/campsite-approval.test.ts]

#### Phase 2: Shared Types & Schemas
- [ ] T010 P1 US-023 Create admin types [agent: backend-architect] [deps: none] [files: packages/shared/src/types/admin.ts]
- [ ] T011 P1 US-023 Create approval schemas [agent: backend-architect] [deps: none] [files: packages/shared/src/schemas/admin.ts]
- [ ] T012 P2 US-023 Unit test: Verify approval schemas [agent: test-automator] [deps: T011] [files: packages/shared/__tests__/schemas/admin.test.ts]

#### Phase 3: Frontend - Admin Layout
- [ ] T013 P1 US-023 Create admin layout [agent: frontend-developer] [deps: none] [files: apps/campsite-frontend/src/app/admin/layout.tsx]
- [ ] T014 P1 US-023 Create admin sidebar navigation [agent: frontend-developer] [deps: none] [files: apps/campsite-frontend/src/components/admin/AdminSidebar.tsx]
- [ ] T015 P1 US-023 Create admin overview page [agent: frontend-developer] [deps: T013] [files: apps/campsite-frontend/src/app/admin/page.tsx]
- [ ] T016 P2 US-023 Unit test: Admin layout restricts non-admins [agent: test-automator] [deps: T013] [files: apps/campsite-frontend/__tests__/app/admin-layout.test.tsx]

#### Phase 4: Frontend - Campsite Approval
- [ ] T017 P1 US-023 Create CampsiteApprovalCard component [agent: frontend-developer] [deps: T011] [files: apps/campsite-frontend/src/components/admin/CampsiteApprovalCard.tsx]
- [ ] T018 P1 US-023 Create RejectDialog component [agent: frontend-developer] [deps: none] [files: apps/campsite-frontend/src/components/admin/RejectDialog.tsx]
- [ ] T019 P1 US-023 Create pending campsites page [agent: frontend-developer] [deps: T017] [files: apps/campsite-frontend/src/app/admin/campsites/pending/page.tsx]
- [ ] T020 P2 US-023 Unit test: CampsiteApprovalCard renders data [agent: test-automator] [deps: T017] [files: apps/campsite-frontend/__tests__/components/CampsiteApprovalCard.test.tsx]
- [ ] T021 P2 US-023 Unit test: RejectDialog validates reason [agent: test-automator] [deps: T018] [files: apps/campsite-frontend/__tests__/components/RejectDialog.test.tsx]

#### Phase 5: E2E Tests - Campsite Approval
- [ ] T022 P2 US-023 E2E: Admin can view pending campsites [agent: test-automator] [deps: T019] [files: tests/e2e/admin/pending-campsites.test.ts]
- [ ] T023 P2 US-023 E2E: Admin can approve campsite [agent: test-automator] [deps: T019] [files: tests/e2e/admin/approve-campsite.test.ts]
- [ ] T024 P2 US-023 E2E: Admin can reject campsite with reason [agent: test-automator] [deps: T019] [files: tests/e2e/admin/reject-campsite.test.ts]
- [ ] T025 P2 US-023 E2E: Owner receives notification [agent: test-automator] [deps: T003] [files: tests/e2e/admin/approval-notification.test.ts]

### Story Progress: 0/25

---

## User Story: US-024 Owner Request Approval (Q9)
> As an admin, I want to review owner registration requests so that only legitimate business owners can list campsites.

### Acceptance Criteria
- [ ] Admin can view all pending owner requests
- [ ] Business details displayed for review
- [ ] Admin can approve request
- [ ] Admin can reject request with reason
- [ ] Approved users upgraded to 'owner' role
- [ ] User notified of approval/rejection
- [ ] Badge shows pending count in sidebar
- [ ] Request history tracked

### Tasks

#### Phase 1: Backend API - Owner Requests
- [ ] T026 P1 US-024 Create owner requests list endpoint [agent: backend-architect] [deps: T001] [files: apps/campsite-backend/src/routes/admin.ts]
- [ ] T027 P1 US-024 Create approve owner request endpoint [agent: backend-architect] [deps: T001] [files: apps/campsite-backend/src/routes/admin.ts]
- [ ] T028 P1 US-024 Create reject owner request endpoint [agent: backend-architect] [deps: T001] [files: apps/campsite-backend/src/routes/admin.ts]
- [ ] T029 P2 US-024 Unit test: Approval upgrades user role [agent: test-automator] [deps: T027] [files: apps/campsite-backend/__tests__/routes/approve-owner.test.ts]
- [ ] T030 P2 US-024 Unit test: Rejection preserves user role [agent: test-automator] [deps: T028] [files: apps/campsite-backend/__tests__/routes/reject-owner.test.ts]
- [ ] T031 P2 US-024 Integration test: Owner request workflow [agent: test-automator] [deps: T027] [files: tests/integration/owner-request-approval.test.ts]

#### Phase 2: Frontend - Owner Request Management
- [ ] T032 P1 US-024 Create OwnerRequestActions component [agent: frontend-developer] [deps: none] [files: apps/campsite-frontend/src/components/admin/OwnerRequestActions.tsx]
- [ ] T033 P1 US-024 Create owner requests page [agent: frontend-developer] [deps: T032] [files: apps/campsite-frontend/src/app/admin/owner-requests/page.tsx]
- [ ] T034 P2 US-024 Unit test: OwnerRequestActions handles approval [agent: test-automator] [deps: T032] [files: apps/campsite-frontend/__tests__/components/OwnerRequestActions.test.tsx]

#### Phase 3: E2E Tests - Owner Requests
- [ ] T035 P2 US-024 E2E: Admin can view owner requests [agent: test-automator] [deps: T033] [files: tests/e2e/admin/owner-requests-list.test.ts]
- [ ] T036 P2 US-024 E2E: Admin can approve owner request [agent: test-automator] [deps: T033] [files: tests/e2e/admin/approve-owner-request.test.ts]
- [ ] T037 P2 US-024 E2E: Admin can reject owner request [agent: test-automator] [deps: T033] [files: tests/e2e/admin/reject-owner-request.test.ts]
- [ ] T038 P2 US-024 E2E: User role updated after approval [agent: test-automator] [deps: T027] [files: tests/e2e/admin/owner-role-upgrade.test.ts]

### Story Progress: 0/13

---

## User Story: US-025 Review Moderation (Q11)
> As an admin, I want to moderate reported reviews so that inappropriate content can be hidden or removed.

### Acceptance Criteria
- [ ] Admin can view all reported reviews
- [ ] Review content and report count displayed
- [ ] Admin can hide review (is_hidden = true)
- [ ] Admin can keep review (clear reports)
- [ ] Admin can delete review permanently
- [ ] Hidden reviews excluded from public display
- [ ] Badge shows reported count in sidebar
- [ ] Moderation actions logged

### Tasks

#### Phase 1: Database - Review Moderation
- [ ] T039 P1 US-025 Create review_reports table migration [agent: backend-architect] [deps: none] [files: supabase/migrations/20260117300000_create_review_reports.sql]
- [ ] T040 P1 US-025 Add is_hidden column to reviews [agent: backend-architect] [deps: none] [files: supabase/migrations/20260117300001_add_is_hidden.sql]
- [ ] T041 P1 US-025 Create moderation_logs table [agent: backend-architect] [deps: none] [files: supabase/migrations/20260117300002_create_moderation_logs.sql]
- [ ] T042 P2 US-025 Unit test: Verify review_reports schema [agent: test-automator] [deps: T039] [files: apps/campsite-backend/__tests__/db/review-reports.test.ts]

#### Phase 2: Backend API - Review Moderation
- [ ] T043 P1 US-025 Create reported reviews endpoint [agent: backend-architect] [deps: T001, T039] [files: apps/campsite-backend/src/routes/admin.ts]
- [ ] T044 P1 US-025 Create hide review endpoint [agent: backend-architect] [deps: T001, T040] [files: apps/campsite-backend/src/routes/admin.ts]
- [ ] T045 P1 US-025 Create unhide review endpoint [agent: backend-architect] [deps: T001, T040] [files: apps/campsite-backend/src/routes/admin.ts]
- [ ] T046 P1 US-025 Create delete review endpoint [agent: backend-architect] [deps: T001] [files: apps/campsite-backend/src/routes/admin.ts]
- [ ] T047 P1 US-025 Update review queries to exclude hidden [agent: backend-architect] [deps: T040] [files: apps/campsite-backend/src/services/review.service.ts]
- [ ] T048 P2 US-025 Unit test: Hide review excludes from public [agent: test-automator] [deps: T044, T047] [files: apps/campsite-backend/__tests__/routes/hide-review.test.ts]
- [ ] T049 P2 US-025 Unit test: Moderation logged correctly [agent: test-automator] [deps: T044] [files: apps/campsite-backend/__tests__/services/moderation-log.test.ts]
- [ ] T050 P2 US-025 Integration test: Hidden reviews not in queries [agent: test-automator] [deps: T047] [files: tests/integration/hidden-reviews.test.ts]

#### Phase 3: Frontend - Review Moderation
- [ ] T051 P1 US-025 Create ReportedReviewCard component [agent: frontend-developer] [deps: none] [files: apps/campsite-frontend/src/components/admin/ReportedReviewCard.tsx]
- [ ] T052 P1 US-025 Create reported reviews page [agent: frontend-developer] [deps: T051] [files: apps/campsite-frontend/src/app/admin/reviews/reported/page.tsx]
- [ ] T053 P2 US-025 Unit test: ReportedReviewCard shows actions [agent: test-automator] [deps: T051] [files: apps/campsite-frontend/__tests__/components/ReportedReviewCard.test.tsx]

#### Phase 4: E2E Tests - Review Moderation
- [ ] T054 P2 US-025 E2E: Admin can view reported reviews [agent: test-automator] [deps: T052] [files: tests/e2e/admin/reported-reviews.test.ts]
- [ ] T055 P2 US-025 E2E: Admin can hide review [agent: test-automator] [deps: T052] [files: tests/e2e/admin/hide-review.test.ts]
- [ ] T056 P2 US-025 E2E: Admin can unhide review [agent: test-automator] [deps: T052] [files: tests/e2e/admin/unhide-review.test.ts]
- [ ] T057 P2 US-025 E2E: Admin can delete review [agent: test-automator] [deps: T052] [files: tests/e2e/admin/delete-review.test.ts]
- [ ] T058 P2 US-025 E2E: Hidden reviews not visible to users [agent: test-automator] [deps: T047] [files: tests/e2e/admin/hidden-review-public.test.ts]

### Story Progress: 0/20

---

## Execution Batches

### Batch 0 - Foundation
| Task | Agent | Files |
|------|-------|-------|
| T001 | backend-architect | apps/campsite-backend/src/middleware/admin-guard.ts |
| T005 | backend-architect | apps/campsite-backend/src/services/notification.service.ts |
| T010 | backend-architect | packages/shared/src/types/admin.ts |
| T011 | backend-architect | packages/shared/src/schemas/admin.ts |
| T039 | backend-architect | supabase/migrations/20260117300000_create_review_reports.sql |
| T040 | backend-architect | supabase/migrations/20260117300001_add_is_hidden.sql |
| T041 | backend-architect | supabase/migrations/20260117300002_create_moderation_logs.sql |

### Batch 1 - Backend API Development
| Task | Agent | Deps | Files |
|------|-------|------|-------|
| T002 | backend-architect | T001 | apps/campsite-backend/src/routes/admin.ts |
| T003 | backend-architect | T001 | apps/campsite-backend/src/routes/admin.ts |
| T004 | backend-architect | T001 | apps/campsite-backend/src/routes/admin.ts |
| T006 | test-automator | T001 | apps/campsite-backend/__tests__/middleware/admin-guard.test.ts |
| T012 | test-automator | T011 | packages/shared/__tests__/schemas/admin.test.ts |
| T026 | backend-architect | T001 | apps/campsite-backend/src/routes/admin.ts |
| T027 | backend-architect | T001 | apps/campsite-backend/src/routes/admin.ts |
| T028 | backend-architect | T001 | apps/campsite-backend/src/routes/admin.ts |
| T042 | test-automator | T039 | apps/campsite-backend/__tests__/db/review-reports.test.ts |
| T043 | backend-architect | T001, T039 | apps/campsite-backend/src/routes/admin.ts |
| T044 | backend-architect | T001, T040 | apps/campsite-backend/src/routes/admin.ts |
| T045 | backend-architect | T001, T040 | apps/campsite-backend/src/routes/admin.ts |
| T046 | backend-architect | T001 | apps/campsite-backend/src/routes/admin.ts |
| T047 | backend-architect | T040 | apps/campsite-backend/src/services/review.service.ts |

### Batch 2 - Backend Unit Tests
| Task | Agent | Deps | Files |
|------|-------|------|-------|
| T007 | test-automator | T003 | apps/campsite-backend/__tests__/routes/approve-campsite.test.ts |
| T008 | test-automator | T004, T005 | apps/campsite-backend/__tests__/routes/reject-campsite.test.ts |
| T009 | test-automator | T003 | tests/integration/campsite-approval.test.ts |
| T029 | test-automator | T027 | apps/campsite-backend/__tests__/routes/approve-owner.test.ts |
| T030 | test-automator | T028 | apps/campsite-backend/__tests__/routes/reject-owner.test.ts |
| T031 | test-automator | T027 | tests/integration/owner-request-approval.test.ts |
| T048 | test-automator | T044, T047 | apps/campsite-backend/__tests__/routes/hide-review.test.ts |
| T049 | test-automator | T044 | apps/campsite-backend/__tests__/services/moderation-log.test.ts |
| T050 | test-automator | T047 | tests/integration/hidden-reviews.test.ts |

### Batch 3 - Frontend Layout
| Task | Agent | Deps | Files |
|------|-------|------|-------|
| T013 | frontend-developer | none | apps/campsite-frontend/src/app/admin/layout.tsx |
| T014 | frontend-developer | none | apps/campsite-frontend/src/components/admin/AdminSidebar.tsx |
| T015 | frontend-developer | T013 | apps/campsite-frontend/src/app/admin/page.tsx |
| T016 | test-automator | T013 | apps/campsite-frontend/__tests__/app/admin-layout.test.tsx |

### Batch 4 - Frontend Components
| Task | Agent | Deps | Files |
|------|-------|------|-------|
| T017 | frontend-developer | T011 | apps/campsite-frontend/src/components/admin/CampsiteApprovalCard.tsx |
| T018 | frontend-developer | none | apps/campsite-frontend/src/components/admin/RejectDialog.tsx |
| T032 | frontend-developer | none | apps/campsite-frontend/src/components/admin/OwnerRequestActions.tsx |
| T051 | frontend-developer | none | apps/campsite-frontend/src/components/admin/ReportedReviewCard.tsx |

### Batch 5 - Frontend Pages
| Task | Agent | Deps | Files |
|------|-------|------|-------|
| T019 | frontend-developer | T017 | apps/campsite-frontend/src/app/admin/campsites/pending/page.tsx |
| T020 | test-automator | T017 | apps/campsite-frontend/__tests__/components/CampsiteApprovalCard.test.tsx |
| T021 | test-automator | T018 | apps/campsite-frontend/__tests__/components/RejectDialog.test.tsx |
| T033 | frontend-developer | T032 | apps/campsite-frontend/src/app/admin/owner-requests/page.tsx |
| T034 | test-automator | T032 | apps/campsite-frontend/__tests__/components/OwnerRequestActions.test.tsx |
| T052 | frontend-developer | T051 | apps/campsite-frontend/src/app/admin/reviews/reported/page.tsx |
| T053 | test-automator | T051 | apps/campsite-frontend/__tests__/components/ReportedReviewCard.test.tsx |

### Batch 6 - E2E Tests Campsite Approval
| Task | Agent | Deps | Files |
|------|-------|------|-------|
| T022 | test-automator | T019 | tests/e2e/admin/pending-campsites.test.ts |
| T023 | test-automator | T019 | tests/e2e/admin/approve-campsite.test.ts |
| T024 | test-automator | T019 | tests/e2e/admin/reject-campsite.test.ts |
| T025 | test-automator | T003 | tests/e2e/admin/approval-notification.test.ts |

### Batch 7 - E2E Tests Owner Requests
| Task | Agent | Deps | Files |
|------|-------|------|-------|
| T035 | test-automator | T033 | tests/e2e/admin/owner-requests-list.test.ts |
| T036 | test-automator | T033 | tests/e2e/admin/approve-owner-request.test.ts |
| T037 | test-automator | T033 | tests/e2e/admin/reject-owner-request.test.ts |
| T038 | test-automator | T027 | tests/e2e/admin/owner-role-upgrade.test.ts |

### Batch 8 - E2E Tests Review Moderation
| Task | Agent | Deps | Files |
|------|-------|------|-------|
| T054 | test-automator | T052 | tests/e2e/admin/reported-reviews.test.ts |
| T055 | test-automator | T052 | tests/e2e/admin/hide-review.test.ts |
| T056 | test-automator | T052 | tests/e2e/admin/unhide-review.test.ts |
| T057 | test-automator | T052 | tests/e2e/admin/delete-review.test.ts |
| T058 | test-automator | T047 | tests/e2e/admin/hidden-review-public.test.ts |

---

## Test Strategy

### Unit Tests (16 tests)
Testing individual components and logic:
- Admin guard middleware
- Approval/rejection logic
- Role upgrade on owner approval
- Review moderation actions
- Notification sending
- React components

**Framework:** Jest + @testing-library/react + Supertest
**Coverage Target:** 80%+
**Mock Strategy:** Mock Supabase client, notification service

### Integration Tests (4 tests)
Testing service interactions:
- Campsite approval workflow
- Owner request approval workflow
- Hidden reviews excluded from queries
- Notification delivery

**Framework:** Jest + Testcontainers
**Coverage Target:** Critical admin workflows

### E2E Tests (13 tests)
Testing complete admin workflows:

**Campsite Approval (4 tests):**
1. View pending campsites
2. Approve campsite
3. Reject campsite with reason
4. Owner receives notification

**Owner Requests (4 tests):**
5. View owner requests
6. Approve owner request
7. Reject owner request
8. User role upgraded after approval

**Review Moderation (5 tests):**
9. View reported reviews
10. Hide review
11. Unhide review
12. Delete review
13. Hidden reviews not visible to users

**Framework:** Playwright
**Run Frequency:** Every PR
**Test Data:** Seeded admin account, test campsites, test reviews

### Smoke Tests (3 tests)
Quick validation after deployment:
1. Admin dashboard loads
2. Pending campsites page accessible
3. Admin actions require admin role

**Run Frequency:** After every deployment
**Timeout:** 30 seconds max

---

## Definition of Done

### Code Complete
- [ ] All 58 tasks completed
- [ ] Database migrations applied
- [ ] All API endpoints functional
- [ ] All frontend pages responsive
- [ ] Admin guard middleware enforced

### Functionality
- [ ] Admin can view pending campsites
- [ ] Admin can approve campsites
- [ ] Admin can reject campsites with reason
- [ ] Owner notified on approval/rejection
- [ ] Approved campsites visible to public
- [ ] Admin can view owner requests
- [ ] Admin can approve owner requests
- [ ] User role upgraded to 'owner' on approval
- [ ] Admin can reject owner requests
- [ ] Admin can view reported reviews
- [ ] Admin can hide inappropriate reviews
- [ ] Admin can unhide reviews
- [ ] Admin can delete reviews permanently
- [ ] Hidden reviews excluded from public queries
- [ ] Sidebar badges show pending counts

### Security
- [ ] Only admins can access admin routes
- [ ] Admin guard middleware blocks non-admins
- [ ] RLS policies enforce admin restrictions
- [ ] Moderation actions logged
- [ ] SQL injection prevented
- [ ] XSS protection on admin inputs

### Performance
- [ ] Admin dashboard loads in < 2 seconds
- [ ] Pending lists paginated
- [ ] Badge counts cached
- [ ] Optimistic UI updates

### Testing
- [ ] 16 unit tests passing (80%+ coverage)
- [ ] 4 integration tests passing
- [ ] 13 E2E tests passing
- [ ] 3 smoke tests passing
- [ ] All tests documented

### UI/UX
- [ ] Admin sidebar navigation clear
- [ ] Approval/rejection confirmations
- [ ] Toast notifications for actions
- [ ] Empty states for no pending items
- [ ] Loading states during actions
- [ ] Mobile responsive (tablet minimum)

### Documentation
- [ ] Admin API endpoints documented
- [ ] Moderation workflow documented
- [ ] Approval criteria guidelines
- [ ] Badge count logic explained

---

## Progress Summary
- **Total:** 58
- **Completed:** 0
- **Pending:** 58
- **Percentage:** 0%

**Last Updated:** 2026-01-17
