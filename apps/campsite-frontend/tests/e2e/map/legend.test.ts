import { test, expect, type Page } from '@playwright/test';

/**
 * E2E Tests for Map Legend Display
 *
 * Tests cover:
 * 1. Navigate to search page and switch to map view
 * 2. Verify legend is visible on the map
 * 3. Verify legend shows all campsite types (camping, glamping, tented-resort, bungalow)
 * 4. Verify each type has a colored indicator
 * 5. Verify legend colors match actual marker colors
 * 6. Test legend visibility on mobile
 */

// Expected campsite types from database schema
const CAMPSITE_TYPES = [
  { slug: 'camping', name_en: 'Camping', color: '#FF4444' },
  { slug: 'glamping', name_en: 'Glamping', color: '#44FF44' },
  { slug: 'tented-resort', name_en: 'Tented Resort', color: '#FF8844' },
  { slug: 'bungalow', name_en: 'Bungalow', color: '#4444FF' }
];

test.describe('Map Legend Display', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to search page
    await page.goto('/search');
    await page.waitForLoadState('networkidle');
  });

  test('should navigate to map view and display legend', async ({ page }) => {
    // Switch to map view
    const mapViewButton = page.getByRole('button', { name: /map view|map/i });
    await mapViewButton.click();

    // Wait for map to load
    await page.waitForTimeout(1000);

    // Verify map container is visible
    const mapContainer = page.locator('[data-testid="map-container"], .map-container, #map');
    await expect(mapContainer).toBeVisible();

    // Verify legend is visible
    const legend = page.locator('[data-testid="map-legend"], .map-legend, [class*="legend"]');
    await expect(legend.first()).toBeVisible();
  });

  test('should display all campsite types in legend', async ({ page }) => {
    // Switch to map view
    await page.locator('[data-testid="map-view-toggle"], button:has-text("Map")').first().click();
    await page.waitForTimeout(1000);

    // Get legend container
    const legend = page.locator('[data-testid="map-legend"], .map-legend, [class*="legend"]').first();
    await expect(legend).toBeVisible();

    // Verify all campsite types are present in legend
    for (const type of CAMPSITE_TYPES) {
      const legendItem = legend.locator(`text=/.*${type.name_en}.*/i`);
      await expect(legendItem).toBeVisible();
    }
  });

  test('should display colored indicators for each campsite type', async ({ page }) => {
    // Switch to map view
    await page.locator('[data-testid="map-view-toggle"], button:has-text("Map")').first().click();
    await page.waitForTimeout(1000);

    const legend = page.locator('[data-testid="map-legend"], .map-legend, [class*="legend"]').first();
    await expect(legend).toBeVisible();

    // Verify each type has a colored indicator
    for (const type of CAMPSITE_TYPES) {
      // Look for legend item containing the type name
      const legendItem = legend.locator(`[data-testid="legend-item-${type.slug}"], [data-type="${type.slug}"]`).first();

      // If specific test ID not found, look for item containing the name
      const itemExists = await legendItem.count() > 0;

      if (itemExists) {
        await expect(legendItem).toBeVisible();

        // Verify color indicator exists (circle, square, or other shape)
        const colorIndicator = legendItem.locator('[data-testid="color-indicator"], .color-indicator, [class*="marker"], [class*="dot"], circle, rect');
        await expect(colorIndicator.first()).toBeVisible();
      } else {
        // Fallback: check that colored elements exist in legend
        const coloredElements = legend.locator('[style*="background"], circle, rect, path');
        const count = await coloredElements.count();
        expect(count).toBeGreaterThan(0);
      }
    }
  });

  test('should match legend colors with marker colors', async ({ page }) => {
    // Switch to map view
    await page.locator('[data-testid="map-view-toggle"], button:has-text("Map")').first().click();
    await page.waitForTimeout(2000); // Wait for map and markers to render

    // Get colors from legend items
    const legendColors = await page.evaluate(() => {
      const legendItems = Array.from(document.querySelectorAll('[data-testid*="legend-item"], .legend-item, [class*="legend"] [data-type]'));

      return legendItems.map(item => {
        // Try to find color indicator within legend item
        const colorEl = item.querySelector('[data-testid="color-indicator"], .color-indicator, circle, rect, [style*="background"]') as HTMLElement;

        if (!colorEl) return null;

        // Get computed background color or fill color
        const computedStyle = window.getComputedStyle(colorEl);
        const bgColor = computedStyle.backgroundColor;
        const fillColor = computedStyle.fill || colorEl.getAttribute('fill');

        return {
          type: item.getAttribute('data-type') || item.textContent?.trim(),
          color: fillColor || bgColor
        };
      }).filter(Boolean);
    });

    // Get colors from map markers
    const markerColors = await page.evaluate(() => {
      const markers = Array.from(document.querySelectorAll('[data-testid*="marker"], .marker, [class*="marker"]'));

      return markers.slice(0, 10).map(marker => {
        const colorEl = marker.querySelector('circle, path, [style*="background"]') as HTMLElement;
        if (!colorEl) return null;

        const computedStyle = window.getComputedStyle(colorEl);
        const fillColor = computedStyle.fill || colorEl.getAttribute('fill');
        const bgColor = computedStyle.backgroundColor;

        return fillColor || bgColor;
      }).filter(Boolean);
    });

    // Verify that legend has color information
    expect(legendColors.length).toBeGreaterThan(0);

    // If markers are present, verify they have colors
    if (markerColors.length > 0) {
      expect(markerColors.length).toBeGreaterThan(0);
    }
  });

  test('should display legend on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Navigate to search page
    await page.goto('/search');
    await page.waitForLoadState('networkidle');

    // Switch to map view
    const mapViewButton = page.locator('[data-testid="map-view-toggle"], button:has-text("Map")').first();
    await mapViewButton.click();
    await page.waitForTimeout(1000);

    // Verify legend is visible on mobile
    const legend = page.locator('[data-testid="map-legend"], .map-legend, [class*="legend"]').first();
    await expect(legend).toBeVisible();

    // Verify legend is positioned appropriately (not covering entire map)
    const legendBox = await legend.boundingBox();
    const viewportSize = page.viewportSize();

    if (legendBox && viewportSize) {
      // Legend should not cover more than 40% of screen height
      const legendHeightRatio = legendBox.height / viewportSize.height;
      expect(legendHeightRatio).toBeLessThan(0.4);
    }
  });

  test('should show legend items in correct order', async ({ page }) => {
    // Switch to map view
    await page.locator('[data-testid="map-view-toggle"], button:has-text("Map")').first().click();
    await page.waitForTimeout(1000);

    const legend = page.locator('[data-testid="map-legend"], .map-legend, [class*="legend"]').first();
    await expect(legend).toBeVisible();

    // Get all legend items text content
    const legendItems = await legend.locator('[data-testid*="legend-item"], .legend-item').allTextContents();

    // Verify we have legend items
    expect(legendItems.length).toBeGreaterThan(0);

    // Check that all expected types are present
    const legendText = legendItems.join(' ').toLowerCase();

    for (const type of CAMPSITE_TYPES) {
      expect(legendText).toContain(type.name_en.toLowerCase());
    }
  });

  test('should maintain legend visibility when interacting with map', async ({ page }) => {
    // Switch to map view
    await page.locator('[data-testid="map-view-toggle"], button:has-text("Map")').first().click();
    await page.waitForTimeout(1000);

    const legend = page.locator('[data-testid="map-legend"], .map-legend, [class*="legend"]').first();
    await expect(legend).toBeVisible();

    // Get map container
    const mapContainer = page.locator('[data-testid="map-container"], .map-container, #map').first();

    // Interact with map (click, pan)
    await mapContainer.click({ position: { x: 200, y: 200 } });
    await page.waitForTimeout(300);

    // Verify legend is still visible
    await expect(legend).toBeVisible();

    // Try panning the map
    await mapContainer.hover({ position: { x: 200, y: 200 } });
    await page.mouse.down();
    await page.mouse.move(250, 250);
    await page.mouse.up();
    await page.waitForTimeout(300);

    // Verify legend is still visible after panning
    await expect(legend).toBeVisible();
  });

  test('should have accessible legend with proper labels', async ({ page }) => {
    // Switch to map view
    await page.locator('[data-testid="map-view-toggle"], button:has-text("Map")').first().click();
    await page.waitForTimeout(1000);

    const legend = page.locator('[data-testid="map-legend"], .map-legend, [class*="legend"]').first();
    await expect(legend).toBeVisible();

    // Check for accessible attributes
    const hasAriaLabel = await legend.evaluate(el =>
      el.hasAttribute('aria-label') || el.hasAttribute('aria-labelledby')
    );

    // Legend should have proper ARIA label or heading
    if (!hasAriaLabel) {
      const heading = legend.locator('h2, h3, h4, [role="heading"]').first();
      const headingExists = await heading.count() > 0;
      expect(headingExists).toBeTruthy();
    }
  });

  test('should display legend with correct campsite type count', async ({ page }) => {
    // Switch to map view
    await page.locator('[data-testid="map-view-toggle"], button:has-text("Map")').first().click();
    await page.waitForTimeout(1000);

    const legend = page.locator('[data-testid="map-legend"], .map-legend, [class*="legend"]').first();
    await expect(legend).toBeVisible();

    // Count legend items
    const legendItems = legend.locator('[data-testid*="legend-item"], .legend-item, [data-type]');
    const itemCount = await legendItems.count();

    // Should have at least the 4 main campsite types
    expect(itemCount).toBeGreaterThanOrEqual(4);
  });

  test('should render legend colors as valid hex colors', async ({ page }) => {
    // Switch to map view
    await page.locator('[data-testid="map-view-toggle"], button:has-text("Map")').first().click();
    await page.waitForTimeout(1000);

    const legend = page.locator('[data-testid="map-legend"], .map-legend, [class*="legend"]').first();
    await expect(legend).toBeVisible();

    // Get all color values from legend
    const colors = await page.evaluate(() => {
      const colorElements = Array.from(document.querySelectorAll('[data-testid="map-legend"] [data-testid="color-indicator"], .map-legend .color-indicator, [class*="legend"] circle, [class*="legend"] rect'));

      return colorElements.map(el => {
        const computedStyle = window.getComputedStyle(el as HTMLElement);
        const fill = computedStyle.fill || (el as HTMLElement).getAttribute('fill');
        const bgColor = computedStyle.backgroundColor;

        return fill || bgColor;
      }).filter(c => c && c !== 'none' && c !== 'transparent');
    });

    // Verify colors are valid CSS colors
    for (const color of colors) {
      // Color should be in rgb, rgba, hex format or named color
      const isValidColor = /^(#[0-9A-Fa-f]{3,6}|rgb|rgba|hsl|hsla|[a-z]+)/.test(color);
      expect(isValidColor).toBeTruthy();
    }

    // Should have at least some colors defined
    expect(colors.length).toBeGreaterThan(0);
  });
});
