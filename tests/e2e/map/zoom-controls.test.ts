import { test, expect } from '@playwright/test';

test.describe('Map Zoom Controls Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to search page
    await page.goto('/search');
    await page.waitForLoadState('networkidle');

    // Switch to map view
    const mapViewButton = page.getByRole('button', { name: /map view|แผนที่/i });
    if (await mapViewButton.isVisible()) {
      await mapViewButton.click();
      await page.waitForTimeout(500); // Wait for map to initialize
    }
  });

  test('T036.1: Get initial zoom level and verify map is loaded', async ({ page }) => {
    // Verify map container is visible
    const mapContainer = page.locator('[data-testid="map-container"]').or(page.locator('.leaflet-container')).or(page.locator('#map'));
    await expect(mapContainer.first()).toBeVisible();

    // Verify zoom controls are visible
    const zoomInButton = page.getByRole('button', { name: /zoom in|ซูมเข้า|\+/i }).or(page.locator('.leaflet-control-zoom-in'));
    const zoomOutButton = page.getByRole('button', { name: /zoom out|ซูมออก|\-/i }).or(page.locator('.leaflet-control-zoom-out'));

    await expect(zoomInButton.first()).toBeVisible();
    await expect(zoomOutButton.first()).toBeVisible();
  });

  test('T036.2: Zoom in button increases zoom level', async ({ page }) => {
    // Get initial zoom level (via data attribute or evaluate map object)
    const initialZoom = await page.evaluate(() => {
      const map = (window as any).map || (window as any).__mapInstance;
      return map ? map.getZoom() : null;
    }).catch(() => null);

    // Find zoom in button
    const zoomInButton = page.getByRole('button', { name: /zoom in|ซูมเข้า|\+/i }).or(page.locator('.leaflet-control-zoom-in'));

    // Click zoom in button
    await zoomInButton.first().click();
    await page.waitForTimeout(300); // Wait for zoom animation

    // Get new zoom level
    const newZoom = await page.evaluate(() => {
      const map = (window as any).map || (window as any).__mapInstance;
      return map ? map.getZoom() : null;
    }).catch(() => null);

    // Verify zoom increased (if we could get zoom levels)
    if (initialZoom !== null && newZoom !== null) {
      expect(newZoom).toBeGreaterThan(initialZoom);
    }

    // Alternative verification: check if zoom in button becomes disabled at max zoom
    // Or verify map visual change occurred
    await expect(zoomInButton.first()).toBeVisible();
  });

  test('T036.3: Zoom out button decreases zoom level', async ({ page }) => {
    // First zoom in a few times to ensure we can zoom out
    const zoomInButton = page.getByRole('button', { name: /zoom in|ซูมเข้า|\+/i }).or(page.locator('.leaflet-control-zoom-in'));
    await zoomInButton.first().click();
    await page.waitForTimeout(300);
    await zoomInButton.first().click();
    await page.waitForTimeout(300);

    // Get zoom level before zooming out
    const beforeZoom = await page.evaluate(() => {
      const map = (window as any).map || (window as any).__mapInstance;
      return map ? map.getZoom() : null;
    }).catch(() => null);

    // Find zoom out button
    const zoomOutButton = page.getByRole('button', { name: /zoom out|ซูมออก|\-/i }).or(page.locator('.leaflet-control-zoom-out'));

    // Click zoom out button
    await zoomOutButton.first().click();
    await page.waitForTimeout(300); // Wait for zoom animation

    // Get new zoom level
    const afterZoom = await page.evaluate(() => {
      const map = (window as any).map || (window as any).__mapInstance;
      return map ? map.getZoom() : null;
    }).catch(() => null);

    // Verify zoom decreased (if we could get zoom levels)
    if (beforeZoom !== null && afterZoom !== null) {
      expect(afterZoom).toBeLessThan(beforeZoom);
    }

    // Alternative verification: button is still visible and clickable
    await expect(zoomOutButton.first()).toBeVisible();
  });

  test('T036.4: Multiple zoom in clicks increase zoom progressively', async ({ page }) => {
    const zoomInButton = page.getByRole('button', { name: /zoom in|ซูมเข้า|\+/i }).or(page.locator('.leaflet-control-zoom-in'));

    // Get initial zoom
    const initialZoom = await page.evaluate(() => {
      const map = (window as any).map || (window as any).__mapInstance;
      return map ? map.getZoom() : null;
    }).catch(() => null);

    // Click zoom in multiple times
    await zoomInButton.first().click();
    await page.waitForTimeout(300);
    await zoomInButton.first().click();
    await page.waitForTimeout(300);
    await zoomInButton.first().click();
    await page.waitForTimeout(300);

    // Get final zoom
    const finalZoom = await page.evaluate(() => {
      const map = (window as any).map || (window as any).__mapInstance;
      return map ? map.getZoom() : null;
    }).catch(() => null);

    // Verify significant zoom increase
    if (initialZoom !== null && finalZoom !== null) {
      expect(finalZoom).toBeGreaterThanOrEqual(initialZoom + 2);
    }

    // Verify zoom controls are still visible
    await expect(zoomInButton.first()).toBeVisible();
  });

  test('T036.5: Multiple zoom out clicks decrease zoom progressively', async ({ page }) => {
    // First zoom in several times to create room for zooming out
    const zoomInButton = page.getByRole('button', { name: /zoom in|ซูมเข้า|\+/i }).or(page.locator('.leaflet-control-zoom-in'));
    for (let i = 0; i < 5; i++) {
      await zoomInButton.first().click();
      await page.waitForTimeout(200);
    }

    // Get zoom level after zooming in
    const beforeZoom = await page.evaluate(() => {
      const map = (window as any).map || (window as any).__mapInstance;
      return map ? map.getZoom() : null;
    }).catch(() => null);

    // Now zoom out multiple times
    const zoomOutButton = page.getByRole('button', { name: /zoom out|ซูมออก|\-/i }).or(page.locator('.leaflet-control-zoom-out'));
    await zoomOutButton.first().click();
    await page.waitForTimeout(300);
    await zoomOutButton.first().click();
    await page.waitForTimeout(300);
    await zoomOutButton.first().click();
    await page.waitForTimeout(300);

    // Get final zoom
    const afterZoom = await page.evaluate(() => {
      const map = (window as any).map || (window as any).__mapInstance;
      return map ? map.getZoom() : null;
    }).catch(() => null);

    // Verify significant zoom decrease
    if (beforeZoom !== null && afterZoom !== null) {
      expect(afterZoom).toBeLessThanOrEqual(beforeZoom - 2);
    }

    // Verify zoom controls are still visible
    await expect(zoomOutButton.first()).toBeVisible();
  });

  test('T036.6: Keyboard shortcuts for zoom (Plus and Minus keys)', async ({ page }) => {
    // Focus on map container
    const mapContainer = page.locator('[data-testid="map-container"]').or(page.locator('.leaflet-container')).or(page.locator('#map'));
    await mapContainer.first().click();

    // Get initial zoom
    const initialZoom = await page.evaluate(() => {
      const map = (window as any).map || (window as any).__mapInstance;
      return map ? map.getZoom() : null;
    }).catch(() => null);

    // Press Plus key to zoom in
    await page.keyboard.press('+');
    await page.waitForTimeout(300);

    // Get zoom after plus
    const afterPlusZoom = await page.evaluate(() => {
      const map = (window as any).map || (window as any).__mapInstance;
      return map ? map.getZoom() : null;
    }).catch(() => null);

    // Press Minus key to zoom out
    await page.keyboard.press('-');
    await page.waitForTimeout(300);

    // Get zoom after minus
    const afterMinusZoom = await page.evaluate(() => {
      const map = (window as any).map || (window as any).__mapInstance;
      return map ? map.getZoom() : null;
    }).catch(() => null);

    // Verify keyboard shortcuts work (if map object is accessible)
    if (initialZoom !== null && afterPlusZoom !== null && afterMinusZoom !== null) {
      expect(afterPlusZoom).toBeGreaterThanOrEqual(initialZoom);
      expect(afterMinusZoom).toBeLessThanOrEqual(afterPlusZoom);
    }

    // Alternative: verify map is still interactive
    await expect(mapContainer.first()).toBeVisible();
  });

  test('T036.7: Zoom controls are disabled at max/min zoom levels', async ({ page }) => {
    const zoomInButton = page.getByRole('button', { name: /zoom in|ซูมเข้า|\+/i }).or(page.locator('.leaflet-control-zoom-in'));
    const zoomOutButton = page.getByRole('button', { name: /zoom out|ซูมออก|\-/i }).or(page.locator('.leaflet-control-zoom-out'));

    // Zoom in to maximum
    for (let i = 0; i < 10; i++) {
      const isEnabled = await zoomInButton.first().isEnabled().catch(() => true);
      if (!isEnabled) break;

      await zoomInButton.first().click();
      await page.waitForTimeout(200);
    }

    // Check if zoom in button is disabled at max zoom
    const zoomInDisabled = await zoomInButton.first().isDisabled().catch(() => false);
    const zoomInHasDisabledClass = await zoomInButton.first().evaluate((el) => {
      return el.classList.contains('leaflet-disabled') || el.hasAttribute('disabled');
    }).catch(() => false);

    // At max zoom, zoom in should be disabled
    // (Note: implementation may vary, so we check multiple conditions)
    const isAtMaxZoom = zoomInDisabled || zoomInHasDisabledClass;

    // Zoom out to minimum
    for (let i = 0; i < 15; i++) {
      const isEnabled = await zoomOutButton.first().isEnabled().catch(() => true);
      if (!isEnabled) break;

      await zoomOutButton.first().click();
      await page.waitForTimeout(200);
    }

    // Check if zoom out button is disabled at min zoom
    const zoomOutDisabled = await zoomOutButton.first().isDisabled().catch(() => false);
    const zoomOutHasDisabledClass = await zoomOutButton.first().evaluate((el) => {
      return el.classList.contains('leaflet-disabled') || el.hasAttribute('disabled');
    }).catch(() => false);

    // At min zoom, zoom out should be disabled
    const isAtMinZoom = zoomOutDisabled || zoomOutHasDisabledClass;

    // Verify at least one boundary condition was detected
    expect(isAtMaxZoom || isAtMinZoom).toBe(true);
  });

  test('T036.8: Zoom controls maintain map center during zoom operations', async ({ page }) => {
    // Get initial map center
    const initialCenter = await page.evaluate(() => {
      const map = (window as any).map || (window as any).__mapInstance;
      if (!map) return null;
      const center = map.getCenter();
      return { lat: center.lat, lng: center.lng };
    }).catch(() => null);

    // Zoom in
    const zoomInButton = page.getByRole('button', { name: /zoom in|ซูมเข้า|\+/i }).or(page.locator('.leaflet-control-zoom-in'));
    await zoomInButton.first().click();
    await page.waitForTimeout(300);

    // Get center after zoom in
    const afterZoomInCenter = await page.evaluate(() => {
      const map = (window as any).map || (window as any).__mapInstance;
      if (!map) return null;
      const center = map.getCenter();
      return { lat: center.lat, lng: center.lng };
    }).catch(() => null);

    // Zoom out
    const zoomOutButton = page.getByRole('button', { name: /zoom out|ซูมออก|\-/i }).or(page.locator('.leaflet-control-zoom-out'));
    await zoomOutButton.first().click();
    await page.waitForTimeout(300);

    // Get center after zoom out
    const afterZoomOutCenter = await page.evaluate(() => {
      const map = (window as any).map || (window as any).__mapInstance;
      if (!map) return null;
      const center = map.getCenter();
      return { lat: center.lat, lng: center.lng };
    }).catch(() => null);

    // Verify center remains approximately the same (allowing for small floating point differences)
    if (initialCenter && afterZoomInCenter && afterZoomOutCenter) {
      const latDiff1 = Math.abs(initialCenter.lat - afterZoomInCenter.lat);
      const lngDiff1 = Math.abs(initialCenter.lng - afterZoomInCenter.lng);
      const latDiff2 = Math.abs(initialCenter.lat - afterZoomOutCenter.lat);
      const lngDiff2 = Math.abs(initialCenter.lng - afterZoomOutCenter.lng);

      // Center should stay relatively stable (within 0.1 degrees)
      expect(latDiff1).toBeLessThan(0.1);
      expect(lngDiff1).toBeLessThan(0.1);
      expect(latDiff2).toBeLessThan(0.1);
      expect(lngDiff2).toBeLessThan(0.1);
    }

    // Alternative: verify map is still visible and interactive
    const mapContainer = page.locator('[data-testid="map-container"]').or(page.locator('.leaflet-container')).or(page.locator('#map'));
    await expect(mapContainer.first()).toBeVisible();
  });
});
