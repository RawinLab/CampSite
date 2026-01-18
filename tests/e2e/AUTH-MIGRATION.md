# E2E Test Authentication Migration Guide

## Overview

The E2E tests have been updated to work with the new API-based authentication flow. This document describes the changes made and how to use the updated authentication utilities.

## What Changed

### Old Authentication Flow (Supabase Direct)
- Frontend called Supabase client directly
- Tokens stored in keys like `sb-*-auth-token`
- Tests mocked Supabase cookies and localStorage

### New Authentication Flow (API-Based)
- Frontend calls backend API endpoints via Next.js API routes
- Backend handles Supabase authentication
- Tokens stored in standardized keys:
  - `campsite_access_token` - JWT access token
  - `campsite_refresh_token` - JWT refresh token
  - `campsite_token_expiry` - Token expiration timestamp (milliseconds)
- Both localStorage and httpOnly cookies are used

## Updated Files

### Core Authentication Utility
**File:** `/home/dev/projects/campsite/tests/e2e/utils/auth.ts`

**Key Changes:**
1. Added token storage constants matching the new system
2. Updated `loginViaUI()` to verify new token storage keys
3. Updated `logout()` to clear new cookies and localStorage
4. Updated `getAuthToken()` to use new storage keys
5. Added `getAuthTokens()` helper for all token data
6. Updated `setupAuthState()` to:
   - Call backend API for authentication
   - Set tokens in localStorage via `addInitScript`
   - Set httpOnly cookies with proper attributes
7. Added `loginViaAPI()` helper for programmatic login

### Test Files Updated

1. **`tests/e2e/reviews/review-duplicate.test.ts`**
   - Updated token storage from `supabase.auth.token` to new keys
   - Uses `campsite_access_token`, `campsite_refresh_token`, `campsite_token_expiry`

2. **`tests/e2e/reviews/review-auth.test.ts`**
   - Updated mock cookie setup to use new cookie names
   - Added localStorage token initialization

3. **`tests/e2e/reviews/helpful-persist.test.ts`**
   - Updated mock authentication in `beforeEach`
   - Uses both cookies and localStorage tokens

4. **`tests/e2e/inquiry/prefilled-fields.test.ts`**
   - Updated all authentication cookie setups
   - Consistent token initialization across all tests

## How to Use Updated Authentication

### Option 1: Login via UI (Realistic User Flow)

```typescript
import { loginAsUser, loginAsAdmin, loginAsOwner } from '../utils/auth';

test('my test', async ({ page }) => {
  // Login as a specific role via UI
  await loginAsUser(page);

  // Now the user is authenticated and can access protected features
  await page.goto('/dashboard');
});
```

**Available login helpers:**
- `loginAsAdmin(page)` - Login as admin@campsite.local
- `loginAsOwner(page)` - Login as owner@campsite.local
- `loginAsUser(page)` - Login as user@campsite.local

### Option 2: Setup Auth State (Faster, Bypass UI)

```typescript
import { setupAuthState } from '../utils/auth';

test('my test', async ({ page, context }) => {
  // Set up authentication without going through UI
  await setupAuthState(context, 'user');

  // Navigate directly to protected page
  await page.goto('/dashboard');
});
```

**Available roles:** `'admin'`, `'owner'`, `'user'`

### Option 3: Login via API (Programmatic)

```typescript
import { loginViaAPI, TEST_USERS } from '../utils/auth';

test('my test', async () => {
  // Get session data directly from API
  const { session, user } = await loginViaAPI(
    TEST_USERS.user.email,
    TEST_USERS.user.password
  );

  // Use the tokens for API calls
  const token = session.access_token;
});
```

### Option 4: Mock Authentication (For UI Tests Only)

For tests that only need to verify UI behavior without actual API calls:

```typescript
test('my test', async ({ page, context }) => {
  const mockToken = 'mock-token-for-testing';

  // Set cookies
  await context.addCookies([
    {
      name: 'campsite_access_token',
      value: mockToken,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
    },
    {
      name: 'campsite_refresh_token',
      value: mockToken,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);

  // Set localStorage tokens
  await page.addInitScript((tokenData) => {
    localStorage.setItem('campsite_access_token', tokenData.token);
    localStorage.setItem('campsite_refresh_token', tokenData.token);
    localStorage.setItem('campsite_token_expiry', tokenData.expiry);
  }, {
    token: mockToken,
    expiry: (Date.now() + 3600000).toString(), // 1 hour from now
  });

  await page.goto('/protected-page');
});
```

## Token Storage Details

### localStorage Keys
- `campsite_access_token` - The JWT access token
- `campsite_refresh_token` - The JWT refresh token
- `campsite_token_expiry` - Expiry timestamp in milliseconds

### Cookie Names
- `campsite_access_token` - httpOnly cookie with access token
- `campsite_refresh_token` - httpOnly cookie with refresh token

### Cookie Attributes
```typescript
{
  httpOnly: true,      // Cannot be accessed via JavaScript
  sameSite: 'Lax',     // CSRF protection
  domain: 'localhost', // For local development
  path: '/',          // Available on all routes
}
```

## API Endpoints

The new authentication flow uses these backend endpoints:

- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/register` - Register new user
- `POST /api/auth/logout` - Logout current user
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/refresh` - Refresh access token

All endpoints are proxied through Next.js API routes at:
- Frontend: `POST /api/auth/login` → Backend: `POST /api/auth/login`

## Test User Credentials

Pre-seeded test users (must exist in database):

```typescript
{
  admin: {
    email: 'admin@campsite.local',
    password: 'Admin123!',
    role: 'admin',
  },
  owner: {
    email: 'owner@campsite.local',
    password: 'Owner123!',
    role: 'owner',
  },
  user: {
    email: 'user@campsite.local',
    password: 'User123!',
    role: 'user',
  },
}
```

## Environment Variables

Required for E2E tests:

```bash
# Backend API URL
API_BASE_URL=http://localhost:3091

# Frontend URL
FRONTEND_URL=http://localhost:3090

# For Supabase admin operations (test data manipulation)
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Common Patterns

### Test with Authenticated User

```typescript
test.describe('Protected Feature Tests', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
  });

  test('can access protected feature', async ({ page }) => {
    await page.goto('/protected-feature');
    // Test protected functionality
  });
});
```

### Test with Different Roles

```typescript
test('admin can delete campsite', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/campsites');
  // Test admin functionality
});

test('owner can edit their campsite', async ({ page }) => {
  await loginAsOwner(page);
  await page.goto('/owner/campsites');
  // Test owner functionality
});
```

### Verify Token Storage

```typescript
import { getAuthToken, getAuthTokens } from '../utils/auth';

test('tokens are stored correctly', async ({ page }) => {
  await loginAsUser(page);

  // Get access token
  const token = await getAuthToken(page);
  expect(token).toBeTruthy();

  // Get all token data
  const tokens = await getAuthTokens(page);
  expect(tokens.accessToken).toBeTruthy();
  expect(tokens.refreshToken).toBeTruthy();
  expect(tokens.expiresAt).toBeTruthy();
});
```

## Troubleshooting

### Tests Fail with "Login failed"
- Ensure backend is running on `localhost:3091`
- Verify test users are seeded in database
- Check that credentials match `TEST_USERS` in `auth.ts`

### Tokens Not Persisting After Refresh
- Verify both localStorage and cookies are set
- Check cookie domain matches test environment (localhost)
- Ensure `addInitScript` is called before page navigation

### Authentication State Not Working
- Use `waitForAuthReady(page)` after login
- Add `await page.waitForTimeout(1000)` after auth operations
- Verify tokens are stored: `await getAuthTokens(page)`

### Mock Auth Not Working
- Mock auth only works for UI verification
- For real API calls, use `loginViaAPI()` or `loginViaUI()`
- Ensure both cookies and localStorage are set for mock auth

## Migration Checklist

When updating an existing test:

- [ ] Replace `sb-*-auth-token` cookies with `campsite_access_token` and `campsite_refresh_token`
- [ ] Replace old localStorage keys with new token keys
- [ ] Add both cookie and localStorage token setup
- [ ] Use `loginAsUser/Admin/Owner` helpers instead of manual auth
- [ ] Set cookie attributes: `httpOnly: true`, `sameSite: 'Lax'`
- [ ] Update token expiry format (milliseconds, not seconds)
- [ ] Test with real backend API running

## Best Practices

1. **Use real authentication when possible** - More realistic and catches integration issues
2. **Mock auth only for UI tests** - When you don't need actual API functionality
3. **Use setupAuthState for speed** - When you need auth but don't care about login flow
4. **Clean up test data** - Use `afterEach` to delete test records
5. **Use descriptive test users** - Follow naming pattern `test-{feature}-{timestamp}@example.com`
6. **Verify auth state** - Check tokens after login to ensure auth succeeded
7. **Handle auth failures gracefully** - Add proper error messages and timeouts

## Example: Complete Test Update

### Before (Old Supabase Auth)
```typescript
test('user can submit review', async ({ page, context }) => {
  await context.addCookies([{
    name: 'sb-access-token',
    value: 'test-token',
    domain: 'localhost',
    path: '/',
  }]);

  await page.evaluate(() => {
    localStorage.setItem('supabase.auth.token', 'test-token');
  });

  await page.goto('/campsites/test-1');
  // Test code...
});
```

### After (New API-Based Auth)
```typescript
import { loginAsUser } from '../utils/auth';

test('user can submit review', async ({ page }) => {
  await loginAsUser(page);
  await page.goto('/campsites/test-1');
  // Test code...
});
```

Or with faster setup:

```typescript
import { setupAuthState } from '../utils/auth';

test('user can submit review', async ({ page, context }) => {
  await setupAuthState(context, 'user');
  await page.goto('/campsites/test-1');
  // Test code...
});
```

## Support

For questions or issues with the updated authentication:
1. Check this migration guide
2. Review `/home/dev/projects/campsite/tests/e2e/utils/auth.ts`
3. Look at updated test examples in `/home/dev/projects/campsite/tests/e2e/`
4. Verify backend authentication implementation in `/home/dev/projects/campsite/apps/campsite-backend/`
