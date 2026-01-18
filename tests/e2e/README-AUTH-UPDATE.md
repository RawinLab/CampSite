# E2E Test Authentication Update - Quick Start

## Summary

All E2E Playwright tests have been updated to use the **new API-based authentication flow** instead of direct Supabase authentication.

## What Was Updated

### ✅ Core Files
- `/tests/e2e/utils/auth.ts` - Main authentication utilities
  - Updated all login/logout functions
  - Added new token storage helpers
  - Updated cookie and localStorage handling

### ✅ Test Files
- `/tests/e2e/reviews/review-duplicate.test.ts` (4 locations)
- `/tests/e2e/reviews/review-auth.test.ts` (1 location)
- `/tests/e2e/reviews/helpful-persist.test.ts` (1 location)
- `/tests/e2e/inquiry/prefilled-fields.test.ts` (3 locations)

### ✅ Documentation
- `AUTH-MIGRATION.md` - Complete migration guide
- `AUTH-UPDATE-SUMMARY.md` - Detailed change summary
- `README-AUTH-UPDATE.md` - This file (quick start)
- `verify-auth-setup.ts` - Verification script

## Quick Reference

### New Token Keys

**localStorage:**
- `campsite_access_token`
- `campsite_refresh_token`
- `campsite_token_expiry`

**Cookies:**
- `campsite_access_token` (httpOnly)
- `campsite_refresh_token` (httpOnly)

### Test User Credentials

```typescript
{
  admin: 'admin@campsite.local' / 'Admin123!',
  owner: 'owner@campsite.local' / 'Owner123!',
  user: 'user@campsite.local' / 'User123!',
}
```

### Common Usage

```typescript
import { loginAsUser, loginAsAdmin, loginAsOwner } from '../utils/auth';

// Login via UI
test('my test', async ({ page }) => {
  await loginAsUser(page);
  await page.goto('/protected-page');
});

// Setup auth state (faster)
import { setupAuthState } from '../utils/auth';

test('my test', async ({ page, context }) => {
  await setupAuthState(context, 'user');
  await page.goto('/protected-page');
});
```

## Before Running Tests

### 1. Start Services

```bash
# Terminal 1: Backend
cd apps/campsite-backend
pnpm dev
# Should run on http://localhost:3091

# Terminal 2: Frontend
cd apps/campsite-frontend
pnpm dev
# Should run on http://localhost:3090
```

### 2. Verify Setup

```bash
# Run verification script
npx ts-node tests/e2e/verify-auth-setup.ts
```

This will check:
- ✅ Backend is running
- ✅ Frontend is running
- ✅ Test users can login
- ✅ Tokens are returned correctly
- ✅ Token refresh works
- ✅ /api/auth/me endpoint works

### 3. Run Tests

```bash
# Run all E2E tests
pnpm test:e2e

# Run specific test file
npx playwright test tests/e2e/reviews/review-auth.test.ts

# Run with UI mode (debugging)
npx playwright test --ui

# Run headed (see browser)
npx playwright test --headed
```

## Key Changes

### Old Way (Supabase Direct)
```typescript
// ❌ Don't use anymore
await context.addCookies([{
  name: 'sb-access-token',
  value: 'token',
  domain: 'localhost',
  path: '/',
}]);

await page.evaluate(() => {
  localStorage.setItem('supabase.auth.token', 'token');
});
```

### New Way (API-Based)
```typescript
// ✅ Use this instead
import { loginAsUser } from '../utils/auth';

await loginAsUser(page);

// Or for faster setup:
import { setupAuthState } from '../utils/auth';

await setupAuthState(context, 'user');
```

## Troubleshooting

### Tests fail with "Login failed"
- ✅ Check backend is running on port 3091
- ✅ Verify test users exist in database
- ✅ Check database connection is working

### Tokens not persisting
- ✅ Ensure both cookies and localStorage are set
- ✅ Use `setupAuthState()` for proper initialization
- ✅ Check `getAuthTokens(page)` to verify storage

### Auth state not working
- ✅ Add `await page.waitForTimeout(1000)` after login
- ✅ Use `waitForAuthReady(page)` helper
- ✅ Verify cookies are set with `httpOnly: true`

### Backend not responding
```bash
# Check backend logs
cd apps/campsite-backend
pnpm dev

# Check if port 3091 is in use
lsof -i :3091
```

### Frontend not responding
```bash
# Check frontend logs
cd apps/campsite-frontend
pnpm dev

# Check if port 3090 is in use
lsof -i :3090
```

## Environment Variables

Create `.env.test` or set these in your shell:

```bash
# Required for E2E tests
API_BASE_URL=http://localhost:3091
FRONTEND_URL=http://localhost:3090

# Required for Supabase admin operations
SUPABASE_URL=your-supabase-project-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Documentation

- **Complete Migration Guide:** `AUTH-MIGRATION.md`
- **Detailed Changes:** `AUTH-UPDATE-SUMMARY.md`
- **Auth Utilities:** `utils/auth.ts`

## API Endpoints

The authentication flow uses these endpoints:

- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/register` - Register new user
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh tokens

All endpoints are on the backend at `http://localhost:3091`

## Support

1. Read the full migration guide: `AUTH-MIGRATION.md`
2. Check the auth utilities: `utils/auth.ts`
3. Run verification: `npx ts-node tests/e2e/verify-auth-setup.ts`
4. Review test examples in updated test files

## Status

✅ **All tests updated and ready to use**

Updated files: 5 test files + 1 utility file
New documentation: 4 files
New tools: 1 verification script

---

**Last Updated:** 2026-01-19
**Migration Status:** Complete ✅
