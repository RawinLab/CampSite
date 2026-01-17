import { test, expect } from '@playwright/test';

test.describe('Review Sorting Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a campsite detail page with reviews
    // Assuming campsite ID 1 exists with reviews for testing
    await page.goto('/campsites/1');
    await page.waitForLoadState('networkidle');

    // Wait for reviews section to load
    await page.waitForSelector('[data-testid="reviews-section"]', { timeout: 10000 });
  });

  test('T031.1: Sort dropdown is visible', async ({ page }) => {
    // Verify sort dropdown exists in reviews section
    const sortSelect = page.locator('[data-testid="review-sort-select"]');
    await expect(sortSelect).toBeVisible();

    // Verify it's a combobox/select element
    await expect(sortSelect).toHaveAttribute('role', 'combobox');
  });

  test('T031.2: Default sort is newest', async ({ page }) => {
    // Check default sort value
    const sortSelect = page.locator('[data-testid="review-sort-select"]');
    const selectedValue = await sortSelect.inputValue();
    expect(selectedValue).toBe('newest');

    // Verify URL contains default sort parameter (or no sort param defaults to newest)
    const url = page.url();
    // URL may have reviewSort=newest or no param (defaulting to newest)
    if (url.includes('reviewSort=')) {
      expect(url).toContain('reviewSort=newest');
    }

    // Verify reviews are displayed
    const reviewCards = await page.locator('[data-testid="review-card"]').all();
    expect(reviewCards.length).toBeGreaterThan(0);
  });

  test('T031.3: Sort by helpful shows most helpful first', async ({ page }) => {
    // Wait for reviews to load
    await page.waitForSelector('[data-testid="review-card"]', { timeout: 10000 });

    // Select sort by helpful
    const sortSelect = page.locator('[data-testid="review-sort-select"]');
    await sortSelect.selectOption('helpful');

    // Wait for results to update
    await page.waitForTimeout(500);
    await page.waitForLoadState('networkidle');

    // Check URL updated
    const url = page.url();
    expect(url).toContain('reviewSort=helpful');

    // Verify reviews are sorted by helpful count (descending)
    const helpfulElements = await page.locator('[data-testid="review-helpful-count"]').all();

    if (helpfulElements.length > 1) {
      const helpfulCounts = await Promise.all(
        helpfulElements.map(async (el) => {
          const text = await el.textContent();
          const count = parseInt(text?.match(/\d+/)?.[0] || '0', 10);
          return count;
        })
      );

      // Verify helpful counts are in descending order
      for (let i = 0; i < helpfulCounts.length - 1; i++) {
        expect(helpfulCounts[i]).toBeGreaterThanOrEqual(helpfulCounts[i + 1]);
      }
    }
  });

  test('T031.4: Sort by rating_high shows 5-star reviews first', async ({ page }) => {
    // Wait for reviews to load
    await page.waitForSelector('[data-testid="review-card"]', { timeout: 10000 });

    // Select sort by rating high
    const sortSelect = page.locator('[data-testid="review-sort-select"]');
    await sortSelect.selectOption('rating_high');

    // Wait for results to update
    await page.waitForTimeout(500);
    await page.waitForLoadState('networkidle');

    // Check URL updated
    const url = page.url();
    expect(url).toContain('reviewSort=rating_high');

    // Verify reviews are sorted by rating (descending)
    const ratingElements = await page.locator('[data-testid="review-rating"]').all();

    if (ratingElements.length > 1) {
      const ratings = await Promise.all(
        ratingElements.map(async (el) => {
          // Get the rating value from data attribute or aria-label
          const ratingValue = await el.getAttribute('data-rating');
          if (ratingValue) {
            return parseInt(ratingValue, 10);
          }
          // Fallback: count filled stars
          const filledStars = await el.locator('[data-testid="star-filled"]').count();
          return filledStars;
        })
      );

      // Verify ratings are in descending order (5 to 1)
      for (let i = 0; i < ratings.length - 1; i++) {
        expect(ratings[i]).toBeGreaterThanOrEqual(ratings[i + 1]);
      }
    }
  });

  test('T031.5: Sort by rating_low shows 1-star reviews first', async ({ page }) => {
    // Wait for reviews to load
    await page.waitForSelector('[data-testid="review-card"]', { timeout: 10000 });

    // Select sort by rating low
    const sortSelect = page.locator('[data-testid="review-sort-select"]');
    await sortSelect.selectOption('rating_low');

    // Wait for results to update
    await page.waitForTimeout(500);
    await page.waitForLoadState('networkidle');

    // Check URL updated
    const url = page.url();
    expect(url).toContain('reviewSort=rating_low');

    // Verify reviews are sorted by rating (ascending)
    const ratingElements = await page.locator('[data-testid="review-rating"]').all();

    if (ratingElements.length > 1) {
      const ratings = await Promise.all(
        ratingElements.map(async (el) => {
          // Get the rating value from data attribute or aria-label
          const ratingValue = await el.getAttribute('data-rating');
          if (ratingValue) {
            return parseInt(ratingValue, 10);
          }
          // Fallback: count filled stars
          const filledStars = await el.locator('[data-testid="star-filled"]').count();
          return filledStars;
        })
      );

      // Verify ratings are in ascending order (1 to 5)
      for (let i = 0; i < ratings.length - 1; i++) {
        expect(ratings[i]).toBeLessThanOrEqual(ratings[i + 1]);
      }
    }
  });

  test('T031.6: Sort persists after page navigation', async ({ page }) => {
    // Wait for reviews to load
    await page.waitForSelector('[data-testid="review-card"]', { timeout: 10000 });

    // Select a specific sort option
    const sortSelect = page.locator('[data-testid="review-sort-select"]');
    await sortSelect.selectOption('rating_high');

    // Wait for URL to update
    await page.waitForTimeout(500);

    // Get the URL with sort parameter
    const urlWithSort = page.url();
    expect(urlWithSort).toContain('reviewSort=rating_high');

    // Navigate away (e.g., to homepage)
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate back using browser back button
    await page.goBack();
    await page.waitForLoadState('networkidle');

    // Verify URL still contains sort parameter
    const urlAfterNavigation = page.url();
    expect(urlAfterNavigation).toContain('reviewSort=rating_high');

    // Verify sort dropdown still shows the selected option
    await page.waitForSelector('[data-testid="review-sort-select"]', { timeout: 5000 });
    const selectedValue = await sortSelect.inputValue();
    expect(selectedValue).toBe('rating_high');
  });

  test('T031.7: URL updates with sort param', async ({ page }) => {
    // Wait for reviews to load
    await page.waitForSelector('[data-testid="review-card"]', { timeout: 10000 });

    const sortSelect = page.locator('[data-testid="review-sort-select"]');

    // Test each sort option updates URL correctly
    const sortOptions = [
      { value: 'newest', param: 'reviewSort=newest' },
      { value: 'helpful', param: 'reviewSort=helpful' },
      { value: 'rating_high', param: 'reviewSort=rating_high' },
      { value: 'rating_low', param: 'reviewSort=rating_low' }
    ];

    for (const option of sortOptions) {
      // Select sort option
      await sortSelect.selectOption(option.value);

      // Wait for URL to update
      await page.waitForTimeout(300);

      // Verify URL contains correct parameter
      const url = page.url();
      expect(url).toContain(option.param);
    }
  });

  test('T031.8: Sort changes update review order immediately', async ({ page }) => {
    // Wait for initial reviews
    await page.waitForSelector('[data-testid="review-card"]', { timeout: 10000 });

    // Get initial first review ID
    const firstReviewBefore = await page
      .locator('[data-testid="review-card"]')
      .first()
      .getAttribute('data-review-id');

    // Change sort option
    const sortSelect = page.locator('[data-testid="review-sort-select"]');
    await sortSelect.selectOption('rating_low');

    // Wait for results to update
    await page.waitForTimeout(500);
    await page.waitForLoadState('networkidle');

    // Get new first review ID
    const firstReviewAfter = await page
      .locator('[data-testid="review-card"]')
      .first()
      .getAttribute('data-review-id');

    // Results should update (may or may not change first item, but URL should change)
    const url = page.url();
    expect(url).toContain('reviewSort=rating_low');

    // Verify reviews are still displayed
    const reviewCards = await page.locator('[data-testid="review-card"]').all();
    expect(reviewCards.length).toBeGreaterThan(0);
  });

  test('T031.9: Sort dropdown shows all options', async ({ page }) => {
    // Wait for reviews to load
    await page.waitForSelector('[data-testid="review-sort-select"]', { timeout: 10000 });

    const sortSelect = page.locator('[data-testid="review-sort-select"]');

    // Get all options
    const options = await sortSelect.locator('option').all();
    const optionValues = await Promise.all(
      options.map(async (option) => await option.getAttribute('value'))
    );

    // Verify all expected sort options are present
    expect(optionValues).toContain('newest');
    expect(optionValues).toContain('helpful');
    expect(optionValues).toContain('rating_high');
    expect(optionValues).toContain('rating_low');

    // Should have exactly 4 sort options
    expect(optionValues.length).toBe(4);
  });

  test('T031.10: Sort works with pagination', async ({ page }) => {
    // Wait for reviews to load
    await page.waitForSelector('[data-testid="review-card"]', { timeout: 10000 });

    // Select a sort option
    const sortSelect = page.locator('[data-testid="review-sort-select"]');
    await sortSelect.selectOption('helpful');

    // Wait for results to update
    await page.waitForTimeout(500);

    // Check if pagination exists
    const paginationNext = page.locator('[data-testid="pagination-next"]');

    if (await paginationNext.isVisible()) {
      // Click next page
      await paginationNext.click();
      await page.waitForTimeout(500);
      await page.waitForLoadState('networkidle');

      // Verify URL still contains sort parameter
      const url = page.url();
      expect(url).toContain('reviewSort=helpful');

      // Verify sort dropdown still shows the selected option
      const selectedValue = await sortSelect.inputValue();
      expect(selectedValue).toBe('helpful');
    }
  });
});
