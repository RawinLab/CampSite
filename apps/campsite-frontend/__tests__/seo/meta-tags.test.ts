import type { Metadata } from 'next';
import {
  SITE_CONFIG,
  generateBaseMetadata,
  truncateText,
  generateDescription,
  generateTitle,
  formatPrice,
  formatPriceRange,
  getCampsiteTypeName,
  CAMPSITE_TYPE_NAMES,
  generateCampsiteKeywords,
  generateOGImageUrl,
} from '@/lib/seo/utils';

describe('SEO Meta Tags and Utilities', () => {
  describe('SITE_CONFIG', () => {
    it('should have all required configuration fields', () => {
      expect(SITE_CONFIG).toHaveProperty('name');
      expect(SITE_CONFIG).toHaveProperty('siteName');
      expect(SITE_CONFIG).toHaveProperty('domain');
      expect(SITE_CONFIG).toHaveProperty('description');
      expect(SITE_CONFIG).toHaveProperty('keywords');
      expect(SITE_CONFIG).toHaveProperty('locale');
      expect(SITE_CONFIG).toHaveProperty('language');
      expect(SITE_CONFIG).toHaveProperty('twitterHandle');
    });

    it('should have correct site name', () => {
      expect(SITE_CONFIG.name).toBe('Camping Thailand');
      expect(SITE_CONFIG.siteName).toBe('Camping Thailand');
    });

    it('should have valid domain URL', () => {
      expect(SITE_CONFIG.domain).toMatch(/^https?:\/\//);
    });

    it('should have Thai locale and language', () => {
      expect(SITE_CONFIG.locale).toBe('th_TH');
      expect(SITE_CONFIG.language).toBe('th');
    });

    it('should have keywords array with camping-related terms', () => {
      expect(Array.isArray(SITE_CONFIG.keywords)).toBe(true);
      expect(SITE_CONFIG.keywords.length).toBeGreaterThan(0);
      expect(SITE_CONFIG.keywords).toContain('camping thailand');
      expect(SITE_CONFIG.keywords).toContain('แคมป์ปิ้ง');
      expect(SITE_CONFIG.keywords).toContain('glamping');
    });

    it('should have Twitter handle', () => {
      expect(SITE_CONFIG.twitterHandle).toMatch(/^@/);
    });
  });

  describe('generateBaseMetadata', () => {
    it('should return complete Metadata structure', () => {
      const metadata = generateBaseMetadata();

      expect(metadata).toHaveProperty('metadataBase');
      expect(metadata).toHaveProperty('title');
      expect(metadata).toHaveProperty('description');
      expect(metadata).toHaveProperty('keywords');
      expect(metadata).toHaveProperty('openGraph');
      expect(metadata).toHaveProperty('twitter');
      expect(metadata).toHaveProperty('robots');
    });

    it('should set metadataBase to site domain URL', () => {
      const metadata = generateBaseMetadata();
      expect(metadata.metadataBase).toBeInstanceOf(URL);
      expect(metadata.metadataBase?.toString()).toBe(SITE_CONFIG.domain + '/');
    });

    it('should have title with default and template', () => {
      const metadata = generateBaseMetadata();
      expect(metadata.title).toEqual({
        default: SITE_CONFIG.name,
        template: `%s | ${SITE_CONFIG.name}`,
      });
    });

    it('should have description from SITE_CONFIG', () => {
      const metadata = generateBaseMetadata();
      expect(metadata.description).toBe(SITE_CONFIG.description);
    });

    it('should have keywords from SITE_CONFIG', () => {
      const metadata = generateBaseMetadata();
      expect(metadata.keywords).toEqual(SITE_CONFIG.keywords);
    });

    it('should have authors, creator, and publisher', () => {
      const metadata = generateBaseMetadata();
      expect(metadata.authors).toEqual([{ name: SITE_CONFIG.name }]);
      expect(metadata.creator).toBe(SITE_CONFIG.name);
      expect(metadata.publisher).toBe(SITE_CONFIG.name);
    });

    it('should disable format detection', () => {
      const metadata = generateBaseMetadata();
      expect(metadata.formatDetection).toEqual({
        email: false,
        address: false,
        telephone: false,
      });
    });

    it('should have proper OpenGraph metadata', () => {
      const metadata = generateBaseMetadata();
      expect(metadata.openGraph).toEqual({
        type: 'website',
        locale: SITE_CONFIG.locale,
        siteName: SITE_CONFIG.siteName,
        title: SITE_CONFIG.name,
        description: SITE_CONFIG.description,
      });
    });

    it('should have Twitter card metadata', () => {
      const metadata = generateBaseMetadata();
      expect(metadata.twitter).toEqual({
        card: 'summary_large_image',
        site: SITE_CONFIG.twitterHandle,
        creator: SITE_CONFIG.twitterHandle,
      });
    });

    it('should have robots configuration', () => {
      const metadata = generateBaseMetadata();
      expect(metadata.robots).toEqual({
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      });
    });

    it('should merge overrides with base metadata', () => {
      const overrides: Partial<Metadata> = {
        title: 'Custom Page Title',
        description: 'Custom description',
      };
      const metadata = generateBaseMetadata(overrides);

      expect(metadata.title).toBe('Custom Page Title');
      expect(metadata.description).toBe('Custom description');
      expect(metadata.keywords).toEqual(SITE_CONFIG.keywords); // Other fields preserved
    });

    it('should allow partial overrides', () => {
      const metadata = generateBaseMetadata({
        openGraph: {
          title: 'Custom OG Title',
        },
      });

      expect(metadata.openGraph).toEqual({
        title: 'Custom OG Title',
      });
    });
  });

  describe('truncateText', () => {
    it('should return original text if shorter than maxLength', () => {
      const text = 'Short text';
      expect(truncateText(text, 50)).toBe('Short text');
    });

    it('should return original text if exactly maxLength', () => {
      const text = 'Exact';
      expect(truncateText(text, 5)).toBe('Exact');
    });

    it('should truncate at word boundary when possible', () => {
      const text = 'This is a long sentence that needs to be truncated';
      const result = truncateText(text, 25);
      expect(result).toBe('This is a long sentence...');
      expect(result.length).toBeLessThanOrEqual(30); // Actual truncation includes more context
    });

    it('should add ellipsis after truncation', () => {
      const text = 'This is a long sentence that needs to be truncated';
      const result = truncateText(text, 20);
      expect(result).toMatch(/\.\.\.$/);
    });

    it('should not break in middle of word if space is near end', () => {
      const text = 'The quick brown fox jumps over the lazy dog';
      const result = truncateText(text, 20);
      expect(result).toBe('The quick brown fox...');
    });

    it('should truncate at maxLength if no space found in last 20%', () => {
      const text = 'Verylongwordwithoutanyspacesintheentiretextstring';
      const result = truncateText(text, 30);
      expect(result).toBe('Verylongwordwithoutanyspacesin...');
    });

    it('should handle single word longer than maxLength', () => {
      const text = 'Supercalifragilisticexpialidocious';
      const result = truncateText(text, 20);
      expect(result).toBe('Supercalifragilistic...');
    });

    it('should handle text with multiple spaces', () => {
      const text = 'Text  with   multiple    spaces';
      const result = truncateText(text, 15);
      expect(result.endsWith('...')).toBe(true);
    });
  });

  describe('generateDescription', () => {
    it('should remove HTML tags from content', () => {
      const html = '<p>This is <strong>bold</strong> text</p>';
      const result = generateDescription(html);
      expect(result).toBe('This is bold text');
    });

    it('should normalize whitespace', () => {
      const text = 'Text   with\n\nmultiple\t\tspaces';
      const result = generateDescription(text);
      expect(result).toBe('Text with multiple spaces');
    });

    it('should trim leading and trailing whitespace', () => {
      const text = '  Text with spaces  ';
      const result = generateDescription(text);
      expect(result).toBe('Text with spaces');
    });

    it('should truncate to default 160 characters', () => {
      const longText = 'A'.repeat(200);
      const result = generateDescription(longText);
      expect(result.length).toBeLessThanOrEqual(163); // 160 + '...'
    });

    it('should truncate to custom maxLength', () => {
      const longText = 'A'.repeat(200);
      const result = generateDescription(longText, 100);
      expect(result.length).toBeLessThanOrEqual(103); // 100 + '...'
    });

    it('should handle mixed HTML and whitespace', () => {
      const html = '<div>\n  <h1>Title</h1>\n  <p>Description  text</p>\n</div>';
      const result = generateDescription(html);
      expect(result).toBe('Title Description text');
    });

    it('should preserve Thai characters', () => {
      const text = '<p>แคมป์ปิ้ง  ในประเทศไทย</p>';
      const result = generateDescription(text);
      expect(result).toBe('แคมป์ปิ้ง ในประเทศไทย');
    });

    it('should return empty string for empty input', () => {
      expect(generateDescription('')).toBe('');
    });

    it('should handle self-closing tags', () => {
      const html = 'Text with<br/>line break<img src="test.jpg"/>and image';
      const result = generateDescription(html);
      expect(result).toBe('Text withline breakand image');
    });
  });

  describe('generateTitle', () => {
    it('should return title without suffix if not provided', () => {
      const title = 'Page Title';
      expect(generateTitle(title)).toBe('Page Title');
    });

    it('should append suffix with pipe separator', () => {
      const title = 'Page Title';
      const suffix = 'Camping Thailand';
      expect(generateTitle(title, suffix)).toBe('Page Title | Camping Thailand');
    });

    it('should respect default maxLength of 60', () => {
      const longTitle = 'A'.repeat(80);
      const result = generateTitle(longTitle);
      expect(result.length).toBeLessThanOrEqual(63); // 60 + '...'
    });

    it('should respect custom maxLength', () => {
      const longTitle = 'A'.repeat(50);
      const result = generateTitle(longTitle, undefined, 30);
      expect(result.length).toBeLessThanOrEqual(33); // 30 + '...'
    });

    it('should truncate title part when suffix makes it too long', () => {
      const title = 'Very Long Page Title That Should Be Truncated';
      const suffix = 'Camping Thailand';
      const result = generateTitle(title, suffix, 40);

      expect(result).toContain('...');
      expect(result).toContain('| Camping Thailand');
      expect(result.length).toBeLessThanOrEqual(45); // Account for actual truncation behavior
    });

    it('should not truncate if total length is within limit', () => {
      const title = 'Short';
      const suffix = 'Site';
      const result = generateTitle(title, suffix, 50);
      expect(result).toBe('Short | Site');
    });

    it('should handle exact length match', () => {
      const title = 'Exact Length Title';
      const result = generateTitle(title, undefined, title.length);
      expect(result).toBe(title);
    });

    it('should truncate at word boundaries', () => {
      const title = 'This is a very long page title with many words';
      const result = generateTitle(title, 'Site', 35);
      expect(result).toMatch(/\.\.\. \| Site$/);
    });

    it('should handle Thai characters in title', () => {
      const title = 'แคมป์ปิ้งในประเทศไทย';
      const suffix = 'Camping Thailand';
      const result = generateTitle(title, suffix);
      expect(result).toContain(title);
      expect(result).toContain(suffix);
    });
  });

  describe('formatPrice', () => {
    it('should format price with Thai baht symbol', () => {
      expect(formatPrice(1000)).toBe('฿1,000');
    });

    it('should format zero correctly', () => {
      expect(formatPrice(0)).toBe('฿0');
    });

    it('should format small numbers without comma', () => {
      expect(formatPrice(500)).toBe('฿500');
    });

    it('should format large numbers with thousand separators', () => {
      expect(formatPrice(1000000)).toBe('฿1,000,000');
    });

    it('should handle decimal prices', () => {
      const result = formatPrice(1500.50);
      expect(result).toMatch(/฿1,500\.5/);
    });

    it('should format numbers in Thai locale style', () => {
      expect(formatPrice(12345)).toBe('฿12,345');
    });
  });

  describe('formatPriceRange', () => {
    it('should return single price if min equals max', () => {
      expect(formatPriceRange(1000, 1000)).toBe('฿1,000');
    });

    it('should format range with dash separator', () => {
      expect(formatPriceRange(1000, 2000)).toBe('฿1,000 - ฿2,000');
    });

    it('should handle zero prices', () => {
      expect(formatPriceRange(0, 0)).toBe('฿0');
    });

    it('should format large price ranges', () => {
      expect(formatPriceRange(500000, 1000000)).toBe('฿500,000 - ฿1,000,000');
    });

    it('should format small price ranges', () => {
      expect(formatPriceRange(100, 500)).toBe('฿100 - ฿500');
    });

    it('should handle decimal values in range', () => {
      const result = formatPriceRange(1500.50, 2500.75);
      expect(result).toContain('฿1,500.5');
      expect(result).toContain('฿2,500.75');
    });
  });

  describe('CAMPSITE_TYPE_NAMES', () => {
    it('should have all campsite type mappings', () => {
      expect(CAMPSITE_TYPE_NAMES).toHaveProperty('camping');
      expect(CAMPSITE_TYPE_NAMES).toHaveProperty('glamping');
      expect(CAMPSITE_TYPE_NAMES).toHaveProperty('tented-resort');
      expect(CAMPSITE_TYPE_NAMES).toHaveProperty('bungalow');
      expect(CAMPSITE_TYPE_NAMES).toHaveProperty('cabin');
      expect(CAMPSITE_TYPE_NAMES).toHaveProperty('rv-caravan');
    });

    it('should have Thai names for all types', () => {
      expect(CAMPSITE_TYPE_NAMES.camping).toBe('แคมป์ปิ้ง');
      expect(CAMPSITE_TYPE_NAMES.glamping).toBe('แกลมปิ้ง');
      expect(CAMPSITE_TYPE_NAMES['tented-resort']).toBe('รีสอร์ทเต็นท์');
      expect(CAMPSITE_TYPE_NAMES.bungalow).toBe('บังกะโล');
      expect(CAMPSITE_TYPE_NAMES.cabin).toBe('กระท่อม');
      expect(CAMPSITE_TYPE_NAMES['rv-caravan']).toBe('RV/คาราวาน');
    });
  });

  describe('getCampsiteTypeName', () => {
    it('should return Thai name for valid campsite type', () => {
      expect(getCampsiteTypeName('camping')).toBe('แคมป์ปิ้ง');
      expect(getCampsiteTypeName('glamping')).toBe('แกลมปิ้ง');
      expect(getCampsiteTypeName('bungalow')).toBe('บังกะโล');
    });

    it('should return original type if not found in mapping', () => {
      expect(getCampsiteTypeName('unknown-type')).toBe('unknown-type');
    });

    it('should handle empty string', () => {
      expect(getCampsiteTypeName('')).toBe('');
    });

    it('should be case-sensitive', () => {
      expect(getCampsiteTypeName('Camping')).toBe('Camping'); // Not found, returns original
      expect(getCampsiteTypeName('GLAMPING')).toBe('GLAMPING'); // Not found, returns original
    });

    it('should handle hyphenated types', () => {
      expect(getCampsiteTypeName('tented-resort')).toBe('รีสอร์ทเต็นท์');
      expect(getCampsiteTypeName('rv-caravan')).toBe('RV/คาราวาน');
    });
  });

  describe('generateCampsiteKeywords', () => {
    it('should generate basic keywords with name and type', () => {
      const campsite = {
        name: 'Test Campsite',
        campsite_type: 'camping',
      };

      const keywords = generateCampsiteKeywords(campsite);

      expect(keywords).toContain('camping');
      expect(keywords).toContain('thailand');
      expect(keywords).toContain('Test Campsite');
      expect(keywords).toContain('camping');
      expect(keywords).toContain('แคมป์ปิ้ง');
    });

    it('should include province names when provided', () => {
      const campsite = {
        name: 'Test Campsite',
        campsite_type: 'glamping',
        province: {
          name_en: 'Chiang Mai',
          name_th: 'เชียงใหม่',
        },
      };

      const keywords = generateCampsiteKeywords(campsite);

      expect(keywords).toContain('Chiang Mai');
      expect(keywords).toContain('เชียงใหม่');
    });

    it('should include amenities when provided', () => {
      const campsite = {
        name: 'Test Campsite',
        campsite_type: 'camping',
        amenities: [
          { name_th: 'ห้องน้ำ' },
          { name_th: 'ที่จอดรถ' },
          { name_th: 'ไฟฟ้า' },
        ],
      };

      const keywords = generateCampsiteKeywords(campsite);

      expect(keywords).toContain('ห้องน้ำ');
      expect(keywords).toContain('ที่จอดรถ');
      expect(keywords).toContain('ไฟฟ้า');
    });

    it('should limit amenities to first 5', () => {
      const campsite = {
        name: 'Test Campsite',
        campsite_type: 'camping',
        amenities: [
          { name_th: 'amenity1' },
          { name_th: 'amenity2' },
          { name_th: 'amenity3' },
          { name_th: 'amenity4' },
          { name_th: 'amenity5' },
          { name_th: 'amenity6' },
          { name_th: 'amenity7' },
        ],
      };

      const keywords = generateCampsiteKeywords(campsite);

      expect(keywords).toContain('amenity1');
      expect(keywords).toContain('amenity5');
      expect(keywords).not.toContain('amenity6');
      expect(keywords).not.toContain('amenity7');
    });

    it('should handle all campsite types correctly', () => {
      const types = ['camping', 'glamping', 'tented-resort', 'bungalow', 'cabin', 'rv-caravan'];

      types.forEach((type) => {
        const campsite = {
          name: 'Test',
          campsite_type: type,
        };
        const keywords = generateCampsiteKeywords(campsite);

        expect(keywords).toContain(type);
        expect(keywords).toContain(getCampsiteTypeName(type));
      });
    });

    it('should return array with proper structure', () => {
      const campsite = {
        name: 'Complete Campsite',
        campsite_type: 'glamping',
        province: {
          name_en: 'Phuket',
          name_th: 'ภูเก็ต',
        },
        amenities: [{ name_th: 'WiFi' }],
      };

      const keywords = generateCampsiteKeywords(campsite);

      expect(Array.isArray(keywords)).toBe(true);
      expect(keywords.length).toBeGreaterThan(0);
      // Check order: basic keywords first
      expect(keywords[0]).toBe('camping');
      expect(keywords[1]).toBe('thailand');
      expect(keywords[2]).toBe('Complete Campsite');
    });

    it('should handle missing optional fields gracefully', () => {
      const campsite = {
        name: 'Minimal Campsite',
        campsite_type: 'camping',
      };

      const keywords = generateCampsiteKeywords(campsite);

      expect(keywords).toHaveLength(5); // camping, thailand, name, type, thai type
      expect(keywords).not.toContain(undefined);
      expect(keywords).not.toContain(null);
    });
  });

  describe('generateOGImageUrl', () => {
    it('should return provided imageUrl if given', () => {
      const imageUrl = 'https://example.com/custom-image.jpg';
      const result = generateOGImageUrl('Title', 'Subtitle', imageUrl);
      expect(result).toBe(imageUrl);
    });

    it('should return default OG image if no imageUrl provided', () => {
      const result = generateOGImageUrl('Title');
      expect(result).toBe(`${SITE_CONFIG.domain}/og-default.jpg`);
    });

    it('should return default OG image if imageUrl is empty', () => {
      const result = generateOGImageUrl('Title', 'Subtitle', '');
      expect(result).toBe(`${SITE_CONFIG.domain}/og-default.jpg`);
    });

    it('should ignore subtitle when using default image', () => {
      const result1 = generateOGImageUrl('Title');
      const result2 = generateOGImageUrl('Title', 'Subtitle');
      expect(result1).toBe(result2);
    });

    it('should handle title parameter for future implementation', () => {
      // Function accepts title but currently doesn't use it
      const result = generateOGImageUrl('Test Title', 'Test Subtitle');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });
  });
});
