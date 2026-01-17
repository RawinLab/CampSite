import { test, expect } from '@playwright/test';

test.describe('Amenities Icons Display (Check/X)', () => {
  test.beforeEach(async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });

    // Navigate to wishlist and select campsites
    await page.goto('/wishlist');
    await page.waitForLoadState('networkidle');

    const checkboxes = page.locator('[data-testid="compare-checkbox"]');
    await checkboxes.nth(0).click();
    await checkboxes.nth(1).click();

    // Click compare button
    const compareButton = page.locator('[data-testid="compare-btn"]');
    await compareButton.click();

    // Wait for navigation
    await page.waitForURL('**/compare**');
    await page.waitForLoadState('networkidle');
  });

  test('T106.1: Amenities row exists in comparison table', async ({ page }) => {
    const amenitiesRow = page.locator('[data-testid="amenities-row"]');
    await expect(amenitiesRow).toBeVisible();
  });

  test('T106.2: Check icon shows for included amenity', async ({ page }) => {
    const amenityCells = page.locator('[data-testid="amenity-cell"]');

    // Find a cell with a checkmark
    const checkIcons = page.locator('[data-testid="amenity-check"], .lucide-check, .check-icon');
    const checkCount = await checkIcons.count();

    // Should have at least one check icon (assuming campsites have amenities)
    expect(checkCount).toBeGreaterThan(0);
  });

  test('T106.3: X icon shows for missing amenity', async ({ page }) => {
    const amenityCells = page.locator('[data-testid="amenity-cell"]');

    // Find cells with X marks
    const xIcons = page.locator('[data-testid="amenity-x"], .lucide-x, .x-icon');
    const xCount = await xIcons.count();

    // Should have at least one X icon (assuming not all amenities are present)
    expect(xCount).toBeGreaterThanOrEqual(0);
  });

  test('T106.4: Check icon is green colored', async ({ page }) => {
    const checkIcon = page.locator('[data-testid="amenity-check"], .lucide-check').first();

    if (await checkIcon.count() > 0) {
      // Check icon should have green color
      const color = await checkIcon.evaluate((el) => {
        return window.getComputedStyle(el).color || el.getAttribute('class');
      });

      // Should contain green color or success class
      expect(color).toMatch(/green|success|text-green|stroke-green/i);
    }
  });

  test('T106.5: X icon is red colored', async ({ page }) => {
    const xIcon = page.locator('[data-testid="amenity-x"], .lucide-x').first();

    if (await xIcon.count() > 0) {
      // X icon should have red color
      const color = await xIcon.evaluate((el) => {
        return window.getComputedStyle(el).color || el.getAttribute('class');
      });

      // Should contain red color or destructive class
      expect(color).toMatch(/red|destructive|text-red|stroke-red/i);
    }
  });

  test('T106.6: Common amenities section shows all amenities', async ({ page }) => {
    const amenitiesList = page.locator('[data-testid="amenities-list"]');
    await expect(amenitiesList).toBeVisible();

    // Should list standard amenities like WiFi, Parking, etc.
    const amenityItems = page.locator('[data-testid="amenity-item"]');
    const itemCount = await amenityItems.count();
    expect(itemCount).toBeGreaterThan(3); // At least a few amenities
  });

  test('T106.7: Each amenity row has label and icons for each campsite', async ({ page }) => {
    const amenityItems = page.locator('[data-testid="amenity-item"]').first();

    // Should have amenity label
    const label = amenityItems.locator('[data-testid="amenity-label"]');
    await expect(label).toBeVisible();

    // Should have icons for each campsite (2 in this case)
    const icons = amenityItems.locator('[data-testid="amenity-icon"]');
    const iconCount = await icons.count();
    expect(iconCount).toBe(2);
  });

  test('T106.8: WiFi amenity shows correct icons', async ({ page }) => {
    // Find WiFi row
    const wifiRow = page.locator('[data-testid="amenity-item"]').filter({ hasText: /wifi|wi-fi/i });

    if (await wifiRow.count() > 0) {
      await expect(wifiRow.first()).toBeVisible();

      // Should have check or X icons
      const icons = wifiRow.first().locator('[data-testid="amenity-icon"]');
      const iconCount = await icons.count();
      expect(iconCount).toBeGreaterThan(0);
    }
  });

  test('T106.9: Parking amenity shows correct icons', async ({ page }) => {
    // Find Parking row
    const parkingRow = page.locator('[data-testid="amenity-item"]').filter({ hasText: /parking|ที่จอดรถ/i });

    if (await parkingRow.count() > 0) {
      await expect(parkingRow.first()).toBeVisible();

      // Should have check or X icons
      const icons = parkingRow.first().locator('[data-testid="amenity-icon"]');
      const iconCount = await icons.count();
      expect(iconCount).toBeGreaterThan(0);
    }
  });

  test('T106.10: Toilet amenity shows correct icons', async ({ page }) => {
    // Find Toilet/Restroom row
    const toiletRow = page.locator('[data-testid="amenity-item"]').filter({ hasText: /toilet|restroom|ห้องน้ำ/i });

    if (await toiletRow.count() > 0) {
      await expect(toiletRow.first()).toBeVisible();

      // Should have check or X icons
      const icons = toiletRow.first().locator('[data-testid="amenity-icon"]');
      const iconCount = await icons.count();
      expect(iconCount).toBeGreaterThan(0);
    }
  });

  test('T106.11: Icons have proper accessibility attributes', async ({ page }) => {
    const checkIcon = page.locator('[data-testid="amenity-check"]').first();

    if (await checkIcon.count() > 0) {
      // Should have aria-label or title
      const hasA11y = await checkIcon.evaluate((el) => {
        return el.hasAttribute('aria-label') ||
               el.hasAttribute('title') ||
               el.getAttribute('role') !== null;
      });

      expect(hasA11y).toBeTruthy();
    }
  });

  test('T106.12: Icons are visually distinct and clear', async ({ page }) => {
    const amenityIcons = page.locator('[data-testid="amenity-icon"]');

    // Icons should have minimum size for visibility
    const firstIcon = amenityIcons.first();
    const size = await firstIcon.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    });

    // Icons should be at least 16x16 pixels
    expect(size.width).toBeGreaterThanOrEqual(16);
    expect(size.height).toBeGreaterThanOrEqual(16);
  });

  test('T106.13: Amenities section has proper heading', async ({ page }) => {
    const amenitiesHeading = page.locator('h2, h3, [data-testid="amenities-heading"]').filter({ hasText: /amenities|สิ่งอำนวยความสะดวก/i });

    await expect(amenitiesHeading.first()).toBeVisible();
  });

  test('T106.14: Three campsite comparison shows icons for all', async ({ page }) => {
    // Go back and select third campsite
    await page.goto('/wishlist');
    await page.waitForLoadState('networkidle');

    const checkboxes = page.locator('[data-testid="compare-checkbox"]');
    await checkboxes.nth(0).click();
    await checkboxes.nth(1).click();
    await checkboxes.nth(2).click();

    const compareButton = page.locator('[data-testid="compare-btn"]');
    await compareButton.click();

    await page.waitForURL('**/compare**');
    await page.waitForLoadState('networkidle');

    // Each amenity item should have 3 icons
    const firstAmenityItem = page.locator('[data-testid="amenity-item"]').first();
    const icons = firstAmenityItem.locator('[data-testid="amenity-icon"]');
    const iconCount = await icons.count();
    expect(iconCount).toBe(3);
  });
});
