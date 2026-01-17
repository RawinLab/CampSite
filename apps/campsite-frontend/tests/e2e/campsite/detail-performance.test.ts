import { test, expect, type Page } from '@playwright/test';

/**
 * E2E Performance Tests for Campsite Detail Page
 *
 * Tests performance metrics including:
 * - Page load time under 1.5s on 4G
 * - First Contentful Paint (FCP) under 1s
 * - Cumulative Layout Shift (CLS) < 0.1
 * - Image lazy loading
 * - Skeleton loading state
 */

test.describe('Campsite Detail Page Performance', () => {
  const CAMPSITE_DETAIL_URL = '/campsites/test-campsite-slug';
  const PERFORMANCE_THRESHOLDS = {
    pageLoadTime: 1500, // ms
    firstContentfulPaint: 1000, // ms
    cumulativeLayoutShift: 0.1,
  };

  test.beforeEach(async ({ page }) => {
    // Enable performance metrics collection
    await page.coverage.startJSCoverage();
  });

  test.afterEach(async ({ page }) => {
    await page.coverage.stopJSCoverage();
  });

  test('should load page within 1.5 seconds on 4G', async ({ page, context }) => {
    // Simulate 4G network conditions
    await context.route('**/*', (route) => {
      route.continue();
    });

    await page.emulateMedia({ reducedMotion: 'reduce' });

    // Simulate 4G network speed
    const client = await context.newCDPSession(page);
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: (4 * 1024 * 1024) / 8, // 4 Mbps in bytes/sec
      uploadThroughput: (3 * 1024 * 1024) / 8, // 3 Mbps in bytes/sec
      latency: 20, // 20ms RTT
    });

    const startTime = Date.now();

    await page.goto(CAMPSITE_DETAIL_URL, { waitUntil: 'load' });

    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.pageLoadTime);
  });

  test('should have First Contentful Paint under 1 second', async ({ page }) => {
    await page.goto(CAMPSITE_DETAIL_URL, { waitUntil: 'domcontentloaded' });

    const performanceMetrics = await page.evaluate(() => {
      return new Promise<{
        fcp: number;
        lcp: number;
        ttfb: number;
      }>((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const paintEntries = entries.filter(
            (entry) => entry.entryType === 'paint'
          );

          const fcpEntry = paintEntries.find(
            (entry) => entry.name === 'first-contentful-paint'
          );

          const navigationEntry = performance.getEntriesByType(
            'navigation'
          )[0] as PerformanceNavigationTiming;

          if (fcpEntry) {
            observer.disconnect();
            resolve({
              fcp: fcpEntry.startTime,
              lcp: 0, // Will be measured separately
              ttfb: navigationEntry ? navigationEntry.responseStart : 0,
            });
          }
        });

        observer.observe({ entryTypes: ['paint', 'navigation'] });

        // Timeout fallback
        setTimeout(() => {
          observer.disconnect();
          resolve({ fcp: 0, lcp: 0, ttfb: 0 });
        }, 5000);
      });
    });

    expect(performanceMetrics.fcp).toBeGreaterThan(0);
    expect(performanceMetrics.fcp).toBeLessThan(PERFORMANCE_THRESHOLDS.firstContentfulPaint);
  });

  test('should have Cumulative Layout Shift less than 0.1', async ({ page }) => {
    await page.goto(CAMPSITE_DETAIL_URL, { waitUntil: 'networkidle' });

    // Wait for all images and content to load
    await page.waitForTimeout(2000);

    const cls = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let clsValue = 0;

        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
        });

        observer.observe({ entryTypes: ['layout-shift'] });

        // Measure CLS for 3 seconds
        setTimeout(() => {
          observer.disconnect();
          resolve(clsValue);
        }, 3000);
      });
    });

    expect(cls).toBeLessThan(PERFORMANCE_THRESHOLDS.cumulativeLayoutShift);
  });

  test('should lazy load all images', async ({ page }) => {
    await page.goto(CAMPSITE_DETAIL_URL, { waitUntil: 'domcontentloaded' });

    // Get all images on the page
    const images = await page.locator('img').all();

    expect(images.length).toBeGreaterThan(0);

    // Check that images have loading="lazy" attribute or are using Intersection Observer
    for (const img of images) {
      const loadingAttr = await img.getAttribute('loading');
      const dataSrc = await img.getAttribute('data-src');
      const src = await img.getAttribute('src');

      // Images should either have loading="lazy" or use data-src pattern (Intersection Observer)
      const isLazyLoaded =
        loadingAttr === 'lazy' ||
        (dataSrc !== null && dataSrc !== '') ||
        src?.includes('placeholder') ||
        src?.includes('blur');

      // Exception: Above-the-fold hero image can be eagerly loaded
      const isHeroImage = await img.evaluate((el) => {
        const rect = el.getBoundingClientRect();
        return rect.top < window.innerHeight && rect.top >= 0;
      });

      if (!isHeroImage) {
        expect(isLazyLoaded).toBeTruthy();
      }
    }
  });

  test('should display skeleton loading during fetch', async ({ page }) => {
    // Intercept API call to delay response
    await page.route('**/api/campsites/**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      route.continue();
    });

    const skeletonVisible = page.locator('[data-testid="skeleton-loader"], .skeleton, [class*="skeleton"]').first();

    const navigationPromise = page.goto(CAMPSITE_DETAIL_URL, { waitUntil: 'domcontentloaded' });

    // Skeleton should be visible during loading
    await expect(skeletonVisible).toBeVisible({ timeout: 1000 });

    await navigationPromise;

    // Skeleton should disappear after content loads
    await expect(skeletonVisible).not.toBeVisible({ timeout: 3000 });
  });

  test('should measure Core Web Vitals', async ({ page }) => {
    await page.goto(CAMPSITE_DETAIL_URL, { waitUntil: 'load' });

    const webVitals = await page.evaluate(() => {
      return new Promise<{
        lcp: number;
        fid: number;
        cls: number;
        fcp: number;
        ttfb: number;
      }>((resolve) => {
        const vitals = {
          lcp: 0,
          fid: 0,
          cls: 0,
          fcp: 0,
          ttfb: 0,
        };

        // Largest Contentful Paint
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          vitals.lcp = lastEntry.renderTime || lastEntry.loadTime;
        }).observe({ entryTypes: ['largest-contentful-paint'] });

        // Cumulative Layout Shift
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              vitals.cls += (entry as any).value;
            }
          }
        }).observe({ entryTypes: ['layout-shift'] });

        // First Contentful Paint
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const fcpEntry = entries.find((entry) => entry.name === 'first-contentful-paint');
          if (fcpEntry) {
            vitals.fcp = fcpEntry.startTime;
          }
        }).observe({ entryTypes: ['paint'] });

        // First Input Delay (requires user interaction)
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          if (entries.length > 0) {
            vitals.fid = (entries[0] as any).processingStart - entries[0].startTime;
          }
        }).observe({ entryTypes: ['first-input'] });

        // Time to First Byte
        const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigationEntry) {
          vitals.ttfb = navigationEntry.responseStart;
        }

        setTimeout(() => {
          resolve(vitals);
        }, 3000);
      });
    });

    // Validate Core Web Vitals against thresholds
    expect(webVitals.lcp).toBeLessThan(2500); // Good LCP < 2.5s
    expect(webVitals.cls).toBeLessThan(0.1); // Good CLS < 0.1
    expect(webVitals.fcp).toBeLessThan(1000); // Good FCP < 1s
    expect(webVitals.ttfb).toBeLessThan(600); // Good TTFB < 600ms
  });

  test('should not block rendering with large JavaScript bundles', async ({ page }) => {
    const client = await page.context().newCDPSession(page);

    await client.send('Performance.enable');

    await page.goto(CAMPSITE_DETAIL_URL, { waitUntil: 'domcontentloaded' });

    const metrics = await client.send('Performance.getMetrics');

    const jsHeapUsed = metrics.metrics.find((m) => m.name === 'JSHeapUsedSize')?.value || 0;
    const jsHeapTotal = metrics.metrics.find((m) => m.name === 'JSHeapTotalSize')?.value || 0;

    // JavaScript heap should not exceed 50MB for initial page load
    expect(jsHeapUsed).toBeLessThan(50 * 1024 * 1024);
    expect(jsHeapTotal).toBeLessThan(100 * 1024 * 1024);
  });

  test('should efficiently handle images with proper formats and sizes', async ({ page }) => {
    await page.goto(CAMPSITE_DETAIL_URL, { waitUntil: 'load' });

    const imageMetrics = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'));

      return images.map((img) => ({
        src: img.src,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        displayWidth: img.width,
        displayHeight: img.height,
        hasWebp: img.src.includes('.webp') || img.srcset.includes('.webp'),
        hasSrcset: img.srcset.length > 0,
      }));
    });

    for (const image of imageMetrics) {
      // Images should not be oversized (rendered size vs natural size)
      if (image.displayWidth > 0 && image.naturalWidth > 0) {
        const sizeRatio = image.naturalWidth / image.displayWidth;
        // Allow up to 2x for retina displays
        expect(sizeRatio).toBeLessThan(3);
      }

      // Modern format support (WebP) or responsive images
      const hasModernOptimization = image.hasWebp || image.hasSrcset;
      expect(hasModernOptimization).toBeTruthy();
    }
  });

  test('should prefetch critical resources', async ({ page }) => {
    await page.goto(CAMPSITE_DETAIL_URL, { waitUntil: 'domcontentloaded' });

    const linkTags = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('link'));

      return links.map((link) => ({
        rel: link.rel,
        href: link.href,
        as: link.getAttribute('as'),
      }));
    });

    // Check for preload/prefetch hints
    const hasPreload = linkTags.some((link) => link.rel === 'preload');
    const hasPrefetch = linkTags.some((link) => link.rel === 'prefetch');

    expect(hasPreload || hasPrefetch).toBeTruthy();
  });

  test('should have acceptable Time to Interactive', async ({ page }) => {
    const startTime = Date.now();

    await page.goto(CAMPSITE_DETAIL_URL, { waitUntil: 'networkidle' });

    // Ensure page is interactive by checking if buttons are clickable
    const button = page.locator('button').first();
    await expect(button).toBeEnabled({ timeout: 3000 });

    const tti = Date.now() - startTime;

    // Time to Interactive should be under 3.8 seconds (good TTI threshold)
    expect(tti).toBeLessThan(3800);
  });
});
