# Review E2E Tests - Real API Integration

## Quick Start

### 1. Prerequisites

Ensure you have the following running:

```bash
# Terminal 1: Start backend API
cd apps/campsite-backend
pnpm dev
# Backend should be running on http://localhost:3091

# Terminal 2: Start frontend
cd apps/campsite-frontend
pnpm dev
# Frontend should be running on http://localhost:3090
```

### 2. Seed Test Data (First Time Only)

```bash
# From project root
npx tsx tests/e2e/utils/seed-test-data.ts
```

**Expected Output:**
```
🌱 Seeding test data...

Creating admin user: admin@campsite.local
  ✅ User created (ID: ...)
  ✅ Profile updated to role: admin
Creating owner user: owner@campsite.local
  ✅ User created (ID: ...)
  ✅ Profile updated to role: owner
Creating user user: user@campsite.local
  ✅ User created (ID: ...)
  ✅ Profile updated to role: user

📋 Creating test data...

✅ Created campsite: E2E Test Campsite - Pending 1
✅ Created campsite: E2E Test Campsite - Pending 2
✅ Created campsite: E2E Test Campsite - Approved
✅ Created campsite: E2E Test Campsite - Rejected
✅ Created test review
✅ Created owner request

✅ Test data seeding complete!

Test user credentials:
  admin: admin@campsite.local / Admin123!
  owner: owner@campsite.local / Owner123!
  user: user@campsite.local / User123!
```

### 3. Run Tests

```bash
# Run all review tests
npx playwright test tests/e2e/reviews/

# Run specific test file
npx playwright test tests/e2e/reviews/helpful-voting.test.ts

# Run with UI mode (recommended for debugging)
npx playwright test tests/e2e/reviews/ --ui

# Run in headed mode (see browser)
npx playwright test tests/e2e/reviews/ --headed

# Run specific test
npx playwright test tests/e2e/reviews/helpful-voting.test.ts -g "T034.1"
```

## Test Files

### 1. helpful-voting.test.ts
Tests helpful button voting functionality:
- Button visibility and count display
- Toggle behavior (vote/unvote)
- Authentication requirements
- Visual feedback for voted state
- Count persistence after page refresh
- Accessibility (ARIA, keyboard)

**Total Tests:** 17 (15 active, 2 skipped)

### 2. helpful-optimistic.test.ts
Tests optimistic UI updates for helpful voting:
- Count increments with real API
- Button state toggles correctly
- Toggle vote/unvote works
- Rapid clicks prevented by disabled state

**Total Tests:** 10 (4 active, 6 skipped)

### 3. review-report-own.test.ts
Tests report button visibility based on review ownership:
- Report button hidden on own review
- Report button visible on other users' reviews
- Visibility states correct in same view
- Visibility persists after page refresh

**Total Tests:** 6 (4 active, 2 skipped)

## Test Data

### Test Users (Seeded)
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@campsite.local | Admin123! |
| Owner | owner@campsite.local | Owner123! |
| User | user@campsite.local | User123! |

### Test Campsites (Seeded)
| ID | Name | Status | Purpose |
|----|------|--------|---------|
| e2e-test-campsite-pending-1 | E2E Test Campsite - Pending 1 | pending | Admin approval tests |
| e2e-test-campsite-pending-2 | E2E Test Campsite - Pending 2 | pending | Admin approval tests |
| e2e-test-campsite-approved-1 | E2E Test Campsite - Approved | approved | Review tests (used in all 3 files) |
| e2e-test-campsite-rejected-1 | E2E Test Campsite - Rejected | rejected | Admin rejection tests |

### Test Reviews (Seeded)
| ID | Campsite | User | Comment | Purpose |
|----|----------|------|---------|---------|
| e2e-test-review-1 | e2e-test-campsite-approved-1 | user@campsite.local | "Great place for camping! E2E test review." | User's own review |

### Test Reviews (Created Dynamically)
| ID | Campsite | User | Comment | Created By Test |
|----|----------|------|---------|-----------------|
| e2e-test-review-from-owner | e2e-test-campsite-approved-1 | owner@campsite.local | "Owner review - different from logged in user" | review-report-own.test.ts |

## Architecture

### Real API Integration
These tests use **real API calls** to http://localhost:3091 instead of mocked responses.

**Benefits:**
- ✅ Tests actual API behavior
- ✅ Tests real database state and RLS policies
- ✅ Uses real Supabase authentication
- ✅ Higher confidence in production behavior

**Trade-offs:**
- ⚠️ Slower than mocked tests (~3-5s vs <1s)
- ⚠️ Require backend and database running
- ⚠️ Cannot easily test error scenarios (API failures, timeouts)

### Authentication Flow
Tests use `loginAsUser()` utility which:
1. Navigates to `/auth/login`
2. Fills email and password fields
3. Submits login form
4. Waits for authentication to complete
5. Returns to test with authenticated session

### Wait Strategy
Tests use `waitForTimeout(3000)` instead of `waitForLoadState('networkidle')` because:
- Real API calls may not trigger network idle detection
- Supabase auth can have delayed state propagation
- Review rendering may be async

## Troubleshooting

### Test Fails with "Review not found"
**Problem:** Seed data not created or was deleted

**Solution:**
```bash
npx tsx tests/e2e/utils/seed-test-data.ts
```

### Test Fails with "Login failed"
**Problem:** Test users not seeded or credentials incorrect

**Solution:**
1. Check backend logs for auth errors
2. Verify Supabase connection in backend
3. Re-run seed script

### Test Fails with Timeout
**Problem:** Backend not running or slow response

**Solution:**
1. Verify backend is running: `curl http://localhost:3091/health`
2. Check backend logs for errors
3. Increase timeout: `test.setTimeout(90000)`

### Test Fails with "Report button not visible"
**Problem:** Test data not created in beforeAll hook

**Solution:**
1. Check that owner review was created in beforeAll
2. Verify both users exist in database
3. Check console output for error messages

### All Tests Skip
**Problem:** Required test data missing

**Solution:**
1. Re-run seed script
2. Check that campsite `e2e-test-campsite-approved-1` exists
3. Verify reviews were created

## CI/CD Integration

### GitHub Actions Example
```yaml
name: E2E Tests - Review (Real API)

on: [pull_request]

jobs:
  e2e-review-tests:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: supabase/postgres:15.1.0.117
        env:
          POSTGRES_PASSWORD: postgres
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: pnpm install

      - name: Setup Supabase
        run: npx supabase start

      - name: Run migrations
        run: npx supabase db push

      - name: Seed test data
        run: npx tsx tests/e2e/utils/seed-test-data.ts

      - name: Start backend
        run: pnpm --filter campsite-backend dev &

      - name: Start frontend
        run: pnpm --filter campsite-frontend dev &

      - name: Wait for services
        run: |
          npx wait-on http://localhost:3091/health
          npx wait-on http://localhost:3090

      - name: Run E2E tests
        run: npx playwright test tests/e2e/reviews/

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

## Development Workflow

### Adding New Review Tests

1. **Create test file:**
   ```typescript
   import { test, expect } from '@playwright/test';
   import { loginAsUser } from '../utils/auth';

   test.describe('My New Feature', () => {
     test.setTimeout(60000);

     test.beforeEach(async ({ page }) => {
       await loginAsUser(page);
       await page.goto('/campsites/e2e-test-campsite-approved-1');
       await page.waitForTimeout(3000);
     });

     test('should do something', async ({ page }) => {
       // Test code
     });
   });
   ```

2. **Run test in UI mode:**
   ```bash
   npx playwright test tests/e2e/reviews/my-new-test.test.ts --ui
   ```

3. **Debug with headed mode:**
   ```bash
   npx playwright test tests/e2e/reviews/my-new-test.test.ts --headed --debug
   ```

### Creating Test Data

Use utilities from `tests/e2e/utils/test-data.ts`:

```typescript
import { createSupabaseAdmin } from '../utils/auth';
import { createTestReview, createTestCampsite } from '../utils/test-data';

test.beforeAll(async () => {
  const supabase = createSupabaseAdmin();

  // Create campsite
  const campsite = await createTestCampsite(supabase, {
    id: 'my-test-campsite',
    name: 'My Test Campsite',
    status: 'approved',
  });

  // Create review
  const review = await createTestReview(supabase, campsite.id, {
    rating: 5,
    comment: 'Test review comment',
  });
});
```

## Resources

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Project CLAUDE.md](/home/dev/projects/campsite/CLAUDE.md)
- [Auth Utilities](/home/dev/projects/campsite/tests/e2e/utils/auth.ts)
- [Test Data Utilities](/home/dev/projects/campsite/tests/e2e/utils/test-data.ts)
- [Seed Script](/home/dev/projects/campsite/tests/e2e/utils/seed-test-data.ts)
- [Conversion Summary](./CONVERSION-SUMMARY.md)
