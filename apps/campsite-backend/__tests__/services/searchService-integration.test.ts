import { SearchService } from '../../src/services/searchService';
import type { SearchQuery } from '@campsite/shared';

// Mock Supabase
jest.mock('../../src/lib/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
    })),
  },
}));

import { supabaseAdmin } from '../../src/lib/supabase';

describe('SearchService - Integration Tests', () => {
  let searchService: SearchService;
  let mockQuery: any;

  beforeEach(() => {
    searchService = new SearchService();

    // Create a mock query chain
    mockQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
    };

    (supabaseAdmin.from as jest.Mock).mockReturnValue(mockQuery);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Individual Filter Tests', () => {
    it('should search with province filter only', async () => {
      const mockData = [
        {
          id: 1,
          name: 'Bangkok Camp',
          description: 'A great campsite in Bangkok',
          slug: 'bangkok-camp',
          campsite_type: 'tent',
          min_price: 500,
          max_price: 1000,
          average_rating: 4.5,
          review_count: 10,
          is_featured: false,
          provinces: {
            id: 1,
            name_th: 'กรุงเทพมหานคร',
            name_en: 'Bangkok',
            slug: 'bangkok',
          },
          campsite_photos: [{ photo_url: 'test.jpg', is_primary: true, sort_order: 1 }],
          campsite_amenities: [{ amenities: { slug: 'wifi' } }],
        },
      ];

      mockQuery.range.mockResolvedValue({
        data: mockData,
        error: null,
        count: 1,
      });

      const params: SearchQuery = {
        provinceId: 1,
        page: 1,
        limit: 10,
        sort: 'rating',
      };

      const result = await searchService.searchCampsites(params);

      expect(supabaseAdmin.from).toHaveBeenCalledWith('campsites');
      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'approved');
      expect(mockQuery.eq).toHaveBeenCalledWith('province_id', 1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].province.id).toBe(1);
      expect(result.pagination.total).toBe(1);
    });

    it('should search with type filter only', async () => {
      const mockData = [
        {
          id: 2,
          name: 'RV Park',
          description: 'RV camping site',
          slug: 'rv-park',
          campsite_type: 'rv-caravan',
          min_price: 1500,
          max_price: 2500,
          average_rating: 4.8,
          review_count: 20,
          is_featured: true,
          provinces: {
            id: 2,
            name_th: 'เชียงใหม่',
            name_en: 'Chiang Mai',
            slug: 'chiang-mai',
          },
          campsite_photos: [],
          campsite_amenities: [],
        },
      ];

      mockQuery.range.mockResolvedValue({
        data: mockData,
        error: null,
        count: 1,
      });

      const params: SearchQuery = {
        types: ['rv-caravan'],
        page: 1,
        limit: 10,
        sort: 'rating',
      };

      const result = await searchService.searchCampsites(params);

      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'approved');
      expect(mockQuery.in).toHaveBeenCalledWith('campsite_type', ['rv-caravan']);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].campsite_type).toBe('rv-caravan');
    });

    it('should search with price range filter only', async () => {
      const mockData = [
        {
          id: 3,
          name: 'Budget Camp',
          description: 'Affordable camping',
          slug: 'budget-camp',
          campsite_type: 'tent',
          min_price: 300,
          max_price: 600,
          average_rating: 4.0,
          review_count: 5,
          is_featured: false,
          provinces: {
            id: 3,
            name_th: 'ภูเก็ต',
            name_en: 'Phuket',
            slug: 'phuket',
          },
          campsite_photos: [],
          campsite_amenities: [],
        },
      ];

      mockQuery.range.mockResolvedValue({
        data: mockData,
        error: null,
        count: 1,
      });

      const params: SearchQuery = {
        minPrice: 200,
        maxPrice: 800,
        page: 1,
        limit: 10,
        sort: 'rating',
      };

      const result = await searchService.searchCampsites(params);

      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'approved');
      expect(mockQuery.gte).toHaveBeenCalledWith('min_price', 200);
      expect(mockQuery.lte).toHaveBeenCalledWith('max_price', 800);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].min_price).toBe(300);
      expect(result.data[0].max_price).toBe(600);
    });

    it('should search with amenity filter only', async () => {
      const mockData = [
        {
          id: 4,
          name: 'Luxury Camp',
          description: 'High-end camping with amenities',
          slug: 'luxury-camp',
          campsite_type: 'glamping',
          min_price: 3000,
          max_price: 5000,
          average_rating: 4.9,
          review_count: 50,
          is_featured: true,
          provinces: {
            id: 4,
            name_th: 'กระบี่',
            name_en: 'Krabi',
            slug: 'krabi',
          },
          campsite_photos: [{ photo_url: 'luxury.jpg', is_primary: true, sort_order: 1 }],
          campsite_amenities: [
            { amenities: { slug: 'wifi' } },
            { amenities: { slug: 'parking' } },
            { amenities: { slug: 'restaurant' } },
          ],
        },
      ];

      mockQuery.range.mockResolvedValue({
        data: mockData,
        error: null,
        count: 1,
      });

      const params: SearchQuery = {
        amenities: ['wifi', 'parking'],
        page: 1,
        limit: 10,
        sort: 'rating',
      };

      const result = await searchService.searchCampsites(params);

      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'approved');
      expect(result.data).toHaveLength(1);
      expect(result.data[0].amenities).toContain('wifi');
      expect(result.data[0].amenities).toContain('parking');
    });
  });

  describe('Combined Filter Tests', () => {
    it('should search combining province + type filters', async () => {
      const mockData = [
        {
          id: 5,
          name: 'Chiang Mai Glamping',
          description: 'Glamping in Chiang Mai',
          slug: 'chiang-mai-glamping',
          campsite_type: 'glamping',
          min_price: 2000,
          max_price: 3000,
          average_rating: 4.7,
          review_count: 30,
          is_featured: true,
          provinces: {
            id: 2,
            name_th: 'เชียงใหม่',
            name_en: 'Chiang Mai',
            slug: 'chiang-mai',
          },
          campsite_photos: [{ photo_url: 'glamping.jpg', is_primary: true, sort_order: 1 }],
          campsite_amenities: [{ amenities: { slug: 'wifi' } }],
        },
      ];

      mockQuery.range.mockResolvedValue({
        data: mockData,
        error: null,
        count: 1,
      });

      const params: SearchQuery = {
        provinceId: 2,
        types: ['glamping'],
        page: 1,
        limit: 10,
        sort: 'rating',
      };

      const result = await searchService.searchCampsites(params);

      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'approved');
      expect(mockQuery.eq).toHaveBeenCalledWith('province_id', 2);
      expect(mockQuery.in).toHaveBeenCalledWith('campsite_type', ['glamping']);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].province.id).toBe(2);
      expect(result.data[0].campsite_type).toBe('glamping');
    });

    it('should search combining all filters (province + type + price + amenities)', async () => {
      const mockData = [
        {
          id: 6,
          name: 'Premium Phuket RV',
          description: 'Premium RV park in Phuket with all amenities',
          slug: 'premium-phuket-rv',
          campsite_type: 'rv-caravan',
          min_price: 1800,
          max_price: 2500,
          average_rating: 4.8,
          review_count: 40,
          is_featured: true,
          provinces: {
            id: 3,
            name_th: 'ภูเก็ต',
            name_en: 'Phuket',
            slug: 'phuket',
          },
          campsite_photos: [{ photo_url: 'premium-rv.jpg', is_primary: true, sort_order: 1 }],
          campsite_amenities: [
            { amenities: { slug: 'wifi' } },
            { amenities: { slug: 'parking' } },
            { amenities: { slug: 'restaurant' } },
            { amenities: { slug: 'pool' } },
          ],
        },
      ];

      mockQuery.range.mockResolvedValue({
        data: mockData,
        error: null,
        count: 1,
      });

      const params: SearchQuery = {
        provinceId: 3,
        types: ['rv-caravan', 'glamping'],
        minPrice: 1500,
        maxPrice: 3000,
        amenities: ['wifi', 'parking', 'pool'],
        page: 1,
        limit: 10,
        sort: 'rating',
      };

      const result = await searchService.searchCampsites(params);

      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'approved');
      expect(mockQuery.eq).toHaveBeenCalledWith('province_id', 3);
      expect(mockQuery.in).toHaveBeenCalledWith('campsite_type', ['rv-caravan', 'glamping']);
      expect(mockQuery.gte).toHaveBeenCalledWith('min_price', 1500);
      expect(mockQuery.lte).toHaveBeenCalledWith('max_price', 3000);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].province.id).toBe(3);
      expect(result.data[0].campsite_type).toBe('rv-caravan');
      expect(result.data[0].min_price).toBeGreaterThanOrEqual(1500);
      expect(result.data[0].max_price).toBeLessThanOrEqual(3000);
      expect(result.data[0].amenities).toContain('wifi');
      expect(result.data[0].amenities).toContain('parking');
      expect(result.data[0].amenities).toContain('pool');
    });
  });

  describe('Sorting Tests', () => {
    const createMockCampsite = (id: number, rating: number, price: number, name: string) => ({
      id,
      name,
      description: `Description for ${name}`,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
      campsite_type: 'tent',
      min_price: price,
      max_price: price + 500,
      average_rating: rating,
      review_count: 10,
      is_featured: false,
      provinces: {
        id: 1,
        name_th: 'กรุงเทพมหานคร',
        name_en: 'Bangkok',
        slug: 'bangkok',
      },
      campsite_photos: [],
      campsite_amenities: [],
    });

    it('should sort by rating (highest first)', async () => {
      const mockData = [
        createMockCampsite(1, 4.9, 1000, 'Camp A'),
        createMockCampsite(2, 4.5, 1500, 'Camp B'),
      ];

      mockQuery.range.mockResolvedValue({
        data: mockData,
        error: null,
        count: 2,
      });

      const params: SearchQuery = {
        sort: 'rating',
        page: 1,
        limit: 10,
      };

      await searchService.searchCampsites(params);

      expect(mockQuery.order).toHaveBeenCalledWith('average_rating', { ascending: false });
    });

    it('should sort by price ascending', async () => {
      const mockData = [
        createMockCampsite(1, 4.5, 500, 'Cheap Camp'),
        createMockCampsite(2, 4.8, 2000, 'Expensive Camp'),
      ];

      mockQuery.range.mockResolvedValue({
        data: mockData,
        error: null,
        count: 2,
      });

      const params: SearchQuery = {
        sort: 'price_asc',
        page: 1,
        limit: 10,
      };

      await searchService.searchCampsites(params);

      expect(mockQuery.order).toHaveBeenCalledWith('min_price', { ascending: true });
    });

    it('should sort by price descending', async () => {
      const mockData = [
        createMockCampsite(1, 4.8, 2000, 'Expensive Camp'),
        createMockCampsite(2, 4.5, 500, 'Cheap Camp'),
      ];

      mockQuery.range.mockResolvedValue({
        data: mockData,
        error: null,
        count: 2,
      });

      const params: SearchQuery = {
        sort: 'price_desc',
        page: 1,
        limit: 10,
      };

      await searchService.searchCampsites(params);

      expect(mockQuery.order).toHaveBeenCalledWith('min_price', { ascending: false });
    });

    it('should sort by newest', async () => {
      const mockData = [
        createMockCampsite(1, 4.5, 1000, 'New Camp'),
        createMockCampsite(2, 4.7, 1200, 'Old Camp'),
      ];

      mockQuery.range.mockResolvedValue({
        data: mockData,
        error: null,
        count: 2,
      });

      const params: SearchQuery = {
        sort: 'newest',
        page: 1,
        limit: 10,
      };

      await searchService.searchCampsites(params);

      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });
  });

  describe('Pagination Tests', () => {
    it('should paginate results correctly - page 1', async () => {
      const mockData = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        name: `Camp ${i + 1}`,
        description: `Description ${i + 1}`,
        slug: `camp-${i + 1}`,
        campsite_type: 'tent',
        min_price: 1000,
        max_price: 1500,
        average_rating: 4.5,
        review_count: 10,
        is_featured: false,
        provinces: {
          id: 1,
          name_th: 'กรุงเทพมหานคร',
          name_en: 'Bangkok',
          slug: 'bangkok',
        },
        campsite_photos: [],
        campsite_amenities: [],
      }));

      mockQuery.range.mockResolvedValue({
        data: mockData,
        error: null,
        count: 25,
      });

      const params: SearchQuery = {
        page: 1,
        limit: 10,
        sort: 'rating',
      };

      const result = await searchService.searchCampsites(params);

      expect(mockQuery.range).toHaveBeenCalledWith(0, 9);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.total).toBe(25);
      expect(result.pagination.totalPages).toBe(3);
      expect(result.pagination.hasNext).toBe(true);
      expect(result.pagination.hasPrev).toBe(false);
    });

    it('should paginate results correctly - page 2', async () => {
      const mockData = Array.from({ length: 10 }, (_, i) => ({
        id: i + 11,
        name: `Camp ${i + 11}`,
        description: `Description ${i + 11}`,
        slug: `camp-${i + 11}`,
        campsite_type: 'tent',
        min_price: 1000,
        max_price: 1500,
        average_rating: 4.5,
        review_count: 10,
        is_featured: false,
        provinces: {
          id: 1,
          name_th: 'กรุงเทพมหานคร',
          name_en: 'Bangkok',
          slug: 'bangkok',
        },
        campsite_photos: [],
        campsite_amenities: [],
      }));

      mockQuery.range.mockResolvedValue({
        data: mockData,
        error: null,
        count: 25,
      });

      const params: SearchQuery = {
        page: 2,
        limit: 10,
        sort: 'rating',
      };

      const result = await searchService.searchCampsites(params);

      expect(mockQuery.range).toHaveBeenCalledWith(10, 19);
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.hasNext).toBe(true);
      expect(result.pagination.hasPrev).toBe(true);
    });

    it('should paginate results correctly - last page', async () => {
      const mockData = Array.from({ length: 5 }, (_, i) => ({
        id: i + 21,
        name: `Camp ${i + 21}`,
        description: `Description ${i + 21}`,
        slug: `camp-${i + 21}`,
        campsite_type: 'tent',
        min_price: 1000,
        max_price: 1500,
        average_rating: 4.5,
        review_count: 10,
        is_featured: false,
        provinces: {
          id: 1,
          name_th: 'กรุงเทพมหานคร',
          name_en: 'Bangkok',
          slug: 'bangkok',
        },
        campsite_photos: [],
        campsite_amenities: [],
      }));

      mockQuery.range.mockResolvedValue({
        data: mockData,
        error: null,
        count: 25,
      });

      const params: SearchQuery = {
        page: 3,
        limit: 10,
        sort: 'rating',
      };

      const result = await searchService.searchCampsites(params);

      expect(mockQuery.range).toHaveBeenCalledWith(20, 29);
      expect(result.pagination.page).toBe(3);
      expect(result.pagination.hasNext).toBe(false);
      expect(result.pagination.hasPrev).toBe(true);
      expect(result.data).toHaveLength(5);
    });
  });

  describe('Empty Results Tests', () => {
    it('should return empty results when no matches found', async () => {
      mockQuery.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      const params: SearchQuery = {
        provinceId: 999,
        types: ['nonexistent' as any],
        minPrice: 10000,
        maxPrice: 20000,
        amenities: ['nonexistent-amenity'],
        page: 1,
        limit: 10,
        sort: 'rating',
      };

      const result = await searchService.searchCampsites(params);

      expect(result.data).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
      expect(result.pagination.hasNext).toBe(false);
      expect(result.pagination.hasPrev).toBe(false);
    });

    it('should handle amenity filter returning no results after post-processing', async () => {
      const mockData = [
        {
          id: 1,
          name: 'Basic Camp',
          description: 'Basic camping',
          slug: 'basic-camp',
          campsite_type: 'tent',
          min_price: 500,
          max_price: 1000,
          average_rating: 4.0,
          review_count: 5,
          is_featured: false,
          provinces: {
            id: 1,
            name_th: 'กรุงเทพมหานคร',
            name_en: 'Bangkok',
            slug: 'bangkok',
          },
          campsite_photos: [],
          campsite_amenities: [
            { amenities: { slug: 'wifi' } },
          ],
        },
      ];

      mockQuery.range.mockResolvedValue({
        data: mockData,
        error: null,
        count: 1,
      });

      const params: SearchQuery = {
        amenities: ['wifi', 'parking', 'pool', 'restaurant'],
        page: 1,
        limit: 10,
        sort: 'rating',
      };

      const result = await searchService.searchCampsites(params);

      // Post-processing filters out the result because it doesn't have all required amenities
      expect(result.data).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    it('should throw error when query fails', async () => {
      mockQuery.range.mockResolvedValue({
        data: null,
        error: new Error('Database connection failed'),
        count: 0,
      });

      const params: SearchQuery = {
        page: 1,
        limit: 10,
        sort: 'rating',
      };

      await expect(searchService.searchCampsites(params)).rejects.toThrow(
        'Search failed: Database connection failed'
      );
    });
  });

  describe('Province Slug Filter', () => {
    it('should filter by province slug instead of ID', async () => {
      const mockData = [
        {
          id: 1,
          name: 'Chiang Mai Camp',
          description: 'Camp in Chiang Mai',
          slug: 'chiang-mai-camp',
          campsite_type: 'tent',
          min_price: 800,
          max_price: 1200,
          average_rating: 4.6,
          review_count: 15,
          is_featured: false,
          provinces: {
            id: 2,
            name_th: 'เชียงใหม่',
            name_en: 'Chiang Mai',
            slug: 'chiang-mai',
          },
          campsite_photos: [],
          campsite_amenities: [],
        },
      ];

      mockQuery.range.mockResolvedValue({
        data: mockData,
        error: null,
        count: 1,
      });

      const params: SearchQuery = {
        provinceSlug: 'chiang-mai',
        page: 1,
        limit: 10,
        sort: 'rating',
      };

      const result = await searchService.searchCampsites(params);

      expect(mockQuery.eq).toHaveBeenCalledWith('provinces.slug', 'chiang-mai');
      expect(result.data).toHaveLength(1);
      expect(result.data[0].province.slug).toBe('chiang-mai');
    });
  });

  describe('Text Search', () => {
    it('should search by text query in name and description', async () => {
      const mockData = [
        {
          id: 1,
          name: 'Mountain View Camp',
          description: 'Beautiful camping with mountain views',
          slug: 'mountain-view-camp',
          campsite_type: 'tent',
          min_price: 700,
          max_price: 1100,
          average_rating: 4.7,
          review_count: 20,
          is_featured: false,
          provinces: {
            id: 1,
            name_th: 'กรุงเทพมหานคร',
            name_en: 'Bangkok',
            slug: 'bangkok',
          },
          campsite_photos: [],
          campsite_amenities: [],
        },
      ];

      mockQuery.range.mockResolvedValue({
        data: mockData,
        error: null,
        count: 1,
      });

      const params: SearchQuery = {
        q: 'mountain',
        page: 1,
        limit: 10,
        sort: 'rating',
      };

      const result = await searchService.searchCampsites(params);

      expect(mockQuery.or).toHaveBeenCalledWith('name.ilike.%mountain%,description.ilike.%mountain%');
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toContain('Mountain');
    });
  });

  describe('Featured Filter', () => {
    it('should filter by featured campsites', async () => {
      const mockData = [
        {
          id: 1,
          name: 'Featured Camp',
          description: 'This is a featured campsite',
          slug: 'featured-camp',
          campsite_type: 'glamping',
          min_price: 2000,
          max_price: 3000,
          average_rating: 4.9,
          review_count: 100,
          is_featured: true,
          provinces: {
            id: 1,
            name_th: 'กรุงเทพมหานคร',
            name_en: 'Bangkok',
            slug: 'bangkok',
          },
          campsite_photos: [{ photo_url: 'featured.jpg', is_primary: true, sort_order: 1 }],
          campsite_amenities: [],
        },
      ];

      mockQuery.range.mockResolvedValue({
        data: mockData,
        error: null,
        count: 1,
      });

      const params: SearchQuery = {
        featured: true,
        page: 1,
        limit: 10,
        sort: 'rating',
      };

      const result = await searchService.searchCampsites(params);

      expect(mockQuery.eq).toHaveBeenCalledWith('is_featured', true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].is_featured).toBe(true);
    });
  });

  describe('Photo Selection', () => {
    it('should select primary photo as thumbnail', async () => {
      const mockData = [
        {
          id: 1,
          name: 'Camp with Photos',
          description: 'Test camp',
          slug: 'camp-with-photos',
          campsite_type: 'tent',
          min_price: 500,
          max_price: 1000,
          average_rating: 4.0,
          review_count: 5,
          is_featured: false,
          provinces: {
            id: 1,
            name_th: 'กรุงเทพมหานคร',
            name_en: 'Bangkok',
            slug: 'bangkok',
          },
          campsite_photos: [
            { photo_url: 'photo1.jpg', is_primary: false, sort_order: 2 },
            { photo_url: 'primary.jpg', is_primary: true, sort_order: 1 },
            { photo_url: 'photo3.jpg', is_primary: false, sort_order: 3 },
          ],
          campsite_amenities: [],
        },
      ];

      mockQuery.range.mockResolvedValue({
        data: mockData,
        error: null,
        count: 1,
      });

      const params: SearchQuery = {
        page: 1,
        limit: 10,
        sort: 'rating',
      };

      const result = await searchService.searchCampsites(params);

      expect(result.data[0].thumbnail_url).toBe('primary.jpg');
    });

    it('should fallback to first photo when no primary photo exists', async () => {
      const mockData = [
        {
          id: 1,
          name: 'Camp with Photos',
          description: 'Test camp',
          slug: 'camp-with-photos',
          campsite_type: 'tent',
          min_price: 500,
          max_price: 1000,
          average_rating: 4.0,
          review_count: 5,
          is_featured: false,
          provinces: {
            id: 1,
            name_th: 'กรุงเทพมหานคร',
            name_en: 'Bangkok',
            slug: 'bangkok',
          },
          campsite_photos: [
            { photo_url: 'photo2.jpg', is_primary: false, sort_order: 2 },
            { photo_url: 'photo1.jpg', is_primary: false, sort_order: 1 },
          ],
          campsite_amenities: [],
        },
      ];

      mockQuery.range.mockResolvedValue({
        data: mockData,
        error: null,
        count: 1,
      });

      const params: SearchQuery = {
        page: 1,
        limit: 10,
        sort: 'rating',
      };

      const result = await searchService.searchCampsites(params);

      expect(result.data[0].thumbnail_url).toBe('photo1.jpg');
    });

    it('should return null thumbnail when no photos exist', async () => {
      const mockData = [
        {
          id: 1,
          name: 'Camp without Photos',
          description: 'Test camp',
          slug: 'camp-without-photos',
          campsite_type: 'tent',
          min_price: 500,
          max_price: 1000,
          average_rating: 4.0,
          review_count: 5,
          is_featured: false,
          provinces: {
            id: 1,
            name_th: 'กรุงเทพมหานคร',
            name_en: 'Bangkok',
            slug: 'bangkok',
          },
          campsite_photos: [],
          campsite_amenities: [],
        },
      ];

      mockQuery.range.mockResolvedValue({
        data: mockData,
        error: null,
        count: 1,
      });

      const params: SearchQuery = {
        page: 1,
        limit: 10,
        sort: 'rating',
      };

      const result = await searchService.searchCampsites(params);

      expect(result.data[0].thumbnail_url).toBeNull();
    });
  });
});
