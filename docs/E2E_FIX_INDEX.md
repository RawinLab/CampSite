# E2E Test Fixes - Complete Index

## 📊 Quick Status

- **Progress:** 7/24 files (29%)
- **Wishlist Tests:** ✅ 6/6 (100%)
- **Compare Tests:** ⏳ 1/7 (14%)
- **Map Tests:** ⏳ 0/9 (0%)
- **Attractions Tests:** ⏳ 0/2 (0%)

## 📚 Documentation Files

### Start Here
1. **E2E_FIX_SUMMARY.md** ⭐
   - Executive summary of the work
   - Before/after examples
   - Key improvements
   - Next steps

### Implementation Guide
2. **E2E_TEST_FIX_GUIDE.md** 📖
   - Complete templates for each test type
   - Pattern examples
   - API endpoint reference
   - Step-by-step instructions

### Detailed Status
3. **E2E_TESTS_FIX_STATUS.md** 📋
   - File-by-file progress tracking
   - Detailed changes made
   - Testing instructions
   - Success criteria

### Quick Reference
4. **FIX_E2E_TESTS_SUMMARY.md** 🚀
   - Quick before/after patterns
   - Common scenarios
   - Files checklist

## ✅ Completed Files (7)

All wishlist tests have been fixed:

1. /tests/e2e/wishlist/add-to-wishlist.test.ts
2. /tests/e2e/wishlist/remove-from-wishlist.test.ts
3. /tests/e2e/wishlist/counter-update.test.ts
4. /tests/e2e/wishlist/heart-animation.test.ts
5. /tests/e2e/wishlist/persistence.test.ts
6. /tests/e2e/wishlist/login-prompt.test.ts

One compare test has been fixed:

7. /tests/e2e/compare/select-campsites.test.ts

## ⏳ Remaining Files (17)

### Compare Tests (6 files)
- tests/e2e/compare/compare-button.test.ts
- tests/e2e/compare/max-selection.test.ts
- tests/e2e/compare/comparison-table.test.ts
- tests/e2e/compare/mobile-tabs.test.ts
- tests/e2e/compare/amenities-icons.test.ts
- tests/e2e/compare/view-details.test.ts

**Pattern:** Client-side state, minimal API calls
**Template:** See E2E_TEST_FIX_GUIDE.md > "For Compare Tests"

### Map Tests (9 files)
- tests/e2e/map/map-load.test.ts
- tests/e2e/map/clustering.test.ts
- tests/e2e/map/zoom-controls.test.ts
- tests/e2e/map/filter-sync.test.ts
- tests/e2e/map/info-window-link.test.ts
- tests/e2e/map/legend.test.ts
- tests/e2e/map/marker-click.test.ts
- tests/e2e/map/view-toggle.test.ts
- tests/e2e/map/mobile-zoom.test.ts

**Pattern:** Uses `/api/campsites` API for data loading
**Template:** See E2E_TEST_FIX_GUIDE.md > "For Map Tests"

### Attractions Tests (2 files)
- tests/e2e/attractions/attractions-list.test.ts
- tests/e2e/attractions/directions-link.test.ts

**Pattern:** Uses `/api/attractions` API
**Template:** See E2E_TEST_FIX_GUIDE.md > "For Attractions Tests"

## 🔑 Key Fix Pattern

```typescript
// 1. Import helpers
import { waitForApi, assertNoErrors } from '../utils';

// 2. Wait for API on navigation
const apiPromise = waitForApi(page, '/api/endpoint', { status: 200 });
await page.goto('/page');
await apiPromise;
await assertNoErrors(page);

// 3. Wait for API on user action (if it triggers API)
const actionApiPromise = waitForApi(page, '/api/action', { method: 'POST', status: 200 });
await button.click();
const response = await actionApiPromise;
expect((await response.json()).success).toBe(true);

// 4. Use specific selectors
const button = page.locator('[data-testid="button-name"]');

// 5. No waitForTimeout() or .catch(() => false)
```

## 🛠️ How to Fix a File

1. Open one of the remaining test files
2. Read E2E_TEST_FIX_GUIDE.md for the template matching that file type
3. Apply the pattern:
   - Add `import { waitForApi, assertNoErrors } from '../utils'`
   - Replace `page.goto()` with API-verified navigation
   - Replace user actions that trigger APIs with API-verified actions
   - Remove all `waitForTimeout()` calls
   - Replace generic selectors with `[data-testid="..."]`
4. Verify the changes follow the pattern in completed wishlist tests
5. Move to next file

## 📝 Examples

### Example: Page Navigation
```typescript
// BEFORE
await page.goto('/search');
await page.waitForTimeout(2000);

// AFTER
const apiPromise = waitForApi(page, '/api/campsites', { status: 200 });
await page.goto('/search');
await apiPromise;
await assertNoErrors(page);
```

### Example: User Action with API
```typescript
// BEFORE
await wishlistButton.click();
await page.waitForTimeout(1000);

// AFTER
const apiPromise = waitForApi(page, '/api/wishlist', { method: 'POST', status: 200 });
await wishlistButton.click();
const response = await apiPromise;
expect((await response.json()).success).toBe(true);
```

### Example: UI-Only Action (No API)
```typescript
// BEFORE
await checkbox.click();
await page.waitForTimeout(500);

// AFTER
await checkbox.click();
// No API wait needed - client-side state only
await expect(checkbox).toBeChecked();
```

## 🧪 Testing Your Fixes

```bash
# Test specific file
pnpm test:e2e tests/e2e/wishlist/add-to-wishlist.test.ts

# Test entire suite
pnpm test:e2e tests/e2e/wishlist

# Test all E2E
pnpm test:e2e
```

## ✨ Benefits of These Fixes

1. **Reliability:** Tests wait for actual API responses, not arbitrary timeouts
2. **Speed:** No unnecessary delays - tests complete as soon as APIs respond
3. **Maintainability:** Consistent pattern across all tests
4. **Debugging:** Better error messages when tests fail
5. **Confidence:** Verifying both API success and UI state changes

## 📞 Need Help?

- Check completed wishlist tests for working examples
- Refer to E2E_TEST_FIX_GUIDE.md for templates
- Look at E2E_TESTS_FIX_STATUS.md for detailed change patterns

## 📅 Created

Date: 2026-01-19
Status: In Progress (29% complete)
Remaining: 17 files to fix following established patterns

---

**All documentation is in /home/dev/projects/campsite/**
