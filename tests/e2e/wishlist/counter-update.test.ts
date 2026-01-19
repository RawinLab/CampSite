import { test, expect } from '@playwright/test';
import { loginAsUser, waitForApi, assertNoErrors } from '../utils';

test.describe('Wishlist Counter Update Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await loginAsUser(page);
  });

  test('T-WISHLIST-11: Wishlist counter increments when adding item', async ({ page }) => {
    // Navigate to search page with API verification
    const searchApiPromise = waitForApi(page, '/api/campsites', { status: 200 });
    await page.goto('/search');
    await searchApiPromise;
    await assertNoErrors(page);

    // Get initial counter value
    const wishlistCounter = page.locator('[data-testid="wishlist-counter"]');
    const initialCountText = await wishlistCounter.textContent();
    const initialCount = parseInt(initialCountText || '0', 10);

    // Add campsite to wishlist with API verification
    const firstCampsiteCard = page.locator('[data-testid="campsite-card"]').first();
    const heartButton = firstCampsiteCard.locator('[data-testid="wishlist-button"]');

    const addApiPromise = waitForApi(page, '/api/wishlist', { method: 'POST', status: 200 });
    await heartButton.click();
    const response = await addApiPromise;

    const data = await response.json();
    expect(data.success).toBe(true);

    // Verify counter incremented
    await expect(wishlistCounter).toContainText((initialCount + 1).toString());
  });

  test('T-WISHLIST-12: Wishlist counter decrements when removing item', async ({ page }) => {
    // Navigate to search page and add item first with API verification
    const searchApiPromise = waitForApi(page, '/api/campsites', { status: 200 });
    await page.goto('/search');
    await searchApiPromise;
    await assertNoErrors(page);

    const firstCampsiteCard = page.locator('[data-testid="campsite-card"]').first();
    const heartButton = firstCampsiteCard.locator('[data-testid="wishlist-button"]');

    const addApiPromise = waitForApi(page, '/api/wishlist', { method: 'POST', status: 200 });
    await heartButton.click();
    await addApiPromise;

    // Get counter value after adding
    const wishlistCounter = page.locator('[data-testid="wishlist-counter"]');
    const countAfterAdd = parseInt(await wishlistCounter.textContent() || '0', 10);

    // Remove item with API verification
    const removeApiPromise = waitForApi(page, '/api/wishlist', { method: 'DELETE', status: 200 });
    await heartButton.click();
    const removeResponse = await removeApiPromise;

    const removeData = await removeResponse.json();
    expect(removeData.success).toBe(true);

    // Verify counter decremented
    await expect(wishlistCounter).toContainText((countAfterAdd - 1).toString());
  });

  test('T-WISHLIST-13: Wishlist counter updates correctly with multiple additions', async ({ page }) => {
    // Navigate to search page with API verification
    const searchApiPromise = waitForApi(page, '/api/campsites', { status: 200 });
    await page.goto('/search');
    await searchApiPromise;
    await assertNoErrors(page);

    // Get initial counter value
    const wishlistCounter = page.locator('[data-testid="wishlist-counter"]');
    const initialCount = parseInt(await wishlistCounter.textContent() || '0', 10);

    // Add 3 different campsites
    const campsiteCards = page.locator('[data-testid="campsite-card"]');
    const cardCount = await campsiteCards.count();
    const itemsToAdd = Math.min(3, cardCount);

    for (let i = 0; i < itemsToAdd; i++) {
      const heartButton = campsiteCards.nth(i).locator('[data-testid="wishlist-button"]');
      const addApiPromise = waitForApi(page, '/api/wishlist', { method: 'POST', status: 200 });
      await heartButton.click();
      await addApiPromise;
    }

    // Verify counter increased by itemsToAdd
    await expect(wishlistCounter).toContainText((initialCount + itemsToAdd).toString());
  });

  test('T-WISHLIST-14: Wishlist counter persists across page navigation', async ({ page }) => {
    // Navigate to search page and add item with API verification
    const searchApiPromise = waitForApi(page, '/api/campsites', { status: 200 });
    await page.goto('/search');
    await searchApiPromise;
    await assertNoErrors(page);

    const firstCampsiteCard = page.locator('[data-testid="campsite-card"]').first();
    const heartButton = firstCampsiteCard.locator('[data-testid="wishlist-button"]');

    const addApiPromise = waitForApi(page, '/api/wishlist', { method: 'POST', status: 200 });
    await heartButton.click();
    await addApiPromise;

    // Get counter value
    const wishlistCounter = page.locator('[data-testid="wishlist-counter"]');
    const countOnSearchPage = await wishlistCounter.textContent();

    // Navigate to home page
    await page.goto('/');
    await assertNoErrors(page);

    // Verify counter has same value
    const countOnHomePage = await wishlistCounter.textContent();
    expect(countOnHomePage).toBe(countOnSearchPage);

    // Navigate to wishlist page with API verification
    const wishlistApiPromise = waitForApi(page, '/api/wishlist', { method: 'GET', status: 200 });
    await page.goto('/wishlist');
    await wishlistApiPromise;
    await assertNoErrors(page);

    // Verify counter still has same value
    const countOnWishlistPage = await wishlistCounter.textContent();
    expect(countOnWishlistPage).toBe(countOnSearchPage);
  });

  test('T-WISHLIST-15: Wishlist counter shows zero when empty', async ({ page }) => {
    // Navigate to wishlist page with API verification
    const wishlistApiPromise = waitForApi(page, '/api/wishlist', { method: 'GET', status: 200 });
    await page.goto('/wishlist');
    await wishlistApiPromise;
    await assertNoErrors(page);

    // Remove all items from wishlist
    const wishlistItems = page.locator('[data-testid="wishlist-item"]');
    const itemCount = await wishlistItems.count();

    for (let i = 0; i < itemCount; i++) {
      const removeButton = wishlistItems.first().locator('[data-testid="remove-wishlist-button"]');
      const removeApiPromise = waitForApi(page, '/api/wishlist', { method: 'DELETE', status: 200 });
      await removeButton.click();
      await removeApiPromise;
    }

    // Verify counter shows 0
    const wishlistCounter = page.locator('[data-testid="wishlist-counter"]');
    await expect(wishlistCounter).toContainText('0');
  });

  test('T-WISHLIST-16: Wishlist counter badge is visible when count is greater than zero', async ({ page }) => {
    // Navigate to search page with API verification
    const searchApiPromise = waitForApi(page, '/api/campsites', { status: 200 });
    await page.goto('/search');
    await searchApiPromise;
    await assertNoErrors(page);

    // Check if badge exists
    const wishlistBadge = page.locator('[data-testid="wishlist-badge"]');

    // Add item to wishlist with API verification
    const firstCampsiteCard = page.locator('[data-testid="campsite-card"]').first();
    const heartButton = firstCampsiteCard.locator('[data-testid="wishlist-button"]');

    const addApiPromise = waitForApi(page, '/api/wishlist', { method: 'POST', status: 200 });
    await heartButton.click();
    const addResponse = await addApiPromise;

    const addData = await addResponse.json();
    expect(addData.success).toBe(true);

    // Verify badge is visible
    await expect(wishlistBadge).toBeVisible();

    // Remove item with API verification
    const removeApiPromise = waitForApi(page, '/api/wishlist', { method: 'DELETE', status: 200 });
    await heartButton.click();
    const removeResponse = await removeApiPromise;

    const removeData = await removeResponse.json();
    expect(removeData.success).toBe(true);

    // Badge should be hidden when count is 0
    await expect(wishlistBadge).not.toBeVisible();
  });
});
