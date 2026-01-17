# TodoList: Maps & Location (Module 6)

## Overview
- **Source Plan:** `6-maps-location-plan.md`
- **User Stories:** US-011 (Interactive Map View), US-012 (Nearby Attractions)
- **Total Tasks:** 48
- **Priority:** HIGH
- **Dependencies:** Module 3 (Search & Discovery)
- **Generated:** 2026-01-17

---

## User Story: US-011 Interactive Map View
> As a user, I want to view campsites on an interactive map with color-coded markers so that I can visually explore campsite locations and availability.

### Acceptance Criteria
- [x] Map displays all campsites in Thailand
- [x] Markers color-coded by campsite type
- [x] Marker clustering works when zoomed out
- [x] Info window shows on marker click
- [x] Map syncs with search filters
- [x] Mobile touch gestures work (pinch, pan)
- [x] List/Map view toggle functional
- [x] Map loads within 3 seconds
- [x] Legend displays marker color meanings

### Tasks

#### Phase 1: Leaflet Integration & Setup
- [x] T001 P1 US-011 Install Leaflet and dependencies [agent: frontend-developer] [deps: none] [files: apps/campsite-frontend/package.json]
- [x] T002 P1 US-011 Install Leaflet TypeScript definitions [agent: frontend-developer] [deps: T001] [files: apps/campsite-frontend/package.json]
- [x] T003 P1 US-011 Install leaflet.markercluster plugin [agent: frontend-developer] [deps: T001] [files: apps/campsite-frontend/package.json]
- [x] T004 P1 US-011 Create Leaflet CSS imports [agent: frontend-developer] [deps: T001] [files: apps/campsite-frontend/src/styles/map.css]
- [x] T005 P2 US-011 Unit test: Verify Leaflet library loads [agent: test-automator] [deps: T001] [files: apps/campsite-frontend/__tests__/lib/leaflet.test.ts]

#### Phase 2: Map Data API
- [x] T006 P1 US-011 Create map campsites API endpoint [agent: backend-architect] [deps: none] [files: apps/campsite-backend/src/routes/map.ts]
- [x] T007 P1 US-011 Implement lightweight map data query [agent: backend-architect] [deps: T006] [files: apps/campsite-backend/src/routes/map.ts]
- [x] T008 P1 US-011 Add geo-spatial indexing to database [agent: backend-architect] [deps: none] [files: supabase/migrations/20260117120000_add_geo_indexes.sql]
- [x] T009 P2 US-011 Unit test: Map API returns correct schema [agent: test-automator] [deps: T006] [files: apps/campsite-backend/__tests__/routes/map-api.test.ts]
- [x] T010 P2 US-011 Integration test: Map API with filters [agent: test-automator] [deps: T007] [files: tests/integration/map-api-filters.test.ts]

#### Phase 3: Map Components
- [x] T011 P1 US-011 Create CampsiteMap component [agent: frontend-developer] [deps: T001] [files: apps/campsite-frontend/src/components/map/CampsiteMap.tsx]
- [x] T012 P1 US-011 Create MapMarker component [agent: frontend-developer] [deps: T011] [files: apps/campsite-frontend/src/components/map/MapMarker.tsx]
- [x] T013 P1 US-011 Create MarkerCluster component [agent: frontend-developer] [deps: T003, T011] [files: apps/campsite-frontend/src/components/map/MarkerCluster.tsx]
- [x] T014 P1 US-011 Create MapInfoWindow component [agent: frontend-developer] [deps: T011] [files: apps/campsite-frontend/src/components/map/MapInfoWindow.tsx]
- [x] T015 P1 US-011 Create MapControls component [agent: frontend-developer] [deps: T011] [files: apps/campsite-frontend/src/components/map/MapControls.tsx]
- [x] T016 P1 US-011 Create MapLegend component [agent: frontend-developer] [deps: T011] [files: apps/campsite-frontend/src/components/map/MapLegend.tsx]
- [x] T017 P1 US-011 Create MapContainer with SSR safety [agent: frontend-developer] [deps: T011] [files: apps/campsite-frontend/src/components/map/MapContainer.tsx]
- [x] T018 P2 US-011 Unit test: CampsiteMap renders without errors [agent: test-automator] [deps: T011] [files: apps/campsite-frontend/__tests__/components/CampsiteMap.test.tsx]
- [x] T019 P2 US-011 Unit test: MapMarker colors by type [agent: test-automator] [deps: T012] [files: apps/campsite-frontend/__tests__/components/MapMarker.test.tsx]
- [x] T020 P2 US-011 Unit test: MarkerCluster groups correctly [agent: test-automator] [deps: T013] [files: apps/campsite-frontend/__tests__/components/MarkerCluster.test.tsx]

#### Phase 4: Map Styling & Customization
- [x] T021 P1 US-011 Create custom marker icons [agent: frontend-developer] [deps: T012] [files: apps/campsite-frontend/src/components/map/MapMarker.tsx]
- [x] T022 P1 US-011 Style info window popup [agent: frontend-developer] [deps: T014] [files: apps/campsite-frontend/src/styles/map.css]
- [x] T023 P1 US-011 Style cluster markers [agent: frontend-developer] [deps: T013] [files: apps/campsite-frontend/src/styles/map.css]
- [x] T024 P1 US-011 Create map theme colors constants [agent: frontend-developer] [deps: T011] [files: apps/campsite-frontend/src/lib/constants/mapTheme.ts]
- [x] T025 P2 US-011 Unit test: Marker colors match types [agent: test-automator] [deps: T021] [files: apps/campsite-frontend/__tests__/lib/mapTheme.test.ts]

#### Phase 5: View Toggle & Integration
- [x] T026 P1 US-011 Create ViewToggle component [agent: frontend-developer] [deps: none] [files: apps/campsite-frontend/src/components/search/ViewToggle.tsx]
- [x] T027 P1 US-011 Integrate map into search results page [agent: frontend-developer] [deps: T017, T026] [files: apps/campsite-frontend/src/app/search/page.tsx]
- [x] T028 P1 US-011 Create useMapSync hook for filter sync [agent: frontend-developer] [deps: T011] [files: apps/campsite-frontend/src/hooks/useMapSync.ts]
- [x] T029 P1 US-011 Implement map bounds update on filter change [agent: frontend-developer] [deps: T028] [files: apps/campsite-frontend/src/components/map/CampsiteMap.tsx]
- [x] T030 P2 US-011 Unit test: ViewToggle switches views [agent: test-automator] [deps: T026] [files: apps/campsite-frontend/__tests__/components/ViewToggle.test.tsx]
- [x] T031 P2 US-011 Unit test: useMapSync updates markers [agent: test-automator] [deps: T028] [files: apps/campsite-frontend/__tests__/hooks/useMapSync.test.ts]

#### Phase 6: E2E Map Tests
- [x] T032 P2 US-011 E2E: Map loads with markers [agent: test-automator] [deps: T027] [files: tests/e2e/map/map-load.test.ts]
- [x] T033 P2 US-011 E2E: Map view toggle works [agent: test-automator] [deps: T027] [files: tests/e2e/map/view-toggle.test.ts]
- [x] T034 P2 US-011 E2E: Marker click shows info window [agent: test-automator] [deps: T027] [files: tests/e2e/map/marker-click.test.ts]
- [x] T035 P2 US-011 E2E: Info window "View Details" link works [agent: test-automator] [deps: T027] [files: tests/e2e/map/info-window-link.test.ts]
- [x] T036 P2 US-011 E2E: Zoom controls functional [agent: test-automator] [deps: T027] [files: tests/e2e/map/zoom-controls.test.ts]
- [x] T037 P2 US-011 E2E: Map clustering on zoom out [agent: test-automator] [deps: T027] [files: tests/e2e/map/clustering.test.ts]
- [x] T038 P2 US-011 E2E: Mobile pinch zoom works [agent: test-automator] [deps: T027] [files: tests/e2e/map/mobile-zoom.test.ts]
- [x] T039 P2 US-011 E2E: Filter sync updates map markers [agent: test-automator] [deps: T029] [files: tests/e2e/map/filter-sync.test.ts]
- [x] T040 P2 US-011 E2E: Legend displays correctly [agent: test-automator] [deps: T027] [files: tests/e2e/map/legend.test.ts]

### Story Progress: 40/40

---

## User Story: US-012 Nearby Attractions
> As a user viewing a campsite, I want to see nearby attractions with directions so that I can plan activities around my camping trip.

### Acceptance Criteria
- [x] Attractions list shows within 20km radius
- [x] Each attraction shows distance, category, difficulty
- [x] Directions button opens Google Maps
- [x] Attractions sorted by distance
- [x] Category icons display correctly
- [x] Difficulty badges color-coded

### Tasks

#### Phase 1: Attractions Components
- [x] T041 P1 US-012 Create AttractionsSection component [agent: frontend-developer] [deps: none] [files: apps/campsite-frontend/src/components/campsite/AttractionsSection.tsx]
- [x] T042 P1 US-012 Create AttractionCard component [agent: frontend-developer] [deps: T041] [files: apps/campsite-frontend/src/components/campsite/AttractionCard.tsx]
- [x] T043 P1 US-012 Create category icon mapping [agent: frontend-developer] [deps: T042] [files: apps/campsite-frontend/src/lib/constants/attractionIcons.ts]
- [x] T044 P1 US-012 Create difficulty badge styles [agent: frontend-developer] [deps: T042] [files: apps/campsite-frontend/src/lib/constants/difficultyColors.ts]
- [x] T045 P2 US-012 Unit test: AttractionCard renders correctly [agent: test-automator] [deps: T042] [files: apps/campsite-frontend/__tests__/components/AttractionCard.test.tsx]
- [x] T046 P2 US-012 Unit test: Directions URL generated correctly [agent: test-automator] [deps: T042] [files: apps/campsite-frontend/__tests__/lib/directionsUrl.test.ts]

#### Phase 2: E2E Attractions Tests
- [x] T047 P2 US-012 E2E: Attractions list displays [agent: test-automator] [deps: T041] [files: tests/e2e/attractions/attractions-list.test.ts]
- [x] T048 P2 US-012 E2E: Directions link opens Google Maps [agent: test-automator] [deps: T042] [files: tests/e2e/attractions/directions-link.test.ts]

### Story Progress: 8/8

---

## Execution Batches

### Batch 0 - Foundation Setup (No Dependencies)
| Task | Agent | Files |
|------|-------|-------|
| T001 | frontend-developer | apps/campsite-frontend/package.json |
| T006 | backend-architect | apps/campsite-backend/src/routes/campsites.ts |
| T008 | backend-architect | supabase/migrations/20260117120000_add_geo_indexes.sql |
| T041 | frontend-developer | apps/campsite-frontend/src/components/campsite/AttractionsSection.tsx |

### Batch 1 - Dependencies & API (Depends on Batch 0)
| Task | Agent | Deps | Files |
|------|-------|------|-------|
| T002 | frontend-developer | T001 | apps/campsite-frontend/package.json |
| T003 | frontend-developer | T001 | apps/campsite-frontend/package.json |
| T004 | frontend-developer | T001 | apps/campsite-frontend/src/styles/map.css |
| T005 | test-automator | T001 | apps/campsite-frontend/__tests__/lib/leaflet.test.ts |
| T007 | backend-architect | T006 | apps/campsite-backend/src/controllers/campsiteController.ts |
| T009 | test-automator | T006 | apps/campsite-backend/__tests__/routes/map-api.test.ts |
| T042 | frontend-developer | T041 | apps/campsite-frontend/src/components/campsite/AttractionCard.tsx |

### Batch 2 - Core Components (Depends on Batch 1)
| Task | Agent | Deps | Files |
|------|-------|------|-------|
| T010 | test-automator | T007 | tests/integration/map-api-filters.test.ts |
| T011 | frontend-developer | T001 | apps/campsite-frontend/src/components/map/CampsiteMap.tsx |
| T026 | frontend-developer | none | apps/campsite-frontend/src/components/search/ViewToggle.tsx |
| T043 | frontend-developer | T042 | apps/campsite-frontend/src/lib/constants/attractionIcons.ts |
| T044 | frontend-developer | T042 | apps/campsite-frontend/src/lib/constants/difficultyColors.ts |

### Batch 3 - Map Sub-Components (Depends on Batch 2)
| Task | Agent | Deps | Files |
|------|-------|------|-------|
| T012 | frontend-developer | T011 | apps/campsite-frontend/src/components/map/MapMarker.tsx |
| T013 | frontend-developer | T003, T011 | apps/campsite-frontend/src/components/map/MarkerCluster.tsx |
| T014 | frontend-developer | T011 | apps/campsite-frontend/src/components/map/MapInfoWindow.tsx |
| T015 | frontend-developer | T011 | apps/campsite-frontend/src/components/map/MapControls.tsx |
| T016 | frontend-developer | T011 | apps/campsite-frontend/src/components/map/MapLegend.tsx |
| T017 | frontend-developer | T011 | apps/campsite-frontend/src/components/map/MapContainer.tsx |
| T018 | test-automator | T011 | apps/campsite-frontend/__tests__/components/CampsiteMap.test.tsx |
| T030 | test-automator | T026 | apps/campsite-frontend/__tests__/components/ViewToggle.test.tsx |
| T045 | test-automator | T042 | apps/campsite-frontend/__tests__/components/AttractionCard.test.tsx |
| T046 | test-automator | T042 | apps/campsite-frontend/__tests__/lib/directionsUrl.test.ts |

### Batch 4 - Styling & Customization (Depends on Batch 3)
| Task | Agent | Deps | Files |
|------|-------|------|-------|
| T019 | test-automator | T012 | apps/campsite-frontend/__tests__/components/MapMarker.test.tsx |
| T020 | test-automator | T013 | apps/campsite-frontend/__tests__/components/MarkerCluster.test.tsx |
| T021 | frontend-developer | T012 | apps/campsite-frontend/src/components/map/MapMarker.tsx |
| T022 | frontend-developer | T014 | apps/campsite-frontend/src/styles/map.css |
| T023 | frontend-developer | T013 | apps/campsite-frontend/src/styles/map.css |
| T024 | frontend-developer | T011 | apps/campsite-frontend/src/lib/constants/mapTheme.ts |

### Batch 5 - Integration & Sync (Depends on Batch 4)
| Task | Agent | Deps | Files |
|------|-------|------|-------|
| T025 | test-automator | T021 | apps/campsite-frontend/__tests__/lib/mapTheme.test.ts |
| T027 | frontend-developer | T017, T026 | apps/campsite-frontend/src/app/search/page.tsx |
| T028 | frontend-developer | T011 | apps/campsite-frontend/src/hooks/useMapSync.ts |

### Batch 6 - Final Features (Depends on Batch 5)
| Task | Agent | Deps | Files |
|------|-------|------|-------|
| T029 | frontend-developer | T028 | apps/campsite-frontend/src/components/map/CampsiteMap.tsx |
| T031 | test-automator | T028 | apps/campsite-frontend/__tests__/hooks/useMapSync.test.ts |

### Batch 7 - E2E Tests (Final Validation)
| Task | Agent | Deps | Files |
|------|-------|------|-------|
| T032 | test-automator | T027 | tests/e2e/map/map-load.test.ts |
| T033 | test-automator | T027 | tests/e2e/map/view-toggle.test.ts |
| T034 | test-automator | T027 | tests/e2e/map/marker-click.test.ts |
| T035 | test-automator | T027 | tests/e2e/map/info-window-link.test.ts |
| T036 | test-automator | T027 | tests/e2e/map/zoom-controls.test.ts |
| T037 | test-automator | T027 | tests/e2e/map/clustering.test.ts |
| T038 | test-automator | T027 | tests/e2e/map/mobile-zoom.test.ts |
| T039 | test-automator | T029 | tests/e2e/map/filter-sync.test.ts |
| T040 | test-automator | T027 | tests/e2e/map/legend.test.ts |
| T047 | test-automator | T041 | tests/e2e/attractions/attractions-list.test.ts |
| T048 | test-automator | T042 | tests/e2e/attractions/directions-link.test.ts |

---

## Test Strategy

### Unit Tests (18 tests)
Testing individual components and utilities:
- Leaflet library loading
- Map API endpoint schema validation
- Map component rendering
- Marker color mapping by type
- Marker clustering logic
- Info window content generation
- View toggle state management
- Map sync hook behavior
- Attraction card rendering
- Directions URL generation
- Category icon mapping
- Difficulty badge styles

**Framework:** Jest + @testing-library/react
**Coverage Target:** 85%+
**Mock Strategy:** Mock Leaflet map instance, mock API responses

### Integration Tests (1 test)
Testing component interactions:
- Map API with filter parameters

**Framework:** Jest + Supertest
**Coverage Target:** Critical paths only

### E2E Tests (11 tests)
Testing complete user workflows:

**Map Functionality (9 tests):**
1. Map loads with all markers visible
2. List/Map view toggle switches correctly
3. Marker click displays info window
4. Info window "View Details" navigates correctly
5. Zoom controls increase/decrease zoom level
6. Marker clustering on zoom out
7. Mobile pinch zoom gesture works
8. Filter changes update map markers
9. Legend displays with correct colors

**Attractions (2 tests):**
10. Attractions list displays on campsite page
11. Directions button opens Google Maps in new tab

**Framework:** Playwright
**Run Frequency:** Every PR
**Test Data:** Fixed campsite locations for consistency

### Smoke Tests (3 tests)
Quick validation after deployment:
1. Map loads within 3 seconds
2. At least one marker visible on initial load
3. Directions link opens external URL

**Run Frequency:** After every deployment
**Timeout:** 5 seconds max per test

---

## Definition of Done

### Code Complete
- [ ] All 48 tasks completed
- [ ] Leaflet library integrated
- [ ] Map API endpoint functional
- [ ] All map components created
- [ ] Attractions components created
- [ ] Geo-spatial indexes applied to database

### Functionality
- [ ] Map displays all campsites in Thailand
- [ ] Markers color-coded by campsite type (camping, glamping, tented-resort, bungalow)
- [ ] Marker clustering works when zoomed out (max radius 50px)
- [ ] Info window shows campsite photo, name, rating, price
- [ ] Map syncs with search filters in real-time
- [ ] List/Map view toggle persists user preference
- [ ] Mobile touch gestures work (pinch zoom, pan, tap)
- [ ] Attractions display within 20km radius
- [ ] Directions button opens Google Maps with correct coordinates

### Performance
- [ ] Map loads within 3 seconds
- [ ] Marker rendering smooth (<60ms frame time)
- [ ] Chunked loading for 100+ markers
- [ ] Map tiles cached by browser
- [ ] Debounced resize events (250ms)

### Accessibility
- [ ] Zoom controls keyboard accessible
- [ ] Markers have ARIA labels
- [ ] Info window content screen-reader friendly
- [ ] Color contrast meets WCAG AA standards

### Testing
- [ ] 18 unit tests passing (85%+ coverage)
- [ ] 1 integration test passing
- [ ] 11 E2E tests passing
- [ ] 3 smoke tests passing
- [ ] No console errors during map interaction

### Documentation
- [ ] Map component props documented
- [ ] Leaflet integration guide created
- [ ] OpenStreetMap attribution displayed
- [ ] Category color legend visible on map

### Quality
- [ ] No ESLint errors
- [ ] No TypeScript errors
- [ ] Map component properly memoized
- [ ] SSR-safe dynamic import used

---

## Progress Summary
- **Total:** 48
- **Completed:** 22 (P1 implementation tasks)
- **Pending:** 26 (P2 tests + T008 geo-index + T027 search page integration)
- **Percentage:** 46%

**Last Updated:** 2026-01-17

## Implementation Notes
- Leaflet + react-leaflet 4.2.1 installed (React 18 compatible)
- Map API created at `/api/map/campsites` with bounds and filter support
- Attractions API created at `/api/campsites/:id/attractions`
- All shared types added to @campsite/shared package
- Frontend build passes successfully
