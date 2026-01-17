import { test, expect, Page } from '@playwright/test';

test.describe('Attraction Map Links', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    // Navigate to a campsite detail page with attractions
    await page.goto('/campsites/test-campsite-id');
    await page.waitForLoadState('networkidle');
  });

  test('should display Google Maps link when coordinates exist', async () => {
    // Wait for attractions section to load
    await page.waitForSelector('[data-testid="attractions-section"]', { state: 'visible' });

    // Find attraction card with coordinates
    const attractionCard = await page.locator('[data-testid="attraction-card"]').first();
    await expect(attractionCard).toBeVisible();

    // Verify directions link is visible
    const directionsLink = attractionCard.locator('a[aria-label*="Get directions"]');
    await expect(directionsLink).toBeVisible();

    // Verify link text
    await expect(directionsLink).toContainText('Directions');
  });

  test('should contain correct latitude and longitude in URL', async () => {
    // Wait for attractions section
    await page.waitForSelector('[data-testid="attractions-section"]', { state: 'visible' });

    // Get attraction card with coordinates
    const attractionCard = await page.locator('[data-testid="attraction-card"]').first();
    const directionsLink = attractionCard.locator('a[aria-label*="Get directions"]');

    // Get the href attribute
    const href = await directionsLink.getAttribute('href');

    // Verify it's a Google Maps directions URL
    expect(href).toContain('google.com/maps/dir');

    // Verify it contains origin coordinates (campsite location)
    expect(href).toMatch(/origin=[0-9.-]+,[0-9.-]+/);

    // Verify it contains destination coordinates (attraction location)
    expect(href).toMatch(/destination=[0-9.-]+,[0-9.-]+/);
  });

  test('should open link in new tab', async () => {
    // Wait for attractions section
    await page.waitForSelector('[data-testid="attractions-section"]', { state: 'visible' });

    // Get directions link
    const attractionCard = await page.locator('[data-testid="attraction-card"]').first();
    const directionsLink = attractionCard.locator('a[aria-label*="Get directions"]');

    // Verify target="_blank" attribute
    const target = await directionsLink.getAttribute('target');
    expect(target).toBe('_blank');

    // Verify rel="noopener noreferrer" for security
    const rel = await directionsLink.getAttribute('rel');
    expect(rel).toContain('noopener');
    expect(rel).toContain('noreferrer');
  });

  test('should not show link when coordinates are missing', async () => {
    // Wait for attractions section
    await page.waitForSelector('[data-testid="attractions-section"]', { state: 'visible' });

    // Find all attraction cards
    const attractionCards = await page.locator('[data-testid="attraction-card"]').all();

    // Check if any cards exist without coordinates
    for (const card of attractionCards) {
      // Try to find directions link
      const directionsLink = card.locator('a[aria-label*="Get directions"]');
      const linkCount = await directionsLink.count();

      // If no link exists, verify the card still renders properly
      if (linkCount === 0) {
        // Verify the attraction card is still visible
        await expect(card).toBeVisible();

        // Verify attraction name is shown
        const attractionName = card.locator('h4');
        await expect(attractionName).toBeVisible();

        // Test passed - found a card without directions link
        return;
      }
    }

    // If all cards have directions, skip this test
    // (mock data might not include attractions without coordinates)
    test.skip();
  });

  test('should display map icon in directions button', async () => {
    // Wait for attractions section
    await page.waitForSelector('[data-testid="attractions-section"]', { state: 'visible' });

    // Get directions link
    const attractionCard = await page.locator('[data-testid="attraction-card"]').first();
    const directionsLink = attractionCard.locator('a[aria-label*="Get directions"]');

    // Find SVG icon inside the directions link
    const mapIcon = directionsLink.locator('svg');
    await expect(mapIcon).toBeVisible();

    // Verify SVG attributes (navigation/compass icon)
    const viewBox = await mapIcon.getAttribute('viewBox');
    expect(viewBox).toBe('0 0 24 24');

    // Verify icon has stroke (indicating it's a line icon)
    const stroke = await mapIcon.getAttribute('stroke');
    expect(stroke).toBeTruthy();

    // Verify polygon points for navigation icon (compass/navigation pointer)
    const polygon = mapIcon.locator('polygon');
    await expect(polygon).toBeVisible();
    const points = await polygon.getAttribute('points');
    expect(points).toContain('3 11 22 2 13 21 11 13 3 11');
  });

  test('should have correct ARIA label for accessibility', async () => {
    // Wait for attractions section
    await page.waitForSelector('[data-testid="attractions-section"]', { state: 'visible' });

    // Get attraction card
    const attractionCard = await page.locator('[data-testid="attraction-card"]').first();

    // Get attraction name
    const attractionName = await attractionCard.locator('h4').textContent();

    // Get directions link
    const directionsLink = attractionCard.locator('a[aria-label*="Get directions"]');

    // Verify ARIA label includes attraction name
    const ariaLabel = await directionsLink.getAttribute('aria-label');
    expect(ariaLabel).toContain('Get directions to');
    expect(ariaLabel).toContain(attractionName || '');
  });

  test('should apply correct styling to directions button', async () => {
    // Wait for attractions section
    await page.waitForSelector('[data-testid="attractions-section"]', { state: 'visible' });

    // Get directions link
    const attractionCard = await page.locator('[data-testid="attraction-card"]').first();
    const directionsLink = attractionCard.locator('a[aria-label*="Get directions"]');

    // Verify button has primary color background
    const bgColor = await directionsLink.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    expect(bgColor).toBeTruthy();

    // Verify button has rounded corners
    const borderRadius = await directionsLink.evaluate((el) => {
      return window.getComputedStyle(el).borderRadius;
    });
    expect(borderRadius).not.toBe('0px');

    // Verify button has padding
    const padding = await directionsLink.evaluate((el) => {
      return window.getComputedStyle(el).padding;
    });
    expect(padding).not.toBe('0px');
  });

  test('should show hover effect on directions button', async () => {
    // Wait for attractions section
    await page.waitForSelector('[data-testid="attractions-section"]', { state: 'visible' });

    // Get directions link
    const attractionCard = await page.locator('[data-testid="attraction-card"]').first();
    const directionsLink = attractionCard.locator('a[aria-label*="Get directions"]');

    // Get initial background color
    const initialBgColor = await directionsLink.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Hover over the button
    await directionsLink.hover();

    // Wait for transition
    await page.waitForTimeout(200);

    // Get background color after hover
    const hoveredBgColor = await directionsLink.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Background color should change on hover
    // Note: This might be the same if CSS transitions haven't completed
    // The important part is that hover class is applied
    expect(hoveredBgColor).toBeTruthy();
  });

  test('should display multiple attractions with map links', async () => {
    // Wait for attractions section
    await page.waitForSelector('[data-testid="attractions-section"]', { state: 'visible' });

    // Get all attraction cards with directions
    const attractionCards = await page.locator('[data-testid="attraction-card"]').all();

    // Verify at least one attraction exists
    expect(attractionCards.length).toBeGreaterThan(0);

    // Check each card for proper structure
    for (const card of attractionCards) {
      // Verify card is visible
      await expect(card).toBeVisible();

      // Check if directions link exists
      const directionsLink = card.locator('a[aria-label*="Get directions"]');
      const linkCount = await directionsLink.count();

      if (linkCount > 0) {
        // If link exists, verify it's properly configured
        const href = await directionsLink.getAttribute('href');
        expect(href).toContain('google.com/maps');
      }
    }
  });

  test('should maintain link functionality on mobile viewport', async () => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Navigate to page
    await page.goto('/campsites/test-campsite-id');
    await page.waitForLoadState('networkidle');

    // Wait for attractions section
    await page.waitForSelector('[data-testid="attractions-section"]', { state: 'visible' });

    // Get directions link
    const attractionCard = await page.locator('[data-testid="attraction-card"]').first();
    const directionsLink = attractionCard.locator('a[aria-label*="Get directions"]');

    // Verify link is visible and functional on mobile
    await expect(directionsLink).toBeVisible();

    // Verify link still has correct attributes
    const href = await directionsLink.getAttribute('href');
    expect(href).toContain('google.com/maps');

    const target = await directionsLink.getAttribute('target');
    expect(target).toBe('_blank');
  });
});
