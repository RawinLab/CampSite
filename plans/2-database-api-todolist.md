# TodoList: Database & API Foundation (Module 2)

## Overview
- **Source Plan:** `2-database-api-plan.md`
- **User Stories:** Database Migrations, API Foundation, Core Endpoints
- **Total Tasks:** 54
- **Priority:** CRITICAL
- **Dependencies:** Module 0 (Project Setup)
- **Generated:** 2026-01-17

---

## User Story: Database Schema Implementation
> As a developer, I need a complete database schema with all tables, relationships, indexes, RLS policies, and seed data so that the application can store and manage campsite data efficiently.

### Acceptance Criteria
- [ ] All 23 migrations executed successfully
- [ ] Seed data populated (77 provinces, campsite types, amenities)
- [ ] RLS policies enforced on all tables
- [ ] Indexes created for performance
- [ ] Database triggers functional
- [ ] Functions and procedures created
- [ ] Database connection verified

### Tasks

#### Phase 1: Core Schema Migrations
- [ ] T001 P1 DB Create enums migration [agent: backend-architect] [deps: none] [files: supabase/migrations/00001_create_enums.sql]
- [ ] T002 P1 DB Create provinces table migration [agent: backend-architect] [deps: T001] [files: supabase/migrations/00002_create_provinces.sql]
- [ ] T003 P1 DB Create campsite_types table migration [agent: backend-architect] [deps: T001] [files: supabase/migrations/00003_create_campsite_types.sql]
- [ ] T004 P1 DB Create amenities table migration [agent: backend-architect] [deps: T001] [files: supabase/migrations/00004_create_amenities.sql]
- [ ] T005 P1 DB Create profiles table migration [agent: backend-architect] [deps: T001] [files: supabase/migrations/00005_create_profiles.sql]
- [ ] T006 P1 DB Create campsites table migration [agent: backend-architect] [deps: T002, T003, T005] [files: supabase/migrations/00006_create_campsites.sql]
- [ ] T007 P2 DB Unit test: Verify enum types created [agent: test-automator] [deps: T001] [files: apps/campsite-backend/__tests__/db/enums.test.ts]
- [ ] T008 P2 DB Unit test: Verify provinces table structure [agent: test-automator] [deps: T002] [files: apps/campsite-backend/__tests__/db/provinces.test.ts]

#### Phase 2: Relationship Tables
- [ ] T009 P1 DB Create campsite_amenities junction table [agent: backend-architect] [deps: T004, T006] [files: supabase/migrations/00007_create_campsite_amenities.sql]
- [ ] T010 P1 DB Create accommodation_types table [agent: backend-architect] [deps: T006] [files: supabase/migrations/00008_create_accommodation_types.sql]
- [ ] T011 P1 DB Create campsite_photos table [agent: backend-architect] [deps: T006] [files: supabase/migrations/00009_create_campsite_photos.sql]
- [ ] T012 P1 DB Create reviews table [agent: backend-architect] [deps: T006, T005] [files: supabase/migrations/00010_create_reviews.sql]
- [ ] T013 P1 DB Create review_photos table [agent: backend-architect] [deps: T012] [files: supabase/migrations/00011_create_review_photos.sql]
- [ ] T014 P1 DB Create review_helpful table [agent: backend-architect] [deps: T012] [files: supabase/migrations/00012_create_review_helpful.sql]
- [ ] T015 P2 DB Unit test: Verify foreign key constraints [agent: test-automator] [deps: T009, T010] [files: apps/campsite-backend/__tests__/db/foreign-keys.test.ts]

#### Phase 3: Additional Tables
- [ ] T016 P1 DB Create wishlists table [agent: backend-architect] [deps: T005, T006] [files: supabase/migrations/00013_create_wishlists.sql]
- [ ] T017 P1 DB Create inquiries table [agent: backend-architect] [deps: T005, T006] [files: supabase/migrations/00014_create_inquiries.sql]
- [ ] T018 P1 DB Create nearby_attractions table [agent: backend-architect] [deps: T006] [files: supabase/migrations/00015_create_nearby_attractions.sql]
- [ ] T019 P1 DB Create analytics_events table [agent: backend-architect] [deps: T005, T006] [files: supabase/migrations/00016_create_analytics_events.sql]
- [ ] T020 P1 DB Create owner_requests table [agent: backend-architect] [deps: T005] [files: supabase/migrations/00017_create_owner_requests.sql]

#### Phase 4: Indexes & Performance
- [ ] T021 P1 DB Create all database indexes [agent: backend-architect] [deps: T006, T012] [files: supabase/migrations/00018_create_indexes.sql]
- [ ] T022 P1 DB Enable RLS on all tables [agent: backend-architect] [deps: T020] [files: supabase/migrations/00019_enable_rls.sql]
- [ ] T023 P1 DB Create RLS policies [agent: backend-architect] [deps: T022] [files: supabase/migrations/00020_create_policies.sql]
- [ ] T024 P2 DB Integration test: Verify index performance [agent: test-automator] [deps: T021] [files: tests/integration/db/indexes.test.ts]
- [ ] T025 P2 DB Integration test: Verify RLS policies enforce access [agent: test-automator] [deps: T023] [files: tests/integration/db/rls.test.ts]

#### Phase 5: Functions & Triggers
- [ ] T026 P1 DB Create database functions [agent: backend-architect] [deps: T023] [files: supabase/migrations/00021_create_functions.sql]
- [ ] T027 P1 DB Create database triggers [agent: backend-architect] [deps: T026] [files: supabase/migrations/00022_create_triggers.sql]
- [ ] T028 P1 DB Create seed data migration [agent: backend-architect] [deps: T027] [files: supabase/migrations/00023_seed_data.sql]
- [ ] T029 P2 DB Unit test: Verify rating calculation trigger [agent: test-automator] [deps: T027] [files: apps/campsite-backend/__tests__/db/triggers.test.ts]
- [ ] T030 P2 DB Integration test: Verify seed data loaded [agent: test-automator] [deps: T028] [files: tests/integration/db/seed-data.test.ts]

### Story Progress: 0/30

---

## User Story: Express API Foundation
> As a developer, I need a properly structured Express API with middleware, routing, error handling, and validation so that I can build secure and maintainable API endpoints.

### Acceptance Criteria
- [ ] Express app starts without errors on port 4000
- [ ] Middleware stack configured (CORS, Helmet, rate limiting)
- [ ] Error handling middleware catches all errors
- [ ] Request validation using Zod schemas
- [ ] Auth middleware validates JWT tokens
- [ ] Role-based access control implemented
- [ ] Response helpers provide consistent API responses
- [ ] Logging configured with Winston

### Tasks

#### Phase 1: Express App Structure
- [ ] T031 P1 API Create Express app setup [agent: backend-architect] [deps: none] [files: apps/campsite-backend/src/app.ts]
- [ ] T032 P1 API Create server entry point [agent: backend-architect] [deps: T031] [files: apps/campsite-backend/src/index.ts]
- [ ] T033 P1 API Configure middleware stack [agent: backend-architect] [deps: T031] [files: apps/campsite-backend/src/middleware/index.ts]
- [ ] T034 P1 API Create error handler middleware [agent: backend-architect] [deps: T031] [files: apps/campsite-backend/src/middleware/errorHandler.ts]
- [ ] T035 P2 API Unit test: Verify Express app initializes [agent: test-automator] [deps: T031] [files: apps/campsite-backend/__tests__/app.test.ts]
- [ ] T036 P2 API Unit test: Verify error handler catches errors [agent: test-automator] [deps: T034] [files: apps/campsite-backend/__tests__/middleware/errorHandler.test.ts]

#### Phase 2: Auth & Validation Middleware
- [ ] T037 P1 API Create auth middleware [agent: backend-architect] [deps: T033] [files: apps/campsite-backend/src/middleware/auth.ts]
- [ ] T038 P1 API Create role guard middleware [agent: backend-architect] [deps: T037] [files: apps/campsite-backend/src/middleware/roleGuard.ts]
- [ ] T039 P1 API Create validation middleware [agent: backend-architect] [deps: T033] [files: apps/campsite-backend/src/middleware/validate.ts]
- [ ] T040 P1 API Create rate limiting middleware [agent: backend-architect] [deps: T033] [files: apps/campsite-backend/src/middleware/rateLimit.ts]
- [ ] T041 P2 API Unit test: Auth middleware validates JWT [agent: test-automator] [deps: T037] [files: apps/campsite-backend/__tests__/middleware/auth.test.ts]
- [ ] T042 P2 API Unit test: Role guard enforces permissions [agent: test-automator] [deps: T038] [files: apps/campsite-backend/__tests__/middleware/roleGuard.test.ts]
- [ ] T043 P2 API Unit test: Validation middleware rejects invalid data [agent: test-automator] [deps: T039] [files: apps/campsite-backend/__tests__/middleware/validate.test.ts]
- [ ] T044 P2 API Unit test: Rate limiter blocks excess requests [agent: test-automator] [deps: T040] [files: apps/campsite-backend/__tests__/middleware/rateLimit.test.ts]

#### Phase 3: Utilities & Helpers
- [ ] T045 P1 API Create Supabase admin client [agent: backend-architect] [deps: none] [files: apps/campsite-backend/src/utils/supabase.ts]
- [ ] T046 P1 API Create Winston logger [agent: backend-architect] [deps: none] [files: apps/campsite-backend/src/utils/logger.ts]
- [ ] T047 P1 API Create response helpers [agent: backend-architect] [deps: none] [files: apps/campsite-backend/src/utils/response.ts]
- [ ] T048 P2 API Unit test: Verify Supabase client connects [agent: test-automator] [deps: T045] [files: apps/campsite-backend/__tests__/utils/supabase.test.ts]
- [ ] T049 P2 API Unit test: Verify logger formats correctly [agent: test-automator] [deps: T046] [files: apps/campsite-backend/__tests__/utils/logger.test.ts]

#### Phase 4: E2E Smoke Tests
- [ ] T050 P2 API E2E: Server starts on port 4000 [agent: test-automator] [deps: T032] [files: tests/e2e/api/server-start.test.ts]
- [ ] T051 P2 API E2E: Health endpoint returns 200 [agent: test-automator] [deps: T032] [files: tests/e2e/api/health.test.ts]
- [ ] T052 P2 API E2E: CORS headers present [agent: test-automator] [deps: T033] [files: tests/e2e/api/cors.test.ts]
- [ ] T053 P2 API E2E: Rate limiter blocks after threshold [agent: test-automator] [deps: T040] [files: tests/e2e/api/rate-limit.test.ts]
- [ ] T054 P2 API E2E: Auth middleware rejects invalid token [agent: test-automator] [deps: T037] [files: tests/e2e/api/auth.test.ts]

### Story Progress: 0/24

---

## Execution Batches

### Batch 0 - Database Enums & Core Tables
| Task | Agent | Files |
|------|-------|-------|
| T001 | backend-architect | supabase/migrations/00001_create_enums.sql |

### Batch 1 - Core Tables (Depends on Batch 0)
| Task | Agent | Deps | Files |
|------|-------|------|-------|
| T002 | backend-architect | T001 | supabase/migrations/00002_create_provinces.sql |
| T003 | backend-architect | T001 | supabase/migrations/00003_create_campsite_types.sql |
| T004 | backend-architect | T001 | supabase/migrations/00004_create_amenities.sql |
| T005 | backend-architect | T001 | supabase/migrations/00005_create_profiles.sql |
| T007 | test-automator | T001 | apps/campsite-backend/__tests__/db/enums.test.ts |

### Batch 2 - Main Tables & Express Foundation
| Task | Agent | Deps | Files |
|------|-------|------|-------|
| T006 | backend-architect | T002, T003, T005 | supabase/migrations/00006_create_campsites.sql |
| T008 | test-automator | T002 | apps/campsite-backend/__tests__/db/provinces.test.ts |
| T031 | backend-architect | none | apps/campsite-backend/src/app.ts |
| T045 | backend-architect | none | apps/campsite-backend/src/utils/supabase.ts |
| T046 | backend-architect | none | apps/campsite-backend/src/utils/logger.ts |
| T047 | backend-architect | none | apps/campsite-backend/src/utils/response.ts |

### Batch 3 - Relationship Tables & Middleware
| Task | Agent | Deps | Files |
|------|-------|------|-------|
| T009 | backend-architect | T004, T006 | supabase/migrations/00007_create_campsite_amenities.sql |
| T010 | backend-architect | T006 | supabase/migrations/00008_create_accommodation_types.sql |
| T011 | backend-architect | T006 | supabase/migrations/00009_create_campsite_photos.sql |
| T012 | backend-architect | T006, T005 | supabase/migrations/00010_create_reviews.sql |
| T013 | backend-architect | T012 | supabase/migrations/00011_create_review_photos.sql |
| T014 | backend-architect | T012 | supabase/migrations/00012_create_review_helpful.sql |
| T015 | test-automator | T009, T010 | apps/campsite-backend/__tests__/db/foreign-keys.test.ts |
| T032 | backend-architect | T031 | apps/campsite-backend/src/index.ts |
| T033 | backend-architect | T031 | apps/campsite-backend/src/middleware/index.ts |
| T034 | backend-architect | T031 | apps/campsite-backend/src/middleware/errorHandler.ts |
| T035 | test-automator | T031 | apps/campsite-backend/__tests__/app.test.ts |

### Batch 4 - Additional Tables & Auth Middleware
| Task | Agent | Deps | Files |
|------|-------|------|-------|
| T016 | backend-architect | T005, T006 | supabase/migrations/00013_create_wishlists.sql |
| T017 | backend-architect | T005, T006 | supabase/migrations/00014_create_inquiries.sql |
| T018 | backend-architect | T006 | supabase/migrations/00015_create_nearby_attractions.sql |
| T019 | backend-architect | T005, T006 | supabase/migrations/00016_create_analytics_events.sql |
| T020 | backend-architect | T005 | supabase/migrations/00017_create_owner_requests.sql |
| T036 | test-automator | T034 | apps/campsite-backend/__tests__/middleware/errorHandler.test.ts |
| T037 | backend-architect | T033 | apps/campsite-backend/src/middleware/auth.ts |
| T038 | backend-architect | T037 | apps/campsite-backend/src/middleware/roleGuard.ts |
| T039 | backend-architect | T033 | apps/campsite-backend/src/middleware/validate.ts |
| T040 | backend-architect | T033 | apps/campsite-backend/src/middleware/rateLimit.ts |

### Batch 5 - Indexes, RLS & Middleware Tests
| Task | Agent | Deps | Files |
|------|-------|------|-------|
| T021 | backend-architect | T006, T012 | supabase/migrations/00018_create_indexes.sql |
| T022 | backend-architect | T020 | supabase/migrations/00019_enable_rls.sql |
| T023 | backend-architect | T022 | supabase/migrations/00020_create_policies.sql |
| T024 | test-automator | T021 | tests/integration/db/indexes.test.ts |
| T025 | test-automator | T023 | tests/integration/db/rls.test.ts |
| T041 | test-automator | T037 | apps/campsite-backend/__tests__/middleware/auth.test.ts |
| T042 | test-automator | T038 | apps/campsite-backend/__tests__/middleware/roleGuard.test.ts |
| T043 | test-automator | T039 | apps/campsite-backend/__tests__/middleware/validate.test.ts |
| T044 | test-automator | T040 | apps/campsite-backend/__tests__/middleware/rateLimit.test.ts |
| T048 | test-automator | T045 | apps/campsite-backend/__tests__/utils/supabase.test.ts |
| T049 | test-automator | T046 | apps/campsite-backend/__tests__/utils/logger.test.ts |

### Batch 6 - Functions, Triggers & Seed Data
| Task | Agent | Deps | Files |
|------|-------|------|-------|
| T026 | backend-architect | T023 | supabase/migrations/00021_create_functions.sql |
| T027 | backend-architect | T026 | supabase/migrations/00022_create_triggers.sql |
| T028 | backend-architect | T027 | supabase/migrations/00023_seed_data.sql |
| T029 | test-automator | T027 | apps/campsite-backend/__tests__/db/triggers.test.ts |
| T030 | test-automator | T028 | tests/integration/db/seed-data.test.ts |

### Batch 7 - E2E Smoke Tests (Final Validation)
| Task | Agent | Deps | Files |
|------|-------|------|-------|
| T050 | test-automator | T032 | tests/e2e/api/server-start.test.ts |
| T051 | test-automator | T032 | tests/e2e/api/health.test.ts |
| T052 | test-automator | T033 | tests/e2e/api/cors.test.ts |
| T053 | test-automator | T040 | tests/e2e/api/rate-limit.test.ts |
| T054 | test-automator | T037 | tests/e2e/api/auth.test.ts |

---

## Test Strategy

### Unit Tests (17 tests)
Testing individual components and database structures:
- Database enum types creation
- Table structure and constraints
- Foreign key relationships
- Database trigger functionality
- Express app initialization
- Error handler middleware
- Auth middleware JWT validation
- Role guard permission enforcement
- Validation middleware
- Rate limiter functionality
- Supabase client connection
- Logger formatting
- Response helpers

**Framework:** Jest + Supertest
**Coverage Target:** 80%+
**Mock Strategy:** Mock Supabase client, use test database for migration tests

### Integration Tests (3 tests)
Testing database and service interactions:
- Database index performance
- RLS policy enforcement
- Seed data verification

**Framework:** Jest + pg
**Coverage Target:** Critical database operations
**Test Database:** Supabase local instance

### E2E Smoke Tests (5 tests)
Testing complete API workflows:
1. **Server Start**: Express server starts on port 4000
2. **Health Check**: Health endpoint returns 200
3. **CORS**: CORS headers present in responses
4. **Rate Limiting**: Rate limiter blocks requests after threshold
5. **Authentication**: Auth middleware rejects invalid tokens

**Framework:** Playwright + Supertest
**Run Frequency:** Every commit
**Environment:** Local Supabase + Express

---

## Definition of Done

### Code Complete
- [ ] All 54 tasks completed
- [ ] All 23 database migrations executed
- [ ] Express app structure complete
- [ ] All middleware implemented
- [ ] Utilities and helpers created
- [ ] TypeScript types properly defined

### Database
- [ ] All tables created with correct schema
- [ ] Foreign keys enforced
- [ ] Indexes created for performance
- [ ] RLS enabled on all tables
- [ ] RLS policies enforce access control
- [ ] Database functions created
- [ ] Triggers functional
- [ ] Seed data loaded (77 provinces, types, amenities)

### API
- [ ] Express app starts on port 4000
- [ ] Health check endpoint returns 200
- [ ] CORS configured for frontend
- [ ] Helmet security headers present
- [ ] Rate limiting active (100 req/15min general, 5 req/day inquiries)
- [ ] Auth middleware validates JWT tokens
- [ ] Role guard enforces permissions
- [ ] Validation middleware rejects invalid data
- [ ] Error handling consistent across endpoints
- [ ] Logging configured and working

### Testing
- [ ] 17 unit tests passing (80%+ coverage)
- [ ] 3 integration tests passing
- [ ] 5 E2E smoke tests passing
- [ ] No database migration errors
- [ ] No TypeScript errors
- [ ] No ESLint warnings

### Documentation
- [ ] Migration files well-commented
- [ ] API middleware documented
- [ ] Environment variables documented
- [ ] Database schema documented
- [ ] Inline code comments for complex logic

### Performance
- [ ] Database queries optimized with indexes
- [ ] Migration execution completes in <5 minutes
- [ ] Server startup time <3 seconds
- [ ] No N+1 query issues

---

## Progress Summary
- **Total:** 54
- **Completed:** 0
- **Pending:** 54
- **Percentage:** 0%

**Last Updated:** 2026-01-17
