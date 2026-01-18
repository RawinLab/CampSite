# E2E Test Authentication Update Summary

## Overview
Updated all E2E Playwright tests to work with the new API-based authentication flow instead of direct Supabase authentication.

## Changes Made

### 1. Core Authentication Utilities (`tests/e2e/utils/auth.ts`)

#### Updated Functions

**`loginViaUI()`**
- Now verifies tokens are stored in the new keys after login
- Checks for `campsite_access_token`, `campsite_refresh_token`, `campsite_token_expiry`
- Better error handling for missing tokens

**`logout()`**
- Clears both localStorage and cookies
- Uses `context.clearCookies()` to remove httpOnly cookies

**`getAuthToken()`**
- Returns `campsite_access_token` from localStorage
- Updated from old Supabase-specific keys

**`setupAuthState()`**
- Complete rewrite to use backend API authentication
- Calls `POST /api/auth/login` on backend
- Sets tokens in localStorage via `addInitScript`
- Sets httpOnly cookies with proper attributes:
  - `campsite_access_token`
  - `campsite_refresh_token`

#### New Functions

**`getAuthTokens()`**
```typescript
getAuthTokens(page): Promise<{
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: string | null;
}>
```
Returns all token data from localStorage.

**`loginViaAPI()`**
```typescript
loginViaAPI(email: string, password: string): Promise<{ session: any; user: any }>
```
Direct API login without browser - useful for programmatic authentication.

### 2. Test Files Updated

#### `tests/e2e/reviews/review-duplicate.test.ts`
**Before:**
```typescript
await page.evaluate((token) => {
  localStorage.setItem('supabase.auth.token', token);
}, authToken);
```

**After:**
```typescript
await page.evaluate((tokenData) => {
  localStorage.setItem('campsite_access_token', tokenData.token);
  localStorage.setItem('campsite_refresh_token', tokenData.token);
  localStorage.setItem('campsite_token_expiry', (Date.now() + 3600000).toString());
}, { token: authToken });
```

**Occurrences Updated:** 4 locations

---

#### `tests/e2e/reviews/review-auth.test.ts`
**Before:**
```typescript
await context.addCookies([
  {
    name: 'sb-access-token',
    value: 'mock-token-for-testing',
    domain: 'localhost',
    path: '/',
  },
]);
```

**After:**
```typescript
const mockToken = 'mock-token-for-testing';
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

// Also set localStorage tokens
await page.addInitScript((tokenData) => {
  localStorage.setItem('campsite_access_token', tokenData.token);
  localStorage.setItem('campsite_refresh_token', tokenData.token);
  localStorage.setItem('campsite_token_expiry', tokenData.expiry);
}, {
  token: mockToken,
  expiry: (Date.now() + 3600000).toString(),
});
```

**Occurrences Updated:** 1 test (T052.5)

---

#### `tests/e2e/reviews/helpful-persist.test.ts`
**Before:**
```typescript
test.beforeEach(async ({ page, context }) => {
  await context.addCookies([
    {
      name: 'sb-access-token',
      value: 'mock-authenticated-user-token',
      domain: 'localhost',
      path: '/',
    },
  ]);
```

**After:**
```typescript
test.beforeEach(async ({ page, context }) => {
  const mockToken = 'mock-authenticated-user-token';
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

  await page.addInitScript((tokenData) => {
    localStorage.setItem('campsite_access_token', tokenData.token);
    localStorage.setItem('campsite_refresh_token', tokenData.token);
    localStorage.setItem('campsite_token_expiry', tokenData.expiry);
  }, {
    token: mockToken,
    expiry: (Date.now() + 3600000).toString(),
  });
```

**Occurrences Updated:** 1 beforeEach block

---

#### `tests/e2e/inquiry/prefilled-fields.test.ts`
**Before:**
```typescript
await context.addCookies([
  {
    name: 'sb-access-token',
    value: 'mock-token-for-testing',
    domain: 'localhost',
    path: '/',
  },
]);
```

**After:**
```typescript
const mockToken = 'mock-token-for-testing';
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

await page.addInitScript((tokenData) => {
  localStorage.setItem('campsite_access_token', tokenData.token);
  localStorage.setItem('campsite_refresh_token', tokenData.token);
  localStorage.setItem('campsite_token_expiry', tokenData.expiry);
}, {
  token: mockToken,
  expiry: (Date.now() + 3600000).toString(),
});
```

**Occurrences Updated:** 3 locations (beforeEach + 2 tests)

---

### 3. New Documentation

Created comprehensive migration guide:
- **File:** `tests/e2e/AUTH-MIGRATION.md`
- **Contents:**
  - Overview of changes
  - Comparison of old vs new authentication
  - How to use updated authentication helpers
  - Token storage details
  - API endpoints reference
  - Test user credentials
  - Common patterns and examples
  - Troubleshooting guide
  - Migration checklist
  - Best practices

## Key Improvements

1. **Consistent Token Storage**
   - All tests now use the same token keys
   - Both localStorage and cookies are set
   - Proper cookie attributes (httpOnly, sameSite)

2. **API-Based Authentication**
   - Tests use real backend authentication
   - More realistic test scenarios
   - Better integration testing

3. **Improved Helpers**
   - `loginAsUser()`, `loginAsAdmin()`, `loginAsOwner()` for easy role-based testing
   - `setupAuthState()` for fast authentication setup
   - `loginViaAPI()` for programmatic authentication
   - `getAuthTokens()` for token verification

4. **Better Error Handling**
   - Login verification checks token storage
   - Clear error messages for auth failures
   - Timeout handling for async operations

## Token Storage Keys

### Old Supabase Keys (Removed)
- ❌ `supabase.auth.token`
- ❌ `sb-access-token` (cookie)
- ❌ `sb-*-auth-token` (dynamic Supabase keys)

### New API-Based Keys (Added)
- ✅ `campsite_access_token` (localStorage + cookie)
- ✅ `campsite_refresh_token` (localStorage + cookie)
- ✅ `campsite_token_expiry` (localStorage only)

## Cookie Attributes

All authentication cookies now use:
```typescript
{
  httpOnly: true,      // Security: not accessible via JavaScript
  sameSite: 'Lax',     // CSRF protection
  domain: 'localhost', // Local development
  path: '/',          // Available on all routes
}
```

## Files Changed

1. ✅ `/home/dev/projects/campsite/tests/e2e/utils/auth.ts`
2. ✅ `/home/dev/projects/campsite/tests/e2e/reviews/review-duplicate.test.ts`
3. ✅ `/home/dev/projects/campsite/tests/e2e/reviews/review-auth.test.ts`
4. ✅ `/home/dev/projects/campsite/tests/e2e/reviews/helpful-persist.test.ts`
5. ✅ `/home/dev/projects/campsite/tests/e2e/inquiry/prefilled-fields.test.ts`
6. ✅ `/home/dev/projects/campsite/tests/e2e/AUTH-MIGRATION.md` (new)
7. ✅ `/home/dev/projects/campsite/tests/e2e/AUTH-UPDATE-SUMMARY.md` (new)

## Tests Already Using New Auth

The following tests were already using the new authentication flow and didn't need updates:
- ✅ `tests/e2e/booking/external-link.test.ts` - No auth mocking
- ✅ `tests/e2e/booking/phone-link.test.ts` - No auth mocking
- ✅ `tests/e2e/inquiry/form-submit.test.ts` - Uses `loginAsUser()` helper
- ✅ `tests/e2e/inquiry/rate-limit.test.ts` - Uses `loginAsUser()` helper

## Testing Recommendations

### Before Running Tests

1. **Start Backend:**
   ```bash
   cd apps/campsite-backend
   pnpm dev
   # Backend should run on http://localhost:3091
   ```

2. **Start Frontend:**
   ```bash
   cd apps/campsite-frontend
   pnpm dev
   # Frontend should run on http://localhost:3090
   ```

3. **Seed Test Users:**
   Ensure these users exist in database:
   - `admin@campsite.local` / `Admin123!`
   - `owner@campsite.local` / `Owner123!`
   - `user@campsite.local` / `User123!`

4. **Set Environment Variables:**
   ```bash
   export SUPABASE_URL=your-supabase-url
   export SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   export API_BASE_URL=http://localhost:3091
   export FRONTEND_URL=http://localhost:3090
   ```

### Running Updated Tests

```bash
# Run all E2E tests
pnpm test:e2e

# Run specific updated test files
npx playwright test tests/e2e/reviews/review-duplicate.test.ts
npx playwright test tests/e2e/reviews/review-auth.test.ts
npx playwright test tests/e2e/reviews/helpful-persist.test.ts
npx playwright test tests/e2e/inquiry/prefilled-fields.test.ts

# Run with UI mode for debugging
npx playwright test --ui

# Run with headed browser
npx playwright test --headed
```

## Breaking Changes

None for test execution - all tests maintain the same behavior and assertions. Only the authentication mechanism changed internally.

## Next Steps

1. Run full E2E test suite to verify all tests pass
2. Update any additional tests that use old Supabase auth
3. Consider adding more authentication edge case tests
4. Update CI/CD pipeline if needed to ensure backend is running

## Support

For questions or issues:
- See `/home/dev/projects/campsite/tests/e2e/AUTH-MIGRATION.md`
- Review updated helper functions in `/home/dev/projects/campsite/tests/e2e/utils/auth.ts`
- Check frontend auth implementation in `/home/dev/projects/campsite/apps/campsite-frontend/src/lib/api/auth.ts`
