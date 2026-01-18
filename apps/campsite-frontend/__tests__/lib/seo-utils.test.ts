import {
  getCanonicalUrl,
  getCampsiteCanonicalUrl,
  getSearchCanonicalUrl,
  getProvinceCanonicalUrl,
  getCampsiteTypeCanonicalUrl,
  getAlternateUrls,
  getPaginationUrls,
} from '../../src/lib/seo/canonical';

describe('SEO Canonical URL Utilities', () => {
  const originalEnv = process.env.NEXT_PUBLIC_SITE_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://campingthailand.com';
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = originalEnv;
  });

  describe('getCanonicalUrl', () => {
    describe('absolute URL generation', () => {
      it('should generate absolute URL from relative path', () => {
        const url = getCanonicalUrl('/campsites');
        expect(url).toBe('https://campingthailand.com/campsites');
      });

      it('should generate absolute URL from path without leading slash', () => {
        const url = getCanonicalUrl('campsites');
        expect(url).toBe('https://campingthailand.com/campsites');
      });

      it('should handle root path correctly', () => {
        const url = getCanonicalUrl('/');
        expect(url).toBe('https://campingthailand.com/');
      });

      it('should handle nested paths', () => {
        const url = getCanonicalUrl('/campsites/detail/123');
        expect(url).toBe('https://campingthailand.com/campsites/detail/123');
      });
    });

    describe('trailing slash normalization', () => {
      it('should remove trailing slash from paths', () => {
        const url = getCanonicalUrl('/campsites/');
        expect(url).toBe('https://campingthailand.com/campsites');
      });

      it('should remove trailing slash from nested paths', () => {
        const url = getCanonicalUrl('/search/results/');
        expect(url).toBe('https://campingthailand.com/search/results');
      });

      it('should keep trailing slash for root path', () => {
        const url = getCanonicalUrl('/');
        expect(url).toBe('https://campingthailand.com/');
      });

      it('should handle multiple trailing slashes', () => {
        const url = getCanonicalUrl('/campsites//');
        expect(url).toBe('https://campingthailand.com/campsites/');
      });

      it('should normalize path with query string and trailing slash', () => {
        const url = getCanonicalUrl('/search?q=camping/');
        expect(url).toBe('https://campingthailand.com/search?q=camping');
      });
    });

    describe('edge cases', () => {
      it('should handle empty string', () => {
        const url = getCanonicalUrl('');
        expect(url).toBe('https://campingthailand.com/');
      });

      it('should handle path with query parameters', () => {
        const url = getCanonicalUrl('/search?q=camping&province=bangkok');
        expect(url).toBe('https://campingthailand.com/search?q=camping&province=bangkok');
      });

      it('should handle path with hash fragment', () => {
        const url = getCanonicalUrl('/campsites/123#reviews');
        expect(url).toBe('https://campingthailand.com/campsites/123#reviews');
      });

      it('should handle special characters in path', () => {
        const url = getCanonicalUrl('/provinces/เชียงใหม่');
        expect(url).toBe('https://campingthailand.com/provinces/เชียงใหม่');
      });
    });
  });

  describe('getCampsiteCanonicalUrl', () => {
    it('should generate campsite URL with ID', () => {
      const url = getCampsiteCanonicalUrl('123');
      expect(url).toBe('https://campingthailand.com/campsites/123');
    });

    it('should generate campsite URL with slug', () => {
      const url = getCampsiteCanonicalUrl('mountain-view-camping');
      expect(url).toBe('https://campingthailand.com/campsites/mountain-view-camping');
    });

    it('should generate campsite URL with UUID', () => {
      const url = getCampsiteCanonicalUrl('550e8400-e29b-41d4-a716-446655440000');
      expect(url).toBe('https://campingthailand.com/campsites/550e8400-e29b-41d4-a716-446655440000');
    });

    it('should handle Thai characters in slug', () => {
      const url = getCampsiteCanonicalUrl('แคมป์ปิ้ง-ดอยอ่างขาง');
      expect(url).toBe('https://campingthailand.com/campsites/แคมป์ปิ้ง-ดอยอ่างขาง');
    });
  });

  describe('getSearchCanonicalUrl', () => {
    describe('query parameter handling', () => {
      it('should generate search URL without parameters', () => {
        const url = getSearchCanonicalUrl();
        expect(url).toBe('https://campingthailand.com/search');
      });

      it('should generate search URL with empty params object', () => {
        const url = getSearchCanonicalUrl({});
        expect(url).toBe('https://campingthailand.com/search');
      });

      it('should include q parameter', () => {
        const url = getSearchCanonicalUrl({ q: 'camping' });
        expect(url).toBe('https://campingthailand.com/search?q=camping');
      });

      it('should include province parameter', () => {
        const url = getSearchCanonicalUrl({ province: 'bangkok' });
        expect(url).toBe('https://campingthailand.com/search?province=bangkok');
      });

      it('should include type parameter', () => {
        const url = getSearchCanonicalUrl({ type: 'glamping' });
        expect(url).toBe('https://campingthailand.com/search?type=glamping');
      });

      it('should include page parameter when greater than 1', () => {
        const url = getSearchCanonicalUrl({ page: 2 });
        expect(url).toBe('https://campingthailand.com/search?page=2');
      });

      it('should exclude page parameter when equal to 1', () => {
        const url = getSearchCanonicalUrl({ page: 1 });
        expect(url).toBe('https://campingthailand.com/search');
      });

      it('should include all parameters', () => {
        const url = getSearchCanonicalUrl({
          q: 'mountain',
          province: 'chiang-mai',
          type: 'camping',
          page: 3,
        });
        expect(url).toContain('search?');
        expect(url).toContain('q=mountain');
        expect(url).toContain('province=chiang-mai');
        expect(url).toContain('type=camping');
        expect(url).toContain('page=3');
      });

      it('should handle Thai search query', () => {
        const url = getSearchCanonicalUrl({ q: 'แคมป์ปิ้ง' });
        expect(url).toContain('q=%E0%B9%81%E0%B8%84%E0%B8%A1%E0%B8%9B%E0%B9%8C%E0%B8%9B%E0%B8%B4%E0%B9%89%E0%B8%87');
      });

      it('should handle special characters in query', () => {
        const url = getSearchCanonicalUrl({ q: 'camping & glamping' });
        expect(url).toContain('q=camping+%26+glamping');
      });
    });

    describe('parameter combinations', () => {
      it('should handle q and province', () => {
        const url = getSearchCanonicalUrl({ q: 'beach', province: 'phuket' });
        expect(url).toContain('q=beach');
        expect(url).toContain('province=phuket');
      });

      it('should handle q and type', () => {
        const url = getSearchCanonicalUrl({ q: 'luxury', type: 'glamping' });
        expect(url).toContain('q=luxury');
        expect(url).toContain('type=glamping');
      });

      it('should handle province and type', () => {
        const url = getSearchCanonicalUrl({ province: 'krabi', type: 'bungalow' });
        expect(url).toContain('province=krabi');
        expect(url).toContain('type=bungalow');
      });

      it('should handle q, province, and type', () => {
        const url = getSearchCanonicalUrl({
          q: 'forest',
          province: 'chiang-rai',
          type: 'cabin',
        });
        expect(url).toContain('q=forest');
        expect(url).toContain('province=chiang-rai');
        expect(url).toContain('type=cabin');
      });
    });
  });

  describe('getProvinceCanonicalUrl', () => {
    it('should generate province URL with slug', () => {
      const url = getProvinceCanonicalUrl('bangkok');
      expect(url).toBe('https://campingthailand.com/provinces/bangkok');
    });

    it('should generate province URL with hyphenated slug', () => {
      const url = getProvinceCanonicalUrl('chiang-mai');
      expect(url).toBe('https://campingthailand.com/provinces/chiang-mai');
    });

    it('should handle Thai province names', () => {
      const url = getProvinceCanonicalUrl('เชียงใหม่');
      expect(url).toBe('https://campingthailand.com/provinces/เชียงใหม่');
    });

    it('should handle province slug with numbers', () => {
      const url = getProvinceCanonicalUrl('province-123');
      expect(url).toBe('https://campingthailand.com/provinces/province-123');
    });
  });

  describe('getCampsiteTypeCanonicalUrl', () => {
    it('should generate type URL for camping', () => {
      const url = getCampsiteTypeCanonicalUrl('camping');
      expect(url).toBe('https://campingthailand.com/types/camping');
    });

    it('should generate type URL for glamping', () => {
      const url = getCampsiteTypeCanonicalUrl('glamping');
      expect(url).toBe('https://campingthailand.com/types/glamping');
    });

    it('should generate type URL for tented-resort', () => {
      const url = getCampsiteTypeCanonicalUrl('tented-resort');
      expect(url).toBe('https://campingthailand.com/types/tented-resort');
    });

    it('should generate type URL for bungalow', () => {
      const url = getCampsiteTypeCanonicalUrl('bungalow');
      expect(url).toBe('https://campingthailand.com/types/bungalow');
    });

    it('should generate type URL for cabin', () => {
      const url = getCampsiteTypeCanonicalUrl('cabin');
      expect(url).toBe('https://campingthailand.com/types/cabin');
    });

    it('should generate type URL for rv-caravan', () => {
      const url = getCampsiteTypeCanonicalUrl('rv-caravan');
      expect(url).toBe('https://campingthailand.com/types/rv-caravan');
    });
  });

  describe('getAlternateUrls', () => {
    it('should return language alternate URLs', () => {
      const urls = getAlternateUrls('/campsites');
      expect(urls).toHaveProperty('x-default');
      expect(urls).toHaveProperty('th');
    });

    it('should return correct x-default URL', () => {
      const urls = getAlternateUrls('/campsites');
      expect(urls['x-default']).toBe('https://campingthailand.com/campsites');
    });

    it('should return correct Thai URL', () => {
      const urls = getAlternateUrls('/campsites');
      expect(urls.th).toBe('https://campingthailand.com/campsites');
    });

    it('should handle root path', () => {
      const urls = getAlternateUrls('/');
      expect(urls['x-default']).toBe('https://campingthailand.com/');
      expect(urls.th).toBe('https://campingthailand.com/');
    });

    it('should handle nested paths', () => {
      const urls = getAlternateUrls('/provinces/chiang-mai');
      expect(urls['x-default']).toBe('https://campingthailand.com/provinces/chiang-mai');
      expect(urls.th).toBe('https://campingthailand.com/provinces/chiang-mai');
    });

    it('should handle paths with query parameters', () => {
      const urls = getAlternateUrls('/search?q=camping');
      expect(urls['x-default']).toBe('https://campingthailand.com/search?q=camping');
      expect(urls.th).toBe('https://campingthailand.com/search?q=camping');
    });

    it('should return both x-default and th with same value', () => {
      const urls = getAlternateUrls('/about');
      expect(urls['x-default']).toBe(urls.th);
    });
  });

  describe('getPaginationUrls', () => {
    describe('first and last URLs', () => {
      it('should return correct first URL', () => {
        const urls = getPaginationUrls('/search', 1, 5);
        expect(urls.first).toBe('https://campingthailand.com/search');
      });

      it('should return correct last URL for multiple pages', () => {
        const urls = getPaginationUrls('/search', 1, 5);
        expect(urls.last).toBe('https://campingthailand.com/search?page=5');
      });

      it('should return same first and last URL for single page', () => {
        const urls = getPaginationUrls('/search', 1, 1);
        expect(urls.first).toBe('https://campingthailand.com/search');
        expect(urls.last).toBe('https://campingthailand.com/search');
      });
    });

    describe('previous URL', () => {
      it('should not include prev URL on first page', () => {
        const urls = getPaginationUrls('/search', 1, 5);
        expect(urls.prev).toBeUndefined();
      });

      it('should include prev URL on second page without page parameter', () => {
        const urls = getPaginationUrls('/search', 2, 5);
        expect(urls.prev).toBe('https://campingthailand.com/search');
      });

      it('should include prev URL with page parameter on third page', () => {
        const urls = getPaginationUrls('/search', 3, 5);
        expect(urls.prev).toBe('https://campingthailand.com/search?page=2');
      });

      it('should include prev URL with page parameter on middle page', () => {
        const urls = getPaginationUrls('/search', 4, 10);
        expect(urls.prev).toBe('https://campingthailand.com/search?page=3');
      });

      it('should include prev URL with page parameter on last page', () => {
        const urls = getPaginationUrls('/search', 5, 5);
        expect(urls.prev).toBe('https://campingthailand.com/search?page=4');
      });
    });

    describe('next URL', () => {
      it('should include next URL on first page', () => {
        const urls = getPaginationUrls('/search', 1, 5);
        expect(urls.next).toBe('https://campingthailand.com/search?page=2');
      });

      it('should include next URL on middle page', () => {
        const urls = getPaginationUrls('/search', 3, 5);
        expect(urls.next).toBe('https://campingthailand.com/search?page=4');
      });

      it('should not include next URL on last page', () => {
        const urls = getPaginationUrls('/search', 5, 5);
        expect(urls.next).toBeUndefined();
      });

      it('should not include next URL on single page', () => {
        const urls = getPaginationUrls('/search', 1, 1);
        expect(urls.next).toBeUndefined();
      });
    });

    describe('all URL combinations', () => {
      it('should return only first, last, and next on page 1 of 5', () => {
        const urls = getPaginationUrls('/search', 1, 5);
        expect(urls).toEqual({
          first: 'https://campingthailand.com/search',
          last: 'https://campingthailand.com/search?page=5',
          next: 'https://campingthailand.com/search?page=2',
        });
      });

      it('should return all URLs on page 2 of 5', () => {
        const urls = getPaginationUrls('/search', 2, 5);
        expect(urls).toEqual({
          first: 'https://campingthailand.com/search',
          last: 'https://campingthailand.com/search?page=5',
          prev: 'https://campingthailand.com/search',
          next: 'https://campingthailand.com/search?page=3',
        });
      });

      it('should return all URLs on page 3 of 5', () => {
        const urls = getPaginationUrls('/search', 3, 5);
        expect(urls).toEqual({
          first: 'https://campingthailand.com/search',
          last: 'https://campingthailand.com/search?page=5',
          prev: 'https://campingthailand.com/search?page=2',
          next: 'https://campingthailand.com/search?page=4',
        });
      });

      it('should return only first, last, and prev on page 5 of 5', () => {
        const urls = getPaginationUrls('/search', 5, 5);
        expect(urls).toEqual({
          first: 'https://campingthailand.com/search',
          last: 'https://campingthailand.com/search?page=5',
          prev: 'https://campingthailand.com/search?page=4',
        });
      });

      it('should return only first and last on single page', () => {
        const urls = getPaginationUrls('/search', 1, 1);
        expect(urls).toEqual({
          first: 'https://campingthailand.com/search',
          last: 'https://campingthailand.com/search',
        });
      });
    });

    describe('different base paths', () => {
      it('should handle search path', () => {
        const urls = getPaginationUrls('/search', 2, 3);
        expect(urls.first).toBe('https://campingthailand.com/search');
        expect(urls.prev).toBe('https://campingthailand.com/search');
        expect(urls.next).toBe('https://campingthailand.com/search?page=3');
      });

      it('should handle provinces path', () => {
        const urls = getPaginationUrls('/provinces/bangkok', 2, 4);
        expect(urls.first).toBe('https://campingthailand.com/provinces/bangkok');
        expect(urls.last).toBe('https://campingthailand.com/provinces/bangkok?page=4');
      });

      it('should handle types path', () => {
        const urls = getPaginationUrls('/types/glamping', 1, 2);
        expect(urls.first).toBe('https://campingthailand.com/types/glamping');
        expect(urls.next).toBe('https://campingthailand.com/types/glamping?page=2');
      });

      it('should handle root path', () => {
        const urls = getPaginationUrls('/', 3, 6);
        expect(urls.first).toBe('https://campingthailand.com/');
        expect(urls.prev).toBe('https://campingthailand.com/?page=2');
      });
    });

    describe('edge cases', () => {
      it('should handle large page numbers', () => {
        const urls = getPaginationUrls('/search', 100, 150);
        expect(urls.prev).toBe('https://campingthailand.com/search?page=99');
        expect(urls.next).toBe('https://campingthailand.com/search?page=101');
        expect(urls.last).toBe('https://campingthailand.com/search?page=150');
      });

      it('should handle two-page scenario', () => {
        const urls = getPaginationUrls('/search', 1, 2);
        expect(urls).toEqual({
          first: 'https://campingthailand.com/search',
          last: 'https://campingthailand.com/search?page=2',
          next: 'https://campingthailand.com/search?page=2',
        });
      });

      it('should handle second page of two-page scenario', () => {
        const urls = getPaginationUrls('/search', 2, 2);
        expect(urls).toEqual({
          first: 'https://campingthailand.com/search',
          last: 'https://campingthailand.com/search?page=2',
          prev: 'https://campingthailand.com/search',
        });
      });
    });
  });
});
