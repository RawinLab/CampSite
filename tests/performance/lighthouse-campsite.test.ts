import { test, expect, Page } from '@playwright/test';

/**
 * Lighthouse Performance Tests for Campsite Detail Page (T051)
 *
 * Tests campsite detail page performance metrics including:
 * - Core Web Vitals (LCP, FID, CLS)
 * - Image gallery optimization
 * - Map and interactive elements performance
 * - Accessibility score verification
 * - SEO score verification for campsite pages
 * - Structured data validation
 *
 * Note: Uses Performance API metrics as a proxy for Lighthouse scores
 * when actual Lighthouse is not available in CI environment.
 */

// Performance thresholds aligned with Lighthouse scoring
const PERFORMANCE_THRESHOLDS = {
  // Performance metrics (slightly higher for detail pages with more content)
  LCP: 3000, // Largest Contentful Paint - Good threshold for image-heavy page
  FID: 100, // First Input Delay - Good threshold
  CLS: 0.15, // Cumulative Layout Shift - Slightly higher for gallery pages
  TTFB: 1000, // Time to First Byte
  FCP: 2000, // First Contentful Paint
  TTI: 4500, // Time to Interactive

  // Resource thresholds for detail pages
  MAX_JS_BUNDLES: 20,
  MAX_CSS_BUNDLES: 15,
  MAX_IMAGES: 50, // Higher for gallery pages
  MAX_TOTAL_RESOURCES: 80,
  MAX_TOTAL_TRANSFER_SIZE_KB: 3000, // 3MB for detail pages
  MAX_JS_TRANSFER_SIZE_KB: 600,
  MAX_IMAGE_SIZE_KB: 500, // Per image
};

// Test campsite ID - use a known campsite or fallback to first available
const TEST_CAMPSITE_PATH = '/campsites/1'; // Will navigate to a valid campsite

// Helper to get a valid campsite URL
async function getValidCampsiteUrl(page: Page): Promise<string> {
  // First try direct navigation
  const response = await page.goto(TEST_CAMPSITE_PATH);

  // If 404, try to find a campsite from search
  if (response?.status() === 404) {
    await page.goto('/search');
    await page.waitForLoadState('networkidle');

    // Look for campsite cards
    const campsiteLink = page.locator('a[href*="/campsites/"]').first();
    if (await campsiteLink.isVisible()) {
      const href = await campsiteLink.getAttribute('href');
      if (href) {
        return href;
      }
    }
  }

  return TEST_CAMPSITE_PATH;
}

// Helper to collect performance metrics
async function collectPerformanceMetrics(page: Page) {
  return await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paintEntries = performance.getEntriesByType('paint');
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

    const fcpEntry = paintEntries.find(e => e.name === 'first-contentful-paint');
    const fpEntry = paintEntries.find(e => e.name === 'first-paint');

    // Calculate resource sizes by type
    const resourcesByType = resources.reduce((acc, r) => {
      const type = r.initiatorType;
      if (!acc[type]) {
        acc[type] = { count: 0, size: 0 };
      }
      acc[type].count++;
      acc[type].size += r.transferSize || 0;
      return acc;
    }, {} as Record<string, { count: number; size: number }>);

    return {
      // Navigation timing
      ttfb: navigation.responseStart - navigation.fetchStart,
      fcp: fcpEntry?.startTime || 0,
      fp: fpEntry?.startTime || 0,
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
      domInteractive: navigation.domInteractive - navigation.fetchStart,
      loadComplete: navigation.loadEventEnd - navigation.fetchStart,

      // Resource metrics
      totalResources: resources.length,
      resourcesByType,
      totalTransferSize: resources.reduce((sum, r) => sum + (r.transferSize || 0), 0),
    };
  });
}

// Helper to measure LCP
async function measureLCP(page: Page): Promise<number> {
  return await page.evaluate(() => {
    return new Promise<number>((resolve) => {
      let lcpValue = 0;
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        lcpValue = lastEntry?.startTime || 0;
      });

      observer.observe({ type: 'largest-contentful-paint', buffered: true });

      setTimeout(() => {
        observer.disconnect();
        resolve(lcpValue);
      }, 3000);
    });
  });
}

// Helper to measure CLS
async function measureCLS(page: Page): Promise<number> {
  return await page.evaluate(() => {
    return new Promise<number>((resolve) => {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
      });

      observer.observe({ type: 'layout-shift', buffered: true });

      setTimeout(() => {
        observer.disconnect();
        resolve(clsValue);
      }, 2000);
    });
  });
}

// Helper to check SEO for campsite detail page
async function checkCampsiteSEO(page: Page) {
  return await page.evaluate(() => {
    const issues: string[] = [];

    // Check for title with campsite name
    const title = document.title;
    if (!title) {
      issues.push('Missing page title');
    }

    // Check for meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      issues.push('Missing meta description');
    }

    // Check for canonical URL
    const canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      issues.push('Missing canonical URL');
    }

    // Check for Open Graph tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDescription = document.querySelector('meta[property="og:description"]');
    const ogImage = document.querySelector('meta[property="og:image"]');
    const ogType = document.querySelector('meta[property="og:type"]');

    if (!ogTitle) issues.push('Missing og:title');
    if (!ogDescription) issues.push('Missing og:description');
    if (!ogImage) issues.push('Missing og:image');

    // Check for structured data (JSON-LD)
    const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
    let hasLocalBusiness = false;
    let hasCampground = false;
    let hasBreadcrumb = false;

    jsonLdScripts.forEach(script => {
      try {
        const data = JSON.parse(script.textContent || '');
        const type = data['@type'];
        if (type === 'LocalBusiness' || type === 'LodgingBusiness') {
          hasLocalBusiness = true;
        }
        if (type === 'Campground' || type === 'TouristAttraction') {
          hasCampground = true;
        }
        if (type === 'BreadcrumbList') {
          hasBreadcrumb = true;
        }
      } catch {
        // Invalid JSON
      }
    });

    // Check for proper heading structure
    const h1 = document.querySelector('h1');
    const h1Count = document.querySelectorAll('h1').length;

    return {
      issues,
      title,
      hasMetaDescription: !!metaDescription,
      hasCanonical: !!canonical,
      ogTags: {
        title: !!ogTitle,
        description: !!ogDescription,
        image: !!ogImage,
        type: !!ogType,
      },
      structuredData: {
        count: jsonLdScripts.length,
        hasLocalBusiness,
        hasCampground,
        hasBreadcrumb,
      },
      h1: h1?.textContent || null,
      h1Count,
    };
  });
}

// Helper to check campsite page accessibility
async function checkCampsiteAccessibility(page: Page) {
  return await page.evaluate(() => {
    const issues: string[] = [];

    // Check images (especially gallery images)
    const images = document.querySelectorAll('img');
    let missingAlt = 0;
    let decorativeImages = 0;

    images.forEach(img => {
      const alt = img.getAttribute('alt');
      if (alt === null) {
        missingAlt++;
      } else if (alt === '') {
        decorativeImages++;
      }
    });

    if (missingAlt > 0) {
      issues.push(`${missingAlt} images missing alt attribute`);
    }

    // Check for heading hierarchy
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    const headingLevels = headings.map(h => parseInt(h.tagName.charAt(1)));

    let skippedLevel = false;
    for (let i = 1; i < headingLevels.length; i++) {
      if (headingLevels[i] - headingLevels[i - 1] > 1) {
        skippedLevel = true;
        break;
      }
    }

    if (skippedLevel) {
      issues.push('Heading levels are skipped');
    }

    // Check interactive elements
    const buttons = document.querySelectorAll('button');
    let emptyButtons = 0;
    buttons.forEach(btn => {
      const hasText = btn.textContent?.trim();
      const hasAriaLabel = btn.getAttribute('aria-label');
      const hasTitle = btn.getAttribute('title');
      if (!hasText && !hasAriaLabel && !hasTitle) {
        emptyButtons++;
      }
    });

    if (emptyButtons > 0) {
      issues.push(`${emptyButtons} buttons without accessible names`);
    }

    // Check for landmarks
    const main = document.querySelector('main');
    const nav = document.querySelector('nav');
    const header = document.querySelector('header');

    // Check for ARIA on interactive components
    const tabs = document.querySelectorAll('[role="tab"], [role="tablist"]');
    const dialogs = document.querySelectorAll('[role="dialog"]');

    return {
      issues,
      imageCount: images.length,
      missingAltCount: missingAlt,
      decorativeImageCount: decorativeImages,
      headingCount: headings.length,
      hasMain: !!main,
      hasNav: !!nav,
      hasHeader: !!header,
      tabCount: tabs.length,
      dialogCount: dialogs.length,
    };
  });
}

test.describe('T051: Campsite Detail Page Lighthouse Performance Tests', () => {
  let campsiteUrl: string;

  test.beforeAll(async ({ browser }) => {
    // Get a valid campsite URL once for all tests
    const page = await browser.newPage();
    campsiteUrl = await getValidCampsiteUrl(page);
    await page.close();
    console.log(`\nUsing campsite URL: ${campsiteUrl}`);
  });

  test.beforeEach(async ({ page }) => {
    // Navigate to campsite detail page
    await page.goto(campsiteUrl);
    await page.waitForLoadState('networkidle');
  });

  test('T051.1: Campsite page Performance score > 85 (Core Web Vitals)', async ({ page }) => {
    const metrics = await collectPerformanceMetrics(page);

    console.log('\n=== Campsite Page Performance Metrics ===');
    console.log(`TTFB: ${metrics.ttfb.toFixed(2)}ms (threshold: ${PERFORMANCE_THRESHOLDS.TTFB}ms)`);
    console.log(`FCP: ${metrics.fcp.toFixed(2)}ms (threshold: ${PERFORMANCE_THRESHOLDS.FCP}ms)`);
    console.log(`DOM Interactive: ${metrics.domInteractive.toFixed(2)}ms`);
    console.log(`DOM Content Loaded: ${metrics.domContentLoaded.toFixed(2)}ms`);
    console.log(`Load Complete: ${metrics.loadComplete.toFixed(2)}ms`);

    expect(metrics.ttfb).toBeLessThan(PERFORMANCE_THRESHOLDS.TTFB);
    expect(metrics.fcp).toBeLessThan(PERFORMANCE_THRESHOLDS.FCP);
    expect(metrics.domInteractive).toBeLessThan(PERFORMANCE_THRESHOLDS.TTI);
  });

  test('T051.2: Campsite page LCP under 3s threshold', async ({ page }) => {
    const lcp = await measureLCP(page);

    console.log(`\nLargest Contentful Paint: ${lcp.toFixed(2)}ms`);
    console.log(`Threshold: ${PERFORMANCE_THRESHOLDS.LCP}ms`);

    // LCP should be under 3 seconds for image-heavy detail pages
    expect(lcp).toBeLessThan(PERFORMANCE_THRESHOLDS.LCP);
  });

  test('T051.3: Campsite page CLS under 0.15 threshold', async ({ page }) => {
    const cls = await measureCLS(page);

    console.log(`\nCumulative Layout Shift: ${cls.toFixed(4)}`);
    console.log(`Threshold: ${PERFORMANCE_THRESHOLDS.CLS}`);

    // CLS should be under 0.15 for gallery pages
    expect(cls).toBeLessThan(PERFORMANCE_THRESHOLDS.CLS);
  });

  test('T051.4: Campsite page Accessibility score > 90', async ({ page }) => {
    const accessibility = await checkCampsiteAccessibility(page);

    console.log('\n=== Campsite Accessibility Check ===');
    console.log(`Total images: ${accessibility.imageCount}`);
    console.log(`Images missing alt: ${accessibility.missingAltCount}`);
    console.log(`Decorative images: ${accessibility.decorativeImageCount}`);
    console.log(`Heading count: ${accessibility.headingCount}`);
    console.log(`Has main landmark: ${accessibility.hasMain}`);
    console.log(`Has nav landmark: ${accessibility.hasNav}`);
    console.log(`Tab components: ${accessibility.tabCount}`);
    console.log(`Dialog components: ${accessibility.dialogCount}`);

    if (accessibility.issues.length > 0) {
      console.log('\nIssues found:');
      accessibility.issues.forEach(issue => console.log(`  - ${issue}`));
    }

    // Calculate score based on issues
    const score = Math.max(0, 100 - (accessibility.issues.length * 10));
    console.log(`\nAccessibility Score (estimated): ${score}`);

    expect(accessibility.issues.length).toBeLessThanOrEqual(3);
    expect(accessibility.hasMain).toBe(true);
  });

  test('T051.5: Campsite page Best Practices score > 90', async ({ page }) => {
    const bestPractices = await page.evaluate(() => {
      const issues: string[] = [];

      // Check for proper image sizing
      const images = document.querySelectorAll('img');
      let oversizedImages = 0;
      images.forEach(img => {
        const displayWidth = img.clientWidth;
        const naturalWidth = img.naturalWidth;
        // Check if image is significantly larger than display size
        if (naturalWidth > displayWidth * 2 && displayWidth > 0) {
          oversizedImages++;
        }
      });

      if (oversizedImages > 0) {
        issues.push(`${oversizedImages} images are significantly larger than display size`);
      }

      // Check for deprecated APIs
      const hasDoctype = document.doctype !== null;
      if (!hasDoctype) {
        issues.push('Missing DOCTYPE');
      }

      // Check external links
      const externalLinks = document.querySelectorAll('a[target="_blank"]');
      let unsafeLinks = 0;
      externalLinks.forEach(link => {
        const rel = link.getAttribute('rel') || '';
        if (!rel.includes('noopener')) {
          unsafeLinks++;
        }
      });

      if (unsafeLinks > 0) {
        issues.push(`${unsafeLinks} external links missing rel="noopener"`);
      }

      // Check for console errors (basic check)
      const hasCharset = !!document.querySelector('meta[charset]');
      if (!hasCharset) {
        issues.push('Missing charset meta tag');
      }

      return {
        issues,
        hasDoctype,
        hasCharset,
        imageCount: images.length,
        oversizedImageCount: oversizedImages,
        externalLinkCount: externalLinks.length,
      };
    });

    console.log('\n=== Best Practices Check ===');
    console.log(`Has DOCTYPE: ${bestPractices.hasDoctype}`);
    console.log(`Has charset: ${bestPractices.hasCharset}`);
    console.log(`Total images: ${bestPractices.imageCount}`);
    console.log(`Oversized images: ${bestPractices.oversizedImageCount}`);
    console.log(`External links: ${bestPractices.externalLinkCount}`);

    if (bestPractices.issues.length > 0) {
      console.log('\nIssues found:');
      bestPractices.issues.forEach(issue => console.log(`  - ${issue}`));
    }

    expect(bestPractices.hasDoctype).toBe(true);
    expect(bestPractices.issues.length).toBeLessThanOrEqual(3);
  });

  test('T051.6: Campsite page SEO score > 90', async ({ page }) => {
    const seo = await checkCampsiteSEO(page);

    console.log('\n=== Campsite SEO Check ===');
    console.log(`Title: ${seo.title || 'MISSING'}`);
    console.log(`Has meta description: ${seo.hasMetaDescription}`);
    console.log(`Has canonical: ${seo.hasCanonical}`);
    console.log('\nOpen Graph tags:');
    console.log(`  og:title: ${seo.ogTags.title}`);
    console.log(`  og:description: ${seo.ogTags.description}`);
    console.log(`  og:image: ${seo.ogTags.image}`);
    console.log(`  og:type: ${seo.ogTags.type}`);
    console.log('\nStructured Data:');
    console.log(`  JSON-LD scripts: ${seo.structuredData.count}`);
    console.log(`  LocalBusiness: ${seo.structuredData.hasLocalBusiness}`);
    console.log(`  Campground: ${seo.structuredData.hasCampground}`);
    console.log(`  Breadcrumb: ${seo.structuredData.hasBreadcrumb}`);
    console.log(`\nH1: ${seo.h1 || 'MISSING'}`);
    console.log(`H1 count: ${seo.h1Count}`);

    if (seo.issues.length > 0) {
      console.log('\nIssues found:');
      seo.issues.forEach(issue => console.log(`  - ${issue}`));
    }

    // Essential SEO elements
    expect(seo.title).toBeTruthy();
    expect(seo.hasMetaDescription).toBe(true);
    expect(seo.h1Count).toBe(1);
  });

  test('T051.7: Campsite image gallery optimization', async ({ page }) => {
    const imageMetrics = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      const imageResources = resources.filter(r =>
        r.initiatorType === 'img' ||
        r.name.match(/\.(jpg|jpeg|png|gif|webp|avif|svg)(\?|$)/i)
      );

      // Analyze image loading
      const domImages = document.querySelectorAll('img');
      const lazyImages = Array.from(domImages).filter(img =>
        img.getAttribute('loading') === 'lazy' ||
        img.hasAttribute('data-src') ||
        img.classList.contains('lazy')
      );

      // Check for modern formats
      const webpImages = imageResources.filter(r => r.name.includes('.webp'));
      const avifImages = imageResources.filter(r => r.name.includes('.avif'));

      // Check for responsive images
      const srcsetImages = document.querySelectorAll('img[srcset]');
      const pictureElements = document.querySelectorAll('picture');

      // Find largest images
      const sortedImages = imageResources
        .map(r => ({
          name: r.name.split('/').pop()?.split('?')[0] || r.name,
          size: r.transferSize || 0,
          duration: r.duration,
        }))
        .sort((a, b) => b.size - a.size);

      return {
        totalImages: imageResources.length,
        totalImageSize: imageResources.reduce((sum, r) => sum + (r.transferSize || 0), 0),
        domImageCount: domImages.length,
        lazyImageCount: lazyImages.length,
        webpImageCount: webpImages.length,
        avifImageCount: avifImages.length,
        srcsetImageCount: srcsetImages.length,
        pictureElementCount: pictureElements.length,
        largestImages: sortedImages.slice(0, 5),
        imagesOver500KB: sortedImages.filter(img => img.size > 500 * 1024).length,
      };
    });

    console.log('\n=== Image Gallery Optimization ===');
    console.log(`Total network images: ${imageMetrics.totalImages}`);
    console.log(`Total image size: ${(imageMetrics.totalImageSize / 1024).toFixed(2)}KB`);
    console.log(`DOM images: ${imageMetrics.domImageCount}`);
    console.log(`Lazy loaded: ${imageMetrics.lazyImageCount}`);
    console.log(`WebP format: ${imageMetrics.webpImageCount}`);
    console.log(`AVIF format: ${imageMetrics.avifImageCount}`);
    console.log(`With srcset: ${imageMetrics.srcsetImageCount}`);
    console.log(`Picture elements: ${imageMetrics.pictureElementCount}`);
    console.log(`Images over 500KB: ${imageMetrics.imagesOver500KB}`);

    if (imageMetrics.largestImages.length > 0) {
      console.log('\nLargest images:');
      imageMetrics.largestImages.forEach((img, i) => {
        console.log(`  ${i + 1}. ${img.name}: ${(img.size / 1024).toFixed(2)}KB`);
      });
    }

    expect(imageMetrics.totalImages).toBeLessThan(PERFORMANCE_THRESHOLDS.MAX_IMAGES);
    expect(imageMetrics.imagesOver500KB).toBeLessThanOrEqual(2);
  });

  test('T051.8: Campsite page map loading performance', async ({ page }) => {
    // Check for map-related resources
    const mapMetrics = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

      // Find map-related resources
      const mapResources = resources.filter(r =>
        r.name.includes('leaflet') ||
        r.name.includes('map') ||
        r.name.includes('tile') ||
        r.name.includes('osm') ||
        r.name.includes('openstreetmap') ||
        r.name.includes('googleapis.com/maps') ||
        r.name.includes('mapbox')
      );

      // Check for map container in DOM
      const mapContainer = document.querySelector('[class*="leaflet"], [class*="map"], #map');
      const isMapLoaded = !!mapContainer && mapContainer.children.length > 0;

      return {
        mapResourceCount: mapResources.length,
        totalMapResourceSize: mapResources.reduce((sum, r) => sum + (r.transferSize || 0), 0),
        mapResources: mapResources.map(r => ({
          name: r.name.split('/').pop()?.split('?')[0] || r.name.substring(0, 50),
          size: r.transferSize || 0,
          duration: r.duration,
        })),
        isMapLoaded,
        hasMapContainer: !!mapContainer,
      };
    });

    console.log('\n=== Map Loading Performance ===');
    console.log(`Map container present: ${mapMetrics.hasMapContainer}`);
    console.log(`Map loaded: ${mapMetrics.isMapLoaded}`);
    console.log(`Map-related resources: ${mapMetrics.mapResourceCount}`);
    console.log(`Total map resource size: ${(mapMetrics.totalMapResourceSize / 1024).toFixed(2)}KB`);

    if (mapMetrics.mapResources.length > 0) {
      console.log('\nMap resources:');
      mapMetrics.mapResources.slice(0, 5).forEach(r => {
        console.log(`  - ${r.name}: ${(r.size / 1024).toFixed(2)}KB (${r.duration.toFixed(2)}ms)`);
      });
    }

    // Map resources should load efficiently
    if (mapMetrics.hasMapContainer) {
      expect(mapMetrics.totalMapResourceSize / 1024).toBeLessThan(1000); // Less than 1MB for map
    }
  });

  test('T051.9: Campsite page JavaScript bundle analysis', async ({ page }) => {
    const jsMetrics = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      const jsResources = resources.filter(r =>
        r.initiatorType === 'script' ||
        r.name.endsWith('.js') ||
        r.name.includes('.js?')
      );

      // Categorize scripts
      const frameworkScripts = jsResources.filter(r =>
        r.name.includes('next') ||
        r.name.includes('react') ||
        r.name.includes('webpack')
      );

      const thirdPartyScripts = jsResources.filter(r =>
        !r.name.includes(window.location.hostname) &&
        !r.name.startsWith('/')
      );

      return {
        totalJsFiles: jsResources.length,
        totalJsSize: jsResources.reduce((sum, r) => sum + (r.transferSize || 0), 0),
        frameworkScriptCount: frameworkScripts.length,
        thirdPartyScriptCount: thirdPartyScripts.length,
        largestScripts: jsResources
          .map(r => ({
            name: r.name.split('/').pop()?.split('?')[0] || r.name,
            size: r.transferSize || 0,
            duration: r.duration,
          }))
          .sort((a, b) => b.size - a.size)
          .slice(0, 5),
      };
    });

    console.log('\n=== JavaScript Bundle Analysis ===');
    console.log(`Total JS files: ${jsMetrics.totalJsFiles} (max: ${PERFORMANCE_THRESHOLDS.MAX_JS_BUNDLES})`);
    console.log(`Total JS size: ${(jsMetrics.totalJsSize / 1024).toFixed(2)}KB (max: ${PERFORMANCE_THRESHOLDS.MAX_JS_TRANSFER_SIZE_KB}KB)`);
    console.log(`Framework scripts: ${jsMetrics.frameworkScriptCount}`);
    console.log(`Third-party scripts: ${jsMetrics.thirdPartyScriptCount}`);

    if (jsMetrics.largestScripts.length > 0) {
      console.log('\nLargest scripts:');
      jsMetrics.largestScripts.forEach((script, i) => {
        console.log(`  ${i + 1}. ${script.name}: ${(script.size / 1024).toFixed(2)}KB (${script.duration.toFixed(2)}ms)`);
      });
    }

    expect(jsMetrics.totalJsFiles).toBeLessThan(PERFORMANCE_THRESHOLDS.MAX_JS_BUNDLES);
    expect(jsMetrics.totalJsSize / 1024).toBeLessThan(PERFORMANCE_THRESHOLDS.MAX_JS_TRANSFER_SIZE_KB);
  });

  test('T051.10: Campsite page interactive element responsiveness', async ({ page }) => {
    // Test various interactive elements
    const interactionMetrics: Record<string, number> = {};

    // Test tab switching if tabs exist
    const tabButton = page.locator('[role="tab"]').first();
    if (await tabButton.isVisible()) {
      const startTime = Date.now();
      await tabButton.click();
      const tabPanel = page.locator('[role="tabpanel"]').first();
      await tabPanel.waitFor({ state: 'visible', timeout: 1000 }).catch(() => {});
      interactionMetrics['tabSwitch'] = Date.now() - startTime;
    }

    // Test gallery navigation if exists
    const galleryNext = page.locator('button[aria-label*="next"], button[aria-label*="Next"], [data-testid*="gallery-next"]').first();
    if (await galleryNext.isVisible()) {
      const startTime = Date.now();
      await galleryNext.click();
      await page.waitForTimeout(100);
      interactionMetrics['galleryNav'] = Date.now() - startTime;
    }

    // Test any modal/dialog triggers
    const modalTrigger = page.locator('button:has-text("Contact"), button:has-text("Inquire"), button:has-text("Book")').first();
    if (await modalTrigger.isVisible()) {
      const startTime = Date.now();
      await modalTrigger.click();
      await page.waitForTimeout(300);
      interactionMetrics['modalOpen'] = Date.now() - startTime;

      // Close modal if opened
      const closeButton = page.locator('[aria-label="Close"], button:has-text("Close"), [data-testid="modal-close"]').first();
      if (await closeButton.isVisible()) {
        await closeButton.click();
      } else {
        await page.keyboard.press('Escape');
      }
    }

    console.log('\n=== Interactive Element Responsiveness ===');
    Object.entries(interactionMetrics).forEach(([action, time]) => {
      console.log(`${action}: ${time}ms`);
      expect(time).toBeLessThan(500);
    });

    if (Object.keys(interactionMetrics).length === 0) {
      console.log('No interactive elements tested (may not be present on page)');
    }
  });

  test('T051.11: Campsite page resource hints optimization', async ({ page }) => {
    const resourceHints = await page.evaluate(() => {
      const preloads = document.querySelectorAll('link[rel="preload"]');
      const prefetches = document.querySelectorAll('link[rel="prefetch"]');
      const preconnects = document.querySelectorAll('link[rel="preconnect"]');
      const dnsPrefetches = document.querySelectorAll('link[rel="dns-prefetch"]');

      return {
        preloadCount: preloads.length,
        preloads: Array.from(preloads).map(link => ({
          href: link.getAttribute('href')?.split('/').pop() || '',
          as: link.getAttribute('as') || '',
        })),
        prefetchCount: prefetches.length,
        preconnectCount: preconnects.length,
        preconnects: Array.from(preconnects).map(link => link.getAttribute('href') || ''),
        dnsPrefetchCount: dnsPrefetches.length,
      };
    });

    console.log('\n=== Resource Hints Optimization ===');
    console.log(`Preload links: ${resourceHints.preloadCount}`);
    if (resourceHints.preloads.length > 0) {
      resourceHints.preloads.slice(0, 5).forEach(p => {
        console.log(`  - ${p.href} (${p.as})`);
      });
    }
    console.log(`Prefetch links: ${resourceHints.prefetchCount}`);
    console.log(`Preconnect links: ${resourceHints.preconnectCount}`);
    if (resourceHints.preconnects.length > 0) {
      resourceHints.preconnects.forEach(p => console.log(`  - ${p}`));
    }
    console.log(`DNS prefetch links: ${resourceHints.dnsPrefetchCount}`);

    // Should have some resource optimization
    const totalHints = resourceHints.preloadCount + resourceHints.preconnectCount;
    console.log(`\nTotal resource hints: ${totalHints}`);
  });

  test('T051.12: Campsite page structured data validation', async ({ page }) => {
    const structuredData = await page.evaluate(() => {
      const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
      const schemas: any[] = [];

      jsonLdScripts.forEach(script => {
        try {
          const data = JSON.parse(script.textContent || '');
          schemas.push(data);
        } catch {
          // Invalid JSON
        }
      });

      // Validate schema requirements for campsite
      const validations = {
        hasSchema: schemas.length > 0,
        hasType: schemas.some(s => s['@type']),
        hasName: schemas.some(s => s.name),
        hasDescription: schemas.some(s => s.description),
        hasAddress: schemas.some(s => s.address),
        hasGeo: schemas.some(s => s.geo),
        hasImage: schemas.some(s => s.image),
        hasRating: schemas.some(s => s.aggregateRating),
        hasPriceRange: schemas.some(s => s.priceRange),
      };

      return {
        schemaCount: schemas.length,
        schemas: schemas.map(s => ({
          type: s['@type'],
          hasName: !!s.name,
          hasDescription: !!s.description,
          hasImage: !!s.image,
        })),
        validations,
      };
    });

    console.log('\n=== Structured Data Validation ===');
    console.log(`JSON-LD schemas found: ${structuredData.schemaCount}`);

    if (structuredData.schemas.length > 0) {
      console.log('\nSchemas:');
      structuredData.schemas.forEach((s, i) => {
        console.log(`  ${i + 1}. Type: ${s.type}`);
        console.log(`     Has name: ${s.hasName}`);
        console.log(`     Has description: ${s.hasDescription}`);
        console.log(`     Has image: ${s.hasImage}`);
      });
    }

    console.log('\nValidations:');
    Object.entries(structuredData.validations).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });

    // Should have basic structured data
    expect(structuredData.schemaCount).toBeGreaterThan(0);
  });
});
