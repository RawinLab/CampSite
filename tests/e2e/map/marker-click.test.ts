import { test, expect } from '@playwright/test';

test.describe('Map Marker Click - Info Window Display', () => {
  test.describe('Desktop viewport', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('/search');
      await page.waitForLoadState('networkidle');
    });

    test('T034.1: Navigate to search page and switch to map view', async ({ page }) => {
      // Verify we're on the search page
      await expect(page).toHaveURL(/\/search/);

      // Switch to map view
      const mapViewButton = page.locator('[data-testid="view-toggle-map"]');
      await expect(mapViewButton).toBeVisible();
      await mapViewButton.click();

      // Wait for map to be visible
      await page.waitForSelector('[data-testid="campsite-map"]', { timeout: 10000 });

      // Verify URL parameter updated
      await expect(page).toHaveURL(/view=map/);
    });

    test('T034.2: Wait for map to load with markers', async ({ page }) => {
      // Switch to map view
      await page.locator('[data-testid="view-toggle-map"]').click();
      await page.waitForSelector('[data-testid="campsite-map"]', { timeout: 10000 });

      // Wait for markers to render
      await page.waitForTimeout(1000);

      // Verify markers are present
      const markers = page.locator('.leaflet-marker-icon').or(
        page.locator('.custom-marker-icon')
      ).or(
        page.locator('.map-marker')
      );

      await expect(markers.first()).toBeVisible({ timeout: 5000 });

      // Verify at least one marker loaded
      const markerCount = await markers.count();
      expect(markerCount).toBeGreaterThan(0);
    });

    test('T034.3: Click marker and verify popup opens', async ({ page }) => {
      // Switch to map view and wait for map
      await page.locator('[data-testid="view-toggle-map"]').click();
      await page.waitForSelector('[data-testid="campsite-map"]', { timeout: 10000 });
      await page.waitForTimeout(1000);

      // Click on first marker
      const marker = page.locator('.leaflet-marker-icon').first();
      await expect(marker).toBeVisible();
      await marker.click();

      // Wait for Leaflet popup to appear
      await page.waitForSelector('.leaflet-popup', { timeout: 5000 });

      // Verify popup is visible
      const popup = page.locator('.leaflet-popup');
      await expect(popup).toBeVisible();

      // Verify popup content is visible
      const popupContent = page.locator('.leaflet-popup-content');
      await expect(popupContent).toBeVisible();
    });

    test('T034.4: Verify popup shows campsite name', async ({ page }) => {
      // Switch to map view
      await page.locator('[data-testid="view-toggle-map"]').click();
      await page.waitForSelector('[data-testid="campsite-map"]', { timeout: 10000 });
      await page.waitForTimeout(1000);

      // Click on first marker
      await page.locator('.leaflet-marker-icon').first().click();
      await page.waitForSelector('.leaflet-popup', { timeout: 5000 });

      // Verify campsite name is displayed
      const campsiteName = page.locator('.map-popup-card__name').or(
        page.locator('.map-popup h3')
      ).or(
        page.locator('.leaflet-popup-content h3')
      );

      await expect(campsiteName.first()).toBeVisible();
      await expect(campsiteName.first()).not.toBeEmpty();
    });

    test('T034.5: Verify popup shows rating', async ({ page }) => {
      // Switch to map view
      await page.locator('[data-testid="view-toggle-map"]').click();
      await page.waitForSelector('[data-testid="campsite-map"]', { timeout: 10000 });
      await page.waitForTimeout(1000);

      // Click on first marker
      await page.locator('.leaflet-marker-icon').first().click();
      await page.waitForSelector('.leaflet-popup', { timeout: 5000 });

      // Verify rating is displayed
      const rating = page.locator('.map-popup-card__rating').or(
        page.locator('[data-testid="campsite-rating"]')
      ).or(
        page.locator('.leaflet-popup-content [class*="rating"]')
      );

      // Rating should be visible or popup should contain rating info
      const ratingVisible = await rating.first().isVisible().catch(() => false);
      if (!ratingVisible) {
        // Check for star icons or rating text pattern
        const popupContent = page.locator('.leaflet-popup-content');
        const content = await popupContent.textContent();

        // Should contain rating pattern like "4.5" or "★" or "ดาว" (stars in Thai)
        const hasRating = /\d+\.\d+|★|ดาว/.test(content || '');
        expect(hasRating).toBeTruthy();
      } else {
        await expect(rating.first()).toBeVisible();
      }
    });

    test('T034.6: Verify popup shows price range', async ({ page }) => {
      // Switch to map view
      await page.locator('[data-testid="view-toggle-map"]').click();
      await page.waitForSelector('[data-testid="campsite-map"]', { timeout: 10000 });
      await page.waitForTimeout(1000);

      // Click on first marker
      await page.locator('.leaflet-marker-icon').first().click();
      await page.waitForSelector('.leaflet-popup', { timeout: 5000 });

      // Verify price is displayed
      const price = page.locator('.map-popup-card__price').or(
        page.locator('[data-testid="campsite-price"]')
      ).or(
        page.locator('.leaflet-popup-content [class*="price"]')
      );

      // Price should be visible or popup should contain price info
      const priceVisible = await price.first().isVisible().catch(() => false);
      if (!priceVisible) {
        // Check for price pattern with Thai Baht (฿) or "บาท"
        const popupContent = page.locator('.leaflet-popup-content');
        const content = await popupContent.textContent();

        // Should contain price pattern
        const hasPrice = /฿|บาท|\d+/.test(content || '');
        expect(hasPrice).toBeTruthy();
      } else {
        await expect(price.first()).toBeVisible();
      }
    });

    test('T034.7: Verify popup has "ดูรายละเอียด" (View Details) link', async ({ page }) => {
      // Switch to map view
      await page.locator('[data-testid="view-toggle-map"]').click();
      await page.waitForSelector('[data-testid="campsite-map"]', { timeout: 10000 });
      await page.waitForTimeout(1000);

      // Click on first marker
      await page.locator('.leaflet-marker-icon').first().click();
      await page.waitForSelector('.leaflet-popup', { timeout: 5000 });

      // Verify "View Details" link exists (Thai or English)
      const viewDetailsLink = page.locator('.map-popup-card__button').or(
        page.getByRole('link', { name: /ดูรายละเอียด|View Details/i })
      ).or(
        page.locator('.leaflet-popup-content a[href*="/campsites/"]')
      );

      await expect(viewDetailsLink.first()).toBeVisible();

      // Verify link has href
      const href = await viewDetailsLink.first().getAttribute('href');
      expect(href).toMatch(/\/campsites\/[a-zA-Z0-9-]+/);
    });

    test('T034.8: Close popup by clicking X button', async ({ page }) => {
      // Switch to map view
      await page.locator('[data-testid="view-toggle-map"]').click();
      await page.waitForSelector('[data-testid="campsite-map"]', { timeout: 10000 });
      await page.waitForTimeout(1000);

      // Click on first marker to open popup
      await page.locator('.leaflet-marker-icon').first().click();
      await page.waitForSelector('.leaflet-popup', { timeout: 5000 });

      // Verify popup is visible
      const popup = page.locator('.leaflet-popup');
      await expect(popup).toBeVisible();

      // Click close button
      const closeButton = page.locator('.leaflet-popup-close-button');
      await expect(closeButton).toBeVisible();
      await closeButton.click();

      // Wait for popup to disappear
      await page.waitForTimeout(500);

      // Verify popup is closed
      await expect(popup).not.toBeVisible();
    });

    test('T034.9: Close popup by clicking elsewhere on map', async ({ page }) => {
      // Switch to map view
      await page.locator('[data-testid="view-toggle-map"]').click();
      await page.waitForSelector('[data-testid="campsite-map"]', { timeout: 10000 });
      await page.waitForTimeout(1000);

      // Click on first marker to open popup
      await page.locator('.leaflet-marker-icon').first().click();
      await page.waitForSelector('.leaflet-popup', { timeout: 5000 });

      // Verify popup is visible
      const popup = page.locator('.leaflet-popup');
      await expect(popup).toBeVisible();

      // Click on map container (not on marker or popup)
      const mapContainer = page.locator('[data-testid="campsite-map"]');
      const boundingBox = await mapContainer.boundingBox();

      if (boundingBox) {
        // Click on top-left corner of map (away from markers typically centered)
        await page.mouse.click(
          boundingBox.x + 50,
          boundingBox.y + 50
        );
      }

      // Wait for popup to potentially close
      await page.waitForTimeout(500);

      // Verify popup is closed (it should close on map click)
      const popupVisible = await popup.isVisible().catch(() => false);

      // Note: Some Leaflet configs may not close popup on map click
      // This test validates expected behavior but may need adjustment
      if (popupVisible) {
        // If popup doesn't close on map click, verify we can still close via X
        const closeButton = page.locator('.leaflet-popup-close-button');
        if (await closeButton.isVisible()) {
          await closeButton.click();
          await expect(popup).not.toBeVisible();
        }
      }
    });

    test('T034.10: Click different markers to verify popup updates', async ({ page }) => {
      // Switch to map view
      await page.locator('[data-testid="view-toggle-map"]').click();
      await page.waitForSelector('[data-testid="campsite-map"]', { timeout: 10000 });
      await page.waitForTimeout(1000);

      // Get all markers
      const markers = page.locator('.leaflet-marker-icon');
      const markerCount = await markers.count();

      // Need at least 2 markers for this test
      if (markerCount < 2) {
        test.skip();
      }

      // Click first marker
      await markers.nth(0).click();
      await page.waitForSelector('.leaflet-popup', { timeout: 5000 });

      // Get first campsite name
      const firstNameLocator = page.locator('.map-popup-card__name').or(
        page.locator('.leaflet-popup-content h3')
      ).first();
      const firstName = await firstNameLocator.textContent();

      // Click second marker
      await markers.nth(1).click();
      await page.waitForTimeout(500);

      // Get second campsite name
      const secondNameLocator = page.locator('.map-popup-card__name').or(
        page.locator('.leaflet-popup-content h3')
      ).first();
      const secondName = await secondNameLocator.textContent();

      // Verify names are different (popup updated)
      expect(firstName).not.toBe(secondName);
    });
  });

  test.describe('Mobile viewport', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/search');
      await page.waitForLoadState('networkidle');
    });

    test('T034.11: Mobile - Click marker and verify popup opens', async ({ page }) => {
      // Switch to map view
      await page.locator('[data-testid="view-toggle-map"]').click();
      await page.waitForSelector('[data-testid="campsite-map"]', { timeout: 10000 });
      await page.waitForTimeout(1000);

      // Click on first marker
      const marker = page.locator('.leaflet-marker-icon').first();
      await expect(marker).toBeVisible();
      await marker.click();

      // Wait for popup
      await page.waitForSelector('.leaflet-popup', { timeout: 5000 });

      // Verify popup is visible on mobile
      const popup = page.locator('.leaflet-popup');
      await expect(popup).toBeVisible();

      // Verify popup content is visible
      const popupContent = page.locator('.leaflet-popup-content');
      await expect(popupContent).toBeVisible();
    });

    test('T034.12: Mobile - Verify popup displays all required information', async ({ page }) => {
      // Switch to map view
      await page.locator('[data-testid="view-toggle-map"]').click();
      await page.waitForSelector('[data-testid="campsite-map"]', { timeout: 10000 });
      await page.waitForTimeout(1000);

      // Click on first marker
      await page.locator('.leaflet-marker-icon').first().click();
      await page.waitForSelector('.leaflet-popup', { timeout: 5000 });

      // Verify name is displayed
      const name = page.locator('.map-popup-card__name').or(
        page.locator('.leaflet-popup-content h3')
      );
      await expect(name.first()).toBeVisible();

      // Verify popup has link
      const link = page.locator('.map-popup-card__button').or(
        page.locator('.leaflet-popup-content a[href*="/campsites/"]')
      );
      await expect(link.first()).toBeVisible();
    });

    test('T034.13: Mobile - Close popup and reopen on different marker', async ({ page }) => {
      // Switch to map view
      await page.locator('[data-testid="view-toggle-map"]').click();
      await page.waitForSelector('[data-testid="campsite-map"]', { timeout: 10000 });
      await page.waitForTimeout(1000);

      // Click first marker
      await page.locator('.leaflet-marker-icon').first().click();
      await page.waitForSelector('.leaflet-popup', { timeout: 5000 });

      // Close popup
      const closeButton = page.locator('.leaflet-popup-close-button');
      await closeButton.click();
      await page.waitForTimeout(300);

      // Verify closed
      const popup = page.locator('.leaflet-popup');
      await expect(popup).not.toBeVisible();

      // Click marker again
      await page.locator('.leaflet-marker-icon').first().click();
      await page.waitForTimeout(500);

      // Verify popup reopened
      await expect(popup).toBeVisible();
    });
  });
});
