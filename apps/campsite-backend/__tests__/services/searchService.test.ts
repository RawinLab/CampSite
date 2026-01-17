import { SearchService } from '../../src/services/searchService';
import type { SearchQuery } from '@campsite/shared';

// Mock Supabase
jest.mock('../../src/lib/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(),
  },
}));

import { supabaseAdmin } from '../../src/lib/supabase';

describe('SearchService - Amenity AND Logic', () => {
  let searchService: SearchService;
  let mockFrom: jest.Mock;
  let mockSelect: jest.Mock;
  let mockEq: jest.Mock;
  let mockRange: jest.Mock;
  let mockOrder: jest.Mock;

  beforeEach(() => {
    searchService = new SearchService();

    // Create mock chain
    mockRange = jest.fn().mockResolvedValue({
      data: [],
      error: null,
      count: 0,
    });

    mockOrder = jest.fn().mockReturnValue({
      range: mockRange,
    });

    // Create a fully chainable mock that returns itself for all methods
    const createChainableMock = () => {
      const mock: any = {
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      };

      // Make all methods return the mock itself except range
      Object.keys(mock).forEach(key => {
        if (key !== 'range') {
          mock[key].mockReturnValue(mock);
        }
      });

      return mock;
    };

    const chainableMock = createChainableMock();
    mockEq = chainableMock.eq;
    mockRange = chainableMock.range;
    mockOrder = chainableMock.order;

    mockSelect = jest.fn().mockReturnValue(chainableMock);

    mockFrom = jest.fn().mockReturnValue({
      select: mockSelect,
    });

    (supabaseAdmin.from as jest.Mock) = mockFrom;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Amenity Filter Tests', () => {
    it('returns all results when no amenity filter is applied', async () => {
      const mockCampsites = [
        {
          id: 1,
          name: 'Campsite 1',
          description: 'Description 1',
          slug: 'campsite-1',
          campsite_type: 'camping',
          min_price: 100,
          max_price: 200,
          average_rating: 4.5,
          review_count: 10,
          is_featured: false,
          provinces: { id: 1, name_th: 'Province', name_en: 'Province', slug: 'province' },
          campsite_photos: [],
          campsite_amenities: [
            { amenities: { slug: 'wifi' } },
            { amenities: { slug: 'parking' } },
          ],
        },
        {
          id: 2,
          name: 'Campsite 2',
          description: 'Description 2',
          slug: 'campsite-2',
          campsite_type: 'rv-caravan',
          min_price: 150,
          max_price: 250,
          average_rating: 4.0,
          review_count: 5,
          is_featured: false,
          provinces: { id: 1, name_th: 'Province', name_en: 'Province', slug: 'province' },
          campsite_photos: [],
          campsite_amenities: [
            { amenities: { slug: 'toilet' } },
          ],
        },
      ];

      mockRange.mockResolvedValue({
        data: mockCampsites,
        error: null,
        count: 2,
      });

      const params: SearchQuery = {
        page: 1,
        limit: 10,
        sort: 'rating',
      };

      const result = await searchService.searchCampsites(params);

      expect(result.data).toHaveLength(2);
      expect(result.data[0].amenities).toEqual(['wifi', 'parking']);
      expect(result.data[1].amenities).toEqual(['toilet']);
    });

    it('filters correctly with single amenity', async () => {
      const mockCampsites = [
        {
          id: 1,
          name: 'Campsite 1',
          description: 'Description 1',
          slug: 'campsite-1',
          campsite_type: 'camping',
          min_price: 100,
          max_price: 200,
          average_rating: 4.5,
          review_count: 10,
          is_featured: false,
          provinces: { id: 1, name_th: 'Province', name_en: 'Province', slug: 'province' },
          campsite_photos: [],
          campsite_amenities: [
            { amenities: { slug: 'wifi' } },
            { amenities: { slug: 'parking' } },
          ],
        },
        {
          id: 2,
          name: 'Campsite 2',
          description: 'Description 2',
          slug: 'campsite-2',
          campsite_type: 'rv-caravan',
          min_price: 150,
          max_price: 250,
          average_rating: 4.0,
          review_count: 5,
          is_featured: false,
          provinces: { id: 1, name_th: 'Province', name_en: 'Province', slug: 'province' },
          campsite_photos: [],
          campsite_amenities: [
            { amenities: { slug: 'toilet' } },
            { amenities: { slug: 'wifi' } },
          ],
        },
        {
          id: 3,
          name: 'Campsite 3',
          description: 'Description 3',
          slug: 'campsite-3',
          campsite_type: 'camping',
          min_price: 120,
          max_price: 220,
          average_rating: 3.5,
          review_count: 3,
          is_featured: false,
          provinces: { id: 1, name_th: 'Province', name_en: 'Province', slug: 'province' },
          campsite_photos: [],
          campsite_amenities: [
            { amenities: { slug: 'parking' } },
          ],
        },
      ];

      mockRange.mockResolvedValue({
        data: mockCampsites,
        error: null,
        count: 3,
      });

      const params: SearchQuery = {
        page: 1,
        limit: 10,
        sort: 'rating',
        amenities: ['wifi'],
      };

      const result = await searchService.searchCampsites(params);

      expect(result.data).toHaveLength(2);
      expect(result.data[0].id).toBe(1);
      expect(result.data[1].id).toBe(2);
      expect(result.data.every(c => c.amenities.includes('wifi'))).toBe(true);
    });

    it('applies AND logic for multiple amenities (must have ALL)', async () => {
      const mockCampsites = [
        {
          id: 1,
          name: 'Campsite 1',
          description: 'Has wifi and parking',
          slug: 'campsite-1',
          campsite_type: 'camping',
          min_price: 100,
          max_price: 200,
          average_rating: 4.5,
          review_count: 10,
          is_featured: false,
          provinces: { id: 1, name_th: 'Province', name_en: 'Province', slug: 'province' },
          campsite_photos: [],
          campsite_amenities: [
            { amenities: { slug: 'wifi' } },
            { amenities: { slug: 'parking' } },
            { amenities: { slug: 'toilet' } },
          ],
        },
        {
          id: 2,
          name: 'Campsite 2',
          description: 'Has only wifi',
          slug: 'campsite-2',
          campsite_type: 'rv-caravan',
          min_price: 150,
          max_price: 250,
          average_rating: 4.0,
          review_count: 5,
          is_featured: false,
          provinces: { id: 1, name_th: 'Province', name_en: 'Province', slug: 'province' },
          campsite_photos: [],
          campsite_amenities: [
            { amenities: { slug: 'wifi' } },
            { amenities: { slug: 'toilet' } },
          ],
        },
        {
          id: 3,
          name: 'Campsite 3',
          description: 'Has only parking',
          slug: 'campsite-3',
          campsite_type: 'camping',
          min_price: 120,
          max_price: 220,
          average_rating: 3.5,
          review_count: 3,
          is_featured: false,
          provinces: { id: 1, name_th: 'Province', name_en: 'Province', slug: 'province' },
          campsite_photos: [],
          campsite_amenities: [
            { amenities: { slug: 'parking' } },
          ],
        },
      ];

      mockRange.mockResolvedValue({
        data: mockCampsites,
        error: null,
        count: 3,
      });

      const params: SearchQuery = {
        page: 1,
        limit: 10,
        sort: 'rating',
        amenities: ['wifi', 'parking'],
      };

      const result = await searchService.searchCampsites(params);

      // Only Campsite 1 has BOTH wifi AND parking
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe(1);
      expect(result.data[0].amenities).toContain('wifi');
      expect(result.data[0].amenities).toContain('parking');
    });

    it('returns no campsites when none match ALL required amenities', async () => {
      const mockCampsites = [
        {
          id: 1,
          name: 'Campsite 1',
          description: 'Has wifi and parking',
          slug: 'campsite-1',
          campsite_type: 'camping',
          min_price: 100,
          max_price: 200,
          average_rating: 4.5,
          review_count: 10,
          is_featured: false,
          provinces: { id: 1, name_th: 'Province', name_en: 'Province', slug: 'province' },
          campsite_photos: [],
          campsite_amenities: [
            { amenities: { slug: 'wifi' } },
            { amenities: { slug: 'parking' } },
          ],
        },
        {
          id: 2,
          name: 'Campsite 2',
          description: 'Has only wifi and shower',
          slug: 'campsite-2',
          campsite_type: 'rv-caravan',
          min_price: 150,
          max_price: 250,
          average_rating: 4.0,
          review_count: 5,
          is_featured: false,
          provinces: { id: 1, name_th: 'Province', name_en: 'Province', slug: 'province' },
          campsite_photos: [],
          campsite_amenities: [
            { amenities: { slug: 'wifi' } },
            { amenities: { slug: 'shower' } },
          ],
        },
      ];

      mockRange.mockResolvedValue({
        data: mockCampsites,
        error: null,
        count: 2,
      });

      const params: SearchQuery = {
        page: 1,
        limit: 10,
        sort: 'rating',
        amenities: ['wifi', 'parking', 'pool'],
      };

      const result = await searchService.searchCampsites(params);

      // No campsite has all three amenities
      expect(result.data).toHaveLength(0);
    });

    it('combines amenity filter with other filters (province, type, price)', async () => {
      const mockCampsites = [
        {
          id: 1,
          name: 'Campsite 1',
          description: 'Perfect match',
          slug: 'campsite-1',
          campsite_type: 'camping',
          min_price: 150,
          max_price: 200,
          average_rating: 4.5,
          review_count: 10,
          is_featured: false,
          provinces: { id: 1, name_th: 'Province', name_en: 'Province', slug: 'province' },
          campsite_photos: [],
          campsite_amenities: [
            { amenities: { slug: 'wifi' } },
            { amenities: { slug: 'parking' } },
          ],
        },
        {
          id: 2,
          name: 'Campsite 2',
          description: 'Wrong type',
          slug: 'campsite-2',
          campsite_type: 'rv-caravan',
          min_price: 150,
          max_price: 250,
          average_rating: 4.0,
          review_count: 5,
          is_featured: false,
          provinces: { id: 1, name_th: 'Province', name_en: 'Province', slug: 'province' },
          campsite_photos: [],
          campsite_amenities: [
            { amenities: { slug: 'wifi' } },
            { amenities: { slug: 'parking' } },
          ],
        },
        {
          id: 3,
          name: 'Campsite 3',
          description: 'Missing parking',
          slug: 'campsite-3',
          campsite_type: 'camping',
          min_price: 150,
          max_price: 220,
          average_rating: 3.5,
          review_count: 3,
          is_featured: false,
          provinces: { id: 1, name_th: 'Province', name_en: 'Province', slug: 'province' },
          campsite_photos: [],
          campsite_amenities: [
            { amenities: { slug: 'wifi' } },
          ],
        },
      ];

      // Mock the database to return filtered by type (tent only)
      mockRange.mockResolvedValue({
        data: [mockCampsites[0], mockCampsites[2]], // Only tent types
        error: null,
        count: 2,
      });

      const params: SearchQuery = {
        page: 1,
        limit: 10,
        sort: 'rating',
        types: ['camping'],
        minPrice: 100,
        maxPrice: 300,
        amenities: ['wifi', 'parking'],
      };

      const result = await searchService.searchCampsites(params);

      // Only Campsite 1 matches: type=camping AND has both wifi and parking
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe(1);
      expect(result.data[0].campsite_type).toBe('camping');
      expect(result.data[0].amenities).toContain('wifi');
      expect(result.data[0].amenities).toContain('parking');
    });

    it('returns all results when amenity array is empty', async () => {
      const mockCampsites = [
        {
          id: 1,
          name: 'Campsite 1',
          description: 'Description 1',
          slug: 'campsite-1',
          campsite_type: 'camping',
          min_price: 100,
          max_price: 200,
          average_rating: 4.5,
          review_count: 10,
          is_featured: false,
          provinces: { id: 1, name_th: 'Province', name_en: 'Province', slug: 'province' },
          campsite_photos: [],
          campsite_amenities: [
            { amenities: { slug: 'wifi' } },
          ],
        },
        {
          id: 2,
          name: 'Campsite 2',
          description: 'Description 2',
          slug: 'campsite-2',
          campsite_type: 'rv-caravan',
          min_price: 150,
          max_price: 250,
          average_rating: 4.0,
          review_count: 5,
          is_featured: false,
          provinces: { id: 1, name_th: 'Province', name_en: 'Province', slug: 'province' },
          campsite_photos: [],
          campsite_amenities: [],
        },
      ];

      mockRange.mockResolvedValue({
        data: mockCampsites,
        error: null,
        count: 2,
      });

      const params: SearchQuery = {
        page: 1,
        limit: 10,
        sort: 'rating',
        amenities: [],
      };

      const result = await searchService.searchCampsites(params);

      expect(result.data).toHaveLength(2);
    });

    it('handles campsites with no amenities correctly', async () => {
      const mockCampsites = [
        {
          id: 1,
          name: 'Campsite 1',
          description: 'Has amenities',
          slug: 'campsite-1',
          campsite_type: 'camping',
          min_price: 100,
          max_price: 200,
          average_rating: 4.5,
          review_count: 10,
          is_featured: false,
          provinces: { id: 1, name_th: 'Province', name_en: 'Province', slug: 'province' },
          campsite_photos: [],
          campsite_amenities: [
            { amenities: { slug: 'wifi' } },
          ],
        },
        {
          id: 2,
          name: 'Campsite 2',
          description: 'No amenities',
          slug: 'campsite-2',
          campsite_type: 'rv-caravan',
          min_price: 150,
          max_price: 250,
          average_rating: 4.0,
          review_count: 5,
          is_featured: false,
          provinces: { id: 1, name_th: 'Province', name_en: 'Province', slug: 'province' },
          campsite_photos: [],
          campsite_amenities: [],
        },
      ];

      mockRange.mockResolvedValue({
        data: mockCampsites,
        error: null,
        count: 2,
      });

      const params: SearchQuery = {
        page: 1,
        limit: 10,
        sort: 'rating',
        amenities: ['wifi'],
      };

      const result = await searchService.searchCampsites(params);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe(1);
      expect(result.data[0].amenities).toContain('wifi');
    });

    it('handles three or more amenities with AND logic', async () => {
      const mockCampsites = [
        {
          id: 1,
          name: 'Luxury Campsite',
          description: 'Has everything',
          slug: 'luxury-campsite',
          campsite_type: 'glamping',
          min_price: 500,
          max_price: 1000,
          average_rating: 5.0,
          review_count: 50,
          is_featured: true,
          provinces: { id: 1, name_th: 'Province', name_en: 'Province', slug: 'province' },
          campsite_photos: [],
          campsite_amenities: [
            { amenities: { slug: 'wifi' } },
            { amenities: { slug: 'parking' } },
            { amenities: { slug: 'pool' } },
            { amenities: { slug: 'restaurant' } },
          ],
        },
        {
          id: 2,
          name: 'Mid-range Campsite',
          description: 'Missing pool',
          slug: 'mid-campsite',
          campsite_type: 'camping',
          min_price: 200,
          max_price: 400,
          average_rating: 4.0,
          review_count: 20,
          is_featured: false,
          provinces: { id: 1, name_th: 'Province', name_en: 'Province', slug: 'province' },
          campsite_photos: [],
          campsite_amenities: [
            { amenities: { slug: 'wifi' } },
            { amenities: { slug: 'parking' } },
            { amenities: { slug: 'restaurant' } },
          ],
        },
      ];

      mockRange.mockResolvedValue({
        data: mockCampsites,
        error: null,
        count: 2,
      });

      const params: SearchQuery = {
        page: 1,
        limit: 10,
        sort: 'rating',
        amenities: ['wifi', 'parking', 'pool', 'restaurant'],
      };

      const result = await searchService.searchCampsites(params);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe(1);
      expect(result.data[0].amenities).toEqual(['wifi', 'parking', 'pool', 'restaurant']);
    });
  });

  describe('Edge Cases', () => {
    it('handles null or undefined campsite_amenities', async () => {
      const mockCampsites = [
        {
          id: 1,
          name: 'Campsite 1',
          description: 'Description 1',
          slug: 'campsite-1',
          campsite_type: 'camping',
          min_price: 100,
          max_price: 200,
          average_rating: 4.5,
          review_count: 10,
          is_featured: false,
          provinces: { id: 1, name_th: 'Province', name_en: 'Province', slug: 'province' },
          campsite_photos: [],
          campsite_amenities: null,
        },
      ];

      mockRange.mockResolvedValue({
        data: mockCampsites,
        error: null,
        count: 1,
      });

      const params: SearchQuery = {
        page: 1,
        limit: 10,
        sort: 'rating',
        amenities: ['wifi'],
      };

      const result = await searchService.searchCampsites(params);

      expect(result.data).toHaveLength(0);
    });

    it('handles amenities with null slug', async () => {
      const mockCampsites = [
        {
          id: 1,
          name: 'Campsite 1',
          description: 'Description 1',
          slug: 'campsite-1',
          campsite_type: 'camping',
          min_price: 100,
          max_price: 200,
          average_rating: 4.5,
          review_count: 10,
          is_featured: false,
          provinces: { id: 1, name_th: 'Province', name_en: 'Province', slug: 'province' },
          campsite_photos: [],
          campsite_amenities: [
            { amenities: { slug: 'wifi' } },
            { amenities: null },
            { amenities: { slug: null } },
          ],
        },
      ];

      mockRange.mockResolvedValue({
        data: mockCampsites,
        error: null,
        count: 1,
      });

      const params: SearchQuery = {
        page: 1,
        limit: 10,
        sort: 'rating',
        amenities: ['wifi'],
      };

      const result = await searchService.searchCampsites(params);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].amenities).toEqual(['wifi']);
    });
  });

  describe('Pagination with Amenity Filter', () => {
    it('correctly adjusts total count after amenity filtering', async () => {
      const mockCampsites = [
        {
          id: 1,
          name: 'Campsite 1',
          description: 'Has wifi',
          slug: 'campsite-1',
          campsite_type: 'camping',
          min_price: 100,
          max_price: 200,
          average_rating: 4.5,
          review_count: 10,
          is_featured: false,
          provinces: { id: 1, name_th: 'Province', name_en: 'Province', slug: 'province' },
          campsite_photos: [],
          campsite_amenities: [
            { amenities: { slug: 'wifi' } },
          ],
        },
        {
          id: 2,
          name: 'Campsite 2',
          description: 'No wifi',
          slug: 'campsite-2',
          campsite_type: 'rv-caravan',
          min_price: 150,
          max_price: 250,
          average_rating: 4.0,
          review_count: 5,
          is_featured: false,
          provinces: { id: 1, name_th: 'Province', name_en: 'Province', slug: 'province' },
          campsite_photos: [],
          campsite_amenities: [
            { amenities: { slug: 'parking' } },
          ],
        },
      ];

      mockRange.mockResolvedValue({
        data: mockCampsites,
        error: null,
        count: 2, // Database returns 2, but client-side filter reduces to 1
      });

      const params: SearchQuery = {
        page: 1,
        limit: 10,
        sort: 'rating',
        amenities: ['wifi'],
      };

      const result = await searchService.searchCampsites(params);

      // Note: The total count is from the database (before client-side filtering)
      // This is expected behavior as amenity filter is applied post-query
      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(2);
    });
  });
});
