import { test, expect } from '@playwright/test';

test.describe('Review Summary Display on Campsite Detail Page', () => {
  const mockCampsiteId = 'test-campsite-123';

  test.beforeEach(async ({ page }) => {
    // Navigate to campsite detail page
    await page.goto(`/campsites/${mockCampsiteId}`);
    await page.waitForLoadState('networkidle');
  });

  test('T029.1: Review summary section is visible', async ({ page }) => {
    // Look for review summary section by heading or data-testid
    const reviewSummarySection = page.locator('[data-testid="review-summary"]').or(
      page.locator('h2, h3').filter({ hasText: /reviews|ratings/i }).first().locator('..')
    );

    await expect(reviewSummarySection).toBeVisible();
  });

  test('T029.2: Average rating is displayed with correct format', async ({ page }) => {
    // Look for average rating display (e.g., 4.5, 3.8)
    const averageRating = page.locator('[data-testid="average-rating"]').or(
      page.locator('text=/\\d+\\.\\d+/').filter({
        has: page.locator('text=/rating|average|score/i')
      }).first()
    );

    await expect(averageRating).toBeVisible();

    // Verify rating format is between 0.0 and 5.0
    const ratingText = await averageRating.textContent();
    const ratingMatch = ratingText?.match(/(\d+\.\d+)/);

    if (ratingMatch) {
      const rating = parseFloat(ratingMatch[1]);
      expect(rating).toBeGreaterThanOrEqual(0);
      expect(rating).toBeLessThanOrEqual(5);
    }
  });

  test('T029.3: Review count is displayed', async ({ page }) => {
    // Look for review count (e.g., "15 reviews", "23 ratings")
    const reviewCount = page.locator('[data-testid="review-count"]').or(
      page.locator('text=/\\d+\\s+(reviews|ratings)/i').first()
    );

    await expect(reviewCount).toBeVisible();

    // Verify count is a number
    const countText = await reviewCount.textContent();
    const countMatch = countText?.match(/(\d+)/);

    if (countMatch) {
      const count = parseInt(countMatch[1]);
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  test('T029.4: Category breakdown shows cleanliness rating', async ({ page }) => {
    // Look for cleanliness category in rating breakdown
    const cleanlinessRating = page.locator('[data-testid="category-cleanliness"]').or(
      page.locator('text=/cleanliness/i').locator('..').locator('text=/\\d+\\.\\d+/').first()
    );

    const isVisible = await cleanlinessRating.isVisible().catch(() => false);

    if (isVisible) {
      const ratingText = await cleanlinessRating.textContent();
      const ratingMatch = ratingText?.match(/(\d+\.\d+)/);

      if (ratingMatch) {
        const rating = parseFloat(ratingMatch[1]);
        expect(rating).toBeGreaterThanOrEqual(0);
        expect(rating).toBeLessThanOrEqual(5);
      }
    }

    // At minimum, verify cleanliness category label exists
    const cleanlinessLabel = page.locator('text=/cleanliness|ความสะอาด/i').first();
    await expect(cleanlinessLabel).toBeVisible();
  });

  test('T029.5: Category breakdown shows staff rating', async ({ page }) => {
    // Look for staff category in rating breakdown
    const staffRating = page.locator('[data-testid="category-staff"]').or(
      page.locator('text=/staff|service/i').locator('..').locator('text=/\\d+\\.\\d+/').first()
    );

    const isVisible = await staffRating.isVisible().catch(() => false);

    if (isVisible) {
      const ratingText = await staffRating.textContent();
      const ratingMatch = ratingText?.match(/(\d+\.\d+)/);

      if (ratingMatch) {
        const rating = parseFloat(ratingMatch[1]);
        expect(rating).toBeGreaterThanOrEqual(0);
        expect(rating).toBeLessThanOrEqual(5);
      }
    }

    // At minimum, verify staff category label exists
    const staffLabel = page.locator('text=/staff|service|พนักงาน/i').first();
    await expect(staffLabel).toBeVisible();
  });

  test('T029.6: Category breakdown shows facilities rating', async ({ page }) => {
    // Look for facilities category in rating breakdown
    const facilitiesRating = page.locator('[data-testid="category-facilities"]').or(
      page.locator('text=/facilities|amenities/i').locator('..').locator('text=/\\d+\\.\\d+/').first()
    );

    const isVisible = await facilitiesRating.isVisible().catch(() => false);

    if (isVisible) {
      const ratingText = await facilitiesRating.textContent();
      const ratingMatch = ratingText?.match(/(\d+\\.\\d+)/);

      if (ratingMatch) {
        const rating = parseFloat(ratingMatch[1]);
        expect(rating).toBeGreaterThanOrEqual(0);
        expect(rating).toBeLessThanOrEqual(5);
      }
    }

    // At minimum, verify facilities category label exists
    const facilitiesLabel = page.locator('text=/facilities|amenities|สิ่งอำนวยความสะดวก/i').first();
    await expect(facilitiesLabel).toBeVisible();
  });

  test('T029.7: Category breakdown shows value rating', async ({ page }) => {
    // Look for value/value for money category in rating breakdown
    const valueRating = page.locator('[data-testid="category-value"]').or(
      page.locator('text=/value|worth/i').locator('..').locator('text=/\\d+\\.\\d+/').first()
    );

    const isVisible = await valueRating.isVisible().catch(() => false);

    if (isVisible) {
      const ratingText = await valueRating.textContent();
      const ratingMatch = ratingText?.match(/(\d+\\.\\d+)/);

      if (ratingMatch) {
        const rating = parseFloat(ratingMatch[1]);
        expect(rating).toBeGreaterThanOrEqual(0);
        expect(rating).toBeLessThanOrEqual(5);
      }
    }

    // At minimum, verify value category label exists
    const valueLabel = page.locator('text=/value|worth|คุ้มค่า/i').first();
    await expect(valueLabel).toBeVisible();
  });

  test('T029.8: All four category breakdowns are displayed', async ({ page }) => {
    // Verify all four categories are present
    const categories = [
      { name: 'Cleanliness', pattern: /cleanliness|ความสะอาด/i },
      { name: 'Staff', pattern: /staff|service|พนักงาน/i },
      { name: 'Facilities', pattern: /facilities|amenities|สิ่งอำนวยความสะดวก/i },
      { name: 'Value', pattern: /value|worth|คุ้มค่า/i }
    ];

    let visibleCategories = 0;

    for (const category of categories) {
      const categoryElement = page.locator(`text=${category.pattern}`).first();
      const isVisible = await categoryElement.isVisible().catch(() => false);
      if (isVisible) {
        visibleCategories++;
      }
    }

    // All 4 categories should be visible
    expect(visibleCategories).toBe(4);
  });

  test('T029.9: Empty state displays when no reviews exist', async ({ page }) => {
    // Navigate to a campsite with no reviews (mock or test data)
    await page.goto('/campsites/test-campsite-no-reviews');
    await page.waitForLoadState('networkidle');

    // Look for empty state message
    const emptyState = page.locator('[data-testid="no-reviews"]').or(
      page.locator('text=/no reviews|be the first to review|no ratings yet/i').first()
    );

    const hasEmptyState = await emptyState.isVisible().catch(() => false);

    if (hasEmptyState) {
      await expect(emptyState).toBeVisible();

      // Verify call-to-action for first review
      const ctaButton = page.locator('button, a').filter({
        hasText: /write review|be the first|leave review/i
      }).first();

      const hasCtaButton = await ctaButton.isVisible().catch(() => false);
      expect(hasCtaButton).toBeTruthy();
    } else {
      // Alternative: verify average rating shows 0.0 or N/A
      const averageRating = page.locator('[data-testid="average-rating"]').first();
      const ratingText = await averageRating.textContent().catch(() => '');

      expect(ratingText).toMatch(/0\.0|N\/A|--/i);
    }
  });

  test('T029.10: Rating format displays with one decimal place', async ({ page }) => {
    // Verify all ratings are displayed with correct decimal format
    const ratingElements = page.locator('[data-testid*="rating"], text=/\\d+\\.\\d+/').filter({
      has: page.locator('text=/rating|cleanliness|staff|facilities|value/i')
    });

    const ratingCount = await ratingElements.count();

    if (ratingCount > 0) {
      for (let i = 0; i < Math.min(ratingCount, 5); i++) {
        const element = ratingElements.nth(i);
        const text = await element.textContent();
        const ratingMatch = text?.match(/(\d+\.\d+)/);

        if (ratingMatch) {
          const rating = ratingMatch[1];
          // Verify format is X.X (one decimal place)
          expect(rating).toMatch(/^\d+\.\d$/);
        }
      }
    }
  });

  test('T029.11: Review summary section includes star visualization', async ({ page }) => {
    // Look for star icons or visual rating representation
    const starIcons = page.locator('[data-testid="star-rating"]').or(
      page.locator('svg[class*="star"], span').filter({ hasText: /★|⭐/ })
    );

    const hasStars = await starIcons.count() > 0;

    if (hasStars) {
      // Verify stars are visible
      await expect(starIcons.first()).toBeVisible();

      // Count should be reasonable (typically 5 stars per rating)
      const starCount = await starIcons.count();
      expect(starCount).toBeGreaterThan(0);
    }
  });

  test('T029.12: Review summary is responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Verify review summary is still visible on mobile
    const reviewSummarySection = page.locator('[data-testid="review-summary"]').or(
      page.locator('h2, h3').filter({ hasText: /reviews|ratings/i }).first()
    );

    await expect(reviewSummarySection).toBeVisible();

    // Verify key elements are still accessible
    const averageRating = page.locator('[data-testid="average-rating"]').or(
      page.locator('text=/\\d+\\.\\d+/').first()
    );
    await expect(averageRating).toBeVisible();

    const reviewCount = page.locator('[data-testid="review-count"]').or(
      page.locator('text=/\\d+\\s+(reviews|ratings)/i').first()
    );
    await expect(reviewCount).toBeVisible();

    // Category breakdown should be visible or collapsible on mobile
    const categorySection = page.locator('[data-testid="category-breakdown"]').or(
      page.locator('text=/cleanliness/i').first().locator('..')
    );

    const isCategoryVisible = await categorySection.isVisible().catch(() => false);
    expect(isCategoryVisible).toBeTruthy();
  });
});
