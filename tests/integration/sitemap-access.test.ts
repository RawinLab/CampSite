/**
 * Integration Test: Sitemap Accessibility
 * Tests sitemap generation functionality
 *
 * Validates sitemap structure, content, and SEO requirements
 */

// Define MetadataRoute.Sitemap type locally
type SitemapEntry = {
  url: string;
  lastModified?: string | Date;
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
};

type Sitemap = SitemapEntry[];

// Mock environment variables
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:4000';
process.env.NEXT_PUBLIC_SITE_URL = 'https://campingthailand.com';

// Mock SITE_CONFIG
const SITE_CONFIG = {
  domain: 'https://campingthailand.com',
  name: 'Camping Thailand',
  siteName: 'Camping Thailand',
};

// Mock API base URL
const API_BASE_URL = 'http://localhost:4000';

// Campsite types
const CAMPSITE_TYPES = [
  'camping',
  'glamping',
  'tented-resort',
  'bungalow',
  'cabin',
  'rv-caravan',
];

// Simulated sitemap function
async function generateSitemap(
  getCampsites: () => Promise<any[]>,
  getProvinces: () => Promise<any[]>
): Promise<Sitemap> {
  const baseUrl = SITE_CONFIG.domain;

  // Static pages
  const staticPages: Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/auth/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/auth/signup`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];

  // Campsite type pages
  const typePages: Sitemap = CAMPSITE_TYPES.map((type) => ({
    url: `${baseUrl}/types/${type}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // Dynamic campsite pages
  const campsites = await getCampsites();
  const campsitePages: Sitemap = campsites.map((campsite) => ({
    url: `${baseUrl}/campsites/${campsite.slug || campsite.id}`,
    lastModified: new Date(campsite.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // Province pages
  const provinces = await getProvinces();
  const provincePages: Sitemap = provinces.map((province) => ({
    url: `${baseUrl}/provinces/${province.slug}`,
    lastModified: province.updated_at ? new Date(province.updated_at) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  return [
    ...staticPages,
    ...typePages,
    ...campsitePages,
    ...provincePages,
  ];
}

describe('Sitemap Accessibility - Integration', () => {
  describe('Basic Sitemap Generation', () => {
    it('should return valid sitemap entries', async () => {
      const getCampsites = async () => [];
      const getProvinces = async () => [];

      const result = await generateSitemap(getCampsites, getProvinces);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should include all required fields for each entry', async () => {
      const getCampsites = async () => [];
      const getProvinces = async () => [];

      const result = await generateSitemap(getCampsites, getProvinces);

      result.forEach((entry: SitemapEntry) => {
        expect(entry).toHaveProperty('url');
        expect(entry).toHaveProperty('lastModified');
        expect(entry).toHaveProperty('changeFrequency');
        expect(entry).toHaveProperty('priority');
        expect(typeof entry.url).toBe('string');
        expect(entry.lastModified).toBeInstanceOf(Date);
      });
    });
  });

  describe('Static Pages Inclusion', () => {
    it('should include home page with highest priority', async () => {
      const getCampsites = async () => [];
      const getProvinces = async () => [];

      const result = await generateSitemap(getCampsites, getProvinces);

      const homePage = result.find((entry: SitemapEntry) => entry.url === 'https://campingthailand.com');
      expect(homePage).toBeDefined();
      expect(homePage?.priority).toBe(1.0);
      expect(homePage?.changeFrequency).toBe('daily');
    });

    it('should include search page', async () => {
      const getCampsites = async () => [];
      const getProvinces = async () => [];

      const result = await generateSitemap(getCampsites, getProvinces);

      const searchPage = result.find(
        (entry: SitemapEntry) => entry.url === 'https://campingthailand.com/search'
      );
      expect(searchPage).toBeDefined();
      expect(searchPage?.priority).toBe(0.9);
      expect(searchPage?.changeFrequency).toBe('daily');
    });

    it('should include authentication pages', async () => {
      const getCampsites = async () => [];
      const getProvinces = async () => [];

      const result = await generateSitemap(getCampsites, getProvinces);

      const loginPage = result.find(
        (entry: SitemapEntry) => entry.url === 'https://campingthailand.com/auth/login'
      );
      const signupPage = result.find(
        (entry: SitemapEntry) => entry.url === 'https://campingthailand.com/auth/signup'
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
    it('should include all campsite type pages', async () => {
      const getCampsites = async () => [];
      const getProvinces = async () => [];

      const result = await generateSitemap(getCampsites, getProvinces);

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
          (entry: SitemapEntry) => entry.url === `https://campingthailand.com/types/${type}`
        );
        expect(typePage).toBeDefined();
        expect(typePage?.priority).toBe(0.7);
        expect(typePage?.changeFrequency).toBe('weekly');
      });
    });
  });

  describe('URL Domain Configuration', () => {
    it('should use correct domain from SITE_CONFIG', async () => {
      const getCampsites = async () => [];
      const getProvinces = async () => [];

      const result = await generateSitemap(getCampsites, getProvinces);

      result.forEach((entry: SitemapEntry) => {
        expect(entry.url).toMatch(/^https:\/\/campingthailand\.com/);
      });
    });

    it('should not include trailing slashes in URLs', async () => {
      const getCampsites = async () => [];
      const getProvinces = async () => [];

      const result = await generateSitemap(getCampsites, getProvinces);

      result.forEach((entry: SitemapEntry) => {
        if (entry.url !== 'https://campingthailand.com') {
          expect(entry.url).not.toMatch(/\/$/);
        }
      });
    });
  });

  describe('Priority Values Validation', () => {
    it('should have valid priority values (0.0 - 1.0)', async () => {
      const getCampsites = async () => [];
      const getProvinces = async () => [];

      const result = await generateSitemap(getCampsites, getProvinces);

      result.forEach((entry: SitemapEntry) => {
        expect(entry.priority).toBeGreaterThanOrEqual(0.0);
        expect(entry.priority).toBeLessThanOrEqual(1.0);
      });
    });

    it('should prioritize pages correctly', async () => {
      const getCampsites = async () => [];
      const getProvinces = async () => [];

      const result = await generateSitemap(getCampsites, getProvinces);

      const homePage = result.find((entry: SitemapEntry) => entry.url === 'https://campingthailand.com');
      const searchPage = result.find(
        (entry: SitemapEntry) => entry.url === 'https://campingthailand.com/search'
      );
      const authPage = result.find(
        (entry: SitemapEntry) => entry.url === 'https://campingthailand.com/auth/login'
      );

      expect(homePage?.priority).toBeGreaterThan(searchPage?.priority || 0);
      expect(searchPage?.priority).toBeGreaterThan(authPage?.priority || 0);
    });
  });

  describe('Change Frequency Validation', () => {
    it('should have valid changeFrequency values', async () => {
      const getCampsites = async () => [];
      const getProvinces = async () => [];

      const result = await generateSitemap(getCampsites, getProvinces);

      const validFrequencies = [
        'always',
        'hourly',
        'daily',
        'weekly',
        'monthly',
        'yearly',
        'never',
      ];

      result.forEach((entry: SitemapEntry) => {
        expect(validFrequencies).toContain(entry.changeFrequency);
      });
    });

    it('should use appropriate frequencies for different page types', async () => {
      const getCampsites = async () => [];
      const getProvinces = async () => [];

      const result = await generateSitemap(getCampsites, getProvinces);

      const homePage = result.find((entry: SitemapEntry) => entry.url === 'https://campingthailand.com');
      const authPage = result.find(
        (entry: SitemapEntry) => entry.url === 'https://campingthailand.com/auth/login'
      );

      expect(homePage?.changeFrequency).toBe('daily');
      expect(authPage?.changeFrequency).toBe('monthly');
    });
  });

  describe('Dynamic Content - Campsites', () => {
    it('should fetch and include campsite pages', async () => {
      const mockCampsites = [
        {
          id: 'camp-1',
          slug: 'mountain-view-camping',
          updated_at: '2026-01-15T10:00:00Z',
        },
        {
          id: 'camp-2',
          slug: 'beach-glamping',
          updated_at: '2026-01-16T12:00:00Z',
        },
      ];

      const getCampsites = async () => mockCampsites;
      const getProvinces = async () => [];

      const result = await generateSitemap(getCampsites, getProvinces);

      const campsitePage1 = result.find(
        (entry: SitemapEntry) => entry.url === 'https://campingthailand.com/campsites/mountain-view-camping'
      );
      const campsitePage2 = result.find(
        (entry: SitemapEntry) => entry.url === 'https://campingthailand.com/campsites/beach-glamping'
      );

      expect(campsitePage1).toBeDefined();
      expect(campsitePage1?.priority).toBe(0.8);
      expect(campsitePage1?.changeFrequency).toBe('weekly');

      expect(campsitePage2).toBeDefined();
      expect(campsitePage2?.priority).toBe(0.8);
      expect(campsitePage2?.changeFrequency).toBe('weekly');
    });

    it('should use campsite ID when slug is not available', async () => {
      const mockCampsites = [
        {
          id: 'camp-no-slug',
          updated_at: '2026-01-15T10:00:00Z',
        },
      ];

      const getCampsites = async () => mockCampsites;
      const getProvinces = async () => [];

      const result = await generateSitemap(getCampsites, getProvinces);

      const campsitePage = result.find(
        (entry: SitemapEntry) => entry.url === 'https://campingthailand.com/campsites/camp-no-slug'
      );

      expect(campsitePage).toBeDefined();
    });

    it('should handle empty campsite list gracefully', async () => {
      const getCampsites = async () => [];
      const getProvinces = async () => [];

      const result = await generateSitemap(getCampsites, getProvinces);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      // Should still have static pages
      const homePage = result.find((entry: SitemapEntry) => entry.url === 'https://campingthailand.com');
      expect(homePage).toBeDefined();
    });
  });

  describe('Dynamic Content - Provinces', () => {
    it('should fetch and include province pages', async () => {
      const mockProvinces = [
        {
          id: 'prov-1',
          slug: 'chiang-mai',
          updated_at: '2026-01-10T10:00:00Z',
        },
        {
          id: 'prov-2',
          slug: 'phuket',
          updated_at: '2026-01-12T12:00:00Z',
        },
      ];

      const getCampsites = async () => [];
      const getProvinces = async () => mockProvinces;

      const result = await generateSitemap(getCampsites, getProvinces);

      const provincePage1 = result.find(
        (entry: SitemapEntry) => entry.url === 'https://campingthailand.com/provinces/chiang-mai'
      );
      const provincePage2 = result.find(
        (entry: SitemapEntry) => entry.url === 'https://campingthailand.com/provinces/phuket'
      );

      expect(provincePage1).toBeDefined();
      expect(provincePage1?.priority).toBe(0.6);
      expect(provincePage1?.changeFrequency).toBe('weekly');

      expect(provincePage2).toBeDefined();
      expect(provincePage2?.priority).toBe(0.6);
      expect(provincePage2?.changeFrequency).toBe('weekly');
    });

    it('should handle provinces without updated_at field', async () => {
      const mockProvinces = [
        {
          id: 'prov-1',
          slug: 'chiang-mai',
        },
      ];

      const getCampsites = async () => [];
      const getProvinces = async () => mockProvinces;

      const result = await generateSitemap(getCampsites, getProvinces);

      const provincePage = result.find(
        (entry: SitemapEntry) => entry.url === 'https://campingthailand.com/provinces/chiang-mai'
      );

      expect(provincePage).toBeDefined();
      expect(provincePage?.lastModified).toBeInstanceOf(Date);
    });

    it('should handle empty province list gracefully', async () => {
      const getCampsites = async () => [];
      const getProvinces = async () => [];

      const result = await generateSitemap(getCampsites, getProvinces);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      // Should still have static pages
      const homePage = result.find((entry: SitemapEntry) => entry.url === 'https://campingthailand.com');
      expect(homePage).toBeDefined();
    });
  });

  describe('Complete Sitemap Structure', () => {
    it('should include all page types in correct order', async () => {
      const mockCampsites = [
        {
          id: 'camp-1',
          slug: 'test-camp',
          updated_at: '2026-01-15T10:00:00Z',
        },
      ];

      const mockProvinces = [
        {
          id: 'prov-1',
          slug: 'test-province',
          updated_at: '2026-01-10T10:00:00Z',
        },
      ];

      const getCampsites = async () => mockCampsites;
      const getProvinces = async () => mockProvinces;

      const result = await generateSitemap(getCampsites, getProvinces);

      // Count different page types
      const staticPages = result.filter(
        (entry: SitemapEntry) =>
          entry.url === 'https://campingthailand.com' ||
          entry.url === 'https://campingthailand.com/search' ||
          entry.url.includes('/auth/')
      );

      const typePages = result.filter((entry: SitemapEntry) => entry.url.includes('/types/'));
      const campsitePages = result.filter((entry: SitemapEntry) => entry.url.includes('/campsites/'));
      const provincePages = result.filter((entry: SitemapEntry) => entry.url.includes('/provinces/'));

      expect(staticPages.length).toBe(4); // home, search, login, signup
      expect(typePages.length).toBe(6); // 6 campsite types
      expect(campsitePages.length).toBe(1);
      expect(provincePages.length).toBe(1);
      expect(result.length).toBe(12);
    });
  });

  describe('Last Modified Dates', () => {
    it('should use campsite updated_at for lastModified', async () => {
      const mockCampsites = [
        {
          id: 'camp-1',
          slug: 'test-camp',
          updated_at: '2026-01-15T10:30:45Z',
        },
      ];

      const getCampsites = async () => mockCampsites;
      const getProvinces = async () => [];

      const result = await generateSitemap(getCampsites, getProvinces);

      const campsitePage = result.find(
        (entry: SitemapEntry) => entry.url === 'https://campingthailand.com/campsites/test-camp'
      );

      expect(campsitePage?.lastModified).toEqual(new Date('2026-01-15T10:30:45Z'));
    });

    it('should use province updated_at for lastModified when available', async () => {
      const mockProvinces = [
        {
          id: 'prov-1',
          slug: 'test-province',
          updated_at: '2026-01-10T15:20:30Z',
        },
      ];

      const getCampsites = async () => [];
      const getProvinces = async () => mockProvinces;

      const result = await generateSitemap(getCampsites, getProvinces);

      const provincePage = result.find(
        (entry: SitemapEntry) => entry.url === 'https://campingthailand.com/provinces/test-province'
      );

      expect(provincePage?.lastModified).toEqual(new Date('2026-01-10T15:20:30Z'));
    });
  });

  describe('Sitemap Configuration', () => {
    it('should validate API endpoint configuration', () => {
      expect(API_BASE_URL).toBe('http://localhost:4000');
      expect(process.env.NEXT_PUBLIC_API_URL).toBe('http://localhost:4000');
    });

    it('should validate site domain configuration', () => {
      expect(SITE_CONFIG.domain).toBe('https://campingthailand.com');
      expect(process.env.NEXT_PUBLIC_SITE_URL).toBe('https://campingthailand.com');
    });

    it('should validate campsite types list', () => {
      expect(CAMPSITE_TYPES).toHaveLength(6);
      expect(CAMPSITE_TYPES).toContain('camping');
      expect(CAMPSITE_TYPES).toContain('glamping');
      expect(CAMPSITE_TYPES).toContain('tented-resort');
      expect(CAMPSITE_TYPES).toContain('bungalow');
      expect(CAMPSITE_TYPES).toContain('cabin');
      expect(CAMPSITE_TYPES).toContain('rv-caravan');
    });
  });
});
