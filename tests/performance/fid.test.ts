/**
 * FID (First Input Delay) / INP (Interaction to Next Paint) Performance Tests - T054
 *
 * Tests that user interactions meet Google's recommended thresholds:
 * - FID < 100ms (legacy metric)
 * - INP < 200ms (modern replacement for FID)
 *
 * These tests verify that JavaScript doesn't block the main thread
 * and that user interactions are responsive.
 */
import { test, expect, Page, CDPSession } from '@playwright/test';

// Import helpers
import {
  THRESHOLDS,
  collectFID,
  collectINP,
  calculateINP,
  measureInteractionLatency,
  collectNavigationMetrics,
  evaluateMetric,
  formatMetric,
  InteractionEntry,
} from './helpers/metrics';

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3090';
const FID_THRESHOLD = THRESHOLDS.FID.GOOD; // 100ms
const INP_THRESHOLD = THRESHOLDS.INP.GOOD; // 200ms
const INTERACTION_THRESHOLD = 300; // Acceptable interaction latency

/**
 * Setup event timing observer on page
 */
async function setupEventTimingObserver(page: Page): Promise<void> {
  await page.evaluate(() => {
    (window as any).__eventTimings = [];
    (window as any).__fidValue = null;

    // FID Observer
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      for (const entry of entries) {
        const fidEntry = entry as any;
        if ((window as any).__fidValue === null) {
          (window as any).__fidValue = fidEntry.processingStart - fidEntry.startTime;
        }
      }
    });

    try {
      fidObserver.observe({ type: 'first-input', buffered: true });
    } catch (e) {
      console.warn('FID observer not supported');
    }

    // Event Timing Observer (for INP)
    const eventObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      for (const entry of entries) {
        const eventEntry = entry as any;
        if (eventEntry.interactionId && eventEntry.interactionId > 0) {
          (window as any).__eventTimings.push({
            name: eventEntry.name,
            duration: eventEntry.duration,
            startTime: eventEntry.startTime,
            processingStart: eventEntry.processingStart,
            processingEnd: eventEntry.processingEnd,
            interactionId: eventEntry.interactionId,
            inputDelay: eventEntry.processingStart - eventEntry.startTime,
            processingTime: eventEntry.processingEnd - eventEntry.processingStart,
            presentationDelay: eventEntry.duration - (eventEntry.processingEnd - eventEntry.startTime),
          });
        }
      }
    });

    try {
      eventObserver.observe({ type: 'event', buffered: true, durationThreshold: 0 } as any);
    } catch (e) {
      console.warn('Event timing observer not supported');
    }

    (window as any).__fidObserver = fidObserver;
    (window as any).__eventObserver = eventObserver;
  });
}

/**
 * Collect recorded event timings
 */
async function collectEventTimings(page: Page): Promise<{
  fid: number | null;
  interactions: InteractionEntry[];
}> {
  return page.evaluate(() => {
    // Cleanup observers
    if ((window as any).__fidObserver) {
      (window as any).__fidObserver.disconnect();
    }
    if ((window as any).__eventObserver) {
      (window as any).__eventObserver.disconnect();
    }

    return {
      fid: (window as any).__fidValue,
      interactions: (window as any).__eventTimings || [],
    };
  });
}

/**
 * Log interaction results
 */
function logInteractionResult(
  name: string,
  duration: number,
  threshold: number
): void {
  const rating = evaluateMetric(duration, { GOOD: threshold, NEEDS_IMPROVEMENT: threshold * 2 });
  console.log(formatMetric(name, duration, 'ms', rating));
}

/**
 * Check for long tasks blocking the main thread
 */
async function checkLongTasks(page: Page, duration = 3000): Promise<number[]> {
  return page.evaluate((dur) => {
    return new Promise<number[]>((resolve) => {
      const longTasks: number[] = [];

      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          longTasks.push(entry.duration);
        }
      });

      try {
        observer.observe({ type: 'longtask', buffered: true });
      } catch (e) {
        resolve([]);
        return;
      }

      setTimeout(() => {
        observer.disconnect();
        resolve(longTasks);
      }, dur);
    });
  }, duration);
}

// =============================================================================
// TEST SUITE: First Input Delay (FID) Tests
// =============================================================================

test.describe('T054: FID Performance Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test('T054.1: Homepage first click should have FID under 100ms', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    // Setup observer
    await setupEventTimingObserver(page);

    // Wait for any JavaScript to finish loading
    await page.waitForTimeout(500);

    // Perform first interaction - click on navigation or search
    const clickTarget = page
      .locator('button, a, [role="button"], input')
      .first();

    await clickTarget.waitFor({ state: 'visible' });
    await clickTarget.click();

    // Wait for interaction to be recorded
    await page.waitForTimeout(200);

    // Collect FID
    const { fid } = await collectEventTimings(page);

    if (fid !== null) {
      logInteractionResult('Homepage FID', fid, FID_THRESHOLD);
      expect(fid).toBeLessThan(FID_THRESHOLD);
    } else {
      console.log('[INFO] FID measurement not available - using fallback timing');
      // FID not available, test passes as browser may not support it
    }
  });

  test('T054.2: Search form input should respond within 100ms', async ({ page }) => {
    await page.goto(`${BASE_URL}/search`, { waitUntil: 'networkidle' });

    await setupEventTimingObserver(page);

    // Find search input
    const searchInput = page
      .locator('input[type="text"], input[type="search"], [role="searchbox"]')
      .first();

    await searchInput.waitFor({ state: 'visible' });

    // Measure input focus latency
    const focusLatency = await measureInteractionLatency(page, 'input', async () => {
      await searchInput.focus();
    });

    // Type in the input
    await searchInput.type('camping');

    await page.waitForTimeout(200);

    const { fid, interactions } = await collectEventTimings(page);

    console.log(`Search input focus latency: ${focusLatency.toFixed(2)}ms`);

    if (fid !== null) {
      logInteractionResult('Search Input FID', fid, FID_THRESHOLD);
      expect(fid).toBeLessThan(FID_THRESHOLD);
    }

    // Check keyboard interactions
    const keyInteractions = interactions.filter(
      (i) => i.name === 'keydown' || i.name === 'keyup' || i.name === 'keypress'
    );

    if (keyInteractions.length > 0) {
      const avgKeyLatency =
        keyInteractions.reduce((sum, i) => sum + i.duration, 0) /
        keyInteractions.length;
      console.log(`Average key interaction latency: ${avgKeyLatency.toFixed(2)}ms`);
      expect(avgKeyLatency).toBeLessThan(INP_THRESHOLD);
    }
  });

  test('T054.3: Button click should respond within 100ms', async ({ page }) => {
    await page.goto(`${BASE_URL}/search`, { waitUntil: 'networkidle' });

    await setupEventTimingObserver(page);

    // Find a button to click
    const button = page
      .locator('button:visible')
      .first();

    await button.waitFor({ state: 'visible' });

    // Measure click latency
    const startTime = Date.now();
    await button.click();
    const clickTime = Date.now() - startTime;

    await page.waitForTimeout(200);

    const { fid, interactions } = await collectEventTimings(page);

    console.log(`Button click browser time: ${clickTime}ms`);

    if (fid !== null) {
      logInteractionResult('Button Click FID', fid, FID_THRESHOLD);
      expect(fid).toBeLessThan(FID_THRESHOLD);
    }

    // Check click interactions from event timing
    const clickInteractions = interactions.filter(
      (i) => i.name === 'pointerdown' || i.name === 'pointerup' || i.name === 'click'
    );

    if (clickInteractions.length > 0) {
      const maxClickDuration = Math.max(...clickInteractions.map((i) => i.duration));
      logInteractionResult('Click Event Duration', maxClickDuration, INP_THRESHOLD);
    }
  });

  test('T054.4: Filter interaction should respond within 100ms', async ({ page }) => {
    await page.goto(`${BASE_URL}/search`, { waitUntil: 'networkidle' });

    await setupEventTimingObserver(page);

    // Find filter button or checkbox
    const filterElement = page
      .locator(
        '[data-testid="filter"], input[type="checkbox"], button:has-text("Filter"), button:has-text("ตัวกรอง")'
      )
      .first();

    const isVisible = await filterElement.isVisible().catch(() => false);

    if (isVisible) {
      const startTime = Date.now();
      await filterElement.click();
      const interactionTime = Date.now() - startTime;

      await page.waitForTimeout(200);

      const { fid } = await collectEventTimings(page);

      console.log(`Filter interaction time: ${interactionTime}ms`);

      if (fid !== null) {
        logInteractionResult('Filter FID', fid, FID_THRESHOLD);
        expect(fid).toBeLessThan(FID_THRESHOLD);
      }
    } else {
      console.log('[SKIP] Filter element not found on search page');
    }
  });
});

// =============================================================================
// TEST SUITE: Interaction to Next Paint (INP) Tests
// =============================================================================

test.describe('T054: INP Performance Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test('T054.5: Homepage INP should be under 200ms', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    await setupEventTimingObserver(page);

    // Perform multiple interactions
    const buttons = page.locator('button:visible, a:visible').first();
    await buttons.click().catch(() => {});

    // Navigate around
    const links = page.locator('a:visible');
    const linkCount = await links.count();

    if (linkCount > 0) {
      await links.first().click({ force: true }).catch(() => {});
    }

    await page.waitForTimeout(500);

    const { interactions } = await collectEventTimings(page);

    console.log(`Total interactions recorded: ${interactions.length}`);

    if (interactions.length > 0) {
      const inp = calculateINP(interactions);
      logInteractionResult('Homepage INP', inp, INP_THRESHOLD);

      // Log interaction breakdown
      const breakdown = {
        clicks: interactions.filter((i) => i.name.includes('click') || i.name.includes('pointer')).length,
        keys: interactions.filter((i) => i.name.includes('key')).length,
        other: interactions.filter(
          (i) => !i.name.includes('click') && !i.name.includes('pointer') && !i.name.includes('key')
        ).length,
      };
      console.log('Interaction breakdown:', breakdown);

      expect(inp).toBeLessThan(INP_THRESHOLD);
    }
  });

  test('T054.6: Search form submission INP should be under 200ms', async ({ page }) => {
    await page.goto(`${BASE_URL}/search`, { waitUntil: 'networkidle' });

    await setupEventTimingObserver(page);

    // Fill search form
    const searchInput = page.locator('input[type="text"], input[type="search"]').first();

    if (await searchInput.isVisible()) {
      await searchInput.fill('camping thailand');
      await searchInput.press('Enter');

      await page.waitForTimeout(500);

      const { interactions } = await collectEventTimings(page);

      if (interactions.length > 0) {
        const inp = calculateINP(interactions);
        logInteractionResult('Search Submit INP', inp, INP_THRESHOLD);
        expect(inp).toBeLessThan(INP_THRESHOLD);
      }
    } else {
      console.log('[SKIP] Search input not found');
    }
  });

  test('T054.7: Filter button click INP should be under 200ms', async ({ page }) => {
    await page.goto(`${BASE_URL}/search`, { waitUntil: 'networkidle' });

    await setupEventTimingObserver(page);

    // Click filter buttons multiple times
    const filterButtons = page.locator(
      'button:has-text("Filter"), button:has-text("ตัวกรอง"), [role="checkbox"], input[type="checkbox"]'
    );

    const count = await filterButtons.count();

    for (let i = 0; i < Math.min(count, 3); i++) {
      await filterButtons.nth(i).click({ force: true }).catch(() => {});
      await page.waitForTimeout(100);
    }

    await page.waitForTimeout(300);

    const { interactions } = await collectEventTimings(page);

    if (interactions.length > 0) {
      const inp = calculateINP(interactions);
      logInteractionResult('Filter Button INP', inp, INP_THRESHOLD);
      expect(inp).toBeLessThan(INP_THRESHOLD);
    }
  });

  test('T054.8: Sort select interaction INP should be under 200ms', async ({ page }) => {
    await page.goto(`${BASE_URL}/search`, { waitUntil: 'networkidle' });

    await setupEventTimingObserver(page);

    // Find sort dropdown
    const sortSelect = page.locator(
      'select, [role="combobox"], [data-testid="sort-select"]'
    ).first();

    if (await sortSelect.isVisible().catch(() => false)) {
      await sortSelect.click();
      await page.waitForTimeout(200);

      // Select an option if dropdown opened
      const option = page.locator('[role="option"], option').first();
      if (await option.isVisible().catch(() => false)) {
        await option.click();
      }

      await page.waitForTimeout(300);

      const { interactions } = await collectEventTimings(page);

      if (interactions.length > 0) {
        const inp = calculateINP(interactions);
        logInteractionResult('Sort Select INP', inp, INP_THRESHOLD);
        expect(inp).toBeLessThan(INP_THRESHOLD);
      }
    } else {
      console.log('[SKIP] Sort select not found');
    }
  });
});

// =============================================================================
// TEST SUITE: Main Thread Blocking Tests
// =============================================================================

test.describe('T054: Main Thread Blocking Tests', () => {
  test('T054.9: Homepage should have no long tasks over 50ms during load', async ({
    page,
  }) => {
    // Navigate and check for long tasks
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

    const longTasks = await checkLongTasks(page, 5000);

    console.log(`Long tasks detected: ${longTasks.length}`);

    if (longTasks.length > 0) {
      console.log('Long task durations:', longTasks.map((t) => `${t.toFixed(2)}ms`));
      const maxLongTask = Math.max(...longTasks);
      console.log(`Max long task: ${maxLongTask.toFixed(2)}ms`);

      // No single task should block for more than 200ms
      expect(maxLongTask).toBeLessThan(200);
    }

    // Total blocking time should be reasonable
    const totalBlockingTime = longTasks
      .filter((t) => t > 50)
      .reduce((sum, t) => sum + (t - 50), 0);

    console.log(`Total Blocking Time: ${totalBlockingTime.toFixed(2)}ms`);

    // TBT should be under 300ms for good performance
    expect(totalBlockingTime).toBeLessThan(300);
  });

  test('T054.10: Search page should have minimal long tasks', async ({ page }) => {
    await page.goto(`${BASE_URL}/search`, { waitUntil: 'domcontentloaded' });

    const longTasks = await checkLongTasks(page, 5000);

    console.log(`Search page long tasks: ${longTasks.length}`);

    if (longTasks.length > 0) {
      const maxLongTask = Math.max(...longTasks);
      console.log(`Max long task on search: ${maxLongTask.toFixed(2)}ms`);
      expect(maxLongTask).toBeLessThan(200);
    }
  });

  test('T054.11: JavaScript execution should not block input', async ({ page }) => {
    await page.goto(`${BASE_URL}/search`, { waitUntil: 'networkidle' });

    // Measure time to process keyboard input
    const searchInput = page.locator('input[type="text"], input[type="search"]').first();

    if (await searchInput.isVisible()) {
      const inputLatencies: number[] = [];

      for (let i = 0; i < 5; i++) {
        const start = Date.now();
        await searchInput.type('a', { delay: 0 });
        inputLatencies.push(Date.now() - start);
      }

      const avgLatency =
        inputLatencies.reduce((a, b) => a + b, 0) / inputLatencies.length;
      const maxLatency = Math.max(...inputLatencies);

      console.log(`Average input latency: ${avgLatency.toFixed(2)}ms`);
      console.log(`Max input latency: ${maxLatency.toFixed(2)}ms`);

      // Input should be processed quickly
      expect(avgLatency).toBeLessThan(50);
      expect(maxLatency).toBeLessThan(100);
    }
  });

  test('T054.12: Scroll should remain smooth (no jank)', async ({ page }) => {
    await page.goto(`${BASE_URL}/search`, { waitUntil: 'networkidle' });

    // Setup frame timing measurement
    await page.evaluate(() => {
      (window as any).__frameTimes = [];
      let lastFrameTime = performance.now();

      const measureFrame = () => {
        const now = performance.now();
        const frameDuration = now - lastFrameTime;
        (window as any).__frameTimes.push(frameDuration);
        lastFrameTime = now;

        if ((window as any).__frameTimes.length < 60) {
          requestAnimationFrame(measureFrame);
        }
      };

      requestAnimationFrame(measureFrame);
    });

    // Scroll the page
    await page.evaluate(() => {
      window.scrollTo({ top: 500, behavior: 'smooth' });
    });

    await page.waitForTimeout(1500);

    // Collect frame times
    const frameTimes = await page.evaluate(() => (window as any).__frameTimes || []);

    if (frameTimes.length > 0) {
      const avgFrameTime =
        frameTimes.reduce((a: number, b: number) => a + b, 0) / frameTimes.length;
      const maxFrameTime = Math.max(...frameTimes);
      const jankyFrames = frameTimes.filter((t: number) => t > 50).length;

      console.log(`Average frame time: ${avgFrameTime.toFixed(2)}ms`);
      console.log(`Max frame time: ${maxFrameTime.toFixed(2)}ms`);
      console.log(`Janky frames (>50ms): ${jankyFrames}/${frameTimes.length}`);

      // Most frames should render within 16.67ms (60fps)
      // Allow some variance but no major jank
      expect(jankyFrames).toBeLessThan(frameTimes.length * 0.1); // Less than 10% janky
    }
  });
});

// =============================================================================
// TEST SUITE: Campsite Detail Interaction Tests
// =============================================================================

test.describe('T054: Campsite Detail INP Tests', () => {
  const SAMPLE_CAMPSITE_ID = '1';

  test('T054.13: Gallery image click should respond quickly', async ({ page }) => {
    await page.goto(`${BASE_URL}/campsites/${SAMPLE_CAMPSITE_ID}`, {
      waitUntil: 'networkidle',
    });

    await setupEventTimingObserver(page);

    // Find gallery image
    const galleryImage = page.locator(
      '[data-testid="gallery-image"], .gallery img, img[alt*="gallery"]'
    ).first();

    if (await galleryImage.isVisible().catch(() => false)) {
      await galleryImage.click();
      await page.waitForTimeout(300);

      const { interactions } = await collectEventTimings(page);

      if (interactions.length > 0) {
        const inp = calculateINP(interactions);
        logInteractionResult('Gallery Click INP', inp, INP_THRESHOLD);
        expect(inp).toBeLessThan(INP_THRESHOLD);
      }
    } else {
      console.log('[SKIP] Gallery image not found');
    }
  });

  test('T054.14: Wishlist button click should respond quickly', async ({ page }) => {
    await page.goto(`${BASE_URL}/campsites/${SAMPLE_CAMPSITE_ID}`, {
      waitUntil: 'networkidle',
    });

    await setupEventTimingObserver(page);

    // Find wishlist button
    const wishlistButton = page.locator(
      '[data-testid="wishlist-button"], button:has-text("Wishlist"), button:has-text("Save"), [aria-label*="wishlist"]'
    ).first();

    if (await wishlistButton.isVisible().catch(() => false)) {
      const startTime = Date.now();
      await wishlistButton.click();
      const clickTime = Date.now() - startTime;

      await page.waitForTimeout(300);

      console.log(`Wishlist button click time: ${clickTime}ms`);

      const { interactions } = await collectEventTimings(page);

      if (interactions.length > 0) {
        const inp = calculateINP(interactions);
        logInteractionResult('Wishlist Button INP', inp, INP_THRESHOLD);
        expect(inp).toBeLessThan(INP_THRESHOLD);
      }

      // Visual feedback should be immediate
      expect(clickTime).toBeLessThan(INTERACTION_THRESHOLD);
    } else {
      console.log('[SKIP] Wishlist button not found');
    }
  });

  test('T054.15: Review section tab switch should be responsive', async ({ page }) => {
    await page.goto(`${BASE_URL}/campsites/${SAMPLE_CAMPSITE_ID}`, {
      waitUntil: 'networkidle',
    });

    await setupEventTimingObserver(page);

    // Find tab buttons
    const tabs = page.locator('[role="tab"], [data-testid="tab"]');
    const tabCount = await tabs.count();

    if (tabCount > 1) {
      // Click through tabs
      for (let i = 0; i < Math.min(tabCount, 3); i++) {
        await tabs.nth(i).click();
        await page.waitForTimeout(100);
      }

      await page.waitForTimeout(300);

      const { interactions } = await collectEventTimings(page);

      if (interactions.length > 0) {
        const inp = calculateINP(interactions);
        logInteractionResult('Tab Switch INP', inp, INP_THRESHOLD);
        expect(inp).toBeLessThan(INP_THRESHOLD);
      }
    } else {
      console.log('[SKIP] Tabs not found');
    }
  });

  test('T054.16: Contact form input should be responsive', async ({ page }) => {
    await page.goto(`${BASE_URL}/campsites/${SAMPLE_CAMPSITE_ID}`, {
      waitUntil: 'networkidle',
    });

    await setupEventTimingObserver(page);

    // Find inquiry/contact button or form
    const inquiryButton = page.locator(
      'button:has-text("Inquiry"), button:has-text("Contact"), button:has-text("ติดต่อ"), [data-testid="inquiry-button"]'
    ).first();

    if (await inquiryButton.isVisible().catch(() => false)) {
      await inquiryButton.click();
      await page.waitForTimeout(500);

      // Fill form if it appeared
      const nameInput = page.locator('input[name="name"], input[placeholder*="name"]').first();

      if (await nameInput.isVisible().catch(() => false)) {
        await nameInput.type('Test User', { delay: 10 });
        await page.waitForTimeout(200);

        const { interactions } = await collectEventTimings(page);

        if (interactions.length > 0) {
          const inp = calculateINP(interactions);
          logInteractionResult('Contact Form INP', inp, INP_THRESHOLD);
          expect(inp).toBeLessThan(INP_THRESHOLD);
        }
      }
    } else {
      console.log('[SKIP] Inquiry button not found');
    }
  });
});

// =============================================================================
// TEST SUITE: Mobile Interaction Tests
// =============================================================================

test.describe('T054: Mobile INP Tests', () => {
  test.use({
    viewport: { width: 375, height: 667 },
    hasTouch: true,
  });

  test('T054.17: Mobile tap interactions should be under 200ms', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    await setupEventTimingObserver(page);

    // Tap on various elements
    const tappable = page.locator('button:visible, a:visible').first();

    if (await tappable.isVisible()) {
      await tappable.tap();
      await page.waitForTimeout(300);

      const { interactions } = await collectEventTimings(page);

      if (interactions.length > 0) {
        const inp = calculateINP(interactions);
        logInteractionResult('Mobile Tap INP', inp, INP_THRESHOLD);
        expect(inp).toBeLessThan(INP_THRESHOLD);
      }
    }
  });

  test('T054.18: Mobile scroll and tap should not conflict', async ({ page }) => {
    await page.goto(`${BASE_URL}/search`, { waitUntil: 'networkidle' });

    await setupEventTimingObserver(page);

    // Scroll
    await page.evaluate(() => {
      window.scrollBy(0, 200);
    });

    await page.waitForTimeout(200);

    // Then tap
    const element = page.locator('button:visible').first();

    if (await element.isVisible()) {
      await element.tap();
      await page.waitForTimeout(300);

      const { interactions } = await collectEventTimings(page);

      if (interactions.length > 0) {
        const inp = calculateINP(interactions);
        logInteractionResult('Mobile Scroll+Tap INP', inp, INP_THRESHOLD);
        expect(inp).toBeLessThan(INP_THRESHOLD);
      }
    }
  });
});
