import { test, expect } from '@playwright/test';

test.describe('Campsite Detail 404 Page', () => {
  test('returns 404 for non-existent campsite ID', async ({ page }) => {
    // Navigate to a non-existent campsite ID
    const response = await page.goto('/campsites/99999999');

    // Verify 404 status code
    expect(response?.status()).toBe(404);

    // Verify 404 page content is displayed
    await expect(page.locator('h1')).toContainText('Campsite Not Found');
  });

  test('returns 404 for invalid campsite ID format', async ({ page }) => {
    // Navigate to invalid ID format (non-UUID/non-numeric)
    const response = await page.goto('/campsites/invalid-id-12345');

    // Verify 404 status code
    expect(response?.status()).toBe(404);

    // Verify 404 page is shown
    await expect(page.locator('h1')).toContainText('Campsite Not Found');
  });

  test('404 page shows helpful message', async ({ page }) => {
    // Navigate to non-existent campsite
    await page.goto('/campsites/99999999');

    // Verify main heading
    const heading = page.locator('h1');
    await expect(heading).toContainText('Campsite Not Found');

    // Verify descriptive message exists
    const message = page.locator('text=Sorry, the campsite you are looking for does not exist');
    await expect(message).toBeVisible();

    // Verify helpful suggestions are present
    await expect(page.locator('text=This might have happened because:')).toBeVisible();
    await expect(page.locator('text=The campsite has been removed or deactivated')).toBeVisible();
    await expect(page.locator('text=The URL is incorrect or outdated')).toBeVisible();
    await expect(page.locator('text=The campsite is pending approval')).toBeVisible();
  });

  test('404 page displays tent icon', async ({ page }) => {
    // Navigate to non-existent campsite
    await page.goto('/campsites/99999999');

    // Verify icon container exists
    const iconContainer = page.locator('.mx-auto.w-24.h-24.rounded-full.bg-muted');
    await expect(iconContainer).toBeVisible();

    // Verify tent icon is present (Lucide icon)
    const tentIcon = iconContainer.locator('svg');
    await expect(tentIcon).toBeVisible();
  });

  test('link back to search page exists', async ({ page }) => {
    // Navigate to non-existent campsite
    await page.goto('/campsites/99999999');

    // Verify "Search Campsites" link exists
    const searchLink = page.locator('a[href="/search"]');
    await expect(searchLink).toBeVisible();
    await expect(searchLink).toContainText('Search Campsites');

    // Verify link has Search icon
    const searchIcon = searchLink.locator('svg').first();
    await expect(searchIcon).toBeVisible();
  });

  test('link to home page exists', async ({ page }) => {
    // Navigate to non-existent campsite
    await page.goto('/campsites/99999999');

    // Verify "Go Home" link exists
    const homeLink = page.locator('a[href="/"]');
    await expect(homeLink).toBeVisible();
    await expect(homeLink).toContainText('Go Home');

    // Verify link has Home icon
    const homeIcon = homeLink.locator('svg').first();
    await expect(homeIcon).toBeVisible();
  });

  test('go back button exists', async ({ page }) => {
    // Navigate to non-existent campsite
    await page.goto('/campsites/99999999');

    // Verify "Go Back" button exists
    const backButton = page.locator('text=Go Back');
    await expect(backButton).toBeVisible();

    // Verify it has back arrow icon
    const backIcon = backButton.locator('xpath=..').locator('svg').first();
    await expect(backIcon).toBeVisible();
  });

  test('search link navigation works', async ({ page }) => {
    // Navigate to non-existent campsite
    await page.goto('/campsites/99999999');

    // Click on "Search Campsites" link
    const searchLink = page.locator('a[href="/search"]');
    await searchLink.click();

    // Wait for navigation
    await page.waitForURL('/search');

    // Verify we're on the search page
    expect(page.url()).toContain('/search');
  });

  test('home link navigation works', async ({ page }) => {
    // Navigate to non-existent campsite
    await page.goto('/campsites/99999999');

    // Click on "Go Home" link
    const homeLink = page.locator('a[href="/"]');
    await homeLink.click();

    // Wait for navigation to home
    await page.waitForURL('/');

    // Verify we're on home page
    expect(page.url()).toBe('http://localhost:3000/');
  });

  test('proper HTTP status code returned for server-side rendering', async ({ page }) => {
    // Make request and capture response
    const response = await page.goto('/campsites/non-existent-campsite-id');

    // Verify status code is 404
    expect(response?.status()).toBe(404);

    // Verify content-type header
    const contentType = response?.headers()['content-type'];
    expect(contentType).toContain('text/html');
  });

  test('404 page has proper layout and styling', async ({ page }) => {
    // Navigate to non-existent campsite
    await page.goto('/campsites/99999999');

    // Verify main container has proper classes
    const container = page.locator('.min-h-screen.bg-background');
    await expect(container).toBeVisible();

    // Verify content is centered
    const contentBox = page.locator('.text-center.space-y-6.max-w-md');
    await expect(contentBox).toBeVisible();

    // Verify suggestions box has proper styling
    const suggestionsBox = page.locator('.bg-muted\\/50.rounded-lg.p-4.text-left');
    await expect(suggestionsBox).toBeVisible();
  });

  test('404 page is accessible with semantic HTML', async ({ page }) => {
    // Navigate to non-existent campsite
    await page.goto('/campsites/99999999');

    // Verify h1 heading exists (important for accessibility)
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
    await expect(h1).toContainText('Campsite Not Found');

    // Verify list structure for suggestions
    const suggestionsList = page.locator('ul');
    await expect(suggestionsList).toBeVisible();

    // Verify all buttons have proper text content
    const buttons = page.locator('button, a[role="button"], a');
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);
  });

  test('404 page works on different viewport sizes', async ({ page }) => {
    // Test on mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/campsites/99999999');

    // Verify content is visible on mobile
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('a[href="/search"]')).toBeVisible();

    // Test on tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();

    // Verify content is still visible
    await expect(page.locator('h1')).toBeVisible();

    // Test on desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.reload();

    // Verify content is visible on desktop
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('a[href="/search"]')).toBeVisible();
  });

  test('404 page has proper metadata for SEO', async ({ page }) => {
    // Navigate to non-existent campsite
    await page.goto('/campsites/99999999');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Verify page title
    const title = await page.title();
    expect(title).toContain('ไม่พบแคมป์ไซต์');

    // Verify meta description exists
    const metaDescription = page.locator('meta[name="description"]');
    const description = await metaDescription.getAttribute('content');
    expect(description).toBeTruthy();
    expect(description).toContain('ไม่พบแคมป์ไซต์');

    // Verify noindex meta tag (404 pages should not be indexed)
    const robotsMeta = page.locator('meta[name="robots"]');
    const robotsContent = await robotsMeta.getAttribute('content');
    expect(robotsContent).toContain('noindex');
  });

  test('multiple rapid 404 requests work correctly', async ({ page }) => {
    // Test multiple non-existent IDs in sequence
    const nonExistentIds = ['99999991', '99999992', '99999993'];

    for (const id of nonExistentIds) {
      const response = await page.goto(`/campsites/${id}`);

      // Each should return 404
      expect(response?.status()).toBe(404);

      // Each should show the 404 page
      await expect(page.locator('h1')).toContainText('Campsite Not Found');
    }
  });
});
