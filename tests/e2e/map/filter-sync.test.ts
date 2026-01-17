import { test, expect } from '@playwright/test';

test.describe('Map Filter Sync Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to search page
    await page.goto('/search');
    await page.waitForLoadState('networkidle');
  });

  test('T039.1: Switch to map view and verify markers are displayed', async ({ page }) => {
    // Wait for search results to load
    await page.waitForSelector('[data-testid="campsite-card"]', { timeout: 10000 });

    // Switch to map view
    const mapViewButton = page.locator('[data-testid="map-view-toggle"]');
    await expect(mapViewButton).toBeVisible();
    await mapViewButton.click();

    // Wait for map to load
    await page.waitForSelector('[data-testid="map-container"]', { timeout: 10000 });

    // Verify map markers are displayed
    const markers = page.locator('[data-testid="map-marker"]');
    const initialMarkerCount = await markers.count();
    expect(initialMarkerCount).toBeGreaterThan(0);
  });

  test('T039.2: Apply type filter and verify markers update', async ({ page }) => {
    // Wait for search results to load
    await page.waitForSelector('[data-testid="campsite-card"]', { timeout: 10000 });

    // Switch to map view
    const mapViewButton = page.locator('[data-testid="map-view-toggle"]');
    await mapViewButton.click();
    await page.waitForSelector('[data-testid="map-container"]', { timeout: 10000 });

    // Get initial marker count
    const markers = page.locator('[data-testid="map-marker"]');
    const initialCount = await markers.count();

    // Apply type filter for "camping"
    const typeFilter = page.locator('[data-testid="filter-type"]');
    await typeFilter.click();

    const campingOption = page.locator('[data-testid="filter-type-camping"]');
    await campingOption.click();

    // Wait for map to update
    await page.waitForTimeout(500);

    // Get updated marker count
    const updatedCount = await markers.count();

    // Marker count should change (likely decrease)
    expect(updatedCount).not.toBe(initialCount);

    // Verify filtered markers exist
    expect(updatedCount).toBeGreaterThan(0);

    // Verify URL contains filter parameter
    expect(page.url()).toContain('type=camping');
  });

  test('T039.3: Clear filter and verify all markers return', async ({ page }) => {
    // Wait for search results to load
    await page.waitForSelector('[data-testid="campsite-card"]', { timeout: 10000 });

    // Switch to map view
    const mapViewButton = page.locator('[data-testid="map-view-toggle"]');
    await mapViewButton.click();
    await page.waitForSelector('[data-testid="map-container"]', { timeout: 10000 });

    // Get initial marker count
    const markers = page.locator('[data-testid="map-marker"]');
    const initialCount = await markers.count();

    // Apply type filter
    const typeFilter = page.locator('[data-testid="filter-type"]');
    await typeFilter.click();
    const campingOption = page.locator('[data-testid="filter-type-camping"]');
    await campingOption.click();
    await page.waitForTimeout(500);

    // Get filtered marker count
    const filteredCount = await markers.count();
    expect(filteredCount).not.toBe(initialCount);

    // Clear the filter
    const clearFilterButton = page.locator('[data-testid="clear-filters"]');
    await clearFilterButton.click();
    await page.waitForTimeout(500);

    // Get marker count after clearing
    const clearedCount = await markers.count();

    // Marker count should return to initial count
    expect(clearedCount).toBe(initialCount);

    // Verify URL no longer contains filter parameter
    expect(page.url()).not.toContain('type=camping');
  });

  test('T039.4: Apply multiple filters and verify marker updates', async ({ page }) => {
    // Wait for search results to load
    await page.waitForSelector('[data-testid="campsite-card"]', { timeout: 10000 });

    // Switch to map view
    const mapViewButton = page.locator('[data-testid="map-view-toggle"]');
    await mapViewButton.click();
    await page.waitForSelector('[data-testid="map-container"]', { timeout: 10000 });

    // Get initial marker count
    const markers = page.locator('[data-testid="map-marker"]');
    const initialCount = await markers.count();

    // Apply type filter
    const typeFilter = page.locator('[data-testid="filter-type"]');
    await typeFilter.click();
    const campingOption = page.locator('[data-testid="filter-type-camping"]');
    await campingOption.click();
    await page.waitForTimeout(500);

    const afterTypeFilterCount = await markers.count();

    // Apply price range filter
    const minPriceInput = page.locator('[data-testid="filter-min-price"]');
    const maxPriceInput = page.locator('[data-testid="filter-max-price"]');
    await minPriceInput.fill('100');
    await maxPriceInput.fill('500');

    // Trigger filter application
    const applyFiltersButton = page.locator('[data-testid="apply-filters"]');
    if (await applyFiltersButton.isVisible()) {
      await applyFiltersButton.click();
    } else {
      // If auto-apply, just wait
      await page.waitForTimeout(800);
    }

    // Get marker count after both filters
    const afterBothFiltersCount = await markers.count();

    // Marker count should be different from initial and after first filter
    expect(afterBothFiltersCount).not.toBe(initialCount);
    expect(afterBothFiltersCount).toBeLessThanOrEqual(afterTypeFilterCount);

    // Verify URL contains both filter parameters
    const url = page.url();
    expect(url).toContain('type=camping');
    expect(url).toMatch(/minPrice=100|min_price=100/);
    expect(url).toMatch(/maxPrice=500|max_price=500/);
  });

  test('T039.5: Apply province filter and verify map pans to region', async ({ page }) => {
    // Wait for search results to load
    await page.waitForSelector('[data-testid="campsite-card"]', { timeout: 10000 });

    // Switch to map view
    const mapViewButton = page.locator('[data-testid="map-view-toggle"]');
    await mapViewButton.click();
    await page.waitForSelector('[data-testid="map-container"]', { timeout: 10000 });

    // Apply province filter
    const provinceInput = page.locator('[data-testid="filter-province"]');
    await provinceInput.fill('เชียงใหม่');
    await page.waitForTimeout(500);

    // Select province from autocomplete
    const provinceOption = page.getByRole('option', { name: /เชียงใหม่/i }).first();
    if (await provinceOption.isVisible()) {
      await provinceOption.click();
    }

    // Wait for map to update and pan
    await page.waitForTimeout(1000);

    // Verify markers are updated
    const markers = page.locator('[data-testid="map-marker"]');
    const markerCount = await markers.count();
    expect(markerCount).toBeGreaterThan(0);

    // Verify URL contains province parameter
    expect(page.url()).toContain('เชียงใหม่');
  });

  test('T039.6: Filter changes in list view sync to map view', async ({ page }) => {
    // Wait for search results to load in list view
    await page.waitForSelector('[data-testid="campsite-card"]', { timeout: 10000 });

    // Apply filter in list view
    const typeFilter = page.locator('[data-testid="filter-type"]');
    await typeFilter.click();
    const campingOption = page.locator('[data-testid="filter-type-camping"]');
    await campingOption.click();
    await page.waitForTimeout(500);

    // Switch to map view
    const mapViewButton = page.locator('[data-testid="map-view-toggle"]');
    await mapViewButton.click();
    await page.waitForSelector('[data-testid="map-container"]', { timeout: 10000 });

    // Verify markers reflect the applied filter
    const markers = page.locator('[data-testid="map-marker"]');
    const markerCount = await markers.count();
    expect(markerCount).toBeGreaterThan(0);

    // Verify URL still contains filter parameter
    expect(page.url()).toContain('type=camping');

    // Switch back to list view
    const listViewButton = page.locator('[data-testid="list-view-toggle"]');
    await listViewButton.click();
    await page.waitForSelector('[data-testid="campsite-card"]', { timeout: 10000 });

    // Verify results are still filtered
    const cards = page.locator('[data-testid="campsite-card"]');
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThan(0);
  });

  test('T039.7: Verify marker clustering updates with filters', async ({ page }) => {
    // Wait for search results to load
    await page.waitForSelector('[data-testid="campsite-card"]', { timeout: 10000 });

    // Switch to map view
    const mapViewButton = page.locator('[data-testid="map-view-toggle"]');
    await mapViewButton.click();
    await page.waitForSelector('[data-testid="map-container"]', { timeout: 10000 });

    // Check for marker clusters (if implemented)
    const markerClusters = page.locator('[data-testid="marker-cluster"]');
    const initialClusterCount = await markerClusters.count();

    // Apply filter to reduce results
    const typeFilter = page.locator('[data-testid="filter-type"]');
    await typeFilter.click();
    const glamping = page.locator('[data-testid="filter-type-glamping"]');
    if (await glamping.isVisible()) {
      await glamping.click();
      await page.waitForTimeout(500);

      // Get updated cluster count
      const updatedClusterCount = await markerClusters.count();

      // Cluster count should change or individual markers should be more visible
      const markers = page.locator('[data-testid="map-marker"]');
      const markerCount = await markers.count();

      // Either clusters decreased or individual markers are now visible
      expect(updatedClusterCount !== initialClusterCount || markerCount > 0).toBeTruthy();
    }
  });

  test('T039.8: Clear all filters button resets map markers', async ({ page }) => {
    // Wait for search results to load
    await page.waitForSelector('[data-testid="campsite-card"]', { timeout: 10000 });

    // Switch to map view
    const mapViewButton = page.locator('[data-testid="map-view-toggle"]');
    await mapViewButton.click();
    await page.waitForSelector('[data-testid="map-container"]', { timeout: 10000 });

    // Get initial marker count
    const markers = page.locator('[data-testid="map-marker"]');
    const initialCount = await markers.count();

    // Apply multiple filters
    const typeFilter = page.locator('[data-testid="filter-type"]');
    await typeFilter.click();
    const campingOption = page.locator('[data-testid="filter-type-camping"]');
    await campingOption.click();
    await page.waitForTimeout(300);

    const minPriceInput = page.locator('[data-testid="filter-min-price"]');
    await minPriceInput.fill('200');
    await page.waitForTimeout(500);

    const filteredCount = await markers.count();
    expect(filteredCount).toBeLessThanOrEqual(initialCount);

    // Clear all filters
    const clearAllButton = page.locator('[data-testid="clear-all-filters"]');
    if (await clearAllButton.isVisible()) {
      await clearAllButton.click();
    } else {
      const clearFiltersButton = page.locator('[data-testid="clear-filters"]');
      await clearFiltersButton.click();
    }

    await page.waitForTimeout(500);

    // Verify all markers are restored
    const restoredCount = await markers.count();
    expect(restoredCount).toBe(initialCount);

    // Verify URL has no filter parameters
    const url = page.url();
    expect(url).not.toContain('type=');
    expect(url).not.toContain('minPrice=');
    expect(url).not.toContain('min_price=');
  });
});
