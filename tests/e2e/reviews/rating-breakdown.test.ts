import { test, expect } from '@playwright/test';

test.describe('Rating Breakdown Bar Chart Display', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a campsite detail page with reviews
    // Assuming we have a test campsite with multiple reviews at different ratings
    await page.goto('/campsites/test-campsite-id');
    await page.waitForLoadState('networkidle');
  });

  test('T030.1: All 5 rating bars are visible', async ({ page }) => {
    // Wait for rating breakdown section to load
    const ratingBreakdown = page.locator('[data-testid="rating-breakdown"]');
    await expect(ratingBreakdown).toBeVisible();

    // Check that all 5 star rating bars are present
    for (let stars = 5; stars >= 1; stars--) {
      const ratingBar = page.locator(`[data-testid="rating-bar-${stars}"]`);
      await expect(ratingBar).toBeVisible();
    }
  });

  test('T030.2: Bar widths reflect percentages correctly', async ({ page }) => {
    // Wait for rating breakdown to load
    await page.waitForSelector('[data-testid="rating-breakdown"]', { timeout: 10000 });

    // Get all rating bars
    const ratingBars = page.locator('[data-testid^="rating-bar-"]');
    const count = await ratingBars.count();
    expect(count).toBe(5);

    // Check that bar widths are set as percentage styles
    for (let i = 0; i < count; i++) {
      const bar = ratingBars.nth(i);
      const barFill = bar.locator('[data-testid^="rating-bar-fill-"]');

      // Check if the bar has a width style attribute
      const style = await barFill.getAttribute('style');
      if (style) {
        // Width should be in percentage format or 0 if no reviews for that rating
        expect(style).toMatch(/width:\s*\d+(\.\d+)?%/);
      }
    }
  });

  test('T030.3: Counts are shown for each rating', async ({ page }) => {
    // Wait for rating breakdown to load
    await page.waitForSelector('[data-testid="rating-breakdown"]', { timeout: 10000 });

    // Check that each rating bar shows a count
    for (let stars = 5; stars >= 1; stars--) {
      const ratingCount = page.locator(`[data-testid="rating-count-${stars}"]`);
      await expect(ratingCount).toBeVisible();

      // Count should be a number (0 or greater)
      const countText = await ratingCount.textContent();
      expect(countText).toMatch(/^\d+$/);
    }
  });

  test('T030.4: Percentages are shown for each rating', async ({ page }) => {
    // Wait for rating breakdown to load
    await page.waitForSelector('[data-testid="rating-breakdown"]', { timeout: 10000 });

    // Check that each rating bar shows a percentage
    for (let stars = 5; stars >= 1; stars--) {
      const ratingPercentage = page.locator(`[data-testid="rating-percentage-${stars}"]`);
      await expect(ratingPercentage).toBeVisible();

      // Percentage should be a number followed by % (e.g., "50%", "0%")
      const percentageText = await ratingPercentage.textContent();
      expect(percentageText).toMatch(/^\d+(\.\d+)?%$/);
    }
  });

  test('T030.5: Handles single rating (100% on one bar)', async ({ page }) => {
    // Navigate to a campsite with only 5-star reviews
    await page.goto('/campsites/single-rating-campsite-id');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="rating-breakdown"]', { timeout: 10000 });

    // Check 5-star rating bar
    const fiveStarPercentage = page.locator('[data-testid="rating-percentage-5"]');
    await expect(fiveStarPercentage).toHaveText('100%');

    const fiveStarBar = page.locator('[data-testid="rating-bar-fill-5"]');
    const fiveStarStyle = await fiveStarBar.getAttribute('style');
    expect(fiveStarStyle).toContain('width: 100%');

    // Check other ratings have 0%
    for (let stars = 4; stars >= 1; stars--) {
      const ratingPercentage = page.locator(`[data-testid="rating-percentage-${stars}"]`);
      await expect(ratingPercentage).toHaveText('0%');

      const ratingBar = page.locator(`[data-testid="rating-bar-fill-${stars}"]`);
      const barStyle = await ratingBar.getAttribute('style');
      expect(barStyle).toMatch(/width:\s*0%/);
    }
  });

  test('T030.6: Handles no reviews (empty state)', async ({ page }) => {
    // Navigate to a campsite with no reviews
    await page.goto('/campsites/no-reviews-campsite-id');
    await page.waitForLoadState('networkidle');

    // Check if rating breakdown shows empty state
    const ratingBreakdown = page.locator('[data-testid="rating-breakdown"]');

    // Either the breakdown is not visible, or it shows all zeros
    const isVisible = await ratingBreakdown.isVisible();

    if (isVisible) {
      // All ratings should show 0 count and 0%
      for (let stars = 5; stars >= 1; stars--) {
        const ratingCount = page.locator(`[data-testid="rating-count-${stars}"]`);
        await expect(ratingCount).toHaveText('0');

        const ratingPercentage = page.locator(`[data-testid="rating-percentage-${stars}"]`);
        await expect(ratingPercentage).toHaveText('0%');

        const ratingBar = page.locator(`[data-testid="rating-bar-fill-${stars}"]`);
        const barStyle = await ratingBar.getAttribute('style');
        expect(barStyle).toMatch(/width:\s*0%/);
      }
    } else {
      // Or there's an empty state message
      const emptyMessage = page.locator('[data-testid="no-reviews-message"]');
      await expect(emptyMessage).toBeVisible();
    }
  });

  test('T030.7: Rating breakdown sums to total review count', async ({ page }) => {
    // Wait for rating breakdown to load
    await page.waitForSelector('[data-testid="rating-breakdown"]', { timeout: 10000 });

    // Get individual rating counts
    let totalCount = 0;
    for (let stars = 5; stars >= 1; stars--) {
      const ratingCount = page.locator(`[data-testid="rating-count-${stars}"]`);
      const countText = await ratingCount.textContent();
      totalCount += parseInt(countText || '0', 10);
    }

    // Get the total review count displayed on the page
    const totalReviewCount = page.locator('[data-testid="total-review-count"]');
    if (await totalReviewCount.isVisible()) {
      const totalText = await totalReviewCount.textContent();
      const displayedTotal = parseInt(totalText?.replace(/\D/g, '') || '0', 10);

      // Sum of individual ratings should equal total reviews
      expect(totalCount).toBe(displayedTotal);
    }
  });

  test('T030.8: Percentages sum to approximately 100% (when reviews exist)', async ({ page }) => {
    // Wait for rating breakdown to load
    await page.waitForSelector('[data-testid="rating-breakdown"]', { timeout: 10000 });

    // Get individual rating percentages
    let totalPercentage = 0;
    for (let stars = 5; stars >= 1; stars--) {
      const ratingPercentage = page.locator(`[data-testid="rating-percentage-${stars}"]`);
      const percentageText = await ratingPercentage.textContent();
      const percentage = parseFloat(percentageText?.replace('%', '') || '0');
      totalPercentage += percentage;
    }

    // Get total review count to check if there are reviews
    const totalReviewCount = page.locator('[data-testid="total-review-count"]');
    if (await totalReviewCount.isVisible()) {
      const totalText = await totalReviewCount.textContent();
      const reviewCount = parseInt(totalText?.replace(/\D/g, '') || '0', 10);

      if (reviewCount > 0) {
        // Percentages should sum to approximately 100% (allowing for rounding)
        expect(totalPercentage).toBeGreaterThanOrEqual(99);
        expect(totalPercentage).toBeLessThanOrEqual(101);
      } else {
        // If no reviews, all percentages should be 0
        expect(totalPercentage).toBe(0);
      }
    }
  });

  test('T030.9: Bar chart is visually responsive', async ({ page }) => {
    // Test on mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');

    const ratingBreakdown = page.locator('[data-testid="rating-breakdown"]');
    await expect(ratingBreakdown).toBeVisible();

    // All rating bars should still be visible on mobile
    for (let stars = 5; stars >= 1; stars--) {
      const ratingBar = page.locator(`[data-testid="rating-bar-${stars}"]`);
      await expect(ratingBar).toBeVisible();
    }

    // Test on tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(ratingBreakdown).toBeVisible();

    // Test on desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(ratingBreakdown).toBeVisible();
  });

  test('T030.10: Rating labels show star count correctly', async ({ page }) => {
    // Wait for rating breakdown to load
    await page.waitForSelector('[data-testid="rating-breakdown"]', { timeout: 10000 });

    // Check that each rating bar has correct star label
    for (let stars = 5; stars >= 1; stars--) {
      const ratingLabel = page.locator(`[data-testid="rating-label-${stars}"]`);
      await expect(ratingLabel).toBeVisible();

      // Label should contain the star count (e.g., "5 stars", "4 stars")
      const labelText = await ratingLabel.textContent();
      expect(labelText).toContain(stars.toString());
    }
  });
});
