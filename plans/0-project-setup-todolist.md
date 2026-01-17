# TodoList: Project Setup (Module 0)

## Overview
- **Source Plan:** `0-project-setup-plan.md`
- **User Stories:** US-001 (Turborepo Setup)
- **Total Tasks:** 46
- **Priority:** CRITICAL
- **Dependencies:** None
- **Generated:** 2026-01-17

---

## User Story: US-001 Turborepo Monorepo Setup
> As a developer, I need a properly configured Turborepo monorepo with Next.js frontend, Express backend, and shared packages so that I can develop the application efficiently.

### Acceptance Criteria
- [ ] Turborepo configured with pnpm workspaces
- [ ] Frontend (Next.js 14+) running on localhost:3000
- [ ] Backend (Express) running on localhost:4000
- [ ] Shared package types/schemas accessible to both apps
- [ ] Supabase initialized with migrations folder
- [ ] shadcn/ui components installed and working
- [ ] All environment variables documented
- [ ] Dev, build, lint commands working
- [ ] E2E smoke tests passing
- [ ] Documentation complete

### Tasks

#### Phase 1: Monorepo Foundation
- [ ] T001 P1 US-001 Initialize Turborepo with pnpm [agent: backend-architect] [deps: none] [files: turbo.json, pnpm-workspace.yaml, package.json]
- [ ] T002 P1 US-001 Create root package.json with turbo scripts [agent: backend-architect] [deps: T001] [files: package.json]
- [ ] T003 P1 US-001 Create pnpm-workspace.yaml configuration [agent: backend-architect] [deps: T001] [files: pnpm-workspace.yaml]
- [ ] T004 P1 US-001 Configure turbo.json with task pipeline [agent: backend-architect] [deps: T001] [files: turbo.json]
- [ ] T005 P1 US-001 Create .gitignore for monorepo [agent: backend-architect] [deps: T001] [files: .gitignore]
- [ ] T006 P2 US-001 Unit test: Verify turbo.json pipeline config [agent: test-automator] [deps: T004] [files: tests/turbo.test.ts]

#### Phase 2: Shared Packages
- [ ] T007 P1 US-001 Create packages/shared structure [agent: backend-architect] [deps: T001] [files: packages/shared/package.json, packages/shared/tsconfig.json]
- [ ] T008 P1 US-001 Create packages/config structure [agent: backend-architect] [deps: T001] [files: packages/config/package.json]
- [ ] T009 P1 US-001 Set up shared TypeScript types [agent: backend-architect] [deps: T007] [files: packages/shared/src/types/user.ts, packages/shared/src/types/campsite.ts]
- [ ] T010 P1 US-001 Set up shared Zod schemas [agent: backend-architect] [deps: T007] [files: packages/shared/src/schemas/auth.ts, packages/shared/src/schemas/campsite.ts]
- [ ] T011 P1 US-001 Create shared ESLint config [agent: backend-architect] [deps: T008] [files: packages/config/eslint/index.js]
- [ ] T012 P1 US-001 Create shared TypeScript config [agent: backend-architect] [deps: T008] [files: packages/config/typescript/base.json]
- [ ] T013 P2 US-001 Unit test: Verify shared types export correctly [agent: test-automator] [deps: T009] [files: packages/shared/__tests__/types.test.ts]
- [ ] T014 P2 US-001 Unit test: Verify Zod schemas validate correctly [agent: test-automator] [deps: T010] [files: packages/shared/__tests__/schemas.test.ts]

#### Phase 3: Frontend App
- [ ] T015 P1 US-001 Create Next.js 14+ app in apps/campsite-frontend [agent: frontend-developer] [deps: T001] [files: apps/campsite-frontend/package.json, apps/campsite-frontend/next.config.js]
- [ ] T016 P1 US-001 Configure Next.js App Router structure [agent: frontend-developer] [deps: T015] [files: apps/campsite-frontend/src/app/page.tsx, apps/campsite-frontend/src/app/layout.tsx]
- [ ] T017 P1 US-001 Install and configure Tailwind CSS [agent: frontend-developer] [deps: T015] [files: apps/campsite-frontend/tailwind.config.js, apps/campsite-frontend/src/app/globals.css]
- [ ] T018 P1 US-001 Initialize shadcn/ui with custom theme [agent: frontend-developer] [deps: T017] [files: apps/campsite-frontend/components.json]
- [ ] T019 P1 US-001 Install shadcn/ui components (button, card, form, etc.) [agent: frontend-developer] [deps: T018] [files: apps/campsite-frontend/src/components/ui/]
- [ ] T020 P1 US-001 Create Supabase client utilities [agent: frontend-developer] [deps: T015] [files: apps/campsite-frontend/src/lib/supabase/client.ts, apps/campsite-frontend/src/lib/supabase/server.ts]
- [ ] T021 P1 US-001 Link @campsite/shared package [agent: frontend-developer] [deps: T007, T015] [files: apps/campsite-frontend/package.json]
- [ ] T022 P1 US-001 Create .env.local template [agent: frontend-developer] [deps: T015] [files: apps/campsite-frontend/.env.example]
- [ ] T023 P2 US-001 Unit test: Verify Next.js config loads correctly [agent: test-automator] [deps: T015] [files: apps/campsite-frontend/__tests__/config.test.ts]
- [ ] T024 P2 US-001 Unit test: Verify Tailwind theme colors [agent: test-automator] [deps: T017] [files: apps/campsite-frontend/__tests__/tailwind.test.ts]
- [ ] T025 P2 US-001 Unit test: Verify shadcn/ui button component renders [agent: test-automator] [deps: T019] [files: apps/campsite-frontend/__tests__/components/button.test.tsx]

#### Phase 4: Backend App
- [ ] T026 P1 US-001 Create Express app in apps/campsite-backend [agent: backend-architect] [deps: T001] [files: apps/campsite-backend/package.json, apps/campsite-backend/tsconfig.json]
- [ ] T027 P1 US-001 Set up Express server with TypeScript [agent: backend-architect] [deps: T026] [files: apps/campsite-backend/src/index.ts, apps/campsite-backend/src/app.ts]
- [ ] T028 P1 US-001 Configure CORS, Helmet, and security middleware [agent: backend-architect] [deps: T027] [files: apps/campsite-backend/src/middleware/security.ts]
- [ ] T029 P1 US-001 Create health check endpoint [agent: backend-architect] [deps: T027] [files: apps/campsite-backend/src/routes/health.ts]
- [ ] T030 P1 US-001 Create Supabase client for backend [agent: backend-architect] [deps: T026] [files: apps/campsite-backend/src/lib/supabase.ts]
- [ ] T031 P1 US-001 Link @campsite/shared package [agent: backend-architect] [deps: T007, T026] [files: apps/campsite-backend/package.json]
- [ ] T032 P1 US-001 Create .env template [agent: backend-architect] [deps: T026] [files: apps/campsite-backend/.env.example]
- [ ] T033 P2 US-001 Unit test: Verify Express app initializes [agent: test-automator] [deps: T027] [files: apps/campsite-backend/__tests__/app.test.ts]
- [ ] T034 P2 US-001 Unit test: Verify health endpoint returns 200 [agent: test-automator] [deps: T029] [files: apps/campsite-backend/__tests__/health.test.ts]
- [ ] T035 P2 US-001 Unit test: Verify CORS middleware configured [agent: test-automator] [deps: T028] [files: apps/campsite-backend/__tests__/middleware.test.ts]

#### Phase 5: Supabase Setup
- [ ] T036 P1 US-001 Initialize Supabase CLI in project root [agent: backend-architect] [deps: T001] [files: supabase/config.toml]
- [ ] T037 P1 US-001 Configure supabase/config.toml [agent: backend-architect] [deps: T036] [files: supabase/config.toml]
- [ ] T038 P1 US-001 Create migrations folder structure [agent: backend-architect] [deps: T036] [files: supabase/migrations/]
- [ ] T039 P1 US-001 Create placeholder migration file [agent: backend-architect] [deps: T038] [files: supabase/migrations/20260117000000_initial_setup.sql]
- [ ] T040 P2 US-001 Integration test: Verify Supabase local instance starts [agent: test-automator] [deps: T036] [files: tests/integration/supabase.test.ts]

#### Phase 6: Documentation & Testing
- [ ] T041 P1 US-001 Create comprehensive README.md [agent: backend-architect] [deps: T001] [files: README.md]
- [ ] T042 P1 US-001 Document environment variables [agent: backend-architect] [deps: T022, T032] [files: docs/ENV_VARS.md]
- [ ] T043 P2 US-001 E2E smoke test: pnpm install completes [agent: test-automator] [deps: T001] [files: tests/e2e/setup.test.ts]
- [ ] T044 P2 US-001 E2E smoke test: pnpm dev starts both apps [agent: test-automator] [deps: T015, T026] [files: tests/e2e/dev-server.test.ts]
- [ ] T045 P2 US-001 E2E smoke test: Frontend accessible at :3000 [agent: test-automator] [deps: T015] [files: tests/e2e/frontend.test.ts]
- [ ] T046 P2 US-001 E2E smoke test: Backend health check returns 200 [agent: test-automator] [deps: T029] [files: tests/e2e/backend.test.ts]

### Story Progress: 0/46

---

## Execution Batches

### Batch 0 - Foundation (No Dependencies)
| Task | Agent | Files |
|------|-------|-------|
| T001 | backend-architect | turbo.json, pnpm-workspace.yaml, package.json |

### Batch 1 - Core Configuration (Depends on Batch 0)
| Task | Agent | Deps | Files |
|------|-------|------|-------|
| T002 | backend-architect | T001 | package.json |
| T003 | backend-architect | T001 | pnpm-workspace.yaml |
| T004 | backend-architect | T001 | turbo.json |
| T005 | backend-architect | T001 | .gitignore |
| T007 | backend-architect | T001 | packages/shared/package.json |
| T008 | backend-architect | T001 | packages/config/package.json |
| T015 | frontend-developer | T001 | apps/campsite-frontend/ |
| T026 | backend-architect | T001 | apps/campsite-backend/ |
| T036 | backend-architect | T001 | supabase/config.toml |
| T041 | backend-architect | T001 | README.md |

### Batch 2 - Package Development (Depends on Batch 1)
| Task | Agent | Deps | Files |
|------|-------|------|-------|
| T006 | test-automator | T004 | tests/turbo.test.ts |
| T009 | backend-architect | T007 | packages/shared/src/types/ |
| T010 | backend-architect | T007 | packages/shared/src/schemas/ |
| T011 | backend-architect | T008 | packages/config/eslint/ |
| T012 | backend-architect | T008 | packages/config/typescript/ |
| T016 | frontend-developer | T015 | apps/campsite-frontend/src/app/ |
| T017 | frontend-developer | T015 | tailwind.config.js |
| T020 | frontend-developer | T015 | apps/campsite-frontend/src/lib/supabase/ |
| T022 | frontend-developer | T015 | .env.example |
| T023 | test-automator | T015 | __tests__/config.test.ts |
| T027 | backend-architect | T026 | apps/campsite-backend/src/ |
| T030 | backend-architect | T026 | apps/campsite-backend/src/lib/supabase.ts |
| T032 | backend-architect | T026 | .env.example |
| T033 | test-automator | T027 | __tests__/app.test.ts |
| T037 | backend-architect | T036 | supabase/config.toml |
| T038 | backend-architect | T036 | supabase/migrations/ |

### Batch 3 - Advanced Features (Depends on Batch 2)
| Task | Agent | Deps | Files |
|------|-------|------|-------|
| T013 | test-automator | T009 | packages/shared/__tests__/types.test.ts |
| T014 | test-automator | T010 | packages/shared/__tests__/schemas.test.ts |
| T018 | frontend-developer | T017 | components.json |
| T021 | frontend-developer | T007, T015 | package.json |
| T024 | test-automator | T017 | __tests__/tailwind.test.ts |
| T028 | backend-architect | T027 | apps/campsite-backend/src/middleware/ |
| T029 | backend-architect | T027 | apps/campsite-backend/src/routes/health.ts |
| T031 | backend-architect | T007, T026 | package.json |
| T039 | backend-architect | T038 | supabase/migrations/20260117000000_initial_setup.sql |
| T040 | test-automator | T036 | tests/integration/supabase.test.ts |

### Batch 4 - UI Components & Testing (Depends on Batch 3)
| Task | Agent | Deps | Files |
|------|-------|------|-------|
| T019 | frontend-developer | T018 | apps/campsite-frontend/src/components/ui/ |
| T025 | test-automator | T019 | __tests__/components/button.test.tsx |
| T034 | test-automator | T029 | __tests__/health.test.ts |
| T035 | test-automator | T028 | __tests__/middleware.test.ts |
| T042 | backend-architect | T022, T032 | docs/ENV_VARS.md |
| T043 | test-automator | T001 | tests/e2e/setup.test.ts |

### Batch 5 - E2E Smoke Tests (Final Validation)
| Task | Agent | Deps | Files |
|------|-------|------|-------|
| T044 | test-automator | T015, T026 | tests/e2e/dev-server.test.ts |
| T045 | test-automator | T015 | tests/e2e/frontend.test.ts |
| T046 | test-automator | T029 | tests/e2e/backend.test.ts |

---

## Test Strategy

### Unit Tests (14 tests)
Testing individual components and configurations:
- Turborepo pipeline configuration
- Shared package exports (types, schemas)
- Zod schema validation
- Next.js configuration
- Tailwind theme
- shadcn/ui components
- Express app initialization
- Health endpoint
- CORS middleware

**Framework:** Jest + @testing-library/react
**Coverage Target:** 80%+

### Integration Tests (1 test)
Testing component interactions:
- Supabase local instance connectivity

**Framework:** Jest
**Coverage Target:** Critical paths only

### E2E Smoke Tests (4 tests)
Testing complete workflows:
1. **Installation Test**: `pnpm install` completes without errors
2. **Dev Server Test**: `pnpm dev` starts both apps successfully
3. **Frontend Test**: Frontend accessible at http://localhost:3000
4. **Backend Test**: Backend health check returns 200 at http://localhost:4000/api/health

**Framework:** Playwright
**Run Frequency:** Every commit

---

## Definition of Done

### Code Complete
- [ ] All 46 tasks completed
- [ ] Turborepo configured with proper task dependencies in turbo.json
- [ ] pnpm workspaces configured and linking packages correctly
- [ ] Shared TypeScript configs working across all packages
- [ ] ESLint + Prettier shared configs applied

### Functionality
- [ ] Hot reload working for both apps
- [ ] Build caching functional in Turbo
- [ ] Frontend runs on localhost:3000
- [ ] Backend runs on localhost:4000
- [ ] Health check endpoint returns 200

### Supabase
- [ ] Supabase CLI initialized
- [ ] config.toml configured correctly
- [ ] Migrations folder structure ready
- [ ] Initial placeholder migration exists

### UI/UX
- [ ] shadcn/ui components installed (button, card, form, input, etc.)
- [ ] Custom camping theme applied (forest green, earth brown)
- [ ] Dark mode support configured

### Testing
- [ ] 14 unit tests passing
- [ ] 1 integration test passing
- [ ] 4 E2E smoke tests passing
- [ ] Test coverage >= 80% for critical paths

### Documentation
- [ ] README.md with setup instructions
- [ ] docs/ENV_VARS.md documenting all environment variables
- [ ] .env.example files in both apps
- [ ] Inline code comments for complex configurations

### Quality
- [ ] No ESLint errors
- [ ] No TypeScript errors
- [ ] All dependencies up to date
- [ ] No security vulnerabilities (npm audit)

---

## Progress Summary
- **Total:** 46
- **Completed:** 0
- **Pending:** 46
- **Percentage:** 0%

**Last Updated:** 2026-01-17
