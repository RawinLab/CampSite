# Admin E2E Test Fixes - Summary

## Overview
Fixed admin E2E tests to properly verify API calls instead of just checking UI elements.

## Files Fixed (3/19 completed)

### ✅ Completed Files

1. **pending-campsites.test.ts** - Fully refactored
   - Added proper API verification with `gotoWithApi()`
   - Removed all `waitForTimeout()` calls
   - Removed `.catch(() => false)` patterns
   - Added `assertNoErrors()` checks
   - Added exact assertions for API responses
   - All approve/reject actions now wait for and verify API responses

2. **approve-campsite.test.ts** - Fully refactored
   - Proper API verification for approval flow
   - Database verification after approval
   - Removed loose OR conditions
   - Added specific API response checks
   - Multi-approval flow properly verified

3. **approve-owner-request.test.ts** - Fully refactored
   - API verification for owner request approval
   - Proper error handling without .catch() swallowing
   - List update verification via API refetch
   - Navigation tracking without full page reload

## Key Improvements Applied

### 1. Proper API Waiting
**Before:**
```typescript
await page.goto('/admin/campsites/pending');
await page.waitForTimeout(3000);
```

**After:**
```typescript
const data = await gotoWithApi(page, '/admin/campsites/pending', ADMIN_API.pendingCampsites);
expect(data.success).toBe(true);
await assertNoErrors(page);
```

### 2. Action Button API Verification
**Before:**
```typescript
await approveButton.click();
await page.waitForTimeout(2000);
const feedback = page.locator('text=/approved|success/i');
const hasFeedback = await feedback.first().isVisible({ timeout: 5000 }).catch(() => false);
expect(hasFeedback).toBeTruthy();
```

**After:**
```typescript
const apiPromise = page.waitForResponse(
  res => res.url().includes('/approve') && res.status() === 200
);

await approveButton.click();

const response = await apiPromise;
const responseData = await response.json();
expect(responseData.success).toBe(true);
await expect(page.locator('text=/approved|success/i')).toBeVisible();
```

### 3. Exact Assertions
**Before:**
```typescript
const heading = page.locator('h1, h2').filter({ hasText: /pending|campsites/i });
await expect(heading.first()).toBeVisible({ timeout: 10000 });
```

**After:**
```typescript
await expect(page.locator('h1')).toContainText('Pending Campsites');
```

### 4. No Error Swallowing
**Before:**
```typescript
const hasButton = await approveButton.isVisible({ timeout: 5000 }).catch(() => false);
if (hasButton) {
  // test logic
}
```

**After:**
```typescript
await expect(approveButton).toBeVisible();
// Direct assertion - fails fast if element not found
```

## Remaining Files (16)

These files still need the same pattern applied:

1. real-admin-flow.test.ts
2. reject-campsite.test.ts
3. owner-requests-list.test.ts
4. reject-owner-request.test.ts
5. reported-reviews.test.ts
6. hide-review.test.ts
7. unhide-review.test.ts
8. delete-review.test.ts
9. approval-notification.test.ts
10. hidden-review-public.test.ts
11. owner-role-upgrade.test.ts
12. google-places/overview-dashboard.test.ts
13. google-places/sync-management.test.ts
14. google-places/candidate-review.test.ts
15. google-places/candidate-detail.test.ts
16. google-places/error-states.test.ts

## Fix Pattern Template

For each remaining file:

1. **Add imports:**
```typescript
import { waitForApi, waitForApiSuccess, gotoWithApi, assertNoErrors, ADMIN_API } from '../utils/api-helpers';
```

2. **Replace navigation:**
```typescript
// Old: await page.goto('/admin/path'); await page.waitForTimeout(3000);
// New:
const data = await gotoWithApi(page, '/admin/path', ADMIN_API.endpoint);
expect(data.success).toBe(true);
await assertNoErrors(page);
```

3. **Add action verification:**
```typescript
const apiPromise = page.waitForResponse(
  res => res.url().includes('/api/admin/action') && res.status() === 200
);
await button.click();
const response = await apiPromise;
const responseData = await response.json();
expect(responseData.success).toBe(true);
```

4. **Remove all:**
   - `.catch(() => false)` patterns
   - `waitForTimeout()` calls
   - Generic locators like `h1, h2, main`
   - OR conditions in assertions

5. **Add specific checks:**
   - Exact text matches in headings
   - API data structure verification
   - `assertNoErrors()` after navigation

## API Endpoints Reference

```typescript
ADMIN_API.stats                     // '/api/admin/stats'
ADMIN_API.pendingCampsites          // '/api/admin/campsites/pending'
ADMIN_API.approveCampsite(id)       // `/api/admin/campsites/${id}/approve`
ADMIN_API.rejectCampsite(id)        // `/api/admin/campsites/${id}/reject`
ADMIN_API.ownerRequests             // '/api/admin/owner-requests'
ADMIN_API.approveOwnerRequest(id)   // `/api/admin/owner-requests/${id}/approve`
ADMIN_API.rejectOwnerRequest(id)    // `/api/admin/owner-requests/${id}/reject`
ADMIN_API.reportedReviews           // '/api/admin/reviews/reported'
ADMIN_API.hideReview(id)            // `/api/admin/reviews/${id}/hide`
ADMIN_API.unhideReview(id)          // `/api/admin/reviews/${id}/unhide`
ADMIN_API.deleteReview(id)          // `/api/admin/reviews/${id}`
ADMIN_API.googlePlaces.stats        // '/api/admin/google-places/stats'
ADMIN_API.googlePlaces.syncLogs     // '/api/admin/google-places/sync/logs'
ADMIN_API.googlePlaces.candidates   // '/api/admin/google-places/candidates'
ADMIN_API.googlePlaces.process      // '/api/admin/google-places/process'
```

## Benefits of These Fixes

1. **Reliability**: Tests now verify actual API calls instead of just UI
2. **Fast Failure**: Tests fail immediately with clear errors, not after timeouts
3. **Debuggability**: Know exactly which API call failed and why
4. **Maintainability**: Consistent pattern across all tests
5. **Coverage**: Verify both API and UI behavior

## Testing the Fixes

Run tests:
```bash
# Run all admin tests
npx playwright test tests/e2e/admin/

# Run specific fixed file
npx playwright test tests/e2e/admin/pending-campsites.test.ts

# Run with UI
npx playwright test tests/e2e/admin/pending-campsites.test.ts --ui
```

## Next Steps

1. Apply the same pattern to the remaining 16 files
2. Run all tests to verify
3. Fix any failures that arise from proper API verification
4. Update any frontend code if API responses don't match expectations
