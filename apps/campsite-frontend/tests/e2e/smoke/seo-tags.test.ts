import { test, expect } from '@playwright/test';

// Use a valid test campsite slug
const TEST_CAMPSITE_SLUG = 'test-campsite-details-b7a9886a';

test.describe('Smoke Test: SEO Tags Present', () => {
  test('homepage has title tag with content', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const title = await page.title();

    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
    expect(title.length).toBeLessThan(100); // SEO best practice
  });

  test('homepage has meta description', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const metaDescription = await page.locator('meta[name="description"]').getAttribute('content');

    expect(metaDescription).toBeTruthy();
    expect(metaDescription!.length).toBeGreaterThan(50);
    expect(metaDescription!.length).toBeLessThan(160); // SEO best practice
  });

  test('homepage has Open Graph title', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');

    expect(ogTitle).toBeTruthy();
    expect(ogTitle!.length).toBeGreaterThan(0);
  });

  test('homepage has Open Graph description', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const ogDescription = await page.locator('meta[property="og:description"]').getAttribute('content');

    expect(ogDescription).toBeTruthy();
    expect(ogDescription!.length).toBeGreaterThan(0);
  });

  test('homepage has canonical URL', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');

    expect(canonical).toBeTruthy();
    expect(canonical).toMatch(/^https?:\/\//); // Should be absolute URL
  });

  test('search page has complete SEO tags', async ({ page }) => {
    await page.goto('/search');
    await page.waitForLoadState('domcontentloaded');

    // Check title
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);

    // Check meta description
    const metaDescription = await page.locator('meta[name="description"]').getAttribute('content');
    expect(metaDescription).toBeTruthy();

    // Check Open Graph tags
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
    expect(ogTitle).toBeTruthy();

    // Check canonical
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toBeTruthy();
  });

  test('campsite detail page has SEO tags', async ({ page }) => {
    await page.goto(`/campsites/${TEST_CAMPSITE_SLUG}`);
    await page.waitForLoadState('domcontentloaded');

    const status = await page.evaluate(() => {
      return (window as any).__NEXT_DATA__?.props?.pageProps?.statusCode;
    });

    // Only verify SEO tags if page exists (not 404)
    if (status !== 404) {
      // Check title
      const title = await page.title();
      expect(title).toBeTruthy();
      expect(title.length).toBeGreaterThan(0);

      // Check meta description
      const metaDescription = await page.locator('meta[name="description"]').getAttribute('content');
      expect(metaDescription).toBeTruthy();

      // Check canonical
      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
      expect(canonical).toBeTruthy();
    }
  });

  test('all pages have viewport meta tag', async ({ page }) => {
    const pagesToTest = ['/', '/search', '/login'];

    for (const pagePath of pagesToTest) {
      await page.goto(pagePath);
      await page.waitForLoadState('domcontentloaded');

      const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');

      expect(viewport, `Missing viewport tag on ${pagePath}`).toBeTruthy();
      expect(viewport, `Invalid viewport on ${pagePath}`).toContain('width=device-width');
    }
  });

  test('all pages have charset declaration', async ({ page }) => {
    const pagesToTest = ['/', '/search', '/login'];

    for (const pagePath of pagesToTest) {
      await page.goto(pagePath);
      await page.waitForLoadState('domcontentloaded');

      const charset = await page.locator('meta[charset]').getAttribute('charset');

      expect(charset, `Missing charset on ${pagePath}`).toBeTruthy();
      expect(charset?.toLowerCase(), `Invalid charset on ${pagePath}`).toBe('utf-8');
    }
  });

  test('homepage has Open Graph image', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content');

    expect(ogImage).toBeTruthy();
    // Should be absolute URL
    expect(ogImage).toMatch(/^https?:\/\//);
  });

  test('homepage has Twitter card metadata', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const twitterCard = await page.locator('meta[name="twitter:card"]').getAttribute('content');

    expect(twitterCard).toBeTruthy();
    expect(['summary', 'summary_large_image']).toContain(twitterCard);
  });

  test('no duplicate canonical URLs on any page', async ({ page }) => {
    const pagesToTest = ['/', '/search', '/login'];

    for (const pagePath of pagesToTest) {
      await page.goto(pagePath);
      await page.waitForLoadState('domcontentloaded');

      const canonicalCount = await page.locator('link[rel="canonical"]').count();

      expect(canonicalCount, `Multiple canonical tags on ${pagePath}`).toBeLessThanOrEqual(1);
    }
  });

  test('HTML lang attribute is present', async ({ page }) => {
    const pagesToTest = ['/', '/search', '/login'];

    for (const pagePath of pagesToTest) {
      await page.goto(pagePath);
      await page.waitForLoadState('domcontentloaded');

      const htmlLang = await page.locator('html').getAttribute('lang');

      expect(htmlLang, `Missing lang attribute on ${pagePath}`).toBeTruthy();
      // Should be valid language code (e.g., 'en', 'th', 'en-US')
      expect(htmlLang, `Invalid lang format on ${pagePath}`).toMatch(/^[a-z]{2}(-[A-Z]{2})?$/);
    }
  });

  test('Open Graph type is set correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const ogType = await page.locator('meta[property="og:type"]').getAttribute('content');

    expect(ogType).toBeTruthy();
    expect(['website', 'article']).toContain(ogType);
  });

  test('Open Graph URL matches current page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const ogUrl = await page.locator('meta[property="og:url"]').getAttribute('content');

    expect(ogUrl).toBeTruthy();
    expect(ogUrl).toMatch(/^https?:\/\//);
    // Should contain the domain
    expect(ogUrl).toContain('localhost');
  });

  test('meta descriptions do not contain HTML tags', async ({ page }) => {
    const pagesToTest = ['/', '/search'];

    for (const pagePath of pagesToTest) {
      await page.goto(pagePath);
      await page.waitForLoadState('domcontentloaded');

      const metaDescription = await page.locator('meta[name="description"]').getAttribute('content');

      if (metaDescription) {
        expect(metaDescription, `HTML in meta description on ${pagePath}`).not.toContain('<');
        expect(metaDescription, `HTML in meta description on ${pagePath}`).not.toContain('>');
      }
    }
  });

  test('titles do not contain HTML tags', async ({ page }) => {
    const pagesToTest = ['/', '/search', '/login'];

    for (const pagePath of pagesToTest) {
      await page.goto(pagePath);
      await page.waitForLoadState('domcontentloaded');

      const title = await page.title();

      expect(title, `HTML in title on ${pagePath}`).not.toContain('<');
      expect(title, `HTML in title on ${pagePath}`).not.toContain('>');
    }
  });

  test('JSON-LD structured data is present on homepage', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const jsonLdScript = page.locator('script[type="application/ld+json"]');
    const count = await jsonLdScript.count();

    // Should have at least one JSON-LD script
    expect(count).toBeGreaterThan(0);

    // Verify it's valid JSON
    const jsonLdContent = await jsonLdScript.first().textContent();
    expect(jsonLdContent).toBeTruthy();

    const jsonLd = JSON.parse(jsonLdContent!);
    expect(jsonLd).toHaveProperty('@context');
    expect(jsonLd['@context']).toContain('schema.org');
  });

  test('robots meta tag allows indexing on public pages', async ({ page }) => {
    const pagesToTest = ['/', '/search'];

    for (const pagePath of pagesToTest) {
      await page.goto(pagePath);
      await page.waitForLoadState('domcontentloaded');

      const robotsMeta = await page.locator('meta[name="robots"]').getAttribute('content');

      // If robots meta exists, it should not block indexing on public pages
      if (robotsMeta) {
        expect(robotsMeta, `noindex found on public page ${pagePath}`).not.toContain('noindex');
      }
    }
  });

  test('essential meta tags have non-empty content', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Check title
    const title = await page.title();
    expect(title.trim().length, 'Empty title tag').toBeGreaterThan(0);

    // Check meta description
    const metaDescription = await page.locator('meta[name="description"]').getAttribute('content');
    if (metaDescription) {
      expect(metaDescription.trim().length, 'Empty meta description').toBeGreaterThan(0);
    }

    // Check Open Graph title
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
    if (ogTitle) {
      expect(ogTitle.trim().length, 'Empty og:title').toBeGreaterThan(0);
    }
  });

  test('campsite detail page has dynamic title and description', async ({ page }) => {
    await page.goto(`/campsites/${TEST_CAMPSITE_SLUG}`);
    await page.waitForLoadState('domcontentloaded');

    const title = await page.title();
    const metaDescription = await page.locator('meta[name="description"]').getAttribute('content');

    // Title should not be just the site name
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(10);

    // Description should exist
    expect(metaDescription).toBeTruthy();
  });
});
