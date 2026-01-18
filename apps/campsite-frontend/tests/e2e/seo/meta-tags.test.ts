import { test, expect } from '@playwright/test';

test.describe('Meta Tags - SEO Verification', () => {
  test.describe('Homepage Meta Tags', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
    });

    test('should have appropriate title tag', async ({ page }) => {
      const title = await page.title();

      expect(title).toBeTruthy();
      expect(title.length).toBeGreaterThan(10);
      expect(title.length).toBeLessThan(70); // SEO best practice: < 70 chars
      expect(title).toContain('Camping Thailand');
    });

    test('should have meta description within optimal length', async ({ page }) => {
      const metaDescription = await page.locator('meta[name="description"]').getAttribute('content');

      expect(metaDescription).toBeTruthy();
      expect(metaDescription!.length).toBeGreaterThan(50);
      expect(metaDescription!.length).toBeLessThan(160); // SEO best practice: 50-160 chars
      expect(metaDescription).toContain('camp');
    });

    test('should have canonical URL pointing to homepage', async ({ page }) => {
      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');

      expect(canonical).toBeTruthy();
      expect(canonical).toMatch(/^https?:\/\//); // Should be absolute URL
      expect(canonical).toMatch(/\/$|\/$/); // Should end with / or be root
    });

    test('should have only one canonical link tag', async ({ page }) => {
      const canonicalCount = await page.locator('link[rel="canonical"]').count();
      expect(canonicalCount).toBe(1);
    });

    test('should have viewport meta tag', async ({ page }) => {
      const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');

      expect(viewport).toBeTruthy();
      expect(viewport).toContain('width=device-width');
      expect(viewport).toContain('initial-scale=1');
    });

    test('should have charset meta tag', async ({ page }) => {
      const charset = await page.locator('meta[charset]').getAttribute('charset');

      expect(charset).toBeTruthy();
      expect(charset?.toLowerCase()).toBe('utf-8');
    });

    test('should have language attribute on html tag', async ({ page }) => {
      const htmlLang = await page.locator('html').getAttribute('lang');

      expect(htmlLang).toBeTruthy();
      expect(htmlLang).toMatch(/^[a-z]{2}(-[A-Z]{2})?$/); // Format: en, en-US, th, th-TH
    });

    test('should not have noindex meta tag on homepage', async ({ page }) => {
      const robotsMeta = await page.locator('meta[name="robots"]').getAttribute('content');

      if (robotsMeta) {
        expect(robotsMeta).not.toContain('noindex');
      }
    });
  });

  test.describe('Search Page Meta Tags', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/search');
      await page.waitForLoadState('networkidle');
    });

    test('should have descriptive title for search page', async ({ page }) => {
      const title = await page.title();

      expect(title).toBeTruthy();
      expect(title.length).toBeGreaterThan(10);
      expect(title.length).toBeLessThan(70);
      expect(title).toContain('Search');
    });

    test('should have meta description for search page', async ({ page }) => {
      const metaDescription = await page.locator('meta[name="description"]').getAttribute('content');

      expect(metaDescription).toBeTruthy();
      expect(metaDescription!.length).toBeGreaterThan(50);
      expect(metaDescription!.length).toBeLessThan(160);
    });

    test('should have canonical URL for search page', async ({ page }) => {
      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');

      expect(canonical).toBeTruthy();
      expect(canonical).toMatch(/^https?:\/\//);
      expect(canonical).toContain('/search');
    });

    test('should have charset and viewport meta tags', async ({ page }) => {
      const charset = await page.locator('meta[charset]').getAttribute('charset');
      const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');

      expect(charset?.toLowerCase()).toBe('utf-8');
      expect(viewport).toContain('width=device-width');
    });
  });

  test.describe('Campsite Detail Page Meta Tags', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to first available campsite
      await page.goto('/search');
      await page.waitForLoadState('networkidle');

      // Find and click first campsite link
      const firstCampsite = page.locator('a[href*="/campsites/"]').first();
      const campsiteExists = await firstCampsite.count() > 0;

      if (campsiteExists) {
        await firstCampsite.click();
        await page.waitForLoadState('networkidle');
      } else {
        // Skip if no campsites available
        test.skip();
      }
    });

    test('should have campsite name in title', async ({ page }) => {
      const title = await page.title();

      expect(title).toBeTruthy();
      expect(title.length).toBeGreaterThan(10);
      expect(title.length).toBeLessThan(70);
      expect(title).toContain('Camping Thailand');
      expect(title).not.toBe('Camping Thailand'); // Should include campsite name
    });

    test('should have descriptive meta description', async ({ page }) => {
      const metaDescription = await page.locator('meta[name="description"]').getAttribute('content');

      expect(metaDescription).toBeTruthy();
      expect(metaDescription!.length).toBeGreaterThan(50);
      expect(metaDescription!.length).toBeLessThan(160);
    });

    test('should have canonical URL for campsite', async ({ page }) => {
      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
      const currentUrl = page.url();

      expect(canonical).toBeTruthy();
      expect(canonical).toMatch(/^https?:\/\//);
      expect(canonical).toContain('/campsites/');

      // Canonical should match current path (without query params)
      const urlPath = new URL(currentUrl).pathname;
      expect(canonical).toContain(urlPath);
    });

    test('should not contain HTML entities in meta tags', async ({ page }) => {
      const title = await page.title();
      const metaDescription = await page.locator('meta[name="description"]').getAttribute('content');

      expect(title).not.toContain('<');
      expect(title).not.toContain('>');
      expect(title).not.toContain('&lt;');
      expect(title).not.toContain('&gt;');

      if (metaDescription) {
        expect(metaDescription).not.toContain('<');
        expect(metaDescription).not.toContain('>');
      }
    });
  });

  test.describe('Province Page Meta Tags', () => {
    const provinces = ['bangkok', 'chiang-mai', 'phuket'];

    provinces.forEach((province) => {
      test(`should have proper meta tags for ${province} province page`, async ({ page }) => {
        await page.goto(`/provinces/${province}`);
        await page.waitForLoadState('networkidle');

        const title = await page.title();
        const metaDescription = await page.locator('meta[name="description"]').getAttribute('content');
        const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');

        // Title validation
        expect(title).toBeTruthy();
        expect(title.length).toBeGreaterThan(10);
        expect(title.length).toBeLessThan(70);

        // Description validation
        if (metaDescription) {
          expect(metaDescription.length).toBeGreaterThan(50);
          expect(metaDescription.length).toBeLessThan(160);
        }

        // Canonical validation
        expect(canonical).toBeTruthy();
        expect(canonical).toMatch(/^https?:\/\//);
        expect(canonical).toContain(`/provinces/${province}`);
      });
    });
  });

  test.describe('Meta Tag Quality Checks', () => {
    test('homepage should have unique title and description', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const title = await page.title();
      const metaDescription = await page.locator('meta[name="description"]').getAttribute('content');

      // Title and description should not be identical
      expect(title).not.toBe(metaDescription);

      // Both should have meaningful content
      expect(title.split(' ').length).toBeGreaterThan(2);
      expect(metaDescription!.split(' ').length).toBeGreaterThan(10);
    });

    test('should not have duplicate meta description tags', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const metaDescriptionCount = await page.locator('meta[name="description"]').count();
      expect(metaDescriptionCount).toBe(1);
    });

    test('canonical URLs should always be absolute', async ({ page }) => {
      const pages = ['/', '/search', '/about'];

      for (const pagePath of pages) {
        await page.goto(pagePath);
        await page.waitForLoadState('networkidle');

        const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');

        if (canonical) {
          expect(canonical).toMatch(/^https?:\/\//);
          expect(canonical).not.toMatch(/^\/[^\/]/); // Should not be relative
        }
      }
    });

    test('meta descriptions should not be duplicated across key pages', async ({ page }) => {
      const descriptions = new Map<string, string>();

      const pages = ['/', '/search'];

      for (const pagePath of pages) {
        await page.goto(pagePath);
        await page.waitForLoadState('networkidle');

        const metaDescription = await page.locator('meta[name="description"]').getAttribute('content');

        if (metaDescription) {
          expect(descriptions.has(metaDescription)).toBe(false);
          descriptions.set(pagePath, metaDescription);
        }
      }
    });
  });
});
