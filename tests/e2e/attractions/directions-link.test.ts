import { test, expect } from '@playwright/test';

test.describe('Attraction Directions Link - Google Maps Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a campsite detail page with attractions
    await page.goto('/campsites/1');
    await page.waitForLoadState('networkidle');
  });

  test('directions link opens Google Maps in new tab with coordinates', async ({ page, context }) => {
    // Scroll to attractions section
    const attractionsSection = page.locator('[data-testid="attractions-section"]');
    await attractionsSection.scrollIntoViewIfNeeded();
    await expect(attractionsSection).toBeVisible();

    // Find attraction cards
    const attractionCards = page.locator('[data-testid="attraction-card"]');
    const count = await attractionCards.count();

    // Ensure at least one attraction exists
    expect(count).toBeGreaterThan(0);

    const firstCard = attractionCards.first();
    await expect(firstCard).toBeVisible();

    // Find the directions button/link within the attraction card
    const directionsLink = firstCard.locator('[data-testid="directions-link"]');
    await expect(directionsLink).toBeVisible();

    // Verify the link has target="_blank" attribute
    const target = await directionsLink.getAttribute('target');
    expect(target).toBe('_blank');

    // Verify the link has rel="noopener noreferrer" for security
    const rel = await directionsLink.getAttribute('rel');
    expect(rel).toContain('noopener');
    expect(rel).toContain('noreferrer');

    // Get the href attribute to verify URL structure
    const href = await directionsLink.getAttribute('href');
    expect(href).toBeTruthy();

    // Verify URL contains Google Maps domain
    const isGoogleMaps = href?.includes('google.com/maps') || href?.includes('maps.google.com');
    expect(isGoogleMaps).toBeTruthy();

    // Verify URL contains coordinates (pattern: @lat,lng or q=lat,lng)
    // Google Maps URLs typically have coordinates in format: @13.7563,100.5018 or q=13.7563,100.5018
    const hasCoordinates = /[@q=][-]?\d+\.?\d*,[-]?\d+\.?\d*/.test(href || '');
    expect(hasCoordinates).toBeTruthy();

    // Listen for new page (new tab) to be opened
    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      directionsLink.click()
    ]);

    // Wait for the new page to load
    await newPage.waitForLoadState('domcontentloaded');

    // Verify the new page URL is Google Maps
    const newPageUrl = newPage.url();
    const isNewPageGoogleMaps = newPageUrl.includes('google.com/maps') || newPageUrl.includes('maps.google.com');
    expect(isNewPageGoogleMaps).toBeTruthy();

    // Verify coordinates are in the new page URL
    const newPageHasCoordinates = /[@q=][-]?\d+\.?\d*,[-]?\d+\.?\d*/.test(newPageUrl);
    expect(newPageHasCoordinates).toBeTruthy();

    // Clean up - close the new tab
    await newPage.close();
  });

  test('all attraction cards have directions links', async ({ page }) => {
    // Scroll to attractions section
    const attractionsSection = page.locator('[data-testid="attractions-section"]');
    await attractionsSection.scrollIntoViewIfNeeded();

    // Find all attraction cards
    const attractionCards = page.locator('[data-testid="attraction-card"]');
    const count = await attractionCards.count();

    if (count > 0) {
      // Verify each card has a directions link
      for (let i = 0; i < count; i++) {
        const card = attractionCards.nth(i);
        const directionsLink = card.locator('[data-testid="directions-link"]');

        await expect(directionsLink).toBeVisible();

        // Verify link attributes
        const href = await directionsLink.getAttribute('href');
        expect(href).toBeTruthy();

        const isGoogleMaps = href?.includes('google.com/maps') || href?.includes('maps.google.com');
        expect(isGoogleMaps).toBeTruthy();
      }
    }
  });

  test('directions link has appropriate accessibility attributes', async ({ page }) => {
    // Scroll to attractions section
    const attractionsSection = page.locator('[data-testid="attractions-section"]');
    await attractionsSection.scrollIntoViewIfNeeded();

    const firstCard = page.locator('[data-testid="attraction-card"]').first();
    const directionsLink = firstCard.locator('[data-testid="directions-link"]');

    await expect(directionsLink).toBeVisible();

    // Verify aria-label or accessible text exists
    const ariaLabel = await directionsLink.getAttribute('aria-label');
    const text = await directionsLink.textContent();

    // Either aria-label or visible text should indicate directions functionality
    const hasAccessibleText = (ariaLabel && ariaLabel.toLowerCase().includes('direction')) ||
                               (text && text.toLowerCase().includes('direction'));
    expect(hasAccessibleText).toBeTruthy();

    // Verify the link is keyboard accessible (can be focused)
    await directionsLink.focus();
    const isFocused = await directionsLink.evaluate((el) => el === document.activeElement);
    expect(isFocused).toBeTruthy();
  });

  test('directions link contains valid latitude and longitude values', async ({ page }) => {
    // Scroll to attractions section
    const attractionsSection = page.locator('[data-testid="attractions-section"]');
    await attractionsSection.scrollIntoViewIfNeeded();

    const firstCard = page.locator('[data-testid="attraction-card"]').first();
    const directionsLink = firstCard.locator('[data-testid="directions-link"]');

    const href = await directionsLink.getAttribute('href');
    expect(href).toBeTruthy();

    // Extract coordinates from URL
    const coordMatch = href?.match(/[@q=]([-]?\d+\.?\d*),([-]?\d+\.?\d*)/);
    expect(coordMatch).toBeTruthy();

    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lng = parseFloat(coordMatch[2]);

      // Verify latitude is valid (between -90 and 90)
      expect(lat).toBeGreaterThanOrEqual(-90);
      expect(lat).toBeLessThanOrEqual(90);

      // Verify longitude is valid (between -180 and 180)
      expect(lng).toBeGreaterThanOrEqual(-180);
      expect(lng).toBeLessThanOrEqual(180);

      // For Thailand-specific validation (optional but good to have)
      // Thailand latitude: ~5.6 to 20.5, longitude: ~97.3 to 105.6
      // This ensures the coordinates make sense for a Thailand camping site
      expect(lat).toBeGreaterThan(5);
      expect(lat).toBeLessThan(21);
      expect(lng).toBeGreaterThan(97);
      expect(lng).toBeLessThan(106);
    }
  });
});
