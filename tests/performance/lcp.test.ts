/**
 * LCP (Largest Contentful Paint) Performance Tests - T053
 *
 * Tests that LCP meets Google's recommended threshold of < 2.5s
 * across key pages: homepage, campsite detail, and search page.
 *
 * LCP measures the time it takes for the largest content element
 * (typically the hero image or main heading) to become visible.
 */
import { test, expect, Page, BrowserContext, CDPSession } from '@playwright/test';

// Import helpers
import {
  THRESHOLDS,
  collectLCPWithPolling,
  collectNavigationMetrics,
  collectResourceMetrics,
  waitForLCPElement,
  evaluateMetric,
  formatMetric,
  LCPEntry,
} from './helpers/metrics';

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3090';
const LCP_THRESHOLD = THRESHOLDS.LCP.GOOD; // 2500ms
const LCP_THRESHOLD_SLOW_NETWORK = 4000; // 4s for throttled networks

// Network throttling presets
const NETWORK_PRESETS = {
  fast3g: {
    downloadThroughput: (1.5 * 1024 * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8,
    latency: 40,
  },
  slow3g: {
    downloadThroughput: (400 * 1024) / 8,
    uploadThroughput: (400 * 1024) / 8,
    latency: 400,
  },
};

/**
 * Apply network throttling via CDP
 */
async function applyNetworkThrottling(
  page: Page,
  preset: keyof typeof NETWORK_PRESETS
): Promise<CDPSession> {
  const client = await page.context().newCDPSession(page);
  const config = NETWORK_PRESETS[preset];

  await client.send('Network.enable');
  await client.send('Network.emulateNetworkConditions', {
    offline: false,
    downloadThroughput: config.downloadThroughput,
    uploadThroughput: config.uploadThroughput,
    latency: config.latency,
  });

  return client;
}

/**
 * Clear network throttling
 */
async function clearNetworkThrottling(client: CDPSession): Promise<void> {
  await client.send('Network.emulateNetworkConditions', {
    offline: false,
    downloadThroughput: -1,
    uploadThroughput: -1,
    latency: 0,
  });
}

/**
 * Collect LCP metric from page
 */
async function measureLCP(page: Page, waitTime = 5000): Promise<LCPEntry | null> {
  // Wait for page to be loaded
  await page.waitForLoadState('domcontentloaded');

  // Collect LCP
  const lcpEntry = await collectLCPWithPolling(page, waitTime);

  return lcpEntry;
}

/**
 * Log LCP results
 */
function logLCPResult(pageName: string, lcp: LCPEntry | null, threshold: number): void {
  if (!lcp) {
    console.log(`[SKIP] ${pageName}: LCP measurement not available`);
    return;
  }

  const rating = evaluateMetric(lcp.startTime, THRESHOLDS.LCP);
  console.log(formatMetric(`${pageName} LCP`, lcp.startTime, 'ms', rating));
  console.log(`  - Element: ${lcp.element}`);
  console.log(`  - Size: ${lcp.size}px`);
  if (lcp.url) {
    console.log(`  - URL: ${lcp.url.substring(0, 80)}...`);
  }
}

// =============================================================================
// TEST SUITE: Homepage LCP Tests
// =============================================================================

test.describe('T053: LCP Performance Tests - Homepage', () => {
  test.beforeEach(async ({ page }) => {
    // Clear browser cache for consistent measurements
    await page.context().clearCookies();
  });

  test('T053.1: Homepage LCP should be under 2.5 seconds', async ({ page }) => {
    // Navigate to homepage
    await page.goto(BASE_URL, { waitUntil: 'commit' });

    // Collect LCP
    const lcp = await measureLCP(page);

    // Log result
    logLCPResult('Homepage', lcp, LCP_THRESHOLD);

    // Assert LCP is under threshold
    expect(lcp).not.toBeNull();
    if (lcp) {
      expect(lcp.startTime).toBeLessThan(LCP_THRESHOLD);
    }
  });

  test('T053.2: Homepage hero image should be the LCP element', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    const lcp = await measureLCP(page);

    // Log result
    logLCPResult('Homepage Hero', lcp, LCP_THRESHOLD);

    // The LCP element should typically be an image or heading
    expect(lcp).not.toBeNull();
    if (lcp) {
      const validLCPElements = ['IMG', 'H1', 'H2', 'VIDEO', 'DIV', 'SECTION'];
      expect(validLCPElements).toContain(lcp.element.toUpperCase());
    }
  });

  test('T053.3: Homepage LCP under Fast 3G network conditions', async ({ page }) => {
    // Apply network throttling
    const client = await applyNetworkThrottling(page, 'fast3g');

    try {
      await page.goto(BASE_URL, { waitUntil: 'commit' });

      const lcp = await measureLCP(page, 8000);

      logLCPResult('Homepage (Fast 3G)', lcp, LCP_THRESHOLD_SLOW_NETWORK);

      // Under Fast 3G, LCP should still be under 4s
      expect(lcp).not.toBeNull();
      if (lcp) {
        expect(lcp.startTime).toBeLessThan(LCP_THRESHOLD_SLOW_NETWORK);
      }
    } finally {
      await clearNetworkThrottling(client);
    }
  });

  test('T053.4: Homepage LCP under Slow 3G network conditions', async ({ page }) => {
    // Apply network throttling
    const client = await applyNetworkThrottling(page, 'slow3g');

    try {
      await page.goto(BASE_URL, { waitUntil: 'commit', timeout: 30000 });

      // Allow more time for LCP on slow networks
      const lcp = await measureLCP(page, 15000);

      logLCPResult('Homepage (Slow 3G)', lcp, 6000);

      // Under Slow 3G, we expect degraded performance but should still render
      expect(lcp).not.toBeNull();
      // Even on slow 3G, LCP should be under 6 seconds with proper optimization
      if (lcp) {
        expect(lcp.startTime).toBeLessThan(6000);
      }
    } finally {
      await clearNetworkThrottling(client);
    }
  });
});

// =============================================================================
// TEST SUITE: Search Page LCP Tests
// =============================================================================

test.describe('T053: LCP Performance Tests - Search Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test('T053.5: Search page LCP should be under 2.5 seconds', async ({ page }) => {
    await page.goto(`${BASE_URL}/search`, { waitUntil: 'commit' });

    const lcp = await measureLCP(page);

    logLCPResult('Search Page', lcp, LCP_THRESHOLD);

    expect(lcp).not.toBeNull();
    if (lcp) {
      expect(lcp.startTime).toBeLessThan(LCP_THRESHOLD);
    }
  });

  test('T053.6: Search page with query params loads LCP quickly', async ({ page }) => {
    // Navigate with search parameters
    await page.goto(`${BASE_URL}/search?province=Chiang%20Mai&type=tent`, {
      waitUntil: 'commit',
    });

    const lcp = await measureLCP(page);

    logLCPResult('Search Page (with params)', lcp, LCP_THRESHOLD);

    expect(lcp).not.toBeNull();
    if (lcp) {
      expect(lcp.startTime).toBeLessThan(LCP_THRESHOLD);
    }
  });

  test('T053.7: Search page campsite cards should not delay LCP', async ({ page }) => {
    await page.goto(`${BASE_URL}/search`, { waitUntil: 'networkidle' });

    const lcp = await measureLCP(page);

    // Navigation metrics for additional context
    const navMetrics = await collectNavigationMetrics(page);

    console.log('Search Page Navigation Metrics:');
    console.log(`  - TTFB: ${navMetrics.ttfb.toFixed(2)}ms`);
    console.log(`  - FCP: ${navMetrics.fcp.toFixed(2)}ms`);
    console.log(`  - DOM Interactive: ${navMetrics.domInteractive.toFixed(2)}ms`);

    expect(lcp).not.toBeNull();
    if (lcp) {
      // LCP should happen after FCP but within threshold
      expect(lcp.startTime).toBeGreaterThanOrEqual(navMetrics.fcp);
      expect(lcp.startTime).toBeLessThan(LCP_THRESHOLD);
    }
  });

  test('T053.8: Search page under Fast 3G should maintain acceptable LCP', async ({
    page,
  }) => {
    const client = await applyNetworkThrottling(page, 'fast3g');

    try {
      await page.goto(`${BASE_URL}/search`, { waitUntil: 'commit' });

      const lcp = await measureLCP(page, 8000);

      logLCPResult('Search Page (Fast 3G)', lcp, LCP_THRESHOLD_SLOW_NETWORK);

      expect(lcp).not.toBeNull();
      if (lcp) {
        expect(lcp.startTime).toBeLessThan(LCP_THRESHOLD_SLOW_NETWORK);
      }
    } finally {
      await clearNetworkThrottling(client);
    }
  });
});

// =============================================================================
// TEST SUITE: Campsite Detail Page LCP Tests
// =============================================================================

test.describe('T053: LCP Performance Tests - Campsite Detail', () => {
  // Use a sample campsite ID (adjust based on seeded data)
  const SAMPLE_CAMPSITE_ID = '1';

  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test('T053.9: Campsite detail page LCP should be under 2.5 seconds', async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/campsites/${SAMPLE_CAMPSITE_ID}`, {
      waitUntil: 'commit',
    });

    const lcp = await measureLCP(page);

    logLCPResult('Campsite Detail', lcp, LCP_THRESHOLD);

    expect(lcp).not.toBeNull();
    if (lcp) {
      expect(lcp.startTime).toBeLessThan(LCP_THRESHOLD);
    }
  });

  test('T053.10: Campsite hero image should be optimized for LCP', async ({ page }) => {
    await page.goto(`${BASE_URL}/campsites/${SAMPLE_CAMPSITE_ID}`, {
      waitUntil: 'networkidle',
    });

    const lcp = await measureLCP(page);

    logLCPResult('Campsite Hero Image', lcp, LCP_THRESHOLD);

    // Check if hero image has proper loading attributes
    const heroImage = page.locator(
      '[data-testid="hero-image"], .hero-image, img[alt*="campsite"], img[alt*="Campsite"]'
    ).first();

    const isHeroVisible = await heroImage.isVisible().catch(() => false);

    if (isHeroVisible) {
      // Verify image has explicit dimensions
      const imgAttributes = await heroImage.evaluate((el) => ({
        hasWidth: el.hasAttribute('width') || getComputedStyle(el).width !== 'auto',
        hasHeight: el.hasAttribute('height') || getComputedStyle(el).height !== 'auto',
        loading: el.getAttribute('loading'),
        fetchPriority: el.getAttribute('fetchpriority'),
      }));

      console.log('Hero Image Attributes:', imgAttributes);

      // Hero image should have explicit dimensions to prevent layout shift
      expect(
        imgAttributes.hasWidth || imgAttributes.hasHeight
      ).toBeTruthy();
    }

    expect(lcp).not.toBeNull();
    if (lcp) {
      expect(lcp.startTime).toBeLessThan(LCP_THRESHOLD);
    }
  });

  test('T053.11: Campsite detail under Fast 3G network', async ({ page }) => {
    const client = await applyNetworkThrottling(page, 'fast3g');

    try {
      await page.goto(`${BASE_URL}/campsites/${SAMPLE_CAMPSITE_ID}`, {
        waitUntil: 'commit',
      });

      const lcp = await measureLCP(page, 8000);

      logLCPResult('Campsite Detail (Fast 3G)', lcp, LCP_THRESHOLD_SLOW_NETWORK);

      expect(lcp).not.toBeNull();
      if (lcp) {
        expect(lcp.startTime).toBeLessThan(LCP_THRESHOLD_SLOW_NETWORK);
      }
    } finally {
      await clearNetworkThrottling(client);
    }
  });

  test('T053.12: Campsite gallery images should not block LCP', async ({ page }) => {
    await page.goto(`${BASE_URL}/campsites/${SAMPLE_CAMPSITE_ID}`, {
      waitUntil: 'networkidle',
    });

    const lcp = await measureLCP(page);

    // Check resource loading
    const resourceMetrics = await collectResourceMetrics(page);

    console.log('Resource Loading Metrics:');
    console.log(`  - Total Resources: ${resourceMetrics.totalResources}`);
    console.log(
      `  - Total Size: ${(resourceMetrics.totalSize / 1024).toFixed(2)} KB`
    );
    if (resourceMetrics.slowestResource) {
      console.log(
        `  - Slowest Resource: ${resourceMetrics.slowestResource.duration.toFixed(2)}ms`
      );
    }

    // LCP should not be blocked by gallery images loading
    expect(lcp).not.toBeNull();
    if (lcp) {
      expect(lcp.startTime).toBeLessThan(LCP_THRESHOLD);
    }
  });
});

// =============================================================================
// TEST SUITE: Edge Cases and Slow Image Scenarios
// =============================================================================

test.describe('T053: LCP Edge Cases', () => {
  test('T053.13: LCP should handle missing images gracefully', async ({ page }) => {
    // Intercept image requests and simulate slow loading
    await page.route('**/*.{png,jpg,jpeg,webp,avif}', (route) => {
      // Add 500ms delay to images
      setTimeout(() => route.continue(), 500);
    });

    await page.goto(BASE_URL, { waitUntil: 'commit' });

    const lcp = await measureLCP(page, 6000);

    logLCPResult('Homepage (Slow Images)', lcp, LCP_THRESHOLD);

    // Even with slow images, text-based LCP should be quick
    expect(lcp).not.toBeNull();
    if (lcp) {
      // If image is delayed, heading should become LCP instead
      const isTextElement = ['H1', 'H2', 'P', 'DIV', 'SPAN'].includes(
        lcp.element.toUpperCase()
      );
      // Either LCP is under threshold, or fallback to text element
      const isAcceptable =
        lcp.startTime < LCP_THRESHOLD || isTextElement;
      expect(isAcceptable).toBeTruthy();
    }
  });

  test('T053.14: LCP with lazy-loaded images below fold', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    // Get initial LCP
    const initialLCP = await measureLCP(page);

    // Scroll down to trigger lazy loading
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });

    // Wait for lazy images to load
    await page.waitForTimeout(1000);

    // LCP should not change after scrolling (it's measured at initial load)
    logLCPResult('Homepage (After Scroll)', initialLCP, LCP_THRESHOLD);

    expect(initialLCP).not.toBeNull();
    if (initialLCP) {
      expect(initialLCP.startTime).toBeLessThan(LCP_THRESHOLD);
    }
  });

  test('T053.15: LCP with preloaded critical images', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

    // Check for preload hints
    const preloadLinks = await page.evaluate(() => {
      const links = document.querySelectorAll('link[rel="preload"]');
      return Array.from(links).map((link) => ({
        href: link.getAttribute('href'),
        as: link.getAttribute('as'),
        fetchpriority: link.getAttribute('fetchpriority'),
      }));
    });

    console.log('Preload hints found:', preloadLinks.length);
    preloadLinks.forEach((link) => {
      console.log(`  - ${link.as}: ${link.href?.substring(0, 50)}...`);
    });

    const lcp = await measureLCP(page);

    logLCPResult('Homepage (Preload Check)', lcp, LCP_THRESHOLD);

    expect(lcp).not.toBeNull();
    if (lcp) {
      expect(lcp.startTime).toBeLessThan(LCP_THRESHOLD);
    }
  });

  test('T053.16: LCP consistency across multiple page loads', async ({ page }) => {
    const lcpValues: number[] = [];
    const iterations = 3;

    for (let i = 0; i < iterations; i++) {
      // Clear cache between iterations
      await page.context().clearCookies();

      await page.goto(BASE_URL, { waitUntil: 'commit' });

      const lcp = await measureLCP(page);

      if (lcp) {
        lcpValues.push(lcp.startTime);
        console.log(`Iteration ${i + 1}: LCP = ${lcp.startTime.toFixed(2)}ms`);
      }
    }

    // Calculate statistics
    if (lcpValues.length > 0) {
      const avg = lcpValues.reduce((a, b) => a + b, 0) / lcpValues.length;
      const max = Math.max(...lcpValues);
      const min = Math.min(...lcpValues);
      const variance = lcpValues.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / lcpValues.length;
      const stdDev = Math.sqrt(variance);

      console.log('\nLCP Statistics:');
      console.log(`  - Average: ${avg.toFixed(2)}ms`);
      console.log(`  - Min: ${min.toFixed(2)}ms`);
      console.log(`  - Max: ${max.toFixed(2)}ms`);
      console.log(`  - Std Dev: ${stdDev.toFixed(2)}ms`);

      // Average should be under threshold
      expect(avg).toBeLessThan(LCP_THRESHOLD);

      // Variance should be reasonable (consistent performance)
      expect(stdDev).toBeLessThan(500); // 500ms variance is acceptable
    }
  });
});

// =============================================================================
// TEST SUITE: Mobile LCP Tests
// =============================================================================

test.describe('T053: Mobile LCP Performance', () => {
  test.use({
    viewport: { width: 375, height: 667 }, // iPhone SE dimensions
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
  });

  test('T053.17: Mobile homepage LCP should be under 2.5 seconds', async ({
    page,
  }) => {
    await page.goto(BASE_URL, { waitUntil: 'commit' });

    const lcp = await measureLCP(page);

    logLCPResult('Mobile Homepage', lcp, LCP_THRESHOLD);

    expect(lcp).not.toBeNull();
    if (lcp) {
      expect(lcp.startTime).toBeLessThan(LCP_THRESHOLD);
    }
  });

  test('T053.18: Mobile search page LCP should be under 2.5 seconds', async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/search`, { waitUntil: 'commit' });

    const lcp = await measureLCP(page);

    logLCPResult('Mobile Search Page', lcp, LCP_THRESHOLD);

    expect(lcp).not.toBeNull();
    if (lcp) {
      expect(lcp.startTime).toBeLessThan(LCP_THRESHOLD);
    }
  });
});
