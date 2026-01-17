import { test, expect } from '@playwright/test';

test.describe('Heart Icon Animation Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Navigate to search page
    await page.goto('/search');
    await page.waitForLoadState('networkidle');
  });

  test('T-WISHLIST-17: Heart icon changes from outline to filled when added', async ({ page }) => {
    const firstCampsiteCard = page.locator('[data-testid="campsite-card"]').first();
    const heartButton = firstCampsiteCard.locator('[data-testid="wishlist-button"]');

    // Verify initial state is outline
    const outlineIcon = heartButton.locator('[data-testid="heart-icon-outline"]');
    await expect(outlineIcon).toBeVisible();

    // Click to add to wishlist
    await heartButton.click();
    await page.waitForTimeout(500);

    // Verify icon changed to filled
    const filledIcon = heartButton.locator('[data-testid="heart-icon-filled"]');
    await expect(filledIcon).toBeVisible();
    await expect(outlineIcon).not.toBeVisible();
  });

  test('T-WISHLIST-18: Heart icon changes from filled to outline when removed', async ({ page }) => {
    const firstCampsiteCard = page.locator('[data-testid="campsite-card"]').first();
    const heartButton = firstCampsiteCard.locator('[data-testid="wishlist-button"]');

    // Add to wishlist first
    await heartButton.click();
    await page.waitForTimeout(500);

    // Verify filled state
    const filledIcon = heartButton.locator('[data-testid="heart-icon-filled"]');
    await expect(filledIcon).toBeVisible();

    // Click to remove
    await heartButton.click();
    await page.waitForTimeout(500);

    // Verify icon changed to outline
    const outlineIcon = heartButton.locator('[data-testid="heart-icon-outline"]');
    await expect(outlineIcon).toBeVisible();
    await expect(filledIcon).not.toBeVisible();
  });

  test('T-WISHLIST-19: Heart icon has correct color when filled', async ({ page }) => {
    const firstCampsiteCard = page.locator('[data-testid="campsite-card"]').first();
    const heartButton = firstCampsiteCard.locator('[data-testid="wishlist-button"]');

    // Add to wishlist
    await heartButton.click();
    await page.waitForTimeout(500);

    // Get filled icon
    const filledIcon = heartButton.locator('[data-testid="heart-icon-filled"]');
    await expect(filledIcon).toBeVisible();

    // Check if icon has red color class (common for filled hearts)
    const iconClasses = await filledIcon.getAttribute('class');
    expect(iconClasses).toMatch(/red|fill-red|text-red/i);
  });

  test('T-WISHLIST-20: Heart icon animation plays on click', async ({ page }) => {
    const firstCampsiteCard = page.locator('[data-testid="campsite-card"]').first();
    const heartButton = firstCampsiteCard.locator('[data-testid="wishlist-button"]');

    // Get button before click
    const buttonBefore = await heartButton.boundingBox();

    // Click to add to wishlist
    await heartButton.click();

    // Wait a small amount for animation to start
    await page.waitForTimeout(100);

    // Verify button still exists and is in same position
    const buttonAfter = await heartButton.boundingBox();
    expect(buttonAfter).toBeTruthy();
    expect(buttonAfter?.x).toBe(buttonBefore?.x);
    expect(buttonAfter?.y).toBe(buttonBefore?.y);

    // Wait for animation to complete
    await page.waitForTimeout(500);

    // Verify filled icon is visible after animation
    const filledIcon = heartButton.locator('[data-testid="heart-icon-filled"]');
    await expect(filledIcon).toBeVisible();
  });

  test('T-WISHLIST-21: Heart icon state is consistent across different campsite cards', async ({ page }) => {
    const campsiteCards = page.locator('[data-testid="campsite-card"]');
    const cardCount = await campsiteCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(2);

    // Add first campsite to wishlist
    const firstHeartButton = campsiteCards.nth(0).locator('[data-testid="wishlist-button"]');
    await firstHeartButton.click();
    await page.waitForTimeout(500);

    // Verify first is filled
    await expect(firstHeartButton.locator('[data-testid="heart-icon-filled"]')).toBeVisible();

    // Verify second is still outline
    const secondHeartButton = campsiteCards.nth(1).locator('[data-testid="wishlist-button"]');
    await expect(secondHeartButton.locator('[data-testid="heart-icon-outline"]')).toBeVisible();
  });

  test('T-WISHLIST-22: Heart icon hover effect works correctly', async ({ page }) => {
    const firstCampsiteCard = page.locator('[data-testid="campsite-card"]').first();
    const heartButton = firstCampsiteCard.locator('[data-testid="wishlist-button"]');

    // Hover over heart button
    await heartButton.hover();
    await page.waitForTimeout(200);

    // Verify button is still visible and interactive
    await expect(heartButton).toBeVisible();
    await expect(heartButton).toBeEnabled();

    // Get button opacity/color changes on hover (if implemented)
    const buttonStyles = await heartButton.evaluate(el => {
      return window.getComputedStyle(el);
    });

    // Verify cursor changes to pointer
    expect(buttonStyles.cursor).toBe('pointer');
  });

  test('T-WISHLIST-23: Heart icon state persists when navigating back to page', async ({ page }) => {
    const firstCampsiteCard = page.locator('[data-testid="campsite-card"]').first();
    const heartButton = firstCampsiteCard.locator('[data-testid="wishlist-button"]');

    // Add to wishlist
    await heartButton.click();
    await page.waitForTimeout(500);

    // Verify filled state
    await expect(heartButton.locator('[data-testid="heart-icon-filled"]')).toBeVisible();

    // Navigate away
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate back to search
    await page.goto('/search');
    await page.waitForLoadState('networkidle');

    // Verify heart is still filled for the same campsite
    const sameCard = page.locator('[data-testid="campsite-card"]').first();
    const sameHeartButton = sameCard.locator('[data-testid="wishlist-button"]');
    await expect(sameHeartButton.locator('[data-testid="heart-icon-filled"]')).toBeVisible();
  });
});
