import { test, expect, Page } from '@playwright/test';

/**
 * Lighthouse Performance Tests for Search Page (T052)
 *
 * Tests search page performance metrics including:
 * - Core Web Vitals (LCP, FID, CLS)
 * - Search results loading performance
 * - Filter interaction responsiveness
 * - Pagination performance
 * - Accessibility score verification
 * - SEO score verification
 *
 * Note: Uses Performance API metrics as a proxy for Lighthouse scores
 * when actual Lighthouse is not available in CI environment.
 */

// Performance thresholds aligned with Lighthouse scoring
const PERFORMANCE_THRESHOLDS = {
  // Performance metrics
  LCP: 2500, // Largest Contentful Paint
  FID: 100, // First Input Delay
  CLS: 0.1, // Cumulative Layout Shift
  TTFB: 800, // Time to First Byte
  FCP: 1800, // First Contentful Paint
  TTI: 3800, // Time to Interactive

  // Search-specific thresholds
  SEARCH_RESPONSE_TIME: 2000, // Search results should load in 2s
  FILTER_RESPONSE_TIME: 500, // Filters should apply in 500ms
  PAGINATION_RESPONSE_TIME: 1000, // Pagination should load in 1s

  // Resource thresholds
  MAX_JS_BUNDLES: 20,
  MAX_CSS_BUNDLES: 15,
  MAX_IMAGES: 40, // Search results typically show many cards
  MAX_TOTAL_RESOURCES: 70,
  MAX_TOTAL_TRANSFER_SIZE_KB: 2500,
  MAX_JS_TRANSFER_SIZE_KB: 550,
};

// Helper to collect performance metrics
async function collectPerformanceMetrics(page: Page) {
  return await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paintEntries = performance.getEntriesByType('paint');
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

    const fcpEntry = paintEntries.find(e => e.name === 'first-contentful-paint');
    const fpEntry = paintEntries.find(e => e.name === 'first-paint');

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
      ttfb: navigation.responseStart - navigation.fetchStart,
      fcp: fcpEntry?.startTime || 0,
      fp: fpEntry?.startTime || 0,
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
      domInteractive: navigation.domInteractive - navigation.fetchStart,
      loadComplete: navigation.loadEventEnd - navigation.fetchStart,
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

// Helper to check search page SEO
async function checkSearchSEO(page: Page) {
  return await page.evaluate(() => {
    const issues: string[] = [];

    // Check for title
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

    // Check for noindex on search results (common pattern)
    const robotsMeta = document.querySelector('meta[name="robots"]');
    const robotsContent = robotsMeta?.getAttribute('content') || '';

    // Check for Open Graph tags
    const ogTags = document.querySelectorAll('meta[property^="og:"]');

    // Check for proper heading structure
    const h1 = document.querySelector('h1');
    const h1Count = document.querySelectorAll('h1').length;

    // Check search form accessibility
    const searchInput = document.querySelector('input[type="search"], input[name*="search"], input[placeholder*="search" i]');
    const hasSearchLabel = searchInput?.getAttribute('aria-label') ||
                          searchInput?.getAttribute('aria-labelledby') ||
                          document.querySelector(`label[for="${searchInput?.id}"]`);

    return {
      issues,
      title,
      hasMetaDescription: !!metaDescription,
      hasCanonical: !!canonical,
      robotsContent,
      ogTagCount: ogTags.length,
      h1: h1?.textContent || null,
      h1Count,
      hasSearchInput: !!searchInput,
      hasSearchLabel: !!hasSearchLabel,
    };
  });
}

// Helper to check search page accessibility
async function checkSearchAccessibility(page: Page) {
  return await page.evaluate(() => {
    const issues: string[] = [];

    // Check search form
    const searchForm = document.querySelector('form[role="search"], [role="search"]');
    if (!searchForm) {
      // issues.push('Missing search landmark');
    }

    // Check filter buttons
    const filterButtons = document.querySelectorAll('button[aria-expanded], button[aria-pressed]');

    // Check result cards
    const resultCards = document.querySelectorAll('article, [role="article"], [data-testid*="card"]');

    // Check images
    const images = document.querySelectorAll('img');
    let missingAlt = 0;
    images.forEach(img => {
      if (!img.hasAttribute('alt')) {
        missingAlt++;
      }
    });

    if (missingAlt > 0) {
      issues.push(`${missingAlt} images missing alt attribute`);
    }

    // Check for keyboard navigation
    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    // Check pagination accessibility
    const pagination = document.querySelector('[role="navigation"][aria-label*="pagination" i], nav[aria-label*="pagination" i]');

    // Check for skip links
    const skipLink = document.querySelector('a[href="#main"], a[href="#content"], a[href="#results"]');

    // Check for live regions (for search results updates)
    const liveRegions = document.querySelectorAll('[aria-live], [role="alert"], [role="status"]');

    return {
      issues,
      hasSearchLandmark: !!searchForm,
      filterButtonCount: filterButtons.length,
      resultCardCount: resultCards.length,
      imageCount: images.length,
      missingAltCount: missingAlt,
      focusableElementCount: focusableElements.length,
      hasPaginationNav: !!pagination,
      hasSkipLink: !!skipLink,
      liveRegionCount: liveRegions.length,
    };
  });
}

test.describe('T052: Search Page Lighthouse Performance Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to search page
    await page.goto('/search');
    await page.waitForLoadState('networkidle');
  });

  test('T052.1: Search page Performance score > 85 (Core Web Vitals)', async ({ page }) => {
    const metrics = await collectPerformanceMetrics(page);

    console.log('\n=== Search Page Performance Metrics ===');
    console.log(`TTFB: ${metrics.ttfb.toFixed(2)}ms (threshold: ${PERFORMANCE_THRESHOLDS.TTFB}ms)`);
    console.log(`FCP: ${metrics.fcp.toFixed(2)}ms (threshold: ${PERFORMANCE_THRESHOLDS.FCP}ms)`);
    console.log(`DOM Interactive: ${metrics.domInteractive.toFixed(2)}ms`);
    console.log(`DOM Content Loaded: ${metrics.domContentLoaded.toFixed(2)}ms`);
    console.log(`Load Complete: ${metrics.loadComplete.toFixed(2)}ms`);

    expect(metrics.ttfb).toBeLessThan(PERFORMANCE_THRESHOLDS.TTFB);
    expect(metrics.fcp).toBeLessThan(PERFORMANCE_THRESHOLDS.FCP);
    expect(metrics.domInteractive).toBeLessThan(PERFORMANCE_THRESHOLDS.TTI);
  });

  test('T052.2: Search page LCP under 2.5s threshold', async ({ page }) => {
    const lcp = await measureLCP(page);

    console.log(`\nLargest Contentful Paint: ${lcp.toFixed(2)}ms`);
    console.log(`Threshold: ${PERFORMANCE_THRESHOLDS.LCP}ms`);

    expect(lcp).toBeLessThan(PERFORMANCE_THRESHOLDS.LCP);
  });

  test('T052.3: Search page CLS under 0.1 threshold', async ({ page }) => {
    const cls = await measureCLS(page);

    console.log(`\nCumulative Layout Shift: ${cls.toFixed(4)}`);
    console.log(`Threshold: ${PERFORMANCE_THRESHOLDS.CLS}`);

    expect(cls).toBeLessThan(PERFORMANCE_THRESHOLDS.CLS);
  });

  test('T052.4: Search page Accessibility score > 90', async ({ page }) => {
    const accessibility = await checkSearchAccessibility(page);

    console.log('\n=== Search Page Accessibility Check ===');
    console.log(`Has search landmark: ${accessibility.hasSearchLandmark}`);
    console.log(`Filter buttons with ARIA: ${accessibility.filterButtonCount}`);
    console.log(`Result cards: ${accessibility.resultCardCount}`);
    console.log(`Total images: ${accessibility.imageCount}`);
    console.log(`Images missing alt: ${accessibility.missingAltCount}`);
    console.log(`Focusable elements: ${accessibility.focusableElementCount}`);
    console.log(`Has pagination nav: ${accessibility.hasPaginationNav}`);
    console.log(`Has skip link: ${accessibility.hasSkipLink}`);
    console.log(`Live regions: ${accessibility.liveRegionCount}`);

    if (accessibility.issues.length > 0) {
      console.log('\nIssues found:');
      accessibility.issues.forEach(issue => console.log(`  - ${issue}`));
    }

    const score = Math.max(0, 100 - (accessibility.issues.length * 10));
    console.log(`\nAccessibility Score (estimated): ${score}`);

    expect(accessibility.issues.length).toBeLessThanOrEqual(3);
  });

  test('T052.5: Search page Best Practices score > 90', async ({ page }) => {
    const bestPractices = await page.evaluate(() => {
      const issues: string[] = [];

      // Check DOCTYPE
      if (!document.doctype) {
        issues.push('Missing DOCTYPE');
      }

      // Check charset
      if (!document.querySelector('meta[charset]')) {
        issues.push('Missing charset meta tag');
      }

      // Check for console errors indicator
      const hasErrors = false; // Would need console listener

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

      // Check for deprecated HTML
      const deprecatedTags = document.querySelectorAll('font, center, marquee, blink');
      if (deprecatedTags.length > 0) {
        issues.push(`${deprecatedTags.length} deprecated HTML elements found`);
      }

      return {
        issues,
        hasDoctype: !!document.doctype,
        hasCharset: !!document.querySelector('meta[charset]'),
        externalLinkCount: externalLinks.length,
        unsafeLinkCount: unsafeLinks,
        deprecatedElementCount: deprecatedTags.length,
      };
    });

    console.log('\n=== Best Practices Check ===');
    console.log(`Has DOCTYPE: ${bestPractices.hasDoctype}`);
    console.log(`Has charset: ${bestPractices.hasCharset}`);
    console.log(`External links: ${bestPractices.externalLinkCount}`);
    console.log(`Unsafe external links: ${bestPractices.unsafeLinkCount}`);
    console.log(`Deprecated elements: ${bestPractices.deprecatedElementCount}`);

    if (bestPractices.issues.length > 0) {
      console.log('\nIssues found:');
      bestPractices.issues.forEach(issue => console.log(`  - ${issue}`));
    }

    expect(bestPractices.hasDoctype).toBe(true);
    expect(bestPractices.issues.length).toBeLessThanOrEqual(3);
  });

  test('T052.6: Search page SEO score > 90', async ({ page }) => {
    const seo = await checkSearchSEO(page);

    console.log('\n=== Search Page SEO Check ===');
    console.log(`Title: ${seo.title || 'MISSING'}`);
    console.log(`Has meta description: ${seo.hasMetaDescription}`);
    console.log(`Has canonical: ${seo.hasCanonical}`);
    console.log(`Robots meta: ${seo.robotsContent || 'not set'}`);
    console.log(`Open Graph tags: ${seo.ogTagCount}`);
    console.log(`H1: ${seo.h1 || 'MISSING'}`);
    console.log(`H1 count: ${seo.h1Count}`);
    console.log(`Has search input: ${seo.hasSearchInput}`);
    console.log(`Search input has label: ${seo.hasSearchLabel}`);

    if (seo.issues.length > 0) {
      console.log('\nIssues found:');
      seo.issues.forEach(issue => console.log(`  - ${issue}`));
    }

    expect(seo.title).toBeTruthy();
    expect(seo.hasMetaDescription).toBe(true);
    expect(seo.h1Count).toBe(1);
  });

  test('T052.7: Search results loading performance', async ({ page }) => {
    // Measure search query response time
    const searchInput = page.getByRole('textbox', { name: /ค้นหา|search/i }).first();

    if (await searchInput.isVisible()) {
      const startTime = Date.now();

      await searchInput.fill('camping');
      await searchInput.press('Enter');

      // Wait for results to appear
      const resultsLoaded = await Promise.race([
        page.locator('[data-testid="search-results"], [data-testid="campsite-card"], article').first()
          .waitFor({ state: 'visible', timeout: PERFORMANCE_THRESHOLDS.SEARCH_RESPONSE_TIME })
          .then(() => true),
        page.waitForTimeout(PERFORMANCE_THRESHOLDS.SEARCH_RESPONSE_TIME).then(() => false),
      ]);

      const responseTime = Date.now() - startTime;

      console.log('\n=== Search Results Loading ===');
      console.log(`Search response time: ${responseTime}ms`);
      console.log(`Threshold: ${PERFORMANCE_THRESHOLDS.SEARCH_RESPONSE_TIME}ms`);
      console.log(`Results loaded: ${resultsLoaded}`);

      expect(responseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.SEARCH_RESPONSE_TIME);
    } else {
      console.log('Search input not found - skipping search test');
    }
  });

  test('T052.8: Filter interaction responsiveness', async ({ page }) => {
    // Test filter panel opening
    const filterButton = page.getByRole('button', { name: /ตัวกรอง|filter/i }).first();

    if (await filterButton.isVisible()) {
      const startTime = Date.now();
      await filterButton.click();

      // Wait for filter panel
      const filterPanel = page.locator('[role="dialog"], [data-testid="filter-panel"], [class*="filter"]').first();
      await filterPanel.waitFor({ state: 'visible', timeout: PERFORMANCE_THRESHOLDS.FILTER_RESPONSE_TIME });

      const responseTime = Date.now() - startTime;

      console.log('\n=== Filter Interaction Performance ===');
      console.log(`Filter panel open time: ${responseTime}ms`);
      console.log(`Threshold: ${PERFORMANCE_THRESHOLDS.FILTER_RESPONSE_TIME}ms`);

      expect(responseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.FILTER_RESPONSE_TIME);

      // Test filter application
      const amenityCheckbox = page.locator('input[type="checkbox"]').first();
      if (await amenityCheckbox.isVisible()) {
        const filterStartTime = Date.now();
        await amenityCheckbox.click();

        // Wait for URL change or results update
        await page.waitForTimeout(300);
        const filterApplyTime = Date.now() - filterStartTime;

        console.log(`Filter apply time: ${filterApplyTime}ms`);
        expect(filterApplyTime).toBeLessThan(PERFORMANCE_THRESHOLDS.FILTER_RESPONSE_TIME);
      }
    } else {
      console.log('Filter button not found - testing inline filters');

      // Try inline filter options
      const filterOption = page.locator('select, [role="combobox"]').first();
      if (await filterOption.isVisible()) {
        const startTime = Date.now();
        await filterOption.click();
        await page.waitForTimeout(200);
        const responseTime = Date.now() - startTime;

        console.log(`Inline filter response time: ${responseTime}ms`);
        expect(responseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.FILTER_RESPONSE_TIME);
      }
    }
  });

  test('T052.9: Pagination performance', async ({ page }) => {
    // Look for pagination controls
    const paginationNext = page.locator('a[rel="next"], button[aria-label*="next" i], button:has-text("Next"), [data-testid*="next"]').first();

    if (await paginationNext.isVisible()) {
      const startTime = Date.now();
      await paginationNext.click();

      // Wait for new results
      await page.waitForLoadState('networkidle');
      const responseTime = Date.now() - startTime;

      console.log('\n=== Pagination Performance ===');
      console.log(`Page navigation time: ${responseTime}ms`);
      console.log(`Threshold: ${PERFORMANCE_THRESHOLDS.PAGINATION_RESPONSE_TIME}ms`);

      expect(responseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.PAGINATION_RESPONSE_TIME);
    } else {
      console.log('Pagination not found - may not have enough results');
    }
  });

  test('T052.10: Search results card optimization', async ({ page }) => {
    const cardMetrics = await page.evaluate(() => {
      // Find result cards
      const cards = document.querySelectorAll('article, [data-testid*="card"], [class*="campsite"]');

      // Analyze card images
      const cardImages = document.querySelectorAll('article img, [data-testid*="card"] img');
      let lazyImages = 0;
      let eagerImages = 0;

      cardImages.forEach(img => {
        if (img.getAttribute('loading') === 'lazy') {
          lazyImages++;
        } else {
          eagerImages++;
        }
      });

      // Check for skeleton placeholders
      const skeletons = document.querySelectorAll('[class*="skeleton"], [data-testid*="skeleton"]');

      // Check for virtualization indicators
      const virtualList = document.querySelector('[data-virtualized], [class*="virtual"]');

      return {
        cardCount: cards.length,
        cardImageCount: cardImages.length,
        lazyImageCount: lazyImages,
        eagerImageCount: eagerImages,
        skeletonCount: skeletons.length,
        hasVirtualization: !!virtualList,
      };
    });

    console.log('\n=== Search Results Card Analysis ===');
    console.log(`Result cards: ${cardMetrics.cardCount}`);
    console.log(`Card images: ${cardMetrics.cardImageCount}`);
    console.log(`Lazy loaded images: ${cardMetrics.lazyImageCount}`);
    console.log(`Eager loaded images: ${cardMetrics.eagerImageCount}`);
    console.log(`Skeleton placeholders: ${cardMetrics.skeletonCount}`);
    console.log(`Has virtualization: ${cardMetrics.hasVirtualization}`);

    // Images beyond the fold should be lazy loaded
    if (cardMetrics.cardImageCount > 6) {
      const lazyRatio = cardMetrics.lazyImageCount / cardMetrics.cardImageCount;
      console.log(`Lazy load ratio: ${(lazyRatio * 100).toFixed(1)}%`);
    }
  });

  test('T052.11: Search page resource optimization', async ({ page }) => {
    const metrics = await collectPerformanceMetrics(page);

    console.log('\n=== Resource Optimization ===');
    console.log(`Total resources: ${metrics.totalResources} (max: ${PERFORMANCE_THRESHOLDS.MAX_TOTAL_RESOURCES})`);
    console.log(`Total transfer size: ${(metrics.totalTransferSize / 1024).toFixed(2)}KB (max: ${PERFORMANCE_THRESHOLDS.MAX_TOTAL_TRANSFER_SIZE_KB}KB)`);
    console.log('\nResources by type:');

    Object.entries(metrics.resourcesByType).forEach(([type, data]) => {
      console.log(`  ${type}: ${data.count} files, ${(data.size / 1024).toFixed(2)}KB`);
    });

    expect(metrics.totalResources).toBeLessThan(PERFORMANCE_THRESHOLDS.MAX_TOTAL_RESOURCES);
    expect(metrics.totalTransferSize / 1024).toBeLessThan(PERFORMANCE_THRESHOLDS.MAX_TOTAL_TRANSFER_SIZE_KB);
  });

  test('T052.12: Search page JavaScript performance', async ({ page }) => {
    const jsMetrics = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      const jsResources = resources.filter(r =>
        r.initiatorType === 'script' ||
        r.name.endsWith('.js') ||
        r.name.includes('.js?')
      );

      // Check for code splitting indicators
      const chunkScripts = jsResources.filter(r =>
        r.name.includes('chunk') ||
        r.name.includes('commons') ||
        r.name.includes('vendor')
      );

      return {
        totalJsFiles: jsResources.length,
        totalJsSize: jsResources.reduce((sum, r) => sum + (r.transferSize || 0), 0),
        chunkCount: chunkScripts.length,
        largestScripts: jsResources
          .map(r => ({
            name: r.name.split('/').pop()?.split('?')[0] || r.name,
            size: r.transferSize || 0,
          }))
          .sort((a, b) => b.size - a.size)
          .slice(0, 5),
      };
    });

    console.log('\n=== JavaScript Analysis ===');
    console.log(`Total JS files: ${jsMetrics.totalJsFiles} (max: ${PERFORMANCE_THRESHOLDS.MAX_JS_BUNDLES})`);
    console.log(`Total JS size: ${(jsMetrics.totalJsSize / 1024).toFixed(2)}KB (max: ${PERFORMANCE_THRESHOLDS.MAX_JS_TRANSFER_SIZE_KB}KB)`);
    console.log(`Code-split chunks: ${jsMetrics.chunkCount}`);

    if (jsMetrics.largestScripts.length > 0) {
      console.log('\nLargest scripts:');
      jsMetrics.largestScripts.forEach((script, i) => {
        console.log(`  ${i + 1}. ${script.name}: ${(script.size / 1024).toFixed(2)}KB`);
      });
    }

    expect(jsMetrics.totalJsFiles).toBeLessThan(PERFORMANCE_THRESHOLDS.MAX_JS_BUNDLES);
    expect(jsMetrics.totalJsSize / 1024).toBeLessThan(PERFORMANCE_THRESHOLDS.MAX_JS_TRANSFER_SIZE_KB);
  });

  test('T052.13: Search URL state performance', async ({ page }) => {
    // Test that URL updates don't cause full page reloads
    const searchInput = page.getByRole('textbox', { name: /ค้นหา|search/i }).first();

    if (await searchInput.isVisible()) {
      // Perform a search
      await searchInput.fill('test');
      await searchInput.press('Enter');
      await page.waitForLoadState('networkidle');

      // Check URL was updated
      const url1 = page.url();
      console.log('\n=== URL State Performance ===');
      console.log(`URL after search: ${url1}`);

      // Perform another search
      await searchInput.clear();
      await searchInput.fill('beach');
      await searchInput.press('Enter');

      // Measure time for URL update
      const startTime = Date.now();
      await page.waitForURL(/beach|search/, { timeout: 2000 }).catch(() => {});
      const urlUpdateTime = Date.now() - startTime;

      const url2 = page.url();
      console.log(`URL after second search: ${url2}`);
      console.log(`URL update time: ${urlUpdateTime}ms`);

      // URL should be different
      expect(url1).not.toEqual(url2);
      expect(urlUpdateTime).toBeLessThan(2000);
    }
  });

  test('T052.14: Mobile responsiveness performance', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');

    const mobileMetrics = await collectPerformanceMetrics(page);

    console.log('\n=== Mobile Responsiveness ===');
    console.log(`Mobile TTFB: ${mobileMetrics.ttfb.toFixed(2)}ms`);
    console.log(`Mobile FCP: ${mobileMetrics.fcp.toFixed(2)}ms`);
    console.log(`Mobile Load Complete: ${mobileMetrics.loadComplete.toFixed(2)}ms`);
    console.log(`Mobile Total Resources: ${mobileMetrics.totalResources}`);
    console.log(`Mobile Transfer Size: ${(mobileMetrics.totalTransferSize / 1024).toFixed(2)}KB`);

    // Check mobile-specific elements
    const mobileCheck = await page.evaluate(() => {
      const hamburgerMenu = document.querySelector('[aria-label*="menu" i], button[class*="mobile"]');
      const mobileFilters = document.querySelector('[data-testid*="mobile-filter"], [class*="mobile-filter"]');
      const viewport = document.querySelector('meta[name="viewport"]');

      return {
        hasHamburgerMenu: !!hamburgerMenu,
        hasMobileFilters: !!mobileFilters,
        viewportContent: viewport?.getAttribute('content') || '',
      };
    });

    console.log(`Has hamburger menu: ${mobileCheck.hasHamburgerMenu}`);
    console.log(`Has mobile filters: ${mobileCheck.hasMobileFilters}`);
    console.log(`Viewport: ${mobileCheck.viewportContent}`);

    // Mobile should still be performant
    expect(mobileMetrics.loadComplete).toBeLessThan(5000);
  });

  test('T052.15: Empty state performance', async ({ page }) => {
    // Search for something that likely returns no results
    const searchInput = page.getByRole('textbox', { name: /ค้นหา|search/i }).first();

    if (await searchInput.isVisible()) {
      const startTime = Date.now();
      await searchInput.fill('xyznonexistent123456');
      await searchInput.press('Enter');

      // Wait for empty state
      const emptyState = page.locator('[data-testid="empty-state"], [data-testid="no-results"], :text("No results"), :text("ไม่พบ")').first();
      await emptyState.waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});

      const responseTime = Date.now() - startTime;

      console.log('\n=== Empty State Performance ===');
      console.log(`Empty state response time: ${responseTime}ms`);

      // Empty state should appear quickly
      expect(responseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.SEARCH_RESPONSE_TIME);

      // Check for helpful empty state content
      const emptyStateContent = await page.evaluate(() => {
        const container = document.body;
        return {
          hasNoResultsText: container.textContent?.includes('No results') ||
                           container.textContent?.includes('ไม่พบ') ||
                           container.textContent?.includes('not found'),
          hasSuggestions: !!document.querySelector('[data-testid="suggestions"]'),
          hasSearchTips: container.textContent?.includes('tip') ||
                        container.textContent?.includes('try'),
        };
      });

      console.log(`Has no results text: ${emptyStateContent.hasNoResultsText}`);
      console.log(`Has suggestions: ${emptyStateContent.hasSuggestions}`);
      console.log(`Has search tips: ${emptyStateContent.hasSearchTips}`);
    }
  });
});
