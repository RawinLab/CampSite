# TodoList: Search & Discovery (Module 3)

## Overview
- **Source Plan:** `3-search-discovery-plan.md`
- **User Stories:** US-001 (Search by Location), US-002 (Filter by Type), US-003 (Filter by Price), US-004 (Filter by Amenities)
- **Total Tasks:** 62
- **Priority:** CRITICAL
- **Dependencies:** Module 0, Module 2
- **Generated:** 2026-01-17

---

## User Story: US-001 Search by Location
> As a user, I want to search for campsites by province name so that I can find campsites in my desired location with autocomplete suggestions.

### Acceptance Criteria
- [ ] Search input shows province autocomplete
- [ ] Autocomplete triggers after 2 characters typed
- [ ] Autocomplete shows max 10 provinces
- [ ] Province selection filters results
- [ ] Search works in both Thai and English
- [ ] Results update in real-time (<300ms)
- [ ] Map centers on selected province
- [ ] Clear button resets search

### Tasks

#### Phase 1: Backend - Province Search API
- [ ] T001 P1 US-001 Create province autocomplete endpoint [agent: backend-architect] [deps: none] [files: apps/campsite-backend/src/routes/provinces.ts]
- [ ] T002 P1 US-001 Create province controller [agent: backend-architect] [deps: T001] [files: apps/campsite-backend/src/controllers/provinceController.ts]
- [ ] T003 P1 US-001 Create province service with ILIKE search [agent: backend-architect] [deps: T002] [files: apps/campsite-backend/src/services/provinceService.ts]
- [ ] T004 P2 US-001 Unit test: Province autocomplete returns matches [agent: test-automator] [deps: T003] [files: apps/campsite-backend/__tests__/services/provinceService.test.ts]
- [ ] T005 P2 US-001 Integration test: Autocomplete API endpoint [agent: test-automator] [deps: T001] [files: tests/integration/api/provinces.test.ts]

#### Phase 2: Shared Schemas
- [ ] T006 P1 US-001 Create province autocomplete schema [agent: backend-architect] [deps: none] [files: packages/shared/src/schemas/province.ts]
- [ ] T007 P1 US-001 Create province TypeScript types [agent: backend-architect] [deps: none] [files: packages/shared/src/types/province.ts]
- [ ] T008 P2 US-001 Unit test: Province schema validation [agent: test-automator] [deps: T006] [files: packages/shared/__tests__/schemas/province.test.ts]

#### Phase 3: Frontend - Autocomplete Component
- [ ] T009 P1 US-001 Create ProvinceAutocomplete component [agent: frontend-developer] [deps: T006] [files: apps/campsite-frontend/src/components/search/ProvinceAutocomplete.tsx]
- [ ] T010 P1 US-001 Create useProvinceSearch hook with debounce [agent: frontend-developer] [deps: none] [files: apps/campsite-frontend/src/hooks/useProvinceSearch.ts]
- [ ] T011 P1 US-001 Create SearchBar component [agent: frontend-developer] [deps: T009] [files: apps/campsite-frontend/src/components/search/SearchBar.tsx]
- [ ] T012 P2 US-001 Unit test: ProvinceAutocomplete renders suggestions [agent: test-automator] [deps: T009] [files: apps/campsite-frontend/__tests__/components/ProvinceAutocomplete.test.tsx]
- [ ] T013 P2 US-001 Unit test: useProvinceSearch debounces correctly [agent: test-automator] [deps: T010] [files: apps/campsite-frontend/__tests__/hooks/useProvinceSearch.test.ts]

#### Phase 4: E2E Search Tests
- [ ] T014 P2 US-001 E2E: Autocomplete shows after typing 2 chars [agent: test-automator] [deps: T011] [files: tests/e2e/search/autocomplete.test.ts]
- [ ] T015 P2 US-001 E2E: Selecting province filters results [agent: test-automator] [deps: T011] [files: tests/e2e/search/province-filter.test.ts]
- [ ] T016 P2 US-001 E2E: Search works in Thai and English [agent: test-automator] [deps: T011] [files: tests/e2e/search/bilingual-search.test.ts]

### Story Progress: 0/16

---

## User Story: US-002 Filter by Type
> As a user, I want to filter campsites by type (camping, glamping, etc.) so that I can find the accommodation style I prefer.

### Acceptance Criteria
- [ ] Type filter shows all 4 types with icons
- [ ] Multi-select allows selecting multiple types
- [ ] Results update immediately on selection
- [ ] Selected types persist in URL
- [ ] Type colors match design (from campsite_types table)
- [ ] Clear all types button works

### Tasks

#### Phase 1: Frontend - Type Filter
- [ ] T017 P1 US-002 Create TypeFilter component [agent: frontend-developer] [deps: none] [files: apps/campsite-frontend/src/components/search/TypeFilter.tsx]
- [ ] T018 P1 US-002 Create TypeBadge component with colors [agent: frontend-developer] [deps: none] [files: apps/campsite-frontend/src/components/ui/TypeBadge.tsx]
- [ ] T019 P2 US-002 Unit test: TypeFilter multi-select works [agent: test-automator] [deps: T017] [files: apps/campsite-frontend/__tests__/components/TypeFilter.test.tsx]
- [ ] T020 P2 US-002 Unit test: TypeBadge renders with correct color [agent: test-automator] [deps: T018] [files: apps/campsite-frontend/__tests__/components/TypeBadge.test.tsx]

#### Phase 2: E2E Type Filter Tests
- [ ] T021 P2 US-002 E2E: Type filter multi-select works [agent: test-automator] [deps: T017] [files: tests/e2e/search/type-filter.test.ts]
- [ ] T022 P2 US-002 E2E: URL reflects selected types [agent: test-automator] [deps: T017] [files: tests/e2e/search/type-url-sync.test.ts]

### Story Progress: 0/6

---

## User Story: US-003 Filter by Price
> As a user, I want to filter campsites by price range so that I can find options within my budget.

### Acceptance Criteria
- [ ] Price slider shows ฿0 - ฿10,000 range
- [ ] Dual handles for min and max price
- [ ] Current values displayed above slider
- [ ] Results update on slider release
- [ ] Validation prevents min > max
- [ ] Price persists in URL

### Tasks

#### Phase 1: Shared Schemas
- [ ] T023 P1 US-003 Create price filter schema [agent: backend-architect] [deps: none] [files: packages/shared/src/schemas/price.ts]
- [ ] T024 P2 US-003 Unit test: Price validation (min <= max) [agent: test-automator] [deps: T023] [files: packages/shared/__tests__/schemas/price.test.ts]

#### Phase 2: Frontend - Price Slider
- [ ] T025 P1 US-003 Create PriceFilter component with dual slider [agent: frontend-developer] [deps: T023] [files: apps/campsite-frontend/src/components/search/PriceFilter.tsx]
- [ ] T026 P1 US-003 Create usePriceRange hook [agent: frontend-developer] [deps: none] [files: apps/campsite-frontend/src/hooks/usePriceRange.ts]
- [ ] T027 P2 US-003 Unit test: PriceFilter validates range [agent: test-automator] [deps: T025] [files: apps/campsite-frontend/__tests__/components/PriceFilter.test.tsx]
- [ ] T028 P2 US-003 Unit test: usePriceRange enforces min <= max [agent: test-automator] [deps: T026] [files: apps/campsite-frontend/__tests__/hooks/usePriceRange.test.ts]

#### Phase 3: E2E Price Filter Tests
- [ ] T029 P2 US-003 E2E: Price slider filters results [agent: test-automator] [deps: T025] [files: tests/e2e/search/price-filter.test.ts]
- [ ] T030 P2 US-003 E2E: Price validation prevents invalid range [agent: test-automator] [deps: T025] [files: tests/e2e/search/price-validation.test.ts]

### Story Progress: 0/8

---

## User Story: US-004 Filter by Amenities (AND Logic)
> As a user, I want to filter campsites by amenities so that I can find sites with specific facilities I need, using AND logic.

### Acceptance Criteria
- [ ] All 8 amenities displayed with icons
- [ ] Multi-select checkboxes for amenities
- [ ] AND logic: results have ALL selected amenities
- [ ] Results update on checkbox change
- [ ] Selected amenities persist in URL
- [ ] Clear all amenities button works

### Tasks

#### Phase 1: Backend - Amenity Filtering
- [ ] T031 P1 US-004 Update search service with amenity AND logic [agent: backend-architect] [deps: none] [files: apps/campsite-backend/src/services/searchService.ts]
- [ ] T032 P2 US-004 Unit test: Amenity AND logic filters correctly [agent: test-automator] [deps: T031] [files: apps/campsite-backend/__tests__/services/searchService.test.ts]
- [ ] T033 P2 US-004 Integration test: Search with multiple amenities [agent: test-automator] [deps: T031] [files: tests/integration/api/amenity-filter.test.ts]

#### Phase 2: Frontend - Amenities Filter
- [ ] T034 P1 US-004 Create AmenitiesFilter component [agent: frontend-developer] [deps: none] [files: apps/campsite-frontend/src/components/search/AmenitiesFilter.tsx]
- [ ] T035 P1 US-004 Create AmenityIcon component [agent: frontend-developer] [deps: none] [files: apps/campsite-frontend/src/components/ui/AmenityIcon.tsx]
- [ ] T036 P2 US-004 Unit test: AmenitiesFilter multi-select [agent: test-automator] [deps: T034] [files: apps/campsite-frontend/__tests__/components/AmenitiesFilter.test.tsx]
- [ ] T037 P2 US-004 Unit test: AmenityIcon renders correct icon [agent: test-automator] [deps: T035] [files: apps/campsite-frontend/__tests__/components/AmenityIcon.test.tsx]

#### Phase 3: E2E Amenity Filter Tests
- [ ] T038 P2 US-004 E2E: Amenity filter applies AND logic [agent: test-automator] [deps: T034] [files: tests/e2e/search/amenity-and-logic.test.ts]
- [ ] T039 P2 US-004 E2E: Multiple amenities filter correctly [agent: test-automator] [deps: T034] [files: tests/e2e/search/multi-amenity.test.ts]

### Story Progress: 0/9

---

## User Story: Search Results & Integration
> As a user, I want to see search results in a grid with sorting, pagination, and filter synchronization so that I can easily browse campsites.

### Acceptance Criteria
- [ ] Results display in responsive grid (3/2/1 columns)
- [ ] Sort options work (rating, price, newest)
- [ ] Pagination shows correct pages
- [ ] All filters combine correctly
- [ ] URL reflects complete search state
- [ ] Loading states show skeleton screens
- [ ] Empty results show helpful message
- [ ] Filter sidebar responsive on mobile

### Tasks

#### Phase 1: Backend - Search Integration
- [ ] T040 P1 SEARCH Create comprehensive search endpoint [agent: backend-architect] [deps: T003, T031] [files: apps/campsite-backend/src/routes/search.ts]
- [ ] T041 P1 SEARCH Create search controller [agent: backend-architect] [deps: T040] [files: apps/campsite-backend/src/controllers/searchController.ts]
- [ ] T042 P1 SEARCH Complete search service (all filters + sort) [agent: backend-architect] [deps: T041] [files: apps/campsite-backend/src/services/searchService.ts]
- [ ] T043 P2 SEARCH Unit test: Search combines all filters [agent: test-automator] [deps: T042] [files: apps/campsite-backend/__tests__/services/searchService-integration.test.ts]
- [ ] T044 P2 SEARCH Integration test: Search API with all params [agent: test-automator] [deps: T040] [files: tests/integration/api/search.test.ts]

#### Phase 2: Shared Schemas
- [ ] T045 P1 SEARCH Create complete search query schema [agent: backend-architect] [deps: T006, T023] [files: packages/shared/src/schemas/search.ts]
- [ ] T046 P1 SEARCH Create campsite card TypeScript types [agent: backend-architect] [deps: none] [files: packages/shared/src/types/campsite.ts]
- [ ] T047 P2 SEARCH Unit test: Search schema validates all params [agent: test-automator] [deps: T045] [files: packages/shared/__tests__/schemas/search.test.ts]

#### Phase 3: Frontend - Search Results
- [ ] T048 P1 SEARCH Create CampsiteCard component [agent: frontend-developer] [deps: T046] [files: apps/campsite-frontend/src/components/search/CampsiteCard.tsx]
- [ ] T049 P1 SEARCH Create SearchResults grid component [agent: frontend-developer] [deps: T048] [files: apps/campsite-frontend/src/components/search/SearchResults.tsx]
- [ ] T050 P1 SEARCH Create Pagination component [agent: frontend-developer] [deps: none] [files: apps/campsite-frontend/src/components/search/Pagination.tsx]
- [ ] T051 P1 SEARCH Create SortSelect component [agent: frontend-developer] [deps: none] [files: apps/campsite-frontend/src/components/search/SortSelect.tsx]
- [ ] T052 P1 SEARCH Create FilterSidebar container [agent: frontend-developer] [deps: T017, T025, T034] [files: apps/campsite-frontend/src/components/search/FilterSidebar.tsx]
- [ ] T053 P2 SEARCH Unit test: CampsiteCard displays data correctly [agent: test-automator] [deps: T048] [files: apps/campsite-frontend/__tests__/components/CampsiteCard.test.tsx]
- [ ] T054 P2 SEARCH Unit test: Pagination calculates pages correctly [agent: test-automator] [deps: T050] [files: apps/campsite-frontend/__tests__/components/Pagination.test.tsx]

#### Phase 4: Frontend - Search Page
- [ ] T055 P1 SEARCH Create useSearch hook with URL sync [agent: frontend-developer] [deps: T045] [files: apps/campsite-frontend/src/hooks/useSearch.ts]
- [ ] T056 P1 SEARCH Create useCampsites data fetching hook [agent: frontend-developer] [deps: T045] [files: apps/campsite-frontend/src/hooks/useCampsites.ts]
- [ ] T057 P1 SEARCH Create search page [agent: frontend-developer] [deps: T011, T052, T049] [files: apps/campsite-frontend/src/app/search/page.tsx]
- [ ] T058 P1 SEARCH Create search loading skeleton [agent: frontend-developer] [deps: none] [files: apps/campsite-frontend/src/app/search/loading.tsx]
- [ ] T059 P2 SEARCH Unit test: useSearch syncs with URL [agent: test-automator] [deps: T055] [files: apps/campsite-frontend/__tests__/hooks/useSearch.test.ts]

#### Phase 5: E2E Comprehensive Tests
- [ ] T060 P2 SEARCH E2E: Complete search flow with all filters [agent: test-automator] [deps: T057] [files: tests/e2e/search/complete-search.test.ts]
- [ ] T061 P2 SEARCH E2E: Sort options change result order [agent: test-automator] [deps: T057] [files: tests/e2e/search/sorting.test.ts]
- [ ] T062 P2 SEARCH E2E: Pagination works correctly [agent: test-automator] [deps: T057] [files: tests/e2e/search/pagination.test.ts]
- [ ] T063 P2 SEARCH E2E: URL sharing loads same filters [agent: test-automator] [deps: T057] [files: tests/e2e/search/url-sharing.test.ts]
- [ ] T064 P2 SEARCH E2E: Mobile filter modal works [agent: test-automator] [deps: T057] [files: tests/e2e/search/mobile-filters.test.ts]
- [ ] T065 P2 SEARCH E2E: Empty results show message [agent: test-automator] [deps: T057] [files: tests/e2e/search/empty-results.test.ts]
- [ ] T066 P2 SEARCH Smoke test: Search page loads under 500ms [agent: test-automator] [deps: T057] [files: tests/e2e/search/performance.test.ts]

### Story Progress: 0/23

---

## Execution Batches

### Batch 0 - Shared Schemas Foundation
| Task | Agent | Files |
|------|-------|-------|
| T006 | backend-architect | packages/shared/src/schemas/province.ts |
| T007 | backend-architect | packages/shared/src/types/province.ts |
| T023 | backend-architect | packages/shared/src/schemas/price.ts |

### Batch 1 - Backend Province API
| Task | Agent | Deps | Files |
|------|-------|------|-------|
| T001 | backend-architect | none | apps/campsite-backend/src/routes/provinces.ts |
| T002 | backend-architect | T001 | apps/campsite-backend/src/controllers/provinceController.ts |
| T003 | backend-architect | T002 | apps/campsite-backend/src/services/provinceService.ts |
| T004 | test-automator | T003 | apps/campsite-backend/__tests__/services/provinceService.test.ts |
| T005 | test-automator | T001 | tests/integration/api/provinces.test.ts |
| T008 | test-automator | T006 | packages/shared/__tests__/schemas/province.test.ts |
| T024 | test-automator | T023 | packages/shared/__tests__/schemas/price.test.ts |

### Batch 2 - Frontend Search Components Base
| Task | Agent | Deps | Files |
|------|-------|------|-------|
| T009 | frontend-developer | T006 | apps/campsite-frontend/src/components/search/ProvinceAutocomplete.tsx |
| T010 | frontend-developer | none | apps/campsite-frontend/src/hooks/useProvinceSearch.ts |
| T018 | frontend-developer | none | apps/campsite-frontend/src/components/ui/TypeBadge.tsx |
| T026 | frontend-developer | none | apps/campsite-frontend/src/hooks/usePriceRange.ts |
| T035 | frontend-developer | none | apps/campsite-frontend/src/components/ui/AmenityIcon.tsx |

### Batch 3 - Filter Components
| Task | Agent | Deps | Files |
|------|-------|------|-------|
| T011 | frontend-developer | T009 | apps/campsite-frontend/src/components/search/SearchBar.tsx |
| T012 | test-automator | T009 | apps/campsite-frontend/__tests__/components/ProvinceAutocomplete.test.tsx |
| T013 | test-automator | T010 | apps/campsite-frontend/__tests__/hooks/useProvinceSearch.test.ts |
| T017 | frontend-developer | none | apps/campsite-frontend/src/components/search/TypeFilter.tsx |
| T019 | test-automator | T017 | apps/campsite-frontend/__tests__/components/TypeFilter.test.tsx |
| T020 | test-automator | T018 | apps/campsite-frontend/__tests__/components/TypeBadge.test.tsx |
| T025 | frontend-developer | T023 | apps/campsite-frontend/src/components/search/PriceFilter.tsx |
| T027 | test-automator | T025 | apps/campsite-frontend/__tests__/components/PriceFilter.test.tsx |
| T028 | test-automator | T026 | apps/campsite-frontend/__tests__/hooks/usePriceRange.test.ts |

### Batch 4 - Backend Search Service
| Task | Agent | Deps | Files |
|------|-------|------|-------|
| T031 | backend-architect | none | apps/campsite-backend/src/services/searchService.ts |
| T032 | test-automator | T031 | apps/campsite-backend/__tests__/services/searchService.test.ts |
| T033 | test-automator | T031 | tests/integration/api/amenity-filter.test.ts |
| T034 | frontend-developer | none | apps/campsite-frontend/src/components/search/AmenitiesFilter.tsx |
| T036 | test-automator | T034 | apps/campsite-frontend/__tests__/components/AmenitiesFilter.test.tsx |
| T037 | test-automator | T035 | apps/campsite-frontend/__tests__/components/AmenityIcon.test.tsx |

### Batch 5 - Search Integration Backend
| Task | Agent | Deps | Files |
|------|-------|------|-------|
| T040 | backend-architect | T003, T031 | apps/campsite-backend/src/routes/search.ts |
| T041 | backend-architect | T040 | apps/campsite-backend/src/controllers/searchController.ts |
| T042 | backend-architect | T041 | apps/campsite-backend/src/services/searchService.ts |
| T043 | test-automator | T042 | apps/campsite-backend/__tests__/services/searchService-integration.test.ts |
| T044 | test-automator | T040 | tests/integration/api/search.test.ts |
| T045 | backend-architect | T006, T023 | packages/shared/src/schemas/search.ts |
| T046 | backend-architect | none | packages/shared/src/types/campsite.ts |
| T047 | test-automator | T045 | packages/shared/__tests__/schemas/search.test.ts |

### Batch 6 - Search Results Components
| Task | Agent | Deps | Files |
|------|-------|------|-------|
| T048 | frontend-developer | T046 | apps/campsite-frontend/src/components/search/CampsiteCard.tsx |
| T049 | frontend-developer | T048 | apps/campsite-frontend/src/components/search/SearchResults.tsx |
| T050 | frontend-developer | none | apps/campsite-frontend/src/components/search/Pagination.tsx |
| T051 | frontend-developer | none | apps/campsite-frontend/src/components/search/SortSelect.tsx |
| T052 | frontend-developer | T017, T025, T034 | apps/campsite-frontend/src/components/search/FilterSidebar.tsx |
| T053 | test-automator | T048 | apps/campsite-frontend/__tests__/components/CampsiteCard.test.tsx |
| T054 | test-automator | T050 | apps/campsite-frontend/__tests__/components/Pagination.test.tsx |

### Batch 7 - Search Page Integration
| Task | Agent | Deps | Files |
|------|-------|------|-------|
| T055 | frontend-developer | T045 | apps/campsite-frontend/src/hooks/useSearch.ts |
| T056 | frontend-developer | T045 | apps/campsite-frontend/src/hooks/useCampsites.ts |
| T057 | frontend-developer | T011, T052, T049 | apps/campsite-frontend/src/app/search/page.tsx |
| T058 | frontend-developer | none | apps/campsite-frontend/src/app/search/loading.tsx |
| T059 | test-automator | T055 | apps/campsite-frontend/__tests__/hooks/useSearch.test.ts |

### Batch 8 - E2E Tests (Final Validation)
| Task | Agent | Deps | Files |
|------|-------|------|-------|
| T014 | test-automator | T011 | tests/e2e/search/autocomplete.test.ts |
| T015 | test-automator | T011 | tests/e2e/search/province-filter.test.ts |
| T016 | test-automator | T011 | tests/e2e/search/bilingual-search.test.ts |
| T021 | test-automator | T017 | tests/e2e/search/type-filter.test.ts |
| T022 | test-automator | T017 | tests/e2e/search/type-url-sync.test.ts |
| T029 | test-automator | T025 | tests/e2e/search/price-filter.test.ts |
| T030 | test-automator | T025 | tests/e2e/search/price-validation.test.ts |
| T038 | test-automator | T034 | tests/e2e/search/amenity-and-logic.test.ts |
| T039 | test-automator | T034 | tests/e2e/search/multi-amenity.test.ts |
| T060 | test-automator | T057 | tests/e2e/search/complete-search.test.ts |
| T061 | test-automator | T057 | tests/e2e/search/sorting.test.ts |
| T062 | test-automator | T057 | tests/e2e/search/pagination.test.ts |
| T063 | test-automator | T057 | tests/e2e/search/url-sharing.test.ts |
| T064 | test-automator | T057 | tests/e2e/search/mobile-filters.test.ts |
| T065 | test-automator | T057 | tests/e2e/search/empty-results.test.ts |
| T066 | test-automator | T057 | tests/e2e/search/performance.test.ts |

---

## Test Strategy

### Unit Tests (22 tests)
Testing individual components and logic:
- Province autocomplete service
- Search service with all filters
- Amenity AND logic filtering
- Schema validation (province, price, search)
- React components (filters, cards, pagination)
- Custom hooks (useSearch, useCampsites, useProvinceSearch)
- Price range validation
- Type filter multi-select
- Amenity filter multi-select

**Framework:** Jest + @testing-library/react + Supertest
**Coverage Target:** 80%+
**Mock Strategy:** Mock API calls, use test data for components

### Integration Tests (3 tests)
Testing service interactions:
- Province autocomplete API endpoint
- Search API with multiple parameters
- Amenity filter with AND logic

**Framework:** Jest + Supertest
**Coverage Target:** All search API combinations
**Test Database:** Supabase local with seed data

### E2E Tests (16 tests)
Testing complete user workflows:

**Province Search (3 tests):**
1. Autocomplete triggers and shows suggestions
2. Province selection filters results
3. Bilingual search (Thai/English)

**Type Filter (2 tests):**
4. Multi-select type filter
5. URL synchronization with types

**Price Filter (2 tests):**
6. Price slider filters results
7. Price validation (min <= max)

**Amenity Filter (2 tests):**
8. Amenity AND logic
9. Multiple amenities filtering

**Search Integration (7 tests):**
10. Complete search with all filters
11. Sort options change order
12. Pagination navigation
13. URL sharing preserves filters
14. Mobile filter modal
15. Empty results message
16. Performance (page load <500ms)

**Framework:** Playwright
**Run Frequency:** Every PR
**Test Data:** Seeded campsites with various attributes

### Smoke Tests (3 tests)
Quick validation after deployment:
1. Search page loads
2. Province autocomplete works
3. Results display correctly

**Run Frequency:** After every deployment

---

## Definition of Done

### Code Complete
- [ ] All 62 tasks completed
- [ ] Backend search API functional
- [ ] All frontend components implemented
- [ ] URL state management working
- [ ] Responsive design complete

### Functionality
- [ ] Province autocomplete shows within 300ms
- [ ] All 4 filter types work independently
- [ ] All filters combine correctly
- [ ] Sort options work (rating, price asc/desc, newest)
- [ ] Pagination calculates correctly
- [ ] Results update in real-time (<300ms)
- [ ] URL reflects complete search state
- [ ] Shared URLs load same filters
- [ ] Clear filters button resets all
- [ ] Only approved campsites shown (status = 'approved')

### UI/UX
- [ ] Responsive grid (3/2/1 columns)
- [ ] Skeleton loading screens (Q17)
- [ ] Empty results helpful message
- [ ] Mobile filter sidebar/modal
- [ ] Smooth transitions
- [ ] Accessible keyboard navigation
- [ ] Touch gestures on mobile

### Performance
- [ ] Autocomplete debounced (300ms)
- [ ] Search results <500ms
- [ ] Database queries optimized
- [ ] Image lazy loading
- [ ] Province list cached
- [ ] Memoized filter calculations

### Testing
- [ ] 22 unit tests passing (80%+ coverage)
- [ ] 3 integration tests passing
- [ ] 16 E2E tests passing
- [ ] 3 smoke tests passing
- [ ] No console errors
- [ ] No accessibility violations

### Documentation
- [ ] API endpoints documented
- [ ] Component props documented
- [ ] Search algorithm explained
- [ ] Filter logic documented
- [ ] URL parameter schema documented

### Security
- [ ] Input sanitization
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention
- [ ] Rate limiting on search API

---

## Progress Summary
- **Total:** 62
- **Completed:** 0
- **Pending:** 62
- **Percentage:** 0%

**Last Updated:** 2026-01-17
