import { test, expect } from '@playwright/test';

test.describe('Compare Button Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/wishlist');
    await page.waitForLoadState('networkidle');
  });

  test('T102.1: Compare button does not appear with 0 selections', async ({ page }) => {
    const compareButton = page.locator('[data-testid="compare-btn"]');

    // Button should not be visible with no selections
    await expect(compareButton).not.toBeVisible();
  });

  test('T102.2: Compare button does not appear with only 1 selection', async ({ page }) => {
    const checkboxes = page.locator('[data-testid="compare-checkbox"]');
    const compareButton = page.locator('[data-testid="compare-btn"]');

    // Select one campsite
    await checkboxes.first().click();

    // Button should still not be visible with only 1 selection
    await expect(compareButton).not.toBeVisible();
  });

  test('T102.3: Compare button appears when 2 campsites are selected', async ({ page }) => {
    const checkboxes = page.locator('[data-testid="compare-checkbox"]');
    const compareButton = page.locator('[data-testid="compare-btn"]');

    // Select two campsites
    await checkboxes.nth(0).click();
    await checkboxes.nth(1).click();

    // Compare button should now be visible
    await expect(compareButton).toBeVisible();
    await expect(compareButton).toBeEnabled();
  });

  test('T102.4: Compare button remains visible with 3 selections', async ({ page }) => {
    const checkboxes = page.locator('[data-testid="compare-checkbox"]');
    const compareButton = page.locator('[data-testid="compare-btn"]');

    // Select three campsites
    await checkboxes.nth(0).click();
    await checkboxes.nth(1).click();
    await checkboxes.nth(2).click();

    // Compare button should be visible
    await expect(compareButton).toBeVisible();
    await expect(compareButton).toBeEnabled();
  });

  test('T102.5: Compare button navigates to comparison page', async ({ page }) => {
    const checkboxes = page.locator('[data-testid="compare-checkbox"]');
    const compareButton = page.locator('[data-testid="compare-btn"]');

    // Select two campsites
    await checkboxes.nth(0).click();
    await checkboxes.nth(1).click();

    // Click compare button
    await compareButton.click();

    // Should navigate to /compare page
    await page.waitForURL('**/compare**');
    expect(page.url()).toContain('/compare');
  });

  test('T102.6: Compare bar shows selected campsite count', async ({ page }) => {
    const checkboxes = page.locator('[data-testid="compare-checkbox"]');
    const compareBar = page.locator('[data-testid="compare-bar"]');

    // Select two campsites
    await checkboxes.nth(0).click();
    await checkboxes.nth(1).click();

    // Compare bar should display count
    await expect(compareBar).toBeVisible();
    await expect(compareBar).toContainText('2');
  });

  test('T102.7: Compare bar is sticky at bottom of viewport', async ({ page }) => {
    const checkboxes = page.locator('[data-testid="compare-checkbox"]');
    const compareBar = page.locator('[data-testid="compare-bar"]');

    // Select two campsites
    await checkboxes.nth(0).click();
    await checkboxes.nth(1).click();

    // Verify compare bar is visible
    await expect(compareBar).toBeVisible();

    // Scroll down
    await page.evaluate(() => window.scrollBy(0, 500));
    await page.waitForTimeout(200);

    // Compare bar should still be visible (sticky positioning)
    await expect(compareBar).toBeVisible();

    // Verify it's at the bottom of the viewport
    const barPosition = await compareBar.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      return rect.bottom >= viewportHeight - 50; // Within 50px of bottom
    });

    expect(barPosition).toBeTruthy();
  });

  test('T102.8: Compare bar disappears when deselecting to less than 2', async ({ page }) => {
    const checkboxes = page.locator('[data-testid="compare-checkbox"]');
    const compareBar = page.locator('[data-testid="compare-bar"]');

    // Select two campsites
    await checkboxes.nth(0).click();
    await checkboxes.nth(1).click();

    // Compare bar should be visible
    await expect(compareBar).toBeVisible();

    // Deselect one
    await checkboxes.nth(1).click();

    // Compare bar should disappear
    await expect(compareBar).not.toBeVisible();
  });

  test('T102.9: Compare button shows loading state during navigation', async ({ page }) => {
    const checkboxes = page.locator('[data-testid="compare-checkbox"]');
    const compareButton = page.locator('[data-testid="compare-btn"]');

    // Select two campsites
    await checkboxes.nth(0).click();
    await checkboxes.nth(1).click();

    // Click compare button
    await compareButton.click();

    // Button should show loading state (disabled or spinner)
    const isDisabled = await compareButton.isDisabled().catch(() => false);
    const hasLoadingClass = await compareButton.evaluate((el) =>
      el.classList.contains('loading') || el.querySelector('.spinner') !== null
    ).catch(() => false);

    expect(isDisabled || hasLoadingClass).toBeTruthy();
  });

  test('T102.10: Compare bar shows selected campsite names', async ({ page }) => {
    const checkboxes = page.locator('[data-testid="compare-checkbox"]');
    const compareBar = page.locator('[data-testid="compare-bar"]');

    // Select two campsites
    await checkboxes.nth(0).click();
    await checkboxes.nth(1).click();

    // Compare bar should show campsite info
    await expect(compareBar).toBeVisible();

    // Should contain campsite names or thumbnails
    const hasContent = await compareBar.evaluate((el) => {
      const text = el.textContent || '';
      const images = el.querySelectorAll('img');
      return text.length > 20 || images.length >= 2;
    });

    expect(hasContent).toBeTruthy();
  });
});
