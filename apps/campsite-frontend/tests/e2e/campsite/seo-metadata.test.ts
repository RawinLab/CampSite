import { test, expect } from '@playwright/test';

test.describe('Campsite SEO Metadata', () => {
  const CAMPSITE_URL = '/campsites/test-campsite-slug'; // Update with actual test campsite

  test.beforeEach(async ({ page }) => {
    // Navigate to campsite detail page
    await page.goto(CAMPSITE_URL);
    await page.waitForLoadState('networkidle');
  });

  test('should have title tag containing campsite name', async ({ page }) => {
    const title = await page.title();

    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
    expect(title).toContain('Camping Thailand'); // Platform name should be in title

    // Title should not be just the platform name
    expect(title).not.toBe('Camping Thailand');
  });

  test('should have meta description present', async ({ page }) => {
    const metaDescription = await page.locator('meta[name="description"]').getAttribute('content');

    expect(metaDescription).toBeTruthy();
    expect(metaDescription!.length).toBeGreaterThan(50);
    expect(metaDescription!.length).toBeLessThan(160); // SEO best practice: 50-160 chars
  });

  test('should have Open Graph title set', async ({ page }) => {
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');

    expect(ogTitle).toBeTruthy();
    expect(ogTitle!.length).toBeGreaterThan(0);
  });

  test('should have Open Graph description set', async ({ page }) => {
    const ogDescription = await page.locator('meta[property="og:description"]').getAttribute('content');

    expect(ogDescription).toBeTruthy();
    expect(ogDescription!.length).toBeGreaterThan(0);
  });

  test('should have Open Graph image set', async ({ page }) => {
    const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content');

    expect(ogImage).toBeTruthy();
    expect(ogImage).toMatch(/^https?:\/\//); // Should be absolute URL
  });

  test('should have Open Graph type set', async ({ page }) => {
    const ogType = await page.locator('meta[property="og:type"]').getAttribute('content');

    expect(ogType).toBeTruthy();
    expect(['website', 'article']).toContain(ogType);
  });

  test('should have Open Graph URL set', async ({ page }) => {
    const ogUrl = await page.locator('meta[property="og:url"]').getAttribute('content');

    expect(ogUrl).toBeTruthy();
    expect(ogUrl).toMatch(/^https?:\/\//); // Should be absolute URL
  });

  test('should have Twitter card metadata present', async ({ page }) => {
    const twitterCard = await page.locator('meta[name="twitter:card"]').getAttribute('content');
    const twitterTitle = await page.locator('meta[name="twitter:title"]').getAttribute('content');
    const twitterDescription = await page.locator('meta[name="twitter:description"]').getAttribute('content');
    const twitterImage = await page.locator('meta[name="twitter:image"]').getAttribute('content');

    expect(twitterCard).toBeTruthy();
    expect(['summary', 'summary_large_image']).toContain(twitterCard);

    expect(twitterTitle).toBeTruthy();
    expect(twitterTitle!.length).toBeGreaterThan(0);

    expect(twitterDescription).toBeTruthy();
    expect(twitterDescription!.length).toBeGreaterThan(0);

    expect(twitterImage).toBeTruthy();
    expect(twitterImage).toMatch(/^https?:\/\//); // Should be absolute URL
  });

  test('should have canonical URL correct', async ({ page }) => {
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');

    expect(canonical).toBeTruthy();
    expect(canonical).toMatch(/^https?:\/\//); // Should be absolute URL
    expect(canonical).toContain(CAMPSITE_URL.split('?')[0]); // Should contain the base path without query params
  });

  test('should have JSON-LD structured data present', async ({ page }) => {
    const jsonLdScript = page.locator('script[type="application/ld+json"]');
    const count = await jsonLdScript.count();

    expect(count).toBeGreaterThan(0);

    // Get the first JSON-LD script
    const jsonLdContent = await jsonLdScript.first().textContent();
    expect(jsonLdContent).toBeTruthy();

    // Parse and validate JSON-LD structure
    const jsonLd = JSON.parse(jsonLdContent!);
    expect(jsonLd).toHaveProperty('@context');
    expect(jsonLd['@context']).toBe('https://schema.org');
    expect(jsonLd).toHaveProperty('@type');
  });

  test('should have complete JSON-LD schema for campground', async ({ page }) => {
    const jsonLdScript = page.locator('script[type="application/ld+json"]');
    const jsonLdContent = await jsonLdScript.first().textContent();
    const jsonLd = JSON.parse(jsonLdContent!);

    // Validate campground-specific schema
    expect(['Campground', 'TouristAttraction', 'Place']).toContain(jsonLd['@type']);
    expect(jsonLd).toHaveProperty('name');
    expect(jsonLd).toHaveProperty('description');

    // Optional but recommended fields
    if (jsonLd.address) {
      expect(jsonLd.address).toHaveProperty('@type');
      expect(jsonLd.address['@type']).toBe('PostalAddress');
    }

    if (jsonLd.geo) {
      expect(jsonLd.geo).toHaveProperty('@type');
      expect(jsonLd.geo['@type']).toBe('GeoCoordinates');
      expect(jsonLd.geo).toHaveProperty('latitude');
      expect(jsonLd.geo).toHaveProperty('longitude');
    }
  });

  test('should have viewport meta tag for responsive design', async ({ page }) => {
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

  test('should not have multiple canonical URLs', async ({ page }) => {
    const canonicalCount = await page.locator('link[rel="canonical"]').count();

    expect(canonicalCount).toBe(1);
  });

  test('should have language attribute on html tag', async ({ page }) => {
    const htmlLang = await page.locator('html').getAttribute('lang');

    expect(htmlLang).toBeTruthy();
    expect(htmlLang).toMatch(/^[a-z]{2}(-[A-Z]{2})?$/); // Format: en, en-US, th-TH
  });

  test('should have robots meta tag or allow indexing by default', async ({ page }) => {
    const robotsMeta = await page.locator('meta[name="robots"]').getAttribute('content');

    // If robots meta exists, it should allow indexing for public campsites
    if (robotsMeta) {
      expect(robotsMeta).not.toContain('noindex');
      expect(robotsMeta).not.toContain('nofollow');
    }
    // If no robots meta, indexing is allowed by default (which is fine)
  });

  test('should have Open Graph locale set', async ({ page }) => {
    const ogLocale = await page.locator('meta[property="og:locale"]').getAttribute('content');

    if (ogLocale) {
      expect(ogLocale).toMatch(/^[a-z]{2}_[A-Z]{2}$/); // Format: en_US, th_TH
    }
  });

  test('should have proper meta tag content without HTML entities in critical fields', async ({ page }) => {
    const title = await page.title();
    const metaDescription = await page.locator('meta[name="description"]').getAttribute('content');
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');

    // Check that critical fields don't contain unescaped HTML
    expect(title).not.toContain('<');
    expect(title).not.toContain('>');
    expect(metaDescription).not.toContain('<');
    expect(metaDescription).not.toContain('>');
    expect(ogTitle).not.toContain('<');
    expect(ogTitle).not.toContain('>');
  });
});
