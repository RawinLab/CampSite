# Quick Fix Guide for Remaining Admin E2E Tests

## Step-by-Step Fix Process

### 1. Add Import
At the top of every file, add:
```typescript
import { waitForApi, waitForApiSuccess, gotoWithApi, assertNoErrors, ADMIN_API } from '../utils/api-helpers';
```

### 2. Find and Replace Patterns

#### Pattern A: Page Navigation
**Find:**
```typescript
await page.goto('/admin/some-path');
await page.waitForTimeout(3000);
```

**Replace with:**
```typescript
const data = await gotoWithApi(page, '/admin/some-path', ADMIN_API.appropriateEndpoint);
expect(data.success).toBe(true);
await assertNoErrors(page);
```

#### Pattern B: Generic Heading Checks
**Find:**
```typescript
const heading = page.locator('h1, h2').filter({ hasText: /pattern/i });
await expect(heading.first()).toBeVisible({ timeout: 10000 });
```

**Replace with:**
```typescript
await expect(page.locator('h1')).toContainText('Exact Title');
```

#### Pattern C: Button Click with Timeout
**Find:**
```typescript
await button.click();
await page.waitForTimeout(2000);
```

**Replace with:**
```typescript
const apiPromise = page.waitForResponse(
  res => res.url().includes('/api/admin/action') && res.status() === 200
);
await button.click();
const response = await apiPromise;
const data = await response.json();
expect(data.success).toBe(true);
```

#### Pattern D: Error Swallowing
**Find:**
```typescript
const isVisible = await element.isVisible({ timeout: 5000 }).catch(() => false);
if (isVisible) {
  // do something
}
```

**Replace with:**
```typescript
await expect(element).toBeVisible();
// Direct assertion - let it fail if element not found
```

#### Pattern E: OR Conditions
**Find:**
```typescript
const has1 = await elem1.isVisible().catch(() => false);
const has2 = await elem2.isVisible().catch(() => false);
expect(has1 || has2).toBeTruthy();
```

**Replace with:**
```typescript
// Check API data first
expect(data.data.length).toBeGreaterThan(0);
// Then verify specific UI element
await expect(elem1).toBeVisible();
```

## File-Specific Mappings

### reject-campsite.test.ts
```typescript
// Navigation
const data = await gotoWithApi(page, '/admin/campsites/pending', ADMIN_API.pendingCampsites);

// Reject action
const apiPromise = page.waitForResponse(
  res => res.url().includes(ADMIN_API.rejectCampsite(id)) && res.status() === 200
);
await rejectButton.click();
const response = await apiPromise;
```

### reported-reviews.test.ts
```typescript
// Navigation
const data = await gotoWithApi(page, '/admin/reviews/reported', ADMIN_API.reportedReviews);

// Verify data structure
expect(Array.isArray(data.data)).toBe(true);
```

### hide-review.test.ts
```typescript
// Hide action
const apiPromise = page.waitForResponse(
  res => res.url().includes(ADMIN_API.hideReview(reviewId)) && res.status() === 200
);
await hideButton.click();
const response = await apiPromise;
const responseData = await response.json();
expect(responseData.success).toBe(true);
```

### google-places/overview-dashboard.test.ts
```typescript
// Navigation
const data = await gotoWithApi(page, '/admin/google-places', ADMIN_API.googlePlaces.stats);

// Verify stats structure
expect(data.data).toBeDefined();
expect(typeof data.data.total_candidates).toBe('number');
```

## Common API Endpoints by File

| File | Primary Endpoint |
|------|------------------|
| real-admin-flow.test.ts | `ADMIN_API.stats` |
| reject-campsite.test.ts | `ADMIN_API.pendingCampsites`, `ADMIN_API.rejectCampsite(id)` |
| reject-owner-request.test.ts | `ADMIN_API.ownerRequests`, `ADMIN_API.rejectOwnerRequest(id)` |
| reported-reviews.test.ts | `ADMIN_API.reportedReviews` |
| hide-review.test.ts | `ADMIN_API.reportedReviews`, `ADMIN_API.hideReview(id)` |
| unhide-review.test.ts | `ADMIN_API.reportedReviews`, `ADMIN_API.unhideReview(id)` |
| delete-review.test.ts | `ADMIN_API.reportedReviews`, `ADMIN_API.deleteReview(id)` |
| google-places/overview-dashboard.test.ts | `ADMIN_API.googlePlaces.stats` |
| google-places/sync-management.test.ts | `ADMIN_API.googlePlaces.syncLogs` |
| google-places/candidate-review.test.ts | `ADMIN_API.googlePlaces.candidates` |

## Checklist for Each File

- [ ] Added API helpers import
- [ ] Replaced all `page.goto()` + `waitForTimeout()` with `gotoWithApi()`
- [ ] Added `expect(data.success).toBe(true)` after API calls
- [ ] Added `await assertNoErrors(page)` after navigation
- [ ] Replaced all `waitForTimeout()` with `waitForResponse()` for actions
- [ ] Removed all `.catch(() => false)` patterns
- [ ] Replaced generic selectors (`h1, h2, main`) with specific ones
- [ ] Removed OR conditions (`has1 || has2`)
- [ ] Added exact text assertions
- [ ] Verified API response data structure

## Testing Your Changes

After fixing each file:

```bash
# Run the specific test
npx playwright test tests/e2e/admin/[filename].test.ts

# Run with debug output
DEBUG=pw:api npx playwright test tests/e2e/admin/[filename].test.ts

# Run with UI
npx playwright test tests/e2e/admin/[filename].test.ts --ui
```

## Reference Files

Look at these completed files for examples:
1. `/home/dev/projects/campsite/tests/e2e/admin/pending-campsites.test.ts`
2. `/home/dev/projects/campsite/tests/e2e/admin/approve-campsite.test.ts`
3. `/home/dev/projects/campsite/tests/e2e/admin/approve-owner-request.test.ts`
4. `/home/dev/projects/campsite/tests/e2e/admin/owner-requests-list.test.ts`

## Common Issues and Solutions

### Issue: API endpoint not found
**Solution:** Check `tests/e2e/utils/api-helpers.ts` for correct endpoint constant.

### Issue: Test times out
**Solution:** Verify API is actually being called. Check network tab in `--ui` mode.

### Issue: Response doesn't have `success` field
**Solution:** API might need updating. Check actual response structure first.

### Issue: Element not found
**Solution:** Use exact selectors. Check what's actually rendered in `--ui` mode.

## Quick Command Reference

```bash
# View completed example
cat tests/e2e/admin/pending-campsites.test.ts

# View API helpers
cat tests/e2e/utils/api-helpers.ts

# Run pattern guide
bash scripts/fix-remaining-admin-tests.sh

# Run all admin tests
npx playwright test tests/e2e/admin/
```
