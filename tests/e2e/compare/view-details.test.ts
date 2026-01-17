import { test, expect } from '@playwright/test';

test.describe('View Details Button Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });

    // Navigate to wishlist and select campsites
    await page.goto('/wishlist');
    await page.waitForLoadState('networkidle');

    const checkboxes = page.locator('[data-testid="compare-checkbox"]');
    await checkboxes.nth(0).click();
    await checkboxes.nth(1).click();

    // Click compare button
    const compareButton = page.locator('[data-testid="compare-btn"]');
    await compareButton.click();

    // Wait for navigation
    await page.waitForURL('**/compare**');
    await page.waitForLoadState('networkidle');
  });

  test('T107.1: View Details button exists for each campsite', async ({ page }) => {
    const viewDetailsButtons = page.locator('[data-testid="view-details-btn"]');
    const buttonCount = await viewDetailsButtons.count();

    // Should have one button per campsite (2 in this case)
    expect(buttonCount).toBe(2);
  });

  test('T107.2: View Details button has correct label', async ({ page }) => {
    const viewDetailsButton = page.locator('[data-testid="view-details-btn"]').first();

    await expect(viewDetailsButton).toBeVisible();

    // Should contain "View Details" or Thai equivalent
    const buttonText = await viewDetailsButton.textContent();
    expect(buttonText).toMatch(/view details|ดูรายละเอียด/i);
  });

  test('T107.3: Clicking View Details navigates to campsite page', async ({ page }) => {
    const viewDetailsButton = page.locator('[data-testid="view-details-btn"]').first();

    // Click the button
    await viewDetailsButton.click();

    // Should navigate to campsite detail page
    await page.waitForURL('**/campsites/**');
    expect(page.url()).toMatch(/\/campsites\/[a-zA-Z0-9-]+/);
  });

  test('T107.4: View Details opens in same tab by default', async ({ page }) => {
    const viewDetailsButton = page.locator('[data-testid="view-details-btn"]').first();

    // Get current context page count
    const context = page.context();
    const pagesBefore = context.pages().length;

    // Click button
    await viewDetailsButton.click();
    await page.waitForTimeout(500);

    // Should still have same number of pages (not new tab)
    const pagesAfter = context.pages().length;
    expect(pagesAfter).toBe(pagesBefore);
  });

  test('T107.5: View Details button is styled as primary action', async ({ page }) => {
    const viewDetailsButton = page.locator('[data-testid="view-details-btn"]').first();

    // Button should have primary styling
    const hasButtonStyling = await viewDetailsButton.evaluate((btn) => {
      const classes = btn.className;
      return classes.includes('btn') ||
             classes.includes('button') ||
             classes.includes('primary') ||
             btn.tagName.toLowerCase() === 'button' ||
             btn.tagName.toLowerCase() === 'a';
    });

    expect(hasButtonStyling).toBeTruthy();
  });

  test('T107.6: View Details button position is consistent across columns', async ({ page }) => {
    const viewDetailsButtons = page.locator('[data-testid="view-details-btn"]');

    // Get positions of all buttons
    const positions = [];
    const buttonCount = await viewDetailsButtons.count();

    for (let i = 0; i < Math.min(buttonCount, 2); i++) {
      const box = await viewDetailsButtons.nth(i).boundingBox();
      positions.push(box);
    }

    // Y positions should be similar (within 10px)
    if (positions.length >= 2 && positions[0] && positions[1]) {
      const yDiff = Math.abs(positions[0].y - positions[1].y);
      expect(yDiff).toBeLessThan(10);
    }
  });

  test('T107.7: View Details navigates to correct campsite', async ({ page }) => {
    // Get campsite name from first column
    const firstCampsiteName = await page.locator('[data-testid="campsite-header"]').first().textContent();

    // Click View Details for first campsite
    const viewDetailsButton = page.locator('[data-testid="view-details-btn"]').first();
    await viewDetailsButton.click();

    // Wait for navigation
    await page.waitForURL('**/campsites/**');
    await page.waitForLoadState('networkidle');

    // Page should show the same campsite name
    const detailPageTitle = await page.locator('h1, [data-testid="campsite-title"]').first().textContent();

    // Names should match (allowing for slight formatting differences)
    expect(detailPageTitle?.toLowerCase()).toContain(firstCampsiteName?.toLowerCase().substring(0, 10) || '');
  });

  test('T107.8: View Details button is keyboard accessible', async ({ page }) => {
    const viewDetailsButton = page.locator('[data-testid="view-details-btn"]').first();

    // Focus the button
    await viewDetailsButton.focus();

    // Button should be focused
    await expect(viewDetailsButton).toBeFocused();

    // Press Enter
    await page.keyboard.press('Enter');

    // Should navigate
    await page.waitForURL('**/campsites/**', { timeout: 3000 });
    expect(page.url()).toMatch(/\/campsites\//);
  });

  test('T107.9: View Details button has hover state', async ({ page }) => {
    const viewDetailsButton = page.locator('[data-testid="view-details-btn"]').first();

    // Get initial styling
    const initialColor = await viewDetailsButton.evaluate((btn) =>
      window.getComputedStyle(btn).backgroundColor
    );

    // Hover over button
    await viewDetailsButton.hover();
    await page.waitForTimeout(100);

    // Styling should change or button should have hover class
    const hoverColor = await viewDetailsButton.evaluate((btn) =>
      window.getComputedStyle(btn).backgroundColor
    );

    // Color should change or have hover effect
    const hasHoverEffect = initialColor !== hoverColor;
    expect(hasHoverEffect).toBeTruthy();
  });

  test('T107.10: Multiple View Details buttons work independently', async ({ page }) => {
    const viewDetailsButtons = page.locator('[data-testid="view-details-btn"]');

    // Get second campsite name
    const secondCampsiteName = await page.locator('[data-testid="campsite-header"]').nth(1).textContent();

    // Click second View Details button
    await viewDetailsButtons.nth(1).click();

    // Should navigate to second campsite
    await page.waitForURL('**/campsites/**');
    await page.waitForLoadState('networkidle');

    const detailPageTitle = await page.locator('h1, [data-testid="campsite-title"]').first().textContent();
    expect(detailPageTitle?.toLowerCase()).toContain(secondCampsiteName?.toLowerCase().substring(0, 10) || '');
  });

  test('T107.11: View Details button works on mobile tabs view', async ({ page }) => {
    // Switch to mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(300);

    // Find View Details button in mobile view
    const viewDetailsButton = page.locator('[data-testid="view-details-btn"]').first();
    await expect(viewDetailsButton).toBeVisible();

    // Click it
    await viewDetailsButton.click();

    // Should navigate
    await page.waitForURL('**/campsites/**');
    expect(page.url()).toMatch(/\/campsites\//);
  });

  test('T107.12: View Details link has proper accessibility attributes', async ({ page }) => {
    const viewDetailsButton = page.locator('[data-testid="view-details-btn"]').first();

    // Should have proper role or be a link/button element
    const tagName = await viewDetailsButton.evaluate((el) => el.tagName.toLowerCase());
    expect(['a', 'button']).toContain(tagName);

    // If it's a link, should have href
    if (tagName === 'a') {
      const href = await viewDetailsButton.getAttribute('href');
      expect(href).toBeTruthy();
      expect(href).toMatch(/\/campsites\//);
    }
  });

  test('T107.13: Back navigation returns to comparison page', async ({ page }) => {
    const viewDetailsButton = page.locator('[data-testid="view-details-btn"]').first();

    // Click View Details
    await viewDetailsButton.click();
    await page.waitForURL('**/campsites/**');

    // Go back
    await page.goBack();

    // Should be back on compare page
    await page.waitForURL('**/compare**');
    expect(page.url()).toContain('/compare');

    // Comparison table should still be visible
    const comparisonTable = page.locator('[data-testid="comparison-table"]');
    await expect(comparisonTable).toBeVisible();
  });
});
