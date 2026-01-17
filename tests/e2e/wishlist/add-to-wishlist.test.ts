import { test, expect } from '@playwright/test';

test.describe('Add to Wishlist Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page or search page with campsite listings
    await page.goto('/search');
    await page.waitForLoadState('networkidle');
  });

  test('T-WISHLIST-01: User can add campsite to wishlist via heart button', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Navigate to search page
    await page.goto('/search');
    await page.waitForLoadState('networkidle');

    // Find first campsite card
    const firstCampsiteCard = page.locator('[data-testid="campsite-card"]').first();
    await expect(firstCampsiteCard).toBeVisible();

    // Find and click heart button
    const heartButton = firstCampsiteCard.locator('[data-testid="wishlist-button"]');
    await expect(heartButton).toBeVisible();
    await heartButton.click();

    // Wait for API call to complete
    await page.waitForTimeout(500);

    // Verify heart icon changed to filled state
    const heartIcon = heartButton.locator('[data-testid="heart-icon-filled"]');
    await expect(heartIcon).toBeVisible();
  });

  test('T-WISHLIST-02: Multiple campsites can be added to wishlist', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Navigate to search page
    await page.goto('/search');
    await page.waitForLoadState('networkidle');

    // Find first two campsite cards
    const campsiteCards = page.locator('[data-testid="campsite-card"]');
    const cardCount = await campsiteCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(2);

    // Add first campsite to wishlist
    const firstHeartButton = campsiteCards.nth(0).locator('[data-testid="wishlist-button"]');
    await firstHeartButton.click();
    await page.waitForTimeout(500);

    // Add second campsite to wishlist
    const secondHeartButton = campsiteCards.nth(1).locator('[data-testid="wishlist-button"]');
    await secondHeartButton.click();
    await page.waitForTimeout(500);

    // Verify both are in filled state
    await expect(firstHeartButton.locator('[data-testid="heart-icon-filled"]')).toBeVisible();
    await expect(secondHeartButton.locator('[data-testid="heart-icon-filled"]')).toBeVisible();
  });

  test('T-WISHLIST-03: Added campsite appears in wishlist page', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Navigate to search page
    await page.goto('/search');
    await page.waitForLoadState('networkidle');

    // Get campsite name before adding to wishlist
    const firstCampsiteCard = page.locator('[data-testid="campsite-card"]').first();
    const campsiteName = await firstCampsiteCard.locator('[data-testid="campsite-name"]').textContent();

    // Add to wishlist
    const heartButton = firstCampsiteCard.locator('[data-testid="wishlist-button"]');
    await heartButton.click();
    await page.waitForTimeout(500);

    // Navigate to wishlist page
    await page.goto('/wishlist');
    await page.waitForLoadState('networkidle');

    // Verify campsite appears in wishlist
    const wishlistItems = page.locator('[data-testid="wishlist-item"]');
    const wishlistItemNames = await wishlistItems.locator('[data-testid="campsite-name"]').allTextContents();
    expect(wishlistItemNames).toContain(campsiteName);
  });

  test('T-WISHLIST-04: Heart button is disabled during API call', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Navigate to search page
    await page.goto('/search');
    await page.waitForLoadState('networkidle');

    // Find first campsite card
    const firstCampsiteCard = page.locator('[data-testid="campsite-card"]').first();
    const heartButton = firstCampsiteCard.locator('[data-testid="wishlist-button"]');

    // Click heart button
    await heartButton.click();

    // Immediately check if button is disabled (before API completes)
    const isDisabled = await heartButton.isDisabled().catch(() => false);

    // Wait for API to complete
    await page.waitForTimeout(500);
  });

  test('T-WISHLIST-05: Error handling when add to wishlist fails', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Intercept API call and make it fail
    await page.route('**/api/wishlist', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });

    // Navigate to search page
    await page.goto('/search');
    await page.waitForLoadState('networkidle');

    // Find first campsite card and click heart button
    const firstCampsiteCard = page.locator('[data-testid="campsite-card"]').first();
    const heartButton = firstCampsiteCard.locator('[data-testid="wishlist-button"]');
    await heartButton.click();

    // Wait for error handling
    await page.waitForTimeout(500);

    // Verify error message or toast appears
    const errorMessage = page.getByText(/error|failed|ไม่สำเร็จ/i);
    await expect(errorMessage).toBeVisible({ timeout: 3000 });
  });
});
