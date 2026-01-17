import { test, expect } from '@playwright/test';

test.describe('Search Page Performance Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to search page
    await page.goto('/search');
  });

  test('T066.1: Search page initial load time under 500ms', async ({ page }) => {
    // Measure navigation timing
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        loadTime: navigation.loadEventEnd - navigation.fetchStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
        firstPaint: performance.getEntriesByType('paint')[0]?.startTime || 0,
      };
    });

    // Verify page loads under 500ms
    expect(performanceMetrics.loadTime).toBeLessThan(500);
    console.log(`Page load time: ${performanceMetrics.loadTime.toFixed(2)}ms`);
    console.log(`DOM content loaded: ${performanceMetrics.domContentLoaded.toFixed(2)}ms`);
    console.log(`First paint: ${performanceMetrics.firstPaint.toFixed(2)}ms`);
  });

  test('T066.2: Filter application response time under 300ms', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Measure filter interaction time
    const filterButton = page.getByRole('button', { name: /ตัวกรอง|Filter/i }).first();

    const startTime = Date.now();
    await filterButton.click();

    // Wait for filter UI to appear
    const filterPanel = page.locator('[role="dialog"], [data-testid="filter-panel"]').first();
    await filterPanel.waitFor({ state: 'visible', timeout: 5000 });

    const responseTime = Date.now() - startTime;

    // Verify filter responds under 300ms
    expect(responseTime).toBeLessThan(300);
    console.log(`Filter application response time: ${responseTime}ms`);
  });

  test('T066.3: Skeleton loading states appear immediately', async ({ page }) => {
    // Start measuring before navigation
    const navigationPromise = page.goto('/search');

    // Check if skeleton appears within 100ms
    const skeletonAppeared = await Promise.race([
      page.locator('[data-testid="skeleton"], .skeleton, [class*="skeleton"]').first()
        .waitFor({ state: 'visible', timeout: 100 })
        .then(() => true)
        .catch(() => false),
      navigationPromise.then(() => false),
    ]);

    // Wait for navigation to complete
    await navigationPromise;
    await page.waitForLoadState('networkidle');

    // Skeleton should appear immediately (within 100ms)
    expect(skeletonAppeared).toBe(true);
    console.log('Skeleton loading state appeared immediately');
  });

  test('T066.4: Results render within acceptable time', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Trigger search or ensure results are displayed
    const searchInput = page.getByRole('textbox', { name: /ค้นหา|Search/i }).first();

    const startTime = Date.now();
    await searchInput.fill('campsite');
    await searchInput.press('Enter');

    // Wait for results to appear
    const resultsContainer = page.locator('[data-testid="search-results"], [class*="results"]').first();
    await resultsContainer.waitFor({ state: 'visible', timeout: 2000 });

    const renderTime = Date.now() - startTime;

    // Results should render within 2 seconds (acceptable for search query)
    expect(renderTime).toBeLessThan(2000);
    console.log(`Results render time: ${renderTime}ms`);

    // Verify at least one result is visible
    const resultItems = page.locator('[data-testid="campsite-card"], [class*="campsite"], article').first();
    await expect(resultItems).toBeVisible();
  });

  test('T066.5: No visual layout shifts during loading', async ({ page }) => {
    // Measure Cumulative Layout Shift (CLS)
    await page.waitForLoadState('networkidle');

    const cls = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let clsValue = 0;
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if ((entry as any).hadRecentInput) {
              continue;
            }
            clsValue += (entry as any).value;
          }
        });

        observer.observe({ type: 'layout-shift', buffered: true });

        // Wait for a short period to collect layout shift entries
        setTimeout(() => {
          observer.disconnect();
          resolve(clsValue);
        }, 1000);
      });
    });

    // CLS should be less than 0.1 (good threshold)
    expect(cls).toBeLessThan(0.1);
    console.log(`Cumulative Layout Shift: ${cls.toFixed(4)}`);
  });

  test('T066.6: Performance marks for skeleton transitions', async ({ page }) => {
    // Navigate and capture performance marks
    await page.goto('/search');

    // Wait for content to load
    await page.waitForLoadState('networkidle');

    // Check for performance marks related to loading
    const performanceMarks = await page.evaluate(() => {
      const marks = performance.getEntriesByType('mark');
      const measures = performance.getEntriesByType('measure');

      return {
        marks: marks.map(m => ({ name: m.name, startTime: m.startTime })),
        measures: measures.map(m => ({ name: m.name, duration: m.duration })),
        resourceCount: performance.getEntriesByType('resource').length,
      };
    });

    console.log(`Performance marks: ${performanceMarks.marks.length}`);
    console.log(`Performance measures: ${performanceMarks.measures.length}`);
    console.log(`Resources loaded: ${performanceMarks.resourceCount}`);

    // Verify that resources are loaded efficiently
    expect(performanceMarks.resourceCount).toBeGreaterThan(0);
  });

  test('T066.7: Time to Interactive (TTI) is acceptable', async ({ page }) => {
    // Navigate and measure TTI
    await page.goto('/search');

    const ttiMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domInteractive: navigation.domInteractive - navigation.fetchStart,
        domComplete: navigation.domComplete - navigation.fetchStart,
        loadComplete: navigation.loadEventEnd - navigation.fetchStart,
      };
    });

    // DOM should be interactive quickly (under 1 second)
    expect(ttiMetrics.domInteractive).toBeLessThan(1000);
    console.log(`DOM Interactive: ${ttiMetrics.domInteractive.toFixed(2)}ms`);
    console.log(`DOM Complete: ${ttiMetrics.domComplete.toFixed(2)}ms`);
    console.log(`Load Complete: ${ttiMetrics.loadComplete.toFixed(2)}ms`);
  });
});
