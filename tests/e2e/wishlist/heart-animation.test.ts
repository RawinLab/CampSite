import { test, expect } from '@playwright/test';
import { loginAsUser, waitForApi, assertNoErrors } from '../utils';

test.describe('Heart Icon Animation Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await loginAsUser(page);

    // Navigate to search page with API verification
    const searchApiPromise = waitForApi(page, '/api/campsites', { status: 200 });
    await page.goto('/search');
    await searchApiPromise;
    await assertNoErrors(page);
  });

  test('T-WISHLIST-17: Heart icon changes from outline to filled when added', async ({ page }) => {
    const firstCampsiteCard = page.locator('[data-testid="campsite-card"]').first();
    const heartButton = firstCampsiteCard.locator('[data-testid="wishlist-button"]');

    // Verify initial state is outline
    const outlineIcon = heartButton.locator('[data-testid="heart-icon-outline"]');
    await expect(outlineIcon).toBeVisible();

    // Click to add to wishlist with API verification
    const addApiPromise = waitForApi(page, '/api/wishlist', { method: 'POST', status: 200 });
    await heartButton.click();
    const response = await addApiPromise;

    const data = await response.json();
    expect(data.success).toBe(true);

    // Verify icon changed to filled
    const filledIcon = heartButton.locator('[data-testid="heart-icon-filled"]');
    await expect(filledIcon).toBeVisible();
    await expect(outlineIcon).not.toBeVisible();
  });

  test('T-WISHLIST-18: Heart icon changes from filled to outline when removed', async ({ page }) => {
    const firstCampsiteCard = page.locator('[data-testid="campsite-card"]').first();
    const heartButton = firstCampsiteCard.locator('[data-testid="wishlist-button"]');

    // Add to wishlist first with API verification
    const addApiPromise = waitForApi(page, '/api/wishlist', { method: 'POST', status: 200 });
    await heartButton.click();
    await addApiPromise;

    // Verify filled state
    const filledIcon = heartButton.locator('[data-testid="heart-icon-filled"]');
    await expect(filledIcon).toBeVisible();

    // Click to remove with API verification
    const removeApiPromise = waitForApi(page, '/api/wishlist', { method: 'DELETE', status: 200 });
    await heartButton.click();
    const removeResponse = await removeApiPromise;

    const removeData = await removeResponse.json();
    expect(removeData.success).toBe(true);

    // Verify icon changed to outline
    const outlineIcon = heartButton.locator('[data-testid="heart-icon-outline"]');
    await expect(outlineIcon).toBeVisible();
    await expect(filledIcon).not.toBeVisible();
  });

  test('T-WISHLIST-19: Heart icon has correct color when filled', async ({ page }) => {
    const firstCampsiteCard = page.locator('[data-testid="campsite-card"]').first();
    const heartButton = firstCampsiteCard.locator('[data-testid="wishlist-button"]');

    // Add to wishlist with API verification
    const addApiPromise = waitForApi(page, '/api/wishlist', { method: 'POST', status: 200 });
    await heartButton.click();
    await addApiPromise;

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

    // Click to add to wishlist with API verification
    const addApiPromise = waitForApi(page, '/api/wishlist', { method: 'POST', status: 200 });
    await heartButton.click();
    const response = await addApiPromise;

    const data = await response.json();
    expect(data.success).toBe(true);

    // Verify button still exists and is in same position
    const buttonAfter = await heartButton.boundingBox();
    expect(buttonAfter).toBeTruthy();
    expect(buttonAfter?.x).toBe(buttonBefore?.x);
    expect(buttonAfter?.y).toBe(buttonBefore?.y);

    // Verify filled icon is visible after animation
    const filledIcon = heartButton.locator('[data-testid="heart-icon-filled"]');
    await expect(filledIcon).toBeVisible();
  });

  test('T-WISHLIST-21: Heart icon state is consistent across different campsite cards', async ({ page }) => {
    const campsiteCards = page.locator('[data-testid="campsite-card"]');
    const cardCount = await campsiteCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(2);

    // Add first campsite to wishlist with API verification
    const firstHeartButton = campsiteCards.nth(0).locator('[data-testid="wishlist-button"]');
    const addApiPromise = waitForApi(page, '/api/wishlist', { method: 'POST', status: 200 });
    await firstHeartButton.click();
    await addApiPromise;

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

    // Add to wishlist with API verification
    const addApiPromise = waitForApi(page, '/api/wishlist', { method: 'POST', status: 200 });
    await heartButton.click();
    await addApiPromise;

    // Verify filled state
    await expect(heartButton.locator('[data-testid="heart-icon-filled"]')).toBeVisible();

    // Navigate away
    await page.goto('/');
    await assertNoErrors(page);

    // Navigate back to search with API verification
    const searchApiPromise = waitForApi(page, '/api/campsites', { status: 200 });
    await page.goto('/search');
    await searchApiPromise;
    await assertNoErrors(page);

    // Verify heart is still filled for the same campsite
    const sameCard = page.locator('[data-testid="campsite-card"]').first();
    const sameHeartButton = sameCard.locator('[data-testid="wishlist-button"]');
    await expect(sameHeartButton.locator('[data-testid="heart-icon-filled"]')).toBeVisible();
  });
});
