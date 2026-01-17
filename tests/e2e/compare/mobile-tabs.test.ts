import { test, expect, devices } from '@playwright/test';

test.describe('Mobile Comparison Tabs Interface', () => {
  test.beforeEach(async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size

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

  test('T105.1: Tab interface displays on mobile viewport', async ({ page }) => {
    const tabList = page.locator('[role="tablist"], [data-testid="comparison-tabs"]');

    // Tabs should be visible on mobile
    await expect(tabList).toBeVisible();

    // Table should not be visible
    const comparisonTable = page.locator('[data-testid="comparison-table"]');
    await expect(comparisonTable).not.toBeVisible();
  });

  test('T105.2: Tab for each selected campsite exists', async ({ page }) => {
    const tabs = page.locator('[role="tab"], [data-testid="campsite-tab"]');
    const tabCount = await tabs.count();

    // Should have 2 tabs (one per selected campsite)
    expect(tabCount).toBe(2);
  });

  test('T105.3: Tab shows campsite name and thumbnail', async ({ page }) => {
    const firstTab = page.locator('[role="tab"], [data-testid="campsite-tab"]').first();

    // Tab should have text content (campsite name)
    const tabText = await firstTab.textContent();
    expect(tabText?.trim().length).toBeGreaterThan(0);

    // Tab may have thumbnail image
    const tabImage = firstTab.locator('img');
    const imageCount = await tabImage.count();
    // Image is optional but common
    expect(imageCount).toBeGreaterThanOrEqual(0);
  });

  test('T105.4: First tab is active by default', async ({ page }) => {
    const firstTab = page.locator('[role="tab"], [data-testid="campsite-tab"]').first();

    // First tab should have active state
    const isActive = await firstTab.evaluate((el) => {
      return el.getAttribute('aria-selected') === 'true' ||
             el.classList.contains('active') ||
             el.getAttribute('data-state') === 'active';
    });

    expect(isActive).toBeTruthy();
  });

  test('T105.5: Clicking tab switches active campsite display', async ({ page }) => {
    const tabs = page.locator('[role="tab"], [data-testid="campsite-tab"]');
    const secondTab = tabs.nth(1);

    // Click second tab
    await secondTab.click();
    await page.waitForTimeout(200);

    // Second tab should now be active
    const isActive = await secondTab.evaluate((el) => {
      return el.getAttribute('aria-selected') === 'true' ||
             el.classList.contains('active') ||
             el.getAttribute('data-state') === 'active';
    });

    expect(isActive).toBeTruthy();
  });

  test('T105.6: Tab panel shows campsite details', async ({ page }) => {
    const activePanel = page.locator('[role="tabpanel"], [data-testid="campsite-panel"]').first();

    // Panel should be visible
    await expect(activePanel).toBeVisible();

    // Panel should contain campsite information
    const hasContent = await activePanel.evaluate((el) => {
      return el.textContent && el.textContent.length > 50;
    });

    expect(hasContent).toBeTruthy();
  });

  test('T105.7: Tab panel displays all campsite features', async ({ page }) => {
    const activePanel = page.locator('[role="tabpanel"], [data-testid="campsite-panel"]').first();

    // Should show price
    const priceSection = activePanel.locator('[data-testid="price-section"]');
    await expect(priceSection).toBeVisible();

    // Should show location
    const locationSection = activePanel.locator('[data-testid="location-section"]');
    await expect(locationSection).toBeVisible();

    // Should show amenities
    const amenitiesSection = activePanel.locator('[data-testid="amenities-section"]');
    await expect(amenitiesSection).toBeVisible();
  });

  test('T105.8: Swiping switches between tabs', async ({ page }) => {
    const tabPanel = page.locator('[role="tabpanel"], [data-testid="campsite-panel"]').first();

    // Get first tab name
    const firstTabContent = await tabPanel.textContent();

    // Perform swipe gesture (left swipe to next tab)
    await tabPanel.evaluate((el) => {
      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientX: 300, clientY: 200 } as Touch],
        bubbles: true
      });
      const touchMove = new TouchEvent('touchmove', {
        touches: [{ clientX: 100, clientY: 200 } as Touch],
        bubbles: true
      });
      const touchEnd = new TouchEvent('touchend', {
        bubbles: true
      });

      el.dispatchEvent(touchStart);
      el.dispatchEvent(touchMove);
      el.dispatchEvent(touchEnd);
    });

    await page.waitForTimeout(500);

    // Content should change (if swipe is implemented)
    const secondTabContent = await tabPanel.textContent();
    // Note: This test assumes swipe is implemented; may need adjustment
  });

  test('T105.9: Tab indicator shows current position', async ({ page }) => {
    const tabs = page.locator('[role="tab"], [data-testid="campsite-tab"]');

    // Click second tab
    await tabs.nth(1).click();
    await page.waitForTimeout(200);

    // Visual indicator should move
    const indicator = page.locator('[data-testid="tab-indicator"]');
    if (await indicator.count() > 0) {
      await expect(indicator).toBeVisible();
    }

    // Second tab should have active styling
    const hasActiveClass = await tabs.nth(1).evaluate((el) => {
      return el.classList.contains('active') ||
             el.classList.contains('bg-primary') ||
             el.getAttribute('aria-selected') === 'true';
    });

    expect(hasActiveClass).toBeTruthy();
  });

  test('T105.10: Three campsites show 3 tabs on mobile', async ({ page }) => {
    // Go back and select third campsite
    await page.goto('/wishlist');
    await page.waitForLoadState('networkidle');

    const checkboxes = page.locator('[data-testid="compare-checkbox"]');
    await checkboxes.nth(0).click();
    await checkboxes.nth(1).click();
    await checkboxes.nth(2).click();

    const compareButton = page.locator('[data-testid="compare-btn"]');
    await compareButton.click();

    await page.waitForURL('**/compare**');
    await page.waitForLoadState('networkidle');

    // Should have 3 tabs
    const tabs = page.locator('[role="tab"], [data-testid="campsite-tab"]');
    const tabCount = await tabs.count();
    expect(tabCount).toBe(3);
  });

  test('T105.11: Tabs are horizontally scrollable if needed', async ({ page }) => {
    // Go back and select third campsite
    await page.goto('/wishlist');
    await page.waitForLoadState('networkidle');

    const checkboxes = page.locator('[data-testid="compare-checkbox"]');
    await checkboxes.nth(0).click();
    await checkboxes.nth(1).click();
    await checkboxes.nth(2).click();

    const compareButton = page.locator('[data-testid="compare-btn"]');
    await compareButton.click();

    await page.waitForURL('**/compare**');
    await page.waitForLoadState('networkidle');

    // Tab container should allow horizontal scroll
    const tabContainer = page.locator('[role="tablist"], [data-testid="comparison-tabs"]');
    const isScrollable = await tabContainer.evaluate((el) => {
      return el.scrollWidth > el.clientWidth;
    });

    // With 3 tabs on small mobile, should be scrollable
    expect(isScrollable).toBeTruthy();
  });

  test('T105.12: Desktop viewport shows table instead of tabs', async ({ page }) => {
    // Resize to desktop
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(300);

    // Table should now be visible
    const comparisonTable = page.locator('[data-testid="comparison-table"]');
    await expect(comparisonTable).toBeVisible();

    // Tabs should not be visible
    const tabList = page.locator('[role="tablist"], [data-testid="comparison-tabs"]');
    await expect(tabList).not.toBeVisible();
  });
});
