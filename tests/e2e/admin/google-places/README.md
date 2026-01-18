# Google Places Admin Dashboard - E2E Test Suite

## Overview
Comprehensive Playwright E2E tests for the Google Places integration admin dashboard in the Campsite project. Tests cover all admin functionalities for managing Google Places API data ingestion, sync operations, and campsite candidate approval.

## Test Files

### T032-01: Overview Dashboard (`overview-dashboard.test.ts`)
Tests the main Google Places integration dashboard with statistics, quick actions, and navigation.

**Coverage:**
- Page access control (admin-only)
- Statistics cards (Pending Candidates, Sync Status, Raw Places, Imported Campsites)
- Quick action cards (Manual Sync, AI Processing, Configuration)
- Quick links navigation (Sync Management, Import Candidates)
- Responsive layout (desktop, tablet, mobile)
- Loading states with skeleton screens
- Error handling for API failures

**Test Count:** ~50 tests

### T032-02: Sync Management (`sync-management.test.ts`)
Tests the sync management page for viewing history, triggering syncs, and monitoring operations.

**Coverage:**
- Page access control
- Sync history table with log details
- Manual sync trigger with confirmation
- Current sync status monitoring
- Sync cancellation workflow
- Sync log error display
- Date range filtering (planned)
- Pagination (planned)
- Loading and error states

**Test Count:** ~45 tests

### T032-03: Candidate Review (`candidate-review.test.ts`)
Tests the candidate list page for reviewing and managing import candidates.

**Coverage:**
- Page access control
- Candidates list/table display
- Filter by status (pending, approved, imported)
- Filter by duplicate flag
- Sorting by confidence score (planned)
- Candidate card information display
- View candidate details navigation
- Approve candidate workflow
- Reject candidate with reason
- Bulk actions (planned)
- Pagination (planned)
- Empty state handling

**Test Count:** ~40 tests

### T032-04: Candidate Detail (`candidate-detail.test.ts`)
Tests the detailed view of individual candidates with full place data.

**Coverage:**
- Page access control
- Complete place data display (name, address, coordinates, types)
- Photo gallery display
- Google reviews display
- AI classification results
- Detected amenities and activities
- Confidence breakdown
- Duplicate warning and comparison
- Approve from detail view
- Reject from detail view
- Navigation back to list
- Loading and error states

**Test Count:** ~35 tests

### T032-05: Error States (`error-states.test.ts`)
Tests comprehensive error handling and edge cases across all pages.

**Coverage:**
- API error states (500, 400, 404, 429, 403)
- Empty data states with appropriate messages
- Loading states with skeleton screens
- Network error handling (timeout, connection failed)
- Validation errors (invalid IDs, missing data)
- Permission errors (non-admin access)
- Error recovery workflows
- User-friendly error messages

**Test Count:** ~30 tests

## Running Tests

### Run All Google Places Tests
```bash
npx playwright test tests/e2e/admin/google-places/
```

### Run Specific Test File
```bash
npx playwright test tests/e2e/admin/google-places/overview-dashboard.test.ts
npx playwright test tests/e2e/admin/google-places/sync-management.test.ts
npx playwright test tests/e2e/admin/google-places/candidate-review.test.ts
npx playwright test tests/e2e/admin/google-places/candidate-detail.test.ts
npx playwright test tests/e2e/admin/google-places/error-states.test.ts
```

### Run Tests in UI Mode (Interactive)
```bash
npx playwright test --ui tests/e2e/admin/google-places/
```

### Run Tests in Debug Mode
```bash
npx playwright test --debug tests/e2e/admin/google-places/overview-dashboard.test.ts
```

### Run Tests with Specific Browser
```bash
npx playwright test --project=chromium tests/e2e/admin/google-places/
npx playwright test --project=firefox tests/e2e/admin/google-places/
npx playwright test --project=webkit tests/e2e/admin/google-places/
```

## Test Structure

All tests follow a consistent structure:

1. **Authentication Helpers**: Mock admin and non-admin login
2. **Data Mocking Helpers**: Mock API responses with customizable data
3. **Test Suites**: Organized by feature/functionality
4. **Assertions**: Use Playwright's expect with clear, descriptive matchers
5. **Error Handling**: Comprehensive dialog and error state testing

## Mock Data Patterns

### Authentication
```typescript
mockAdminLogin(page)  // Admin with full access
mockUserLogin(page)   // Regular user (should be denied)
mockOwnerLogin(page)  // Owner role (should be denied)
```

### API Responses
```typescript
mockCandidates(page, [])           // Empty list
mockCandidates(page, customArray)  // Custom data
mockSyncLogs(page, logsArray)      // Sync history
mockSyncStatus(page, currentSync)  // Active sync
```

## Key Testing Patterns

### 1. Access Control
All pages test admin-only access with redirects for unauthorized users.

### 2. Loading States
Tests verify skeleton screens appear during data fetching.

### 3. Error Handling
Comprehensive error scenarios with user-friendly messages and recovery.

### 4. User Workflows
Complete user journeys from navigation to action completion.

### 5. Responsive Design
Tests verify layout adaptation across viewport sizes.

## Test Data Examples

### Candidate
```typescript
{
  id: 'candidate-1',
  name: 'Mountain View Campsite',
  address: '123 Mountain Rd, Chiang Mai, Thailand',
  confidence_score: 0.95,
  is_duplicate: false,
  rating: 4.5,
  rating_count: 120,
  status: 'pending',
  google_place_id: 'ChIJ123',
}
```

### Sync Log
```typescript
{
  id: 'log-1',
  started_at: '2026-01-18T08:00:00Z',
  status: 'completed',
  duration_seconds: 1800,
  places_found: 150,
  places_updated: 145,
  api_requests_made: 200,
  estimated_cost_usd: 0.75,
}
```

## Future Enhancements

1. **Pagination Tests**: Add comprehensive pagination testing
2. **Date Range Filters**: Test sync log filtering by date
3. **Sorting Tests**: Add confidence score sorting
4. **Bulk Actions**: Test bulk approve/reject operations
5. **Visual Regression**: Add screenshot comparison tests
6. **Performance Tests**: Measure page load and interaction times
7. **Accessibility Tests**: Add a11y compliance checks
8. **Mobile Gestures**: Add touch/swipe interaction tests

## Notes

- Tests use route mocking instead of real API calls for reliability
- Authentication is mocked to avoid session management complexity
- Dialog interactions (confirm, prompt, alert) are fully tested
- All tests are independent and can run in parallel
- Tests follow the AAA pattern (Arrange, Act, Assert)

## Related Documentation

- **Frontend Pages**: `apps/campsite-frontend/src/app/admin/google-places/`
- **Backend APIs**: `apps/campsite-backend/src/routes/admin/google-places/`
- **Requirements**: `requirements/SRS-Camping.md` (Module 10)
- **Master Plan**: `plans/00-master-todolist.md`

## Total Test Count

**~200 comprehensive E2E tests** covering all critical paths, error scenarios, and edge cases for the Google Places Admin Dashboard.
