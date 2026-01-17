import { test, expect } from '@playwright/test';

test.describe('Pagination Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to search page with enough results to trigger pagination
    await page.goto('/search');
    await page.waitForLoadState('networkidle');
  });

  test('T062.1: Page numbers display correctly', async ({ page }) => {
    // Wait for search results to load
    await page.waitForSelector('[data-testid="campsite-card"]', { timeout: 10000 });

    // Check if pagination exists
    const pagination = page.locator('[data-testid="pagination"]');
    await expect(pagination).toBeVisible();

    // Verify page numbers are displayed
    const pageNumbers = page.locator('[data-testid="page-number"]');
    const count = await pageNumbers.count();
    expect(count).toBeGreaterThan(0);

    // First page should be visible
    const firstPage = page.locator('[data-testid="page-number"]', { hasText: '1' });
    await expect(firstPage).toBeVisible();
  });

  test('T062.2: Clicking next page loads new results', async ({ page }) => {
    // Wait for initial results
    await page.waitForSelector('[data-testid="campsite-card"]', { timeout: 10000 });

    // Get first campsite name from page 1
    const firstCampsitePage1 = page.locator('[data-testid="campsite-card"]').first();
    const firstNamePage1 = await firstCampsitePage1.textContent();

    // Click next page button
    const nextButton = page.locator('[data-testid="next-page"]');
    await expect(nextButton).toBeEnabled();
    await nextButton.click();

    // Wait for page 2 to load
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="campsite-card"]', { timeout: 10000 });

    // Get first campsite name from page 2
    const firstCampsitePage2 = page.locator('[data-testid="campsite-card"]').first();
    const firstNamePage2 = await firstCampsitePage2.textContent();

    // Results should be different
    expect(firstNamePage1).not.toBe(firstNamePage2);

    // URL should contain page=2
    expect(page.url()).toContain('page=2');
  });

  test('T062.3: Clicking previous page goes back', async ({ page }) => {
    // Navigate to page 2 first
    await page.goto('/search?page=2');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="campsite-card"]', { timeout: 10000 });

    // Get first campsite name from page 2
    const firstCampsitePage2 = page.locator('[data-testid="campsite-card"]').first();
    const firstNamePage2 = await firstCampsitePage2.textContent();

    // Click previous page button
    const prevButton = page.locator('[data-testid="prev-page"]');
    await expect(prevButton).toBeEnabled();
    await prevButton.click();

    // Wait for page 1 to load
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="campsite-card"]', { timeout: 10000 });

    // Get first campsite name from page 1
    const firstCampsitePage1 = page.locator('[data-testid="campsite-card"]').first();
    const firstNamePage1 = await firstCampsitePage1.textContent();

    // Results should be different
    expect(firstNamePage2).not.toBe(firstNamePage1);

    // URL should contain page=1 or no page parameter
    const url = page.url();
    expect(url).toMatch(/page=1|search(?!\?page=)/);
  });

  test('T062.4: Clicking page number loads that page', async ({ page }) => {
    // Wait for initial results
    await page.waitForSelector('[data-testid="campsite-card"]', { timeout: 10000 });

    // Get page numbers
    const pageNumbers = page.locator('[data-testid="page-number"]');
    const count = await pageNumbers.count();

    // If there are at least 3 pages, click page 3
    if (count >= 3) {
      const page3Button = page.locator('[data-testid="page-number"]', { hasText: '3' });
      await page3Button.click();

      // Wait for page 3 to load
      await page.waitForLoadState('networkidle');
      await page.waitForSelector('[data-testid="campsite-card"]', { timeout: 10000 });

      // URL should contain page=3
      expect(page.url()).toContain('page=3');

      // Page 3 should be highlighted
      await expect(page3Button).toHaveClass(/active|current|selected/);
    } else {
      // If less than 3 pages, just verify clicking page 2 works
      const page2Button = page.locator('[data-testid="page-number"]', { hasText: '2' });
      await page2Button.click();

      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain('page=2');
    }
  });

  test('T062.5: Current page is highlighted', async ({ page }) => {
    // Wait for initial results
    await page.waitForSelector('[data-testid="campsite-card"]', { timeout: 10000 });

    // Page 1 should be highlighted initially
    const page1Button = page.locator('[data-testid="page-number"]', { hasText: '1' });
    await expect(page1Button).toHaveClass(/active|current|selected/);

    // Click page 2
    const page2Button = page.locator('[data-testid="page-number"]', { hasText: '2' });
    await page2Button.click();
    await page.waitForLoadState('networkidle');

    // Page 2 should now be highlighted
    await expect(page2Button).toHaveClass(/active|current|selected/);

    // Page 1 should not be highlighted
    await expect(page1Button).not.toHaveClass(/active|current|selected/);
  });

  test('T062.6: Page number persists in URL', async ({ page }) => {
    // Navigate directly to page 3 via URL
    await page.goto('/search?page=3');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="campsite-card"]', { timeout: 10000 });

    // URL should still contain page=3
    expect(page.url()).toContain('page=3');

    // Page 3 should be highlighted
    const page3Button = page.locator('[data-testid="page-number"]', { hasText: '3' });
    await expect(page3Button).toHaveClass(/active|current|selected/);

    // Reload the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // URL should still contain page=3
    expect(page.url()).toContain('page=3');

    // Page 3 should still be highlighted
    await expect(page3Button).toHaveClass(/active|current|selected/);
  });

  test('T062.7: First/last page buttons work', async ({ page }) => {
    // Wait for initial results
    await page.waitForSelector('[data-testid="campsite-card"]', { timeout: 10000 });

    // Navigate to page 2
    const page2Button = page.locator('[data-testid="page-number"]', { hasText: '2' });
    await page2Button.click();
    await page.waitForLoadState('networkidle');

    // Click first page button
    const firstPageButton = page.locator('[data-testid="first-page"]');
    if (await firstPageButton.isVisible()) {
      await firstPageButton.click();
      await page.waitForLoadState('networkidle');

      // Should be on page 1
      const url = page.url();
      expect(url).toMatch(/page=1|search(?!\?page=)/);

      // Page 1 should be highlighted
      const page1Button = page.locator('[data-testid="page-number"]', { hasText: '1' });
      await expect(page1Button).toHaveClass(/active|current|selected/);
    }

    // Click last page button
    const lastPageButton = page.locator('[data-testid="last-page"]');
    if (await lastPageButton.isVisible()) {
      await lastPageButton.click();
      await page.waitForLoadState('networkidle');
      await page.waitForSelector('[data-testid="campsite-card"]', { timeout: 10000 });

      // Should be on the last page
      const pageNumbers = page.locator('[data-testid="page-number"]');
      const count = await pageNumbers.count();
      const lastPageNum = await pageNumbers.nth(count - 1).textContent();

      expect(page.url()).toContain(`page=${lastPageNum}`);
    }
  });

  test('T062.8: Previous button is disabled on first page', async ({ page }) => {
    // Wait for initial results on page 1
    await page.waitForSelector('[data-testid="campsite-card"]', { timeout: 10000 });

    // Previous button should be disabled
    const prevButton = page.locator('[data-testid="prev-page"]');
    await expect(prevButton).toBeDisabled();
  });

  test('T062.9: Next button is disabled on last page', async ({ page }) => {
    // Wait for initial results
    await page.waitForSelector('[data-testid="campsite-card"]', { timeout: 10000 });

    // Navigate to last page
    const lastPageButton = page.locator('[data-testid="last-page"]');
    if (await lastPageButton.isVisible()) {
      await lastPageButton.click();
      await page.waitForLoadState('networkidle');
      await page.waitForSelector('[data-testid="campsite-card"]', { timeout: 10000 });

      // Next button should be disabled
      const nextButton = page.locator('[data-testid="next-page"]');
      await expect(nextButton).toBeDisabled();
    }
  });

  test('T062.10: Pagination preserves search filters', async ({ page }) => {
    // Navigate to search with a province filter
    await page.goto('/search?province=กรุงเทพมหานคร');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="campsite-card"]', { timeout: 10000 });

    // Click next page
    const nextButton = page.locator('[data-testid="next-page"]');
    if (await nextButton.isEnabled()) {
      await nextButton.click();
      await page.waitForLoadState('networkidle');

      // URL should contain both page and province parameters
      const url = page.url();
      expect(url).toContain('page=2');
      expect(url).toContain('province=กรุงเทพมหานคร');
    }
  });
});
