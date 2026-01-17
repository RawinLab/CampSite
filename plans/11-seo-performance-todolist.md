# TodoList: SEO & Performance (Module 11)

## Overview
- **Source Plan:** `11-seo-performance-plan.md`
- **User Stories:** US-026 (SEO Optimization), US-027 (Performance Optimization), US-028 (Error Pages)
- **Total Tasks:** 64
- **Priority:** HIGH
- **Dependencies:** Module 4 (Campsite Detail)
- **Generated:** 2026-01-17

---

## User Story: US-026 SEO Optimization (Q15)
> As a platform owner, I want comprehensive SEO implementation so that campsites appear in search engines and social media previews.

### Acceptance Criteria
- [ ] All pages have unique meta titles and descriptions
- [ ] Open Graph tags for social sharing
- [ ] Twitter Card tags implemented
- [ ] JSON-LD structured data on campsite pages
- [ ] Dynamic sitemap.xml generated
- [ ] robots.txt configured
- [ ] Canonical URLs on all pages
- [ ] Breadcrumb schema on detail pages
- [ ] Organization schema on home page
- [ ] Review schema with aggregate ratings

### Tasks

#### Phase 1: Meta Tags & Open Graph
- [ ] T001 P1 US-026 Configure root layout metadata [agent: frontend-developer] [deps: none] [files: apps/campsite-frontend/src/app/layout.tsx]
- [ ] T002 P1 US-026 Create generateMetadata for campsite detail [agent: frontend-developer] [deps: none] [files: apps/campsite-frontend/src/app/campsites/[id]/page.tsx]
- [ ] T003 P1 US-026 Create generateMetadata for search page [agent: frontend-developer] [deps: none] [files: apps/campsite-frontend/src/app/search/page.tsx]
- [ ] T004 P1 US-026 Create generateMetadata for province pages [agent: frontend-developer] [deps: none] [files: apps/campsite-frontend/src/app/provinces/[slug]/page.tsx]
- [ ] T005 P2 US-026 Unit test: Verify meta tags structure [agent: test-automator] [deps: T001] [files: apps/campsite-frontend/__tests__/seo/meta-tags.test.ts]
- [ ] T006 P2 US-026 Unit test: Verify Open Graph tags [agent: test-automator] [deps: T002] [files: apps/campsite-frontend/__tests__/seo/open-graph.test.ts]

#### Phase 2: JSON-LD Structured Data
- [ ] T007 P1 US-026 Create OrganizationSchema component [agent: frontend-developer] [deps: none] [files: apps/campsite-frontend/src/components/seo/OrganizationSchema.tsx]
- [ ] T008 P1 US-026 Create CampsiteSchema component [agent: frontend-developer] [deps: none] [files: apps/campsite-frontend/src/components/seo/CampsiteSchema.tsx]
- [ ] T009 P1 US-026 Create BreadcrumbSchema component [agent: frontend-developer] [deps: none] [files: apps/campsite-frontend/src/components/seo/BreadcrumbSchema.tsx]
- [ ] T010 P1 US-026 Create ReviewSchema component [agent: frontend-developer] [deps: none] [files: apps/campsite-frontend/src/components/seo/ReviewSchema.tsx]
- [ ] T011 P1 US-026 Add schemas to campsite detail page [agent: frontend-developer] [deps: T008, T009, T010] [files: apps/campsite-frontend/src/app/campsites/[id]/page.tsx]
- [ ] T012 P1 US-026 Add OrganizationSchema to root layout [agent: frontend-developer] [deps: T007] [files: apps/campsite-frontend/src/app/layout.tsx]
- [ ] T013 P2 US-026 Unit test: Verify schema JSON structure [agent: test-automator] [deps: T008] [files: apps/campsite-frontend/__tests__/seo/schemas.test.ts]
- [ ] T014 P2 US-026 Integration test: Validate schema with Google validator [agent: test-automator] [deps: T008] [files: tests/integration/schema-validation.test.ts]

#### Phase 3: Sitemap & Robots
- [ ] T015 P1 US-026 Create dynamic sitemap.ts [agent: frontend-developer] [deps: none] [files: apps/campsite-frontend/src/app/sitemap.ts]
- [ ] T016 P1 US-026 Create robots.ts [agent: frontend-developer] [deps: none] [files: apps/campsite-frontend/src/app/robots.ts]
- [ ] T017 P1 US-026 Add sitemap generation for provinces [agent: frontend-developer] [deps: T015] [files: apps/campsite-frontend/src/app/sitemap.ts]
- [ ] T018 P1 US-026 Add sitemap generation for campsite types [agent: frontend-developer] [deps: T015] [files: apps/campsite-frontend/src/app/sitemap.ts]
- [ ] T019 P2 US-026 Unit test: Verify sitemap includes all pages [agent: test-automator] [deps: T015] [files: apps/campsite-frontend/__tests__/seo/sitemap.test.ts]
- [ ] T020 P2 US-026 Unit test: Verify robots.txt configuration [agent: test-automator] [deps: T016] [files: apps/campsite-frontend/__tests__/seo/robots.test.ts]
- [ ] T021 P2 US-026 Integration test: Sitemap accessible and valid [agent: test-automator] [deps: T015] [files: tests/integration/sitemap-access.test.ts]

#### Phase 4: SEO Utilities
- [ ] T022 P1 US-026 Create SEO helper utilities [agent: frontend-developer] [deps: none] [files: apps/campsite-frontend/src/lib/seo/utils.ts]
- [ ] T023 P1 US-026 Create canonical URL generator [agent: frontend-developer] [deps: none] [files: apps/campsite-frontend/src/lib/seo/canonical.ts]
- [ ] T024 P2 US-026 Unit test: SEO utilities generate correct output [agent: test-automator] [deps: T022] [files: apps/campsite-frontend/__tests__/lib/seo-utils.test.ts]

#### Phase 5: E2E SEO Tests
- [ ] T025 P2 US-026 E2E: Meta tags render correctly [agent: test-automator] [deps: T002] [files: tests/e2e/seo/meta-tags.test.ts]
- [ ] T026 P2 US-026 E2E: Open Graph tags present [agent: test-automator] [deps: T002] [files: tests/e2e/seo/open-graph.test.ts]
- [ ] T027 P2 US-026 E2E: JSON-LD schemas valid [agent: test-automator] [deps: T011] [files: tests/e2e/seo/structured-data.test.ts]
- [ ] T028 P2 US-026 E2E: Sitemap.xml accessible [agent: test-automator] [deps: T015] [files: tests/e2e/seo/sitemap-access.test.ts]
- [ ] T029 P2 US-026 E2E: Robots.txt accessible [agent: test-automator] [deps: T016] [files: tests/e2e/seo/robots-access.test.ts]

### Story Progress: 0/29

---

## User Story: US-027 Performance Optimization
> As a user, I want fast page loads and smooth interactions so that I have a great browsing experience.

### Acceptance Criteria
- [ ] Lighthouse score > 90 on all pages
- [ ] LCP < 2.5s on campsite detail
- [ ] FID < 100ms on all interactions
- [ ] CLS < 0.1 on all pages
- [ ] Images optimized (WebP/AVIF)
- [ ] Fonts optimized with display: swap
- [ ] Code splitting implemented
- [ ] Route prefetching enabled
- [ ] Critical CSS inlined
- [ ] Core Web Vitals tracked

### Tasks

#### Phase 1: Image Optimization
- [ ] T030 P1 US-027 Configure Next.js Image component [agent: frontend-developer] [deps: none] [files: apps/campsite-frontend/next.config.js]
- [ ] T031 P1 US-027 Update campsite cards to use next/image [agent: frontend-developer] [deps: T030] [files: apps/campsite-frontend/src/components/campsite/CampsiteCard.tsx]
- [ ] T032 P1 US-027 Update campsite gallery to use next/image [agent: frontend-developer] [deps: T030] [files: apps/campsite-frontend/src/components/campsite/CampsiteGallery.tsx]
- [ ] T033 P1 US-027 Create image loader for Supabase Storage [agent: frontend-developer] [deps: none] [files: apps/campsite-frontend/src/lib/image-loader.ts]
- [ ] T034 P1 US-027 Configure responsive image sizes [agent: frontend-developer] [deps: T030] [files: apps/campsite-frontend/next.config.js]
- [ ] T035 P2 US-027 Unit test: Image loader generates correct URLs [agent: test-automator] [deps: T033] [files: apps/campsite-frontend/__tests__/lib/image-loader.test.ts]
- [ ] T036 P2 US-027 Integration test: Images serve WebP/AVIF [agent: test-automator] [deps: T030] [files: tests/integration/image-formats.test.ts]

#### Phase 2: Font Optimization
- [ ] T037 P1 US-027 Configure Google Fonts with next/font [agent: frontend-developer] [deps: none] [files: apps/campsite-frontend/src/app/layout.tsx]
- [ ] T038 P1 US-027 Set font-display: swap [agent: frontend-developer] [deps: T037] [files: apps/campsite-frontend/src/app/layout.tsx]
- [ ] T039 P1 US-027 Preload critical fonts [agent: frontend-developer] [deps: T037] [files: apps/campsite-frontend/src/app/layout.tsx]
- [ ] T040 P2 US-027 Unit test: Fonts configured correctly [agent: test-automator] [deps: T037] [files: apps/campsite-frontend/__tests__/performance/fonts.test.ts]

#### Phase 3: Code Splitting & Lazy Loading
- [ ] T041 P1 US-027 Lazy load CampsiteMap component [agent: frontend-developer] [deps: none] [files: apps/campsite-frontend/src/app/campsites/[id]/page.tsx]
- [ ] T042 P1 US-027 Lazy load ReviewList component [agent: frontend-developer] [deps: none] [files: apps/campsite-frontend/src/app/campsites/[id]/page.tsx]
- [ ] T043 P1 US-027 Lazy load chart libraries [agent: frontend-developer] [deps: none] [files: apps/campsite-frontend/src/components/dashboard/AnalyticsChart.tsx]
- [ ] T044 P1 US-027 Implement route-based code splitting [agent: frontend-developer] [deps: none] [files: apps/campsite-frontend/next.config.js]
- [ ] T045 P2 US-027 Unit test: Lazy components load on demand [agent: test-automator] [deps: T041] [files: apps/campsite-frontend/__tests__/performance/lazy-loading.test.ts]

#### Phase 4: Core Web Vitals Monitoring
- [ ] T046 P1 US-027 Create WebVitals component [agent: frontend-developer] [deps: none] [files: apps/campsite-frontend/src/components/analytics/WebVitals.tsx]
- [ ] T047 P1 US-027 Add WebVitals to root layout [agent: frontend-developer] [deps: T046] [files: apps/campsite-frontend/src/app/layout.tsx]
- [ ] T048 P1 US-027 Create analytics tracking for web vitals [agent: frontend-developer] [deps: T046] [files: apps/campsite-frontend/src/lib/analytics/web-vitals.ts]
- [ ] T049 P2 US-027 Unit test: WebVitals reports metrics [agent: test-automator] [deps: T046] [files: apps/campsite-frontend/__tests__/analytics/web-vitals.test.ts]

#### Phase 5: Performance Tests
- [ ] T050 P2 US-027 Lighthouse test: Homepage score > 90 [agent: test-automator] [deps: T030, T037] [files: tests/performance/lighthouse-home.test.ts]
- [ ] T051 P2 US-027 Lighthouse test: Campsite detail score > 90 [agent: test-automator] [deps: T030, T037] [files: tests/performance/lighthouse-campsite.test.ts]
- [ ] T052 P2 US-027 Lighthouse test: Search page score > 90 [agent: test-automator] [deps: T030, T037] [files: tests/performance/lighthouse-search.test.ts]
- [ ] T053 P2 US-027 Performance test: LCP < 2.5s [agent: test-automator] [deps: T030] [files: tests/performance/lcp.test.ts]
- [ ] T054 P2 US-027 Performance test: FID < 100ms [agent: test-automator] [deps: T044] [files: tests/performance/fid.test.ts]
- [ ] T055 P2 US-027 Performance test: CLS < 0.1 [agent: test-automator] [deps: T030] [files: tests/performance/cls.test.ts]

### Story Progress: 0/26

---

## User Story: US-028 Custom Error Pages (Q16, Q17)
> As a user, I want helpful error pages and loading states so that I understand what's happening when things go wrong or take time.

### Acceptance Criteria
- [ ] Custom 404 page with search and suggestions
- [ ] Custom 500 error page with recovery options
- [ ] Maintenance page ready
- [ ] Skeleton screens on all pages during loading
- [ ] Loading states show within 200ms
- [ ] Error boundaries catch React errors
- [ ] Errors logged to monitoring service
- [ ] Mobile-friendly error pages

### Tasks

#### Phase 1: Error Pages
- [ ] T056 P1 US-028 Create custom 404 page [agent: frontend-developer] [deps: none] [files: apps/campsite-frontend/src/app/not-found.tsx]
- [ ] T057 P1 US-028 Create custom error page (500) [agent: frontend-developer] [deps: none] [files: apps/campsite-frontend/src/app/error.tsx]
- [ ] T058 P1 US-028 Create global error page [agent: frontend-developer] [deps: none] [files: apps/campsite-frontend/src/app/global-error.tsx]
- [ ] T059 P1 US-028 Create maintenance page [agent: frontend-developer] [deps: none] [files: apps/campsite-frontend/src/app/maintenance/page.tsx]
- [ ] T060 P2 US-028 Unit test: 404 page renders correctly [agent: test-automator] [deps: T056] [files: apps/campsite-frontend/__tests__/app/not-found.test.tsx]
- [ ] T061 P2 US-028 Unit test: Error page has retry button [agent: test-automator] [deps: T057] [files: apps/campsite-frontend/__tests__/app/error.test.tsx]

#### Phase 2: Skeleton Screens (Q17)
- [ ] T062 P1 US-028 Create CampsiteCardSkeleton component [agent: frontend-developer] [deps: none] [files: apps/campsite-frontend/src/components/skeletons/CampsiteCardSkeleton.tsx]
- [ ] T063 P1 US-028 Create CampsiteDetailSkeleton component [agent: frontend-developer] [deps: none] [files: apps/campsite-frontend/src/components/skeletons/CampsiteDetailSkeleton.tsx]
- [ ] T064 P1 US-028 Create SearchResultsSkeleton component [agent: frontend-developer] [deps: none] [files: apps/campsite-frontend/src/components/skeletons/SearchResultsSkeleton.tsx]
- [ ] T065 P1 US-028 Create loading.tsx for campsite detail [agent: frontend-developer] [deps: T063] [files: apps/campsite-frontend/src/app/campsites/[id]/loading.tsx]
- [ ] T066 P1 US-028 Create loading.tsx for search page [agent: frontend-developer] [deps: T064] [files: apps/campsite-frontend/src/app/search/loading.tsx]
- [ ] T067 P1 US-028 Create loading.tsx for dashboard [agent: frontend-developer] [deps: none] [files: apps/campsite-frontend/src/app/dashboard/loading.tsx]
- [ ] T068 P2 US-028 Unit test: Skeleton screens render [agent: test-automator] [deps: T062] [files: apps/campsite-frontend/__tests__/components/skeletons.test.tsx]

#### Phase 3: Error Boundaries
- [ ] T069 P1 US-028 Create ErrorBoundary component [agent: frontend-developer] [deps: none] [files: apps/campsite-frontend/src/components/ErrorBoundary.tsx]
- [ ] T070 P1 US-028 Add error logging service [agent: frontend-developer] [deps: none] [files: apps/campsite-frontend/src/lib/error-logging.ts]
- [ ] T071 P2 US-028 Unit test: ErrorBoundary catches errors [agent: test-automator] [deps: T069] [files: apps/campsite-frontend/__tests__/components/ErrorBoundary.test.tsx]

#### Phase 4: E2E Error Tests
- [ ] T072 P2 US-028 E2E: 404 page displays for invalid routes [agent: test-automator] [deps: T056] [files: tests/e2e/errors/404-page.test.ts]
- [ ] T073 P2 US-028 E2E: Error page displays on server error [agent: test-automator] [deps: T057] [files: tests/e2e/errors/500-page.test.ts]
- [ ] T074 P2 US-028 E2E: Skeleton screens show during load [agent: test-automator] [deps: T065] [files: tests/e2e/loading/skeleton-screens.test.ts]
- [ ] T075 P2 US-028 E2E: Loading states appear quickly [agent: test-automator] [deps: T065] [files: tests/e2e/loading/loading-speed.test.ts]

#### Phase 5: Smoke Tests
- [ ] T076 P2 US-028 Smoke test: All pages load without errors [agent: test-automator] [deps: T056, T057] [files: tests/e2e/smoke/pages-load.test.ts]
- [ ] T077 P2 US-028 Smoke test: SEO tags present on key pages [agent: test-automator] [deps: T002] [files: tests/e2e/smoke/seo-tags.test.ts]
- [ ] T078 P2 US-028 Smoke test: Images load with optimization [agent: test-automator] [deps: T030] [files: tests/e2e/smoke/images-optimized.test.ts]

### Story Progress: 0/23

---

## Execution Batches

### Batch 0 - SEO Foundation
| Task | Agent | Files |
|------|-------|-------|
| T001 | frontend-developer | apps/campsite-frontend/src/app/layout.tsx |
| T007 | frontend-developer | apps/campsite-frontend/src/components/seo/OrganizationSchema.tsx |
| T008 | frontend-developer | apps/campsite-frontend/src/components/seo/CampsiteSchema.tsx |
| T009 | frontend-developer | apps/campsite-frontend/src/components/seo/BreadcrumbSchema.tsx |
| T010 | frontend-developer | apps/campsite-frontend/src/components/seo/ReviewSchema.tsx |
| T015 | frontend-developer | apps/campsite-frontend/src/app/sitemap.ts |
| T016 | frontend-developer | apps/campsite-frontend/src/app/robots.ts |
| T022 | frontend-developer | apps/campsite-frontend/src/lib/seo/utils.ts |
| T023 | frontend-developer | apps/campsite-frontend/src/lib/seo/canonical.ts |

### Batch 1 - Meta Tags & Page Metadata
| Task | Agent | Deps | Files |
|------|-------|------|-------|
| T002 | frontend-developer | none | apps/campsite-frontend/src/app/campsites/[id]/page.tsx |
| T003 | frontend-developer | none | apps/campsite-frontend/src/app/search/page.tsx |
| T004 | frontend-developer | none | apps/campsite-frontend/src/app/provinces/[slug]/page.tsx |
| T005 | test-automator | T001 | apps/campsite-frontend/__tests__/seo/meta-tags.test.ts |
| T006 | test-automator | T002 | apps/campsite-frontend/__tests__/seo/open-graph.test.ts |
| T012 | frontend-developer | T007 | apps/campsite-frontend/src/app/layout.tsx |
| T017 | frontend-developer | T015 | apps/campsite-frontend/src/app/sitemap.ts |
| T018 | frontend-developer | T015 | apps/campsite-frontend/src/app/sitemap.ts |
| T024 | test-automator | T022 | apps/campsite-frontend/__tests__/lib/seo-utils.test.ts |

### Batch 2 - Structured Data Integration
| Task | Agent | Deps | Files |
|------|-------|------|-------|
| T011 | frontend-developer | T008, T009, T010 | apps/campsite-frontend/src/app/campsites/[id]/page.tsx |
| T013 | test-automator | T008 | apps/campsite-frontend/__tests__/seo/schemas.test.ts |
| T014 | test-automator | T008 | tests/integration/schema-validation.test.ts |
| T019 | test-automator | T015 | apps/campsite-frontend/__tests__/seo/sitemap.test.ts |
| T020 | test-automator | T016 | apps/campsite-frontend/__tests__/seo/robots.test.ts |
| T021 | test-automator | T015 | tests/integration/sitemap-access.test.ts |

### Batch 3 - Performance Foundation
| Task | Agent | Deps | Files |
|------|-------|------|-------|
| T030 | frontend-developer | none | apps/campsite-frontend/next.config.js |
| T033 | frontend-developer | none | apps/campsite-frontend/src/lib/image-loader.ts |
| T034 | frontend-developer | T030 | apps/campsite-frontend/next.config.js |
| T037 | frontend-developer | none | apps/campsite-frontend/src/app/layout.tsx |
| T044 | frontend-developer | none | apps/campsite-frontend/next.config.js |
| T046 | frontend-developer | none | apps/campsite-frontend/src/components/analytics/WebVitals.tsx |
| T048 | frontend-developer | T046 | apps/campsite-frontend/src/lib/analytics/web-vitals.ts |

### Batch 4 - Image & Font Optimization
| Task | Agent | Deps | Files |
|------|-------|------|-------|
| T031 | frontend-developer | T030 | apps/campsite-frontend/src/components/campsite/CampsiteCard.tsx |
| T032 | frontend-developer | T030 | apps/campsite-frontend/src/components/campsite/CampsiteGallery.tsx |
| T035 | test-automator | T033 | apps/campsite-frontend/__tests__/lib/image-loader.test.ts |
| T036 | test-automator | T030 | tests/integration/image-formats.test.ts |
| T038 | frontend-developer | T037 | apps/campsite-frontend/src/app/layout.tsx |
| T039 | frontend-developer | T037 | apps/campsite-frontend/src/app/layout.tsx |
| T040 | test-automator | T037 | apps/campsite-frontend/__tests__/performance/fonts.test.ts |
| T047 | frontend-developer | T046 | apps/campsite-frontend/src/app/layout.tsx |
| T049 | test-automator | T046 | apps/campsite-frontend/__tests__/analytics/web-vitals.test.ts |

### Batch 5 - Code Splitting & Lazy Loading
| Task | Agent | Deps | Files |
|------|-------|------|-------|
| T041 | frontend-developer | none | apps/campsite-frontend/src/app/campsites/[id]/page.tsx |
| T042 | frontend-developer | none | apps/campsite-frontend/src/app/campsites/[id]/page.tsx |
| T043 | frontend-developer | none | apps/campsite-frontend/src/components/dashboard/AnalyticsChart.tsx |
| T045 | test-automator | T041 | apps/campsite-frontend/__tests__/performance/lazy-loading.test.ts |

### Batch 6 - Error Pages
| Task | Agent | Deps | Files |
|------|-------|------|-------|
| T056 | frontend-developer | none | apps/campsite-frontend/src/app/not-found.tsx |
| T057 | frontend-developer | none | apps/campsite-frontend/src/app/error.tsx |
| T058 | frontend-developer | none | apps/campsite-frontend/src/app/global-error.tsx |
| T059 | frontend-developer | none | apps/campsite-frontend/src/app/maintenance/page.tsx |
| T060 | test-automator | T056 | apps/campsite-frontend/__tests__/app/not-found.test.tsx |
| T061 | test-automator | T057 | apps/campsite-frontend/__tests__/app/error.test.tsx |
| T069 | frontend-developer | none | apps/campsite-frontend/src/components/ErrorBoundary.tsx |
| T070 | frontend-developer | none | apps/campsite-frontend/src/lib/error-logging.ts |
| T071 | test-automator | T069 | apps/campsite-frontend/__tests__/components/ErrorBoundary.test.tsx |

### Batch 7 - Skeleton Screens
| Task | Agent | Deps | Files |
|------|-------|------|-------|
| T062 | frontend-developer | none | apps/campsite-frontend/src/components/skeletons/CampsiteCardSkeleton.tsx |
| T063 | frontend-developer | none | apps/campsite-frontend/src/components/skeletons/CampsiteDetailSkeleton.tsx |
| T064 | frontend-developer | none | apps/campsite-frontend/src/components/skeletons/SearchResultsSkeleton.tsx |
| T065 | frontend-developer | T063 | apps/campsite-frontend/src/app/campsites/[id]/loading.tsx |
| T066 | frontend-developer | T064 | apps/campsite-frontend/src/app/search/loading.tsx |
| T067 | frontend-developer | none | apps/campsite-frontend/src/app/dashboard/loading.tsx |
| T068 | test-automator | T062 | apps/campsite-frontend/__tests__/components/skeletons.test.tsx |

### Batch 8 - E2E SEO Tests
| Task | Agent | Deps | Files |
|------|-------|------|-------|
| T025 | test-automator | T002 | tests/e2e/seo/meta-tags.test.ts |
| T026 | test-automator | T002 | tests/e2e/seo/open-graph.test.ts |
| T027 | test-automator | T011 | tests/e2e/seo/structured-data.test.ts |
| T028 | test-automator | T015 | tests/e2e/seo/sitemap-access.test.ts |
| T029 | test-automator | T016 | tests/e2e/seo/robots-access.test.ts |

### Batch 9 - Performance Tests (Lighthouse)
| Task | Agent | Deps | Files |
|------|-------|------|-------|
| T050 | test-automator | T030, T037 | tests/performance/lighthouse-home.test.ts |
| T051 | test-automator | T030, T037 | tests/performance/lighthouse-campsite.test.ts |
| T052 | test-automator | T030, T037 | tests/performance/lighthouse-search.test.ts |
| T053 | test-automator | T030 | tests/performance/lcp.test.ts |
| T054 | test-automator | T044 | tests/performance/fid.test.ts |
| T055 | test-automator | T030 | tests/performance/cls.test.ts |

### Batch 10 - E2E Error & Loading Tests
| Task | Agent | Deps | Files |
|------|-------|------|-------|
| T072 | test-automator | T056 | tests/e2e/errors/404-page.test.ts |
| T073 | test-automator | T057 | tests/e2e/errors/500-page.test.ts |
| T074 | test-automator | T065 | tests/e2e/loading/skeleton-screens.test.ts |
| T075 | test-automator | T065 | tests/e2e/loading/loading-speed.test.ts |

### Batch 11 - Smoke Tests
| Task | Agent | Deps | Files |
|------|-------|------|-------|
| T076 | test-automator | T056, T057 | tests/e2e/smoke/pages-load.test.ts |
| T077 | test-automator | T002 | tests/e2e/smoke/seo-tags.test.ts |
| T078 | test-automator | T030 | tests/e2e/smoke/images-optimized.test.ts |

---

## Test Strategy

### Unit Tests (18 tests)
Testing individual components and utilities:
- Meta tag generation
- Open Graph tag structure
- JSON-LD schema structure
- SEO utilities
- Image loader
- Font configuration
- Lazy loading behavior
- WebVitals reporting
- Error boundaries
- Skeleton components

**Framework:** Jest + @testing-library/react
**Coverage Target:** 80%+
**Mock Strategy:** Mock Next.js metadata API, image optimization

### Integration Tests (3 tests)
Testing service interactions:
- Schema validation with Google validator
- Image format serving (WebP/AVIF)
- Sitemap accessibility

**Framework:** Jest + Puppeteer
**Coverage Target:** Critical SEO and performance paths

### E2E Tests (10 tests)
Testing complete user experience:

**SEO (5 tests):**
1. Meta tags render correctly
2. Open Graph tags present
3. JSON-LD schemas valid
4. Sitemap.xml accessible
5. Robots.txt accessible

**Error Pages (2 tests):**
6. 404 page displays for invalid routes
7. Error page displays on server error

**Loading States (2 tests):**
8. Skeleton screens show during load
9. Loading states appear quickly

**Framework:** Playwright
**Run Frequency:** Every PR

### Performance Tests (6 tests)
Testing Core Web Vitals:
1. Lighthouse score > 90 (Homepage)
2. Lighthouse score > 90 (Campsite detail)
3. Lighthouse score > 90 (Search page)
4. LCP < 2.5s
5. FID < 100ms
6. CLS < 0.1

**Framework:** Lighthouse CI + Playwright
**Run Frequency:** Every PR, nightly
**Fail Threshold:** Score < 85

### Smoke Tests (3 tests)
Quick validation after deployment:
1. All pages load without errors
2. SEO tags present on key pages
3. Images load with optimization

**Run Frequency:** After every deployment
**Timeout:** 30 seconds max

---

## Definition of Done

### Code Complete
- [ ] All 78 tasks completed
- [ ] All meta tags implemented
- [ ] All JSON-LD schemas added
- [ ] Sitemap and robots.txt configured
- [ ] All images optimized
- [ ] All fonts optimized
- [ ] Code splitting implemented
- [ ] Error pages created
- [ ] Skeleton screens on all pages

### SEO Functionality
- [ ] Unique meta titles on all pages
- [ ] Meta descriptions on all pages
- [ ] Open Graph tags functional
- [ ] Twitter Card tags present
- [ ] JSON-LD structured data valid
- [ ] Dynamic sitemap.xml generated
- [ ] Robots.txt configured correctly
- [ ] Canonical URLs on all pages
- [ ] Breadcrumb schema on detail pages
- [ ] Organization schema on homepage
- [ ] Review schema with aggregate ratings

### Performance Targets
- [ ] Lighthouse score > 90 on all pages
- [ ] LCP < 2.5s
- [ ] FID < 100ms
- [ ] CLS < 0.1
- [ ] TTFB < 600ms
- [ ] Images serve as WebP/AVIF
- [ ] Fonts load with display: swap
- [ ] Critical CSS inlined
- [ ] Route prefetching enabled

### Error Handling
- [ ] Custom 404 page with search
- [ ] Custom 500 error page
- [ ] Maintenance page ready
- [ ] Error boundaries catch React errors
- [ ] Errors logged to monitoring
- [ ] Mobile-friendly error pages

### Loading States
- [ ] Skeleton screens on all pages
- [ ] Loading states show < 200ms
- [ ] Smooth transitions
- [ ] No layout shift during load

### Testing
- [ ] 18 unit tests passing (80%+ coverage)
- [ ] 3 integration tests passing
- [ ] 10 E2E tests passing
- [ ] 6 performance tests passing (Lighthouse > 90)
- [ ] 3 smoke tests passing
- [ ] No flaky tests

### Documentation
- [ ] SEO strategy documented
- [ ] Performance optimization guide
- [ ] Image optimization guidelines
- [ ] Core Web Vitals tracking setup
- [ ] Error monitoring setup

---

## Progress Summary
- **Total:** 78
- **Completed:** 0
- **Pending:** 78
- **Percentage:** 0%

**Last Updated:** 2026-01-17
