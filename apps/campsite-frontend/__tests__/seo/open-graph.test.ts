/**
 * Open Graph Tags Unit Tests
 * Tests for Open Graph and Twitter Card metadata generation
 */

import { describe, expect, it } from '@jest/globals';
import { generateBaseMetadata, generateOGImageUrl, SITE_CONFIG } from '@/lib/seo/utils';

describe('Open Graph Metadata', () => {
  describe('generateBaseMetadata', () => {
    it('should include openGraph object with correct structure', () => {
      const metadata = generateBaseMetadata();

      expect(metadata.openGraph).toBeDefined();
      expect(typeof metadata.openGraph).toBe('object');
    });

    it('should have openGraph type set to website', () => {
      const metadata = generateBaseMetadata();

      expect(metadata.openGraph).toHaveProperty('type', 'website');
    });

    it('should have openGraph locale set to th_TH', () => {
      const metadata = generateBaseMetadata();

      expect(metadata.openGraph).toHaveProperty('locale', 'th_TH');
      expect(metadata.openGraph?.locale).toBe(SITE_CONFIG.locale);
    });

    it('should include siteName in openGraph', () => {
      const metadata = generateBaseMetadata();

      expect(metadata.openGraph).toHaveProperty('siteName');
      expect(metadata.openGraph?.siteName).toBe(SITE_CONFIG.siteName);
      expect(metadata.openGraph?.siteName).toBe('Camping Thailand');
    });

    it('should include title in openGraph', () => {
      const metadata = generateBaseMetadata();

      expect(metadata.openGraph).toHaveProperty('title');
      expect(metadata.openGraph?.title).toBe(SITE_CONFIG.name);
      expect(metadata.openGraph?.title).toBe('Camping Thailand');
    });

    it('should include description in openGraph', () => {
      const metadata = generateBaseMetadata();

      expect(metadata.openGraph).toHaveProperty('description');
      expect(metadata.openGraph?.description).toBe(SITE_CONFIG.description);
      expect(metadata.openGraph?.description).toContain('แคมป์ไซต์');
    });

    it('should allow overriding openGraph properties', () => {
      const customTitle = 'Custom Page Title';
      const customDescription = 'Custom page description';

      const metadata = generateBaseMetadata({
        openGraph: {
          title: customTitle,
          description: customDescription,
        },
      });

      expect(metadata.openGraph?.title).toBe(customTitle);
      expect(metadata.openGraph?.description).toBe(customDescription);
    });
  });

  describe('generateOGImageUrl', () => {
    it('should return default OG image when no image provided', () => {
      const imageUrl = generateOGImageUrl('Test Title');

      expect(imageUrl).toBe(`${SITE_CONFIG.domain}/og-default.jpg`);
      expect(imageUrl).toContain('/og-default.jpg');
    });

    it('should return default OG image when only title and subtitle provided', () => {
      const imageUrl = generateOGImageUrl('Test Title', 'Test Subtitle');

      expect(imageUrl).toBe(`${SITE_CONFIG.domain}/og-default.jpg`);
    });

    it('should return provided image URL when imageUrl is specified', () => {
      const customImageUrl = 'https://example.com/custom-image.jpg';
      const imageUrl = generateOGImageUrl('Test Title', 'Test Subtitle', customImageUrl);

      expect(imageUrl).toBe(customImageUrl);
    });

    it('should return provided image URL even without subtitle', () => {
      const customImageUrl = 'https://example.com/another-image.jpg';
      const imageUrl = generateOGImageUrl('Test Title', undefined, customImageUrl);

      expect(imageUrl).toBe(customImageUrl);
    });

    it('should prioritize imageUrl over title and subtitle', () => {
      const customImageUrl = '/uploads/campsite-image.jpg';
      const imageUrl = generateOGImageUrl(
        'Long Title Text',
        'Long Subtitle Text',
        customImageUrl
      );

      expect(imageUrl).toBe(customImageUrl);
      expect(imageUrl).not.toContain('og-default.jpg');
    });
  });

  describe('Twitter Card Metadata', () => {
    it('should include Twitter card metadata in base metadata', () => {
      const metadata = generateBaseMetadata();

      expect(metadata.twitter).toBeDefined();
      expect(typeof metadata.twitter).toBe('object');
    });

    it('should set Twitter card type to summary_large_image', () => {
      const metadata = generateBaseMetadata();

      expect(metadata.twitter).toHaveProperty('card', 'summary_large_image');
    });

    it('should include Twitter site handle', () => {
      const metadata = generateBaseMetadata();

      expect(metadata.twitter).toHaveProperty('site');
      expect(metadata.twitter?.site).toBe(SITE_CONFIG.twitterHandle);
      expect(metadata.twitter?.site).toBe('@campingthailand');
    });

    it('should include Twitter creator handle', () => {
      const metadata = generateBaseMetadata();

      expect(metadata.twitter).toHaveProperty('creator');
      expect(metadata.twitter?.creator).toBe(SITE_CONFIG.twitterHandle);
      expect(metadata.twitter?.creator).toBe('@campingthailand');
    });

    it('should allow overriding Twitter metadata', () => {
      const customTwitter = {
        card: 'summary' as const,
        site: '@customhandle',
      };

      const metadata = generateBaseMetadata({
        twitter: customTwitter,
      });

      expect(metadata.twitter?.card).toBe('summary');
      expect(metadata.twitter?.site).toBe('@customhandle');
    });
  });

  describe('Complete Open Graph Integration', () => {
    it('should have all required Open Graph properties', () => {
      const metadata = generateBaseMetadata();
      const og = metadata.openGraph;

      expect(og).toHaveProperty('type');
      expect(og).toHaveProperty('locale');
      expect(og).toHaveProperty('siteName');
      expect(og).toHaveProperty('title');
      expect(og).toHaveProperty('description');
    });

    it('should maintain consistency between base metadata and openGraph', () => {
      const metadata = generateBaseMetadata();

      // Description should match
      expect(metadata.description).toBe(metadata.openGraph?.description);

      // Site name should be consistent
      expect(metadata.openGraph?.siteName).toBe(SITE_CONFIG.siteName);
    });

    it('should use SITE_CONFIG values correctly', () => {
      const metadata = generateBaseMetadata();

      expect(metadata.openGraph?.locale).toBe('th_TH');
      expect(metadata.openGraph?.siteName).toBe('Camping Thailand');
      expect(metadata.openGraph?.type).toBe('website');
    });
  });
});
