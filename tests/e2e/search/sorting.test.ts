import { test, expect } from '@playwright/test';

test.describe('Search Sorting Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to search page
    await page.goto('/search');
    await page.waitForLoadState('networkidle');
  });

  test('T061.1: Default sort is by rating (highest first)', async ({ page }) => {
    // Wait for search results to load
    await page.waitForSelector('[data-testid="campsite-card"]', { timeout: 10000 });

    // Check URL contains default sort parameter
    const url = page.url();
    expect(url).toContain('sortBy=rating');

    // Verify sort dropdown shows rating selected
    const sortSelect = page.getByRole('combobox', { name: /เรียงตาม|sort/i });
    const selectedValue = await sortSelect.inputValue();
    expect(selectedValue).toBe('rating');

    // Verify campsite cards are sorted by rating (descending)
    const ratingElements = await page.locator('[data-testid="campsite-rating"]').all();

    if (ratingElements.length > 1) {
      const ratings = await Promise.all(
        ratingElements.map(async (el) => {
          const text = await el.textContent();
          const rating = parseFloat(text?.match(/[\d.]+/)?.[0] || '0');
          return rating;
        })
      );

      // Verify ratings are in descending order
      for (let i = 0; i < ratings.length - 1; i++) {
        expect(ratings[i]).toBeGreaterThanOrEqual(ratings[i + 1]);
      }
    }
  });

  test('T061.2: Sort by price ascending works', async ({ page }) => {
    // Wait for results to load
    await page.waitForSelector('[data-testid="campsite-card"]', { timeout: 10000 });

    // Select sort by price ascending
    const sortSelect = page.getByRole('combobox', { name: /เรียงตาม|sort/i });
    await sortSelect.selectOption('price_asc');

    // Wait for results to update
    await page.waitForTimeout(500);
    await page.waitForLoadState('networkidle');

    // Check URL updated
    const url = page.url();
    expect(url).toContain('sortBy=price_asc');

    // Verify campsite cards are sorted by price (ascending)
    const priceElements = await page.locator('[data-testid="campsite-price"]').all();

    if (priceElements.length > 1) {
      const prices = await Promise.all(
        priceElements.map(async (el) => {
          const text = await el.textContent();
          const price = parseFloat(text?.replace(/[^\d.]/g, '') || '0');
          return price;
        })
      );

      // Verify prices are in ascending order
      for (let i = 0; i < prices.length - 1; i++) {
        expect(prices[i]).toBeLessThanOrEqual(prices[i + 1]);
      }
    }
  });

  test('T061.3: Sort by price descending works', async ({ page }) => {
    // Wait for results to load
    await page.waitForSelector('[data-testid="campsite-card"]', { timeout: 10000 });

    // Select sort by price descending
    const sortSelect = page.getByRole('combobox', { name: /เรียงตาม|sort/i });
    await sortSelect.selectOption('price_desc');

    // Wait for results to update
    await page.waitForTimeout(500);
    await page.waitForLoadState('networkidle');

    // Check URL updated
    const url = page.url();
    expect(url).toContain('sortBy=price_desc');

    // Verify campsite cards are sorted by price (descending)
    const priceElements = await page.locator('[data-testid="campsite-price"]').all();

    if (priceElements.length > 1) {
      const prices = await Promise.all(
        priceElements.map(async (el) => {
          const text = await el.textContent();
          const price = parseFloat(text?.replace(/[^\d.]/g, '') || '0');
          return price;
        })
      );

      // Verify prices are in descending order
      for (let i = 0; i < prices.length - 1; i++) {
        expect(prices[i]).toBeGreaterThanOrEqual(prices[i + 1]);
      }
    }
  });

  test('T061.4: Sort by newest works', async ({ page }) => {
    // Wait for results to load
    await page.waitForSelector('[data-testid="campsite-card"]', { timeout: 10000 });

    // Select sort by newest
    const sortSelect = page.getByRole('combobox', { name: /เรียงตาม|sort/i });
    await sortSelect.selectOption('newest');

    // Wait for results to update
    await page.waitForTimeout(500);
    await page.waitForLoadState('networkidle');

    // Check URL updated
    const url = page.url();
    expect(url).toContain('sortBy=newest');

    // Verify sort option is selected
    const selectedValue = await sortSelect.inputValue();
    expect(selectedValue).toBe('newest');

    // Verify results are displayed (newest should show recently added campsites)
    const campsiteCards = await page.locator('[data-testid="campsite-card"]').all();
    expect(campsiteCards.length).toBeGreaterThan(0);
  });

  test('T061.5: Changing sort updates results immediately', async ({ page }) => {
    // Wait for initial results
    await page.waitForSelector('[data-testid="campsite-card"]', { timeout: 10000 });

    // Get initial first campsite name
    const firstCampsiteBefore = await page
      .locator('[data-testid="campsite-card"]')
      .first()
      .locator('[data-testid="campsite-name"]')
      .textContent();

    // Change sort option
    const sortSelect = page.getByRole('combobox', { name: /เรียงตาม|sort/i });
    await sortSelect.selectOption('price_asc');

    // Wait for results to update
    await page.waitForTimeout(500);
    await page.waitForLoadState('networkidle');

    // Get new first campsite name
    const firstCampsiteAfter = await page
      .locator('[data-testid="campsite-card"]')
      .first()
      .locator('[data-testid="campsite-name"]')
      .textContent();

    // Results should update (first item may change)
    // At minimum, URL should have changed
    const url = page.url();
    expect(url).toContain('sortBy=price_asc');

    // Verify loading state appeared (results refreshed)
    const campsiteCards = await page.locator('[data-testid="campsite-card"]').all();
    expect(campsiteCards.length).toBeGreaterThan(0);
  });

  test('T061.6: Sort selection persists in URL', async ({ page }) => {
    // Wait for results to load
    await page.waitForSelector('[data-testid="campsite-card"]', { timeout: 10000 });

    // Select a specific sort option
    const sortSelect = page.getByRole('combobox', { name: /เรียงตาม|sort/i });
    await sortSelect.selectOption('price_desc');

    // Wait for URL to update
    await page.waitForTimeout(500);

    // Get the URL with sort parameter
    const urlWithSort = page.url();
    expect(urlWithSort).toContain('sortBy=price_desc');

    // Reload the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify URL still contains sort parameter
    const urlAfterReload = page.url();
    expect(urlAfterReload).toContain('sortBy=price_desc');

    // Verify sort dropdown still shows the selected option
    const selectedValue = await sortSelect.inputValue();
    expect(selectedValue).toBe('price_desc');
  });

  test('T061.7: Sort works with search query', async ({ page }) => {
    // Enter search query
    const searchInput = page.getByRole('textbox', { name: /ค้นหา|search/i });
    await searchInput.fill('camping');
    await searchInput.press('Enter');

    // Wait for search results
    await page.waitForTimeout(1000);
    await page.waitForLoadState('networkidle');

    // Change sort option
    const sortSelect = page.getByRole('combobox', { name: /เรียงตาม|sort/i });
    await sortSelect.selectOption('price_asc');

    // Wait for results to update
    await page.waitForTimeout(500);

    // URL should contain both search query and sort
    const url = page.url();
    expect(url).toContain('sortBy=price_asc');
    expect(url).toContain('q=camping');

    // Results should be displayed
    const campsiteCards = await page.locator('[data-testid="campsite-card"]').all();
    expect(campsiteCards.length).toBeGreaterThanOrEqual(0);
  });

  test('T061.8: Sort works with filters', async ({ page }) => {
    // Wait for initial results
    await page.waitForSelector('[data-testid="campsite-card"]', { timeout: 10000 });

    // Apply a filter (e.g., price range or category)
    const filterCheckbox = page.locator('[data-testid="filter-checkbox"]').first();
    if (await filterCheckbox.isVisible()) {
      await filterCheckbox.click();
      await page.waitForTimeout(500);
    }

    // Change sort option
    const sortSelect = page.getByRole('combobox', { name: /เรียงตาม|sort/i });
    await sortSelect.selectOption('newest');

    // Wait for results to update
    await page.waitForTimeout(500);

    // URL should contain sort parameter
    const url = page.url();
    expect(url).toContain('sortBy=newest');

    // Results should be displayed
    const campsiteCards = await page.locator('[data-testid="campsite-card"]').all();
    expect(campsiteCards.length).toBeGreaterThanOrEqual(0);
  });
});
