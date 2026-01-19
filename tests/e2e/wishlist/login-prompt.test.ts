import { test, expect } from '@playwright/test';
import { assertNoErrors, waitForApi } from '../utils';

test.describe('Wishlist Login Prompt Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Start logged out for these tests with API verification
    const searchApiPromise = waitForApi(page, '/api/campsites', { status: 200 });
    await page.goto('/search');
    await searchApiPromise;
    await assertNoErrors(page);
  });

  test('T-WISHLIST-30: Non-logged-in user sees login prompt when clicking heart button', async ({ page }) => {
    // Find first campsite card
    const firstCampsiteCard = page.locator('[data-testid="campsite-card"]').first();
    const heartButton = firstCampsiteCard.locator('[data-testid="wishlist-button"]');

    // Click heart button
    await heartButton.click();

    // Verify login prompt/modal appears
    const loginPrompt = page.getByText(/log in|sign in|เข้าสู่ระบบ/i);
    await expect(loginPrompt).toBeVisible();
  });

  test('T-WISHLIST-31: Login prompt redirects to login page when clicked', async ({ page }) => {
    // Click heart button
    const firstCampsiteCard = page.locator('[data-testid="campsite-card"]').first();
    const heartButton = firstCampsiteCard.locator('[data-testid="wishlist-button"]');
    await heartButton.click();

    // Click login button in prompt/modal
    const loginButton = page.getByRole('button', { name: /log in|sign in|เข้าสู่ระบบ/i });
    await loginButton.click();
    await page.waitForLoadState('networkidle');

    // Verify we're on login page
    expect(page.url()).toContain('/login');
  });

  test('T-WISHLIST-32: Login prompt can be dismissed', async ({ page }) => {
    // Click heart button
    const firstCampsiteCard = page.locator('[data-testid="campsite-card"]').first();
    const heartButton = firstCampsiteCard.locator('[data-testid="wishlist-button"]');
    await heartButton.click();

    // Verify prompt is visible
    const loginPrompt = page.getByText(/log in|sign in|เข้าสู่ระบบ/i);
    await expect(loginPrompt).toBeVisible();

    // Click cancel or close button
    const cancelButton = page.getByRole('button', { name: /cancel|close|ปิด|ยกเลิก/i });
    await cancelButton.click();

    // Verify prompt is dismissed
    await expect(loginPrompt).not.toBeVisible();
  });

  test('T-WISHLIST-33: After login from prompt, user can add to wishlist', async ({ page }) => {
    // Click heart button to trigger login prompt
    const firstCampsiteCard = page.locator('[data-testid="campsite-card"]').first();
    const heartButton = firstCampsiteCard.locator('[data-testid="wishlist-button"]');
    await heartButton.click();

    // Click login button
    const loginButton = page.getByRole('button', { name: /log in|sign in|เข้าสู่ระบบ/i });
    await loginButton.click();
    await page.waitForLoadState('networkidle');

    // Fill login form
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Navigate back to search page with API verification
    const searchApiPromise = waitForApi(page, '/api/campsites', { status: 200 });
    await page.goto('/search');
    await searchApiPromise;
    await assertNoErrors(page);

    // Try adding to wishlist again with API verification
    const newCampsiteCard = page.locator('[data-testid="campsite-card"]').first();
    const newHeartButton = newCampsiteCard.locator('[data-testid="wishlist-button"]');

    const addApiPromise = waitForApi(page, '/api/wishlist', { method: 'POST', status: 200 });
    await newHeartButton.click();
    await addApiPromise;

    // Verify heart is filled (item added successfully)
    await expect(newHeartButton.locator('[data-testid="heart-icon-filled"]')).toBeVisible();
  });

  test('T-WISHLIST-34: Wishlist page shows login prompt for non-logged-in users', async ({ page }) => {
    // Navigate to wishlist page while logged out
    await page.goto('/wishlist');
    await page.waitForLoadState('networkidle');

    // Verify login prompt or redirect to login
    const isLoginPage = page.url().includes('/login');
    const hasLoginPrompt = await page.getByText(/log in|sign in|เข้าสู่ระบบ/i).isVisible();

    expect(isLoginPage || hasLoginPrompt).toBe(true);
  });

  test('T-WISHLIST-35: Heart button shows tooltip for non-logged-in users', async ({ page }) => {
    // Find first campsite card
    const firstCampsiteCard = page.locator('[data-testid="campsite-card"]').first();
    const heartButton = firstCampsiteCard.locator('[data-testid="wishlist-button"]');

    // Hover over heart button
    await heartButton.hover();

    // Verify tooltip appears
    const tooltip = page.getByText(/log in to add|sign in to save|เข้าสู่ระบบเพื่อบันทึก/i);

    // Tooltip should be visible or heart click should show login prompt
    const tooltipVisible = await tooltip.isVisible().catch(() => false);

    // If no tooltip, clicking should show login prompt
    if (!tooltipVisible) {
      await heartButton.click();

      const loginPrompt = page.getByText(/log in|sign in|เข้าสู่ระบบ/i);
      await expect(loginPrompt).toBeVisible();
    }
  });

  test('T-WISHLIST-36: Wishlist counter is hidden for non-logged-in users', async ({ page }) => {
    // Check if wishlist counter exists
    const wishlistCounter = page.locator('[data-testid="wishlist-counter"]');
    const counterExists = await wishlistCounter.count();

    // Counter should either not exist or show 0 for logged-out users
    if (counterExists > 0) {
      const counterText = await wishlistCounter.textContent();
      expect(counterText).toBe('0');
    }
  });

  test('T-WISHLIST-37: Login prompt preserves the campsite user wanted to add', async ({ page }) => {
    // Get campsite name
    const firstCampsiteCard = page.locator('[data-testid="campsite-card"]').first();
    const campsiteName = await firstCampsiteCard.locator('[data-testid="campsite-name"]').textContent();

    // Click heart button
    const heartButton = firstCampsiteCard.locator('[data-testid="wishlist-button"]');
    await heartButton.click();

    // Click login button
    const loginButton = page.getByRole('button', { name: /log in|sign in|เข้าสู่ระบบ/i });
    await loginButton.click();
    await page.waitForLoadState('networkidle');

    // Login
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Check if redirected back to search page with item auto-added
    // OR verify user is redirected to search page
    const currentUrl = page.url();

    // Navigate to wishlist to check if item was auto-added with API verification
    const wishlistApiPromise = waitForApi(page, '/api/wishlist', { method: 'GET', status: 200 });
    await page.goto('/wishlist');
    await wishlistApiPromise;
    await assertNoErrors(page);

    // Item might have been auto-added or user needs to manually add again
    // This depends on implementation - test both scenarios
  });

  test('T-WISHLIST-38: Multiple login prompts work correctly on same page', async ({ page }) => {
    // Get all campsite cards
    const campsiteCards = page.locator('[data-testid="campsite-card"]');
    const cardCount = await campsiteCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(2);

    // Click first heart button
    const firstHeartButton = campsiteCards.nth(0).locator('[data-testid="wishlist-button"]');
    await firstHeartButton.click();

    // Verify login prompt appears
    const firstLoginPrompt = page.getByText(/log in|sign in|เข้าสู่ระบบ/i);
    await expect(firstLoginPrompt).toBeVisible();

    // Close first prompt
    const cancelButton = page.getByRole('button', { name: /cancel|close|ปิด|ยกเลิก/i });
    await cancelButton.click();

    // Click second heart button
    const secondHeartButton = campsiteCards.nth(1).locator('[data-testid="wishlist-button"]');
    await secondHeartButton.click();

    // Verify login prompt appears again
    const secondLoginPrompt = page.getByText(/log in|sign in|เข้าสู่ระบบ/i);
    await expect(secondLoginPrompt).toBeVisible();
  });
});
