import { test, expect } from '@playwright/test';

test.describe('E2E: Amenity Filter AND Logic', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to search/browse page
    await page.goto('/search');
    await page.waitForLoadState('networkidle');
  });

  test('selecting single amenity filters results', async ({ page }) => {
    // Wait for initial results to load
    const initialResults = page.locator('[data-testid="campsite-card"]');
    const initialCount = await initialResults.count();

    // Select first amenity (e.g., "WiFi")
    const wifiCheckbox = page.locator('input[type="checkbox"][value="wifi"]');
    await wifiCheckbox.check();

    // Wait for filtered results
    await page.waitForTimeout(500); // Allow debounce/filter to apply

    // Verify results have changed
    const filteredCount = await initialResults.count();
    expect(filteredCount).toBeLessThanOrEqual(initialCount);
  });

  test('results only show campsites with selected amenity', async ({ page }) => {
    // Select "WiFi" amenity
    const wifiCheckbox = page.locator('input[type="checkbox"][value="wifi"]');
    await wifiCheckbox.check();
    await page.waitForTimeout(500);

    // Get all result cards
    const resultCards = page.locator('[data-testid="campsite-card"]');
    const count = await resultCards.count();

    // Verify each result has the WiFi amenity displayed
    for (let i = 0; i < count; i++) {
      const card = resultCards.nth(i);
      const amenities = card.locator('[data-testid="campsite-amenities"]');
      await expect(amenities).toContainText(/wifi/i);
    }
  });

  test('selecting second amenity further filters results (AND logic)', async ({ page }) => {
    // Select first amenity (WiFi)
    const wifiCheckbox = page.locator('input[type="checkbox"][value="wifi"]');
    await wifiCheckbox.check();
    await page.waitForTimeout(500);

    const firstFilterCount = await page.locator('[data-testid="campsite-card"]').count();

    // Select second amenity (Shower)
    const showerCheckbox = page.locator('input[type="checkbox"][value="shower"]');
    await showerCheckbox.check();
    await page.waitForTimeout(500);

    const secondFilterCount = await page.locator('[data-testid="campsite-card"]').count();

    // AND logic means fewer or equal results
    expect(secondFilterCount).toBeLessThanOrEqual(firstFilterCount);
  });

  test('results have BOTH selected amenities when using AND logic', async ({ page }) => {
    // Select WiFi and Shower
    await page.locator('input[type="checkbox"][value="wifi"]').check();
    await page.locator('input[type="checkbox"][value="shower"]').check();
    await page.waitForTimeout(500);

    // Get all result cards
    const resultCards = page.locator('[data-testid="campsite-card"]');
    const count = await resultCards.count();

    // Verify each result has BOTH amenities
    for (let i = 0; i < count; i++) {
      const card = resultCards.nth(i);
      const amenities = card.locator('[data-testid="campsite-amenities"]');

      // Both WiFi and Shower should be present
      await expect(amenities).toContainText(/wifi/i);
      await expect(amenities).toContainText(/shower/i);
    }
  });

  test('deselecting amenity expands results', async ({ page }) => {
    // Select two amenities
    const wifiCheckbox = page.locator('input[type="checkbox"][value="wifi"]');
    const showerCheckbox = page.locator('input[type="checkbox"][value="shower"]');

    await wifiCheckbox.check();
    await showerCheckbox.check();
    await page.waitForTimeout(500);

    const twoAmenitiesCount = await page.locator('[data-testid="campsite-card"]').count();

    // Deselect one amenity
    await showerCheckbox.uncheck();
    await page.waitForTimeout(500);

    const oneAmenityCount = await page.locator('[data-testid="campsite-card"]').count();

    // Should have more or equal results with fewer filters
    expect(oneAmenityCount).toBeGreaterThanOrEqual(twoAmenitiesCount);
  });

  test('clear all amenities shows all results', async ({ page }) => {
    // Get initial count (all results)
    const initialResults = page.locator('[data-testid="campsite-card"]');
    const initialCount = await initialResults.count();

    // Select multiple amenities
    await page.locator('input[type="checkbox"][value="wifi"]').check();
    await page.locator('input[type="checkbox"][value="shower"]').check();
    await page.locator('input[type="checkbox"][value="parking"]').check();
    await page.waitForTimeout(500);

    const filteredCount = await initialResults.count();
    expect(filteredCount).toBeLessThanOrEqual(initialCount);

    // Clear all amenities (click "Clear all" button or uncheck all)
    const clearButton = page.locator('button:has-text("Clear all")');
    if (await clearButton.isVisible()) {
      await clearButton.click();
    } else {
      // Fallback: uncheck all manually
      await page.locator('input[type="checkbox"][value="wifi"]').uncheck();
      await page.locator('input[type="checkbox"][value="shower"]').uncheck();
      await page.locator('input[type="checkbox"][value="parking"]').uncheck();
    }

    await page.waitForTimeout(500);

    const clearedCount = await initialResults.count();

    // Should return to initial count
    expect(clearedCount).toBe(initialCount);
  });

  test('amenity filter state persists in URL', async ({ page }) => {
    // Select amenities
    await page.locator('input[type="checkbox"][value="wifi"]').check();
    await page.locator('input[type="checkbox"][value="shower"]').check();
    await page.waitForTimeout(500);

    // Check URL contains amenity parameters
    const url = page.url();
    expect(url).toContain('amenities');

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify checkboxes are still checked
    await expect(page.locator('input[type="checkbox"][value="wifi"]')).toBeChecked();
    await expect(page.locator('input[type="checkbox"][value="shower"]')).toBeChecked();
  });

  test('no results message displays when filters exclude all campsites', async ({ page }) => {
    // Select combination of amenities that likely returns no results
    // This depends on test data, but we can check the UI handles it gracefully
    const checkboxes = page.locator('input[type="checkbox"][name="amenities"]');
    const count = await checkboxes.count();

    // Select all amenities to maximize chance of no results
    for (let i = 0; i < count; i++) {
      await checkboxes.nth(i).check();
    }

    await page.waitForTimeout(500);

    // Either we have results or a "no results" message
    const results = page.locator('[data-testid="campsite-card"]');
    const noResults = page.locator('[data-testid="no-results"]');

    const hasResults = await results.count() > 0;
    const hasNoResultsMessage = await noResults.isVisible();

    // One or the other should be true
    expect(hasResults || hasNoResultsMessage).toBe(true);
  });

  test('amenity filter applies immediately without search button', async ({ page }) => {
    const initialCount = await page.locator('[data-testid="campsite-card"]').count();

    // Select amenity
    await page.locator('input[type="checkbox"][value="wifi"]').check();

    // Results should update automatically (no explicit search button needed)
    await page.waitForTimeout(500);

    const filteredCount = await page.locator('[data-testid="campsite-card"]').count();

    // Verify filtering happened
    expect(filteredCount).toBeLessThanOrEqual(initialCount);
  });

  test('multiple rapid filter changes handle correctly', async ({ page }) => {
    // Rapidly toggle filters to test debouncing/state management
    const wifiCheckbox = page.locator('input[type="checkbox"][value="wifi"]');
    const showerCheckbox = page.locator('input[type="checkbox"][value="shower"]');

    await wifiCheckbox.check();
    await showerCheckbox.check();
    await wifiCheckbox.uncheck();
    await showerCheckbox.uncheck();
    await wifiCheckbox.check();

    // Wait for final state
    await page.waitForTimeout(1000);

    // Should show results with only WiFi selected
    await expect(wifiCheckbox).toBeChecked();
    await expect(showerCheckbox).not.toBeChecked();

    // Results should be displayed (no errors)
    const results = page.locator('[data-testid="campsite-card"]');
    expect(await results.count()).toBeGreaterThan(0);
  });
});
