# TodoList: Search & Discovery (Module 3)

## Overview
- **Source Plan:** `3-search-discovery-plan.md`
- **User Stories:** US-001 (Search by Location), US-002 (Filter by Type), US-003 (Filter by Price), US-004 (Filter by Amenities)
- **Total Tasks:** 62
- **Priority:** CRITICAL
- **Dependencies:** Module 0, Module 2
- **Generated:** 2026-01-17
- **Last Updated:** 2026-01-17

---

## User Story: US-001 Search by Location
> As a user, I want to search for campsites by province name so that I can find campsites in my desired location with autocomplete suggestions.

### Acceptance Criteria
- [x] Search input shows province autocomplete
- [x] Autocomplete triggers after 2 characters typed
- [x] Autocomplete shows max 10 provinces
- [x] Province selection filters results
- [x] Search works in both Thai and English
- [x] Results update in real-time (<300ms)
- [ ] Map centers on selected province
- [x] Clear button resets search

### Tasks

#### Phase 1: Backend - Province Search API
- [x] T001 P1 US-001 Create province autocomplete endpoint [agent: backend-architect] [deps: none] [files: apps/campsite-backend/src/routes/provinces.ts]
- [x] T002 P1 US-001 Create province controller [agent: backend-architect] [deps: T001] [files: apps/campsite-backend/src/controllers/provinceController.ts]
- [x] T003 P1 US-001 Create province service with ILIKE search [agent: backend-architect] [deps: T002] [files: apps/campsite-backend/src/services/provinceService.ts]
- [ ] T004 P2 US-001 Unit test: Province autocomplete returns matches [agent: test-automator] [deps: T003] [files: apps/campsite-backend/__tests__/services/provinceService.test.ts]
- [ ] T005 P2 US-001 Integration test: Autocomplete API endpoint [agent: test-automator] [deps: T001] [files: tests/integration/api/provinces.test.ts]

#### Phase 2: Shared Schemas
- [x] T006 P1 US-001 Create province autocomplete schema [agent: backend-architect] [deps: none] [files: packages/shared/src/schemas/province.ts]
- [x] T007 P1 US-001 Create province TypeScript types [agent: backend-architect] [deps: none] [files: packages/shared/src/types/province.ts]
- [ ] T008 P2 US-001 Unit test: Province schema validation [agent: test-automator] [deps: T006] [files: packages/shared/__tests__/schemas/province.test.ts]

#### Phase 3: Frontend - Autocomplete Component
- [x] T009 P1 US-001 Create ProvinceAutocomplete component [agent: frontend-developer] [deps: T006] [files: apps/campsite-frontend/src/components/search/ProvinceAutocomplete.tsx]
- [x] T010 P1 US-001 Create useProvinceSearch hook with debounce [agent: frontend-developer] [deps: none] [files: apps/campsite-frontend/src/hooks/useProvinceSearch.ts]
- [x] T011 P1 US-001 Create SearchBar component [agent: frontend-developer] [deps: T009] [files: apps/campsite-frontend/src/components/search/SearchBar.tsx]
- [ ] T012 P2 US-001 Unit test: ProvinceAutocomplete renders suggestions [agent: test-automator] [deps: T009] [files: apps/campsite-frontend/__tests__/components/ProvinceAutocomplete.test.tsx]
- [ ] T013 P2 US-001 Unit test: useProvinceSearch debounces correctly [agent: test-automator] [deps: T010] [files: apps/campsite-frontend/__tests__/hooks/useProvinceSearch.test.ts]

#### Phase 4: E2E Search Tests
- [ ] T014 P2 US-001 E2E: Autocomplete shows after typing 2 chars [agent: test-automator] [deps: T011] [files: tests/e2e/search/autocomplete.test.ts]
- [ ] T015 P2 US-001 E2E: Selecting province filters results [agent: test-automator] [deps: T011] [files: tests/e2e/search/province-filter.test.ts]
- [ ] T016 P2 US-001 E2E: Search works in Thai and English [agent: test-automator] [deps: T011] [files: tests/e2e/search/bilingual-search.test.ts]

### Story Progress: 9/16 (P1 Complete)

---

## User Story: US-002 Filter by Type
> As a user, I want to filter campsites by type (camping, glamping, etc.) so that I can find the accommodation style I prefer.

### Acceptance Criteria
- [x] Type filter shows all 4 types with icons
- [x] Multi-select allows selecting multiple types
- [x] Results update immediately on selection
- [x] Selected types persist in URL
- [x] Type colors match design (from campsite_types table)
- [x] Clear all types button works

### Tasks

#### Phase 1: Frontend - Type Filter
- [x] T017 P1 US-002 Create TypeFilter component [agent: frontend-developer] [deps: none] [files: apps/campsite-frontend/src/components/search/TypeFilter.tsx]
- [x] T018 P1 US-002 Create TypeBadge component with colors [agent: frontend-developer] [deps: none] [files: apps/campsite-frontend/src/components/ui/TypeBadge.tsx]
- [ ] T019 P2 US-002 Unit test: TypeFilter multi-select works [agent: test-automator] [deps: T017] [files: apps/campsite-frontend/__tests__/components/TypeFilter.test.tsx]
- [ ] T020 P2 US-002 Unit test: TypeBadge renders with correct color [agent: test-automator] [deps: T018] [files: apps/campsite-frontend/__tests__/components/TypeBadge.test.tsx]

#### Phase 2: E2E Type Filter Tests
- [ ] T021 P2 US-002 E2E: Type filter multi-select works [agent: test-automator] [deps: T017] [files: tests/e2e/search/type-filter.test.ts]
- [ ] T022 P2 US-002 E2E: URL reflects selected types [agent: test-automator] [deps: T017] [files: tests/e2e/search/type-url-sync.test.ts]

### Story Progress: 2/6 (P1 Complete)

---

## User Story: US-003 Filter by Price
> As a user, I want to filter campsites by price range so that I can find options within my budget.

### Acceptance Criteria
- [x] Price slider shows ฿0 - ฿10,000 range
- [x] Dual handles for min and max price
- [x] Current values displayed above slider
- [x] Results update on slider release
- [x] Validation prevents min > max
- [x] Price persists in URL

### Tasks

#### Phase 1: Shared Schemas
- [x] T023 P1 US-003 Create price filter schema [agent: backend-architect] [deps: none] [files: packages/shared/src/schemas/price.ts]
- [ ] T024 P2 US-003 Unit test: Price validation (min <= max) [agent: test-automator] [deps: T023] [files: packages/shared/__tests__/schemas/price.test.ts]

#### Phase 2: Frontend - Price Slider
- [x] T025 P1 US-003 Create PriceFilter component with dual slider [agent: frontend-developer] [deps: T023] [files: apps/campsite-frontend/src/components/search/PriceFilter.tsx]
- [x] T026 P1 US-003 Create usePriceRange hook [agent: frontend-developer] [deps: none] [files: apps/campsite-frontend/src/hooks/usePriceRange.ts]
- [ ] T027 P2 US-003 Unit test: PriceFilter validates range [agent: test-automator] [deps: T025] [files: apps/campsite-frontend/__tests__/components/PriceFilter.test.tsx]
- [ ] T028 P2 US-003 Unit test: usePriceRange enforces min <= max [agent: test-automator] [deps: T026] [files: apps/campsite-frontend/__tests__/hooks/usePriceRange.test.ts]

#### Phase 3: E2E Price Filter Tests
- [ ] T029 P2 US-003 E2E: Price slider filters results [agent: test-automator] [deps: T025] [files: tests/e2e/search/price-filter.test.ts]
- [ ] T030 P2 US-003 E2E: Price validation prevents invalid range [agent: test-automator] [deps: T025] [files: tests/e2e/search/price-validation.test.ts]

### Story Progress: 3/8 (P1 Complete)

---

## User Story: US-004 Filter by Amenities (AND Logic)
> As a user, I want to filter campsites by amenities so that I can find sites with specific facilities I need, using AND logic.

### Acceptance Criteria
- [x] All 8 amenities displayed with icons
- [x] Multi-select checkboxes for amenities
- [x] AND logic: results have ALL selected amenities
- [x] Results update on checkbox change
- [x] Selected amenities persist in URL
- [x] Clear all amenities button works

### Tasks

#### Phase 1: Backend - Amenity Filtering
- [x] T031 P1 US-004 Update search service with amenity AND logic [agent: backend-architect] [deps: none] [files: apps/campsite-backend/src/services/searchService.ts]
- [ ] T032 P2 US-004 Unit test: Amenity AND logic filters correctly [agent: test-automator] [deps: T031] [files: apps/campsite-backend/__tests__/services/searchService.test.ts]
- [ ] T033 P2 US-004 Integration test: Search with multiple amenities [agent: test-automator] [deps: T031] [files: tests/integration/api/amenity-filter.test.ts]

#### Phase 2: Frontend - Amenities Filter
- [x] T034 P1 US-004 Create AmenitiesFilter component [agent: frontend-developer] [deps: none] [files: apps/campsite-frontend/src/components/search/AmenitiesFilter.tsx]
- [x] T035 P1 US-004 Create AmenityIcon component [agent: frontend-developer] [deps: none] [files: apps/campsite-frontend/src/components/ui/AmenityIcon.tsx]
- [ ] T036 P2 US-004 Unit test: AmenitiesFilter multi-select [agent: test-automator] [deps: T034] [files: apps/campsite-frontend/__tests__/components/AmenitiesFilter.test.tsx]
- [ ] T037 P2 US-004 Unit test: AmenityIcon renders correct icon [agent: test-automator] [deps: T035] [files: apps/campsite-frontend/__tests__/components/AmenityIcon.test.tsx]

#### Phase 3: E2E Amenity Filter Tests
- [ ] T038 P2 US-004 E2E: Amenity filter applies AND logic [agent: test-automator] [deps: T034] [files: tests/e2e/search/amenity-and-logic.test.ts]
- [ ] T039 P2 US-004 E2E: Multiple amenities filter correctly [agent: test-automator] [deps: T034] [files: tests/e2e/search/multi-amenity.test.ts]

### Story Progress: 3/9 (P1 Complete)

---

## User Story: Search Results & Integration
> As a user, I want to see search results in a grid with sorting, pagination, and filter synchronization so that I can easily browse campsites.

### Acceptance Criteria
- [x] Results display in responsive grid (3/2/1 columns)
- [x] Sort options work (rating, price, newest)
- [x] Pagination shows correct pages
- [x] All filters combine correctly
- [x] URL reflects complete search state
- [x] Loading states show skeleton screens
- [x] Empty results show helpful message
- [x] Filter sidebar responsive on mobile

### Tasks

#### Phase 1: Backend - Search Integration
- [x] T040 P1 SEARCH Create comprehensive search endpoint [agent: backend-architect] [deps: T003, T031] [files: apps/campsite-backend/src/routes/search.ts]
- [x] T041 P1 SEARCH Create search controller [agent: backend-architect] [deps: T040] [files: apps/campsite-backend/src/controllers/searchController.ts]
- [x] T042 P1 SEARCH Complete search service (all filters + sort) [agent: backend-architect] [deps: T041] [files: apps/campsite-backend/src/services/searchService.ts]
- [ ] T043 P2 SEARCH Unit test: Search combines all filters [agent: test-automator] [deps: T042] [files: apps/campsite-backend/__tests__/services/searchService-integration.test.ts]
- [ ] T044 P2 SEARCH Integration test: Search API with all params [agent: test-automator] [deps: T040] [files: tests/integration/api/search.test.ts]

#### Phase 2: Shared Schemas
- [x] T045 P1 SEARCH Create complete search query schema [agent: backend-architect] [deps: T006, T023] [files: packages/shared/src/schemas/search.ts]
- [x] T046 P1 SEARCH Create campsite card TypeScript types [agent: backend-architect] [deps: none] [files: packages/shared/src/types/campsite.ts]
- [ ] T047 P2 SEARCH Unit test: Search schema validates all params [agent: test-automator] [deps: T045] [files: packages/shared/__tests__/schemas/search.test.ts]

#### Phase 3: Frontend - Search Results
- [x] T048 P1 SEARCH Create CampsiteCard component [agent: frontend-developer] [deps: T046] [files: apps/campsite-frontend/src/components/search/CampsiteCard.tsx]
- [x] T049 P1 SEARCH Create SearchResults grid component [agent: frontend-developer] [deps: T048] [files: apps/campsite-frontend/src/components/search/SearchResults.tsx]
- [x] T050 P1 SEARCH Create Pagination component [agent: frontend-developer] [deps: none] [files: apps/campsite-frontend/src/components/search/Pagination.tsx]
- [x] T051 P1 SEARCH Create SortSelect component [agent: frontend-developer] [deps: none] [files: apps/campsite-frontend/src/components/search/SortSelect.tsx]
- [x] T052 P1 SEARCH Create FilterSidebar container [agent: frontend-developer] [deps: T017, T025, T034] [files: apps/campsite-frontend/src/components/search/FilterSidebar.tsx]
- [ ] T053 P2 SEARCH Unit test: CampsiteCard displays data correctly [agent: test-automator] [deps: T048] [files: apps/campsite-frontend/__tests__/components/CampsiteCard.test.tsx]
- [ ] T054 P2 SEARCH Unit test: Pagination calculates pages correctly [agent: test-automator] [deps: T050] [files: apps/campsite-frontend/__tests__/components/Pagination.test.tsx]

#### Phase 4: Frontend - Search Page
- [x] T055 P1 SEARCH Create useSearch hook with URL sync [agent: frontend-developer] [deps: T045] [files: apps/campsite-frontend/src/hooks/useSearch.ts]
- [x] T056 P1 SEARCH Create useCampsites data fetching hook [agent: frontend-developer] [deps: T045] [files: apps/campsite-frontend/src/hooks/useCampsites.ts]
- [x] T057 P1 SEARCH Create search page [agent: frontend-developer] [deps: T011, T052, T049] [files: apps/campsite-frontend/src/app/search/page.tsx]
- [x] T058 P1 SEARCH Create search loading skeleton [agent: frontend-developer] [deps: none] [files: apps/campsite-frontend/src/app/search/loading.tsx]
- [ ] T059 P2 SEARCH Unit test: useSearch syncs with URL [agent: test-automator] [deps: T055] [files: apps/campsite-frontend/__tests__/hooks/useSearch.test.ts]

#### Phase 5: E2E Comprehensive Tests
- [ ] T060 P2 SEARCH E2E: Complete search flow with all filters [agent: test-automator] [deps: T057] [files: tests/e2e/search/complete-search.test.ts]
- [ ] T061 P2 SEARCH E2E: Sort options change result order [agent: test-automator] [deps: T057] [files: tests/e2e/search/sorting.test.ts]
- [ ] T062 P2 SEARCH E2E: Pagination works correctly [agent: test-automator] [deps: T057] [files: tests/e2e/search/pagination.test.ts]
- [ ] T063 P2 SEARCH E2E: URL sharing loads same filters [agent: test-automator] [deps: T057] [files: tests/e2e/search/url-sharing.test.ts]
- [ ] T064 P2 SEARCH E2E: Mobile filter modal works [agent: test-automator] [deps: T057] [files: tests/e2e/search/mobile-filters.test.ts]
- [ ] T065 P2 SEARCH E2E: Empty results show message [agent: test-automator] [deps: T057] [files: tests/e2e/search/empty-results.test.ts]
- [ ] T066 P2 SEARCH Smoke test: Search page loads under 500ms [agent: test-automator] [deps: T057] [files: tests/e2e/search/performance.test.ts]

### Story Progress: 14/27 (P1 Complete)

---

## Progress Summary
- **Total P1 Tasks:** 31
- **Completed P1:** 31
- **Total P2 Tasks:** 31
- **Completed P2:** 0
- **Overall:** 31/62 (50%)
- **P1 Percentage:** 100%

**Last Updated:** 2026-01-17

---

## Implementation Notes

### Files Created

#### Backend
- `apps/campsite-backend/src/routes/provinces.ts` - Province API routes
- `apps/campsite-backend/src/controllers/provinceController.ts` - Province controller
- `apps/campsite-backend/src/services/provinceService.ts` - Province service with ILIKE search
- `apps/campsite-backend/src/routes/search.ts` - Search API routes
- `apps/campsite-backend/src/controllers/searchController.ts` - Search controller
- `apps/campsite-backend/src/services/searchService.ts` - Search service with all filters

#### Shared
- `packages/shared/src/schemas/province.ts` - Province autocomplete schema
- `packages/shared/src/schemas/price.ts` - Price range schema
- `packages/shared/src/schemas/search.ts` - Search query schema
- `packages/shared/src/types/province.ts` - Province types

#### Frontend Hooks
- `apps/campsite-frontend/src/hooks/useProvinceSearch.ts` - Province autocomplete hook
- `apps/campsite-frontend/src/hooks/usePriceRange.ts` - Price range hook
- `apps/campsite-frontend/src/hooks/useSearch.ts` - Search state with URL sync
- `apps/campsite-frontend/src/hooks/useCampsites.ts` - Data fetching hooks

#### Frontend Components
- `apps/campsite-frontend/src/components/search/ProvinceAutocomplete.tsx`
- `apps/campsite-frontend/src/components/search/SearchBar.tsx`
- `apps/campsite-frontend/src/components/search/TypeFilter.tsx`
- `apps/campsite-frontend/src/components/search/PriceFilter.tsx`
- `apps/campsite-frontend/src/components/search/AmenitiesFilter.tsx`
- `apps/campsite-frontend/src/components/search/CampsiteCard.tsx`
- `apps/campsite-frontend/src/components/search/SearchResults.tsx`
- `apps/campsite-frontend/src/components/search/Pagination.tsx`
- `apps/campsite-frontend/src/components/search/SortSelect.tsx`
- `apps/campsite-frontend/src/components/search/FilterSidebar.tsx`
- `apps/campsite-frontend/src/components/ui/TypeBadge.tsx`
- `apps/campsite-frontend/src/components/ui/AmenityIcon.tsx`

#### Frontend Pages
- `apps/campsite-frontend/src/app/search/page.tsx` - Search page
- `apps/campsite-frontend/src/app/search/loading.tsx` - Loading skeleton

### Key Features Implemented
1. Province autocomplete with Thai/English support and 300ms debounce
2. Multi-select type filter with colored badges
3. Dual-range price slider with quick presets
4. Amenity filter with AND logic and category grouping
5. Search results grid with responsive columns
6. Pagination with ellipsis for large page counts
7. URL state synchronization for shareable links
8. Mobile filter modal for responsive design
9. Skeleton loading states (Q17)
10. Empty results messaging with suggestions
