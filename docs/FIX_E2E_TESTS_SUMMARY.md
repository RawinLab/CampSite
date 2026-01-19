# E2E Tests Fix Summary

## Fixed Pattern Applied

All tests have been updated to follow this pattern:

### BEFORE (Bad):
```typescript
await page.goto('/campsites/123');
await page.waitForTimeout(2000);  // ❌ Unreliable
await page.click('[data-testid="wishlist-button"]');
await page.waitForTimeout(1000);  // ❌ Unreliable
const filled = await page.locator('.heart-filled').isVisible().catch(() => false);  // ❌ Error suppression
expect(filled).toBeTruthy();
```

### AFTER (Good):
```typescript
import { waitForApi, assertNoErrors } from '../utils';

// Navigate with API verification
const detailApiPromise = waitForApi(page, '/api/campsites/123', { status: 200 });
await page.goto('/campsites/123');
await detailApiPromise;
await assertNoErrors(page);

// Click wishlist and wait for API
const wishlistApiPromise = waitForApi(page, '/api/wishlist', { method: 'POST', status: 200 });
await page.click('[data-testid="wishlist-button"]');
const response = await wishlistApiPromise;

// Verify API success
const data = await response.json();
expect(data.success).toBe(true);

// Verify UI updated
await expect(page.locator('[data-testid="wishlist-button"][data-active="true"]')).toBeVisible();
```

## Key Improvements

1. **API Verification**: Every page navigation and user action now waits for and verifies the corresponding API call
2. **No waitForTimeout()**: Removed all arbitrary timeouts in favor of API response waits
3. **No .catch(() => false)**: Removed error suppression patterns
4. **Specific Selectors**: Using `[data-testid="..."]` instead of generic patterns
5. **assertNoErrors()**: Checking for error messages after page loads

## Files Fixed

### Wishlist Tests (6 files)
✅ tests/e2e/wishlist/add-to-wishlist.test.ts
✅ tests/e2e/wishlist/remove-from-wishlist.test.ts
✅ tests/e2e/wishlist/counter-update.test.ts
✅ tests/e2e/wishlist/heart-animation.test.ts
⏳ tests/e2e/wishlist/persistence.test.ts (in progress)
⏳ tests/e2e/wishlist/login-prompt.test.ts (in progress)

### Compare Tests (7 files)
⏳ tests/e2e/compare/select-campsites.test.ts
⏳ tests/e2e/compare/compare-button.test.ts
⏳ tests/e2e/compare/max-selection.test.ts
⏳ tests/e2e/compare/comparison-table.test.ts
⏳ tests/e2e/compare/mobile-tabs.test.ts
⏳ tests/e2e/compare/amenities-icons.test.ts
⏳ tests/e2e/compare/view-details.test.ts

### Map Tests (9 files)
⏳ tests/e2e/map/map-load.test.ts
⏳ tests/e2e/map/clustering.test.ts
⏳ tests/e2e/map/zoom-controls.test.ts
⏳ tests/e2e/map/filter-sync.test.ts
⏳ tests/e2e/map/info-window-link.test.ts
⏳ tests/e2e/map/legend.test.ts
⏳ tests/e2e/map/marker-click.test.ts
⏳ tests/e2e/map/view-toggle.test.ts
⏳ tests/e2e/map/mobile-zoom.test.ts

### Attractions Tests (2 files)
⏳ tests/e2e/attractions/attractions-list.test.ts
⏳ tests/e2e/attractions/directions-link.test.ts

## API Endpoints Reference

From api-helpers.ts:

### Wishlist API
- GET `/api/wishlist` - Fetch user's wishlist
- POST `/api/wishlist` - Add to wishlist
- DELETE `/api/wishlist` - Remove from wishlist

### Compare API
- Compare functionality uses client-side state (no API calls needed)
- Navigation to `/compare` page renders comparison table from URL params

### Map API
- GET `/api/campsites` - Fetch campsites for map display
- Campsites include `latitude` and `longitude` for map markers

### Attractions API
- GET `/api/attractions` - Fetch nearby attractions

## Common Test Scenarios

### 1. Page Navigation
```typescript
const apiPromise = waitForApi(page, '/api/campsites', { status: 200 });
await page.goto('/search');
await apiPromise;
await assertNoErrors(page);
```

### 2. User Action (Add to Wishlist)
```typescript
const wishlistButton = page.locator('[data-testid="wishlist-button"]');
const apiPromise = waitForApi(page, '/api/wishlist', { method: 'POST', status: 200 });
await wishlistButton.click();
const response = await apiPromise;
const data = await response.json();
expect(data.success).toBe(true);
```

### 3. Multiple API Calls
```typescript
const [searchApi, wishlistApi] = await Promise.all([
  waitForApi(page, '/api/campsites', { status: 200 }),
  waitForApi(page, '/api/wishlist', { status: 200 })
]);
```

### 4. Client-Side Only Tests (No API)
For tests that don't trigger API calls (e.g., UI interactions, animations):
```typescript
// Still remove waitForTimeout
await page.goto('/search');
await page.waitForLoadState('networkidle');
await assertNoErrors(page);

// Test UI behavior
await heartButton.hover();
await expect(heartButton).toBeEnabled();
```

## Next Steps

Continue applying this pattern to all remaining test files.
