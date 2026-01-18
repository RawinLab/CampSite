/**
 * Unit Tests for Dynamic Sitemap Generation
 * Tests sitemap.ts functionality including static pages, dynamic content, and API integration
 */

import type { MetadataRoute } from 'next';
import sitemap from '../../src/app/sitemap';

// Mock the SEO utils
jest.mock('../../src/lib/seo/utils', () => ({
  SITE_CONFIG: {
    domain: 'https://campingthailand.com',
  },
}));

// Mock fetch globally
global.fetch = jest.fn();

describe('Sitemap Generation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Static Pages', () => {
    it('returns array with required fields', async () => {
      // Mock API responses to return empty arrays
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [] }),
        });

      const result = await sitemap();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      // Check that all entries have required fields
      result.forEach((entry) => {
        expect(entry).toHaveProperty('url');
        expect(entry).toHaveProperty('lastModified');
        expect(entry).toHaveProperty('changeFrequency');
        expect(entry).toHaveProperty('priority');
      });
    });

    it('includes home page with priority 1.0', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [] }),
        });

      const result = await sitemap();

      const homePage = result.find(
        (page) => page.url === 'https://campingthailand.com'
      );

      expect(homePage).toBeDefined();
      expect(homePage?.priority).toBe(1.0);
      expect(homePage?.changeFrequency).toBe('daily');
    });

    it('includes search page with priority 0.9', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [] }),
        });

      const result = await sitemap();

      const searchPage = result.find(
        (page) => page.url === 'https://campingthailand.com/search'
      );

      expect(searchPage).toBeDefined();
      expect(searchPage?.priority).toBe(0.9);
      expect(searchPage?.changeFrequency).toBe('daily');
    });

    it('includes auth pages with lower priority', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [] }),
        });

      const result = await sitemap();

      const loginPage = result.find(
        (page) => page.url === 'https://campingthailand.com/auth/login'
      );
      const signupPage = result.find(
        (page) => page.url === 'https://campingthailand.com/auth/signup'
      );

      expect(loginPage).toBeDefined();
      expect(loginPage?.priority).toBe(0.3);
      expect(loginPage?.changeFrequency).toBe('monthly');

      expect(signupPage).toBeDefined();
      expect(signupPage?.priority).toBe(0.3);
      expect(signupPage?.changeFrequency).toBe('monthly');
    });
  });

  describe('Campsite Type Pages', () => {
    it('includes all campsite type pages', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [] }),
        });

      const result = await sitemap();

      const expectedTypes = [
        'camping',
        'glamping',
        'tented-resort',
        'bungalow',
        'cabin',
        'rv-caravan',
      ];

      expectedTypes.forEach((type) => {
        const typePage = result.find(
          (page) => page.url === `https://campingthailand.com/types/${type}`
        );

        expect(typePage).toBeDefined();
        expect(typePage?.priority).toBe(0.7);
        expect(typePage?.changeFrequency).toBe('weekly');
      });
    });
  });

  describe('Dynamic Campsite Pages', () => {
    it('includes campsite pages from API with slug', async () => {
      const mockCampsites = [
        {
          id: '1',
          slug: 'amazing-campsite',
          updated_at: '2024-01-15T10:00:00Z',
        },
        {
          id: '2',
          slug: 'beautiful-glamping',
          updated_at: '2024-01-16T12:00:00Z',
        },
      ];

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockCampsites }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [] }),
        });

      const result = await sitemap();

      const campsite1 = result.find(
        (page) => page.url === 'https://campingthailand.com/campsites/amazing-campsite'
      );
      const campsite2 = result.find(
        (page) => page.url === 'https://campingthailand.com/campsites/beautiful-glamping'
      );

      expect(campsite1).toBeDefined();
      expect(campsite1?.priority).toBe(0.8);
      expect(campsite1?.changeFrequency).toBe('weekly');
      expect(campsite1?.lastModified).toEqual(new Date('2024-01-15T10:00:00Z'));

      expect(campsite2).toBeDefined();
      expect(campsite2?.priority).toBe(0.8);
      expect(campsite2?.changeFrequency).toBe('weekly');
      expect(campsite2?.lastModified).toEqual(new Date('2024-01-16T12:00:00Z'));
    });

    it('uses id as fallback when slug is missing', async () => {
      const mockCampsites = [
        {
          id: '123',
          updated_at: '2024-01-15T10:00:00Z',
        },
      ];

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockCampsites }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [] }),
        });

      const result = await sitemap();

      const campsite = result.find(
        (page) => page.url === 'https://campingthailand.com/campsites/123'
      );

      expect(campsite).toBeDefined();
    });

    it('handles API failure gracefully', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [] }),
        });

      const result = await sitemap();

      // Should still return static pages even if campsites API fails
      expect(result.length).toBeGreaterThan(0);
      const homePage = result.find(
        (page) => page.url === 'https://campingthailand.com'
      );
      expect(homePage).toBeDefined();
    });

    it('handles API error gracefully', async () => {
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [] }),
        });

      const result = await sitemap();

      // Should still return static pages even if API throws error
      expect(result.length).toBeGreaterThan(0);
    });

    it('handles unsuccessful API response', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: false }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [] }),
        });

      const result = await sitemap();

      // Should still return static pages
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('Province Pages', () => {
    it('includes province pages from API', async () => {
      const mockProvinces = [
        {
          id: '1',
          slug: 'chiang-mai',
          updated_at: '2024-01-10T08:00:00Z',
        },
        {
          id: '2',
          slug: 'phuket',
          updated_at: '2024-01-12T09:00:00Z',
        },
      ];

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockProvinces }),
        });

      const result = await sitemap();

      const province1 = result.find(
        (page) => page.url === 'https://campingthailand.com/provinces/chiang-mai'
      );
      const province2 = result.find(
        (page) => page.url === 'https://campingthailand.com/provinces/phuket'
      );

      expect(province1).toBeDefined();
      expect(province1?.priority).toBe(0.6);
      expect(province1?.changeFrequency).toBe('weekly');
      expect(province1?.lastModified).toEqual(new Date('2024-01-10T08:00:00Z'));

      expect(province2).toBeDefined();
      expect(province2?.priority).toBe(0.6);
      expect(province2?.changeFrequency).toBe('weekly');
      expect(province2?.lastModified).toEqual(new Date('2024-01-12T09:00:00Z'));
    });

    it('uses current date when updated_at is missing', async () => {
      const mockProvinces = [
        {
          id: '1',
          slug: 'bangkok',
        },
      ];

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockProvinces }),
        });

      const result = await sitemap();

      const province = result.find(
        (page) => page.url === 'https://campingthailand.com/provinces/bangkok'
      );

      expect(province).toBeDefined();
      expect(province?.lastModified).toBeInstanceOf(Date);
    });

    it('handles province API failure gracefully', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [] }),
        })
        .mockResolvedValueOnce({
          ok: false,
        });

      const result = await sitemap();

      // Should still return static pages even if provinces API fails
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('API Integration', () => {
    it('calls campsites API with correct endpoint and revalidation', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [] }),
        });

      await sitemap();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/campsites/sitemap'),
        expect.objectContaining({
          next: { revalidate: 3600 },
        })
      );
    });

    it('calls provinces API with correct endpoint and revalidation', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [] }),
        });

      await sitemap();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/provinces'),
        expect.objectContaining({
          next: { revalidate: 86400 },
        })
      );
    });
  });

  describe('Complete Sitemap Structure', () => {
    it('returns sitemap with all page types in correct order', async () => {
      const mockCampsites = [
        { id: '1', slug: 'test-campsite', updated_at: '2024-01-15T10:00:00Z' },
      ];
      const mockProvinces = [
        { id: '1', slug: 'test-province', updated_at: '2024-01-10T08:00:00Z' },
      ];

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockCampsites }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockProvinces }),
        });

      const result = await sitemap();

      // Should have static pages (4) + type pages (6) + campsites (1) + provinces (1)
      expect(result.length).toBe(12);

      // Check structure
      const urls = result.map((page) => page.url);

      // Static pages should be first
      expect(urls[0]).toBe('https://campingthailand.com');
      expect(urls[1]).toBe('https://campingthailand.com/search');

      // Type pages should follow
      expect(urls.some((url) => url.includes('/types/'))).toBe(true);

      // Dynamic pages should be included
      expect(urls.some((url) => url.includes('/campsites/'))).toBe(true);
      expect(urls.some((url) => url.includes('/provinces/'))).toBe(true);
    });
  });
});
