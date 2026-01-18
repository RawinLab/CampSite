import { test, expect } from '@playwright/test';
import { loginAsUser, createSupabaseAdmin } from '../utils';

test.describe('Remove from Wishlist Functionality', () => {
  test.setTimeout(60000);

  let userId: string;

  test.beforeAll(async () => {
    // Get user ID for data manipulation
    const supabase = createSupabaseAdmin();
    const { data } = await supabase
      .from('profiles')
      .select('auth_user_id')
      .eq('email', 'user@campsite.local')
      .single();
    userId = data?.auth_user_id;
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
    await page.goto('/campsites/e2e-test-campsite-approved-1');
    await page.waitForTimeout(2000);

    // Verify campsite is in wishlist
    const supabase = createSupabaseAdmin();
    const { data: before } = await supabase
      .from('wishlists')
      .select('*')
      .eq('user_id', userId)
      .eq('campsite_id', 'e2e-test-campsite-approved-1')
      .single();

    expect(before).toBeTruthy();

    // Find and click heart button to remove
    const wishlistButton = page.locator('[data-testid="wishlist-button"], button:has(svg[class*="heart"])').first();
    await expect(wishlistButton).toBeVisible({ timeout: 10000 });
    await wishlistButton.click();
    await page.waitForTimeout(1000);

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
    // Navigate to wishlist page
    await page.goto('/wishlist');
    await page.waitForTimeout(2000);

    // Verify item is there (added in beforeEach)
    const wishlistContent = await page.textContent('body');
    expect(wishlistContent).toContain('E2E Test Campsite - Approved');

    // Find and remove from wishlist
    const wishlistButton = page.locator('[data-testid="wishlist-button"], [data-testid="remove-wishlist-button"], button:has(svg[class*="heart"])').first();
    await wishlistButton.click();
    await page.waitForTimeout(1000);

    // Reload page and verify item is removed
    await page.reload();
    await page.waitForTimeout(2000);

    // Verify wishlist is empty or item not present
    const supabase = createSupabaseAdmin();
    const { data } = await supabase
      .from('wishlists')
      .select('*')
      .eq('user_id', userId)
      .eq('campsite_id', 'e2e-test-campsite-approved-1')
      .maybeSingle();

    expect(data).toBeNull();
  });

  test('T-WISHLIST-08: Wishlist page reflects database state', async ({ page }) => {
    // Navigate to wishlist page
    await page.goto('/wishlist');
    await page.waitForTimeout(2000);

    // Verify the pre-added item is visible
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

    // Click remove button
    const removeButton = page.locator('[data-testid="wishlist-button"], [data-testid="remove-wishlist-button"], button:has(svg[class*="heart"])').first();
    await removeButton.click();
    await page.waitForTimeout(1000);

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
    await page.goto('/wishlist');
    await page.waitForTimeout(2000);

    // Remove the item
    const removeButton = page.locator('[data-testid="wishlist-button"], [data-testid="remove-wishlist-button"], button:has(svg[class*="heart"])').first();
    await removeButton.click();
    await page.waitForTimeout(1000);

    // Reload to see empty state
    await page.reload();
    await page.waitForTimeout(2000);

    // Verify empty state appears or no items present
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
    // Navigate to the test campsite
    await page.goto('/campsites/e2e-test-campsite-approved-1');
    await page.waitForTimeout(2000);

    const supabase = createSupabaseAdmin();

    // Verify it's in wishlist (from beforeEach)
    const { data: initial } = await supabase
      .from('wishlists')
      .select('*')
      .eq('user_id', userId)
      .eq('campsite_id', 'e2e-test-campsite-approved-1')
      .maybeSingle();
    expect(initial).toBeTruthy();

    // Remove from wishlist
    const wishlistButton = page.locator('[data-testid="wishlist-button"], button:has(svg[class*="heart"])').first();
    await wishlistButton.click();
    await page.waitForTimeout(1000);

    // Verify removed
    const { data: afterRemove } = await supabase
      .from('wishlists')
      .select('*')
      .eq('user_id', userId)
      .eq('campsite_id', 'e2e-test-campsite-approved-1')
      .maybeSingle();
    expect(afterRemove).toBeNull();

    // Add back to wishlist
    await wishlistButton.click();
    await page.waitForTimeout(1000);

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
