import { test, expect } from '@playwright/test';
import { loginAsUser, waitForApi, assertNoErrors } from '../utils';

test.describe('Wishlist Persistence Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await loginAsUser(page);
  });

  test('T-WISHLIST-24: Wishlist persists after page refresh', async ({ page }) => {
    // Navigate to search page and add item with API verification
    const searchApiPromise = waitForApi(page, '/api/campsites', { status: 200 });
    await page.goto('/search');
    await searchApiPromise;
    await assertNoErrors(page);

    const firstCampsiteCard = page.locator('[data-testid="campsite-card"]').first();
    const campsiteName = await firstCampsiteCard.locator('[data-testid="campsite-name"]').textContent();

    const heartButton = firstCampsiteCard.locator('[data-testid="wishlist-button"]');
    const addApiPromise = waitForApi(page, '/api/wishlist', { method: 'POST', status: 200 });
    await heartButton.click();
    await addApiPromise;

    // Refresh the page with API verification
    const reloadApiPromise = waitForApi(page, '/api/campsites', { status: 200 });
    await page.reload();
    await reloadApiPromise;
    await assertNoErrors(page);

    // Verify heart is still filled
    const refreshedCard = page.locator('[data-testid="campsite-card"]').first();
    const refreshedHeartButton = refreshedCard.locator('[data-testid="wishlist-button"]');
    await expect(refreshedHeartButton.locator('[data-testid="heart-icon-filled"]')).toBeVisible();

    // Navigate to wishlist page and verify item is still there
    const wishlistApiPromise = waitForApi(page, '/api/wishlist', { method: 'GET', status: 200 });
    await page.goto('/wishlist');
    await wishlistApiPromise;
    await assertNoErrors(page);

    const wishlistItems = page.locator('[data-testid="wishlist-item"]');
    const itemNames = await wishlistItems.locator('[data-testid="campsite-name"]').allTextContents();
    expect(itemNames).toContain(campsiteName);
  });

  test('T-WISHLIST-25: Wishlist persists after browser close and reopen', async ({ browser }) => {
    // Create a new context and page
    const context = await browser.newContext();
    const page = await context.newPage();

    // Login
    await loginAsUser(page);

    // Add item to wishlist with API verification
    const searchApiPromise = waitForApi(page, '/api/campsites', { status: 200 });
    await page.goto('/search');
    await searchApiPromise;
    await assertNoErrors(page);

    const firstCampsiteCard = page.locator('[data-testid="campsite-card"]').first();
    const campsiteName = await firstCampsiteCard.locator('[data-testid="campsite-name"]').textContent();

    const heartButton = firstCampsiteCard.locator('[data-testid="wishlist-button"]');
    const addApiPromise = waitForApi(page, '/api/wishlist', { method: 'POST', status: 200 });
    await heartButton.click();
    await addApiPromise;

    // Close context (simulates browser close)
    await context.close();

    // Create new context and page (simulates browser reopen)
    const newContext = await browser.newContext();
    const newPage = await newContext.newPage();

    // Login again
    await loginAsUser(newPage);

    // Verify wishlist still has the item with API verification
    const wishlistApiPromise = waitForApi(newPage, '/api/wishlist', { method: 'GET', status: 200 });
    await newPage.goto('/wishlist');
    await wishlistApiPromise;
    await assertNoErrors(newPage);

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
    await loginAsUser(page1);

    // Add item in first tab with API verification
    const searchApiPromise = waitForApi(page1, '/api/campsites', { status: 200 });
    await page1.goto('/search');
    await searchApiPromise;
    await assertNoErrors(page1);

    const firstCard = page1.locator('[data-testid="campsite-card"]').first();
    const campsiteName = await firstCard.locator('[data-testid="campsite-name"]').textContent();

    const heartButton = firstCard.locator('[data-testid="wishlist-button"]');
    const addApiPromise = waitForApi(page1, '/api/wishlist', { method: 'POST', status: 200 });
    await heartButton.click();
    await addApiPromise;

    // Create second tab in same context
    const page2 = await context.newPage();

    // Navigate to wishlist in second tab with API verification
    const wishlistApiPromise = waitForApi(page2, '/api/wishlist', { method: 'GET', status: 200 });
    await page2.goto('/wishlist');
    await wishlistApiPromise;
    await assertNoErrors(page2);

    // Verify item appears in second tab
    const wishlistItems = page2.locator('[data-testid="wishlist-item"]');
    const itemNames = await wishlistItems.locator('[data-testid="campsite-name"]').allTextContents();
    expect(itemNames).toContain(campsiteName);

    await context.close();
  });

  test('T-WISHLIST-27: Wishlist counter persists after page refresh', async ({ page }) => {
    // Navigate to search and add items with API verification
    const searchApiPromise = waitForApi(page, '/api/campsites', { status: 200 });
    await page.goto('/search');
    await searchApiPromise;
    await assertNoErrors(page);

    const campsiteCards = page.locator('[data-testid="campsite-card"]');
    const itemsToAdd = Math.min(3, await campsiteCards.count());

    for (let i = 0; i < itemsToAdd; i++) {
      const heartButton = campsiteCards.nth(i).locator('[data-testid="wishlist-button"]');
      const addApiPromise = waitForApi(page, '/api/wishlist', { method: 'POST', status: 200 });
      await heartButton.click();
      await addApiPromise;
    }

    // Get counter value before refresh
    const wishlistCounter = page.locator('[data-testid="wishlist-counter"]');
    const countBeforeRefresh = await wishlistCounter.textContent();

    // Refresh page with API verification
    const reloadApiPromise = waitForApi(page, '/api/campsites', { status: 200 });
    await page.reload();
    await reloadApiPromise;
    await assertNoErrors(page);

    // Verify counter still shows same value
    const countAfterRefresh = await wishlistCounter.textContent();
    expect(countAfterRefresh).toBe(countBeforeRefresh);
  });

  test('T-WISHLIST-28: Wishlist is user-specific (different users have different wishlists)', async ({ browser }) => {
    // This test is skipped as it requires multiple user credentials
    // Implementation would follow the same pattern with different login credentials
    test.skip();
  });

  test('T-WISHLIST-29: Removed items remain removed after refresh', async ({ page }) => {
    // Add item to wishlist with API verification
    const searchApiPromise = waitForApi(page, '/api/campsites', { status: 200 });
    await page.goto('/search');
    await searchApiPromise;
    await assertNoErrors(page);

    const firstCard = page.locator('[data-testid="campsite-card"]').first();
    const campsiteName = await firstCard.locator('[data-testid="campsite-name"]').textContent();

    const heartButton = firstCard.locator('[data-testid="wishlist-button"]');
    const addApiPromise = waitForApi(page, '/api/wishlist', { method: 'POST', status: 200 });
    await heartButton.click();
    await addApiPromise;

    // Remove item with API verification
    const removeApiPromise = waitForApi(page, '/api/wishlist', { method: 'DELETE', status: 200 });
    await heartButton.click();
    await removeApiPromise;

    // Verify it's removed (outline state)
    await expect(heartButton.locator('[data-testid="heart-icon-outline"]')).toBeVisible();

    // Refresh page with API verification
    const reloadApiPromise = waitForApi(page, '/api/campsites', { status: 200 });
    await page.reload();
    await reloadApiPromise;
    await assertNoErrors(page);

    // Verify item is still not in wishlist (outline state)
    const refreshedCard = page.locator('[data-testid="campsite-card"]').first();
    const refreshedHeartButton = refreshedCard.locator('[data-testid="wishlist-button"]');
    await expect(refreshedHeartButton.locator('[data-testid="heart-icon-outline"]')).toBeVisible();

    // Navigate to wishlist page with API verification
    const wishlistApiPromise = waitForApi(page, '/api/wishlist', { method: 'GET', status: 200 });
    await page.goto('/wishlist');
    await wishlistApiPromise;
    await assertNoErrors(page);

    // Verify item is not in wishlist
    const wishlistItems = page.locator('[data-testid="wishlist-item"]');
    const itemNames = await wishlistItems.locator('[data-testid="campsite-name"]').allTextContents();
    expect(itemNames).not.toContain(campsiteName);
  });
});
