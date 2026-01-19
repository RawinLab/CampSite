import { test, expect } from '@playwright/test';
import { loginAsUser, createSupabaseAdmin, waitForApi, assertNoErrors } from '../utils';

test.describe('Add to Wishlist Functionality', () => {
  test.setTimeout(60000);

  let userId: string;

  test.beforeAll(async () => {
    // Get user ID for cleanup
    const supabase = createSupabaseAdmin();
    const { data } = await supabase
      .from('profiles')
      .select('auth_user_id')
      .eq('email', 'user@campsite.local')
      .single();
    userId = data?.auth_user_id;
  });

  test.beforeEach(async ({ page }) => {
    // Clean up wishlist before each test
    const supabase = createSupabaseAdmin();
    await supabase.from('wishlists').delete().eq('user_id', userId);

    // Login as user
    await loginAsUser(page);
  });

  test.afterEach(async () => {
    // Clean up wishlist after each test
    const supabase = createSupabaseAdmin();
    await supabase.from('wishlists').delete().eq('user_id', userId);
  });

  test('T-WISHLIST-01: User can add campsite to wishlist via heart button', async ({ page }) => {
    // Navigate to the approved test campsite with API verification
    const detailApiPromise = waitForApi(page, '/api/campsites/e2e-test-campsite-approved-1', { status: 200 });
    await page.goto('/campsites/e2e-test-campsite-approved-1');
    await detailApiPromise;
    await assertNoErrors(page);

    // Find and click heart button - wait for wishlist API
    const wishlistButton = page.locator('[data-testid="wishlist-button"]');
    await expect(wishlistButton).toBeVisible({ timeout: 10000 });

    const wishlistApiPromise = waitForApi(page, '/api/wishlist', { method: 'POST', status: 200 });
    await wishlistButton.click();
    const response = await wishlistApiPromise;

    // Verify API response
    const data = await response.json();
    expect(data.success).toBe(true);

    // Verify UI updated to show active state
    await expect(wishlistButton).toHaveAttribute('data-active', 'true');

    // Verify wishlist was added to database
    const supabase = createSupabaseAdmin();
    const { data: dbData } = await supabase
      .from('wishlists')
      .select('*')
      .eq('user_id', userId)
      .eq('campsite_id', 'e2e-test-campsite-approved-1')
      .single();

    expect(dbData).toBeTruthy();
  });

  test('T-WISHLIST-02: Added campsite appears in wishlist page', async ({ page }) => {
    // Navigate to the approved test campsite with API verification
    const detailApiPromise = waitForApi(page, '/api/campsites/e2e-test-campsite-approved-1', { status: 200 });
    await page.goto('/campsites/e2e-test-campsite-approved-1');
    await detailApiPromise;
    await assertNoErrors(page);

    // Get campsite name
    const campsiteName = await page.locator('h1, [data-testid="campsite-name"]').first().textContent();

    // Add to wishlist with API verification
    const wishlistButton = page.locator('[data-testid="wishlist-button"]');
    const addApiPromise = waitForApi(page, '/api/wishlist', { method: 'POST', status: 200 });
    await wishlistButton.click();
    const addResponse = await addApiPromise;

    const addData = await addResponse.json();
    expect(addData.success).toBe(true);

    // Navigate to wishlist page with API verification
    const wishlistApiPromise = waitForApi(page, '/api/wishlist', { method: 'GET', status: 200 });
    await page.goto('/wishlist');
    const wishlistResponse = await wishlistApiPromise;
    await assertNoErrors(page);

    // Verify API returned the campsite
    const wishlistData = await wishlistResponse.json();
    expect(wishlistData.success).toBe(true);
    expect(wishlistData.data).toBeDefined();

    // Verify campsite appears in wishlist UI
    const wishlistContent = await page.textContent('body');
    expect(wishlistContent).toContain('E2E Test Campsite - Approved');
  });

  test('T-WISHLIST-03: Heart button state reflects wishlist status', async ({ page }) => {
    // Navigate to the approved test campsite with API verification
    const detailApiPromise = waitForApi(page, '/api/campsites/e2e-test-campsite-approved-1', { status: 200 });
    await page.goto('/campsites/e2e-test-campsite-approved-1');
    await detailApiPromise;
    await assertNoErrors(page);

    // Find heart button
    const wishlistButton = page.locator('[data-testid="wishlist-button"]');
    await expect(wishlistButton).toBeVisible({ timeout: 10000 });

    // Click to add to wishlist with API verification
    const addApiPromise = waitForApi(page, '/api/wishlist', { method: 'POST', status: 200 });
    await wishlistButton.click();
    const addResponse = await addApiPromise;

    const addData = await addResponse.json();
    expect(addData.success).toBe(true);

    // Reload page to verify state persists
    const reloadApiPromise = waitForApi(page, '/api/campsites/e2e-test-campsite-approved-1', { status: 200 });
    await page.reload();
    await reloadApiPromise;
    await assertNoErrors(page);

    // Verify wishlist button shows active state after reload
    await expect(wishlistButton).toHaveAttribute('data-active', 'true');

    // Verify database state
    const supabase = createSupabaseAdmin();
    const { data } = await supabase
      .from('wishlists')
      .select('*')
      .eq('user_id', userId)
      .eq('campsite_id', 'e2e-test-campsite-approved-1')
      .single();

    expect(data).toBeTruthy();
  });
});
