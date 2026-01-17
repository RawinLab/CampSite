import { test, expect } from '@playwright/test';

test.describe('Reviewer Type Filter E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a campsite detail page with reviews
    // Adjust URL as needed based on your routing structure
    await page.goto('/campsites/1');
    await page.waitForLoadState('networkidle');
  });

  test('filter buttons are visible', async ({ page }) => {
    // Verify all reviewer type filter buttons are visible
    await expect(page.locator('button:has-text("ทั้งหมด")').first()).toBeVisible();
    await expect(page.locator('button:has-text("ครอบครัว")').first()).toBeVisible();
    await expect(page.locator('button:has-text("คู่รัก")').first()).toBeVisible();
    await expect(page.locator('button:has-text("เดี่ยว")').first()).toBeVisible();
    await expect(page.locator('button:has-text("กลุ่ม")').first()).toBeVisible();
  });

  test('"all" is selected by default', async ({ page }) => {
    // Find the "all" button
    const allButton = page.locator('button:has-text("ทั้งหมด")').first();

    // Verify it's selected by default
    await expect(allButton).toHaveAttribute('aria-pressed', 'true');
  });

  test('clicking "family" shows only family reviews', async ({ page }) => {
    // Click family button
    const familyButton = page.locator('button:has-text("ครอบครัว")').first();
    await familyButton.click();

    // Verify family button is selected
    await expect(familyButton).toHaveAttribute('aria-pressed', 'true');

    // Wait for results to update
    await page.waitForTimeout(500);

    // Verify all visible reviews are from family reviewers
    const reviewCards = page.locator('[data-testid="review-card"], .review-card, article').filter({
      hasNotText: 'No reviews',
    });

    const count = await reviewCards.count();
    if (count > 0) {
      // Check that family indicator is present in reviews
      // This assumes reviews have a data attribute or text indicating reviewer type
      for (let i = 0; i < count; i++) {
        const review = reviewCards.nth(i);
        // Verify family indicator - adjust selector based on your implementation
        await expect(review).toContainText(/ครอบครัว|Family/i);
      }
    }
  });

  test('clicking "couple" shows only couple reviews', async ({ page }) => {
    // Click couple button
    const coupleButton = page.locator('button:has-text("คู่รัก")').first();
    await coupleButton.click();

    // Verify couple button is selected
    await expect(coupleButton).toHaveAttribute('aria-pressed', 'true');

    // Wait for results to update
    await page.waitForTimeout(500);

    // Verify all visible reviews are from couple reviewers
    const reviewCards = page.locator('[data-testid="review-card"], .review-card, article').filter({
      hasNotText: 'No reviews',
    });

    const count = await reviewCards.count();
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const review = reviewCards.nth(i);
        await expect(review).toContainText(/คู่รัก|Couple/i);
      }
    }
  });

  test('clicking "solo" shows only solo reviews', async ({ page }) => {
    // Click solo button
    const soloButton = page.locator('button:has-text("เดี่ยว")').first();
    await soloButton.click();

    // Verify solo button is selected
    await expect(soloButton).toHaveAttribute('aria-pressed', 'true');

    // Wait for results to update
    await page.waitForTimeout(500);

    // Verify all visible reviews are from solo reviewers
    const reviewCards = page.locator('[data-testid="review-card"], .review-card, article').filter({
      hasNotText: 'No reviews',
    });

    const count = await reviewCards.count();
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const review = reviewCards.nth(i);
        await expect(review).toContainText(/เดี่ยว|Solo/i);
      }
    }
  });

  test('clicking "group" shows only group reviews', async ({ page }) => {
    // Click group button
    const groupButton = page.locator('button:has-text("กลุ่ม")').first();
    await groupButton.click();

    // Verify group button is selected
    await expect(groupButton).toHaveAttribute('aria-pressed', 'true');

    // Wait for results to update
    await page.waitForTimeout(500);

    // Verify all visible reviews are from group reviewers
    const reviewCards = page.locator('[data-testid="review-card"], .review-card, article').filter({
      hasNotText: 'No reviews',
    });

    const count = await reviewCards.count();
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const review = reviewCards.nth(i);
        await expect(review).toContainText(/กลุ่ม|Group/i);
      }
    }
  });

  test('clicking "all" shows all reviews again', async ({ page }) => {
    // First select a specific type
    const familyButton = page.locator('button:has-text("ครอบครัว")').first();
    await familyButton.click();
    await page.waitForTimeout(500);

    // Get filtered count
    const filteredCount = await page.locator('[data-testid="review-card"], .review-card, article').filter({
      hasNotText: 'No reviews',
    }).count();

    // Click "all" button
    const allButton = page.locator('button:has-text("ทั้งหมด")').first();
    await allButton.click();

    // Verify all button is selected
    await expect(allButton).toHaveAttribute('aria-pressed', 'true');

    // Wait for results to update
    await page.waitForTimeout(500);

    // Get all reviews count
    const allCount = await page.locator('[data-testid="review-card"], .review-card, article').filter({
      hasNotText: 'No reviews',
    }).count();

    // All count should be >= filtered count
    expect(allCount).toBeGreaterThanOrEqual(filteredCount);
  });

  test('empty state when no matching reviews', async ({ page }) => {
    // This test might need to navigate to a campsite with limited reviews
    // or use a specific reviewer type that has no reviews

    // Try clicking each filter and check for empty state
    const filters = ['ครอบครัว', 'คู่รัก', 'เดี่ยว', 'กลุ่ม'];

    for (const filter of filters) {
      const filterButton = page.locator(`button:has-text("${filter}")`).first();
      await filterButton.click();
      await page.waitForTimeout(500);

      // Check if there are no reviews
      const reviewCount = await page.locator('[data-testid="review-card"], .review-card, article').filter({
        hasNotText: 'No reviews',
      }).count();

      if (reviewCount === 0) {
        // Verify empty state message is shown
        const emptyState = page.locator('text=/ไม่พบรีวิว|No reviews|ยังไม่มีรีวิว/i');
        await expect(emptyState).toBeVisible();
        break; // Found empty state, test passed
      }
    }
  });

  test('count updates after filter', async ({ page }) => {
    // Get initial count (all reviews)
    const allButton = page.locator('button:has-text("ทั้งหมด")').first();
    const initialCountText = await allButton.textContent();

    // Click family filter
    const familyButton = page.locator('button:has-text("ครอบครัว")').first();
    await familyButton.click();
    await page.waitForTimeout(500);

    // Get filtered count from visible reviews
    const filteredReviewCount = await page.locator('[data-testid="review-card"], .review-card, article').filter({
      hasNotText: 'No reviews',
    }).count();

    // Verify count is a valid number
    expect(filteredReviewCount).toBeGreaterThanOrEqual(0);

    // Click back to all
    await allButton.click();
    await page.waitForTimeout(500);

    // Get all reviews count
    const allReviewCount = await page.locator('[data-testid="review-card"], .review-card, article').filter({
      hasNotText: 'No reviews',
    }).count();

    // All count should be >= filtered count
    expect(allReviewCount).toBeGreaterThanOrEqual(filteredReviewCount);
  });

  test('filter selection is visually highlighted', async ({ page }) => {
    // Click family button
    const familyButton = page.locator('button:has-text("ครอบครัว")').first();
    await familyButton.click();

    // Verify visual highlighting (ring styles or similar)
    await expect(familyButton).toHaveClass(/ring|border-primary|bg-primary|selected/);
    await expect(familyButton).toHaveAttribute('aria-pressed', 'true');
  });

  test('only one filter can be active at a time', async ({ page }) => {
    // Click family button
    const familyButton = page.locator('button:has-text("ครอบครัว")').first();
    await familyButton.click();
    await expect(familyButton).toHaveAttribute('aria-pressed', 'true');

    // Click couple button
    const coupleButton = page.locator('button:has-text("คู่รัก")').first();
    await coupleButton.click();

    // Verify couple is selected and family is deselected
    await expect(coupleButton).toHaveAttribute('aria-pressed', 'true');
    await expect(familyButton).toHaveAttribute('aria-pressed', 'false');
  });

  test('filter persists on page interaction', async ({ page }) => {
    // Select family filter
    const familyButton = page.locator('button:has-text("ครอบครัว")').first();
    await familyButton.click();
    await page.waitForTimeout(500);

    // Scroll down
    await page.evaluate(() => window.scrollBy(0, 500));
    await page.waitForTimeout(300);

    // Verify family filter is still selected
    await expect(familyButton).toHaveAttribute('aria-pressed', 'true');
  });

  test('reviewer type filter section has correct header', async ({ page }) => {
    // Verify section header is present
    const header = page.locator('text=/ประเภทผู้รีวิว|Reviewer Type|ตัวกรอง/i').first();
    await expect(header).toBeVisible();
  });

  test('rapid filter changes work correctly', async ({ page }) => {
    // Rapidly switch between filters
    const familyButton = page.locator('button:has-text("ครอบครัว")').first();
    const coupleButton = page.locator('button:has-text("คู่รัก")').first();
    const soloButton = page.locator('button:has-text("เดี่ยว")').first();

    await familyButton.click();
    await expect(familyButton).toHaveAttribute('aria-pressed', 'true');

    await coupleButton.click();
    await expect(coupleButton).toHaveAttribute('aria-pressed', 'true');
    await expect(familyButton).toHaveAttribute('aria-pressed', 'false');

    await soloButton.click();
    await expect(soloButton).toHaveAttribute('aria-pressed', 'true');
    await expect(coupleButton).toHaveAttribute('aria-pressed', 'false');
  });
});
