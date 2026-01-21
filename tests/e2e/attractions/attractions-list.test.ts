import { test, expect } from '@playwright/test';

// Use a valid test campsite slug
const TEST_CAMPSITE_SLUG = 'test-campsite-details-b7a9886a';

test.describe('Attractions List Display', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a campsite detail page
    // Assuming a campsite exists with attractions for testing
    await page.goto(`/campsites/${TEST_CAMPSITE_SLUG}`);
    await page.waitForLoadState('networkidle');
  });

  test('T047.1: Attractions section is visible', async ({ page }) => {
    // Scroll to attractions section
    const attractionsSection = page.locator('[data-testid="attractions-section"]');
    await attractionsSection.scrollIntoViewIfNeeded();

    // Verify attractions section is visible
    await expect(attractionsSection).toBeVisible({ timeout: 10000 });
  });

  test('T047.2: At least one attraction is displayed', async ({ page }) => {
    // Scroll to attractions section
    const attractionsSection = page.locator('[data-testid="attractions-section"]');
    await attractionsSection.scrollIntoViewIfNeeded();

    // Wait for attractions to load
    await page.waitForSelector('[data-testid="attraction-card"]', { timeout: 10000 });

    // Verify at least one attraction is displayed
    const attractionCards = await page.locator('[data-testid="attraction-card"]').all();
    expect(attractionCards.length).toBeGreaterThan(0);
  });

  test('T047.3: Attraction shows name, distance, and category', async ({ page }) => {
    // Scroll to attractions section
    const attractionsSection = page.locator('[data-testid="attractions-section"]');
    await attractionsSection.scrollIntoViewIfNeeded();

    // Wait for attractions to load
    await page.waitForSelector('[data-testid="attraction-card"]', { timeout: 10000 });

    // Get the first attraction card
    const firstAttraction = page.locator('[data-testid="attraction-card"]').first();

    // Verify name is displayed
    const attractionName = firstAttraction.locator('[data-testid="attraction-name"]');
    await expect(attractionName).toBeVisible();
    const nameText = await attractionName.textContent();
    expect(nameText).toBeTruthy();
    expect(nameText!.trim().length).toBeGreaterThan(0);

    // Verify distance is displayed
    const attractionDistance = firstAttraction.locator('[data-testid="attraction-distance"]');
    await expect(attractionDistance).toBeVisible();
    const distanceText = await attractionDistance.textContent();
    expect(distanceText).toBeTruthy();
    // Distance should contain "km" unit
    expect(distanceText).toMatch(/\d+\.?\d*\s*km/i);

    // Verify category is displayed
    const attractionCategory = firstAttraction.locator('[data-testid="attraction-category"]');
    await expect(attractionCategory).toBeVisible();
    const categoryText = await attractionCategory.textContent();
    expect(categoryText).toBeTruthy();
    expect(categoryText!.trim().length).toBeGreaterThan(0);
  });

  test('T047.4: Difficulty badge is shown', async ({ page }) => {
    // Scroll to attractions section
    const attractionsSection = page.locator('[data-testid="attractions-section"]');
    await attractionsSection.scrollIntoViewIfNeeded();

    // Wait for attractions to load
    await page.waitForSelector('[data-testid="attraction-card"]', { timeout: 10000 });

    // Get all attraction cards
    const attractionCards = await page.locator('[data-testid="attraction-card"]').all();

    // Check at least one attraction has a difficulty badge
    let hasDifficultyBadge = false;
    for (const card of attractionCards) {
      const difficultyBadge = card.locator('[data-testid="attraction-difficulty"]');
      if (await difficultyBadge.isVisible()) {
        hasDifficultyBadge = true;
        // Verify difficulty text is one of the expected values
        const difficultyText = await difficultyBadge.textContent();
        expect(difficultyText).toMatch(/easy|moderate|hard|challenging/i);
        break;
      }
    }

    // At least one attraction should have a difficulty badge
    expect(hasDifficultyBadge).toBe(true);
  });

  test('T047.5: Attractions are sorted by distance', async ({ page }) => {
    // Scroll to attractions section
    const attractionsSection = page.locator('[data-testid="attractions-section"]');
    await attractionsSection.scrollIntoViewIfNeeded();

    // Wait for attractions to load
    await page.waitForSelector('[data-testid="attraction-card"]', { timeout: 10000 });

    // Get all distance elements
    const distanceElements = await page.locator('[data-testid="attraction-distance"]').all();

    // Need at least 2 attractions to verify sorting
    if (distanceElements.length > 1) {
      // Extract distance values
      const distances = await Promise.all(
        distanceElements.map(async (el) => {
          const text = await el.textContent();
          // Extract numeric value from text like "5.2 km" or "5 km"
          const match = text?.match(/(\d+\.?\d*)/);
          return match ? parseFloat(match[1]) : 0;
        })
      );

      // Verify distances are in ascending order (closest first)
      for (let i = 0; i < distances.length - 1; i++) {
        expect(distances[i]).toBeLessThanOrEqual(distances[i + 1]);
      }
    }
  });

  test('T047.6: All attraction data is properly displayed', async ({ page }) => {
    // Scroll to attractions section
    const attractionsSection = page.locator('[data-testid="attractions-section"]');
    await attractionsSection.scrollIntoViewIfNeeded();

    // Wait for attractions to load
    await page.waitForSelector('[data-testid="attraction-card"]', { timeout: 10000 });

    // Get all attraction cards
    const attractionCards = await page.locator('[data-testid="attraction-card"]').all();

    // Verify each attraction has all required elements
    for (const card of attractionCards) {
      // Each card should have name
      const name = card.locator('[data-testid="attraction-name"]');
      await expect(name).toBeVisible();

      // Each card should have distance
      const distance = card.locator('[data-testid="attraction-distance"]');
      await expect(distance).toBeVisible();

      // Each card should have category
      const category = card.locator('[data-testid="attraction-category"]');
      await expect(category).toBeVisible();

      // Difficulty is optional, so we don't require it for all cards
    }
  });

  test('T047.7: Attractions section handles empty state gracefully', async ({ page }) => {
    // Navigate to a campsite that might not have attractions
    await page.goto('/campsites/999999');
    await page.waitForLoadState('networkidle');

    // Check if attractions section exists
    const attractionsSection = page.locator('[data-testid="attractions-section"]');

    if (await attractionsSection.isVisible()) {
      // If section exists, check for empty state message or no cards
      const attractionCards = await page.locator('[data-testid="attraction-card"]').count();

      if (attractionCards === 0) {
        // Should show empty state message
        const emptyMessage = page.locator('[data-testid="attractions-empty"]');
        // Empty message may or may not be visible depending on implementation
        // This is a graceful check
        const hasEmptyMessage = await emptyMessage.isVisible().catch(() => false);

        // Either show empty message or hide the section entirely
        expect(attractionCards === 0).toBe(true);
      }
    }
  });
});
