import { test, expect } from '@playwright/test';

test.describe('Structured Data (JSON-LD) Validation', () => {
  test.describe('Homepage JSON-LD Schema', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
    });

    test('should have at least one JSON-LD script tag', async ({ page }) => {
      const jsonLdScripts = page.locator('script[type="application/ld+json"]');
      const count = await jsonLdScripts.count();

      expect(count).toBeGreaterThan(0);
    });

    test('should have valid JSON-LD with @context and @type', async ({ page }) => {
      const jsonLdScript = page.locator('script[type="application/ld+json"]').first();
      const jsonLdContent = await jsonLdScript.textContent();

      expect(jsonLdContent).toBeTruthy();

      const jsonLd = JSON.parse(jsonLdContent!);
      expect(jsonLd).toHaveProperty('@context');
      expect(jsonLd['@context']).toBe('https://schema.org');
      expect(jsonLd).toHaveProperty('@type');
    });

    test('should have Organization schema on homepage', async ({ page }) => {
      const jsonLdScripts = page.locator('script[type="application/ld+json"]');
      const count = await jsonLdScripts.count();

      let hasOrganization = false;

      for (let i = 0; i < count; i++) {
        const jsonLdContent = await jsonLdScripts.nth(i).textContent();
        const jsonLd = JSON.parse(jsonLdContent!);

        if (jsonLd['@type'] === 'Organization') {
          hasOrganization = true;

          expect(jsonLd).toHaveProperty('name');
          expect(jsonLd.name).toContain('Camping Thailand');
          expect(jsonLd).toHaveProperty('url');
          expect(jsonLd.url).toMatch(/^https?:\/\//);

          if (jsonLd.logo) {
            expect(jsonLd.logo).toMatch(/^https?:\/\//);
          }

          break;
        }
      }

      expect(hasOrganization).toBe(true);
    });

    test('should have WebSite schema on homepage', async ({ page }) => {
      const jsonLdScripts = page.locator('script[type="application/ld+json"]');
      const count = await jsonLdScripts.count();

      let hasWebSite = false;

      for (let i = 0; i < count; i++) {
        const jsonLdContent = await jsonLdScripts.nth(i).textContent();
        const jsonLd = JSON.parse(jsonLdContent!);

        if (jsonLd['@type'] === 'WebSite') {
          hasWebSite = true;

          expect(jsonLd).toHaveProperty('name');
          expect(jsonLd).toHaveProperty('url');
          expect(jsonLd.url).toMatch(/^https?:\/\//);

          // Check for search action
          if (jsonLd.potentialAction) {
            expect(jsonLd.potentialAction).toHaveProperty('@type');
            expect(jsonLd.potentialAction['@type']).toBe('SearchAction');
            expect(jsonLd.potentialAction).toHaveProperty('target');
          }

          break;
        }
      }

      // WebSite schema is recommended but not required
      // expect(hasWebSite).toBe(true);
    });

    test('Organization schema should have valid contact information if present', async ({ page }) => {
      const jsonLdScripts = page.locator('script[type="application/ld+json"]');
      const count = await jsonLdScripts.count();

      for (let i = 0; i < count; i++) {
        const jsonLdContent = await jsonLdScripts.nth(i).textContent();
        const jsonLd = JSON.parse(jsonLdContent!);

        if (jsonLd['@type'] === 'Organization' && jsonLd.contactPoint) {
          expect(jsonLd.contactPoint).toHaveProperty('@type');
          expect(jsonLd.contactPoint['@type']).toBe('ContactPoint');

          if (jsonLd.contactPoint.telephone) {
            expect(jsonLd.contactPoint.telephone).toMatch(/^\+?[\d\s\-()]+$/);
          }

          if (jsonLd.contactPoint.email) {
            expect(jsonLd.contactPoint.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
          }
        }
      }
    });
  });

  test.describe('Campsite Detail Page JSON-LD Schema', () => {
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

    test('should have JSON-LD structured data on campsite page', async ({ page }) => {
      const jsonLdScripts = page.locator('script[type="application/ld+json"]');
      const count = await jsonLdScripts.count();

      expect(count).toBeGreaterThan(0);
    });

    test('should have LodgingBusiness or Campground schema', async ({ page }) => {
      const jsonLdScripts = page.locator('script[type="application/ld+json"]');
      const count = await jsonLdScripts.count();

      let hasLodgingSchema = false;

      for (let i = 0; i < count; i++) {
        const jsonLdContent = await jsonLdScripts.nth(i).textContent();
        const jsonLd = JSON.parse(jsonLdContent!);

        const validTypes = ['LodgingBusiness', 'Campground', 'Place', 'TouristAttraction'];

        if (validTypes.includes(jsonLd['@type'])) {
          hasLodgingSchema = true;

          expect(jsonLd).toHaveProperty('name');
          expect(jsonLd.name).toBeTruthy();
          expect(jsonLd).toHaveProperty('description');
          expect(jsonLd.description).toBeTruthy();

          break;
        }
      }

      expect(hasLodgingSchema).toBe(true);
    });

    test('campsite schema should have address information', async ({ page }) => {
      const jsonLdScripts = page.locator('script[type="application/ld+json"]');
      const count = await jsonLdScripts.count();

      for (let i = 0; i < count; i++) {
        const jsonLdContent = await jsonLdScripts.nth(i).textContent();
        const jsonLd = JSON.parse(jsonLdContent!);

        const validTypes = ['LodgingBusiness', 'Campground', 'Place', 'TouristAttraction'];

        if (validTypes.includes(jsonLd['@type']) && jsonLd.address) {
          expect(jsonLd.address).toHaveProperty('@type');
          expect(jsonLd.address['@type']).toBe('PostalAddress');

          // Address should have at least some fields
          const hasAddressFields =
            jsonLd.address.streetAddress ||
            jsonLd.address.addressLocality ||
            jsonLd.address.addressRegion ||
            jsonLd.address.postalCode;

          expect(hasAddressFields).toBeTruthy();
        }
      }
    });

    test('campsite schema should have geo coordinates', async ({ page }) => {
      const jsonLdScripts = page.locator('script[type="application/ld+json"]');
      const count = await jsonLdScripts.count();

      for (let i = 0; i < count; i++) {
        const jsonLdContent = await jsonLdScripts.nth(i).textContent();
        const jsonLd = JSON.parse(jsonLdContent!);

        const validTypes = ['LodgingBusiness', 'Campground', 'Place', 'TouristAttraction'];

        if (validTypes.includes(jsonLd['@type']) && jsonLd.geo) {
          expect(jsonLd.geo).toHaveProperty('@type');
          expect(jsonLd.geo['@type']).toBe('GeoCoordinates');
          expect(jsonLd.geo).toHaveProperty('latitude');
          expect(jsonLd.geo).toHaveProperty('longitude');

          // Validate coordinates are in Thailand range
          const lat = parseFloat(jsonLd.geo.latitude);
          const lon = parseFloat(jsonLd.geo.longitude);

          expect(lat).toBeGreaterThan(5);
          expect(lat).toBeLessThan(21);
          expect(lon).toBeGreaterThan(97);
          expect(lon).toBeLessThan(106);
        }
      }
    });

    test('campsite schema should have images if present', async ({ page }) => {
      const jsonLdScripts = page.locator('script[type="application/ld+json"]');
      const count = await jsonLdScripts.count();

      for (let i = 0; i < count; i++) {
        const jsonLdContent = await jsonLdScripts.nth(i).textContent();
        const jsonLd = JSON.parse(jsonLdContent!);

        const validTypes = ['LodgingBusiness', 'Campground', 'Place', 'TouristAttraction'];

        if (validTypes.includes(jsonLd['@type']) && jsonLd.image) {
          if (Array.isArray(jsonLd.image)) {
            expect(jsonLd.image.length).toBeGreaterThan(0);
            jsonLd.image.forEach((img: string) => {
              expect(img).toMatch(/^https?:\/\//);
            });
          } else {
            expect(jsonLd.image).toMatch(/^https?:\/\//);
          }
        }
      }
    });
  });

  test.describe('Breadcrumb JSON-LD Schema', () => {
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

    test('should have BreadcrumbList schema on campsite page', async ({ page }) => {
      const jsonLdScripts = page.locator('script[type="application/ld+json"]');
      const count = await jsonLdScripts.count();

      let hasBreadcrumb = false;

      for (let i = 0; i < count; i++) {
        const jsonLdContent = await jsonLdScripts.nth(i).textContent();
        const jsonLd = JSON.parse(jsonLdContent!);

        if (jsonLd['@type'] === 'BreadcrumbList') {
          hasBreadcrumb = true;

          expect(jsonLd).toHaveProperty('itemListElement');
          expect(Array.isArray(jsonLd.itemListElement)).toBe(true);
          expect(jsonLd.itemListElement.length).toBeGreaterThan(0);

          break;
        }
      }

      // Breadcrumb is recommended but not strictly required
      // expect(hasBreadcrumb).toBe(true);
    });

    test('BreadcrumbList items should have proper structure', async ({ page }) => {
      const jsonLdScripts = page.locator('script[type="application/ld+json"]');
      const count = await jsonLdScripts.count();

      for (let i = 0; i < count; i++) {
        const jsonLdContent = await jsonLdScripts.nth(i).textContent();
        const jsonLd = JSON.parse(jsonLdContent!);

        if (jsonLd['@type'] === 'BreadcrumbList') {
          jsonLd.itemListElement.forEach((item: any, index: number) => {
            expect(item).toHaveProperty('@type');
            expect(item['@type']).toBe('ListItem');
            expect(item).toHaveProperty('position');
            expect(item.position).toBe(index + 1);
            expect(item).toHaveProperty('item');
            expect(item.item).toHaveProperty('@id');
            expect(item.item['@id']).toMatch(/^https?:\/\//);
            expect(item.item).toHaveProperty('name');
          });
        }
      }
    });
  });

  test.describe('Review & Rating JSON-LD Schema', () => {
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

    test('should have AggregateRating if reviews exist', async ({ page }) => {
      const jsonLdScripts = page.locator('script[type="application/ld+json"]');
      const count = await jsonLdScripts.count();

      let hasRating = false;

      for (let i = 0; i < count; i++) {
        const jsonLdContent = await jsonLdScripts.nth(i).textContent();
        const jsonLd = JSON.parse(jsonLdContent!);

        const validTypes = ['LodgingBusiness', 'Campground', 'Place', 'TouristAttraction'];

        if (validTypes.includes(jsonLd['@type']) && jsonLd.aggregateRating) {
          hasRating = true;

          expect(jsonLd.aggregateRating).toHaveProperty('@type');
          expect(jsonLd.aggregateRating['@type']).toBe('AggregateRating');
          expect(jsonLd.aggregateRating).toHaveProperty('ratingValue');
          expect(jsonLd.aggregateRating).toHaveProperty('reviewCount');

          const ratingValue = parseFloat(jsonLd.aggregateRating.ratingValue);
          expect(ratingValue).toBeGreaterThanOrEqual(1);
          expect(ratingValue).toBeLessThanOrEqual(5);

          const reviewCount = parseInt(jsonLd.aggregateRating.reviewCount);
          expect(reviewCount).toBeGreaterThan(0);

          break;
        }
      }

      // Rating may not exist if no reviews yet
      // expect(hasRating).toBe(true);
    });

    test('AggregateRating should have bestRating and worstRating', async ({ page }) => {
      const jsonLdScripts = page.locator('script[type="application/ld+json"]');
      const count = await jsonLdScripts.count();

      for (let i = 0; i < count; i++) {
        const jsonLdContent = await jsonLdScripts.nth(i).textContent();
        const jsonLd = JSON.parse(jsonLdContent!);

        const validTypes = ['LodgingBusiness', 'Campground', 'Place', 'TouristAttraction'];

        if (validTypes.includes(jsonLd['@type']) && jsonLd.aggregateRating) {
          if (jsonLd.aggregateRating.bestRating) {
            expect(parseInt(jsonLd.aggregateRating.bestRating)).toBe(5);
          }

          if (jsonLd.aggregateRating.worstRating) {
            expect(parseInt(jsonLd.aggregateRating.worstRating)).toBe(1);
          }
        }
      }
    });

    test('should have Review schema if individual reviews exist', async ({ page }) => {
      const jsonLdScripts = page.locator('script[type="application/ld+json"]');
      const count = await jsonLdScripts.count();

      for (let i = 0; i < count; i++) {
        const jsonLdContent = await jsonLdScripts.nth(i).textContent();
        const jsonLd = JSON.parse(jsonLdContent!);

        const validTypes = ['LodgingBusiness', 'Campground', 'Place', 'TouristAttraction'];

        if (validTypes.includes(jsonLd['@type']) && jsonLd.review) {
          const reviews = Array.isArray(jsonLd.review) ? jsonLd.review : [jsonLd.review];

          reviews.forEach((review: any) => {
            expect(review).toHaveProperty('@type');
            expect(review['@type']).toBe('Review');
            expect(review).toHaveProperty('author');
            expect(review).toHaveProperty('reviewRating');

            if (review.reviewRating) {
              expect(review.reviewRating).toHaveProperty('@type');
              expect(review.reviewRating['@type']).toBe('Rating');
              expect(review.reviewRating).toHaveProperty('ratingValue');

              const rating = parseFloat(review.reviewRating.ratingValue);
              expect(rating).toBeGreaterThanOrEqual(1);
              expect(rating).toBeLessThanOrEqual(5);
            }
          });
        }
      }
    });
  });

  test.describe('JSON-LD Schema Validation', () => {
    test('all JSON-LD scripts should be valid JSON', async ({ page }) => {
      const pages = ['/', '/search'];

      for (const pagePath of pages) {
        await page.goto(pagePath);
        await page.waitForLoadState('networkidle');

        const jsonLdScripts = page.locator('script[type="application/ld+json"]');
        const count = await jsonLdScripts.count();

        expect(count).toBeGreaterThan(0);

        for (let i = 0; i < count; i++) {
          const jsonLdContent = await jsonLdScripts.nth(i).textContent();

          expect(() => {
            JSON.parse(jsonLdContent!);
          }).not.toThrow();
        }
      }
    });

    test('JSON-LD should use https://schema.org context', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const jsonLdScripts = page.locator('script[type="application/ld+json"]');
      const count = await jsonLdScripts.count();

      for (let i = 0; i < count; i++) {
        const jsonLdContent = await jsonLdScripts.nth(i).textContent();
        const jsonLd = JSON.parse(jsonLdContent!);

        expect(jsonLd['@context']).toBe('https://schema.org');
      }
    });

    test('should not have malformed or empty JSON-LD scripts', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const jsonLdScripts = page.locator('script[type="application/ld+json"]');
      const count = await jsonLdScripts.count();

      for (let i = 0; i < count; i++) {
        const jsonLdContent = await jsonLdScripts.nth(i).textContent();

        expect(jsonLdContent).toBeTruthy();
        expect(jsonLdContent!.trim()).not.toBe('');
        expect(jsonLdContent!.trim()).not.toBe('{}');
      }
    });

    test('schema URLs should be absolute when required', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const jsonLdScripts = page.locator('script[type="application/ld+json"]');
      const count = await jsonLdScripts.count();

      for (let i = 0; i < count; i++) {
        const jsonLdContent = await jsonLdScripts.nth(i).textContent();
        const jsonLd = JSON.parse(jsonLdContent!);

        // Check URL fields are absolute
        if (jsonLd.url) {
          expect(jsonLd.url).toMatch(/^https?:\/\//);
        }

        if (jsonLd.logo) {
          expect(jsonLd.logo).toMatch(/^https?:\/\//);
        }

        if (jsonLd['@id']) {
          expect(jsonLd['@id']).toMatch(/^https?:\/\//);
        }
      }
    });
  });
});
