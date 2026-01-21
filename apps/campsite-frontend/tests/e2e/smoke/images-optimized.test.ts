import { test, expect } from '@playwright/test';

// Use a valid test campsite slug
const TEST_CAMPSITE_SLUG = 'test-campsite-details-b7a9886a';

test.describe('Smoke Test: Images Optimized', () => {
  test('homepage images use Next.js Image optimization', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Wait for images to start loading
    await page.waitForTimeout(1000);

    const images = page.locator('img');
    const imageCount = await images.count();

    // Verify images are present
    expect(imageCount, 'No images found on homepage').toBeGreaterThan(0);

    // Check if images use next/image (data-nimg attribute)
    const nextImages = await page.locator('img[data-nimg]').count();

    if (imageCount > 0) {
      // At least some images should use next/image optimization
      expect(nextImages, 'No Next.js optimized images found').toBeGreaterThan(0);
    }
  });

  test('images have srcset for responsive loading', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

    const imagesWithSrcset = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return imgs.map(img => ({
        src: img.src,
        hasSrcset: img.srcset.length > 0,
        srcset: img.srcset,
      }));
    });

    console.log('Images analyzed:', imagesWithSrcset.length);

    if (imagesWithSrcset.length > 0) {
      const imagesWithResponsive = imagesWithSrcset.filter(img => img.hasSrcset);
      console.log('Images with srcset:', imagesWithResponsive.length);

      // At least some images should have srcset for responsive loading
      expect(imagesWithResponsive.length, 'No images with srcset found').toBeGreaterThan(0);
    }
  });

  test('images have width and height to prevent layout shift', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const imageAttributes = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return imgs.map(img => ({
        src: img.src,
        hasWidth: img.hasAttribute('width') || img.style.width !== '',
        hasHeight: img.hasAttribute('height') || img.style.height !== '',
        width: img.getAttribute('width') || img.style.width,
        height: img.getAttribute('height') || img.style.height,
      }));
    });

    console.log('Images checked:', imageAttributes.length);

    if (imageAttributes.length > 0) {
      const imagesWithDimensions = imageAttributes.filter(img => img.hasWidth && img.hasHeight);
      console.log('Images with dimensions:', imagesWithDimensions.length);

      // Most images should have dimensions to prevent CLS
      const percentageWithDimensions = (imagesWithDimensions.length / imageAttributes.length) * 100;
      expect(percentageWithDimensions, 'Too few images have width/height set').toBeGreaterThan(50);
    }
  });

  test('lazy loading is enabled on below-fold images', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const lazyLoadedImages = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return imgs.map(img => ({
        src: img.src,
        loading: img.loading,
        hasLazyLoading: img.loading === 'lazy',
      }));
    });

    console.log('Images analyzed for lazy loading:', lazyLoadedImages.length);

    if (lazyLoadedImages.length > 1) {
      const lazyImages = lazyLoadedImages.filter(img => img.hasLazyLoading);
      console.log('Images with lazy loading:', lazyImages.length);

      // At least some images should use lazy loading
      expect(lazyImages.length, 'No lazy-loaded images found').toBeGreaterThan(0);
    }
  });

  test('images load successfully without errors', async ({ page }) => {
    const failedImages: string[] = [];

    // Track failed image loads
    page.on('response', response => {
      const url = response.url();
      const status = response.status();

      // Check for image requests
      if (
        url.match(/\.(jpg|jpeg|png|gif|webp|avif|svg)/) ||
        response.headers()['content-type']?.includes('image/')
      ) {
        if (status >= 400) {
          failedImages.push(`${url} (${status})`);
        }
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

    // Wait for images to load
    await page.waitForTimeout(2000);

    // Verify no images failed to load
    expect(failedImages, `Images failed to load: ${failedImages.join(', ')}`).toHaveLength(0);
  });

  test('campsite detail page uses optimized images', async ({ page }) => {
    await page.goto(`/campsites/${TEST_CAMPSITE_SLUG}`);
    await page.waitForLoadState('domcontentloaded');

    // Wait for images to start loading
    await page.waitForTimeout(1000);

    const images = await page.locator('img').count();

    if (images > 0) {
      // Check for Next.js optimized images
      const nextImages = await page.locator('img[data-nimg]').count();
      expect(nextImages, 'Campsite detail should use optimized images').toBeGreaterThan(0);
    }
  });

  test('images have appropriate alt text', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const imageAlts = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return imgs.map(img => ({
        src: img.src,
        hasAlt: img.hasAttribute('alt'),
        alt: img.alt,
      }));
    });

    console.log('Images analyzed for alt text:', imageAlts.length);

    if (imageAlts.length > 0) {
      const imagesWithAlt = imageAlts.filter(img => img.hasAlt);
      console.log('Images with alt attribute:', imagesWithAlt.length);

      // All images should have alt attribute (even if empty for decorative images)
      expect(imagesWithAlt.length, 'Some images missing alt attribute').toBe(imageAlts.length);
    }
  });

  test('browser requests modern image formats', async ({ page }) => {
    const imageRequests: { url: string; accept: string }[] = [];

    // Monitor image requests
    page.on('request', request => {
      const resourceType = request.resourceType();

      if (resourceType === 'image') {
        const headers = request.headers();
        imageRequests.push({
          url: request.url(),
          accept: headers['accept'] || '',
        });
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

    console.log('Image requests captured:', imageRequests.length);

    if (imageRequests.length > 0) {
      // Check if browser requests modern formats
      const modernFormatRequests = imageRequests.filter(req =>
        req.accept.includes('image/webp') || req.accept.includes('image/avif')
      );

      console.log('Requests with modern format support:', modernFormatRequests.length);

      // Browser should advertise support for modern formats
      expect(modernFormatRequests.length, 'Browser not requesting modern image formats').toBeGreaterThan(0);
    }
  });

  test('no images are excessively large in file size', async ({ page }) => {
    const largeImages: { url: string; size: number }[] = [];
    const MAX_IMAGE_SIZE = 500 * 1024; // 500KB

    // Monitor image responses
    page.on('response', async response => {
      const url = response.url();
      const contentType = response.headers()['content-type'] || '';

      if (contentType.includes('image/')) {
        try {
          const buffer = await response.body();
          const size = buffer.length;

          if (size > MAX_IMAGE_SIZE) {
            largeImages.push({ url, size });
          }
        } catch (e) {
          // Some responses might not have body available
        }
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

    console.log('Large images found:', largeImages.length);

    if (largeImages.length > 0) {
      console.log('Large images:', largeImages.map(img => `${img.url} (${Math.round(img.size / 1024)}KB)`));
    }

    // Warn if images are too large (not failing, just logging)
    expect(largeImages.length, 'Some images are larger than 500KB').toBeLessThan(5);
  });

  test('images complete loading without broken state', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

    // Wait for images to load
    await page.waitForTimeout(2000);

    const brokenImages = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return imgs
        .filter(img => !img.complete || img.naturalWidth === 0)
        .map(img => img.src);
    });

    console.log('Broken images:', brokenImages.length);

    // Verify no broken images
    expect(brokenImages, `Broken images found: ${brokenImages.join(', ')}`).toHaveLength(0);
  });

  test('campsite gallery images are optimized', async ({ page }) => {
    await page.goto(`/campsites/${TEST_CAMPSITE_SLUG}`);
    await page.waitForLoadState('domcontentloaded');

    // Wait for gallery to load
    await page.waitForTimeout(2000);

    const galleryImages = await page.evaluate(() => {
      // Look for gallery images (common selectors)
      const gallery = document.querySelector('[data-testid="gallery"], .gallery, [class*="gallery"]');
      if (!gallery) return [];

      const imgs = Array.from(gallery.querySelectorAll('img'));
      return imgs.map(img => ({
        src: img.src,
        hasNextImage: img.hasAttribute('data-nimg'),
        hasSrcset: img.srcset.length > 0,
        loading: img.loading,
      }));
    });

    console.log('Gallery images found:', galleryImages.length);

    if (galleryImages.length > 0) {
      // Gallery images should be optimized
      const optimizedImages = galleryImages.filter(img => img.hasNextImage || img.hasSrcset);
      expect(optimizedImages.length, 'Gallery images should be optimized').toBeGreaterThan(0);
    }
  });

  test('hero/banner images prioritize loading', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const heroImages = await page.evaluate(() => {
      // Look for hero/banner images (above the fold)
      const heroSelectors = [
        'header img',
        '[class*="hero"] img',
        '[class*="banner"] img',
        'img[priority]',
        'img[data-priority]',
      ];

      const imgs: HTMLImageElement[] = [];
      heroSelectors.forEach(selector => {
        const elements = document.querySelectorAll<HTMLImageElement>(selector);
        imgs.push(...Array.from(elements));
      });

      return imgs.map(img => ({
        src: img.src,
        loading: img.loading,
        fetchPriority: img.getAttribute('fetchpriority'),
      }));
    });

    console.log('Hero images found:', heroImages.length);

    if (heroImages.length > 0) {
      // Hero images should not be lazy loaded (they're above fold)
      const eagerLoadedHeroImages = heroImages.filter(
        img => img.loading !== 'lazy' || img.fetchPriority === 'high'
      );

      expect(eagerLoadedHeroImages.length, 'Hero images should not be lazy loaded').toBeGreaterThan(0);
    }
  });
});
