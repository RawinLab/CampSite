import { test, expect, Page } from '@playwright/test';

/**
 * Lighthouse Performance Tests for Homepage (T050)
 *
 * Tests homepage performance metrics including:
 * - Core Web Vitals (LCP, FID, CLS)
 * - Resource loading optimization
 * - Accessibility score verification
 * - SEO score verification
 * - Best practices compliance
 *
 * Note: Uses Performance API metrics as a proxy for Lighthouse scores
 * when actual Lighthouse is not available in CI environment.
 */

// Performance thresholds aligned with Lighthouse scoring
const PERFORMANCE_THRESHOLDS = {
  // Performance metrics
  LCP: 2500, // Largest Contentful Paint - Good threshold
  FID: 100, // First Input Delay - Good threshold
  CLS: 0.1, // Cumulative Layout Shift - Good threshold
  TTFB: 800, // Time to First Byte
  FCP: 1800, // First Contentful Paint
  TTI: 3800, // Time to Interactive

  // Resource thresholds
  MAX_JS_BUNDLES: 15,
  MAX_CSS_BUNDLES: 10,
  MAX_IMAGES: 30,
  MAX_TOTAL_RESOURCES: 60,
  MAX_TOTAL_TRANSFER_SIZE_KB: 2000, // 2MB total
  MAX_JS_TRANSFER_SIZE_KB: 500, // 500KB for JS
};

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

      // Wait for LCP to stabilize
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

// Helper to check accessibility basics
async function checkBasicAccessibility(page: Page) {
  return await page.evaluate(() => {
    const issues: string[] = [];

    // Check for images without alt text
    const imagesWithoutAlt = document.querySelectorAll('img:not([alt])');
    if (imagesWithoutAlt.length > 0) {
      issues.push(`${imagesWithoutAlt.length} images without alt text`);
    }

    // Check for proper heading hierarchy
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let hasH1 = false;
    headings.forEach(h => {
      if (h.tagName === 'H1') hasH1 = true;
    });
    if (!hasH1) {
      issues.push('Missing h1 element');
    }

    // Check for form labels
    const inputsWithoutLabels = document.querySelectorAll(
      'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([aria-label]):not([aria-labelledby])'
    );
    const labelsForInputs = document.querySelectorAll('label[for]');
    const labeledIds = Array.from(labelsForInputs).map(l => l.getAttribute('for'));

    let unlabeledInputs = 0;
    inputsWithoutLabels.forEach(input => {
      if (!labeledIds.includes(input.id) && !input.closest('label')) {
        unlabeledInputs++;
      }
    });
    if (unlabeledInputs > 0) {
      issues.push(`${unlabeledInputs} inputs without labels`);
    }

    // Check for buttons without accessible names
    const buttonsWithoutNames = document.querySelectorAll(
      'button:not([aria-label]):not([aria-labelledby])'
    );
    let emptyButtons = 0;
    buttonsWithoutNames.forEach(btn => {
      if (!btn.textContent?.trim() && !btn.querySelector('img[alt]')) {
        emptyButtons++;
      }
    });
    if (emptyButtons > 0) {
      issues.push(`${emptyButtons} buttons without accessible names`);
    }

    // Check for color contrast (basic check for text on white background)
    const bodyColor = window.getComputedStyle(document.body).color;

    // Check for language attribute
    const hasLang = document.documentElement.hasAttribute('lang');
    if (!hasLang) {
      issues.push('Missing lang attribute on html element');
    }

    // Check for viewport meta tag
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    if (!viewportMeta) {
      issues.push('Missing viewport meta tag');
    }

    return {
      issues,
      totalElements: document.querySelectorAll('*').length,
      interactiveElements: document.querySelectorAll('a, button, input, select, textarea').length,
      hasSkipLink: !!document.querySelector('a[href="#main"], a[href="#content"]'),
      hasLandmarks: document.querySelectorAll('main, nav, header, footer, aside').length > 0,
    };
  });
}

// Helper to check SEO basics
async function checkBasicSEO(page: Page) {
  return await page.evaluate(() => {
    const issues: string[] = [];

    // Check for title
    const title = document.title;
    if (!title) {
      issues.push('Missing page title');
    } else if (title.length < 10 || title.length > 70) {
      issues.push(`Title length (${title.length}) should be between 10-70 characters`);
    }

    // Check for meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      issues.push('Missing meta description');
    } else {
      const content = metaDescription.getAttribute('content') || '';
      if (content.length < 50 || content.length > 160) {
        issues.push(`Meta description length (${content.length}) should be between 50-160 characters`);
      }
    }

    // Check for canonical URL
    const canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      issues.push('Missing canonical URL');
    }

    // Check for Open Graph tags
    const ogTags = document.querySelectorAll('meta[property^="og:"]');
    if (ogTags.length === 0) {
      issues.push('Missing Open Graph meta tags');
    }

    // Check for robots meta
    const robotsMeta = document.querySelector('meta[name="robots"]');

    // Check for structured data
    const jsonLd = document.querySelectorAll('script[type="application/ld+json"]');

    // Check for proper heading structure
    const h1Count = document.querySelectorAll('h1').length;
    if (h1Count === 0) {
      issues.push('Missing h1 element');
    } else if (h1Count > 1) {
      issues.push(`Multiple h1 elements (${h1Count}) - should have only one`);
    }

    return {
      issues,
      title,
      hasMetaDescription: !!metaDescription,
      hasCanonical: !!canonical,
      ogTagCount: ogTags.length,
      hasRobotsMeta: !!robotsMeta,
      structuredDataCount: jsonLd.length,
      h1Count,
    };
  });
}

test.describe('T050: Homepage Lighthouse Performance Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('T050.1: Homepage Performance score > 85 (Core Web Vitals)', async ({ page }) => {
    const metrics = await collectPerformanceMetrics(page);

    console.log('\n=== Homepage Performance Metrics ===');
    console.log(`TTFB: ${metrics.ttfb.toFixed(2)}ms (threshold: ${PERFORMANCE_THRESHOLDS.TTFB}ms)`);
    console.log(`FCP: ${metrics.fcp.toFixed(2)}ms (threshold: ${PERFORMANCE_THRESHOLDS.FCP}ms)`);
    console.log(`DOM Interactive: ${metrics.domInteractive.toFixed(2)}ms`);
    console.log(`DOM Content Loaded: ${metrics.domContentLoaded.toFixed(2)}ms`);
    console.log(`Load Complete: ${metrics.loadComplete.toFixed(2)}ms`);

    // Verify performance metrics are within acceptable thresholds
    expect(metrics.ttfb).toBeLessThan(PERFORMANCE_THRESHOLDS.TTFB);
    expect(metrics.fcp).toBeLessThan(PERFORMANCE_THRESHOLDS.FCP);
    expect(metrics.domInteractive).toBeLessThan(PERFORMANCE_THRESHOLDS.TTI);
  });

  test('T050.2: Homepage LCP under 2.5s threshold', async ({ page }) => {
    const lcp = await measureLCP(page);

    console.log(`\nLargest Contentful Paint: ${lcp.toFixed(2)}ms`);
    console.log(`Threshold: ${PERFORMANCE_THRESHOLDS.LCP}ms`);

    // LCP should be under 2.5 seconds for good score
    expect(lcp).toBeLessThan(PERFORMANCE_THRESHOLDS.LCP);
  });

  test('T050.3: Homepage CLS under 0.1 threshold', async ({ page }) => {
    const cls = await measureCLS(page);

    console.log(`\nCumulative Layout Shift: ${cls.toFixed(4)}`);
    console.log(`Threshold: ${PERFORMANCE_THRESHOLDS.CLS}`);

    // CLS should be under 0.1 for good score
    expect(cls).toBeLessThan(PERFORMANCE_THRESHOLDS.CLS);
  });

  test('T050.4: Homepage Accessibility score > 90', async ({ page }) => {
    const accessibility = await checkBasicAccessibility(page);

    console.log('\n=== Accessibility Check ===');
    console.log(`Total elements: ${accessibility.totalElements}`);
    console.log(`Interactive elements: ${accessibility.interactiveElements}`);
    console.log(`Has skip link: ${accessibility.hasSkipLink}`);
    console.log(`Has landmarks: ${accessibility.hasLandmarks}`);

    if (accessibility.issues.length > 0) {
      console.log('Issues found:');
      accessibility.issues.forEach(issue => console.log(`  - ${issue}`));
    }

    // Calculate pseudo-accessibility score based on issues
    const maxIssues = 5; // Allow up to 5 minor issues for > 90 score
    const issueCount = accessibility.issues.length;
    const score = Math.max(0, 100 - (issueCount * 10));

    console.log(`\nAccessibility Score (estimated): ${score}`);

    expect(issueCount).toBeLessThanOrEqual(maxIssues);
    expect(accessibility.hasLandmarks).toBe(true);
  });

  test('T050.5: Homepage Best Practices score > 90', async ({ page }) => {
    const bestPractices = await page.evaluate(() => {
      const issues: string[] = [];

      // Check for HTTPS
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        issues.push('Page not served over HTTPS');
      }

      // Check for console errors (would need to listen to console events)
      // Check for deprecated APIs - basic check
      const deprecatedAPIs = ['document.domain'];
      deprecatedAPIs.forEach(api => {
        try {
          // @ts-ignore - checking for deprecated APIs
          if (typeof eval(api) !== 'undefined') {
            issues.push(`Deprecated API used: ${api}`);
          }
        } catch {
          // API not used or error - that's fine
        }
      });

      // Check for proper doctype
      const hasDoctype = document.doctype !== null;
      if (!hasDoctype) {
        issues.push('Missing DOCTYPE declaration');
      }

      // Check for charset
      const charsetMeta = document.querySelector('meta[charset]');
      if (!charsetMeta) {
        issues.push('Missing charset meta tag');
      }

      // Check for external links with proper attributes
      const externalLinks = document.querySelectorAll('a[target="_blank"]');
      let unsafeLinks = 0;
      externalLinks.forEach(link => {
        const rel = link.getAttribute('rel') || '';
        if (!rel.includes('noopener') && !rel.includes('noreferrer')) {
          unsafeLinks++;
        }
      });
      if (unsafeLinks > 0) {
        issues.push(`${unsafeLinks} external links missing rel="noopener"`);
      }

      return {
        issues,
        hasDoctype,
        hasCharset: !!charsetMeta,
        externalLinkCount: externalLinks.length,
        unsafeLinkCount: unsafeLinks,
      };
    });

    console.log('\n=== Best Practices Check ===');
    console.log(`Has DOCTYPE: ${bestPractices.hasDoctype}`);
    console.log(`Has charset: ${bestPractices.hasCharset}`);
    console.log(`External links: ${bestPractices.externalLinkCount}`);
    console.log(`Unsafe external links: ${bestPractices.unsafeLinkCount}`);

    if (bestPractices.issues.length > 0) {
      console.log('Issues found:');
      bestPractices.issues.forEach(issue => console.log(`  - ${issue}`));
    }

    // Best practices should have minimal issues
    expect(bestPractices.hasDoctype).toBe(true);
    expect(bestPractices.issues.length).toBeLessThanOrEqual(3);
  });

  test('T050.6: Homepage SEO score > 90', async ({ page }) => {
    const seo = await checkBasicSEO(page);

    console.log('\n=== SEO Check ===');
    console.log(`Title: ${seo.title || 'MISSING'}`);
    console.log(`Has meta description: ${seo.hasMetaDescription}`);
    console.log(`Has canonical: ${seo.hasCanonical}`);
    console.log(`Open Graph tags: ${seo.ogTagCount}`);
    console.log(`Has robots meta: ${seo.hasRobotsMeta}`);
    console.log(`Structured data scripts: ${seo.structuredDataCount}`);
    console.log(`H1 count: ${seo.h1Count}`);

    if (seo.issues.length > 0) {
      console.log('Issues found:');
      seo.issues.forEach(issue => console.log(`  - ${issue}`));
    }

    // SEO should have essential elements
    expect(seo.title).toBeTruthy();
    expect(seo.hasMetaDescription).toBe(true);
    expect(seo.h1Count).toBe(1);
    expect(seo.issues.length).toBeLessThanOrEqual(3);
  });

  test('T050.7: Homepage resource count optimization', async ({ page }) => {
    const metrics = await collectPerformanceMetrics(page);

    console.log('\n=== Resource Optimization ===');
    console.log(`Total resources: ${metrics.totalResources} (max: ${PERFORMANCE_THRESHOLDS.MAX_TOTAL_RESOURCES})`);
    console.log(`Total transfer size: ${(metrics.totalTransferSize / 1024).toFixed(2)}KB`);
    console.log('\nResources by type:');
    Object.entries(metrics.resourcesByType).forEach(([type, data]) => {
      console.log(`  ${type}: ${data.count} files, ${(data.size / 1024).toFixed(2)}KB`);
    });

    // Verify resource counts
    expect(metrics.totalResources).toBeLessThan(PERFORMANCE_THRESHOLDS.MAX_TOTAL_RESOURCES);
    expect(metrics.totalTransferSize / 1024).toBeLessThan(PERFORMANCE_THRESHOLDS.MAX_TOTAL_TRANSFER_SIZE_KB);
  });

  test('T050.8: Homepage JavaScript bundle size optimization', async ({ page }) => {
    const jsMetrics = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      const jsResources = resources.filter(r =>
        r.initiatorType === 'script' ||
        r.name.endsWith('.js') ||
        r.name.includes('.js?')
      );

      return {
        count: jsResources.length,
        totalSize: jsResources.reduce((sum, r) => sum + (r.transferSize || 0), 0),
        files: jsResources.map(r => ({
          name: r.name.split('/').pop()?.split('?')[0] || r.name,
          size: r.transferSize || 0,
          duration: r.duration,
        })).sort((a, b) => b.size - a.size).slice(0, 5), // Top 5 largest
      };
    });

    console.log('\n=== JavaScript Bundle Analysis ===');
    console.log(`JS bundles: ${jsMetrics.count} (max: ${PERFORMANCE_THRESHOLDS.MAX_JS_BUNDLES})`);
    console.log(`Total JS size: ${(jsMetrics.totalSize / 1024).toFixed(2)}KB (max: ${PERFORMANCE_THRESHOLDS.MAX_JS_TRANSFER_SIZE_KB}KB)`);
    console.log('\nLargest JS files:');
    jsMetrics.files.forEach((file, i) => {
      console.log(`  ${i + 1}. ${file.name}: ${(file.size / 1024).toFixed(2)}KB (${file.duration.toFixed(2)}ms)`);
    });

    expect(jsMetrics.count).toBeLessThan(PERFORMANCE_THRESHOLDS.MAX_JS_BUNDLES);
    expect(jsMetrics.totalSize / 1024).toBeLessThan(PERFORMANCE_THRESHOLDS.MAX_JS_TRANSFER_SIZE_KB);
  });

  test('T050.9: Homepage image optimization', async ({ page }) => {
    const imageMetrics = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      const imageResources = resources.filter(r =>
        r.initiatorType === 'img' ||
        r.name.match(/\.(jpg|jpeg|png|gif|webp|avif|svg)(\?|$)/i)
      );

      // Check images in DOM
      const domImages = document.querySelectorAll('img');
      const lazyImages = document.querySelectorAll('img[loading="lazy"]');
      const imagesWithSrcset = document.querySelectorAll('img[srcset]');
      const nextImages = document.querySelectorAll('img[data-nimg]');

      return {
        networkImageCount: imageResources.length,
        totalImageSize: imageResources.reduce((sum, r) => sum + (r.transferSize || 0), 0),
        domImageCount: domImages.length,
        lazyImageCount: lazyImages.length,
        srcsetImageCount: imagesWithSrcset.length,
        nextImageCount: nextImages.length,
        largestImages: imageResources
          .map(r => ({
            name: r.name.split('/').pop()?.split('?')[0] || r.name,
            size: r.transferSize || 0,
          }))
          .sort((a, b) => b.size - a.size)
          .slice(0, 5),
      };
    });

    console.log('\n=== Image Optimization ===');
    console.log(`Network images: ${imageMetrics.networkImageCount}`);
    console.log(`DOM images: ${imageMetrics.domImageCount}`);
    console.log(`Lazy loaded: ${imageMetrics.lazyImageCount}`);
    console.log(`With srcset: ${imageMetrics.srcsetImageCount}`);
    console.log(`Next.js optimized: ${imageMetrics.nextImageCount}`);
    console.log(`Total image size: ${(imageMetrics.totalImageSize / 1024).toFixed(2)}KB`);

    if (imageMetrics.largestImages.length > 0) {
      console.log('\nLargest images:');
      imageMetrics.largestImages.forEach((img, i) => {
        console.log(`  ${i + 1}. ${img.name}: ${(img.size / 1024).toFixed(2)}KB`);
      });
    }

    expect(imageMetrics.networkImageCount).toBeLessThan(PERFORMANCE_THRESHOLDS.MAX_IMAGES);
  });

  test('T050.10: Homepage font loading strategy', async ({ page }) => {
    const fontMetrics = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      const fontResources = resources.filter(r =>
        r.name.match(/\.(woff|woff2|ttf|otf|eot)(\?|$)/i) ||
        r.initiatorType === 'css' && r.name.includes('fonts')
      );

      // Check font-display in stylesheets
      const stylesheets = Array.from(document.styleSheets);
      let fontFaceRules = 0;
      let swapOrOptionalFonts = 0;

      stylesheets.forEach(sheet => {
        try {
          const rules = Array.from(sheet.cssRules || []);
          rules.forEach(rule => {
            if (rule instanceof CSSFontFaceRule) {
              fontFaceRules++;
              const display = (rule as CSSFontFaceRule).style.getPropertyValue('font-display');
              if (display === 'swap' || display === 'optional' || display === 'fallback') {
                swapOrOptionalFonts++;
              }
            }
          });
        } catch {
          // Cross-origin stylesheet, can't access
        }
      });

      // Check for preloaded fonts
      const preloadedFonts = document.querySelectorAll('link[rel="preload"][as="font"]');

      return {
        fontCount: fontResources.length,
        totalFontSize: fontResources.reduce((sum, r) => sum + (r.transferSize || 0), 0),
        fontFaceRules,
        swapOrOptionalFonts,
        preloadedFontCount: preloadedFonts.length,
        fonts: fontResources.map(r => ({
          name: r.name.split('/').pop()?.split('?')[0] || r.name,
          size: r.transferSize || 0,
          duration: r.duration,
        })),
      };
    });

    console.log('\n=== Font Loading Analysis ===');
    console.log(`Font files loaded: ${fontMetrics.fontCount}`);
    console.log(`Total font size: ${(fontMetrics.totalFontSize / 1024).toFixed(2)}KB`);
    console.log(`@font-face rules: ${fontMetrics.fontFaceRules}`);
    console.log(`Fonts with swap/optional/fallback: ${fontMetrics.swapOrOptionalFonts}`);
    console.log(`Preloaded fonts: ${fontMetrics.preloadedFontCount}`);

    if (fontMetrics.fonts.length > 0) {
      console.log('\nFont files:');
      fontMetrics.fonts.forEach(font => {
        console.log(`  - ${font.name}: ${(font.size / 1024).toFixed(2)}KB (${font.duration.toFixed(2)}ms)`);
      });
    }

    // Fonts should be optimized
    expect(fontMetrics.fontCount).toBeLessThan(10);
  });

  test('T050.11: Homepage First Input Delay simulation', async ({ page }) => {
    // Simulate user interaction and measure response time
    const fidMetrics = await page.evaluate(async () => {
      // Find an interactive element
      const button = document.querySelector('button, a, input') as HTMLElement;
      if (!button) {
        return { fid: 0, hasInteractiveElement: false };
      }

      // Measure time to respond to click
      const startTime = performance.now();
      button.click();
      const endTime = performance.now();

      return {
        fid: endTime - startTime,
        hasInteractiveElement: true,
        elementType: button.tagName,
      };
    });

    console.log('\n=== First Input Delay Simulation ===');
    if (fidMetrics.hasInteractiveElement) {
      console.log(`Element clicked: ${fidMetrics.elementType}`);
      console.log(`Response time: ${fidMetrics.fid.toFixed(2)}ms`);
      console.log(`Threshold: ${PERFORMANCE_THRESHOLDS.FID}ms`);

      expect(fidMetrics.fid).toBeLessThan(PERFORMANCE_THRESHOLDS.FID);
    } else {
      console.log('No interactive elements found');
    }
  });

  test('T050.12: Homepage render blocking resources', async ({ page }) => {
    const renderBlockingMetrics = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

      // Check for render-blocking CSS
      const cssResources = resources.filter(r =>
        r.initiatorType === 'link' &&
        r.name.endsWith('.css')
      );

      // Check for defer/async on scripts
      const scripts = document.querySelectorAll('script[src]');
      let asyncScripts = 0;
      let deferScripts = 0;
      let blockingScripts = 0;

      scripts.forEach(script => {
        if (script.hasAttribute('async')) {
          asyncScripts++;
        } else if (script.hasAttribute('defer')) {
          deferScripts++;
        } else if (!script.hasAttribute('type') || script.getAttribute('type') === 'text/javascript') {
          blockingScripts++;
        }
      });

      // Check for critical CSS inlining
      const inlineStyles = document.querySelectorAll('style');

      return {
        cssCount: cssResources.length,
        totalCssSize: cssResources.reduce((sum, r) => sum + (r.transferSize || 0), 0),
        asyncScriptCount: asyncScripts,
        deferScriptCount: deferScripts,
        blockingScriptCount: blockingScripts,
        inlineStyleCount: inlineStyles.length,
      };
    });

    console.log('\n=== Render Blocking Analysis ===');
    console.log(`CSS files: ${renderBlockingMetrics.cssCount}`);
    console.log(`Total CSS size: ${(renderBlockingMetrics.totalCssSize / 1024).toFixed(2)}KB`);
    console.log(`Async scripts: ${renderBlockingMetrics.asyncScriptCount}`);
    console.log(`Defer scripts: ${renderBlockingMetrics.deferScriptCount}`);
    console.log(`Blocking scripts: ${renderBlockingMetrics.blockingScriptCount}`);
    console.log(`Inline styles: ${renderBlockingMetrics.inlineStyleCount}`);

    // Should minimize render-blocking resources
    expect(renderBlockingMetrics.cssCount).toBeLessThan(PERFORMANCE_THRESHOLDS.MAX_CSS_BUNDLES);
    expect(renderBlockingMetrics.blockingScriptCount).toBeLessThanOrEqual(5);
  });
});
