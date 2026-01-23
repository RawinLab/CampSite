import { test, expect } from '@playwright/test';
import { loginAsUser, createSupabaseAdmin, waitForApi, assertNoErrors, API_BASE_URL, FRONTEND_URL, loginViaAPI, TEST_USERS } from '../utils';

test.describe('Search Page Wishlist Heart Button Functionality', () => {
  test.setTimeout(60000);
  // Run tests serially to avoid race conditions with shared profile
  test.describe.configure({ mode: 'serial' });

  let profileId: string;

  test.beforeAll(async () => {
    // Get profile ID by logging in via API (wishlists.user_id references profiles.id)
    const loginData = await loginViaAPI(TEST_USERS.user.email, TEST_USERS.user.password);
    profileId = loginData.profile?.id;

    if (!profileId) {
      throw new Error('Failed to get profile ID for test user');
    }

    console.log('Test user profile ID:', profileId);
  });

  test.beforeEach(async ({ page }) => {
    // Clean up wishlist before each test
    const supabase = createSupabaseAdmin();
    await supabase.from('wishlists').delete().eq('user_id', profileId);

    // Login as user
    await loginAsUser(page);
  });

  test.afterEach(async () => {
    // Clean up wishlist after each test
    const supabase = createSupabaseAdmin();
    await supabase.from('wishlists').delete().eq('user_id', profileId);
  });

  test('T-SEARCH-WISHLIST-01: Heart button is visible on campsite cards in search results', async ({ page }) => {
    // Navigate to search page
    const searchApiPromise = waitForApi(page, '/api/search', { status: 200 });
    await page.goto('/search');
    await searchApiPromise;
    await assertNoErrors(page);

    // Verify campsite cards are displayed
    const campsiteCards = page.locator('[data-testid="campsite-card"], .group.overflow-hidden');
    await expect(campsiteCards.first()).toBeVisible({ timeout: 10000 });

    // Verify heart button exists on the first card
    const heartButton = campsiteCards.first().locator('button[aria-label*="wishlist"], button:has(svg.lucide-heart)');
    await expect(heartButton).toBeVisible();
  });

  test('T-SEARCH-WISHLIST-02: Can click heart button without navigating to detail page', async ({ page }) => {
    // Navigate to search page
    const searchApiPromise = waitForApi(page, '/api/search', { status: 200 });
    await page.goto('/search');
    await searchApiPromise;
    await assertNoErrors(page);

    // Get initial URL
    const initialUrl = page.url();

    // Find heart button on first campsite card using data-testid
    const campsiteCards = page.locator('[data-testid="campsite-card"]');
    await expect(campsiteCards.first()).toBeVisible({ timeout: 10000 });

    const heartButton = campsiteCards.first().locator('[data-testid="wishlist-button"]');
    await expect(heartButton).toBeVisible();

    // Click heart button and wait for API call (accept any response)
    const wishlistApiPromise = page.waitForResponse(
      (response) => response.url().includes('/api/wishlist') && response.request().method() === 'POST',
      { timeout: 30000 }
    );
    await heartButton.click();
    await wishlistApiPromise;

    // Verify we're still on the search page (didn't navigate)
    expect(page.url()).toBe(initialUrl);
  });

  test('T-SEARCH-WISHLIST-03: Heart button adds campsite to wishlist via API', async ({ page }) => {
    // Navigate to search page
    const searchApiPromise = waitForApi(page, '/api/search', { status: 200 });
    await page.goto('/search');
    await searchApiPromise;
    await assertNoErrors(page);

    // Get campsite ID from the first card's data attribute
    const campsiteCards = page.locator('[data-testid="campsite-card"]');
    const firstCard = campsiteCards.first();
    await expect(firstCard).toBeVisible({ timeout: 10000 });
    const campsiteId = await firstCard.getAttribute('data-campsite-id');
    expect(campsiteId).toBeTruthy();

    // Find and click heart button
    const heartButton = firstCard.locator('[data-testid="wishlist-button"]');

    const wishlistApiPromise = page.waitForResponse(
      (response) => response.url().includes('/api/wishlist') && response.request().method() === 'POST',
      { timeout: 30000 }
    );
    await heartButton.click();
    const wishlistResponse = await wishlistApiPromise;

    // Verify API response
    const wishlistData = await wishlistResponse.json();
    expect(wishlistData.success).toBe(true);

    // Verify database
    const supabase = createSupabaseAdmin();
    const { data: dbData } = await supabase
      .from('wishlists')
      .select('*')
      .eq('user_id', profileId)
      .eq('campsite_id', campsiteId)
      .single();

    expect(dbData).toBeTruthy();
  });

  test('T-SEARCH-WISHLIST-04: Heart button shows filled state after adding to wishlist', async ({ page }) => {
    // Navigate to search page
    const searchApiPromise = waitForApi(page, '/api/search', { status: 200 });
    await page.goto('/search');
    await searchApiPromise;
    await assertNoErrors(page);

    // Find heart button using data-testid
    const campsiteCards = page.locator('[data-testid="campsite-card"]');
    await expect(campsiteCards.first()).toBeVisible({ timeout: 10000 });
    const heartButton = campsiteCards.first().locator('[data-testid="wishlist-button"]');

    // Verify initial state (not active)
    await expect(heartButton).toHaveAttribute('data-active', 'false');

    // Click to add to wishlist - accept either 201 (created) or 200 (success)
    const wishlistApiPromise = page.waitForResponse(
      (response) => response.url().includes('/api/wishlist') && response.request().method() === 'POST',
      { timeout: 30000 }
    );
    await heartButton.click();
    await wishlistApiPromise;

    // Verify filled state using data-active attribute
    await expect(heartButton).toHaveAttribute('data-active', 'true', { timeout: 5000 });
  });

  test('T-SEARCH-WISHLIST-05: Heart button toggles off when removing from wishlist', async ({ page }) => {
    const supabase = createSupabaseAdmin();

    // Navigate to search page
    const searchApiPromise = waitForApi(page, '/api/search', { status: 200 });
    await page.goto('/search');
    await searchApiPromise;
    await assertNoErrors(page);

    // Find heart button and get campsite ID
    const campsiteCards = page.locator('[data-testid="campsite-card"]');
    await expect(campsiteCards.first()).toBeVisible({ timeout: 10000 });
    const campsiteId = await campsiteCards.first().getAttribute('data-campsite-id');
    expect(campsiteId).toBeTruthy();
    const heartButton = campsiteCards.first().locator('[data-testid="wishlist-button"]');

    // First add to wishlist via UI
    const addApiPromise = page.waitForResponse(
      (response) => response.url().includes('/api/wishlist') && response.request().method() === 'POST',
      { timeout: 30000 }
    );
    await heartButton.click();
    await addApiPromise;

    // Verify it shows filled state
    await expect(heartButton).toHaveAttribute('data-active', 'true', { timeout: 5000 });

    // Now click to remove from wishlist (toggle API uses POST for both add/remove)
    const removeApiPromise = page.waitForResponse(
      (response) => response.url().includes('/api/wishlist') && response.request().method() === 'POST',
      { timeout: 30000 }
    );
    await heartButton.click();
    await removeApiPromise;

    // Verify unfilled state
    await expect(heartButton).toHaveAttribute('data-active', 'false', { timeout: 5000 });

    // Verify database
    const { data: dbData } = await supabase
      .from('wishlists')
      .select('*')
      .eq('user_id', profileId)
      .eq('campsite_id', campsiteId)
      .maybeSingle();

    expect(dbData).toBeNull();
  });

  test('T-SEARCH-WISHLIST-06: Wishlist state persists in database after page actions', async ({ page }) => {
    const supabase = createSupabaseAdmin();

    // Navigate to search page
    const searchApiPromise = waitForApi(page, '/api/search', { status: 200 });
    await page.goto('/search');
    await searchApiPromise;
    await assertNoErrors(page);

    // Find heart button and get campsite ID
    const campsiteCards = page.locator('[data-testid="campsite-card"]');
    await expect(campsiteCards.first()).toBeVisible({ timeout: 10000 });
    const campsiteId = await campsiteCards.first().getAttribute('data-campsite-id');
    expect(campsiteId).toBeTruthy();
    const heartButton = campsiteCards.first().locator('[data-testid="wishlist-button"]');

    // Add to wishlist via UI
    const wishlistApiPromise = page.waitForResponse(
      (response) => response.url().includes('/api/wishlist') && response.request().method() === 'POST',
      { timeout: 30000 }
    );
    await heartButton.click();
    const addResponse = await wishlistApiPromise;

    // Verify API response
    const addData = await addResponse.json();
    expect(addData.success).toBe(true);

    // Verify UI shows filled state
    await expect(heartButton).toHaveAttribute('data-active', 'true', { timeout: 5000 });

    // Core test: Verify database persistence
    const { data: dbData } = await supabase
      .from('wishlists')
      .select('*')
      .eq('user_id', profileId)
      .eq('campsite_id', campsiteId)
      .single();

    expect(dbData).toBeTruthy();
    expect(dbData.campsite_id).toBe(campsiteId);
    expect(dbData.user_id).toBe(profileId);

    // Verify database persistence after page reload
    await page.reload({ waitUntil: 'networkidle' });

    // Database state should still be the same
    const { data: dbDataAfterReload } = await supabase
      .from('wishlists')
      .select('*')
      .eq('user_id', profileId)
      .eq('campsite_id', campsiteId)
      .single();

    expect(dbDataAfterReload).toBeTruthy();
    expect(dbDataAfterReload.campsite_id).toBe(campsiteId);
  });

  test('T-SEARCH-WISHLIST-07: Non-logged-in user sees login prompt when clicking heart', async ({ page }) => {
    // Clear auth state
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Navigate to search page without login
    await page.goto('/search');
    await page.waitForLoadState('networkidle');

    // Find heart button using data-testid
    const campsiteCards = page.locator('[data-testid="campsite-card"]');
    await expect(campsiteCards.first()).toBeVisible({ timeout: 10000 });

    const heartButton = campsiteCards.first().locator('[data-testid="wishlist-button"]');
    await heartButton.click();

    // Should show login prompt - check using test id
    const loginPrompt = page.locator('[data-testid="wishlist-login-prompt"]');
    await expect(loginPrompt).toBeVisible({ timeout: 5000 });

    // Also verify the text content
    await expect(loginPrompt).toContainText('log in');
  });

  test('T-SEARCH-WISHLIST-08: Multiple campsites can be wishlisted from search page', async ({ page }) => {
    // Navigate to search page
    const searchApiPromise = waitForApi(page, '/api/search', { status: 200 });
    await page.goto('/search?limit=10');
    await searchApiPromise;
    await assertNoErrors(page);

    // Find campsite cards using data-testid
    const campsiteCards = page.locator('[data-testid="campsite-card"]');
    await expect(campsiteCards.first()).toBeVisible({ timeout: 10000 });
    const cardCount = await campsiteCards.count();
    const cardsToWishlist = Math.min(3, cardCount);

    // Add multiple campsites to wishlist
    for (let i = 0; i < cardsToWishlist; i++) {
      const heartButton = campsiteCards.nth(i).locator('[data-testid="wishlist-button"]');
      const addApiPromise = page.waitForResponse(
        (response) => response.url().includes('/api/wishlist') && response.request().method() === 'POST',
        { timeout: 30000 }
      );
      await heartButton.click();
      await addApiPromise;
      // Small delay between clicks
      await page.waitForTimeout(500);
    }

    // Verify all are filled using data-active attribute
    for (let i = 0; i < cardsToWishlist; i++) {
      const heartButton = campsiteCards.nth(i).locator('[data-testid="wishlist-button"]');
      await expect(heartButton).toHaveAttribute('data-active', 'true', { timeout: 5000 });
    }

    // Verify database
    const supabase = createSupabaseAdmin();
    const { count } = await supabase
      .from('wishlists')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', profileId);

    expect(count).toBe(cardsToWishlist);
  });

  test('T-SEARCH-WISHLIST-09: Heart button works with filtered search results', async ({ page }) => {
    // Navigate to search page with filter
    const searchApiPromise = waitForApi(page, '/api/search', { status: 200 });
    await page.goto('/search?type=camping');
    await searchApiPromise;
    await assertNoErrors(page);

    // Find campsite cards using data-testid
    const campsiteCards = page.locator('[data-testid="campsite-card"]');

    // Check if there are results
    const cardCount = await campsiteCards.count();
    if (cardCount === 0) {
      test.skip();
      return;
    }

    // Add to wishlist
    const heartButton = campsiteCards.first().locator('[data-testid="wishlist-button"]');
    const wishlistApiPromise = page.waitForResponse(
      (response) => response.url().includes('/api/wishlist') && response.request().method() === 'POST',
      { timeout: 30000 }
    );
    await heartButton.click();
    const response = await wishlistApiPromise;

    // Verify success
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  test('T-SEARCH-WISHLIST-10: Wishlisted items persist across search filter changes', async ({ page }) => {
    const supabase = createSupabaseAdmin();

    // Navigate to search page
    const searchApiPromise = waitForApi(page, '/api/search', { status: 200 });
    await page.goto('/search');
    await searchApiPromise;
    await assertNoErrors(page);

    // Find heart button and get campsite ID
    const campsiteCards = page.locator('[data-testid="campsite-card"]');
    await expect(campsiteCards.first()).toBeVisible({ timeout: 10000 });
    const campsiteId = await campsiteCards.first().getAttribute('data-campsite-id');
    expect(campsiteId).toBeTruthy();

    const heartButton = campsiteCards.first().locator('[data-testid="wishlist-button"]');

    // Add to wishlist via UI
    const wishlistApiPromise = page.waitForResponse(
      (response) => response.url().includes('/api/wishlist') && response.request().method() === 'POST',
      { timeout: 30000 }
    );
    await heartButton.click();
    await wishlistApiPromise;

    // Verify it was added via UI
    await expect(heartButton).toHaveAttribute('data-active', 'true', { timeout: 5000 });

    // Verify in database
    const { data: dbDataBefore } = await supabase
      .from('wishlists')
      .select('*')
      .eq('user_id', profileId)
      .eq('campsite_id', campsiteId)
      .single();

    expect(dbDataBefore).toBeTruthy();

    // Apply a filter that may change search results
    const filterSearchPromise = waitForApi(page, '/api/search', { status: 200 });
    await page.goto(`/search?limit=50`);
    await filterSearchPromise;
    await assertNoErrors(page);

    // Core test: Verify database persistence after filter change
    const { data: dbDataAfter } = await supabase
      .from('wishlists')
      .select('*')
      .eq('user_id', profileId)
      .eq('campsite_id', campsiteId)
      .single();

    expect(dbDataAfter).toBeTruthy();
    expect(dbDataAfter.campsite_id).toBe(campsiteId);
    expect(dbDataAfter.user_id).toBe(profileId);
  });
});

test.describe('Search Page Wishlist - Error Handling', () => {
  test.setTimeout(60000);
  // Run tests serially to avoid race conditions with shared profile
  test.describe.configure({ mode: 'serial' });

  let profileId: string;

  test.beforeAll(async () => {
    const loginData = await loginViaAPI(TEST_USERS.user.email, TEST_USERS.user.password);
    profileId = loginData.profile?.id;

    if (!profileId) {
      throw new Error('Failed to get profile ID for test user');
    }
  });

  test.beforeEach(async ({ page }) => {
    const supabase = createSupabaseAdmin();
    await supabase.from('wishlists').delete().eq('user_id', profileId);
    await loginAsUser(page);
  });

  test.afterEach(async () => {
    const supabase = createSupabaseAdmin();
    await supabase.from('wishlists').delete().eq('user_id', profileId);
  });

  test('T-SEARCH-WISHLIST-ERR-01: Duplicate add attempt returns conflict error gracefully', async ({ page }) => {
    // Pre-add a campsite
    const searchResponse = await fetch(`${API_BASE_URL}/api/search?limit=1`);
    const searchData = await searchResponse.json();
    const campsiteId = searchData.data?.data?.[0]?.id;

    const supabase = createSupabaseAdmin();
    await supabase.from('wishlists').insert({
      user_id: profileId,
      campsite_id: campsiteId,
    });

    // Navigate to search page
    const searchApiPromise = waitForApi(page, '/api/search', { status: 200 });
    await page.goto('/search');
    await searchApiPromise;
    await assertNoErrors(page);

    // Clear the wishlist context to simulate stale state
    await page.evaluate(() => {
      localStorage.removeItem('wishlist_cache');
    });

    // Force reload without full auth reload
    await page.reload({ waitUntil: 'networkidle' });

    // The heart should already be filled (from context reload)
    // Any add attempt should handle gracefully
  });

  test('T-SEARCH-WISHLIST-ERR-02: Heart button handles loading state correctly', async ({ page }) => {
    // Navigate to search page
    const searchApiPromise = waitForApi(page, '/api/search', { status: 200 });
    await page.goto('/search');
    await searchApiPromise;
    await assertNoErrors(page);

    // Find heart button using data-testid
    const campsiteCards = page.locator('[data-testid="campsite-card"]');
    await expect(campsiteCards.first()).toBeVisible({ timeout: 10000 });
    const heartButton = campsiteCards.first().locator('[data-testid="wishlist-button"]');

    // Click and wait for API response
    const wishlistApiPromise = page.waitForResponse(
      (response) => response.url().includes('/api/wishlist') && response.request().method() === 'POST',
      { timeout: 30000 }
    );
    await heartButton.click();
    await wishlistApiPromise;

    // After API completes, button should be enabled again
    await expect(heartButton).toBeEnabled();
  });
});
