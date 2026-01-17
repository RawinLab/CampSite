# TodoList: Authentication & Authorization (Module 1)

## Overview
- **Source Plan:** `1-authentication-plan.md`
- **User Stories:** US-013 (User Registration), US-014 (User Login)
- **Total Tasks:** 58
- **Priority:** CRITICAL
- **Dependencies:** Module 0 (Project Setup)
- **Generated:** 2026-01-17

---

## User Story: US-013 User Registration
> As a visitor, I want to register an account with email/password or Google OAuth so that I can access the platform features.

### Acceptance Criteria
- [ ] User can sign up with email, password, full name
- [ ] Email verification sent automatically
- [ ] Profile created with 'user' role by default
- [ ] Password meets strength requirements (8+ chars, uppercase, number)
- [ ] Thai phone number validation (optional field)
- [ ] Google OAuth signup works
- [ ] Account creation prevented with duplicate email
- [ ] Verification email received within 1 minute

### Tasks

#### Phase 1: Database Schema
- [ ] T001 P1 US-013 Create owner_requests table migration [agent: backend-architect] [deps: none] [files: supabase/migrations/20260117100000_create_owner_requests.sql]
- [ ] T002 P1 US-013 Create profile auto-creation trigger [agent: backend-architect] [deps: none] [files: supabase/migrations/20260117100001_create_profile_trigger.sql]
- [ ] T003 P1 US-013 Create RLS policies for profiles table [agent: backend-architect] [deps: T002] [files: supabase/migrations/20260117100002_profile_rls_policies.sql]
- [ ] T004 P2 US-013 Unit test: Verify trigger creates profile on signup [agent: test-automator] [deps: T002] [files: apps/campsite-backend/__tests__/db/profile-trigger.test.ts]

#### Phase 2: Shared Schemas
- [ ] T005 P1 US-013 Create signup Zod schema [agent: backend-architect] [deps: none] [files: packages/shared/src/schemas/auth.ts]
- [ ] T006 P1 US-013 Create owner request Zod schema [agent: backend-architect] [deps: none] [files: packages/shared/src/schemas/owner-request.ts]
- [ ] T007 P1 US-013 Create Profile TypeScript interface [agent: backend-architect] [deps: none] [files: packages/shared/src/types/user.ts]
- [ ] T008 P2 US-013 Unit test: Verify signup schema validation [agent: test-automator] [deps: T005] [files: packages/shared/__tests__/schemas/auth.test.ts]
- [ ] T009 P2 US-013 Unit test: Verify password strength regex [agent: test-automator] [deps: T005] [files: packages/shared/__tests__/schemas/password.test.ts]
- [ ] T010 P2 US-013 Unit test: Verify Thai phone validation [agent: test-automator] [deps: T005] [files: packages/shared/__tests__/schemas/phone.test.ts]

#### Phase 3: Supabase Configuration
- [ ] T011 P1 US-013 Configure Supabase Auth in config.toml [agent: backend-architect] [deps: none] [files: supabase/config.toml]
- [ ] T012 P1 US-013 Enable Google OAuth provider in Supabase [agent: backend-architect] [deps: T011] [files: supabase/config.toml]
- [ ] T013 P1 US-013 Configure email templates [agent: backend-architect] [deps: T011] [files: supabase/templates/]
- [ ] T014 P2 US-013 Integration test: Verify Supabase Auth service running [agent: test-automator] [deps: T011] [files: tests/integration/supabase-auth.test.ts]

#### Phase 4: Frontend - Signup Components
- [ ] T015 P1 US-013 Create PasswordStrength component [agent: frontend-developer] [deps: none] [files: apps/campsite-frontend/src/components/auth/PasswordStrength.tsx]
- [ ] T016 P1 US-013 Create SignupForm component [agent: frontend-developer] [deps: T005, T015] [files: apps/campsite-frontend/src/components/auth/SignupForm.tsx]
- [ ] T017 P1 US-013 Create signup page [agent: frontend-developer] [deps: T016] [files: apps/campsite-frontend/src/app/auth/signup/page.tsx]
- [ ] T018 P1 US-013 Create OAuth callback route [agent: frontend-developer] [deps: none] [files: apps/campsite-frontend/src/app/auth/callback/route.ts]
- [ ] T019 P2 US-013 Unit test: PasswordStrength shows correct indicators [agent: test-automator] [deps: T015] [files: apps/campsite-frontend/__tests__/components/PasswordStrength.test.tsx]
- [ ] T020 P2 US-013 Unit test: SignupForm validation works [agent: test-automator] [deps: T016] [files: apps/campsite-frontend/__tests__/components/SignupForm.test.tsx]

#### Phase 5: E2E Signup Tests
- [ ] T021 P2 US-013 E2E: User can sign up with valid data [agent: test-automator] [deps: T017] [files: tests/e2e/auth/signup.test.ts]
- [ ] T022 P2 US-013 E2E: Signup fails with invalid email [agent: test-automator] [deps: T017] [files: tests/e2e/auth/signup-validation.test.ts]
- [ ] T023 P2 US-013 E2E: Signup fails with weak password [agent: test-automator] [deps: T017] [files: tests/e2e/auth/password-strength.test.ts]
- [ ] T024 P2 US-013 E2E: Duplicate email shows error [agent: test-automator] [deps: T017] [files: tests/e2e/auth/duplicate-email.test.ts]
- [ ] T025 P2 US-013 E2E: Verification email received [agent: test-automator] [deps: T017] [files: tests/e2e/auth/email-verification.test.ts]
- [ ] T026 P2 US-013 E2E: Google OAuth flow completes [agent: test-automator] [deps: T018] [files: tests/e2e/auth/oauth-google.test.ts]

### Story Progress: 0/26

---

## User Story: US-014 User Login & Session Management
> As a registered user, I want to log in securely so that I can access my account and protected features.

### Acceptance Criteria
- [ ] User can log in with email/password
- [ ] Invalid credentials show appropriate error
- [ ] Session tokens stored in HTTP-only cookies
- [ ] Token refresh works automatically
- [ ] Protected routes redirect to login
- [ ] Password reset flow functional
- [ ] Rate limiting prevents brute force (5 attempts/15min)
- [ ] Session expires after 1 hour inactivity

### Tasks

#### Phase 1: Frontend - Login Components
- [ ] T027 P1 US-014 Create LoginForm component [agent: frontend-developer] [deps: none] [files: apps/campsite-frontend/src/components/auth/LoginForm.tsx]
- [ ] T028 P1 US-014 Create login page [agent: frontend-developer] [deps: T027] [files: apps/campsite-frontend/src/app/auth/login/page.tsx]
- [ ] T029 P1 US-014 Create ForgotPasswordForm component [agent: frontend-developer] [deps: none] [files: apps/campsite-frontend/src/components/auth/ForgotPasswordForm.tsx]
- [ ] T030 P1 US-014 Create ResetPasswordForm component [agent: frontend-developer] [deps: none] [files: apps/campsite-frontend/src/components/auth/ResetPasswordForm.tsx]
- [ ] T031 P1 US-014 Create reset-password page [agent: frontend-developer] [deps: T030] [files: apps/campsite-frontend/src/app/auth/reset-password/page.tsx]
- [ ] T032 P2 US-014 Unit test: LoginForm submits correctly [agent: test-automator] [deps: T027] [files: apps/campsite-frontend/__tests__/components/LoginForm.test.tsx]
- [ ] T033 P2 US-014 Unit test: ForgotPasswordForm validates email [agent: test-automator] [deps: T029] [files: apps/campsite-frontend/__tests__/components/ForgotPassword.test.tsx]

#### Phase 2: Auth Hooks & Utils
- [ ] T034 P1 US-014 Create useAuth hook [agent: frontend-developer] [deps: none] [files: apps/campsite-frontend/src/hooks/useAuth.ts]
- [ ] T035 P1 US-014 Create Supabase SSR client [agent: frontend-developer] [deps: none] [files: apps/campsite-frontend/src/lib/supabase/server.ts]
- [ ] T036 P1 US-014 Create Supabase browser client [agent: frontend-developer] [deps: none] [files: apps/campsite-frontend/src/lib/supabase/client.ts]
- [ ] T037 P1 US-014 Create AuthGuard component [agent: frontend-developer] [deps: T034] [files: apps/campsite-frontend/src/components/auth/AuthGuard.tsx]
- [ ] T038 P2 US-014 Unit test: useAuth returns correct user state [agent: test-automator] [deps: T034] [files: apps/campsite-frontend/__tests__/hooks/useAuth.test.ts]
- [ ] T039 P2 US-014 Unit test: AuthGuard redirects when not authenticated [agent: test-automator] [deps: T037] [files: apps/campsite-frontend/__tests__/components/AuthGuard.test.tsx]

#### Phase 3: Middleware & Route Protection
- [ ] T040 P1 US-014 Create Next.js middleware for route protection [agent: frontend-developer] [deps: T035] [files: apps/campsite-frontend/src/middleware.ts]
- [ ] T041 P1 US-014 Configure protected route patterns [agent: frontend-developer] [deps: T040] [files: apps/campsite-frontend/src/middleware.ts]
- [ ] T042 P2 US-014 Unit test: Middleware redirects unauthenticated users [agent: test-automator] [deps: T040] [files: apps/campsite-frontend/__tests__/middleware.test.ts]

#### Phase 4: E2E Login Tests
- [ ] T043 P2 US-014 E2E: User can log in with correct credentials [agent: test-automator] [deps: T028] [files: tests/e2e/auth/login.test.ts]
- [ ] T044 P2 US-014 E2E: Login fails with wrong password [agent: test-automator] [deps: T028] [files: tests/e2e/auth/login-invalid.test.ts]
- [ ] T045 P2 US-014 E2E: Login fails with non-existent email [agent: test-automator] [deps: T028] [files: tests/e2e/auth/login-not-found.test.ts]
- [ ] T046 P2 US-014 E2E: Protected routes redirect to login [agent: test-automator] [deps: T040] [files: tests/e2e/auth/protected-routes.test.ts]
- [ ] T047 P2 US-014 E2E: Password reset flow completes [agent: test-automator] [deps: T031] [files: tests/e2e/auth/password-reset.test.ts]
- [ ] T048 P2 US-014 E2E: Session persists across page refresh [agent: test-automator] [deps: T028] [files: tests/e2e/auth/session-persistence.test.ts]

### Story Progress: 0/22

---

## User Story: US-015 Owner Registration Flow (Q9)
> As a user, I want to request owner privileges so that I can list my campsite on the platform after admin approval.

### Acceptance Criteria
- [ ] User can submit owner request form
- [ ] Business details validated before submission
- [ ] Request status tracked (pending/approved/rejected)
- [ ] User notified when request reviewed
- [ ] Approved users have role upgraded to 'owner'

### Tasks

#### Phase 1: Backend API
- [ ] T049 P1 US-015 Create owner request API endpoint [agent: backend-architect] [deps: T001, T006] [files: apps/campsite-backend/src/routes/auth.ts]
- [ ] T050 P1 US-015 Create auth middleware for backend [agent: backend-architect] [deps: none] [files: apps/campsite-backend/src/middleware/auth.ts]
- [ ] T051 P1 US-015 Create rate limiter middleware [agent: backend-architect] [deps: none] [files: apps/campsite-backend/src/middleware/rate-limit.ts]
- [ ] T052 P2 US-015 Unit test: Owner request endpoint validation [agent: test-automator] [deps: T049] [files: apps/campsite-backend/__tests__/routes/owner-request.test.ts]
- [ ] T053 P2 US-015 Unit test: Auth middleware verifies JWT [agent: test-automator] [deps: T050] [files: apps/campsite-backend/__tests__/middleware/auth.test.ts]

#### Phase 2: Frontend - Owner Request
- [ ] T054 P1 US-015 Create OwnerRequestForm component [agent: frontend-developer] [deps: T006] [files: apps/campsite-frontend/src/components/auth/OwnerRequestForm.tsx]
- [ ] T055 P1 US-015 Create become-owner page [agent: frontend-developer] [deps: T054] [files: apps/campsite-frontend/src/app/auth/become-owner/page.tsx]
- [ ] T056 P2 US-015 Unit test: OwnerRequestForm validates business details [agent: test-automator] [deps: T054] [files: apps/campsite-frontend/__tests__/components/OwnerRequestForm.test.tsx]

#### Phase 3: E2E Owner Request Tests
- [ ] T057 P2 US-015 E2E: User can submit owner request [agent: test-automator] [deps: T055] [files: tests/e2e/auth/owner-request.test.ts]
- [ ] T058 P2 US-015 E2E: Duplicate owner request blocked [agent: test-automator] [deps: T055] [files: tests/e2e/auth/owner-request-duplicate.test.ts]

### Story Progress: 0/10

---

## Execution Batches

### Batch 0 - Database Foundation
| Task | Agent | Files |
|------|-------|-------|
| T001 | backend-architect | supabase/migrations/20260117100000_create_owner_requests.sql |
| T002 | backend-architect | supabase/migrations/20260117100001_create_profile_trigger.sql |
| T005 | backend-architect | packages/shared/src/schemas/auth.ts |
| T006 | backend-architect | packages/shared/src/schemas/owner-request.ts |
| T007 | backend-architect | packages/shared/src/types/user.ts |
| T011 | backend-architect | supabase/config.toml |

### Batch 1 - Configuration & Testing Foundation
| Task | Agent | Deps | Files |
|------|-------|------|-------|
| T003 | backend-architect | T002 | supabase/migrations/20260117100002_profile_rls_policies.sql |
| T004 | test-automator | T002 | apps/campsite-backend/__tests__/db/profile-trigger.test.ts |
| T008 | test-automator | T005 | packages/shared/__tests__/schemas/auth.test.ts |
| T009 | test-automator | T005 | packages/shared/__tests__/schemas/password.test.ts |
| T010 | test-automator | T005 | packages/shared/__tests__/schemas/phone.test.ts |
| T012 | backend-architect | T011 | supabase/config.toml |
| T013 | backend-architect | T011 | supabase/templates/ |
| T014 | test-automator | T011 | tests/integration/supabase-auth.test.ts |
| T015 | frontend-developer | none | apps/campsite-frontend/src/components/auth/PasswordStrength.tsx |

### Batch 2 - Frontend Components
| Task | Agent | Deps | Files |
|------|-------|------|-------|
| T016 | frontend-developer | T005, T015 | apps/campsite-frontend/src/components/auth/SignupForm.tsx |
| T018 | frontend-developer | none | apps/campsite-frontend/src/app/auth/callback/route.ts |
| T019 | test-automator | T015 | apps/campsite-frontend/__tests__/components/PasswordStrength.test.tsx |
| T027 | frontend-developer | none | apps/campsite-frontend/src/components/auth/LoginForm.tsx |
| T029 | frontend-developer | none | apps/campsite-frontend/src/components/auth/ForgotPasswordForm.tsx |
| T030 | frontend-developer | none | apps/campsite-frontend/src/components/auth/ResetPasswordForm.tsx |
| T034 | frontend-developer | none | apps/campsite-frontend/src/hooks/useAuth.ts |
| T035 | frontend-developer | none | apps/campsite-frontend/src/lib/supabase/server.ts |
| T036 | frontend-developer | none | apps/campsite-frontend/src/lib/supabase/client.ts |

### Batch 3 - Pages & Guards
| Task | Agent | Deps | Files |
|------|-------|------|-------|
| T017 | frontend-developer | T016 | apps/campsite-frontend/src/app/auth/signup/page.tsx |
| T020 | test-automator | T016 | apps/campsite-frontend/__tests__/components/SignupForm.test.tsx |
| T028 | frontend-developer | T027 | apps/campsite-frontend/src/app/auth/login/page.tsx |
| T031 | frontend-developer | T030 | apps/campsite-frontend/src/app/auth/reset-password/page.tsx |
| T032 | test-automator | T027 | apps/campsite-frontend/__tests__/components/LoginForm.test.tsx |
| T033 | test-automator | T029 | apps/campsite-frontend/__tests__/components/ForgotPassword.test.tsx |
| T037 | frontend-developer | T034 | apps/campsite-frontend/src/components/auth/AuthGuard.tsx |
| T038 | test-automator | T034 | apps/campsite-frontend/__tests__/hooks/useAuth.test.ts |
| T039 | test-automator | T037 | apps/campsite-frontend/__tests__/components/AuthGuard.test.tsx |

### Batch 4 - Middleware & Backend
| Task | Agent | Deps | Files |
|------|-------|------|-------|
| T040 | frontend-developer | T035 | apps/campsite-frontend/src/middleware.ts |
| T041 | frontend-developer | T040 | apps/campsite-frontend/src/middleware.ts |
| T042 | test-automator | T040 | apps/campsite-frontend/__tests__/middleware.test.ts |
| T049 | backend-architect | T001, T006 | apps/campsite-backend/src/routes/auth.ts |
| T050 | backend-architect | none | apps/campsite-backend/src/middleware/auth.ts |
| T051 | backend-architect | none | apps/campsite-backend/src/middleware/rate-limit.ts |
| T052 | test-automator | T049 | apps/campsite-backend/__tests__/routes/owner-request.test.ts |
| T053 | test-automator | T050 | apps/campsite-backend/__tests__/middleware/auth.test.ts |
| T054 | frontend-developer | T006 | apps/campsite-frontend/src/components/auth/OwnerRequestForm.tsx |

### Batch 5 - Owner Request & Final Components
| Task | Agent | Deps | Files |
|------|-------|------|-------|
| T055 | frontend-developer | T054 | apps/campsite-frontend/src/app/auth/become-owner/page.tsx |
| T056 | test-automator | T054 | apps/campsite-frontend/__tests__/components/OwnerRequestForm.test.tsx |

### Batch 6 - E2E Tests (Final Validation)
| Task | Agent | Deps | Files |
|------|-------|------|-------|
| T021 | test-automator | T017 | tests/e2e/auth/signup.test.ts |
| T022 | test-automator | T017 | tests/e2e/auth/signup-validation.test.ts |
| T023 | test-automator | T017 | tests/e2e/auth/password-strength.test.ts |
| T024 | test-automator | T017 | tests/e2e/auth/duplicate-email.test.ts |
| T025 | test-automator | T017 | tests/e2e/auth/email-verification.test.ts |
| T026 | test-automator | T018 | tests/e2e/auth/oauth-google.test.ts |
| T043 | test-automator | T028 | tests/e2e/auth/login.test.ts |
| T044 | test-automator | T028 | tests/e2e/auth/login-invalid.test.ts |
| T045 | test-automator | T028 | tests/e2e/auth/login-not-found.test.ts |
| T046 | test-automator | T040 | tests/e2e/auth/protected-routes.test.ts |
| T047 | test-automator | T031 | tests/e2e/auth/password-reset.test.ts |
| T048 | test-automator | T028 | tests/e2e/auth/session-persistence.test.ts |
| T057 | test-automator | T055 | tests/e2e/auth/owner-request.test.ts |
| T058 | test-automator | T055 | tests/e2e/auth/owner-request-duplicate.test.ts |

---

## Test Strategy

### Unit Tests (20 tests)
Testing individual components and logic:
- Zod schema validation (signup, password, phone)
- Database trigger functionality
- React component rendering (forms, password strength)
- Auth hooks (useAuth)
- Middleware (auth, rate limiting)
- API endpoints

**Framework:** Jest + @testing-library/react + Supertest (backend)
**Coverage Target:** 85%+
**Mock Strategy:** Mock Supabase client, use test database for trigger tests

### Integration Tests (1 test)
Testing service interactions:
- Supabase Auth service connectivity

**Framework:** Jest
**Coverage Target:** Critical auth flows

### E2E Tests (14 tests)
Testing complete user workflows:

**Signup Flow (6 tests):**
1. Valid signup creates account
2. Invalid email shows error
3. Weak password rejected
4. Duplicate email blocked
5. Verification email sent
6. Google OAuth completes

**Login Flow (6 tests):**
7. Valid credentials log in successfully
8. Wrong password shows error
9. Non-existent email shows error
10. Protected routes redirect to login
11. Password reset email sends and works
12. Session persists across refresh

**Owner Request (2 tests):**
13. User can submit owner request
14. Duplicate request blocked

**Framework:** Playwright
**Run Frequency:** Every PR
**Test Data:** Isolated test accounts

### Smoke Tests (3 tests)
Quick validation after deployment:
1. Login page loads
2. Signup form submits
3. OAuth redirect works

**Run Frequency:** After every deployment

---

## Definition of Done

### Code Complete
- [ ] All 58 tasks completed
- [ ] Database migrations applied
- [ ] RLS policies enforced
- [ ] All frontend components created
- [ ] Backend API endpoints functional
- [ ] Middleware configured

### Functionality
- [ ] User can sign up with email/password
- [ ] User can sign up with Google OAuth
- [ ] Email verification sent within 1 minute
- [ ] User can log in with valid credentials
- [ ] Invalid login shows appropriate errors
- [ ] Session tokens in HTTP-only cookies
- [ ] Token refresh works automatically
- [ ] Password reset flow functional
- [ ] Protected routes redirect to login
- [ ] User can request owner role
- [ ] Owner requests tracked with status

### Security
- [ ] Passwords hashed (Supabase bcrypt)
- [ ] HTTP-only cookies prevent XSS
- [ ] CSRF protection enabled
- [ ] Rate limiting active (5 attempts/15min)
- [ ] Email verification required
- [ ] OAuth state parameter validates
- [ ] RLS policies prevent unauthorized access

### Testing
- [ ] 20 unit tests passing (85%+ coverage)
- [ ] 1 integration test passing
- [ ] 14 E2E tests passing
- [ ] 3 smoke tests passing
- [ ] No security vulnerabilities

### Documentation
- [ ] API endpoints documented
- [ ] Component props documented
- [ ] Auth flow diagrams created
- [ ] Security considerations documented
- [ ] Environment variables documented

### Performance
- [ ] Login completes in < 2 seconds
- [ ] Signup completes in < 3 seconds
- [ ] Token refresh happens seamlessly
- [ ] No blocking operations on UI thread

---

## Progress Summary
- **Total:** 58
- **Completed:** 0
- **Pending:** 58
- **Percentage:** 0%

**Last Updated:** 2026-01-17
