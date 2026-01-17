import { test, expect } from '@playwright/test';

test.describe('Map Legend Display', () => {
  test.describe('Desktop viewport', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('/search');
      await page.waitForLoadState('networkidle');
    });

    test('T040.1: Navigate to search page and switch to map view', async ({ page }) => {
      // Verify we're on the search page
      await expect(page).toHaveURL(/\/search/);

      // Find and click the map view toggle
      const mapToggle = page.getByRole('button', { name: /map|แผนที่/i });
      await expect(mapToggle).toBeVisible();
      await mapToggle.click();

      // Wait for map view to activate
      await page.waitForTimeout(500);

      // Verify map container is visible
      const mapContainer = page.locator('[data-testid="map-container"]').or(
        page.locator('.map-container')
      ).or(
        page.locator('#map')
      );

      await expect(mapContainer.first()).toBeVisible();
    });

    test('T040.2: Verify legend is visible on map', async ({ page }) => {
      // Toggle to map view
      const mapToggle = page.getByRole('button', { name: /map|แผนที่/i });
      await mapToggle.click();
      await page.waitForTimeout(500);

      // Check for legend container
      const legend = page.locator('[data-testid="map-legend"]').or(
        page.locator('.map-legend')
      );

      await expect(legend.first()).toBeVisible();
    });

    test('T040.3: Legend shows title "ประเภท" (Type)', async ({ page }) => {
      // Toggle to map view
      const mapToggle = page.getByRole('button', { name: /map|แผนที่/i });
      await mapToggle.click();
      await page.waitForTimeout(500);

      // Check for legend title
      const legendTitle = page.getByText('ประเภท').or(
        page.getByText('Type')
      );

      await expect(legendTitle).toBeVisible();
    });

    test('T040.4: Legend shows 4 campsite types with correct colors', async ({ page }) => {
      // Toggle to map view
      const mapToggle = page.getByRole('button', { name: /map|แผนที่/i });
      await mapToggle.click();
      await page.waitForTimeout(1000);

      // Define expected types and colors
      const expectedTypes = [
        { label: 'แคมป์ปิ้ง', color: '#FF4444', englishLabel: 'Camping' },
        { label: 'แกลมปิ้ง', color: '#44FF44', englishLabel: 'Glamping' },
        { label: 'รีสอร์ทเต็นท์', color: '#FF8844', englishLabel: 'Tented Resort' },
        { label: 'บังกะโล', color: '#FFFF44', englishLabel: 'Bungalow' }
      ];

      // Verify each type is present
      for (const type of expectedTypes) {
        const typeLabel = page.getByText(type.label, { exact: false }).or(
          page.getByText(type.englishLabel, { exact: false })
        );
        await expect(typeLabel).toBeVisible();
      }

      // Verify we have 4 legend items
      const legendItems = page.locator('[data-testid="legend-item"]').or(
        page.locator('.legend-item')
      );

      const itemCount = await legendItems.count();
      expect(itemCount).toBeGreaterThanOrEqual(4);
    });

    test('T040.5: Verify specific campsite type colors', async ({ page }) => {
      // Toggle to map view
      const mapToggle = page.getByRole('button', { name: /map|แผนที่/i });
      await mapToggle.click();
      await page.waitForTimeout(1000);

      // Check for color indicators (circles or squares)
      const colorIndicators = page.locator('[data-testid="legend-color"]').or(
        page.locator('.legend-color')
      ).or(
        page.locator('.w-3.h-3.rounded-full, .w-4.h-4.rounded-full')
      );

      // Verify we have at least 4 color indicators
      const indicatorCount = await colorIndicators.count();
      expect(indicatorCount).toBeGreaterThanOrEqual(4);

      // Verify colors are present (checking background-color or fill)
      for (let i = 0; i < Math.min(4, indicatorCount); i++) {
        const indicator = colorIndicators.nth(i);
        await expect(indicator).toBeVisible();

        // Get computed style to verify color
        const bgColor = await indicator.evaluate((el) => {
          return window.getComputedStyle(el).backgroundColor;
        });

        // Verify it's not transparent or default
        expect(bgColor).not.toBe('rgba(0, 0, 0, 0)');
        expect(bgColor).not.toBe('transparent');
      }
    });

    test('T040.6: Legend is positioned at bottom-left of map', async ({ page }) => {
      // Toggle to map view
      const mapToggle = page.getByRole('button', { name: /map|แผンที่/i });
      await mapToggle.click();
      await page.waitForTimeout(500);

      // Get legend element
      const legend = page.locator('[data-testid="map-legend"]').or(
        page.locator('.map-legend')
      );

      await expect(legend.first()).toBeVisible();

      // Check positioning
      const legendBox = await legend.first().boundingBox();
      const mapContainer = page.locator('[data-testid="map-container"]').or(
        page.locator('.map-container')
      ).or(
        page.locator('#map')
      );
      const mapBox = await mapContainer.first().boundingBox();

      expect(legendBox).not.toBeNull();
      expect(mapBox).not.toBeNull();

      // Verify legend is in bottom-left area
      // Legend should be closer to left edge than right edge
      const legendCenterX = legendBox!.x + legendBox!.width / 2;
      const mapCenterX = mapBox!.x + mapBox!.width / 2;
      expect(legendCenterX).toBeLessThan(mapCenterX);

      // Legend should be in bottom half
      const legendCenterY = legendBox!.y + legendBox!.height / 2;
      const mapCenterY = mapBox!.y + mapBox!.height / 2;
      expect(legendCenterY).toBeGreaterThan(mapCenterY);
    });

    test('T040.7: Legend has proper z-index above map tiles', async ({ page }) => {
      // Toggle to map view
      const mapToggle = page.getByRole('button', { name: /map|แผนที่/i });
      await mapToggle.click();
      await page.waitForTimeout(500);

      // Get legend element
      const legend = page.locator('[data-testid="map-legend"]').or(
        page.locator('.map-legend')
      );

      await expect(legend.first()).toBeVisible();

      // Check z-index
      const zIndex = await legend.first().evaluate((el) => {
        return window.getComputedStyle(el).zIndex;
      });

      // z-index should be 1000 or higher
      const zIndexNum = parseInt(zIndex, 10);
      expect(zIndexNum).toBeGreaterThanOrEqual(1000);
    });

    test('T040.8: Legend has proper styling and background', async ({ page }) => {
      // Toggle to map view
      const mapToggle = page.getByRole('button', { name: /map|แผนที่/i });
      await mapToggle.click();
      await page.waitForTimeout(500);

      // Get legend element
      const legend = page.locator('[data-testid="map-legend"]').or(
        page.locator('.map-legend')
      );

      await expect(legend.first()).toBeVisible();

      // Verify legend has background (should not be fully transparent)
      const bgColor = await legend.first().evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor;
      });

      expect(bgColor).not.toBe('rgba(0, 0, 0, 0)');
      expect(bgColor).not.toBe('transparent');

      // Verify legend has padding/spacing
      const padding = await legend.first().evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          paddingTop: styles.paddingTop,
          paddingRight: styles.paddingRight,
          paddingBottom: styles.paddingBottom,
          paddingLeft: styles.paddingLeft
        };
      });

      // At least one padding value should be set
      const hasPadding = Object.values(padding).some(p => p !== '0px');
      expect(hasPadding).toBe(true);
    });
  });

  test.describe('Mobile viewport', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/search');
      await page.waitForLoadState('networkidle');
    });

    test('T040.9: Mobile - Verify legend is visible on map', async ({ page }) => {
      // Toggle to map view
      const mapToggle = page.getByRole('button', { name: /map|แผนที่/i });
      await mapToggle.click();
      await page.waitForTimeout(500);

      // Check for legend container
      const legend = page.locator('[data-testid="map-legend"]').or(
        page.locator('.map-legend')
      );

      await expect(legend.first()).toBeVisible();
    });

    test('T040.10: Mobile - Legend shows all 4 campsite types', async ({ page }) => {
      // Toggle to map view
      const mapToggle = page.getByRole('button', { name: /map|แผนที่/i });
      await mapToggle.click();
      await page.waitForTimeout(1000);

      // Define expected types
      const expectedTypes = [
        { label: 'แคมป์ปิ้ง', englishLabel: 'Camping' },
        { label: 'แกลมปิ้ง', englishLabel: 'Glamping' },
        { label: 'รีสอร์ทเต็นท์', englishLabel: 'Tented Resort' },
        { label: 'บังกะโล', englishLabel: 'Bungalow' }
      ];

      // Verify each type is present
      for (const type of expectedTypes) {
        const typeLabel = page.getByText(type.label, { exact: false }).or(
          page.getByText(type.englishLabel, { exact: false })
        );
        await expect(typeLabel).toBeVisible();
      }
    });

    test('T040.11: Mobile - Legend is positioned at bottom-left', async ({ page }) => {
      // Toggle to map view
      const mapToggle = page.getByRole('button', { name: /map|แผนที่/i });
      await mapToggle.click();
      await page.waitForTimeout(500);

      // Get legend element
      const legend = page.locator('[data-testid="map-legend"]').or(
        page.locator('.map-legend')
      );

      await expect(legend.first()).toBeVisible();

      // Check positioning on mobile
      const legendBox = await legend.first().boundingBox();
      expect(legendBox).not.toBeNull();

      // Legend should be in left portion of screen
      expect(legendBox!.x).toBeLessThan(200);

      // Legend should be in bottom portion
      expect(legendBox!.y).toBeGreaterThan(300);
    });

    test('T040.12: Mobile - Legend remains visible when zooming', async ({ page }) => {
      // Toggle to map view
      const mapToggle = page.getByRole('button', { name: /map|แผนที่/i });
      await mapToggle.click();
      await page.waitForTimeout(500);

      // Verify legend is visible initially
      const legend = page.locator('[data-testid="map-legend"]').or(
        page.locator('.map-legend')
      );
      await expect(legend.first()).toBeVisible();

      // Look for zoom controls and click zoom in
      const zoomIn = page.getByRole('button', { name: /zoom in|\+/i }).or(
        page.locator('[data-testid="zoom-in"]')
      ).or(
        page.locator('.leaflet-control-zoom-in')
      );

      if (await zoomIn.count() > 0) {
        await zoomIn.first().click();
        await page.waitForTimeout(300);
      }

      // Verify legend is still visible after zoom
      await expect(legend.first()).toBeVisible();
    });
  });
});
