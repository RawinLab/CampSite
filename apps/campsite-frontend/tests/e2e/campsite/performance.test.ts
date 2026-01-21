import { test, expect } from '@playwright/test';

// Use a valid test campsite slug
const TEST_CAMPSITE_SLUG = 'test-campsite-details-b7a9886a';

test.describe('Campsite Page Performance', () => {
  test.beforeEach(async ({ page }) => {
    // Enable performance metrics collection
    await page.goto(`/campsites/${TEST_CAMPSITE_SLUG}`, { waitUntil: 'domcontentloaded' });
  });

  test('page load time is under 1.5 seconds', async ({ page }) => {
    const startTime = Date.now();

    // Navigate to campsite detail page
    await page.goto(`/campsites/${TEST_CAMPSITE_SLUG}`);
    await page.waitForLoadState('load');

    const endTime = Date.now();
    const loadTime = endTime - startTime;

    // Verify page load time is under 1.5 seconds (1500ms)
    expect(loadTime).toBeLessThan(1500);

    // Also check navigation timing API for more accurate measurement
    const navigationTiming = await page.evaluate(() => {
      const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: perfData.domContentLoadedEventEnd - perfData.fetchStart,
        loadComplete: perfData.loadEventEnd - perfData.fetchStart,
        domInteractive: perfData.domInteractive - perfData.fetchStart,
        firstPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-contentful-paint')?.startTime || 0,
      };
    });

    // Log performance metrics for visibility
    console.log('Performance Metrics:', navigationTiming);

    // Verify key metrics
    expect(navigationTiming.loadComplete).toBeLessThan(1500);
    expect(navigationTiming.domInteractive).toBeLessThan(1000);
  });

  test('no console errors during page load', async ({ page }) => {
    const consoleErrors: string[] = [];
    const consoleWarnings: string[] = [];

    // Capture console errors and warnings
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(msg.text());
      }
    });

    // Capture page errors
    const pageErrors: string[] = [];
    page.on('pageerror', error => {
      pageErrors.push(error.message);
    });

    // Navigate and wait for network idle
    await page.goto('/campsites/${TEST_CAMPSITE_SLUG}');
    await page.waitForLoadState('networkidle');

    // Verify no console errors occurred
    expect(consoleErrors, `Console errors detected: ${consoleErrors.join(', ')}`).toHaveLength(0);

    // Verify no page errors occurred
    expect(pageErrors, `Page errors detected: ${pageErrors.join(', ')}`).toHaveLength(0);

    // Log warnings for informational purposes (not failing the test)
    if (consoleWarnings.length > 0) {
      console.log('Console warnings:', consoleWarnings);
    }
  });

  test('all API calls complete successfully', async ({ page }) => {
    const apiCalls: { url: string; status: number; method: string }[] = [];
    const failedCalls: { url: string; status: number; method: string }[] = [];

    // Monitor network requests
    page.on('response', response => {
      const url = response.url();

      // Track API calls (assuming backend is on localhost:4000 or contains /api/)
      if (url.includes('/api/') || url.includes('localhost:4000')) {
        const callInfo = {
          url,
          status: response.status(),
          method: response.request().method(),
        };

        apiCalls.push(callInfo);

        // Track failed calls (4xx, 5xx)
        if (response.status() >= 400) {
          failedCalls.push(callInfo);
        }
      }
    });

    // Navigate and wait for network idle
    await page.goto('/campsites/${TEST_CAMPSITE_SLUG}');
    await page.waitForLoadState('networkidle');

    // Log all API calls for visibility
    console.log('API Calls Made:', apiCalls.length);
    console.log('API Call Details:', apiCalls);

    // Verify API calls were made
    expect(apiCalls.length, 'No API calls detected').toBeGreaterThan(0);

    // Verify no failed API calls
    expect(failedCalls, `Failed API calls detected: ${JSON.stringify(failedCalls)}`).toHaveLength(0);

    // Verify all API calls completed within reasonable time
    const apiResponseTimes = await page.evaluate(() => {
      return performance.getEntriesByType('resource')
        .filter((resource: any) =>
          resource.name.includes('/api/') || resource.name.includes('localhost:4000')
        )
        .map((resource: any) => ({
          url: resource.name,
          duration: resource.duration,
        }));
    });

    console.log('API Response Times:', apiResponseTimes);

    // Ensure each API call completed in under 2 seconds
    apiResponseTimes.forEach((call: any) => {
      expect(call.duration, `API call ${call.url} took too long`).toBeLessThan(2000);
    });
  });

  test('images load with correct transforms', async ({ page }) => {
    const imageLoads: { src: string; naturalWidth: number; naturalHeight: number; complete: boolean }[] = [];
    const failedImages: string[] = [];

    // Navigate to page
    await page.goto('/campsites/${TEST_CAMPSITE_SLUG}');
    await page.waitForLoadState('networkidle');

    // Wait for images to load
    await page.waitForTimeout(1000);

    // Check all images on the page
    const images = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return imgs.map(img => ({
        src: img.src,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        complete: img.complete,
        displayWidth: img.width,
        displayHeight: img.height,
      }));
    });

    console.log('Images Found:', images.length);
    console.log('Image Details:', images);

    // Verify images were found
    expect(images.length, 'No images found on page').toBeGreaterThan(0);

    // Check each image
    images.forEach(img => {
      if (!img.complete || img.naturalWidth === 0) {
        failedImages.push(img.src);
      } else {
        imageLoads.push(img);
      }
    });

    // Verify no failed images
    expect(failedImages, `Failed to load images: ${failedImages.join(', ')}`).toHaveLength(0);

    // Verify images have proper dimensions (not broken)
    imageLoads.forEach(img => {
      expect(img.naturalWidth, `Image ${img.src} has no width`).toBeGreaterThan(0);
      expect(img.naturalHeight, `Image ${img.src} has no height`).toBeGreaterThan(0);
    });

    // Check for Supabase image transforms in URLs
    const transformedImages = images.filter(img =>
      img.src.includes('supabase') && (
        img.src.includes('width=') ||
        img.src.includes('height=') ||
        img.src.includes('resize=') ||
        img.src.includes('quality=')
      )
    );

    console.log('Transformed Images:', transformedImages.length);

    // Verify at least some images use Supabase transforms
    if (images.some(img => img.src.includes('supabase'))) {
      expect(transformedImages.length, 'No image transforms detected on Supabase images').toBeGreaterThan(0);
    }
  });

  test('lighthouse performance considerations', async ({ page }) => {
    // Navigate to page
    await page.goto('/campsites/${TEST_CAMPSITE_SLUG}');
    await page.waitForLoadState('networkidle');

    // Check Largest Contentful Paint (LCP)
    const lcp = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          resolve(lastEntry.renderTime || lastEntry.loadTime);
        }).observe({ type: 'largest-contentful-paint', buffered: true });

        // Fallback timeout
        setTimeout(() => resolve(0), 5000);
      });
    });

    console.log('Largest Contentful Paint (LCP):', lcp);

    // LCP should be under 2.5 seconds for good score
    if (lcp > 0) {
      expect(lcp, 'LCP is too slow (should be under 2500ms)').toBeLessThan(2500);
    }

    // Check Cumulative Layout Shift (CLS)
    const cls = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let clsValue = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
        }).observe({ type: 'layout-shift', buffered: true });

        setTimeout(() => resolve(clsValue), 3000);
      });
    });

    console.log('Cumulative Layout Shift (CLS):', cls);

    // CLS should be under 0.1 for good score
    expect(cls, 'CLS is too high (should be under 0.1)').toBeLessThan(0.1);

    // Check First Input Delay proxy (using interaction timing)
    const interactionReady = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        const startTime = performance.now();

        // Check if page is interactive
        if (document.readyState === 'complete') {
          resolve(performance.now() - startTime);
        } else {
          window.addEventListener('load', () => {
            resolve(performance.now() - startTime);
          });
        }

        setTimeout(() => resolve(performance.now() - startTime), 5000);
      });
    });

    console.log('Time to Interactive:', interactionReady);

    // Check resource sizes and counts
    const resourceStats = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

      let totalSize = 0;
      const resourceTypes: Record<string, number> = {};

      resources.forEach(resource => {
        // Estimate size based on transfer size
        if ('transferSize' in resource) {
          totalSize += resource.transferSize || 0;
        }

        // Categorize by type
        const type = resource.initiatorType || 'other';
        resourceTypes[type] = (resourceTypes[type] || 0) + 1;
      });

      return {
        totalResources: resources.length,
        totalSize,
        resourceTypes,
      };
    });

    console.log('Resource Stats:', resourceStats);

    // Verify reasonable resource counts (not loading too many resources)
    expect(resourceStats.totalResources, 'Too many resources loaded').toBeLessThan(100);

    // Check for render-blocking resources
    const renderBlockingResources = await page.evaluate(() => {
      return performance.getEntriesByType('resource')
        .filter((resource: any) =>
          (resource.initiatorType === 'link' || resource.initiatorType === 'script') &&
          resource.renderBlockingStatus === 'blocking'
        )
        .map((resource: any) => ({
          name: resource.name,
          duration: resource.duration,
        }));
    });

    console.log('Render-blocking Resources:', renderBlockingResources.length);
    console.log('Render-blocking Details:', renderBlockingResources);

    // Recommend having minimal render-blocking resources
    expect(renderBlockingResources.length, 'Too many render-blocking resources').toBeLessThan(10);
  });

  test('performance metrics remain consistent on subsequent visits', async ({ page }) => {
    // First visit
    const firstVisit = Date.now();
    await page.goto('/campsites/${TEST_CAMPSITE_SLUG}');
    await page.waitForLoadState('load');
    const firstLoadTime = Date.now() - firstVisit;

    const firstMetrics = await page.evaluate(() => {
      const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        loadComplete: perfData.loadEventEnd - perfData.fetchStart,
        domInteractive: perfData.domInteractive - perfData.fetchStart,
      };
    });

    console.log('First Visit Metrics:', firstMetrics);

    // Navigate away
    await page.goto('/');
    await page.waitForLoadState('load');

    // Second visit (should be faster with cache)
    const secondVisit = Date.now();
    await page.goto('/campsites/${TEST_CAMPSITE_SLUG}');
    await page.waitForLoadState('load');
    const secondLoadTime = Date.now() - secondVisit;

    const secondMetrics = await page.evaluate(() => {
      const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        loadComplete: perfData.loadEventEnd - perfData.fetchStart,
        domInteractive: perfData.domInteractive - perfData.fetchStart,
      };
    });

    console.log('Second Visit Metrics:', secondMetrics);
    console.log('First Load Time:', firstLoadTime, 'ms');
    console.log('Second Load Time:', secondLoadTime, 'ms');

    // Verify both visits meet performance criteria
    expect(firstMetrics.loadComplete).toBeLessThan(1500);
    expect(secondMetrics.loadComplete).toBeLessThan(1500);

    // Second visit should ideally be faster or similar (within 200ms variance)
    // This accounts for cache but network variability
    expect(secondLoadTime).toBeLessThan(firstLoadTime + 200);
  });
});
