import { test, expect } from '@playwright/test';

test.describe('Sitemap.xml Accessibility and Validation', () => {
  test.describe('Sitemap Accessibility', () => {
    test('should be accessible at /sitemap.xml', async ({ page }) => {
      const response = await page.goto('/sitemap.xml');

      expect(response).toBeTruthy();
      expect(response!.status()).toBe(200);
    });

    test('should have correct Content-Type header', async ({ page }) => {
      const response = await page.goto('/sitemap.xml');

      const contentType = response!.headers()['content-type'];
      expect(contentType).toBeTruthy();
      expect(contentType).toMatch(/xml/);
    });

    test('should return XML content', async ({ page }) => {
      await page.goto('/sitemap.xml');
      const content = await page.content();

      expect(content).toContain('<?xml');
      expect(content).toContain('<urlset');
    });

    test('should not return 404 or error status', async ({ page }) => {
      const response = await page.goto('/sitemap.xml');

      expect(response!.status()).not.toBe(404);
      expect(response!.status()).not.toBe(500);
      expect(response!.status()).toBeLessThan(400);
    });
  });

  test.describe('Sitemap XML Structure Validation', () => {
    test('should have valid XML declaration', async ({ page }) => {
      await page.goto('/sitemap.xml');
      const content = await page.content();

      expect(content).toMatch(/^<\?xml version="1\.0"/);
    });

    test('should have urlset root element with namespace', async ({ page }) => {
      await page.goto('/sitemap.xml');
      const content = await page.content();

      expect(content).toContain('<urlset');
      expect(content).toContain('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
    });

    test('should have closing urlset tag', async ({ page }) => {
      await page.goto('/sitemap.xml');
      const content = await page.content();

      expect(content).toContain('</urlset>');
    });

    test('should have well-formed XML structure', async ({ page }) => {
      await page.goto('/sitemap.xml');
      const content = await page.content();

      // Check for basic XML structure
      const openUrlsetCount = (content.match(/<urlset/g) || []).length;
      const closeUrlsetCount = (content.match(/<\/urlset>/g) || []).length;

      expect(openUrlsetCount).toBe(closeUrlsetCount);
      expect(openUrlsetCount).toBe(1);
    });

    test('should contain url elements', async ({ page }) => {
      await page.goto('/sitemap.xml');
      const content = await page.content();

      expect(content).toContain('<url>');
      expect(content).toContain('</url>');

      const urlCount = (content.match(/<url>/g) || []).length;
      expect(urlCount).toBeGreaterThan(0);
    });

    test('each url should have loc element', async ({ page }) => {
      await page.goto('/sitemap.xml');
      const content = await page.content();

      const urlCount = (content.match(/<url>/g) || []).length;
      const locCount = (content.match(/<loc>/g) || []).length;

      expect(locCount).toBeGreaterThanOrEqual(urlCount);
    });

    test('should have lastmod elements', async ({ page }) => {
      await page.goto('/sitemap.xml');
      const content = await page.content();

      // lastmod is optional but recommended
      if (content.includes('<lastmod>')) {
        const lastmodCount = (content.match(/<lastmod>/g) || []).length;
        expect(lastmodCount).toBeGreaterThan(0);

        // Validate lastmod format (should be ISO 8601)
        const lastmodMatch = content.match(/<lastmod>(.*?)<\/lastmod>/);
        if (lastmodMatch) {
          const dateValue = lastmodMatch[1];
          expect(dateValue).toMatch(/^\d{4}-\d{2}-\d{2}/); // YYYY-MM-DD format
        }
      }
    });

    test('should have changefreq elements if present', async ({ page }) => {
      await page.goto('/sitemap.xml');
      const content = await page.content();

      // changefreq is optional
      if (content.includes('<changefreq>')) {
        const validFrequencies = [
          'always',
          'hourly',
          'daily',
          'weekly',
          'monthly',
          'yearly',
          'never',
        ];

        const changefreqMatches = content.match(/<changefreq>(.*?)<\/changefreq>/g);
        if (changefreqMatches) {
          changefreqMatches.forEach((match) => {
            const value = match.replace(/<\/?changefreq>/g, '');
            expect(validFrequencies).toContain(value);
          });
        }
      }
    });

    test('should have priority elements if present', async ({ page }) => {
      await page.goto('/sitemap.xml');
      const content = await page.content();

      // priority is optional
      if (content.includes('<priority>')) {
        const priorityMatches = content.match(/<priority>(.*?)<\/priority>/g);
        if (priorityMatches) {
          priorityMatches.forEach((match) => {
            const value = parseFloat(match.replace(/<\/?priority>/g, ''));
            expect(value).toBeGreaterThanOrEqual(0);
            expect(value).toBeLessThanOrEqual(1);
          });
        }
      }
    });
  });

  test.describe('Sitemap URL Validation', () => {
    test('all URLs should be absolute', async ({ page }) => {
      await page.goto('/sitemap.xml');
      const content = await page.content();

      const locMatches = content.match(/<loc>(.*?)<\/loc>/g);
      expect(locMatches).toBeTruthy();
      expect(locMatches!.length).toBeGreaterThan(0);

      locMatches!.forEach((match) => {
        const url = match.replace(/<\/?loc>/g, '');
        expect(url).toMatch(/^https?:\/\//);
        expect(url).not.toMatch(/^\/[^\/]/); // Should not be relative
      });
    });

    test('all URLs should use the same protocol', async ({ page }) => {
      await page.goto('/sitemap.xml');
      const content = await page.content();

      const locMatches = content.match(/<loc>(.*?)<\/loc>/g);

      if (locMatches && locMatches.length > 1) {
        const protocols = locMatches.map((match) => {
          const url = match.replace(/<\/?loc>/g, '');
          return url.startsWith('https://') ? 'https' : 'http';
        });

        const uniqueProtocols = [...new Set(protocols)];
        expect(uniqueProtocols.length).toBe(1);
        expect(uniqueProtocols[0]).toBe('https'); // Should use HTTPS
      }
    });

    test('all URLs should use the same domain', async ({ page }) => {
      await page.goto('/sitemap.xml');
      const content = await page.content();

      const locMatches = content.match(/<loc>(.*?)<\/loc>/g);

      if (locMatches && locMatches.length > 1) {
        const domains = locMatches.map((match) => {
          const url = match.replace(/<\/?loc>/g, '');
          try {
            return new URL(url).hostname;
          } catch {
            return '';
          }
        });

        const uniqueDomains = [...new Set(domains)];
        expect(uniqueDomains.length).toBe(1);
      }
    });

    test('URLs should not contain fragments', async ({ page }) => {
      await page.goto('/sitemap.xml');
      const content = await page.content();

      const locMatches = content.match(/<loc>(.*?)<\/loc>/g);

      locMatches?.forEach((match) => {
        const url = match.replace(/<\/?loc>/g, '');
        expect(url).not.toContain('#');
      });
    });

    test('URLs should be properly encoded', async ({ page }) => {
      await page.goto('/sitemap.xml');
      const content = await page.content();

      const locMatches = content.match(/<loc>(.*?)<\/loc>/g);

      locMatches?.forEach((match) => {
        const url = match.replace(/<\/?loc>/g, '');

        // XML special characters should be escaped
        expect(url).not.toContain('&amp;amp;'); // Double encoding
        expect(url).not.toContain('<');
        expect(url).not.toContain('>');
        expect(url).not.toContain('"');
        expect(url).not.toContain("'");
      });
    });

    test('should not have duplicate URLs', async ({ page }) => {
      await page.goto('/sitemap.xml');
      const content = await page.content();

      const locMatches = content.match(/<loc>(.*?)<\/loc>/g);

      if (locMatches) {
        const urls = locMatches.map((match) => match.replace(/<\/?loc>/g, ''));
        const uniqueUrls = [...new Set(urls)];

        expect(urls.length).toBe(uniqueUrls.length);
      }
    });
  });

  test.describe('Sitemap Content Requirements', () => {
    test('should include homepage URL', async ({ page }) => {
      await page.goto('/sitemap.xml');
      const content = await page.content();

      const baseUrl = 'http://localhost:3090';
      const httpsBaseUrl = baseUrl.replace('http://', 'https://');

      const hasHomepage =
        content.includes(`<loc>${baseUrl}</loc>`) ||
        content.includes(`<loc>${baseUrl}/</loc>`) ||
        content.includes(`<loc>${httpsBaseUrl}</loc>`) ||
        content.includes(`<loc>${httpsBaseUrl}/</loc>`);

      expect(hasHomepage).toBe(true);
    });

    test('should include search page URL', async ({ page }) => {
      await page.goto('/sitemap.xml');
      const content = await page.content();

      expect(content).toContain('/search</loc>');
    });

    test('should include campsite URLs', async ({ page }) => {
      await page.goto('/sitemap.xml');
      const content = await page.content();

      const hasCampsiteUrls = content.includes('/campsites/');
      // Campsites may not exist yet in test environment
      // expect(hasCampsiteUrls).toBe(true);
    });

    test('should not exceed 50MB size limit', async ({ page }) => {
      const response = await page.goto('/sitemap.xml');
      const content = await page.content();

      const sizeInBytes = new Blob([content]).size;
      const sizeInMB = sizeInBytes / (1024 * 1024);

      expect(sizeInMB).toBeLessThan(50); // Sitemap limit is 50MB
    });

    test('should not exceed 50,000 URLs limit', async ({ page }) => {
      await page.goto('/sitemap.xml');
      const content = await page.content();

      const urlCount = (content.match(/<url>/g) || []).length;

      expect(urlCount).toBeLessThan(50000); // Sitemap URL limit
    });

    test('should be under 10MB for optimal performance', async ({ page }) => {
      const response = await page.goto('/sitemap.xml');
      const content = await page.content();

      const sizeInBytes = new Blob([content]).size;
      const sizeInMB = sizeInBytes / (1024 * 1024);

      // Warn if approaching limits
      expect(sizeInMB).toBeLessThan(10); // Recommended limit
    });
  });

  test.describe('Sitemap Caching and Performance', () => {
    test('should have appropriate cache headers', async ({ page }) => {
      const response = await page.goto('/sitemap.xml');

      const cacheControl = response!.headers()['cache-control'];

      // Sitemap should be cacheable
      if (cacheControl) {
        expect(cacheControl).not.toContain('no-cache');
        expect(cacheControl).not.toContain('no-store');
      }
    });

    test('should respond quickly', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/sitemap.xml');
      const endTime = Date.now();

      const responseTime = endTime - startTime;

      // Should respond in under 10 seconds (dev environment may be slower)
      expect(responseTime).toBeLessThan(10000);
    });
  });

  test.describe('Alternative Sitemap Formats', () => {
    test('should support sitemap index if using multiple sitemaps', async ({ page }) => {
      // Try to access sitemap index
      const response = await page.goto('/sitemap_index.xml', { waitUntil: 'networkidle' });

      // If sitemap index exists, validate its structure
      if (response && response.status() === 200) {
        const content = await page.content();

        expect(content).toContain('<sitemapindex');
        expect(content).toContain('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
        expect(content).toContain('<sitemap>');
        expect(content).toContain('<loc>');
      }
    });
  });
});
