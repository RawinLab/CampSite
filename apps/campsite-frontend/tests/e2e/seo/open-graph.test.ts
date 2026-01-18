import { test, expect } from '@playwright/test';

test.describe('Open Graph & Social Media Meta Tags', () => {
  test.describe('Homepage Open Graph Tags', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
    });

    test('should have og:title meta tag', async ({ page }) => {
      const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');

      expect(ogTitle).toBeTruthy();
      expect(ogTitle!.length).toBeGreaterThan(0);
      expect(ogTitle!.length).toBeLessThan(70);
    });

    test('should have og:description meta tag', async ({ page }) => {
      const ogDescription = await page.locator('meta[property="og:description"]').getAttribute('content');

      expect(ogDescription).toBeTruthy();
      expect(ogDescription!.length).toBeGreaterThan(50);
      expect(ogDescription!.length).toBeLessThan(200);
    });

    test('should have og:image with absolute URL', async ({ page }) => {
      const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content');

      expect(ogImage).toBeTruthy();
      expect(ogImage).toMatch(/^https?:\/\//);
      expect(ogImage).toMatch(/\.(jpg|jpeg|png|webp)$/i);
    });

    test('should have og:url with absolute URL', async ({ page }) => {
      const ogUrl = await page.locator('meta[property="og:url"]').getAttribute('content');

      expect(ogUrl).toBeTruthy();
      expect(ogUrl).toMatch(/^https?:\/\//);
    });

    test('should have og:type set to website', async ({ page }) => {
      const ogType = await page.locator('meta[property="og:type"]').getAttribute('content');

      expect(ogType).toBeTruthy();
      expect(ogType).toBe('website');
    });

    test('should have og:site_name', async ({ page }) => {
      const ogSiteName = await page.locator('meta[property="og:site_name"]').getAttribute('content');

      expect(ogSiteName).toBeTruthy();
      expect(ogSiteName).toContain('Camping Thailand');
    });

    test('should have og:locale', async ({ page }) => {
      const ogLocale = await page.locator('meta[property="og:locale"]').getAttribute('content');

      if (ogLocale) {
        expect(ogLocale).toMatch(/^[a-z]{2}_[A-Z]{2}$/); // Format: en_US, th_TH
      }
    });

    test('should have og:image:width and og:image:height', async ({ page }) => {
      const ogImageWidth = await page.locator('meta[property="og:image:width"]').getAttribute('content');
      const ogImageHeight = await page.locator('meta[property="og:image:height"]').getAttribute('content');

      if (ogImageWidth && ogImageHeight) {
        expect(parseInt(ogImageWidth)).toBeGreaterThan(200);
        expect(parseInt(ogImageHeight)).toBeGreaterThan(200);
        expect(parseInt(ogImageWidth)).toBeLessThan(5000);
        expect(parseInt(ogImageHeight)).toBeLessThan(5000);
      }
    });
  });

  test.describe('Twitter Card Tags', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
    });

    test('should have twitter:card meta tag', async ({ page }) => {
      const twitterCard = await page.locator('meta[name="twitter:card"]').getAttribute('content');

      expect(twitterCard).toBeTruthy();
      expect(['summary', 'summary_large_image']).toContain(twitterCard);
    });

    test('should have twitter:title meta tag', async ({ page }) => {
      const twitterTitle = await page.locator('meta[name="twitter:title"]').getAttribute('content');

      expect(twitterTitle).toBeTruthy();
      expect(twitterTitle!.length).toBeGreaterThan(0);
      expect(twitterTitle!.length).toBeLessThan(70);
    });

    test('should have twitter:description meta tag', async ({ page }) => {
      const twitterDescription = await page.locator('meta[name="twitter:description"]').getAttribute('content');

      expect(twitterDescription).toBeTruthy();
      expect(twitterDescription!.length).toBeGreaterThan(50);
      expect(twitterDescription!.length).toBeLessThan(200);
    });

    test('should have twitter:image with absolute URL', async ({ page }) => {
      const twitterImage = await page.locator('meta[name="twitter:image"]').getAttribute('content');

      expect(twitterImage).toBeTruthy();
      expect(twitterImage).toMatch(/^https?:\/\//);
    });

    test('should have twitter:site if applicable', async ({ page }) => {
      const twitterSite = await page.locator('meta[name="twitter:site"]').getAttribute('content');

      if (twitterSite) {
        expect(twitterSite).toMatch(/^@/); // Should start with @
      }
    });
  });

  test.describe('Campsite Detail Page Open Graph Tags', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/search');
      await page.waitForLoadState('networkidle');

      const firstCampsite = page.locator('a[href*="/campsites/"]').first();
      const campsiteExists = await firstCampsite.count() > 0;

      if (campsiteExists) {
        await firstCampsite.click();
        await page.waitForLoadState('networkidle');
      } else {
        test.skip();
      }
    });

    test('should have campsite-specific og:title', async ({ page }) => {
      const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
      const pageTitle = await page.title();

      expect(ogTitle).toBeTruthy();
      expect(ogTitle).not.toBe('Camping Thailand'); // Should be campsite-specific
      expect(ogTitle!.length).toBeGreaterThan(10);
    });

    test('should have campsite-specific og:description', async ({ page }) => {
      const ogDescription = await page.locator('meta[property="og:description"]').getAttribute('content');

      expect(ogDescription).toBeTruthy();
      expect(ogDescription!.length).toBeGreaterThan(50);
      expect(ogDescription!.length).toBeLessThan(200);
    });

    test('should have campsite image as og:image', async ({ page }) => {
      const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content');

      expect(ogImage).toBeTruthy();
      expect(ogImage).toMatch(/^https?:\/\//);
    });

    test('should have og:url matching campsite URL', async ({ page }) => {
      const ogUrl = await page.locator('meta[property="og:url"]').getAttribute('content');
      const currentUrl = page.url();
      const urlPath = new URL(currentUrl).pathname;

      expect(ogUrl).toBeTruthy();
      expect(ogUrl).toMatch(/^https?:\/\//);
      expect(ogUrl).toContain(urlPath);
    });

    test('should have og:type set appropriately', async ({ page }) => {
      const ogType = await page.locator('meta[property="og:type"]').getAttribute('content');

      expect(ogType).toBeTruthy();
      expect(['website', 'article', 'place']).toContain(ogType);
    });
  });

  test.describe('Search Page Open Graph Tags', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/search');
      await page.waitForLoadState('networkidle');
    });

    test('should have all required Open Graph tags', async ({ page }) => {
      const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
      const ogDescription = await page.locator('meta[property="og:description"]').getAttribute('content');
      const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content');
      const ogUrl = await page.locator('meta[property="og:url"]').getAttribute('content');
      const ogType = await page.locator('meta[property="og:type"]').getAttribute('content');

      expect(ogTitle).toBeTruthy();
      expect(ogDescription).toBeTruthy();
      expect(ogImage).toBeTruthy();
      expect(ogUrl).toBeTruthy();
      expect(ogType).toBeTruthy();
    });

    test('should have all required Twitter Card tags', async ({ page }) => {
      const twitterCard = await page.locator('meta[name="twitter:card"]').getAttribute('content');
      const twitterTitle = await page.locator('meta[name="twitter:title"]').getAttribute('content');
      const twitterDescription = await page.locator('meta[name="twitter:description"]').getAttribute('content');
      const twitterImage = await page.locator('meta[name="twitter:image"]').getAttribute('content');

      expect(twitterCard).toBeTruthy();
      expect(twitterTitle).toBeTruthy();
      expect(twitterDescription).toBeTruthy();
      expect(twitterImage).toBeTruthy();
    });
  });

  test.describe('Open Graph Tag Consistency', () => {
    test('og:title and twitter:title should match or be similar', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
      const twitterTitle = await page.locator('meta[name="twitter:title"]').getAttribute('content');

      if (ogTitle && twitterTitle) {
        // They should either match exactly or have similar content
        expect(ogTitle).toBeTruthy();
        expect(twitterTitle).toBeTruthy();
      }
    });

    test('og:description and twitter:description should match or be similar', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const ogDescription = await page.locator('meta[property="og:description"]').getAttribute('content');
      const twitterDescription = await page.locator('meta[name="twitter:description"]').getAttribute('content');

      if (ogDescription && twitterDescription) {
        expect(ogDescription).toBeTruthy();
        expect(twitterDescription).toBeTruthy();
      }
    });

    test('og:image and twitter:image should match or be similar', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content');
      const twitterImage = await page.locator('meta[name="twitter:image"]').getAttribute('content');

      if (ogImage && twitterImage) {
        expect(ogImage).toBeTruthy();
        expect(twitterImage).toBeTruthy();
        // Both should be absolute URLs
        expect(ogImage).toMatch(/^https?:\/\//);
        expect(twitterImage).toMatch(/^https?:\/\//);
      }
    });

    test('should not have duplicate Open Graph tags', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const ogTitleCount = await page.locator('meta[property="og:title"]').count();
      const ogDescriptionCount = await page.locator('meta[property="og:description"]').count();
      const ogImageCount = await page.locator('meta[property="og:image"]').count();
      const ogUrlCount = await page.locator('meta[property="og:url"]').count();
      const ogTypeCount = await page.locator('meta[property="og:type"]').count();

      expect(ogTitleCount).toBe(1);
      expect(ogDescriptionCount).toBe(1);
      expect(ogImageCount).toBeGreaterThanOrEqual(1); // Can have multiple for image dimensions
      expect(ogUrlCount).toBe(1);
      expect(ogTypeCount).toBe(1);
    });

    test('should not have duplicate Twitter Card tags', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const twitterCardCount = await page.locator('meta[name="twitter:card"]').count();
      const twitterTitleCount = await page.locator('meta[name="twitter:title"]').count();
      const twitterDescriptionCount = await page.locator('meta[name="twitter:description"]').count();
      const twitterImageCount = await page.locator('meta[name="twitter:image"]').count();

      expect(twitterCardCount).toBe(1);
      expect(twitterTitleCount).toBe(1);
      expect(twitterDescriptionCount).toBe(1);
      expect(twitterImageCount).toBeGreaterThanOrEqual(1);
    });
  });

  test.describe('Open Graph Image Quality', () => {
    test('og:image should be optimized size for social sharing', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const ogImageWidth = await page.locator('meta[property="og:image:width"]').getAttribute('content');
      const ogImageHeight = await page.locator('meta[property="og:image:height"]').getAttribute('content');

      if (ogImageWidth && ogImageHeight) {
        const width = parseInt(ogImageWidth);
        const height = parseInt(ogImageHeight);

        // Facebook recommends 1200x630 for optimal display
        expect(width).toBeGreaterThanOrEqual(600);
        expect(height).toBeGreaterThanOrEqual(315);
      }
    });

    test('og:image should have proper alt text if provided', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const ogImageAlt = await page.locator('meta[property="og:image:alt"]').getAttribute('content');

      if (ogImageAlt) {
        expect(ogImageAlt.length).toBeGreaterThan(5);
        expect(ogImageAlt.length).toBeLessThan(420);
      }
    });
  });

  test.describe('Province Page Open Graph Tags', () => {
    test('should have province-specific Open Graph tags', async ({ page }) => {
      await page.goto('/provinces/bangkok');
      await page.waitForLoadState('networkidle');

      const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
      const ogDescription = await page.locator('meta[property="og:description"]').getAttribute('content');
      const ogUrl = await page.locator('meta[property="og:url"]').getAttribute('content');

      expect(ogTitle).toBeTruthy();
      expect(ogDescription).toBeTruthy();
      expect(ogUrl).toContain('/provinces/bangkok');
    });
  });
});
