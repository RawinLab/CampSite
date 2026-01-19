# Complete E2E Test Fix Guide

## Summary of Progress

### ✅ COMPLETED (7/24 files)
1. tests/e2e/wishlist/add-to-wishlist.test.ts
2. tests/e2e/wishlist/remove-from-wishlist.test.ts
3. tests/e2e/wishlist/counter-update.test.ts
4. tests/e2e/wishlist/heart-animation.test.ts
5. tests/e2e/wishlist/persistence.test.ts
6. tests/e2e/wishlist/login-prompt.test.ts
7. tests/e2e/compare/select-campsites.test.ts

### ⏳ REMAINING (17/24 files)

#### Compare Tests (6 remaining)
- tests/e2e/compare/compare-button.test.ts
- tests/e2e/compare/max-selection.test.ts
- tests/e2e/compare/comparison-table.test.ts
- tests/e2e/compare/mobile-tabs.test.ts
- tests/e2e/compare/amenities-icons.test.ts
- tests/e2e/compare/view-details.test.ts

#### Map Tests (9 remaining)
- tests/e2e/map/map-load.test.ts
- tests/e2e/map/clustering.test.ts
- tests/e2e/map/zoom-controls.test.ts
- tests/e2e/map/filter-sync.test.ts
- tests/e2e/map/info-window-link.test.ts
- tests/e2e/map/legend.test.ts
- tests/e2e/map/marker-click.test.ts
- tests/e2e/map/view-toggle.test.ts
- tests/e2e/map/mobile-zoom.test.ts (if exists)

#### Attractions Tests (2 remaining)
- tests/e2e/attractions/attractions-list.test.ts
- tests/e2e/attractions/directions-link.test.ts

## Fix Pattern Templates

### For Compare Tests (Client-Side State)

Compare tests are mostly UI state management (no API calls for checkbox selection).
Only navigation needs API verification.

```typescript
import { test, expect } from '@playwright/test';
import { loginAsUser, waitForApi, assertNoErrors } from '../utils';

test.describe('Compare Feature Test', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
    const wishlistApiPromise = waitForApi(page, '/api/wishlist', { method: 'GET', status: 200 });
    await page.goto('/wishlist');
    await wishlistApiPromise;
    await assertNoErrors(page);
  });

  test('Test name', async ({ page }) => {
    // UI interactions (no API needed)
    const checkbox = page.locator('[data-testid="compare-checkbox"]').first();
    await checkbox.click();
    
    // Assertions
    await expect(checkbox).toBeChecked();
    
    // Navigation to compare page (needs API for page load)
    const compareButton = page.locator('[data-testid="compare-btn"]');
    await compareButton.click();
    await page.waitForURL('**/compare**');
    await page.waitForLoadState('networkidle');
    await assertNoErrors(page);
  });
});
```

### For Map Tests (Campsite API)

Map tests load campsites and display them on map. Use `/api/campsites` API.

```typescript
import { test, expect } from '@playwright/test';
import { waitForApi, assertNoErrors } from '../utils';

test.describe('Map Feature Test', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to search page with map view
    const campsitesApiPromise = waitForApi(page, '/api/campsites', { status: 200 });
    await page.goto('/search');
    await campsitesApiPromise;
    await assertNoErrors(page);
  });

  test('Test name', async ({ page }) => {
    // Switch to map view (if needed)
    const mapViewButton = page.locator('[data-testid="map-view-toggle"]');
    await mapViewButton.click();
    
    // Wait for map to load
    const map = page.locator('[data-testid="map-container"]');
    await expect(map).toBeVisible();
    
    // Interact with map elements
    const marker = page.locator('[data-testid="map-marker"]').first();
    await marker.click();
    
    // Verify info window
    const infoWindow = page.locator('[data-testid="map-info-window"]');
    await expect(infoWindow).toBeVisible();
  });
});
```

### For Attractions Tests (Attractions API)

Attractions tests load nearby attractions. Use `/api/attractions` API.

```typescript
import { test, expect } from '@playwright/test';
import { waitForApi, assertNoErrors } from '../utils';

test.describe('Attractions Feature Test', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to campsite detail page
    const detailApiPromise = waitForApi(page, '/api/campsites/', { status: 200 });
    await page.goto('/campsites/e2e-test-campsite-approved-1');
    await detailApiPromise;
    await assertNoErrors(page);
  });

  test('Test name', async ({ page }) => {
    // Wait for attractions API
    const attractionsApiPromise = waitForApi(page, '/api/attractions', { status: 200 });
    
    // Trigger attractions display (if needed - might auto-load)
    const attractionsSection = page.locator('[data-testid="attractions-section"]');
    await attractionsSection.scrollIntoViewIfNeeded();
    
    const attractionsResponse = await attractionsApiPromise;
    const data = await attractionsResponse.json();
    expect(data.success).toBe(true);
    
    // Verify attractions display
    const attractionItems = page.locator('[data-testid="attraction-item"]');
    await expect(attractionItems.first()).toBeVisible();
  });
});
```

## Key Principles

### 1. Always wait for API responses
```typescript
// BEFORE (bad)
await page.goto('/search');
await page.waitForTimeout(2000); // ❌

// AFTER (good)
const apiPromise = waitForApi(page, '/api/campsites', { status: 200 });
await page.goto('/search');
await apiPromise; // ✅
await assertNoErrors(page);
```

### 2. Verify API success in responses
```typescript
// For actions that trigger APIs
const wishlistApiPromise = waitForApi(page, '/api/wishlist', { method: 'POST', status: 200 });
await wishlistButton.click();
const response = await wishlistApiPromise;

const data = await response.json();
expect(data.success).toBe(true); // ✅
```

### 3. Use specific test IDs
```typescript
// BEFORE (bad)
const button = page.locator('button').first(); // ❌
const button = page.locator('button:has(svg)'); // ❌

// AFTER (good)
const button = page.locator('[data-testid="wishlist-button"]'); // ✅
```

### 4. No error suppression
```typescript
// BEFORE (bad)
const isVisible = await element.isVisible().catch(() => false); // ❌

// AFTER (good)
await expect(element).toBeVisible(); // ✅
// OR
const isVisible = await element.isVisible(); // ✅ (let it throw if fails)
```

### 5. Replace all waitForTimeout
```typescript
// BEFORE (bad)
await page.waitForTimeout(1000); // ❌

// AFTER (good for API-triggered actions)
await apiPromise; // ✅

// AFTER (good for UI state)
await page.waitForLoadState('networkidle'); // ✅

// AFTER (good for element visibility)
await expect(element).toBeVisible(); // ✅
```

## Testing API Endpoints

From the backend, these are the relevant APIs:

### Public APIs
- `GET /api/campsites` - Search/list campsites
- `GET /api/campsites/:id` - Campsite detail
- `GET /api/attractions` - Nearby attractions
- `GET /api/provinces` - Province list
- `GET /api/amenities` - Amenity list

### Authenticated APIs
- `GET /api/wishlist` - Get user's wishlist
- `POST /api/wishlist` - Add to wishlist
- `DELETE /api/wishlist` - Remove from wishlist

### Notes
- Compare functionality is CLIENT-SIDE only (no API)
- Map view uses same `/api/campsites` endpoint
- Attractions might be embedded in campsite detail response

## Next Steps

Apply the templates above to fix remaining 17 files:
1. Compare tests (6 files) - mostly UI, minimal API
2. Map tests (9 files) - uses `/api/campsites`  
3. Attractions tests (2 files) - uses `/api/attractions`

All patterns are documented and working examples are in the completed wishlist tests.
