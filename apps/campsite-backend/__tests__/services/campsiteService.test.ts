import { CampsiteService } from '../../src/services/campsiteService';
import type { CampsiteDetail, ReviewSummary } from '@campsite/shared';
import * as reviewService from '../../src/services/reviewService';

// Mock Supabase
jest.mock('../../src/lib/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(),
  },
}));

// Mock review service
jest.mock('../../src/services/reviewService', () => ({
  getReviewSummary: jest.fn(),
  getRecentReviews: jest.fn(),
}));

import { supabaseAdmin } from '../../src/lib/supabase';

describe('CampsiteService', () => {
  let campsiteService: CampsiteService;
  let mockFrom: jest.Mock;

  beforeEach(() => {
    campsiteService = new CampsiteService();
    jest.clearAllMocks();

    mockFrom = jest.fn();
    (supabaseAdmin.from as jest.Mock) = mockFrom;
  });

  describe('getCampsiteById', () => {
    const mockCampsiteId = 'campsite-123';

    const createMockCampsite = () => ({
      id: mockCampsiteId,
      owner_id: 'owner-456',
      name: 'Test Campsite',
      description: 'A beautiful campsite',
      province_id: 1,
      address: '123 Test Road',
      latitude: 13.7563,
      longitude: 100.5018,
      type_id: 1,
      status: 'approved',
      is_featured: false,
      is_active: true,
      rating_average: 4.5,
      review_count: 10,
      price_min: 500,
      price_max: 1000,
      check_in_time: '14:00',
      check_out_time: '11:00',
      phone: '0812345678',
      email: 'test@campsite.com',
      website: 'https://test.com',
      booking_url: 'https://booking.test.com',
      facebook_url: 'https://facebook.com/test',
      instagram_url: 'https://instagram.com/test',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
      province: {
        id: 1,
        name_th: 'กรุงเทพมหานคร',
        name_en: 'Bangkok',
        slug: 'bangkok',
        region: 'Central',
        latitude: 13.7563,
        longitude: 100.5018,
      },
      owner: {
        id: 'owner-456',
        full_name: 'John Doe',
        avatar_url: 'https://avatar.com/john.jpg',
        created_at: '2023-12-01T00:00:00Z',
      },
    });

    const createMockPhotos = () => [
      {
        id: 'photo-1',
        campsite_id: mockCampsiteId,
        url: 'https://photo1.jpg',
        caption: 'Main view',
        sort_order: 0,
        created_at: '2024-01-01T00:00:00Z',
      },
      {
        id: 'photo-2',
        campsite_id: mockCampsiteId,
        url: 'https://photo2.jpg',
        caption: 'Side view',
        sort_order: 1,
        created_at: '2024-01-01T00:00:00Z',
      },
    ];

    const createMockAmenities = () => [
      {
        amenity: {
          id: 'amenity-1',
          slug: 'wifi',
          name_th: 'Wi-Fi',
          name_en: 'Wi-Fi',
          icon: 'wifi-icon',
          category: 'connectivity',
        },
      },
      {
        amenity: {
          id: 'amenity-2',
          slug: 'parking',
          name_th: 'ที่จอดรถ',
          name_en: 'Parking',
          icon: 'parking-icon',
          category: 'facilities',
        },
      },
    ];

    const createMockAccommodations = () => [
      {
        id: 'acc-1',
        campsite_id: mockCampsiteId,
        name: 'Standard Tent',
        description: 'Basic camping tent',
        capacity: 2,
        price: 500,
        amenities_included: ['wifi', 'parking'],
        is_active: true,
        sort_order: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ];

    const createMockAttractions = () => [
      {
        id: 'attr-1',
        campsite_id: mockCampsiteId,
        name: 'Waterfall',
        description: 'Beautiful waterfall nearby',
        distance_km: 2.5,
        attraction_type: 'natural',
        created_at: '2024-01-01T00:00:00Z',
      },
    ];

    const createMockReviewSummary = (): ReviewSummary => ({
      average_rating: 4.5,
      total_count: 10,
      rating_distribution: { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4 },
      rating_percentages: { 1: 0, 2: 10, 3: 20, 4: 30, 5: 40 },
      category_averages: {
        cleanliness: 4.5,
        staff: 4.3,
        facilities: 4.2,
        value: 4.6,
        location: 4.7,
      },
    });

    const createMockRecentReviews = () => [
      {
        id: 'review-1',
        campsite_id: mockCampsiteId,
        user_id: 'user-1',
        rating_overall: 5,
        rating_cleanliness: 5,
        rating_staff: 5,
        rating_facilities: 4,
        rating_value: 5,
        rating_location: 5,
        reviewer_type: 'solo' as const,
        title: 'Great experience',
        content: 'Really enjoyed the stay',
        pros: ['Clean', 'Friendly staff'],
        cons: [],
        helpful_count: 5,
        is_reported: false,
        report_count: 0,
        is_hidden: false,
        hidden_reason: null,
        hidden_at: null,
        hidden_by: null,
        owner_response: null,
        owner_response_at: null,
        visited_at: '2024-01-01',
        created_at: '2024-01-02T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        reviewer_name: 'Jane Smith',
        reviewer_avatar: 'https://avatar.com/jane.jpg',
        photos: [],
        user_helpful_vote: false,
      },
    ];

    const setupMockChain = (campsiteData: any, campsiteError: any = null) => {
      const mockSingle = jest.fn().mockResolvedValue({
        data: campsiteData,
        error: campsiteError,
      });

      const mockEq = jest.fn().mockReturnValue({
        single: mockSingle,
        eq: jest.fn().mockReturnThis(),
      });

      const mockSelect = jest.fn().mockReturnValue({
        eq: mockEq,
      });

      mockFrom.mockReturnValue({
        select: mockSelect,
      });

      return { mockSelect, mockEq, mockSingle };
    };

    const setupMockPhotosQuery = (photos: any[], error: any = null) => {
      const mockOrder = jest.fn().mockResolvedValue({ data: photos, error });
      const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'campsite_photos') {
          return { select: mockSelect };
        }
        return mockFrom.mock.results[0].value;
      });

      return { mockSelect, mockEq, mockOrder };
    };

    const setupMockAmenitiesQuery = (amenities: any[], error: any = null) => {
      const mockEq = jest.fn().mockResolvedValue({ data: amenities, error });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'campsite_amenities') {
          return { select: mockSelect };
        }
        return mockFrom.mock.results[0].value;
      });

      return { mockSelect, mockEq };
    };

    const setupMockAccommodationsQuery = (accommodations: any[], error: any = null) => {
      const mockOrder = jest.fn().mockResolvedValue({ data: accommodations, error });
      const mockEq1 = jest.fn().mockReturnValue({ order: mockOrder });
      const mockEq2 = jest.fn().mockReturnValue({ eq: mockEq1 });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq2 });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'accommodation_types') {
          return { select: mockSelect };
        }
        return mockFrom.mock.results[0].value;
      });

      return { mockSelect, mockEq2, mockEq1, mockOrder };
    };

    const setupMockAttractionsQuery = (attractions: any[], error: any = null) => {
      const mockOrder = jest.fn().mockResolvedValue({ data: attractions, error });
      const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'nearby_attractions') {
          return { select: mockSelect };
        }
        return mockFrom.mock.results[0].value;
      });

      return { mockSelect, mockEq, mockOrder };
    };

    it('returns complete campsite detail with all nested relations', async () => {
      const mockCampsite = createMockCampsite();
      const mockPhotos = createMockPhotos();
      const mockAmenities = createMockAmenities();
      const mockAccommodations = createMockAccommodations();
      const mockAttractions = createMockAttractions();
      const mockReviewSummary = createMockReviewSummary();
      const mockRecentReviews = createMockRecentReviews();

      // Setup campsite query
      setupMockChain(mockCampsite);

      // Setup related data queries
      mockFrom.mockImplementation((table: string) => {
        if (table === 'campsites') {
          const mockSingle = jest.fn().mockResolvedValue({ data: mockCampsite, error: null });
          const mockEq = jest.fn().mockReturnValue({ single: mockSingle, eq: jest.fn().mockReturnThis() });
          const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
          return { select: mockSelect };
        }
        if (table === 'campsite_photos') {
          const mockOrder = jest.fn().mockResolvedValue({ data: mockPhotos, error: null });
          const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
          const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
          return { select: mockSelect };
        }
        if (table === 'campsite_amenities') {
          const mockEq = jest.fn().mockResolvedValue({ data: mockAmenities, error: null });
          const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
          return { select: mockSelect };
        }
        if (table === 'accommodation_types') {
          const mockOrder = jest.fn().mockResolvedValue({ data: mockAccommodations, error: null });
          const mockEq1 = jest.fn().mockReturnValue({ order: mockOrder });
          const mockEq2 = jest.fn().mockReturnValue({ eq: mockEq1 });
          const mockSelect = jest.fn().mockReturnValue({ eq: mockEq2 });
          return { select: mockSelect };
        }
        if (table === 'nearby_attractions') {
          const mockOrder = jest.fn().mockResolvedValue({ data: mockAttractions, error: null });
          const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
          const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
          return { select: mockSelect };
        }
        return { select: jest.fn() };
      });

      (reviewService.getReviewSummary as jest.Mock).mockResolvedValue(mockReviewSummary);
      (reviewService.getRecentReviews as jest.Mock).mockResolvedValue(mockRecentReviews);

      const result = await campsiteService.getCampsiteById(mockCampsiteId);

      expect(result).not.toBeNull();
      expect(result).toMatchObject({
        id: mockCampsiteId,
        name: 'Test Campsite',
        campsite_type: 'camping',
        status: 'approved',
      });
      expect(result?.province).toEqual(mockCampsite.province);
      expect(result?.owner).toEqual(mockCampsite.owner);
      expect(result?.photos).toHaveLength(2);
      expect(result?.amenities).toHaveLength(2);
      expect(result?.accommodation_types).toHaveLength(1);
      expect(result?.nearby_attractions).toHaveLength(1);
      expect(result?.review_summary).toEqual(mockReviewSummary);
      expect(result?.recent_reviews).toHaveLength(1);
    });

    it('returns null for non-existent campsite', async () => {
      setupMockChain(null, { code: 'PGRST116', message: 'Not found' });

      const result = await campsiteService.getCampsiteById('non-existent-id');

      expect(result).toBeNull();
    });

    it('only returns approved campsites by default', async () => {
      const mockSingle = jest.fn().mockResolvedValue({ data: null, error: null });
      const chainMock = {
        eq: jest.fn().mockReturnThis(),
        single: mockSingle,
      };
      chainMock.eq.mockReturnValue(chainMock);

      const mockSelect = jest.fn().mockReturnValue(chainMock);
      mockFrom.mockReturnValue({ select: mockSelect });

      await campsiteService.getCampsiteById(mockCampsiteId);

      expect(chainMock.eq).toHaveBeenCalledWith('id', mockCampsiteId);
      expect(chainMock.eq).toHaveBeenCalledWith('status', 'approved');
      expect(chainMock.eq).toHaveBeenCalledWith('is_active', true);
    });

    it('returns non-approved campsites when includeNonApproved is true', async () => {
      const mockCampsite = { ...createMockCampsite(), status: 'pending' };

      mockFrom.mockImplementation((table: string) => {
        if (table === 'campsites') {
          const mockSingle = jest.fn().mockResolvedValue({ data: mockCampsite, error: null });
          const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
          const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
          return { select: mockSelect };
        }
        if (table === 'campsite_photos') {
          const mockOrder = jest.fn().mockResolvedValue({ data: [], error: null });
          const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
          const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
          return { select: mockSelect };
        }
        if (table === 'campsite_amenities') {
          const mockEq = jest.fn().mockResolvedValue({ data: [], error: null });
          const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
          return { select: mockSelect };
        }
        if (table === 'accommodation_types') {
          const mockOrder = jest.fn().mockResolvedValue({ data: [], error: null });
          const mockEq1 = jest.fn().mockReturnValue({ order: mockOrder });
          const mockEq2 = jest.fn().mockReturnValue({ eq: mockEq1 });
          const mockSelect = jest.fn().mockReturnValue({ eq: mockEq2 });
          return { select: mockSelect };
        }
        if (table === 'nearby_attractions') {
          const mockOrder = jest.fn().mockResolvedValue({ data: [], error: null });
          const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
          const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
          return { select: mockSelect };
        }
        return { select: jest.fn() };
      });

      (reviewService.getReviewSummary as jest.Mock).mockResolvedValue({
        average_rating: 0,
        total_count: 0,
        rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        rating_percentages: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        category_averages: {
          cleanliness: null,
          staff: null,
          facilities: null,
          value: null,
          location: null,
        },
      });
      (reviewService.getRecentReviews as jest.Mock).mockResolvedValue([]);

      const result = await campsiteService.getCampsiteById(mockCampsiteId, true);

      expect(result).not.toBeNull();
      expect(result?.status).toBe('pending');
    });

    it('includes review summary in response', async () => {
      const mockCampsite = createMockCampsite();
      const mockReviewSummary = createMockReviewSummary();

      mockFrom.mockImplementation((table: string) => {
        if (table === 'campsites') {
          const mockSingle = jest.fn().mockResolvedValue({ data: mockCampsite, error: null });
          const mockEq = jest.fn().mockReturnValue({ single: mockSingle, eq: jest.fn().mockReturnThis() });
          const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
          return { select: mockSelect };
        }
        if (table === 'campsite_photos') {
          const mockOrder = jest.fn().mockResolvedValue({ data: [], error: null });
          const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
          const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
          return { select: mockSelect };
        }
        if (table === 'campsite_amenities') {
          const mockEq = jest.fn().mockResolvedValue({ data: [], error: null });
          const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
          return { select: mockSelect };
        }
        if (table === 'accommodation_types') {
          const mockOrder = jest.fn().mockResolvedValue({ data: [], error: null });
          const mockEq1 = jest.fn().mockReturnValue({ order: mockOrder });
          const mockEq2 = jest.fn().mockReturnValue({ eq: mockEq1 });
          const mockSelect = jest.fn().mockReturnValue({ eq: mockEq2 });
          return { select: mockSelect };
        }
        if (table === 'nearby_attractions') {
          const mockOrder = jest.fn().mockResolvedValue({ data: [], error: null });
          const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
          const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
          return { select: mockSelect };
        }
        return { select: jest.fn() };
      });

      (reviewService.getReviewSummary as jest.Mock).mockResolvedValue(mockReviewSummary);
      (reviewService.getRecentReviews as jest.Mock).mockResolvedValue([]);

      const result = await campsiteService.getCampsiteById(mockCampsiteId);

      expect(result?.review_summary).toEqual(mockReviewSummary);
      expect(reviewService.getReviewSummary).toHaveBeenCalledWith(mockCampsiteId);
    });

    it('handles database errors gracefully', async () => {
      setupMockChain(null, { code: 'PGRST000', message: 'Database error' });

      const result = await campsiteService.getCampsiteById(mockCampsiteId);

      expect(result).toBeNull();
    });

    it('maps type_id to campsite_type correctly', async () => {
      const testCases = [
        { type_id: 1, expected: 'camping' },
        { type_id: 2, expected: 'glamping' },
        { type_id: 3, expected: 'tented-resort' },
        { type_id: 4, expected: 'bungalow' },
      ];

      for (const testCase of testCases) {
        jest.clearAllMocks();

        const mockCampsite = { ...createMockCampsite(), type_id: testCase.type_id };

        mockFrom.mockImplementation((table: string) => {
          if (table === 'campsites') {
            const mockSingle = jest.fn().mockResolvedValue({ data: mockCampsite, error: null });
            const mockEq = jest.fn().mockReturnValue({ single: mockSingle, eq: jest.fn().mockReturnThis() });
            const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
            return { select: mockSelect };
          }
          if (table === 'campsite_photos') {
            const mockOrder = jest.fn().mockResolvedValue({ data: [], error: null });
            const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
            const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
            return { select: mockSelect };
          }
          if (table === 'campsite_amenities') {
            const mockEq = jest.fn().mockResolvedValue({ data: [], error: null });
            const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
            return { select: mockSelect };
          }
          if (table === 'accommodation_types') {
            const mockOrder = jest.fn().mockResolvedValue({ data: [], error: null });
            const mockEq1 = jest.fn().mockReturnValue({ order: mockOrder });
            const mockEq2 = jest.fn().mockReturnValue({ eq: mockEq1 });
            const mockSelect = jest.fn().mockReturnValue({ eq: mockEq2 });
            return { select: mockSelect };
          }
          if (table === 'nearby_attractions') {
            const mockOrder = jest.fn().mockResolvedValue({ data: [], error: null });
            const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
            const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
            return { select: mockSelect };
          }
          return { select: jest.fn() };
        });

        (reviewService.getReviewSummary as jest.Mock).mockResolvedValue(createMockReviewSummary());
        (reviewService.getRecentReviews as jest.Mock).mockResolvedValue([]);

        const result = await campsiteService.getCampsiteById(mockCampsiteId);

        expect(result?.campsite_type).toBe(testCase.expected);
      }
    });

    it('handles empty related data arrays gracefully', async () => {
      const mockCampsite = createMockCampsite();

      mockFrom.mockImplementation((table: string) => {
        if (table === 'campsites') {
          const mockSingle = jest.fn().mockResolvedValue({ data: mockCampsite, error: null });
          const mockEq = jest.fn().mockReturnValue({ single: mockSingle, eq: jest.fn().mockReturnThis() });
          const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
          return { select: mockSelect };
        }
        if (table === 'campsite_photos') {
          const mockOrder = jest.fn().mockResolvedValue({ data: [], error: null });
          const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
          const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
          return { select: mockSelect };
        }
        if (table === 'campsite_amenities') {
          const mockEq = jest.fn().mockResolvedValue({ data: [], error: null });
          const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
          return { select: mockSelect };
        }
        if (table === 'accommodation_types') {
          const mockOrder = jest.fn().mockResolvedValue({ data: [], error: null });
          const mockEq1 = jest.fn().mockReturnValue({ order: mockOrder });
          const mockEq2 = jest.fn().mockReturnValue({ eq: mockEq1 });
          const mockSelect = jest.fn().mockReturnValue({ eq: mockEq2 });
          return { select: mockSelect };
        }
        if (table === 'nearby_attractions') {
          const mockOrder = jest.fn().mockResolvedValue({ data: [], error: null });
          const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
          const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
          return { select: mockSelect };
        }
        return { select: jest.fn() };
      });

      (reviewService.getReviewSummary as jest.Mock).mockResolvedValue(createMockReviewSummary());
      (reviewService.getRecentReviews as jest.Mock).mockResolvedValue([]);

      const result = await campsiteService.getCampsiteById(mockCampsiteId);

      expect(result?.photos).toEqual([]);
      expect(result?.amenities).toEqual([]);
      expect(result?.accommodation_types).toEqual([]);
      expect(result?.nearby_attractions).toEqual([]);
    });
  });

  describe('getCampsitePhotos', () => {
    it('returns photos ordered by sort_order', async () => {
      const mockPhotos = [
        {
          id: 'photo-1',
          campsite_id: 'campsite-123',
          url: 'https://photo1.jpg',
          caption: 'First',
          sort_order: 0,
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'photo-2',
          campsite_id: 'campsite-123',
          url: 'https://photo2.jpg',
          caption: 'Second',
          sort_order: 1,
          created_at: '2024-01-01T00:00:00Z',
        },
      ];

      const mockOrder = jest.fn().mockResolvedValue({ data: mockPhotos, error: null });
      const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await campsiteService.getCampsitePhotos('campsite-123');

      expect(mockFrom).toHaveBeenCalledWith('campsite_photos');
      expect(mockOrder).toHaveBeenCalledWith('sort_order', { ascending: true });
      expect(result).toEqual(mockPhotos);
    });

    it('returns empty array on error', async () => {
      const mockOrder = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });
      const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await campsiteService.getCampsitePhotos('campsite-123');

      expect(result).toEqual([]);
    });
  });

  describe('getCampsiteAmenities', () => {
    it('returns amenities with full details', async () => {
      const mockAmenities = [
        {
          amenity: {
            id: 'amenity-1',
            slug: 'wifi',
            name_th: 'Wi-Fi',
            name_en: 'Wi-Fi',
            icon: 'wifi-icon',
            category: 'connectivity',
          },
        },
        {
          amenity: {
            id: 'amenity-2',
            slug: 'parking',
            name_th: 'ที่จอดรถ',
            name_en: 'Parking',
            icon: 'parking-icon',
            category: 'facilities',
          },
        },
      ];

      const mockEq = jest.fn().mockResolvedValue({ data: mockAmenities, error: null });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await campsiteService.getCampsiteAmenities('campsite-123');

      expect(mockFrom).toHaveBeenCalledWith('campsite_amenities');
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(mockAmenities[0].amenity);
    });

    it('filters out null amenities', async () => {
      const mockAmenities = [
        {
          amenity: {
            id: 'amenity-1',
            slug: 'wifi',
            name_th: 'Wi-Fi',
            name_en: 'Wi-Fi',
            icon: 'wifi-icon',
            category: 'connectivity',
          },
        },
        {
          amenity: null,
        },
      ];

      const mockEq = jest.fn().mockResolvedValue({ data: mockAmenities, error: null });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await campsiteService.getCampsiteAmenities('campsite-123');

      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe('wifi');
    });

    it('returns empty array on error', async () => {
      const mockEq = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await campsiteService.getCampsiteAmenities('campsite-123');

      expect(result).toEqual([]);
    });
  });

  describe('getAccommodationTypes', () => {
    it('returns active accommodations ordered by sort_order', async () => {
      const mockAccommodations = [
        {
          id: 'acc-1',
          campsite_id: 'campsite-123',
          name: 'Standard Tent',
          description: 'Basic tent',
          capacity: 2,
          price: 500,
          amenities_included: ['wifi'],
          is_active: true,
          sort_order: 0,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      const mockOrder = jest.fn().mockResolvedValue({ data: mockAccommodations, error: null });
      const mockEq1 = jest.fn().mockReturnValue({ order: mockOrder });
      const mockEq2 = jest.fn().mockReturnValue({ eq: mockEq1 });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq2 });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await campsiteService.getAccommodationTypes('campsite-123');

      expect(mockFrom).toHaveBeenCalledWith('accommodation_types');
      expect(mockEq1).toHaveBeenCalledWith('is_active', true);
      expect(mockOrder).toHaveBeenCalledWith('sort_order', { ascending: true });
      expect(result).toEqual(mockAccommodations);
    });

    it('handles null amenities_included', async () => {
      const mockAccommodations = [
        {
          id: 'acc-1',
          campsite_id: 'campsite-123',
          name: 'Standard Tent',
          amenities_included: null,
          is_active: true,
          sort_order: 0,
        },
      ];

      const mockOrder = jest.fn().mockResolvedValue({ data: mockAccommodations, error: null });
      const mockEq1 = jest.fn().mockReturnValue({ order: mockOrder });
      const mockEq2 = jest.fn().mockReturnValue({ eq: mockEq1 });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq2 });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await campsiteService.getAccommodationTypes('campsite-123');

      expect(result[0].amenities_included).toEqual([]);
    });

    it('returns empty array on error', async () => {
      const mockOrder = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });
      const mockEq1 = jest.fn().mockReturnValue({ order: mockOrder });
      const mockEq2 = jest.fn().mockReturnValue({ eq: mockEq1 });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq2 });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await campsiteService.getAccommodationTypes('campsite-123');

      expect(result).toEqual([]);
    });
  });

  describe('getNearbyAttractions', () => {
    it('returns attractions ordered by distance', async () => {
      const mockAttractions = [
        {
          id: 'attr-1',
          campsite_id: 'campsite-123',
          name: 'Waterfall',
          description: 'Beautiful waterfall',
          distance_km: 2.5,
          attraction_type: 'natural',
          created_at: '2024-01-01T00:00:00Z',
        },
      ];

      const mockOrder = jest.fn().mockResolvedValue({ data: mockAttractions, error: null });
      const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await campsiteService.getNearbyAttractions('campsite-123');

      expect(mockFrom).toHaveBeenCalledWith('nearby_attractions');
      expect(mockOrder).toHaveBeenCalledWith('distance_km', { ascending: true });
      expect(result).toEqual(mockAttractions);
    });

    it('returns empty array on error', async () => {
      const mockOrder = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });
      const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await campsiteService.getNearbyAttractions('campsite-123');

      expect(result).toEqual([]);
    });
  });

  describe('campsiteExists', () => {
    it('returns true for existing approved campsite', async () => {
      const mockSingle = jest.fn().mockResolvedValue({
        data: { id: 'campsite-123' },
        error: null,
      });
      const mockEq2 = jest.fn().mockReturnValue({ single: mockSingle });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      const mockEq = jest.fn().mockReturnValue({ eq: mockEq1 });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await campsiteService.campsiteExists('campsite-123');

      expect(result).toBe(true);
      expect(mockEq).toHaveBeenCalledWith('id', 'campsite-123');
      expect(mockEq1).toHaveBeenCalledWith('status', 'approved');
      expect(mockEq2).toHaveBeenCalledWith('is_active', true);
    });

    it('returns false for non-existent campsite', async () => {
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });
      const mockEq2 = jest.fn().mockReturnValue({ single: mockSingle });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      const mockEq = jest.fn().mockReturnValue({ eq: mockEq1 });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await campsiteService.campsiteExists('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('trackCampsiteView', () => {
    it('tracks view with user ID', async () => {
      const mockInsert = jest.fn().mockResolvedValue({ data: null, error: null });
      mockFrom.mockReturnValue({ insert: mockInsert });

      await campsiteService.trackCampsiteView('campsite-123', 'user-456');

      expect(mockFrom).toHaveBeenCalledWith('analytics_events');
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          campsite_id: 'campsite-123',
          user_id: 'user-456',
          event_type: 'profile_view',
        })
      );
    });

    it('tracks view without user ID', async () => {
      const mockInsert = jest.fn().mockResolvedValue({ data: null, error: null });
      mockFrom.mockReturnValue({ insert: mockInsert });

      await campsiteService.trackCampsiteView('campsite-123');

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          campsite_id: 'campsite-123',
          user_id: null,
          event_type: 'profile_view',
        })
      );
    });

    it('does not throw error on analytics failure', async () => {
      const mockInsert = jest.fn().mockRejectedValue(new Error('Analytics error'));
      mockFrom.mockReturnValue({ insert: mockInsert });

      await expect(
        campsiteService.trackCampsiteView('campsite-123', 'user-456')
      ).resolves.not.toThrow();
    });
  });

  describe('getCampsitesForComparison', () => {
    it('returns multiple campsites for comparison', async () => {
      const mockCampsite1 = {
        id: 'campsite-1',
        name: 'Campsite 1',
        status: 'approved',
        is_active: true,
        type_id: 1,
        province: { id: 1, name_en: 'Bangkok' },
        owner: { id: 'owner-1', full_name: 'Owner 1' },
      };

      const mockCampsite2 = {
        id: 'campsite-2',
        name: 'Campsite 2',
        status: 'approved',
        is_active: true,
        type_id: 2,
        province: { id: 2, name_en: 'Phuket' },
        owner: { id: 'owner-2', full_name: 'Owner 2' },
      };

      let campsiteCallCount = 0;
      mockFrom.mockImplementation((table: string) => {
        if (table === 'campsites') {
          const mockSingle = jest.fn().mockImplementation(() => {
            campsiteCallCount++;
            if (campsiteCallCount === 1) {
              return Promise.resolve({ data: mockCampsite1, error: null });
            } else if (campsiteCallCount === 2) {
              return Promise.resolve({ data: mockCampsite2, error: null });
            }
            return Promise.resolve({ data: null, error: null });
          });
          const mockEq = jest.fn().mockReturnValue({ single: mockSingle, eq: jest.fn().mockReturnThis() });
          const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
          return { select: mockSelect };
        }
        if (table === 'campsite_photos') {
          const mockOrder = jest.fn().mockResolvedValue({ data: [], error: null });
          const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
          const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
          return { select: mockSelect };
        }
        if (table === 'campsite_amenities') {
          const mockEq = jest.fn().mockResolvedValue({ data: [], error: null });
          const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
          return { select: mockSelect };
        }
        if (table === 'accommodation_types') {
          const mockOrder = jest.fn().mockResolvedValue({ data: [], error: null });
          const mockEq1 = jest.fn().mockReturnValue({ order: mockOrder });
          const mockEq2 = jest.fn().mockReturnValue({ eq: mockEq1 });
          const mockSelect = jest.fn().mockReturnValue({ eq: mockEq2 });
          return { select: mockSelect };
        }
        if (table === 'nearby_attractions') {
          const mockOrder = jest.fn().mockResolvedValue({ data: [], error: null });
          const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
          const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
          return { select: mockSelect };
        }
        return { select: jest.fn() };
      });

      (reviewService.getReviewSummary as jest.Mock).mockResolvedValue({
        average_rating: 0,
        total_count: 0,
        rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        rating_percentages: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        category_averages: {
          cleanliness: null,
          staff: null,
          facilities: null,
          value: null,
          location: null,
        },
      });
      (reviewService.getRecentReviews as jest.Mock).mockResolvedValue([]);

      const result = await campsiteService.getCampsitesForComparison([
        'campsite-1',
        'campsite-2',
      ]);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('campsite-1');
      expect(result[1].id).toBe('campsite-2');
    });

    it('limits to max 3 campsites', async () => {
      const mockCampsite = {
        id: 'campsite-1',
        name: 'Campsite 1',
        status: 'approved',
        is_active: true,
        type_id: 1,
        province: { id: 1, name_en: 'Bangkok' },
        owner: { id: 'owner-1', full_name: 'Owner 1' },
      };

      mockFrom.mockImplementation((table: string) => {
        if (table === 'campsites') {
          const mockSingle = jest.fn().mockResolvedValue({ data: mockCampsite, error: null });
          const mockEq = jest.fn().mockReturnValue({ single: mockSingle, eq: jest.fn().mockReturnThis() });
          const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
          return { select: mockSelect };
        }
        if (table === 'campsite_photos') {
          const mockOrder = jest.fn().mockResolvedValue({ data: [], error: null });
          const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
          const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
          return { select: mockSelect };
        }
        if (table === 'campsite_amenities') {
          const mockEq = jest.fn().mockResolvedValue({ data: [], error: null });
          const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
          return { select: mockSelect };
        }
        if (table === 'accommodation_types') {
          const mockOrder = jest.fn().mockResolvedValue({ data: [], error: null });
          const mockEq1 = jest.fn().mockReturnValue({ order: mockOrder });
          const mockEq2 = jest.fn().mockReturnValue({ eq: mockEq1 });
          const mockSelect = jest.fn().mockReturnValue({ eq: mockEq2 });
          return { select: mockSelect };
        }
        if (table === 'nearby_attractions') {
          const mockOrder = jest.fn().mockResolvedValue({ data: [], error: null });
          const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
          const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
          return { select: mockSelect };
        }
        return { select: jest.fn() };
      });

      (reviewService.getReviewSummary as jest.Mock).mockResolvedValue({
        average_rating: 0,
        total_count: 0,
        rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        rating_percentages: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        category_averages: {
          cleanliness: null,
          staff: null,
          facilities: null,
          value: null,
          location: null,
        },
      });
      (reviewService.getRecentReviews as jest.Mock).mockResolvedValue([]);

      const result = await campsiteService.getCampsitesForComparison([
        'campsite-1',
        'campsite-2',
        'campsite-3',
        'campsite-4',
      ]);

      expect(result.length).toBeLessThanOrEqual(3);
    });

    it('filters out null results', async () => {
      let nullFilterCallCount = 0;
      mockFrom.mockImplementation((table: string) => {
        if (table === 'campsites') {
          const mockSingle = jest.fn().mockImplementation(() => {
            nullFilterCallCount++;
            if (nullFilterCallCount === 1) {
              return Promise.resolve({
                data: {
                  id: 'campsite-1',
                  name: 'Campsite 1',
                  status: 'approved',
                  is_active: true,
                  type_id: 1,
                  province: { id: 1, name_en: 'Bangkok' },
                  owner: { id: 'owner-1', full_name: 'Owner 1' },
                },
                error: null,
              });
            } else {
              return Promise.resolve({ data: null, error: { code: 'PGRST116' } });
            }
          });
          const mockEq = jest.fn().mockReturnValue({ single: mockSingle, eq: jest.fn().mockReturnThis() });
          const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
          return { select: mockSelect };
        }
        if (table === 'campsite_photos') {
          const mockOrder = jest.fn().mockResolvedValue({ data: [], error: null });
          const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
          const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
          return { select: mockSelect };
        }
        if (table === 'campsite_amenities') {
          const mockEq = jest.fn().mockResolvedValue({ data: [], error: null });
          const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
          return { select: mockSelect };
        }
        if (table === 'accommodation_types') {
          const mockOrder = jest.fn().mockResolvedValue({ data: [], error: null });
          const mockEq1 = jest.fn().mockReturnValue({ order: mockOrder });
          const mockEq2 = jest.fn().mockReturnValue({ eq: mockEq1 });
          const mockSelect = jest.fn().mockReturnValue({ eq: mockEq2 });
          return { select: mockSelect };
        }
        if (table === 'nearby_attractions') {
          const mockOrder = jest.fn().mockResolvedValue({ data: [], error: null });
          const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
          const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
          return { select: mockSelect };
        }
        return { select: jest.fn() };
      });

      (reviewService.getReviewSummary as jest.Mock).mockResolvedValue({
        average_rating: 0,
        total_count: 0,
        rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        rating_percentages: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        category_averages: {
          cleanliness: null,
          staff: null,
          facilities: null,
          value: null,
          location: null,
        },
      });
      (reviewService.getRecentReviews as jest.Mock).mockResolvedValue([]);

      const result = await campsiteService.getCampsitesForComparison([
        'campsite-1',
        'non-existent',
      ]);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('campsite-1');
    });
  });
});
