import { test, expect } from '@playwright/test';

test.describe('Map Info Window - View Details Link', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to search page
    await page.goto('/search');
    await page.waitForLoadState('networkidle');
  });

  test('T035.1: Switch to map view and verify map is displayed', async ({ page }) => {
    // Switch to map view
    const mapViewButton = page.locator('[data-testid="view-toggle-map"]');
    await expect(mapViewButton).toBeVisible();
    await mapViewButton.click();

    // Wait for map to load
    await page.waitForSelector('[data-testid="campsite-map"]', { timeout: 10000 });

    // Verify map container is visible
    const mapContainer = page.locator('[data-testid="campsite-map"]');
    await expect(mapContainer).toBeVisible();

    // Verify URL contains view=map parameter
    await expect(page).toHaveURL(/view=map/);
  });

  test('T035.2: Click marker to open info window', async ({ page }) => {
    // Switch to map view
    await page.locator('[data-testid="view-toggle-map"]').click();
    await page.waitForSelector('[data-testid="campsite-map"]', { timeout: 10000 });

    // Wait for map markers to load
    await page.waitForTimeout(1000); // Allow time for markers to render

    // Click on a map marker (Leaflet marker)
    const marker = page.locator('.leaflet-marker-icon').first();
    await expect(marker).toBeVisible();
    await marker.click();

    // Wait for popup to appear
    await page.waitForSelector('.leaflet-popup-content', { timeout: 5000 });

    // Verify popup is visible
    const popup = page.locator('.leaflet-popup');
    await expect(popup).toBeVisible();

    // Verify popup contains info window content
    const popupContent = page.locator('.map-popup-card');
    await expect(popupContent).toBeVisible();
  });

  test('T035.3: Info window displays campsite information', async ({ page }) => {
    // Switch to map view
    await page.locator('[data-testid="view-toggle-map"]').click();
    await page.waitForSelector('[data-testid="campsite-map"]', { timeout: 10000 });
    await page.waitForTimeout(1000);

    // Click on first marker
    await page.locator('.leaflet-marker-icon').first().click();
    await page.waitForSelector('.map-popup-card', { timeout: 5000 });

    // Verify campsite name is displayed
    const campsiteName = page.locator('.map-popup-card__name');
    await expect(campsiteName).toBeVisible();
    await expect(campsiteName).not.toBeEmpty();

    // Verify type badge is displayed
    const typeBadge = page.locator('.map-popup-card__type');
    await expect(typeBadge).toBeVisible();

    // Verify location is displayed
    const location = page.locator('.map-popup-card__location');
    await expect(location).toBeVisible();

    // Verify price is displayed
    const price = page.locator('.map-popup-card__price');
    await expect(price).toBeVisible();
  });

  test('T035.4: View Details link is present and properly styled', async ({ page }) => {
    // Switch to map view
    await page.locator('[data-testid="view-toggle-map"]').click();
    await page.waitForSelector('[data-testid="campsite-map"]', { timeout: 10000 });
    await page.waitForTimeout(1000);

    // Click on first marker
    await page.locator('.leaflet-marker-icon').first().click();
    await page.waitForSelector('.map-popup-card', { timeout: 5000 });

    // Verify "View Details" button exists
    const viewDetailsLink = page.locator('.map-popup-card__button');
    await expect(viewDetailsLink).toBeVisible();
    await expect(viewDetailsLink).toContainText('View Details');

    // Verify link has proper styling (button class)
    const className = await viewDetailsLink.getAttribute('class');
    expect(className).toContain('map-popup-card__button');
  });

  test('T035.5: Clicking View Details navigates to campsite detail page', async ({ page }) => {
    // Switch to map view
    await page.locator('[data-testid="view-toggle-map"]').click();
    await page.waitForSelector('[data-testid="campsite-map"]', { timeout: 10000 });
    await page.waitForTimeout(1000);

    // Click on first marker
    await page.locator('.leaflet-marker-icon').first().click();
    await page.waitForSelector('.map-popup-card', { timeout: 5000 });

    // Get campsite ID from the link
    const viewDetailsLink = page.locator('.map-popup-card__button');
    const href = await viewDetailsLink.getAttribute('href');
    expect(href).toMatch(/\/campsites\/[a-zA-Z0-9-]+/);

    // Extract campsite ID for verification
    const campsiteId = href?.split('/campsites/')[1];
    expect(campsiteId).toBeTruthy();

    // Click the "View Details" link
    await viewDetailsLink.click();

    // Wait for navigation to complete
    await page.waitForLoadState('networkidle');

    // Verify navigation to campsite detail page
    await expect(page).toHaveURL(new RegExp(`/campsites/${campsiteId}`));

    // Verify campsite detail page loaded
    const campsiteDetailHeading = page.locator('h1');
    await expect(campsiteDetailHeading).toBeVisible();
  });

  test('T035.6: Verify correct campsite page is loaded', async ({ page }) => {
    // Switch to map view
    await page.locator('[data-testid="view-toggle-map"]').click();
    await page.waitForSelector('[data-testid="campsite-map"]', { timeout: 10000 });
    await page.waitForTimeout(1000);

    // Click on first marker
    await page.locator('.leaflet-marker-icon').first().click();
    await page.waitForSelector('.map-popup-card', { timeout: 5000 });

    // Get campsite name from info window
    const campsiteNameInPopup = await page
      .locator('.map-popup-card__name')
      .textContent();
    expect(campsiteNameInPopup).toBeTruthy();

    // Click "View Details" link
    await page.locator('.map-popup-card__button').click();
    await page.waitForLoadState('networkidle');

    // Verify the campsite name matches on the detail page
    const campsiteDetailHeading = page.locator('h1');
    const headingText = await campsiteDetailHeading.textContent();

    // The heading should contain the same campsite name
    expect(headingText).toContain(campsiteNameInPopup);
  });

  test('T035.7: Multiple markers have functional View Details links', async ({ page }) => {
    // Switch to map view
    await page.locator('[data-testid="view-toggle-map"]').click();
    await page.waitForSelector('[data-testid="campsite-map"]', { timeout: 10000 });
    await page.waitForTimeout(1000);

    // Get all markers
    const markers = page.locator('.leaflet-marker-icon');
    const markerCount = await markers.count();
    expect(markerCount).toBeGreaterThan(0);

    // Test up to 3 markers (to avoid long test execution)
    const markersToTest = Math.min(3, markerCount);

    for (let i = 0; i < markersToTest; i++) {
      // Close any open popup first
      const closeButton = page.locator('.leaflet-popup-close-button');
      if (await closeButton.isVisible()) {
        await closeButton.click();
        await page.waitForTimeout(300);
      }

      // Click marker
      await markers.nth(i).click();
      await page.waitForSelector('.map-popup-card', { timeout: 5000 });

      // Verify View Details link exists
      const viewDetailsLink = page.locator('.map-popup-card__button');
      await expect(viewDetailsLink).toBeVisible();

      // Verify href attribute
      const href = await viewDetailsLink.getAttribute('href');
      expect(href).toMatch(/\/campsites\/[a-zA-Z0-9-]+/);
    }
  });

  test('T035.8: Info window shows image when available', async ({ page }) => {
    // Switch to map view
    await page.locator('[data-testid="view-toggle-map"]').click();
    await page.waitForSelector('[data-testid="campsite-map"]', { timeout: 10000 });
    await page.waitForTimeout(1000);

    // Click on first marker
    await page.locator('.leaflet-marker-icon').first().click();
    await page.waitForSelector('.map-popup-card', { timeout: 5000 });

    // Check for image or placeholder
    const image = page.locator('.map-popup-card__image');
    await expect(image).toBeVisible();

    // Either an img tag or a div with emoji placeholder should exist
    const imgTag = page.locator('.map-popup-card img.map-popup-card__image');
    const placeholderDiv = page.locator('.map-popup-card div.map-popup-card__image');

    const hasImage = await imgTag.count();
    const hasPlaceholder = await placeholderDiv.count();

    expect(hasImage + hasPlaceholder).toBeGreaterThan(0);
  });

  test('T035.9: Info window closes and View Details still works', async ({ page }) => {
    // Switch to map view
    await page.locator('[data-testid="view-toggle-map"]').click();
    await page.waitForSelector('[data-testid="campsite-map"]', { timeout: 10000 });
    await page.waitForTimeout(1000);

    // Click on first marker
    await page.locator('.leaflet-marker-icon').first().click();
    await page.waitForSelector('.map-popup-card', { timeout: 5000 });

    // Close the popup
    const closeButton = page.locator('.leaflet-popup-close-button');
    await closeButton.click();
    await page.waitForTimeout(300);

    // Verify popup is closed
    const popup = page.locator('.leaflet-popup');
    await expect(popup).not.toBeVisible();

    // Click marker again to reopen
    await page.locator('.leaflet-marker-icon').first().click();
    await page.waitForSelector('.map-popup-card', { timeout: 5000 });

    // Verify View Details link still works
    const viewDetailsLink = page.locator('.map-popup-card__button');
    await expect(viewDetailsLink).toBeVisible();
    await viewDetailsLink.click();

    await page.waitForLoadState('networkidle');

    // Verify navigation occurred
    await expect(page).toHaveURL(/\/campsites\/[a-zA-Z0-9-]+/);
  });

  test('T035.10: Back navigation from detail page returns to map view', async ({ page }) => {
    // Switch to map view
    await page.locator('[data-testid="view-toggle-map"]').click();
    await page.waitForSelector('[data-testid="campsite-map"]', { timeout: 10000 });
    await page.waitForTimeout(1000);

    // Verify map view is active
    await expect(page).toHaveURL(/view=map/);

    // Click marker and navigate to detail page
    await page.locator('.leaflet-marker-icon').first().click();
    await page.waitForSelector('.map-popup-card', { timeout: 5000 });
    await page.locator('.map-popup-card__button').click();
    await page.waitForLoadState('networkidle');

    // Verify we're on detail page
    await expect(page).toHaveURL(/\/campsites\/[a-zA-Z0-9-]+/);

    // Go back
    await page.goBack();
    await page.waitForLoadState('networkidle');

    // Verify we're back on search page with map view
    await expect(page).toHaveURL(/\/search/);
    await expect(page).toHaveURL(/view=map/);

    // Verify map is still visible
    const mapContainer = page.locator('[data-testid="campsite-map"]');
    await expect(mapContainer).toBeVisible();
  });
});
