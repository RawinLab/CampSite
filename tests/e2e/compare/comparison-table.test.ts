import { test, expect } from '@playwright/test';

test.describe('Comparison Table Display', () => {
  test.beforeEach(async ({ page, context }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });

    // Navigate to wishlist and select 2 campsites
    await page.goto('/wishlist');
    await page.waitForLoadState('networkidle');

    const checkboxes = page.locator('[data-testid="compare-checkbox"]');
    await checkboxes.nth(0).click();
    await checkboxes.nth(1).click();

    // Click compare button
    const compareButton = page.locator('[data-testid="compare-btn"]');
    await compareButton.click();

    // Wait for navigation to compare page
    await page.waitForURL('**/compare**');
    await page.waitForLoadState('networkidle');
  });

  test('T104.1: Comparison table renders with correct structure', async ({ page }) => {
    const comparisonTable = page.locator('[data-testid="comparison-table"]');

    // Table should be visible
    await expect(comparisonTable).toBeVisible();

    // Should have table headers
    const headers = page.locator('thead th, [data-testid="table-header"]');
    const headerCount = await headers.count();
    expect(headerCount).toBeGreaterThanOrEqual(3); // Feature column + 2 campsite columns
  });

  test('T104.2: Table shows campsite names in columns', async ({ page }) => {
    const comparisonTable = page.locator('[data-testid="comparison-table"]');

    // Header cells should contain campsite names
    const campsiteHeaders = page.locator('[data-testid="campsite-header"]');
    const headerCount = await campsiteHeaders.count();
    expect(headerCount).toBe(2);

    // Each header should have text
    for (let i = 0; i < headerCount; i++) {
      const headerText = await campsiteHeaders.nth(i).textContent();
      expect(headerText?.trim().length).toBeGreaterThan(0);
    }
  });

  test('T104.3: Table displays campsite images', async ({ page }) => {
    const campsiteImages = page.locator('[data-testid="campsite-image"]');
    const imageCount = await campsiteImages.count();

    // Should have images for each campsite
    expect(imageCount).toBeGreaterThanOrEqual(2);

    // Images should have src attribute
    for (let i = 0; i < Math.min(imageCount, 2); i++) {
      const src = await campsiteImages.nth(i).getAttribute('src');
      expect(src).toBeTruthy();
    }
  });

  test('T104.4: Table shows price comparison row', async ({ page }) => {
    const priceRow = page.locator('[data-testid="price-row"]');
    await expect(priceRow).toBeVisible();

    // Should show price for each campsite
    const priceCells = priceRow.locator('[data-testid="price-cell"]');
    const priceCount = await priceCells.count();
    expect(priceCount).toBe(2);

    // Each price should contain numbers
    for (let i = 0; i < priceCount; i++) {
      const priceText = await priceCells.nth(i).textContent();
      expect(priceText).toMatch(/\d+/);
    }
  });

  test('T104.5: Table shows location comparison row', async ({ page }) => {
    const locationRow = page.locator('[data-testid="location-row"]');
    await expect(locationRow).toBeVisible();

    // Should show location for each campsite
    const locationCells = locationRow.locator('[data-testid="location-cell"]');
    const locationCount = await locationCells.count();
    expect(locationCount).toBe(2);
  });

  test('T104.6: Table shows capacity comparison row', async ({ page }) => {
    const capacityRow = page.locator('[data-testid="capacity-row"]');
    await expect(capacityRow).toBeVisible();

    // Should show capacity for each campsite
    const capacityCells = capacityRow.locator('[data-testid="capacity-cell"]');
    const capacityCount = await capacityCells.count();
    expect(capacityCount).toBe(2);
  });

  test('T104.7: Table shows amenities comparison row', async ({ page }) => {
    const amenitiesRow = page.locator('[data-testid="amenities-row"]');
    await expect(amenitiesRow).toBeVisible();

    // Amenities should be listed
    const amenityCells = amenitiesRow.locator('[data-testid="amenity-cell"]');
    const amenityCount = await amenityCells.count();
    expect(amenityCount).toBe(2);
  });

  test('T104.8: Table shows rating comparison row', async ({ page }) => {
    const ratingRow = page.locator('[data-testid="rating-row"]');
    await expect(ratingRow).toBeVisible();

    // Should show ratings
    const ratingCells = ratingRow.locator('[data-testid="rating-cell"]');
    const ratingCount = await ratingCells.count();
    expect(ratingCount).toBe(2);
  });

  test('T104.9: Table has proper column alignment', async ({ page }) => {
    const comparisonTable = page.locator('[data-testid="comparison-table"]');

    // Check table layout
    const hasProperLayout = await comparisonTable.evaluate((table) => {
      const rows = table.querySelectorAll('tr');
      if (rows.length === 0) return false;

      const firstRowCells = rows[0].querySelectorAll('th, td');
      const columnCount = firstRowCells.length;

      // All rows should have the same number of cells
      for (const row of rows) {
        const cells = row.querySelectorAll('th, td');
        if (cells.length !== columnCount) return false;
      }

      return true;
    });

    expect(hasProperLayout).toBeTruthy();
  });

  test('T104.10: Table is responsive and scrollable on narrow viewports', async ({ page }) => {
    // Resize to narrower viewport
    await page.setViewportSize({ width: 800, height: 600 });
    await page.waitForTimeout(300);

    const comparisonTable = page.locator('[data-testid="comparison-table"]');
    await expect(comparisonTable).toBeVisible();

    // Table container should be scrollable
    const tableContainer = page.locator('[data-testid="comparison-table-container"]');
    const isScrollable = await tableContainer.evaluate((el) => {
      return el.scrollWidth > el.clientWidth;
    });

    expect(isScrollable).toBeTruthy();
  });

  test('T104.11: Comparison with 3 campsites displays correctly', async ({ page }) => {
    // Go back and select a third campsite
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

    // Should have 3 campsite columns
    const campsiteHeaders = page.locator('[data-testid="campsite-header"]');
    const headerCount = await campsiteHeaders.count();
    expect(headerCount).toBe(3);
  });

  test('T104.12: Feature labels are in first column', async ({ page }) => {
    const featureColumn = page.locator('[data-testid="feature-column"]');
    await expect(featureColumn).toBeVisible();

    // Should contain standard feature labels
    const featureLabels = page.locator('[data-testid="feature-label"]');
    const labelCount = await featureLabels.count();
    expect(labelCount).toBeGreaterThan(5); // At least basic features
  });
});
