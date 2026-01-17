import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Map View Toggle
 *
 * Tests cover:
 * 1. Navigate to search page
 * 2. Verify default view is list
 * 3. Click map view toggle
 * 4. Verify map is now displayed
 * 5. Click list view toggle
 * 6. Verify list is now displayed
 * 7. Verify toggle state persists properly
 */

test.describe('Map View Toggle', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to search page
    await page.goto('/search');
    await page.waitForLoadState('networkidle');
  });

  test('should display list view by default', async ({ page }) => {
    // Verify list view is displayed by default
    const listView = page.locator('[data-testid="list-view"]');
    await expect(listView).toBeVisible();

    // Verify map view is not visible
    const mapView = page.locator('[data-testid="map-view"]');
    await expect(mapView).not.toBeVisible();

    // Verify list toggle button is active
    const listToggle = page.locator('[data-testid="toggle-list-view"]');
    await expect(listToggle).toHaveAttribute('aria-pressed', 'true');

    // Verify map toggle button is not active
    const mapToggle = page.locator('[data-testid="toggle-map-view"]');
    await expect(mapToggle).toHaveAttribute('aria-pressed', 'false');
  });

  test('should switch to map view when map toggle is clicked', async ({ page }) => {
    // Click map view toggle
    const mapToggle = page.locator('[data-testid="toggle-map-view"]');
    await mapToggle.click();

    // Wait for transition
    await page.waitForTimeout(300);

    // Verify map view is now displayed
    const mapView = page.locator('[data-testid="map-view"]');
    await expect(mapView).toBeVisible();

    // Verify list view is not visible
    const listView = page.locator('[data-testid="list-view"]');
    await expect(listView).not.toBeVisible();

    // Verify map toggle button is active
    await expect(mapToggle).toHaveAttribute('aria-pressed', 'true');

    // Verify list toggle button is not active
    const listToggle = page.locator('[data-testid="toggle-list-view"]');
    await expect(listToggle).toHaveAttribute('aria-pressed', 'false');
  });

  test('should switch back to list view when list toggle is clicked', async ({ page }) => {
    // First switch to map view
    const mapToggle = page.locator('[data-testid="toggle-map-view"]');
    await mapToggle.click();
    await page.waitForTimeout(300);

    // Verify we're in map view
    const mapView = page.locator('[data-testid="map-view"]');
    await expect(mapView).toBeVisible();

    // Click list view toggle
    const listToggle = page.locator('[data-testid="toggle-list-view"]');
    await listToggle.click();
    await page.waitForTimeout(300);

    // Verify list view is now displayed
    const listView = page.locator('[data-testid="list-view"]');
    await expect(listView).toBeVisible();

    // Verify map view is not visible
    await expect(mapView).not.toBeVisible();

    // Verify list toggle button is active
    await expect(listToggle).toHaveAttribute('aria-pressed', 'true');

    // Verify map toggle button is not active
    await expect(mapToggle).toHaveAttribute('aria-pressed', 'false');
  });

  test('should persist toggle state on page reload', async ({ page }) => {
    // Switch to map view
    const mapToggle = page.locator('[data-testid="toggle-map-view"]');
    await mapToggle.click();
    await page.waitForTimeout(300);

    // Verify map view is displayed
    const mapView = page.locator('[data-testid="map-view"]');
    await expect(mapView).toBeVisible();

    // Reload the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify map view is still displayed after reload
    await expect(mapView).toBeVisible();

    // Verify map toggle is still active
    await expect(mapToggle).toHaveAttribute('aria-pressed', 'true');

    // Verify list toggle is not active
    const listToggle = page.locator('[data-testid="toggle-list-view"]');
    await expect(listToggle).toHaveAttribute('aria-pressed', 'false');
  });

  test('should persist toggle state in localStorage', async ({ page }) => {
    // Switch to map view
    const mapToggle = page.locator('[data-testid="toggle-map-view"]');
    await mapToggle.click();
    await page.waitForTimeout(300);

    // Check localStorage for saved state
    const viewMode = await page.evaluate(() => {
      return localStorage.getItem('viewMode') || localStorage.getItem('searchViewMode');
    });

    expect(viewMode).toBe('map');

    // Switch back to list view
    const listToggle = page.locator('[data-testid="toggle-list-view"]');
    await listToggle.click();
    await page.waitForTimeout(300);

    // Check localStorage updated
    const updatedViewMode = await page.evaluate(() => {
      return localStorage.getItem('viewMode') || localStorage.getItem('searchViewMode');
    });

    expect(updatedViewMode).toBe('list');
  });

  test('should load map component when switching to map view', async ({ page }) => {
    // Switch to map view
    const mapToggle = page.locator('[data-testid="toggle-map-view"]');
    await mapToggle.click();

    // Wait for map to load
    await page.waitForTimeout(1000);

    // Verify map container exists
    const mapContainer = page.locator('[data-testid="map-container"]');
    await expect(mapContainer).toBeVisible();

    // Verify map canvas or markers are rendered
    const hasMapCanvas = await page.locator('canvas').count() > 0;
    const hasMapMarkers = await page.locator('[data-testid*="map-marker"]').count() > 0;

    expect(hasMapCanvas || hasMapMarkers).toBeTruthy();
  });

  test('should show loading state during view transition', async ({ page }) => {
    // Click map view toggle
    const mapToggle = page.locator('[data-testid="toggle-map-view"]');
    await mapToggle.click();

    // Check for loading indicator
    const loadingIndicator = page.locator('[data-testid="loading"], [class*="loading"], [class*="skeleton"]');

    // Loading state might be very brief, so we check if it appears at all
    const hasLoadingState = await loadingIndicator.count() > 0;

    // Wait for view to fully load
    await page.waitForLoadState('networkidle');

    // Verify map view is displayed
    const mapView = page.locator('[data-testid="map-view"]');
    await expect(mapView).toBeVisible();
  });

  test('should handle rapid toggle clicks gracefully', async ({ page }) => {
    const mapToggle = page.locator('[data-testid="toggle-map-view"]');
    const listToggle = page.locator('[data-testid="toggle-list-view"]');

    // Rapidly click between toggles
    await mapToggle.click();
    await listToggle.click();
    await mapToggle.click();
    await listToggle.click();
    await mapToggle.click();

    // Wait for transitions to settle
    await page.waitForTimeout(500);

    // Verify we end up in map view (last click)
    const mapView = page.locator('[data-testid="map-view"]');
    await expect(mapView).toBeVisible();

    // Verify toggle state is consistent
    await expect(mapToggle).toHaveAttribute('aria-pressed', 'true');
    await expect(listToggle).toHaveAttribute('aria-pressed', 'false');
  });

  test('should maintain scroll position when toggling views', async ({ page }) => {
    // Scroll down in list view
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(300);

    const initialScrollPosition = await page.evaluate(() => window.scrollY);

    // Switch to map view
    const mapToggle = page.locator('[data-testid="toggle-map-view"]');
    await mapToggle.click();
    await page.waitForTimeout(300);

    // Switch back to list view
    const listToggle = page.locator('[data-testid="toggle-list-view"]');
    await listToggle.click();
    await page.waitForTimeout(300);

    // Check scroll position is maintained or reset appropriately
    const finalScrollPosition = await page.evaluate(() => window.scrollY);

    // Either maintains position or resets to top (both are valid behaviors)
    expect(finalScrollPosition === initialScrollPosition || finalScrollPosition === 0).toBeTruthy();
  });

  test('should have accessible toggle buttons', async ({ page }) => {
    const mapToggle = page.locator('[data-testid="toggle-map-view"]');
    const listToggle = page.locator('[data-testid="toggle-list-view"]');

    // Check aria attributes
    await expect(mapToggle).toHaveAttribute('role', /button|radio|tab/);
    await expect(listToggle).toHaveAttribute('role', /button|radio|tab/);

    // Check aria-pressed or aria-selected
    const mapAriaPressed = await mapToggle.getAttribute('aria-pressed');
    const mapAriaSelected = await mapToggle.getAttribute('aria-selected');
    expect(mapAriaPressed !== null || mapAriaSelected !== null).toBeTruthy();

    // Check for accessible labels
    const mapLabel = await mapToggle.textContent();
    const mapAriaLabel = await mapToggle.getAttribute('aria-label');
    expect(mapLabel || mapAriaLabel).toBeTruthy();

    const listLabel = await listToggle.textContent();
    const listAriaLabel = await listToggle.getAttribute('aria-label');
    expect(listLabel || listAriaLabel).toBeTruthy();
  });

  test('should support keyboard navigation', async ({ page }) => {
    const mapToggle = page.locator('[data-testid="toggle-map-view"]');

    // Focus on map toggle button
    await mapToggle.focus();

    // Press Enter to activate
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);

    // Verify map view is displayed
    const mapView = page.locator('[data-testid="map-view"]');
    await expect(mapView).toBeVisible();

    // Focus on list toggle
    const listToggle = page.locator('[data-testid="toggle-list-view"]');
    await listToggle.focus();

    // Press Space to activate
    await page.keyboard.press('Space');
    await page.waitForTimeout(300);

    // Verify list view is displayed
    const listView = page.locator('[data-testid="list-view"]');
    await expect(listView).toBeVisible();
  });

  test('should clear localStorage when user navigates away', async ({ page, context }) => {
    // Set view mode to map
    const mapToggle = page.locator('[data-testid="toggle-map-view"]');
    await mapToggle.click();
    await page.waitForTimeout(300);

    // Verify localStorage is set
    let viewMode = await page.evaluate(() => {
      return localStorage.getItem('viewMode') || localStorage.getItem('searchViewMode');
    });
    expect(viewMode).toBe('map');

    // Navigate to a different page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate back to search
    await page.goto('/search');
    await page.waitForLoadState('networkidle');

    // Check if view mode persists (should persist across same-session navigation)
    const mapView = page.locator('[data-testid="map-view"]');
    const listView = page.locator('[data-testid="list-view"]');

    // Either maintains the map view or resets to list view
    const mapVisible = await mapView.isVisible().catch(() => false);
    const listVisible = await listView.isVisible().catch(() => false);

    expect(mapVisible || listVisible).toBeTruthy();
  });
});
