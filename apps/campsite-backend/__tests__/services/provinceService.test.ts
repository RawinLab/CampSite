import { ProvinceService } from '../../src/services/provinceService';
import type { ProvinceSuggestion, Province } from '@campsite/shared';

// Mock Supabase Admin
jest.mock('../../src/lib/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        or: jest.fn(() => ({
          order: jest.fn(() => ({
            limit: jest.fn(),
          })),
        })),
        order: jest.fn(() => ({
          limit: jest.fn(),
        })),
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
    })),
  },
}));

import { supabaseAdmin } from '../../src/lib/supabase';

describe('ProvinceService', () => {
  let provinceService: ProvinceService;
  let mockFrom: jest.Mock;
  let mockSelect: jest.Mock;
  let mockOr: jest.Mock;
  let mockOrder: jest.Mock;
  let mockLimit: jest.Mock;
  let mockEq: jest.Mock;
  let mockSingle: jest.Mock;

  beforeEach(() => {
    provinceService = new ProvinceService();

    // Reset mocks
    jest.clearAllMocks();

    // Setup mock chain
    mockLimit = jest.fn();
    mockSingle = jest.fn();

    // mockOrder can return either { limit: mockLimit } or resolve directly
    // We'll set the default implementation and override in tests as needed
    mockOrder = jest.fn(() => ({ limit: mockLimit }));

    mockOr = jest.fn(() => ({ order: mockOrder }));

    // mockEq needs to return either { single: mockSingle } or { order: mockOrder }
    mockEq = jest.fn(() => ({
      single: mockSingle,
      order: mockOrder
    }));

    mockSelect = jest.fn(() => ({
      or: mockOr,
      order: mockOrder,
      eq: mockEq,
    }));
    mockFrom = jest.fn(() => ({ select: mockSelect }));

    (supabaseAdmin.from as jest.Mock) = mockFrom;
  });

  describe('searchProvinces', () => {
    it('returns provinces matching search query in Thai', async () => {
      const mockData: ProvinceSuggestion[] = [
        { id: 1, name_th: 'กรุงเทพมหานคร', name_en: 'Bangkok', slug: 'bangkok', region: 'Central' },
        { id: 2, name_th: 'กระบี่', name_en: 'Krabi', slug: 'krabi', region: 'South' },
      ];

      mockLimit.mockResolvedValue({ data: mockData, error: null });

      const result = await provinceService.searchProvinces('กรุง');

      expect(mockFrom).toHaveBeenCalledWith('provinces');
      expect(mockSelect).toHaveBeenCalledWith('id, name_th, name_en, slug, region');
      expect(mockOr).toHaveBeenCalledWith('name_th.ilike.%กรุง%,name_en.ilike.%กรุง%');
      expect(mockOrder).toHaveBeenCalledWith('name_en', { ascending: true });
      expect(mockLimit).toHaveBeenCalledWith(10);
      expect(result).toEqual(mockData);
    });

    it('returns provinces matching search query in English', async () => {
      const mockData: ProvinceSuggestion[] = [
        { id: 1, name_th: 'เชียงใหม่', name_en: 'Chiang Mai', slug: 'chiang-mai', region: 'North' },
        { id: 2, name_th: 'เชียงราย', name_en: 'Chiang Rai', slug: 'chiang-rai', region: 'North' },
      ];

      mockLimit.mockResolvedValue({ data: mockData, error: null });

      const result = await provinceService.searchProvinces('chiang');

      expect(mockOr).toHaveBeenCalledWith('name_th.ilike.%chiang%,name_en.ilike.%chiang%');
      expect(result).toEqual(mockData);
    });

    it('returns max 10 results by default', async () => {
      const mockData: ProvinceSuggestion[] = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        name_th: `จังหวัด${i + 1}`,
        name_en: `Province${i + 1}`,
        slug: `province-${i + 1}`,
        region: 'Central',
      }));

      mockLimit.mockResolvedValue({ data: mockData, error: null });

      const result = await provinceService.searchProvinces('province');

      expect(mockLimit).toHaveBeenCalledWith(10);
      expect(result).toHaveLength(10);
    });

    it('respects custom limit parameter', async () => {
      const mockData: ProvinceSuggestion[] = Array.from({ length: 5 }, (_, i) => ({
        id: i + 1,
        name_th: `จังหวัด${i + 1}`,
        name_en: `Province${i + 1}`,
        slug: `province-${i + 1}`,
        region: 'Central',
      }));

      mockLimit.mockResolvedValue({ data: mockData, error: null });

      const result = await provinceService.searchProvinces('province', 5);

      expect(mockLimit).toHaveBeenCalledWith(5);
      expect(result).toHaveLength(5);
    });

    it('ILIKE search is case-insensitive', async () => {
      const mockData: ProvinceSuggestion[] = [
        { id: 1, name_th: 'ภูเก็ต', name_en: 'Phuket', slug: 'phuket', region: 'South' },
      ];

      mockLimit.mockResolvedValue({ data: mockData, error: null });

      // Test with uppercase
      await provinceService.searchProvinces('PHUKET');
      expect(mockOr).toHaveBeenCalledWith('name_th.ilike.%PHUKET%,name_en.ilike.%PHUKET%');

      // Test with lowercase
      await provinceService.searchProvinces('phuket');
      expect(mockOr).toHaveBeenCalledWith('name_th.ilike.%phuket%,name_en.ilike.%phuket%');

      // Test with mixed case
      await provinceService.searchProvinces('PhUkEt');
      expect(mockOr).toHaveBeenCalledWith('name_th.ilike.%PhUkEt%,name_en.ilike.%PhUkEt%');
    });

    it('returns empty array for no matches', async () => {
      mockLimit.mockResolvedValue({ data: [], error: null });

      const result = await provinceService.searchProvinces('nonexistent');

      expect(result).toEqual([]);
    });

    it('returns empty array when data is null', async () => {
      mockLimit.mockResolvedValue({ data: null, error: null });

      const result = await provinceService.searchProvinces('test');

      expect(result).toEqual([]);
    });

    it('handles empty query string', async () => {
      const mockData: ProvinceSuggestion[] = [
        { id: 1, name_th: 'กรุงเทพมหานคร', name_en: 'Bangkok', slug: 'bangkok', region: 'Central' },
      ];

      mockLimit.mockResolvedValue({ data: mockData, error: null });

      const result = await provinceService.searchProvinces('');

      expect(mockOr).toHaveBeenCalledWith('name_th.ilike.%%,name_en.ilike.%%');
      expect(result).toEqual(mockData);
    });

    it('returns results sorted alphabetically by English name', async () => {
      const mockData: ProvinceSuggestion[] = [
        { id: 1, name_th: 'กระบี่', name_en: 'Krabi', slug: 'krabi', region: 'South' },
        { id: 2, name_th: 'ภูเก็ต', name_en: 'Phuket', slug: 'phuket', region: 'South' },
        { id: 3, name_th: 'สุราษฎร์ธานี', name_en: 'Surat Thani', slug: 'surat-thani', region: 'South' },
      ];

      mockLimit.mockResolvedValue({ data: mockData, error: null });

      const result = await provinceService.searchProvinces('south');

      expect(mockOrder).toHaveBeenCalledWith('name_en', { ascending: true });
      expect(result).toEqual(mockData);
      // Verify order is maintained (alphabetically by name_en)
      expect(result[0].name_en).toBe('Krabi');
      expect(result[1].name_en).toBe('Phuket');
      expect(result[2].name_en).toBe('Surat Thani');
    });

    it('throws error when database query fails', async () => {
      const mockError = { message: 'Database connection failed' };
      mockLimit.mockResolvedValue({ data: null, error: mockError });

      await expect(provinceService.searchProvinces('test'))
        .rejects
        .toThrow('Failed to search provinces: Database connection failed');
    });

    it('handles special characters in search query', async () => {
      const mockData: ProvinceSuggestion[] = [];
      mockLimit.mockResolvedValue({ data: mockData, error: null });

      await provinceService.searchProvinces('test%test');

      expect(mockOr).toHaveBeenCalledWith('name_th.ilike.%test%test%,name_en.ilike.%test%test%');
    });

    it('handles partial matches at start of name', async () => {
      const mockData: ProvinceSuggestion[] = [
        { id: 1, name_th: 'เชียงใหม่', name_en: 'Chiang Mai', slug: 'chiang-mai', region: 'North' },
      ];

      mockLimit.mockResolvedValue({ data: mockData, error: null });

      const result = await provinceService.searchProvinces('Chi');

      expect(mockOr).toHaveBeenCalledWith('name_th.ilike.%Chi%,name_en.ilike.%Chi%');
      expect(result).toEqual(mockData);
    });

    it('handles partial matches in middle of name', async () => {
      const mockData: ProvinceSuggestion[] = [
        { id: 1, name_th: 'เชียงใหม่', name_en: 'Chiang Mai', slug: 'chiang-mai', region: 'North' },
      ];

      mockLimit.mockResolvedValue({ data: mockData, error: null });

      const result = await provinceService.searchProvinces('ang');

      expect(mockOr).toHaveBeenCalledWith('name_th.ilike.%ang%,name_en.ilike.%ang%');
      expect(result).toEqual(mockData);
    });

    it('handles partial matches at end of name', async () => {
      const mockData: ProvinceSuggestion[] = [
        { id: 1, name_th: 'เชียงใหม่', name_en: 'Chiang Mai', slug: 'chiang-mai', region: 'North' },
      ];

      mockLimit.mockResolvedValue({ data: mockData, error: null });

      const result = await provinceService.searchProvinces('Mai');

      expect(mockOr).toHaveBeenCalledWith('name_th.ilike.%Mai%,name_en.ilike.%Mai%');
      expect(result).toEqual(mockData);
    });
  });

  describe('getAllProvinces', () => {
    it('returns all provinces sorted alphabetically', async () => {
      const mockData: Province[] = [
        {
          id: 1,
          name_th: 'กรุงเทพมหานคร',
          name_en: 'Bangkok',
          slug: 'bangkok',
          region: 'Central',
          latitude: 13.7563,
          longitude: 100.5018
        },
      ];

      mockOrder.mockResolvedValue({ data: mockData, error: null });

      const result = await provinceService.getAllProvinces();

      expect(mockFrom).toHaveBeenCalledWith('provinces');
      expect(mockSelect).toHaveBeenCalledWith('id, name_th, name_en, slug, region, latitude, longitude');
      expect(mockOrder).toHaveBeenCalledWith('name_en', { ascending: true });
      expect(result).toEqual(mockData);
    });

    it('returns empty array when no provinces found', async () => {
      mockOrder.mockResolvedValue({ data: [], error: null });

      const result = await provinceService.getAllProvinces();

      expect(result).toEqual([]);
    });

    it('throws error when database query fails', async () => {
      const mockError = { message: 'Database error' };
      mockOrder.mockResolvedValue({ data: null, error: mockError });

      await expect(provinceService.getAllProvinces())
        .rejects
        .toThrow('Failed to fetch provinces: Database error');
    });
  });

  describe('getProvinceById', () => {
    it('returns province when found', async () => {
      const mockData: Province = {
        id: 1,
        name_th: 'กรุงเทพมหานคร',
        name_en: 'Bangkok',
        slug: 'bangkok',
        region: 'Central',
        latitude: 13.7563,
        longitude: 100.5018
      };

      mockSingle.mockResolvedValue({ data: mockData, error: null });

      const result = await provinceService.getProvinceById(1);

      expect(mockFrom).toHaveBeenCalledWith('provinces');
      expect(mockSelect).toHaveBeenCalledWith('id, name_th, name_en, slug, region, latitude, longitude');
      expect(mockEq).toHaveBeenCalledWith('id', 1);
      expect(result).toEqual(mockData);
    });

    it('returns null when province not found', async () => {
      const mockError = { code: 'PGRST116', message: 'Not found' };
      mockSingle.mockResolvedValue({ data: null, error: mockError });

      const result = await provinceService.getProvinceById(999);

      expect(result).toBeNull();
    });

    it('throws error for database errors', async () => {
      const mockError = { code: 'PGRST000', message: 'Database error' };
      mockSingle.mockResolvedValue({ data: null, error: mockError });

      await expect(provinceService.getProvinceById(1))
        .rejects
        .toThrow('Failed to fetch province: Database error');
    });
  });

  describe('getProvinceBySlug', () => {
    it('returns province when found by slug', async () => {
      const mockData: Province = {
        id: 1,
        name_th: 'กรุงเทพมหานคร',
        name_en: 'Bangkok',
        slug: 'bangkok',
        region: 'Central',
        latitude: 13.7563,
        longitude: 100.5018
      };

      mockSingle.mockResolvedValue({ data: mockData, error: null });

      const result = await provinceService.getProvinceBySlug('bangkok');

      expect(mockFrom).toHaveBeenCalledWith('provinces');
      expect(mockSelect).toHaveBeenCalledWith('id, name_th, name_en, slug, region, latitude, longitude');
      expect(mockEq).toHaveBeenCalledWith('slug', 'bangkok');
      expect(result).toEqual(mockData);
    });

    it('returns null when slug not found', async () => {
      const mockError = { code: 'PGRST116', message: 'Not found' };
      mockSingle.mockResolvedValue({ data: null, error: mockError });

      const result = await provinceService.getProvinceBySlug('nonexistent');

      expect(result).toBeNull();
    });

    it('throws error for database errors', async () => {
      const mockError = { code: 'PGRST000', message: 'Database error' };
      mockSingle.mockResolvedValue({ data: null, error: mockError });

      await expect(provinceService.getProvinceBySlug('bangkok'))
        .rejects
        .toThrow('Failed to fetch province: Database error');
    });
  });

  describe('getProvincesByRegion', () => {
    it('returns provinces in specified region', async () => {
      const mockData: Province[] = [
        {
          id: 1,
          name_th: 'เชียงใหม่',
          name_en: 'Chiang Mai',
          slug: 'chiang-mai',
          region: 'North',
          latitude: 18.7883,
          longitude: 98.9853
        },
        {
          id: 2,
          name_th: 'เชียงราย',
          name_en: 'Chiang Rai',
          slug: 'chiang-rai',
          region: 'North',
          latitude: 19.9105,
          longitude: 99.8406
        },
      ];

      mockOrder.mockResolvedValue({ data: mockData, error: null });

      const result = await provinceService.getProvincesByRegion('North');

      expect(mockFrom).toHaveBeenCalledWith('provinces');
      expect(mockSelect).toHaveBeenCalledWith('id, name_th, name_en, slug, region, latitude, longitude');
      expect(mockEq).toHaveBeenCalledWith('region', 'North');
      expect(mockOrder).toHaveBeenCalledWith('name_en', { ascending: true });
      expect(result).toEqual(mockData);
    });

    it('returns empty array when no provinces in region', async () => {
      mockOrder.mockResolvedValue({ data: [], error: null });

      const result = await provinceService.getProvincesByRegion('NonexistentRegion');

      expect(result).toEqual([]);
    });

    it('throws error when database query fails', async () => {
      const mockError = { message: 'Database error' };
      mockOrder.mockResolvedValue({ data: null, error: mockError });

      await expect(provinceService.getProvincesByRegion('North'))
        .rejects
        .toThrow('Failed to fetch provinces by region: Database error');
    });
  });
});
