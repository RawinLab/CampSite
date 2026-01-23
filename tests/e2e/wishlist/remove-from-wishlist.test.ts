import { test, expect } from '@playwright/test';
import { loginAsUser, createSupabaseAdmin, waitForApi, assertNoErrors, loginViaAPI, TEST_USERS } from '../utils';

test.describe('Remove from Wishlist Functionality', () => {
  test.setTimeout(60000);

  let userId: string;

  test.beforeAll(async () => {
    // Get profile ID by logging in via API (wishlists.user_id references profiles.id)
    const loginData = await loginViaAPI(TEST_USERS.user.email, TEST_USERS.user.password);
    userId = loginData.profile?.id;

    if (!userId) {
      throw new Error('Failed to get profile ID for test user');
    }

    console.log('Test user profile ID:', userId);
  });

  test.beforeEach(async ({ page }) => {
    // Clean up wishlist and add test item before each test
    const supabase = createSupabaseAdmin();
    await supabase.from('wishlists').delete().eq('user_id', userId);

    // Add the test campsite to wishlist for removal tests
    await supabase.from('wishlists').insert({
      user_id: userId,
      campsite_id: 'e2e-test-campsite-approved-1',
    });

    // Login as user
    await loginAsUser(page);
  });

  test.afterEach(async () => {
    // Clean up wishlist after each test
    const supabase = createSupabaseAdmin();
    await supabase.from('wishlists').delete().eq('user_id', userId);
  });

  test('T-WISHLIST-06: User can remove campsite from wishlist via heart button', async ({ page }) => {
    // Navigate to the test campsite (already in wishlist from beforeEach)
    const detailApiPromise = waitForApi(page, '/api/campsites/e2e-test-campsite-approved-1', { status: 200 });
    await page.goto('/campsites/e2e-test-campsite-approved-1');
    await detailApiPromise;
    await assertNoErrors(page);

    // Verify campsite is in wishlist
    const supabase = createSupabaseAdmin();
    const { data: before } = await supabase
      .from('wishlists')
      .select('*')
      .eq('user_id', userId)
      .eq('campsite_id', 'e2e-test-campsite-approved-1')
      .single();

    expect(before).toBeTruthy();

    // Find and click heart button to remove with API verification
    const wishlistButton = page.locator('[data-testid="wishlist-button"]');
    await expect(wishlistButton).toBeVisible({ timeout: 10000 });

    const removeApiPromise = waitForApi(page, '/api/wishlist', { method: 'DELETE', status: 200 });
    await wishlistButton.click();
    const response = await removeApiPromise;

    // Verify API response
    const data = await response.json();
    expect(data.success).toBe(true);

    // Verify UI updated to show inactive state
    await expect(wishlistButton).toHaveAttribute('data-active', 'false');

    // Verify it's removed from database
    const { data: after } = await supabase
      .from('wishlists')
      .select('*')
      .eq('user_id', userId)
      .eq('campsite_id', 'e2e-test-campsite-approved-1')
      .maybeSingle();

    expect(after).toBeNull();
  });

  test('T-WISHLIST-07: Removed campsite disappears from wishlist page', async ({ page }) => {
    // Navigate to wishlist page with API verification
    const wishlistApiPromise = waitForApi(page, '/api/wishlist', { method: 'GET', status: 200 });
    await page.goto('/wishlist');
    await wishlistApiPromise;
    await assertNoErrors(page);

    // Verify item is there (added in beforeEach)
    const wishlistContent = await page.textContent('body');
    expect(wishlistContent).toContain('E2E Test Campsite - Approved');

    // Find and remove from wishlist with API verification
    const wishlistButton = page.locator('[data-testid="wishlist-button"]').first();
    const removeApiPromise = waitForApi(page, '/api/wishlist', { method: 'DELETE', status: 200 });
    await wishlistButton.click();
    const response = await removeApiPromise;

    const data = await response.json();
    expect(data.success).toBe(true);

    // Reload page and verify item is removed
    const reloadApiPromise = waitForApi(page, '/api/wishlist', { method: 'GET', status: 200 });
    await page.reload();
    const reloadResponse = await reloadApiPromise;
    await assertNoErrors(page);

    // Verify API returns empty or no matching items
    const reloadData = await reloadResponse.json();
    expect(reloadData.success).toBe(true);

    // Verify wishlist is empty or item not present
    const supabase = createSupabaseAdmin();
    const { data: dbData } = await supabase
      .from('wishlists')
      .select('*')
      .eq('user_id', userId)
      .eq('campsite_id', 'e2e-test-campsite-approved-1')
      .maybeSingle();

    expect(dbData).toBeNull();
  });

  test('T-WISHLIST-08: Wishlist page reflects database state', async ({ page }) => {
    // Navigate to wishlist page with API verification
    const wishlistApiPromise = waitForApi(page, '/api/wishlist', { method: 'GET', status: 200 });
    await page.goto('/wishlist');
    const wishlistResponse = await wishlistApiPromise;
    await assertNoErrors(page);

    // Verify the pre-added item is in API response
    const wishlistData = await wishlistResponse.json();
    expect(wishlistData.success).toBe(true);
    expect(wishlistData.data).toBeDefined();

    // Verify the pre-added item is visible in UI
    const wishlistContent = await page.textContent('body');
    expect(wishlistContent).toContain('E2E Test Campsite - Approved');

    // Verify database has the item
    const supabase = createSupabaseAdmin();
    const { data } = await supabase
      .from('wishlists')
      .select('*')
      .eq('user_id', userId)
      .eq('campsite_id', 'e2e-test-campsite-approved-1')
      .single();

    expect(data).toBeTruthy();

    // Click remove button with API verification
    const removeButton = page.locator('[data-testid="wishlist-button"]').first();
    const removeApiPromise = waitForApi(page, '/api/wishlist', { method: 'DELETE', status: 200 });
    await removeButton.click();
    const removeResponse = await removeApiPromise;

    const removeData = await removeResponse.json();
    expect(removeData.success).toBe(true);

    // Verify database no longer has the item
    const { data: afterRemoval } = await supabase
      .from('wishlists')
      .select('*')
      .eq('user_id', userId)
      .eq('campsite_id', 'e2e-test-campsite-approved-1')
      .maybeSingle();

    expect(afterRemoval).toBeNull();
  });

  test('T-WISHLIST-09: Removing item shows empty state when no items remain', async ({ page }) => {
    // Navigate to wishlist page (has one item from beforeEach)
    const wishlistApiPromise = waitForApi(page, '/api/wishlist', { method: 'GET', status: 200 });
    await page.goto('/wishlist');
    await wishlistApiPromise;
    await assertNoErrors(page);

    // Remove the item with API verification
    const removeButton = page.locator('[data-testid="wishlist-button"]').first();
    const removeApiPromise = waitForApi(page, '/api/wishlist', { method: 'DELETE', status: 200 });
    await removeButton.click();
    const removeResponse = await removeApiPromise;

    const removeData = await removeResponse.json();
    expect(removeData.success).toBe(true);

    // Reload to see empty state with API verification
    const reloadApiPromise = waitForApi(page, '/api/wishlist', { method: 'GET', status: 200 });
    await page.reload();
    const reloadResponse = await reloadApiPromise;
    await assertNoErrors(page);

    // Verify API returns empty data
    const reloadData = await reloadResponse.json();
    expect(reloadData.success).toBe(true);

    // Verify empty state in database
    const supabase = createSupabaseAdmin();
    const { data } = await supabase
      .from('wishlists')
      .select('*')
      .eq('user_id', userId);

    expect(data).toHaveLength(0);

    // Check for empty state in UI
    const bodyContent = await page.textContent('body');
    const hasContent = bodyContent?.includes('E2E Test Campsite - Approved');
    expect(hasContent).toBeFalsy();
  });

  test('T-WISHLIST-10: Can toggle wishlist on and off multiple times', async ({ page }) => {
    // Navigate to the test campsite with API verification
    const detailApiPromise = waitForApi(page, '/api/campsites/e2e-test-campsite-approved-1', { status: 200 });
    await page.goto('/campsites/e2e-test-campsite-approved-1');
    await detailApiPromise;
    await assertNoErrors(page);

    const supabase = createSupabaseAdmin();

    // Verify it's in wishlist (from beforeEach)
    const { data: initial } = await supabase
      .from('wishlists')
      .select('*')
      .eq('user_id', userId)
      .eq('campsite_id', 'e2e-test-campsite-approved-1')
      .maybeSingle();
    expect(initial).toBeTruthy();

    // Remove from wishlist with API verification
    const wishlistButton = page.locator('[data-testid="wishlist-button"]');
    const removeApiPromise = waitForApi(page, '/api/wishlist', { method: 'DELETE', status: 200 });
    await wishlistButton.click();
    const removeResponse = await removeApiPromise;

    const removeData = await removeResponse.json();
    expect(removeData.success).toBe(true);

    // Verify removed
    const { data: afterRemove } = await supabase
      .from('wishlists')
      .select('*')
      .eq('user_id', userId)
      .eq('campsite_id', 'e2e-test-campsite-approved-1')
      .maybeSingle();
    expect(afterRemove).toBeNull();

    // Add back to wishlist with API verification
    const addApiPromise = waitForApi(page, '/api/wishlist', { method: 'POST', status: 200 });
    await wishlistButton.click();
    const addResponse = await addApiPromise;

    const addData = await addResponse.json();
    expect(addData.success).toBe(true);

    // Verify added again
    const { data: afterAdd } = await supabase
      .from('wishlists')
      .select('*')
      .eq('user_id', userId)
      .eq('campsite_id', 'e2e-test-campsite-approved-1')
      .maybeSingle();
    expect(afterAdd).toBeTruthy();
  });
});
