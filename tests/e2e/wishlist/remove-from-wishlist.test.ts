import { test, expect } from '@playwright/test';

test.describe('Remove from Wishlist Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
  });

  test('T-WISHLIST-06: User can remove campsite from wishlist via heart button', async ({ page }) => {
    // Navigate to search page
    await page.goto('/search');
    await page.waitForLoadState('networkidle');

    // Add campsite to wishlist first
    const firstCampsiteCard = page.locator('[data-testid="campsite-card"]').first();
    const heartButton = firstCampsiteCard.locator('[data-testid="wishlist-button"]');
    await heartButton.click();
    await page.waitForTimeout(500);

    // Verify it's in filled state
    await expect(heartButton.locator('[data-testid="heart-icon-filled"]')).toBeVisible();

    // Click again to remove
    await heartButton.click();
    await page.waitForTimeout(500);

    // Verify it's back to outline state
    await expect(heartButton.locator('[data-testid="heart-icon-outline"]')).toBeVisible();
    await expect(heartButton.locator('[data-testid="heart-icon-filled"]')).not.toBeVisible();
  });

  test('T-WISHLIST-07: Removed campsite disappears from wishlist page', async ({ page }) => {
    // Navigate to search page and add campsite
    await page.goto('/search');
    await page.waitForLoadState('networkidle');

    const firstCampsiteCard = page.locator('[data-testid="campsite-card"]').first();
    const campsiteName = await firstCampsiteCard.locator('[data-testid="campsite-name"]').textContent();

    const heartButton = firstCampsiteCard.locator('[data-testid="wishlist-button"]');
    await heartButton.click();
    await page.waitForTimeout(500);

    // Navigate to wishlist page
    await page.goto('/wishlist');
    await page.waitForLoadState('networkidle');

    // Verify item is there
    const wishlistItem = page.locator('[data-testid="wishlist-item"]').filter({ hasText: campsiteName || '' });
    await expect(wishlistItem).toBeVisible();

    // Remove from wishlist
    const wishlistHeartButton = wishlistItem.locator('[data-testid="wishlist-button"]');
    await wishlistHeartButton.click();
    await page.waitForTimeout(500);

    // Verify item is removed
    await expect(wishlistItem).not.toBeVisible();
  });

  test('T-WISHLIST-08: Remove button on wishlist page works correctly', async ({ page }) => {
    // Add a campsite to wishlist first
    await page.goto('/search');
    await page.waitForLoadState('networkidle');

    const firstCampsiteCard = page.locator('[data-testid="campsite-card"]').first();
    const heartButton = firstCampsiteCard.locator('[data-testid="wishlist-button"]');
    await heartButton.click();
    await page.waitForTimeout(500);

    // Navigate to wishlist page
    await page.goto('/wishlist');
    await page.waitForLoadState('networkidle');

    // Count items before removal
    const wishlistItems = page.locator('[data-testid="wishlist-item"]');
    const initialCount = await wishlistItems.count();
    expect(initialCount).toBeGreaterThan(0);

    // Click remove button on first item
    const removeButton = wishlistItems.first().locator('[data-testid="remove-wishlist-button"]');
    await removeButton.click();
    await page.waitForTimeout(500);

    // Verify count decreased
    const newCount = await wishlistItems.count();
    expect(newCount).toBe(initialCount - 1);
  });

  test('T-WISHLIST-09: Removing all items shows empty state', async ({ page }) => {
    // Add a campsite to wishlist
    await page.goto('/search');
    await page.waitForLoadState('networkidle');

    const firstCampsiteCard = page.locator('[data-testid="campsite-card"]').first();
    const heartButton = firstCampsiteCard.locator('[data-testid="wishlist-button"]');
    await heartButton.click();
    await page.waitForTimeout(500);

    // Navigate to wishlist page
    await page.goto('/wishlist');
    await page.waitForLoadState('networkidle');

    // Remove all items
    let wishlistItems = page.locator('[data-testid="wishlist-item"]');
    const itemCount = await wishlistItems.count();

    for (let i = 0; i < itemCount; i++) {
      const removeButton = wishlistItems.first().locator('[data-testid="remove-wishlist-button"]');
      await removeButton.click();
      await page.waitForTimeout(500);
    }

    // Verify empty state appears
    const emptyState = page.getByText(/empty|ว่างเปล่า|ไม่มีรายการ/i);
    await expect(emptyState).toBeVisible();
  });

  test('T-WISHLIST-10: Error handling when remove from wishlist fails', async ({ page }) => {
    // Add a campsite to wishlist first
    await page.goto('/search');
    await page.waitForLoadState('networkidle');

    const firstCampsiteCard = page.locator('[data-testid="campsite-card"]').first();
    const heartButton = firstCampsiteCard.locator('[data-testid="wishlist-button"]');
    await heartButton.click();
    await page.waitForTimeout(500);

    // Intercept DELETE API call and make it fail
    await page.route('**/api/wishlist/*', route => {
      if (route.request().method() === 'DELETE') {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Internal server error' })
        });
      } else {
        route.continue();
      }
    });

    // Try to remove from wishlist
    await heartButton.click();
    await page.waitForTimeout(500);

    // Verify error message appears
    const errorMessage = page.getByText(/error|failed|ไม่สำเร็จ/i);
    await expect(errorMessage).toBeVisible({ timeout: 3000 });

    // Verify item is still in filled state (removal failed)
    await expect(heartButton.locator('[data-testid="heart-icon-filled"]')).toBeVisible();
  });
});
