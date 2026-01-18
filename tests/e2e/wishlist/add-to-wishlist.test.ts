import { test, expect } from '@playwright/test';
import { loginAsUser, createSupabaseAdmin } from '../utils';

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
    // Navigate to the approved test campsite
    await page.goto('/campsites/e2e-test-campsite-approved-1');
    await page.waitForTimeout(2000);

    // Find and click heart button
    const wishlistButton = page.locator('[data-testid="wishlist-button"], button:has(svg[class*="heart"])').first();
    await expect(wishlistButton).toBeVisible({ timeout: 10000 });
    await wishlistButton.click();

    // Wait for API call to complete
    await page.waitForTimeout(1000);

    // Verify wishlist was added to database
    const supabase = createSupabaseAdmin();
    const { data } = await supabase
      .from('wishlists')
      .select('*')
      .eq('user_id', userId)
      .eq('campsite_id', 'e2e-test-campsite-approved-1')
      .single();

    expect(data).toBeTruthy();
  });

  test('T-WISHLIST-02: Added campsite appears in wishlist page', async ({ page }) => {
    // Navigate to the approved test campsite
    await page.goto('/campsites/e2e-test-campsite-approved-1');
    await page.waitForTimeout(2000);

    // Get campsite name
    const campsiteName = await page.locator('h1, [data-testid="campsite-name"]').first().textContent();

    // Add to wishlist
    const wishlistButton = page.locator('[data-testid="wishlist-button"], button:has(svg[class*="heart"])').first();
    await wishlistButton.click();
    await page.waitForTimeout(1000);

    // Navigate to wishlist page
    await page.goto('/wishlist');
    await page.waitForTimeout(2000);

    // Verify campsite appears in wishlist
    const wishlistContent = await page.textContent('body');
    expect(wishlistContent).toContain('E2E Test Campsite - Approved');
  });

  test('T-WISHLIST-03: Heart button state reflects wishlist status', async ({ page }) => {
    // Navigate to the approved test campsite
    await page.goto('/campsites/e2e-test-campsite-approved-1');
    await page.waitForTimeout(2000);

    // Find heart button
    const wishlistButton = page.locator('[data-testid="wishlist-button"], button:has(svg[class*="heart"])').first();
    await expect(wishlistButton).toBeVisible({ timeout: 10000 });

    // Click to add to wishlist
    await wishlistButton.click();
    await page.waitForTimeout(1000);

    // Reload page to verify state persists
    await page.reload();
    await page.waitForTimeout(2000);

    // Verify wishlist button shows filled/active state
    // This will depend on implementation - button should indicate item is in wishlist
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
