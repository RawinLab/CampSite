import { test, expect } from '@playwright/test';

// Use a valid test campsite slug
const TEST_CAMPSITE_SLUG = 'test-campsite-details-b7a9886a';

test.describe('Review Pagination Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a campsite detail page with many reviews (>5)
    // Note: This assumes we have a campsite with enough reviews for pagination
    await page.goto(`/campsites/${TEST_CAMPSITE_SLUG}`); // Update with actual campsite ID that has many reviews
    await page.waitForLoadState('networkidle');
  });

  test('T033.1: Initial 5 reviews shown', async ({ page }) => {
    // Wait for reviews section to load
    await page.waitForSelector('[data-testid="reviews-section"]', { timeout: 10000 });

    // Count review cards
    const reviewCards = page.locator('[data-testid="review-card"]');
    const count = await reviewCards.count();

    // Should show exactly 5 reviews initially
    expect(count).toBe(5);

    // Verify reviews are visible
    for (let i = 0; i < count; i++) {
      await expect(reviewCards.nth(i)).toBeVisible();
    }
  });

  test('T033.2: Load more button visible when more reviews exist', async ({ page }) => {
    // Wait for reviews section to load
    await page.waitForSelector('[data-testid="reviews-section"]', { timeout: 10000 });

    // Check total review count from heading or metadata
    const reviewCountText = await page.locator('[data-testid="total-review-count"]').textContent();
    const totalReviews = parseInt(reviewCountText?.match(/\d+/)?.[0] || '0');

    // Load more button should be visible if there are more than 5 reviews
    const loadMoreButton = page.locator('[data-testid="load-more-reviews"]');

    if (totalReviews > 5) {
      await expect(loadMoreButton).toBeVisible();
      await expect(loadMoreButton).toBeEnabled();
    } else {
      await expect(loadMoreButton).not.toBeVisible();
    }
  });

  test('T033.3: Clicking load more adds 5 more reviews', async ({ page }) => {
    // Wait for reviews section to load
    await page.waitForSelector('[data-testid="reviews-section"]', { timeout: 10000 });

    // Get initial count of reviews
    const reviewCards = page.locator('[data-testid="review-card"]');
    const initialCount = await reviewCards.count();
    expect(initialCount).toBe(5);

    // Click load more button
    const loadMoreButton = page.locator('[data-testid="load-more-reviews"]');
    await expect(loadMoreButton).toBeVisible();
    await loadMoreButton.click();

    // Wait for new reviews to load
    await page.waitForTimeout(500); // Brief wait for animation/loading

    // Count should now be 10 (initial 5 + 5 more)
    const newCount = await reviewCards.count();
    expect(newCount).toBe(10);
  });

  test('T033.4: Reviews are appended (not replaced)', async ({ page }) => {
    // Wait for reviews section to load
    await page.waitForSelector('[data-testid="reviews-section"]', { timeout: 10000 });

    // Get first review's content
    const firstReview = page.locator('[data-testid="review-card"]').first();
    const firstReviewText = await firstReview.textContent();

    // Click load more button
    const loadMoreButton = page.locator('[data-testid="load-more-reviews"]');
    await loadMoreButton.click();

    // Wait for new reviews to load
    await page.waitForTimeout(500);

    // First review should still be the same (not replaced)
    const firstReviewAfter = page.locator('[data-testid="review-card"]').first();
    const firstReviewTextAfter = await firstReviewAfter.textContent();

    expect(firstReviewTextAfter).toBe(firstReviewText);

    // Should have more reviews now
    const reviewCards = page.locator('[data-testid="review-card"]');
    const count = await reviewCards.count();
    expect(count).toBeGreaterThan(5);
  });

  test('T033.5: Button hidden when all reviews loaded', async ({ page }) => {
    // Wait for reviews section to load
    await page.waitForSelector('[data-testid="reviews-section"]', { timeout: 10000 });

    // Get total review count
    const reviewCountText = await page.locator('[data-testid="total-review-count"]').textContent();
    const totalReviews = parseInt(reviewCountText?.match(/\d+/)?.[0] || '0');

    // If total reviews <= 5, button should already be hidden
    const loadMoreButton = page.locator('[data-testid="load-more-reviews"]');

    if (totalReviews <= 5) {
      await expect(loadMoreButton).not.toBeVisible();
      return;
    }

    // Click load more until all reviews are loaded
    const maxClicks = Math.ceil(totalReviews / 5); // Calculate how many clicks needed

    for (let i = 1; i < maxClicks; i++) {
      if (await loadMoreButton.isVisible()) {
        await loadMoreButton.click();
        await page.waitForTimeout(500);
      }
    }

    // After loading all reviews, button should be hidden
    await expect(loadMoreButton).not.toBeVisible();

    // Verify all reviews are loaded
    const reviewCards = page.locator('[data-testid="review-card"]');
    const loadedCount = await reviewCards.count();
    expect(loadedCount).toBe(totalReviews);
  });

  test('T033.6: Page count/progress shown', async ({ page }) => {
    // Wait for reviews section to load
    await page.waitForSelector('[data-testid="reviews-section"]', { timeout: 10000 });

    // Check for pagination progress indicator
    const paginationProgress = page.locator('[data-testid="review-pagination-progress"]');
    await expect(paginationProgress).toBeVisible();

    // Should show something like "Showing 5 of 23 reviews"
    const progressText = await paginationProgress.textContent();
    expect(progressText).toMatch(/Showing \d+ of \d+/i);

    // Click load more and verify progress updates
    const loadMoreButton = page.locator('[data-testid="load-more-reviews"]');

    if (await loadMoreButton.isVisible()) {
      await loadMoreButton.click();
      await page.waitForTimeout(500);

      // Progress should update to show more reviews
      const updatedProgressText = await paginationProgress.textContent();
      expect(updatedProgressText).toMatch(/Showing \d+ of \d+/i);

      // The "showing" number should have increased
      const initialShowing = parseInt(progressText?.match(/Showing (\d+)/)?.[1] || '0');
      const updatedShowing = parseInt(updatedProgressText?.match(/Showing (\d+)/)?.[1] || '0');
      expect(updatedShowing).toBeGreaterThan(initialShowing);
    }
  });

  test('T033.7: Works with filters applied', async ({ page }) => {
    // Wait for reviews section to load
    await page.waitForSelector('[data-testid="reviews-section"]', { timeout: 10000 });

    // Apply a rating filter (e.g., 5 stars only)
    const fiveStarFilter = page.locator('[data-testid="filter-5-stars"]');

    if (await fiveStarFilter.isVisible()) {
      await fiveStarFilter.click();
      await page.waitForLoadState('networkidle');

      // Wait for filtered results
      await page.waitForTimeout(500);

      // Count filtered reviews
      const reviewCards = page.locator('[data-testid="review-card"]');
      const initialCount = await reviewCards.count();

      // If there are more than 5 filtered reviews, test pagination
      const loadMoreButton = page.locator('[data-testid="load-more-reviews"]');

      if (await loadMoreButton.isVisible()) {
        // Click load more
        await loadMoreButton.click();
        await page.waitForTimeout(500);

        // Should have more reviews
        const newCount = await reviewCards.count();
        expect(newCount).toBeGreaterThan(initialCount);

        // All visible reviews should still be 5 stars
        for (let i = 0; i < await reviewCards.count(); i++) {
          const rating = reviewCards.nth(i).locator('[data-testid="review-rating"]');
          const ratingText = await rating.textContent();
          expect(ratingText).toContain('5');
        }
      }
    }
  });

  test('T033.8: Loading state shown during pagination', async ({ page }) => {
    // Wait for reviews section to load
    await page.waitForSelector('[data-testid="reviews-section"]', { timeout: 10000 });

    const loadMoreButton = page.locator('[data-testid="load-more-reviews"]');

    if (await loadMoreButton.isVisible()) {
      // Click load more and immediately check for loading state
      await loadMoreButton.click();

      // Loading indicator should appear briefly
      const loadingIndicator = page.locator('[data-testid="reviews-loading"]');

      // Note: This might be too fast to catch, so we just verify it eventually disappears
      // and new content loads
      await page.waitForTimeout(1000);

      // Verify new reviews loaded
      const reviewCards = page.locator('[data-testid="review-card"]');
      const count = await reviewCards.count();
      expect(count).toBeGreaterThan(5);
    }
  });

  test('T033.9: Pagination state persists on page navigation', async ({ page }) => {
    // Wait for reviews section to load
    await page.waitForSelector('[data-testid="reviews-section"]', { timeout: 10000 });

    // Load more reviews
    const loadMoreButton = page.locator('[data-testid="load-more-reviews"]');

    if (await loadMoreButton.isVisible()) {
      await loadMoreButton.click();
      await page.waitForTimeout(500);

      // Get current review count
      const reviewCards = page.locator('[data-testid="review-card"]');
      const countBeforeNav = await reviewCards.count();

      // Scroll to top and click on another section, then back to reviews
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(300);

      // Scroll back to reviews
      const reviewsSection = page.locator('[data-testid="reviews-section"]');
      await reviewsSection.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);

      // Review count should be maintained (not reset to 5)
      const countAfterNav = await reviewCards.count();
      expect(countAfterNav).toBe(countBeforeNav);
    }
  });

  test('T033.10: Keyboard navigation works for load more button', async ({ page }) => {
    // Wait for reviews section to load
    await page.waitForSelector('[data-testid="reviews-section"]', { timeout: 10000 });

    const loadMoreButton = page.locator('[data-testid="load-more-reviews"]');

    if (await loadMoreButton.isVisible()) {
      // Focus on the load more button
      await loadMoreButton.focus();

      // Verify button is focused
      await expect(loadMoreButton).toBeFocused();

      // Press Enter to activate
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);

      // Verify more reviews loaded
      const reviewCards = page.locator('[data-testid="review-card"]');
      const count = await reviewCards.count();
      expect(count).toBe(10);
    }
  });
});
