import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Map Marker Click Info Window
 *
 * Tests cover:
 * 1. Navigate to search page and switch to map view
 * 2. Click on a map marker
 * 3. Verify info window/popup appears
 * 4. Verify popup shows campsite name
 * 5. Verify popup shows rating
 * 6. Verify popup shows price
 * 7. Verify popup shows photo thumbnail
 */

test.describe('Map Marker Click Info Window', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to search page
    await page.goto('http://localhost:3090/search');
    await page.waitForLoadState('networkidle');
  });

  test('should navigate to search page and switch to map view', async ({ page }) => {
    // Verify we're on the search page
    await expect(page).toHaveURL(/\/search/);

    // Look for map view toggle button
    const mapViewButton = page.locator('[data-testid="map-view-toggle"]');
    await expect(mapViewButton).toBeVisible();

    // Click to switch to map view
    await mapViewButton.click();

    // Wait for map to load
    await page.waitForTimeout(1000);

    // Verify map container is visible
    const mapContainer = page.locator('[data-testid="map-container"]');
    await expect(mapContainer).toBeVisible();
  });

  test('should display map markers', async ({ page }) => {
    // Switch to map view
    const mapViewButton = page.locator('[data-testid="map-view-toggle"]');
    await mapViewButton.click();
    await page.waitForTimeout(1000);

    // Verify map markers are present
    const markers = page.locator('[data-testid^="map-marker-"]');
    const markerCount = await markers.count();
    expect(markerCount).toBeGreaterThan(0);
  });

  test('should show info window when clicking a marker', async ({ page }) => {
    // Switch to map view
    const mapViewButton = page.locator('[data-testid="map-view-toggle"]');
    await mapViewButton.click();
    await page.waitForTimeout(1000);

    // Get the first marker
    const firstMarker = page.locator('[data-testid^="map-marker-"]').first();
    await expect(firstMarker).toBeVisible();

    // Click on the marker
    await firstMarker.click();

    // Wait for info window to appear
    await page.waitForTimeout(500);

    // Verify info window is visible
    const infoWindow = page.locator('[data-testid="map-info-window"]');
    await expect(infoWindow).toBeVisible();
  });

  test('should display campsite name in info window', async ({ page }) => {
    // Switch to map view
    const mapViewButton = page.locator('[data-testid="map-view-toggle"]');
    await mapViewButton.click();
    await page.waitForTimeout(1000);

    // Click on first marker
    const firstMarker = page.locator('[data-testid^="map-marker-"]').first();
    await firstMarker.click();
    await page.waitForTimeout(500);

    // Verify campsite name is displayed
    const campsiteName = page.locator('[data-testid="info-window-name"]');
    await expect(campsiteName).toBeVisible();

    const nameText = await campsiteName.textContent();
    expect(nameText).toBeTruthy();
    expect(nameText?.trim().length).toBeGreaterThan(0);
  });

  test('should display rating in info window', async ({ page }) => {
    // Switch to map view
    const mapViewButton = page.locator('[data-testid="map-view-toggle"]');
    await mapViewButton.click();
    await page.waitForTimeout(1000);

    // Click on first marker
    const firstMarker = page.locator('[data-testid^="map-marker-"]').first();
    await firstMarker.click();
    await page.waitForTimeout(500);

    // Verify rating is displayed
    const rating = page.locator('[data-testid="info-window-rating"]');
    await expect(rating).toBeVisible();

    const ratingText = await rating.textContent();
    expect(ratingText).toBeTruthy();

    // Rating should be a number between 0 and 5
    const ratingValue = parseFloat(ratingText || '0');
    expect(ratingValue).toBeGreaterThanOrEqual(0);
    expect(ratingValue).toBeLessThanOrEqual(5);
  });

  test('should display price in info window', async ({ page }) => {
    // Switch to map view
    const mapViewButton = page.locator('[data-testid="map-view-toggle"]');
    await mapViewButton.click();
    await page.waitForTimeout(1000);

    // Click on first marker
    const firstMarker = page.locator('[data-testid^="map-marker-"]').first();
    await firstMarker.click();
    await page.waitForTimeout(500);

    // Verify price is displayed
    const price = page.locator('[data-testid="info-window-price"]');
    await expect(price).toBeVisible();

    const priceText = await price.textContent();
    expect(priceText).toBeTruthy();

    // Price should contain currency symbol or number
    expect(priceText).toMatch(/[\d฿,]/);
  });

  test('should display photo thumbnail in info window', async ({ page }) => {
    // Switch to map view
    const mapViewButton = page.locator('[data-testid="map-view-toggle"]');
    await mapViewButton.click();
    await page.waitForTimeout(1000);

    // Click on first marker
    const firstMarker = page.locator('[data-testid^="map-marker-"]').first();
    await firstMarker.click();
    await page.waitForTimeout(500);

    // Verify photo thumbnail is displayed
    const thumbnail = page.locator('[data-testid="info-window-thumbnail"]');
    await expect(thumbnail).toBeVisible();

    // Verify thumbnail has valid src
    const thumbnailSrc = await thumbnail.getAttribute('src');
    expect(thumbnailSrc).toBeTruthy();
    expect(thumbnailSrc?.length).toBeGreaterThan(0);
  });

  test('should display all required information together', async ({ page }) => {
    // Switch to map view
    const mapViewButton = page.locator('[data-testid="map-view-toggle"]');
    await mapViewButton.click();
    await page.waitForTimeout(1000);

    // Click on first marker
    const firstMarker = page.locator('[data-testid^="map-marker-"]').first();
    await firstMarker.click();
    await page.waitForTimeout(500);

    // Verify all elements are present simultaneously
    const infoWindow = page.locator('[data-testid="map-info-window"]');
    const campsiteName = page.locator('[data-testid="info-window-name"]');
    const rating = page.locator('[data-testid="info-window-rating"]');
    const price = page.locator('[data-testid="info-window-price"]');
    const thumbnail = page.locator('[data-testid="info-window-thumbnail"]');

    await expect(infoWindow).toBeVisible();
    await expect(campsiteName).toBeVisible();
    await expect(rating).toBeVisible();
    await expect(price).toBeVisible();
    await expect(thumbnail).toBeVisible();
  });

  test('should close info window when clicking another marker', async ({ page }) => {
    // Switch to map view
    const mapViewButton = page.locator('[data-testid="map-view-toggle"]');
    await mapViewButton.click();
    await page.waitForTimeout(1000);

    // Get first and second markers
    const markers = page.locator('[data-testid^="map-marker-"]');
    const markerCount = await markers.count();

    if (markerCount < 2) {
      test.skip();
      return;
    }

    // Click first marker
    await markers.nth(0).click();
    await page.waitForTimeout(500);

    // Get the campsite name from first info window
    const firstCampsiteName = await page.locator('[data-testid="info-window-name"]').textContent();

    // Click second marker
    await markers.nth(1).click();
    await page.waitForTimeout(500);

    // Verify info window is still visible but with different content
    const infoWindow = page.locator('[data-testid="map-info-window"]');
    await expect(infoWindow).toBeVisible();

    // Get the campsite name from second info window
    const secondCampsiteName = await page.locator('[data-testid="info-window-name"]').textContent();

    // Names should be different (unless both markers point to same campsite)
    // At minimum, verify only one info window is visible
    const infoWindowCount = await page.locator('[data-testid="map-info-window"]').count();
    expect(infoWindowCount).toBe(1);
  });

  test('should close info window when clicking close button', async ({ page }) => {
    // Switch to map view
    const mapViewButton = page.locator('[data-testid="map-view-toggle"]');
    await mapViewButton.click();
    await page.waitForTimeout(1000);

    // Click on first marker
    const firstMarker = page.locator('[data-testid^="map-marker-"]').first();
    await firstMarker.click();
    await page.waitForTimeout(500);

    // Verify info window is visible
    const infoWindow = page.locator('[data-testid="map-info-window"]');
    await expect(infoWindow).toBeVisible();

    // Click close button
    const closeButton = page.locator('[data-testid="info-window-close"]');
    await closeButton.click();
    await page.waitForTimeout(300);

    // Verify info window is no longer visible
    await expect(infoWindow).not.toBeVisible();
  });

  test('should navigate to campsite detail when clicking info window link', async ({ page }) => {
    // Switch to map view
    const mapViewButton = page.locator('[data-testid="map-view-toggle"]');
    await mapViewButton.click();
    await page.waitForTimeout(1000);

    // Click on first marker
    const firstMarker = page.locator('[data-testid^="map-marker-"]').first();
    await firstMarker.click();
    await page.waitForTimeout(500);

    // Click on the info window link/card
    const infoWindowLink = page.locator('[data-testid="info-window-link"]');
    await expect(infoWindowLink).toBeVisible();

    await infoWindowLink.click();

    // Wait for navigation
    await page.waitForLoadState('networkidle');

    // Verify we navigated to campsite detail page
    await expect(page).toHaveURL(/\/campsites\/\d+/);
  });

  test('should handle marker click on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Navigate to search page
    await page.goto('http://localhost:3090/search');
    await page.waitForLoadState('networkidle');

    // Switch to map view
    const mapViewButton = page.locator('[data-testid="map-view-toggle"]');
    await mapViewButton.click();
    await page.waitForTimeout(1000);

    // Click on first marker
    const firstMarker = page.locator('[data-testid^="map-marker-"]').first();
    await firstMarker.click();
    await page.waitForTimeout(500);

    // Verify info window is visible on mobile
    const infoWindow = page.locator('[data-testid="map-info-window"]');
    await expect(infoWindow).toBeVisible();

    // Verify all content is still accessible
    await expect(page.locator('[data-testid="info-window-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="info-window-rating"]')).toBeVisible();
    await expect(page.locator('[data-testid="info-window-price"]')).toBeVisible();
    await expect(page.locator('[data-testid="info-window-thumbnail"]')).toBeVisible();
  });
});
