// Mock dependencies BEFORE importing the service
const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

jest.mock('../../../src/lib/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
  },
}));

jest.mock('../../../src/utils/logger', () => mockLogger);

import { supabaseAdmin } from '../../../src/lib/supabase';

describe('ProvinceMatcherService', () => {
  let provinceMatcherService: any;

  const mockProvinces = [
    {
      id: 1,
      name_th: 'กรุงเทพมหานคร',
      name_en: 'Bangkok',
      slug: 'bangkok',
      latitude: 13.7563,
      longitude: 100.5018,
    },
    {
      id: 2,
      name_th: 'เชียงใหม่',
      name_en: 'Chiang Mai',
      slug: 'chiang-mai',
      latitude: 18.7883,
      longitude: 98.9853,
    },
    {
      id: 3,
      name_th: 'ภูเก็ต',
      name_en: 'Phuket',
      slug: 'phuket',
      latitude: 7.8804,
      longitude: 98.3923,
    },
  ];

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.resetModules();

    // Mock province data loading
    (supabaseAdmin.select as jest.Mock).mockResolvedValue({
      data: mockProvinces,
      error: null,
    });
  });

  describe('matchByCoordinates', () => {
    it('returns correct province for coordinates in Bangkok', async () => {
      const module = await import('../../../src/services/google-places/province-matcher.service');
      provinceMatcherService = module.default;

      // Wait for provinces to load
      await new Promise(resolve => setTimeout(resolve, 100));

      const result = await provinceMatcherService.matchByCoordinates(13.7500, 100.5000);

      expect(result).toBeDefined();
      expect(result?.name).toBe('Bangkok');
      expect(result?.id).toBe(1);
    });

    it('returns correct province for coordinates in Chiang Mai', async () => {
      const module = await import('../../../src/services/google-places/province-matcher.service');
      provinceMatcherService = module.default;

      await new Promise(resolve => setTimeout(resolve, 100));

      const result = await provinceMatcherService.matchByCoordinates(18.7900, 98.9800);

      expect(result).toBeDefined();
      expect(result?.name).toBe('Chiang Mai');
      expect(result?.id).toBe(2);
    });

    it('returns null for invalid coordinates', async () => {
      const module = await import('../../../src/services/google-places/province-matcher.service');
      provinceMatcherService = module.default;

      await new Promise(resolve => setTimeout(resolve, 100));

      // Coordinates far from any province (middle of ocean)
      const result = await provinceMatcherService.matchByCoordinates(0, 0);

      expect(result).toBeNull();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Coordinate too far from any province center',
        expect.objectContaining({
          lat: 0,
          lng: 0,
        })
      );
    });

    it('finds nearest province for coordinates between provinces', async () => {
      const module = await import('../../../src/services/google-places/province-matcher.service');
      provinceMatcherService = module.default;

      await new Promise(resolve => setTimeout(resolve, 100));

      // Coordinates between Bangkok and Chiang Mai
      const result = await provinceMatcherService.matchByCoordinates(15.0, 99.5);

      expect(result).toBeDefined();
      expect([1, 2]).toContain(result?.id); // Should be either Bangkok or Chiang Mai
    });
  });

  describe('matchByName', () => {
    beforeEach(async () => {
      // Initialize the service and wait for cache to load
      const module = await import('../../../src/services/google-places/province-matcher.service');
      provinceMatcherService = module.default;
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('matches province by English name', async () => {
      const result = await provinceMatcherService.matchByName('bangkok');

      expect(result).toBeDefined();
      expect(result?.name).toBe('Bangkok');
      expect(result?.id).toBe(1);
    });

    it('matches province by Thai name', async () => {
      const result = await provinceMatcherService.matchByName('เชียงใหม่');

      expect(result).toBeDefined();
      expect(result?.name).toBe('Chiang Mai');
      expect(result?.id).toBe(2);
    });

    it('matches province by slug', async () => {
      const result = await provinceMatcherService.matchByName('chiang-mai');

      expect(result).toBeDefined();
      expect(result?.name).toBe('Chiang Mai');
      expect(result?.id).toBe(2);
    });

    it('returns null for non-existent province', async () => {
      const result = await provinceMatcherService.matchByName('NonExistentProvince');

      expect(result).toBeNull();
    });

    it('performs case-insensitive matching', async () => {
      const result = await provinceMatcherService.matchByName('BANGKOK');

      expect(result).toBeDefined();
      expect(result?.name).toBe('Bangkok');
    });
  });

  describe('getAllProvinces', () => {
    it('returns all provinces', async () => {
      (supabaseAdmin.order as jest.Mock).mockResolvedValue({
        data: mockProvinces,
        error: null,
      });

      const module = await import('../../../src/services/google-places/province-matcher.service');
      provinceMatcherService = module.default;

      const result = await provinceMatcherService.getAllProvinces();

      expect(result).toHaveLength(3);
      expect(result[0]).toHaveProperty('name_en');
      expect(result[0]).toHaveProperty('name_th');
      expect(result[0]).toHaveProperty('slug');
    });
  });

  describe('province cache', () => {
    it('caches 77 Thai provinces on initialization', async () => {
      const full77Provinces = Array.from({ length: 77 }, (_, i) => ({
        id: i + 1,
        name_th: `จังหวัดที่ ${i + 1}`,
        name_en: `Province ${i + 1}`,
        slug: `province-${i + 1}`,
        latitude: 13.7563 + (i * 0.1),
        longitude: 100.5018 + (i * 0.1),
      }));

      (supabaseAdmin.select as jest.Mock).mockResolvedValue({
        data: full77Provinces,
        error: null,
      });

      jest.resetModules();
      const module = await import('../../../src/services/google-places/province-matcher.service');

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Provinces loaded into cache',
        { count: 77 }
      );
    });
  });
});
