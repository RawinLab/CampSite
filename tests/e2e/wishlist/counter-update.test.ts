import { test, expect } from '@playwright/test';

test.describe('Wishlist Counter Update Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
  });

  test('T-WISHLIST-11: Wishlist counter increments when adding item', async ({ page }) => {
    // Navigate to search page
    await page.goto('/search');
    await page.waitForLoadState('networkidle');

    // Get initial counter value
    const wishlistCounter = page.locator('[data-testid="wishlist-counter"]');
    const initialCountText = await wishlistCounter.textContent();
    const initialCount = parseInt(initialCountText || '0', 10);

    // Add campsite to wishlist
    const firstCampsiteCard = page.locator('[data-testid="campsite-card"]').first();
    const heartButton = firstCampsiteCard.locator('[data-testid="wishlist-button"]');
    await heartButton.click();
    await page.waitForTimeout(500);

    // Verify counter incremented
    const newCountText = await wishlistCounter.textContent();
    const newCount = parseInt(newCountText || '0', 10);
    expect(newCount).toBe(initialCount + 1);
  });

  test('T-WISHLIST-12: Wishlist counter decrements when removing item', async ({ page }) => {
    // Navigate to search page and add item first
    await page.goto('/search');
    await page.waitForLoadState('networkidle');

    const firstCampsiteCard = page.locator('[data-testid="campsite-card"]').first();
    const heartButton = firstCampsiteCard.locator('[data-testid="wishlist-button"]');
    await heartButton.click();
    await page.waitForTimeout(500);

    // Get counter value after adding
    const wishlistCounter = page.locator('[data-testid="wishlist-counter"]');
    const countAfterAdd = parseInt(await wishlistCounter.textContent() || '0', 10);

    // Remove item
    await heartButton.click();
    await page.waitForTimeout(500);

    // Verify counter decremented
    const countAfterRemove = parseInt(await wishlistCounter.textContent() || '0', 10);
    expect(countAfterRemove).toBe(countAfterAdd - 1);
  });

  test('T-WISHLIST-13: Wishlist counter updates correctly with multiple additions', async ({ page }) => {
    // Navigate to search page
    await page.goto('/search');
    await page.waitForLoadState('networkidle');

    // Get initial counter value
    const wishlistCounter = page.locator('[data-testid="wishlist-counter"]');
    const initialCount = parseInt(await wishlistCounter.textContent() || '0', 10);

    // Add 3 different campsites
    const campsiteCards = page.locator('[data-testid="campsite-card"]');
    const cardCount = await campsiteCards.count();
    const itemsToAdd = Math.min(3, cardCount);

    for (let i = 0; i < itemsToAdd; i++) {
      const heartButton = campsiteCards.nth(i).locator('[data-testid="wishlist-button"]');
      await heartButton.click();
      await page.waitForTimeout(500);
    }

    // Verify counter increased by 3
    const finalCount = parseInt(await wishlistCounter.textContent() || '0', 10);
    expect(finalCount).toBe(initialCount + itemsToAdd);
  });

  test('T-WISHLIST-14: Wishlist counter persists across page navigation', async ({ page }) => {
    // Navigate to search page and add item
    await page.goto('/search');
    await page.waitForLoadState('networkidle');

    const firstCampsiteCard = page.locator('[data-testid="campsite-card"]').first();
    const heartButton = firstCampsiteCard.locator('[data-testid="wishlist-button"]');
    await heartButton.click();
    await page.waitForTimeout(500);

    // Get counter value
    const wishlistCounter = page.locator('[data-testid="wishlist-counter"]');
    const countOnSearchPage = await wishlistCounter.textContent();

    // Navigate to home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify counter has same value
    const countOnHomePage = await wishlistCounter.textContent();
    expect(countOnHomePage).toBe(countOnSearchPage);

    // Navigate to wishlist page
    await page.goto('/wishlist');
    await page.waitForLoadState('networkidle');

    // Verify counter still has same value
    const countOnWishlistPage = await wishlistCounter.textContent();
    expect(countOnWishlistPage).toBe(countOnSearchPage);
  });

  test('T-WISHLIST-15: Wishlist counter shows zero when empty', async ({ page }) => {
    // Navigate to wishlist page
    await page.goto('/wishlist');
    await page.waitForLoadState('networkidle');

    // Remove all items from wishlist
    const wishlistItems = page.locator('[data-testid="wishlist-item"]');
    const itemCount = await wishlistItems.count();

    for (let i = 0; i < itemCount; i++) {
      const removeButton = wishlistItems.first().locator('[data-testid="remove-wishlist-button"]');
      await removeButton.click();
      await page.waitForTimeout(500);
    }

    // Verify counter shows 0
    const wishlistCounter = page.locator('[data-testid="wishlist-counter"]');
    const counterText = await wishlistCounter.textContent();
    expect(counterText).toBe('0');
  });

  test('T-WISHLIST-16: Wishlist counter badge is visible when count is greater than zero', async ({ page }) => {
    // Navigate to search page
    await page.goto('/search');
    await page.waitForLoadState('networkidle');

    // Check if badge exists
    const wishlistBadge = page.locator('[data-testid="wishlist-badge"]');

    // Add item to wishlist
    const firstCampsiteCard = page.locator('[data-testid="campsite-card"]').first();
    const heartButton = firstCampsiteCard.locator('[data-testid="wishlist-button"]');
    await heartButton.click();
    await page.waitForTimeout(500);

    // Verify badge is visible
    await expect(wishlistBadge).toBeVisible();

    // Remove item
    await heartButton.click();
    await page.waitForTimeout(500);

    // Badge should be hidden when count is 0
    await expect(wishlistBadge).not.toBeVisible();
  });
});
