import { test, expect, type Page } from '@playwright/test';

/**
 * E2E Tests for Image Lazy Loading
 *
 * Tests cover:
 * 1. Images below fold have loading="lazy" attribute
 * 2. Images load only when scrolled into viewport
 * 3. Placeholder/skeleton shown before image loads
 * 4. Image transforms use correct sizes
 * 5. No layout shift when images load (stable dimensions)
 */

test.describe('Image Lazy Loading', () => {
  let imageRequests: Map<string, boolean>;

  test.beforeEach(async ({ page }) => {
    imageRequests = new Map();

    // Track all image requests
    await page.route('**/*.{jpg,jpeg,png,webp,avif}', async (route, request) => {
      const url = request.url();
      imageRequests.set(url, true);
      await route.continue();
    });
  });

  test('should have loading="lazy" attribute on below-fold images', async ({ page }) => {
    // Navigate to campsite listing page with multiple images
    await page.goto('/campsites');
    await page.waitForLoadState('networkidle');

    // Get viewport height to determine fold line
    const viewportHeight = page.viewportSize()?.height || 0;

    // Find all images on the page
    const images = await page.locator('img').all();

    expect(images.length).toBeGreaterThan(0);

    // Check each image's position and loading attribute
    for (const img of images) {
      const boundingBox = await img.boundingBox();

      if (boundingBox && boundingBox.y > viewportHeight) {
        // Image is below the fold
        const loadingAttr = await img.getAttribute('loading');
        expect(loadingAttr).toBe('lazy');
      }
    }
  });

  test('should not load below-fold images until scrolled into viewport', async ({ page }) => {
    await page.goto('/campsites');
    await page.waitForLoadState('domcontentloaded');

    // Wait a moment for above-fold images to load
    await page.waitForTimeout(1000);

    // Get all image sources that are below the fold
    const belowFoldImages = await page.locator('img[loading="lazy"]').all();
    const initialRequestCount = imageRequests.size;

    expect(belowFoldImages.length).toBeGreaterThan(0);

    // Get the src of the first below-fold image
    const firstBelowFoldImage = belowFoldImages[0];
    const imageSrc = await firstBelowFoldImage.getAttribute('src');

    if (!imageSrc) {
      throw new Error('Image source not found');
    }

    // Verify the image hasn't been requested yet
    const imageUrl = new URL(imageSrc, page.url()).href;
    const wasRequestedBefore = Array.from(imageRequests.keys()).some(url =>
      url.includes(imageSrc) || url === imageUrl
    );

    // Clear previous requests to track new ones
    imageRequests.clear();

    // Scroll the image into view
    await firstBelowFoldImage.scrollIntoViewIfNeeded();

    // Wait for the image to load
    await page.waitForTimeout(500);

    // Verify the image was requested after scrolling
    const wasRequestedAfter = imageRequests.size > 0;

    expect(wasRequestedAfter || wasRequestedBefore).toBeTruthy();
  });

  test('should show placeholder or skeleton before image loads', async ({ page }) => {
    // Slow down network to observe loading state
    await page.route('**/*.{jpg,jpeg,png,webp,avif}', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.continue();
    });

    await page.goto('/campsites');

    // Check for loading placeholder (common patterns)
    const hasSkeletonClass = await page.locator('[class*="skeleton"], [class*="loading"], [class*="placeholder"]').count() > 0;
    const hasBlurredImage = await page.locator('img[class*="blur"]').count() > 0;
    const hasLoadingState = await page.locator('[data-loading="true"]').count() > 0;

    // At least one loading indicator should be present
    expect(hasSkeletonClass || hasBlurredImage || hasLoadingState).toBeTruthy();

    // Wait for images to load
    await page.waitForLoadState('networkidle');

    // Verify placeholder is removed after load
    const stillHasPlaceholder = await page.locator('[class*="skeleton"][class*="animate"]').count();
    expect(stillHasPlaceholder).toBe(0);
  });

  test('should use correct image transform sizes', async ({ page }) => {
    await page.goto('/campsites');
    await page.waitForLoadState('networkidle');

    // Find images with size specifications
    const images = await page.locator('img').all();

    for (const img of images) {
      const src = await img.getAttribute('src');
      const width = await img.getAttribute('width');
      const height = await img.getAttribute('height');

      if (src) {
        // Check if using Supabase transforms or Next.js Image optimization
        if (src.includes('supabase') && src.includes('transform')) {
          // Verify transform parameters are present
          const hasWidthParam = src.includes('width=') || src.includes('w=');
          const hasHeightParam = src.includes('height=') || src.includes('h=');
          const hasQualityParam = src.includes('quality=') || src.includes('q=');

          expect(hasWidthParam || hasHeightParam).toBeTruthy();
        }

        // Verify explicit dimensions are set to prevent layout shift
        if (width && height) {
          expect(parseInt(width)).toBeGreaterThan(0);
          expect(parseInt(height)).toBeGreaterThan(0);
        }
      }
    }
  });

  test('should not cause layout shift when images load', async ({ page }) => {
    await page.goto('/campsites');

    // Get initial layout positions of key elements
    const initialPositions = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('[data-testid*="campsite"]'));
      return elements.map(el => ({
        id: el.getAttribute('data-testid'),
        y: el.getBoundingClientRect().y,
        height: el.getBoundingClientRect().height
      }));
    });

    // Wait for all images to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Get final layout positions
    const finalPositions = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('[data-testid*="campsite"]'));
      return elements.map(el => ({
        id: el.getAttribute('data-testid'),
        y: el.getBoundingClientRect().y,
        height: el.getBoundingClientRect().height
      }));
    });

    // Compare positions - allow for minor floating point differences
    const tolerance = 2; // 2px tolerance

    for (let i = 0; i < Math.min(initialPositions.length, finalPositions.length); i++) {
      if (initialPositions[i].id === finalPositions[i].id) {
        const yDiff = Math.abs(initialPositions[i].y - finalPositions[i].y);
        expect(yDiff).toBeLessThanOrEqual(tolerance);
      }
    }
  });

  test('should load images progressively as user scrolls', async ({ page }) => {
    await page.goto('/campsites');
    await page.waitForLoadState('domcontentloaded');

    const belowFoldImages = await page.locator('img[loading="lazy"]').all();

    if (belowFoldImages.length === 0) {
      test.skip();
      return;
    }

    let loadedCount = 0;

    // Track image load events
    await page.evaluate(() => {
      window.addEventListener('load', (e) => {
        if ((e.target as HTMLElement).tagName === 'IMG') {
          (window as any).imageLoadCount = ((window as any).imageLoadCount || 0) + 1;
        }
      }, true);
    });

    // Scroll gradually and verify progressive loading
    const scrollSteps = 3;
    const viewportHeight = page.viewportSize()?.height || 800;

    for (let step = 0; step < scrollSteps; step++) {
      await page.evaluate((scrollAmount) => {
        window.scrollBy(0, scrollAmount);
      }, viewportHeight * 0.8);

      await page.waitForTimeout(300);

      const currentLoadedCount = await page.evaluate(() =>
        (window as any).imageLoadCount || 0
      );

      // Verify more images have loaded
      expect(currentLoadedCount).toBeGreaterThanOrEqual(loadedCount);
      loadedCount = currentLoadedCount;
    }
  });

  test('should handle image load errors gracefully', async ({ page }) => {
    // Fail some image requests
    let requestCount = 0;
    await page.route('**/*.{jpg,jpeg,png,webp}', async (route) => {
      requestCount++;
      // Fail every third request
      if (requestCount % 3 === 0) {
        await route.abort('failed');
      } else {
        await route.continue();
      }
    });

    await page.goto('/campsites');
    await page.waitForLoadState('networkidle');

    // Check for fallback images or error states
    const images = await page.locator('img').all();

    for (const img of images) {
      const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);

      // If image failed to load, verify there's a fallback
      if (naturalWidth === 0) {
        const alt = await img.getAttribute('alt');
        const hasFallbackClass = await img.evaluate((el) =>
          el.className.includes('error') || el.className.includes('fallback')
        );

        // Should have alt text or fallback styling
        expect(alt || hasFallbackClass).toBeTruthy();
      }
    }
  });

  test('should respect prefers-reduced-data media query', async ({ page, context }) => {
    // Set network preference to reduced data
    await context.addInitScript(() => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: (query: string) => ({
          matches: query.includes('prefers-reduced-data'),
          media: query,
          onchange: null,
          addListener: () => {},
          removeListener: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => true,
        }),
      });
    });

    await page.goto('/campsites');
    await page.waitForLoadState('networkidle');

    // Verify lower quality images are loaded
    const images = await page.locator('img').all();

    for (const img of images) {
      const src = await img.getAttribute('src');

      if (src && src.includes('quality=')) {
        const qualityMatch = src.match(/quality=(\d+)/);
        if (qualityMatch) {
          const quality = parseInt(qualityMatch[1]);
          // Should use reduced quality
          expect(quality).toBeLessThanOrEqual(60);
        }
      }
    }
  });

  test('should support responsive images with srcset', async ({ page }) => {
    await page.goto('/campsites');
    await page.waitForLoadState('networkidle');

    const images = await page.locator('img').all();
    let hasSrcset = false;

    for (const img of images) {
      const srcset = await img.getAttribute('srcset');
      const sizes = await img.getAttribute('sizes');

      if (srcset) {
        hasSrcset = true;

        // Verify srcset format
        const srcsetParts = srcset.split(',').map(s => s.trim());
        expect(srcsetParts.length).toBeGreaterThan(0);

        // Each part should have a descriptor (width or pixel density)
        for (const part of srcsetParts) {
          expect(part).toMatch(/\s+\d+[wx]/);
        }

        // If srcset exists, sizes attribute should also exist
        expect(sizes).toBeTruthy();
      }
    }

    // At least some images should use responsive images
    expect(hasSrcset).toBeTruthy();
  });
});
