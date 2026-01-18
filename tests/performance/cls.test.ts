/**
 * CLS (Cumulative Layout Shift) Performance Tests - T055
 *
 * Tests that CLS meets Google's recommended threshold of < 0.1
 * across key pages to ensure visual stability.
 *
 * CLS measures unexpected layout shifts that occur during the page lifecycle.
 * Lower scores indicate better visual stability.
 */
import { test, expect, Page } from '@playwright/test';

// Import helpers
import {
  THRESHOLDS,
  collectCLS,
  collectCLSEntries,
  checkImageDimensions,
  checkFontLoading,
  evaluateMetric,
  formatMetric,
  CLSEntry,
} from './helpers/metrics';

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3090';
const CLS_THRESHOLD = THRESHOLDS.CLS.GOOD; // 0.1
const CLS_THRESHOLD_ACCEPTABLE = THRESHOLDS.CLS.NEEDS_IMPROVEMENT; // 0.25

/**
 * Setup CLS observer on page with detailed tracking
 */
async function setupCLSObserver(page: Page): Promise<void> {
  await page.evaluate(() => {
    (window as any).__clsValue = 0;
    (window as any).__clsEntries = [];
    (window as any).__sessionValue = 0;
    (window as any).__sessionEntries = [];

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const layoutShift = entry as any;

        // Only count if there wasn't recent user input
        if (!layoutShift.hadRecentInput) {
          const firstSessionEntry = (window as any).__sessionEntries[0];
          const lastSessionEntry =
            (window as any).__sessionEntries[(window as any).__sessionEntries.length - 1];

          // Session window: entries within 1s gap, max 5s duration
          if (
            (window as any).__sessionValue &&
            lastSessionEntry &&
            entry.startTime - lastSessionEntry.startTime < 1000 &&
            firstSessionEntry &&
            entry.startTime - firstSessionEntry.startTime < 5000
          ) {
            (window as any).__sessionValue += layoutShift.value;
            (window as any).__sessionEntries.push(entry);
          } else {
            (window as any).__sessionValue = layoutShift.value;
            (window as any).__sessionEntries = [entry];
          }

          // Track max session value as CLS
          if ((window as any).__sessionValue > (window as any).__clsValue) {
            (window as any).__clsValue = (window as any).__sessionValue;
          }

          // Store entry details
          (window as any).__clsEntries.push({
            value: layoutShift.value,
            startTime: entry.startTime,
            hadRecentInput: layoutShift.hadRecentInput,
            sources: (layoutShift.sources || []).map((source: any) => ({
              node: source.node?.tagName || 'unknown',
              nodeId: source.node?.id || '',
              nodeClass: source.node?.className || '',
              previousRect: source.previousRect
                ? {
                    x: source.previousRect.x,
                    y: source.previousRect.y,
                    width: source.previousRect.width,
                    height: source.previousRect.height,
                  }
                : null,
              currentRect: source.currentRect
                ? {
                    x: source.currentRect.x,
                    y: source.currentRect.y,
                    width: source.currentRect.width,
                    height: source.currentRect.height,
                  }
                : null,
            })),
          });
        }
      }
    });

    try {
      observer.observe({ type: 'layout-shift', buffered: true });
    } catch (e) {
      console.warn('Layout shift observer not supported');
    }

    (window as any).__clsObserver = observer;
  });
}

/**
 * Collect CLS value and entries
 */
async function collectCLSData(page: Page): Promise<{
  cls: number;
  entries: any[];
}> {
  return page.evaluate(() => {
    if ((window as any).__clsObserver) {
      (window as any).__clsObserver.disconnect();
    }

    return {
      cls: (window as any).__clsValue || 0,
      entries: (window as any).__clsEntries || [],
    };
  });
}

/**
 * Log CLS result with details
 */
function logCLSResult(pageName: string, cls: number, entries: any[]): void {
  const rating = evaluateMetric(cls, THRESHOLDS.CLS);
  console.log(formatMetric(`${pageName} CLS`, cls, '', rating));

  if (entries.length > 0) {
    console.log(`  - Layout shift events: ${entries.length}`);

    // Log top contributors
    const sorted = [...entries].sort((a, b) => b.value - a.value);
    const topShifts = sorted.slice(0, 3);

    topShifts.forEach((shift, i) => {
      console.log(`  - Shift ${i + 1}: ${shift.value.toFixed(4)}`);
      if (shift.sources && shift.sources.length > 0) {
        shift.sources.forEach((source: any) => {
          const nodeInfo = `${source.node}${source.nodeId ? '#' + source.nodeId : ''}${source.nodeClass ? '.' + source.nodeClass.split(' ')[0] : ''}`;
          console.log(`    - Element: ${nodeInfo}`);
        });
      }
    });
  }
}

// =============================================================================
// TEST SUITE: Homepage CLS Tests
// =============================================================================

test.describe('T055: CLS Performance Tests - Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test('T055.1: Homepage CLS should be under 0.1', async ({ page }) => {
    await setupCLSObserver(page);

    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    // Wait for all content to settle
    await page.waitForTimeout(2000);

    const { cls, entries } = await collectCLSData(page);

    logCLSResult('Homepage', cls, entries);

    expect(cls).toBeLessThan(CLS_THRESHOLD);
  });

  test('T055.2: Homepage images should have explicit dimensions', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    const imageDimensions = await checkImageDimensions(page);

    console.log(`Total images found: ${imageDimensions.length}`);

    let imagesWithoutDimensions = 0;

    imageDimensions.forEach((img) => {
      if (!img.hasWidth && !img.hasHeight) {
        imagesWithoutDimensions++;
        console.log(`  [WARN] Image without dimensions: ${img.src}`);
      }
    });

    console.log(`Images without explicit dimensions: ${imagesWithoutDimensions}`);

    // At least 80% of images should have explicit dimensions
    const percentageWithDimensions =
      imageDimensions.length > 0
        ? ((imageDimensions.length - imagesWithoutDimensions) / imageDimensions.length) * 100
        : 100;

    expect(percentageWithDimensions).toBeGreaterThan(80);
  });

  test('T055.3: Homepage fonts should not cause layout shift', async ({ page }) => {
    await setupCLSObserver(page);

    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

    // Check font loading
    const fontInfo = await checkFontLoading(page);

    console.log(`Fonts loaded: ${fontInfo.fontsLoaded}`);
    console.log(`Font count: ${fontInfo.fontCount}`);
    console.log(`Font families: ${fontInfo.fontFamilies.join(', ')}`);

    // Wait for fonts and content to settle
    await page.waitForTimeout(2000);

    const { cls, entries } = await collectCLSData(page);

    // Filter font-related shifts (usually text elements)
    const textShifts = entries.filter(
      (e) =>
        e.sources?.some((s: any) =>
          ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'SPAN', 'A'].includes(s.node)
        )
    );

    console.log(`Font-related layout shifts: ${textShifts.length}`);

    if (textShifts.length > 0) {
      const textCLS = textShifts.reduce((sum, e) => sum + e.value, 0);
      console.log(`Font-related CLS: ${textCLS.toFixed(4)}`);
    }

    expect(cls).toBeLessThan(CLS_THRESHOLD);
  });

  test('T055.4: Homepage hero section should be stable', async ({ page }) => {
    await setupCLSObserver(page);

    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    // Wait for hero content
    await page.waitForTimeout(2000);

    const { cls, entries } = await collectCLSData(page);

    // Check for shifts in hero area (top portion of viewport)
    const heroShifts = entries.filter((e) => {
      return e.sources?.some((s: any) => {
        const rect = s.currentRect || s.previousRect;
        return rect && rect.y < 600; // Top 600px is likely hero
      });
    });

    console.log(`Hero section layout shifts: ${heroShifts.length}`);

    if (heroShifts.length > 0) {
      const heroCLS = heroShifts.reduce((sum, e) => sum + e.value, 0);
      console.log(`Hero section CLS: ${heroCLS.toFixed(4)}`);
      expect(heroCLS).toBeLessThan(0.05); // Hero should be extra stable
    }

    expect(cls).toBeLessThan(CLS_THRESHOLD);
  });
});

// =============================================================================
// TEST SUITE: Search Page CLS Tests
// =============================================================================

test.describe('T055: CLS Performance Tests - Search Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test('T055.5: Search page CLS should be under 0.1', async ({ page }) => {
    await setupCLSObserver(page);

    await page.goto(`${BASE_URL}/search`, { waitUntil: 'networkidle' });

    await page.waitForTimeout(2000);

    const { cls, entries } = await collectCLSData(page);

    logCLSResult('Search Page', cls, entries);

    expect(cls).toBeLessThan(CLS_THRESHOLD);
  });

  test('T055.6: Search results loading should not cause layout shift', async ({
    page,
  }) => {
    await setupCLSObserver(page);

    await page.goto(`${BASE_URL}/search`, { waitUntil: 'networkidle' });

    // Trigger a search
    const searchInput = page.locator('input[type="text"], input[type="search"]').first();

    if (await searchInput.isVisible()) {
      await searchInput.fill('camping');
      await searchInput.press('Enter');

      // Wait for results to load
      await page.waitForTimeout(3000);
    }

    const { cls, entries } = await collectCLSData(page);

    logCLSResult('Search Results Loading', cls, entries);

    // Results loading should not cause significant shifts
    expect(cls).toBeLessThan(CLS_THRESHOLD_ACCEPTABLE);
  });

  test('T055.7: Filter application should not cause layout shift', async ({ page }) => {
    await page.goto(`${BASE_URL}/search`, { waitUntil: 'networkidle' });

    // Clear any initial CLS
    await page.waitForTimeout(1000);

    // Setup observer after initial load
    await setupCLSObserver(page);

    // Apply filter
    const filterCheckbox = page.locator(
      'input[type="checkbox"], [role="checkbox"]'
    ).first();

    if (await filterCheckbox.isVisible().catch(() => false)) {
      await filterCheckbox.click();
      await page.waitForTimeout(1500);
    }

    const { cls, entries } = await collectCLSData(page);

    logCLSResult('Filter Application', cls, entries);

    // Filtering should be smooth without layout shifts
    expect(cls).toBeLessThan(CLS_THRESHOLD);
  });

  test('T055.8: Pagination should not cause layout shift', async ({ page }) => {
    await page.goto(`${BASE_URL}/search`, { waitUntil: 'networkidle' });

    // Wait for initial content
    await page.waitForTimeout(1000);

    // Setup observer
    await setupCLSObserver(page);

    // Click pagination if available
    const nextButton = page.locator(
      'button:has-text("Next"), button:has-text("ถัดไป"), [aria-label="Next page"]'
    ).first();

    if (await nextButton.isVisible().catch(() => false)) {
      await nextButton.click();
      await page.waitForTimeout(2000);
    }

    const { cls, entries } = await collectCLSData(page);

    logCLSResult('Pagination', cls, entries);

    expect(cls).toBeLessThan(CLS_THRESHOLD);
  });

  test('T055.9: Campsite cards should have consistent height', async ({ page }) => {
    await page.goto(`${BASE_URL}/search`, { waitUntil: 'networkidle' });

    // Get card heights
    const cardHeights = await page.evaluate(() => {
      const cards = document.querySelectorAll(
        '[data-testid="campsite-card"], article, .campsite-card'
      );
      return Array.from(cards).map((card) => ({
        height: card.getBoundingClientRect().height,
        hasImage: card.querySelector('img') !== null,
      }));
    });

    if (cardHeights.length > 1) {
      console.log(`Found ${cardHeights.length} campsite cards`);

      // Calculate height variance
      const heights = cardHeights.map((c) => c.height).filter((h) => h > 0);

      if (heights.length > 1) {
        const avgHeight = heights.reduce((a, b) => a + b, 0) / heights.length;
        const maxVariance = Math.max(...heights.map((h) => Math.abs(h - avgHeight)));

        console.log(`Average card height: ${avgHeight.toFixed(2)}px`);
        console.log(`Max height variance: ${maxVariance.toFixed(2)}px`);

        // Cards should have reasonably consistent heights
        const variancePercent = (maxVariance / avgHeight) * 100;
        expect(variancePercent).toBeLessThan(30); // Within 30% variance
      }
    } else {
      console.log('[SKIP] Not enough cards to compare heights');
    }
  });
});

// =============================================================================
// TEST SUITE: Campsite Detail CLS Tests
// =============================================================================

test.describe('T055: CLS Performance Tests - Campsite Detail', () => {
  const SAMPLE_CAMPSITE_ID = '1';

  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test('T055.10: Campsite detail page CLS should be under 0.1', async ({ page }) => {
    await setupCLSObserver(page);

    await page.goto(`${BASE_URL}/campsites/${SAMPLE_CAMPSITE_ID}`, {
      waitUntil: 'networkidle',
    });

    await page.waitForTimeout(2000);

    const { cls, entries } = await collectCLSData(page);

    logCLSResult('Campsite Detail', cls, entries);

    expect(cls).toBeLessThan(CLS_THRESHOLD);
  });

  test('T055.11: Gallery images should not shift when loading', async ({ page }) => {
    await setupCLSObserver(page);

    await page.goto(`${BASE_URL}/campsites/${SAMPLE_CAMPSITE_ID}`, {
      waitUntil: 'networkidle',
    });

    // Check gallery image dimensions
    const galleryImages = await page.evaluate(() => {
      const images = document.querySelectorAll(
        '[data-testid="gallery"] img, .gallery img, img[alt*="gallery"]'
      );
      return Array.from(images).map((img: HTMLImageElement) => ({
        src: img.src.substring(0, 50),
        hasWidth: img.hasAttribute('width') || img.style.width !== '',
        hasHeight: img.hasAttribute('height') || img.style.height !== '',
        aspectRatio: img.hasAttribute('style')
          ? img.style.aspectRatio
          : '',
      }));
    });

    console.log(`Gallery images found: ${galleryImages.length}`);

    galleryImages.forEach((img) => {
      if (!img.hasWidth || !img.hasHeight) {
        console.log(`  [WARN] Gallery image without dimensions: ${img.src}...`);
      }
    });

    await page.waitForTimeout(2000);

    const { cls, entries } = await collectCLSData(page);

    // Filter image-related shifts
    const imageShifts = entries.filter((e) =>
      e.sources?.some((s: any) => s.node === 'IMG')
    );

    if (imageShifts.length > 0) {
      const imageCLS = imageShifts.reduce((sum, e) => sum + e.value, 0);
      console.log(`Image-related CLS: ${imageCLS.toFixed(4)}`);
    }

    expect(cls).toBeLessThan(CLS_THRESHOLD);
  });

  test('T055.12: Reviews section should load without shifts', async ({ page }) => {
    await page.goto(`${BASE_URL}/campsites/${SAMPLE_CAMPSITE_ID}`, {
      waitUntil: 'networkidle',
    });

    // Scroll to reviews section
    const reviewsSection = page.locator(
      '[data-testid="reviews-section"], #reviews, .reviews'
    ).first();

    if (await reviewsSection.isVisible().catch(() => false)) {
      // Setup observer before scrolling
      await setupCLSObserver(page);

      await reviewsSection.scrollIntoViewIfNeeded();
      await page.waitForTimeout(2000);

      const { cls, entries } = await collectCLSData(page);

      logCLSResult('Reviews Section', cls, entries);

      expect(cls).toBeLessThan(CLS_THRESHOLD);
    } else {
      console.log('[SKIP] Reviews section not found');
    }
  });

  test('T055.13: Map section should have reserved space', async ({ page }) => {
    await setupCLSObserver(page);

    await page.goto(`${BASE_URL}/campsites/${SAMPLE_CAMPSITE_ID}`, {
      waitUntil: 'networkidle',
    });

    // Check map container dimensions
    const mapContainer = await page.evaluate(() => {
      const map = document.querySelector(
        '[data-testid="map"], .map-container, #map'
      ) as HTMLElement;
      if (map) {
        const style = getComputedStyle(map);
        return {
          found: true,
          hasMinHeight: style.minHeight !== '' && style.minHeight !== 'auto',
          hasAspectRatio: style.aspectRatio !== '',
          height: map.offsetHeight,
        };
      }
      return { found: false };
    });

    if (mapContainer.found) {
      console.log('Map container dimensions:', mapContainer);
      // Map should have reserved height
      expect(mapContainer.hasMinHeight || mapContainer.height > 0).toBeTruthy();
    }

    await page.waitForTimeout(2000);

    const { cls } = await collectCLSData(page);

    expect(cls).toBeLessThan(CLS_THRESHOLD);
  });
});

// =============================================================================
// TEST SUITE: Dynamic Content CLS Tests
// =============================================================================

test.describe('T055: Dynamic Content CLS Tests', () => {
  test('T055.14: Skeleton loaders should match content size', async ({ page }) => {
    // Intercept API calls to slow them down
    await page.route('**/api/**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      await route.continue();
    });

    await setupCLSObserver(page);

    await page.goto(`${BASE_URL}/search`, { waitUntil: 'commit' });

    // Wait for skeletons to appear and then be replaced
    await page.waitForTimeout(2000);

    const { cls, entries } = await collectCLSData(page);

    logCLSResult('Skeleton Loading', cls, entries);

    // Skeleton to content transition should be smooth
    expect(cls).toBeLessThan(CLS_THRESHOLD);
  });

  test('T055.15: Lazy-loaded content should not cause shift', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    // Wait for initial content
    await page.waitForTimeout(1000);

    // Setup observer before scrolling
    await setupCLSObserver(page);

    // Scroll down to trigger lazy loading
    await page.evaluate(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    });

    // Wait for lazy content to load
    await page.waitForTimeout(3000);

    const { cls, entries } = await collectCLSData(page);

    logCLSResult('Lazy Loading', cls, entries);

    // Lazy loaded content should have placeholders
    expect(cls).toBeLessThan(CLS_THRESHOLD_ACCEPTABLE);
  });

  test('T055.16: Modal/dialog opening should not shift background', async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/search`, { waitUntil: 'networkidle' });

    await page.waitForTimeout(1000);

    await setupCLSObserver(page);

    // Try to open a modal/dialog
    const modalTrigger = page.locator(
      'button:has-text("Filter"), button:has-text("ตัวกรอง"), [data-testid="modal-trigger"]'
    ).first();

    if (await modalTrigger.isVisible().catch(() => false)) {
      await modalTrigger.click();
      await page.waitForTimeout(500);

      // Close modal if opened
      const closeButton = page.locator(
        'button[aria-label="Close"], button:has-text("Close"), [data-testid="modal-close"]'
      ).first();

      if (await closeButton.isVisible().catch(() => false)) {
        await closeButton.click();
      } else {
        await page.keyboard.press('Escape');
      }

      await page.waitForTimeout(500);
    }

    const { cls, entries } = await collectCLSData(page);

    logCLSResult('Modal Toggle', cls, entries);

    // Modal should not shift background content
    expect(cls).toBeLessThan(CLS_THRESHOLD);
  });

  test('T055.17: Toast/notification should not cause shift', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    await setupCLSObserver(page);

    // Trigger an action that might show a toast
    const wishlistButton = page.locator(
      '[data-testid="wishlist-button"], button[aria-label*="wishlist"]'
    ).first();

    if (await wishlistButton.isVisible().catch(() => false)) {
      await wishlistButton.click();
      await page.waitForTimeout(1500);
    }

    const { cls, entries } = await collectCLSData(page);

    logCLSResult('Toast Notification', cls, entries);

    // Toasts should appear without shifting content
    expect(cls).toBeLessThan(CLS_THRESHOLD);
  });
});

// =============================================================================
// TEST SUITE: Mobile CLS Tests
// =============================================================================

test.describe('T055: Mobile CLS Tests', () => {
  test.use({
    viewport: { width: 375, height: 667 },
  });

  test('T055.18: Mobile homepage CLS should be under 0.1', async ({ page }) => {
    await setupCLSObserver(page);

    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    await page.waitForTimeout(2000);

    const { cls, entries } = await collectCLSData(page);

    logCLSResult('Mobile Homepage', cls, entries);

    expect(cls).toBeLessThan(CLS_THRESHOLD);
  });

  test('T055.19: Mobile menu toggle should not cause shift', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    await page.waitForTimeout(1000);

    await setupCLSObserver(page);

    // Toggle mobile menu
    const menuButton = page.locator(
      'button[aria-label*="menu"], button[aria-label*="Menu"], [data-testid="mobile-menu"]'
    ).first();

    if (await menuButton.isVisible().catch(() => false)) {
      await menuButton.click();
      await page.waitForTimeout(500);

      // Close menu
      await menuButton.click();
      await page.waitForTimeout(500);
    }

    const { cls, entries } = await collectCLSData(page);

    logCLSResult('Mobile Menu Toggle', cls, entries);

    expect(cls).toBeLessThan(CLS_THRESHOLD);
  });

  test('T055.20: Mobile search page should be stable', async ({ page }) => {
    await setupCLSObserver(page);

    await page.goto(`${BASE_URL}/search`, { waitUntil: 'networkidle' });

    await page.waitForTimeout(2000);

    const { cls, entries } = await collectCLSData(page);

    logCLSResult('Mobile Search', cls, entries);

    expect(cls).toBeLessThan(CLS_THRESHOLD);
  });
});

// =============================================================================
// TEST SUITE: Ad/Banner Space CLS Tests
// =============================================================================

test.describe('T055: Banner and Ad Space CLS Tests', () => {
  test('T055.21: Header/navigation should be stable', async ({ page }) => {
    await setupCLSObserver(page);

    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    await page.waitForTimeout(2000);

    const { cls, entries } = await collectCLSData(page);

    // Check for header shifts
    const headerShifts = entries.filter((e) =>
      e.sources?.some((s: any) =>
        ['HEADER', 'NAV'].includes(s.node) ||
        s.nodeClass?.includes('header') ||
        s.nodeClass?.includes('nav')
      )
    );

    if (headerShifts.length > 0) {
      const headerCLS = headerShifts.reduce((sum, e) => sum + e.value, 0);
      console.log(`Header/Nav CLS: ${headerCLS.toFixed(4)}`);
      // Header should be completely stable
      expect(headerCLS).toBeLessThan(0.01);
    }

    expect(cls).toBeLessThan(CLS_THRESHOLD);
  });

  test('T055.22: Footer should not shift during load', async ({ page }) => {
    await setupCLSObserver(page);

    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    // Scroll to footer
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });

    await page.waitForTimeout(2000);

    const { cls, entries } = await collectCLSData(page);

    // Check for footer shifts
    const footerShifts = entries.filter((e) =>
      e.sources?.some((s: any) =>
        s.node === 'FOOTER' || s.nodeClass?.includes('footer')
      )
    );

    if (footerShifts.length > 0) {
      const footerCLS = footerShifts.reduce((sum, e) => sum + e.value, 0);
      console.log(`Footer CLS: ${footerCLS.toFixed(4)}`);
    }

    expect(cls).toBeLessThan(CLS_THRESHOLD);
  });

  test('T055.23: Sticky elements should not cause layout shift', async ({ page }) => {
    await setupCLSObserver(page);

    await page.goto(`${BASE_URL}/search`, { waitUntil: 'networkidle' });

    // Scroll down and back up to test sticky behavior
    await page.evaluate(() => {
      window.scrollTo(0, 500);
    });

    await page.waitForTimeout(500);

    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });

    await page.waitForTimeout(1000);

    const { cls, entries } = await collectCLSData(page);

    logCLSResult('Sticky Elements', cls, entries);

    expect(cls).toBeLessThan(CLS_THRESHOLD);
  });

  test('T055.24: Banner/promotional areas should have reserved space', async ({
    page,
  }) => {
    await setupCLSObserver(page);

    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    // Check for banner elements
    const banners = await page.evaluate(() => {
      const bannerElements = document.querySelectorAll(
        '[data-testid="banner"], .banner, .promo, [role="banner"]:not(header)'
      );
      return Array.from(bannerElements).map((el: Element) => {
        const htmlEl = el as HTMLElement;
        const style = getComputedStyle(htmlEl);
        return {
          tag: htmlEl.tagName,
          hasMinHeight: style.minHeight !== '' && style.minHeight !== 'auto',
          height: htmlEl.offsetHeight,
        };
      });
    });

    console.log(`Banner elements found: ${banners.length}`);
    banners.forEach((banner, i) => {
      console.log(`  Banner ${i + 1}: height=${banner.height}px, hasMinHeight=${banner.hasMinHeight}`);
    });

    await page.waitForTimeout(2000);

    const { cls } = await collectCLSData(page);

    expect(cls).toBeLessThan(CLS_THRESHOLD);
  });
});
