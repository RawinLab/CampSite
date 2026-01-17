import { test, expect } from '@playwright/test';

test.describe('Map Loading with Markers', () => {
  test.describe('Desktop viewport', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('/search');
      await page.waitForLoadState('networkidle');
    });

    test('T032.1: Navigate to search page and toggle to map view', async ({ page }) => {
      // Verify we're on the search page
      await expect(page).toHaveURL(/\/search/);

      // Find and click the map view toggle
      const mapToggle = page.getByRole('button', { name: /map|แผนที่/i });
      await expect(mapToggle).toBeVisible();
      await mapToggle.click();

      // Wait for map view to activate
      await page.waitForTimeout(500);
    });

    test('T032.2: Verify map container is visible after toggle', async ({ page }) => {
      // Toggle to map view
      const mapToggle = page.getByRole('button', { name: /map|แผนที่/i });
      await mapToggle.click();
      await page.waitForTimeout(500);

      // Check for map container - could be a div with specific class or data-testid
      const mapContainer = page.locator('[data-testid="map-container"]').or(
        page.locator('.map-container')
      ).or(
        page.locator('#map')
      );

      await expect(mapContainer.first()).toBeVisible();
    });

    test('T032.3: Verify at least one marker is displayed', async ({ page }) => {
      // Toggle to map view
      const mapToggle = page.getByRole('button', { name: /map|แผนที่/i });
      await mapToggle.click();

      // Wait for map to load
      await page.waitForTimeout(1000);

      // Check for markers - these could be various selectors depending on implementation
      const markers = page.locator('[data-testid="map-marker"]').or(
        page.locator('.map-marker')
      ).or(
        page.locator('.leaflet-marker-icon')
      ).or(
        page.locator('[role="button"][aria-label*="marker"]')
      );

      // Wait for at least one marker to appear
      await expect(markers.first()).toBeVisible({ timeout: 3000 });

      // Verify count is at least 1
      const markerCount = await markers.count();
      expect(markerCount).toBeGreaterThan(0);
    });

    test('T032.4: Verify map loads within 3 seconds', async ({ page }) => {
      const startTime = Date.now();

      // Toggle to map view
      const mapToggle = page.getByRole('button', { name: /map|แผนที่/i });
      await mapToggle.click();

      // Wait for map container to be visible
      const mapContainer = page.locator('[data-testid="map-container"]').or(
        page.locator('.map-container')
      ).or(
        page.locator('#map')
      );

      await expect(mapContainer.first()).toBeVisible({ timeout: 3000 });

      // Wait for markers to appear
      const markers = page.locator('[data-testid="map-marker"]').or(
        page.locator('.map-marker')
      ).or(
        page.locator('.leaflet-marker-icon')
      ).or(
        page.locator('[role="button"][aria-label*="marker"]')
      );

      await expect(markers.first()).toBeVisible({ timeout: 3000 });

      const endTime = Date.now();
      const loadTime = endTime - startTime;

      // Verify map loaded within 3 seconds (3000ms)
      expect(loadTime).toBeLessThan(3000);
    });

    test('T032.5: Map container has appropriate dimensions', async ({ page }) => {
      // Toggle to map view
      const mapToggle = page.getByRole('button', { name: /map|แผนที่/i });
      await mapToggle.click();
      await page.waitForTimeout(500);

      // Get map container
      const mapContainer = page.locator('[data-testid="map-container"]').or(
        page.locator('.map-container')
      ).or(
        page.locator('#map')
      );

      // Verify container is visible and has reasonable dimensions
      const boundingBox = await mapContainer.first().boundingBox();
      expect(boundingBox).not.toBeNull();
      expect(boundingBox!.width).toBeGreaterThan(300);
      expect(boundingBox!.height).toBeGreaterThan(300);
    });
  });

  test.describe('Mobile viewport', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/search');
      await page.waitForLoadState('networkidle');
    });

    test('T032.6: Mobile - Navigate to search page and toggle to map view', async ({ page }) => {
      // Verify we're on the search page
      await expect(page).toHaveURL(/\/search/);

      // Find and click the map view toggle (might be in a hamburger menu on mobile)
      const mapToggle = page.getByRole('button', { name: /map|แผนที่/i });
      await expect(mapToggle).toBeVisible();
      await mapToggle.click();

      // Wait for map view to activate
      await page.waitForTimeout(500);
    });

    test('T032.7: Mobile - Verify map container is visible after toggle', async ({ page }) => {
      // Toggle to map view
      const mapToggle = page.getByRole('button', { name: /map|แผนที่/i });
      await mapToggle.click();
      await page.waitForTimeout(500);

      // Check for map container
      const mapContainer = page.locator('[data-testid="map-container"]').or(
        page.locator('.map-container')
      ).or(
        page.locator('#map')
      );

      await expect(mapContainer.first()).toBeVisible();
    });

    test('T032.8: Mobile - Verify at least one marker is displayed', async ({ page }) => {
      // Toggle to map view
      const mapToggle = page.getByRole('button', { name: /map|แผนที่/i });
      await mapToggle.click();

      // Wait for map to load
      await page.waitForTimeout(1000);

      // Check for markers
      const markers = page.locator('[data-testid="map-marker"]').or(
        page.locator('.map-marker')
      ).or(
        page.locator('.leaflet-marker-icon')
      ).or(
        page.locator('[role="button"][aria-label*="marker"]')
      );

      // Wait for at least one marker to appear
      await expect(markers.first()).toBeVisible({ timeout: 3000 });

      // Verify count is at least 1
      const markerCount = await markers.count();
      expect(markerCount).toBeGreaterThan(0);
    });

    test('T032.9: Mobile - Verify map loads within 3 seconds', async ({ page }) => {
      const startTime = Date.now();

      // Toggle to map view
      const mapToggle = page.getByRole('button', { name: /map|แผนที่/i });
      await mapToggle.click();

      // Wait for map container to be visible
      const mapContainer = page.locator('[data-testid="map-container"]').or(
        page.locator('.map-container')
      ).or(
        page.locator('#map')
      );

      await expect(mapContainer.first()).toBeVisible({ timeout: 3000 });

      // Wait for markers to appear
      const markers = page.locator('[data-testid="map-marker"]').or(
        page.locator('.map-marker')
      ).or(
        page.locator('.leaflet-marker-icon')
      ).or(
        page.locator('[role="button"][aria-label*="marker"]')
      );

      await expect(markers.first()).toBeVisible({ timeout: 3000 });

      const endTime = Date.now();
      const loadTime = endTime - startTime;

      // Verify map loaded within 3 seconds (3000ms)
      expect(loadTime).toBeLessThan(3000);
    });

    test('T032.10: Mobile - Map container fills viewport appropriately', async ({ page }) => {
      // Toggle to map view
      const mapToggle = page.getByRole('button', { name: /map|แผนที่/i });
      await mapToggle.click();
      await page.waitForTimeout(500);

      // Get map container
      const mapContainer = page.locator('[data-testid="map-container"]').or(
        page.locator('.map-container')
      ).or(
        page.locator('#map')
      );

      // Verify container is visible and has reasonable dimensions for mobile
      const boundingBox = await mapContainer.first().boundingBox();
      expect(boundingBox).not.toBeNull();
      expect(boundingBox!.width).toBeGreaterThan(200);
      expect(boundingBox!.height).toBeGreaterThan(300);
    });
  });
});
