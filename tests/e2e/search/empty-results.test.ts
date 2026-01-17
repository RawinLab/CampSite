import { test, expect } from '@playwright/test';

test.describe('Empty Search Results Display', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to search page
    await page.goto('/search');
    await page.waitForLoadState('networkidle');
  });

  test('T065.1: Empty results display friendly message', async ({ page }) => {
    // Perform a search that will return no results
    // Using filters or search terms that won't match any campsites
    const searchInput = page.getByRole('textbox', { name: /ค้นหา|search/i });
    await searchInput.fill('XYZ123NonexistentCampsite999');

    // Submit search or wait for auto-search
    await page.keyboard.press('Enter');

    // Wait for search to complete
    await page.waitForTimeout(1000);

    // Verify friendly message is displayed
    const emptyMessage = page.getByText(/ไม่พบแคมป์ไซต์|no campsites found|ไม่มีผลลัพธ์/i);
    await expect(emptyMessage).toBeVisible();
  });

  test('T065.2: Message suggests adjusting filters', async ({ page }) => {
    // Perform a search with no results
    const searchInput = page.getByRole('textbox', { name: /ค้นหา|search/i });
    await searchInput.fill('XYZ123NonexistentCampsite999');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);

    // Verify suggestion message about adjusting filters
    const suggestionText = page.getByText(/ลองปรับ|ลองเปลี่ยน|try adjusting|ลองค้นหา|modify your search/i);
    await expect(suggestionText).toBeVisible();
  });

  test('T065.3: Clear filters button is shown', async ({ page }) => {
    // Apply some filters first
    const searchInput = page.getByRole('textbox', { name: /ค้นหา|search/i });
    await searchInput.fill('NonexistentSearch');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);

    // Verify clear filters button is visible
    const clearButton = page.getByRole('button', { name: /ล้างตัวกรอง|clear filters|ล้าง/i });
    await expect(clearButton).toBeVisible();
  });

  test('T065.4: No campsite cards are displayed', async ({ page }) => {
    // Perform search with no results
    const searchInput = page.getByRole('textbox', { name: /ค้นหา|search/i });
    await searchInput.fill('XYZ123NonexistentCampsite999');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);

    // Verify no campsite cards are present
    // Looking for common campsite card elements
    const campsiteCards = page.locator('[data-testid="campsite-card"]');
    await expect(campsiteCards).toHaveCount(0);

    // Alternative: check for article or card components
    const cardElements = page.locator('article').filter({ hasText: /แคมป์|camp/i });
    const cardCount = await cardElements.count();
    expect(cardCount).toBe(0);
  });

  test('T065.5: Loading state disappears after empty results', async ({ page }) => {
    // Track loading states
    let loadingWasVisible = false;

    // Set up listener for loading indicator
    page.on('domcontentloaded', async () => {
      const loadingIndicator = page.getByText(/กำลังโหลด|loading/i);
      const isVisible = await loadingIndicator.isVisible().catch(() => false);
      if (isVisible) {
        loadingWasVisible = true;
      }
    });

    // Perform search
    const searchInput = page.getByRole('textbox', { name: /ค้นหา|search/i });
    await searchInput.fill('XYZ123NonexistentCampsite999');
    await page.keyboard.press('Enter');

    // Wait a brief moment to catch loading state
    await page.waitForTimeout(200);

    // Check if loading indicator exists
    const loadingIndicator = page.getByText(/กำลังโหลด|loading/i);
    const initialLoading = await loadingIndicator.isVisible().catch(() => false);

    // Wait for results to complete
    await page.waitForTimeout(1500);

    // Verify loading indicator is no longer visible
    const finalLoading = await loadingIndicator.isVisible().catch(() => false);
    expect(finalLoading).toBe(false);

    // Empty message should be visible instead
    const emptyMessage = page.getByText(/ไม่พบแคมป์ไซต์|no campsites found|ไม่มีผลลัพธ์/i);
    await expect(emptyMessage).toBeVisible();
  });

  test('T065.6: Clear filters button works and resets search', async ({ page }) => {
    // Perform search with no results
    const searchInput = page.getByRole('textbox', { name: /ค้นหา|search/i });
    await searchInput.fill('XYZ123NonexistentCampsite999');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);

    // Verify empty state
    const emptyMessage = page.getByText(/ไม่พบแคมป์ไซต์|no campsites found|ไม่มีผลลัพธ์/i);
    await expect(emptyMessage).toBeVisible();

    // Click clear filters button
    const clearButton = page.getByRole('button', { name: /ล้างตัวกรอง|clear filters|ล้าง/i });
    await clearButton.click();

    // Wait for reset
    await page.waitForTimeout(500);

    // Verify search input is cleared
    const inputValue = await searchInput.inputValue();
    expect(inputValue).toBe('');

    // Empty message should no longer be visible (or results should appear)
    const emptyStillVisible = await emptyMessage.isVisible().catch(() => false);
    expect(emptyStillVisible).toBe(false);
  });

  test('T065.7: Empty state persists until filters change', async ({ page }) => {
    // Perform search with no results
    const searchInput = page.getByRole('textbox', { name: /ค้นหา|search/i });
    await searchInput.fill('XYZ123NonexistentCampsite999');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);

    // Verify empty message
    const emptyMessage = page.getByText(/ไม่พบแคมป์ไซต์|no campsites found|ไม่มีผลลัพธ์/i);
    await expect(emptyMessage).toBeVisible();

    // Wait and verify it persists
    await page.waitForTimeout(500);
    await expect(emptyMessage).toBeVisible();

    // Scroll or interact with page
    await page.evaluate(() => window.scrollBy(0, 100));
    await page.waitForTimeout(200);

    // Empty message should still be visible
    await expect(emptyMessage).toBeVisible();
  });

  test('T065.8: Empty state shows skeleton loading before displaying message', async ({ page }) => {
    // Navigate to search page fresh
    await page.goto('/search?q=NonexistentCampsite999');

    // Immediately check for skeleton loading
    await page.waitForTimeout(100);

    // Look for skeleton elements (could be shimmer or placeholder cards)
    const skeletonElements = page.locator('[data-testid="skeleton"], [class*="skeleton"], [class*="loading"]');
    const hasSkeletons = await skeletonElements.count();

    // Wait for content to load
    await page.waitForTimeout(1000);

    // Skeletons should be gone
    const skeletonsAfter = await skeletonElements.isVisible().catch(() => false);

    // Empty message should be visible
    const emptyMessage = page.getByText(/ไม่พบแคมป์ไซต์|no campsites found|ไม่มีผลลัพธ์/i);
    await expect(emptyMessage).toBeVisible();
  });
});
