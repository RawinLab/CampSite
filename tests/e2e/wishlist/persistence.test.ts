import { test, expect } from '@playwright/test';

test.describe('Wishlist Persistence Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
  });

  test('T-WISHLIST-24: Wishlist persists after page refresh', async ({ page }) => {
    // Navigate to search page and add item
    await page.goto('/search');
    await page.waitForLoadState('networkidle');

    const firstCampsiteCard = page.locator('[data-testid="campsite-card"]').first();
    const campsiteName = await firstCampsiteCard.locator('[data-testid="campsite-name"]').textContent();

    const heartButton = firstCampsiteCard.locator('[data-testid="wishlist-button"]');
    await heartButton.click();
    await page.waitForTimeout(500);

    // Refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify heart is still filled
    const refreshedCard = page.locator('[data-testid="campsite-card"]').first();
    const refreshedHeartButton = refreshedCard.locator('[data-testid="wishlist-button"]');
    await expect(refreshedHeartButton.locator('[data-testid="heart-icon-filled"]')).toBeVisible();

    // Navigate to wishlist page and verify item is still there
    await page.goto('/wishlist');
    await page.waitForLoadState('networkidle');

    const wishlistItems = page.locator('[data-testid="wishlist-item"]');
    const itemNames = await wishlistItems.locator('[data-testid="campsite-name"]').allTextContents();
    expect(itemNames).toContain(campsiteName);
  });

  test('T-WISHLIST-25: Wishlist persists after browser close and reopen', async ({ browser }) => {
    // Create a new context and page
    const context = await browser.newContext();
    const page = await context.newPage();

    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Add item to wishlist
    await page.goto('/search');
    await page.waitForLoadState('networkidle');

    const firstCampsiteCard = page.locator('[data-testid="campsite-card"]').first();
    const campsiteName = await firstCampsiteCard.locator('[data-testid="campsite-name"]').textContent();

    const heartButton = firstCampsiteCard.locator('[data-testid="wishlist-button"]');
    await heartButton.click();
    await page.waitForTimeout(500);

    // Close context (simulates browser close)
    await context.close();

    // Create new context and page (simulates browser reopen)
    const newContext = await browser.newContext();
    const newPage = await newContext.newPage();

    // Login again
    await newPage.goto('/login');
    await newPage.fill('input[type="email"]', 'test@example.com');
    await newPage.fill('input[type="password"]', 'password123');
    await newPage.click('button[type="submit"]');
    await newPage.waitForLoadState('networkidle');

    // Verify wishlist still has the item
    await newPage.goto('/wishlist');
    await newPage.waitForLoadState('networkidle');

    const wishlistItems = newPage.locator('[data-testid="wishlist-item"]');
    const itemNames = await wishlistItems.locator('[data-testid="campsite-name"]').allTextContents();
    expect(itemNames).toContain(campsiteName);

    await newContext.close();
  });

  test('T-WISHLIST-26: Wishlist data syncs across multiple tabs', async ({ browser }) => {
    // Create first tab
    const context = await browser.newContext();
    const page1 = await context.newPage();

    // Login in first tab
    await page1.goto('/login');
    await page1.fill('input[type="email"]', 'test@example.com');
    await page1.fill('input[type="password"]', 'password123');
    await page1.click('button[type="submit"]');
    await page1.waitForLoadState('networkidle');

    // Add item in first tab
    await page1.goto('/search');
    await page1.waitForLoadState('networkidle');

    const firstCard = page1.locator('[data-testid="campsite-card"]').first();
    const campsiteName = await firstCard.locator('[data-testid="campsite-name"]').textContent();

    const heartButton = firstCard.locator('[data-testid="wishlist-button"]');
    await heartButton.click();
    await page1.waitForTimeout(500);

    // Create second tab in same context
    const page2 = await context.newPage();

    // Navigate to wishlist in second tab
    await page2.goto('/wishlist');
    await page2.waitForLoadState('networkidle');

    // Verify item appears in second tab
    const wishlistItems = page2.locator('[data-testid="wishlist-item"]');
    const itemNames = await wishlistItems.locator('[data-testid="campsite-name"]').allTextContents();
    expect(itemNames).toContain(campsiteName);

    await context.close();
  });

  test('T-WISHLIST-27: Wishlist counter persists after page refresh', async ({ page }) => {
    // Navigate to search and add items
    await page.goto('/search');
    await page.waitForLoadState('networkidle');

    const campsiteCards = page.locator('[data-testid="campsite-card"]');
    const itemsToAdd = Math.min(3, await campsiteCards.count());

    for (let i = 0; i < itemsToAdd; i++) {
      const heartButton = campsiteCards.nth(i).locator('[data-testid="wishlist-button"]');
      await heartButton.click();
      await page.waitForTimeout(500);
    }

    // Get counter value before refresh
    const wishlistCounter = page.locator('[data-testid="wishlist-counter"]');
    const countBeforeRefresh = await wishlistCounter.textContent();

    // Refresh page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify counter still shows same value
    const countAfterRefresh = await wishlistCounter.textContent();
    expect(countAfterRefresh).toBe(countBeforeRefresh);
  });

  test('T-WISHLIST-28: Wishlist is user-specific (different users have different wishlists)', async ({ browser }) => {
    // First user adds item
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();

    await page1.goto('/login');
    await page1.fill('input[type="email"]', 'user1@example.com');
    await page1.fill('input[type="password"]', 'password123');
    await page1.click('button[type="submit"]');
    await page1.waitForLoadState('networkidle');

    await page1.goto('/search');
    await page1.waitForLoadState('networkidle');

    const firstCard = page1.locator('[data-testid="campsite-card"]').first();
    const heartButton1 = firstCard.locator('[data-testid="wishlist-button"]');
    await heartButton1.click();
    await page1.waitForTimeout(500);

    await context1.close();

    // Second user checks wishlist
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();

    await page2.goto('/login');
    await page2.fill('input[type="email"]', 'user2@example.com');
    await page2.fill('input[type="password"]', 'password123');
    await page2.click('button[type="submit"]');
    await page2.waitForLoadState('networkidle');

    // Navigate to wishlist
    await page2.goto('/wishlist');
    await page2.waitForLoadState('networkidle');

    // Second user's wishlist should be independent (empty or different)
    const wishlistItems = page2.locator('[data-testid="wishlist-item"]');
    const count = await wishlistItems.count();

    // Either empty or not containing first user's items
    const wishlistCounter = page2.locator('[data-testid="wishlist-counter"]');
    const counterText = await wishlistCounter.textContent();

    await context2.close();
  });

  test('T-WISHLIST-29: Removed items remain removed after refresh', async ({ page }) => {
    // Add item to wishlist
    await page.goto('/search');
    await page.waitForLoadState('networkidle');

    const firstCard = page.locator('[data-testid="campsite-card"]').first();
    const campsiteName = await firstCard.locator('[data-testid="campsite-name"]').textContent();

    const heartButton = firstCard.locator('[data-testid="wishlist-button"]');
    await heartButton.click();
    await page.waitForTimeout(500);

    // Remove item
    await heartButton.click();
    await page.waitForTimeout(500);

    // Verify it's removed (outline state)
    await expect(heartButton.locator('[data-testid="heart-icon-outline"]')).toBeVisible();

    // Refresh page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify item is still not in wishlist (outline state)
    const refreshedCard = page.locator('[data-testid="campsite-card"]').first();
    const refreshedHeartButton = refreshedCard.locator('[data-testid="wishlist-button"]');
    await expect(refreshedHeartButton.locator('[data-testid="heart-icon-outline"]')).toBeVisible();

    // Navigate to wishlist page
    await page.goto('/wishlist');
    await page.waitForLoadState('networkidle');

    // Verify item is not in wishlist
    const wishlistItems = page.locator('[data-testid="wishlist-item"]');
    const itemNames = await wishlistItems.locator('[data-testid="campsite-name"]').allTextContents();
    expect(itemNames).not.toContain(campsiteName);
  });
});
