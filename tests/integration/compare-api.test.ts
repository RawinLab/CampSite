/**
 * Integration Test: Compare API
 * Tests the GET /api/campsites/compare endpoint
 * Tests fetching 2-3 campsites for comparison with full data
 */

import request from 'supertest';
import app from '../../apps/campsite-backend/src/app';
import { supabaseAdmin } from '../../apps/campsite-backend/src/lib/supabase';

// Mock Supabase
jest.mock('../../apps/campsite-backend/src/lib/supabase', () => {
  const mockSupabaseAdmin = {
    from: jest.fn(),
    auth: {
      getUser: jest.fn(),
    },
  };

  const mockCreateSupabaseClient = jest.fn(() => mockSupabaseAdmin);

  return {
    supabaseAdmin: mockSupabaseAdmin,
    createSupabaseClient: mockCreateSupabaseClient,
  };
});

describe('Integration: Compare API', () => {
  const CAMPSITE_1_ID = 'campsite-111-aaaa-bbbb-ccccddddeeee';
  const CAMPSITE_2_ID = 'campsite-222-aaaa-bbbb-ccccddddeeee';
  const CAMPSITE_3_ID = 'campsite-333-aaaa-bbbb-ccccddddeeee';
  const INVALID_ID = 'invalid-id';
  const NON_EXISTENT_ID = 'campsite-999-aaaa-bbbb-ccccddddeeee';

  const mockCampsite1 = {
    id: CAMPSITE_1_ID,
    name: 'Mountain View Camping',
    slug: 'mountain-view-camping',
    description: 'Beautiful mountain camping site',
    address: '123 Mountain Road',
    latitude: 18.7883,
    longitude: 98.9853,
    campsite_type: 'camping',
    status: 'approved',
    is_active: true,
    is_featured: false,
    min_price: 300,
    max_price: 800,
    average_rating: 4.5,
    review_count: 10,
    province_id: 1,
    owner_id: 'owner-123',
    contact_phone: '0812345678',
    contact_email: 'mountain@example.com',
    contact_line_id: '@mountain',
    website_url: 'https://mountain.example.com',
    check_in_time: '14:00:00',
    check_out_time: '12:00:00',
    policies: 'No smoking',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockCampsite2 = {
    id: CAMPSITE_2_ID,
    name: 'Lakeside Glamping',
    slug: 'lakeside-glamping',
    description: 'Luxury glamping by the lake',
    address: '456 Lake Avenue',
    latitude: 18.8000,
    longitude: 99.0000,
    campsite_type: 'glamping',
    status: 'approved',
    is_active: true,
    is_featured: true,
    min_price: 1500,
    max_price: 3000,
    average_rating: 4.8,
    review_count: 25,
    province_id: 1,
    owner_id: 'owner-456',
    contact_phone: '0823456789',
    contact_email: 'lake@example.com',
    contact_line_id: '@lake',
    website_url: 'https://lake.example.com',
    check_in_time: '15:00:00',
    check_out_time: '11:00:00',
    policies: 'Pet friendly',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockCampsite3 = {
    id: CAMPSITE_3_ID,
    name: 'Forest Bungalows',
    slug: 'forest-bungalows',
    description: 'Cozy bungalows in the forest',
    address: '789 Forest Trail',
    latitude: 18.7500,
    longitude: 98.9500,
    campsite_type: 'bungalow',
    status: 'approved',
    is_active: true,
    is_featured: false,
    min_price: 800,
    max_price: 1200,
    average_rating: 4.2,
    review_count: 15,
    province_id: 2,
    owner_id: 'owner-789',
    contact_phone: '0834567890',
    contact_email: 'forest@example.com',
    contact_line_id: '@forest',
    website_url: 'https://forest.example.com',
    check_in_time: '14:00:00',
    check_out_time: '12:00:00',
    policies: 'Quiet hours after 10pm',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockProvince1 = {
    id: 1,
    name_th: 'เชียงใหม่',
    name_en: 'Chiang Mai',
    slug: 'chiang-mai',
    region: 'north',
  };

  const mockProvince2 = {
    id: 2,
    name_th: 'เชียงราย',
    name_en: 'Chiang Rai',
    slug: 'chiang-rai',
    region: 'north',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/campsites/compare - Valid Requests', () => {
    it('should successfully fetch 2 campsites for comparison', async () => {
      // Mock for campsite 1
      const mockQuery1 = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    ...mockCampsite1,
                    provinces: mockProvince1,
                    campsite_photos: [
                      { url: 'photo1.jpg', is_primary: true, display_order: 1 },
                    ],
                    accommodation_types: [],
                    campsite_amenities: [],
                  },
                  error: null,
                }),
              }),
            }),
          }),
        }),
      };

      // Mock for campsite 2
      const mockQuery2 = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    ...mockCampsite2,
                    provinces: mockProvince1,
                    campsite_photos: [
                      { url: 'photo2.jpg', is_primary: true, display_order: 1 },
                    ],
                    accommodation_types: [],
                    campsite_amenities: [],
                  },
                  error: null,
                }),
              }),
            }),
          }),
        }),
      };

      (supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce(mockQuery1)
        .mockReturnValueOnce(mockQuery2);

      const response = await request(app)
        .get(`/api/campsites/compare?ids=${CAMPSITE_1_ID},${CAMPSITE_2_ID}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('campsites');
      expect(Array.isArray(response.body.data.campsites)).toBe(true);
      expect(response.body.data.campsites.length).toBe(2);

      // Verify first campsite has all required fields
      const campsite1 = response.body.data.campsites[0];
      expect(campsite1).toHaveProperty('id', CAMPSITE_1_ID);
      expect(campsite1).toHaveProperty('name', 'Mountain View Camping');
      expect(campsite1).toHaveProperty('description');
      expect(campsite1).toHaveProperty('address');
      expect(campsite1).toHaveProperty('latitude');
      expect(campsite1).toHaveProperty('longitude');
      expect(campsite1).toHaveProperty('campsite_type', 'camping');
      expect(campsite1).toHaveProperty('min_price', 300);
      expect(campsite1).toHaveProperty('max_price', 800);
      expect(campsite1).toHaveProperty('average_rating', 4.5);
      expect(campsite1).toHaveProperty('review_count', 10);
      expect(campsite1).toHaveProperty('province');
      expect(campsite1.province).toHaveProperty('name_en', 'Chiang Mai');
      expect(campsite1).toHaveProperty('photos');
      expect(campsite1).toHaveProperty('amenities');

      // Verify second campsite
      const campsite2 = response.body.data.campsites[1];
      expect(campsite2).toHaveProperty('id', CAMPSITE_2_ID);
      expect(campsite2).toHaveProperty('name', 'Lakeside Glamping');
      expect(campsite2).toHaveProperty('campsite_type', 'glamping');
    });

    it('should successfully fetch 3 campsites for comparison', async () => {
      // Mock for campsite 1
      const mockQuery1 = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    ...mockCampsite1,
                    provinces: mockProvince1,
                    campsite_photos: [],
                    accommodation_types: [],
                    campsite_amenities: [],
                  },
                  error: null,
                }),
              }),
            }),
          }),
        }),
      };

      // Mock for campsite 2
      const mockQuery2 = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    ...mockCampsite2,
                    provinces: mockProvince1,
                    campsite_photos: [],
                    accommodation_types: [],
                    campsite_amenities: [],
                  },
                  error: null,
                }),
              }),
            }),
          }),
        }),
      };

      // Mock for campsite 3
      const mockQuery3 = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    ...mockCampsite3,
                    provinces: mockProvince2,
                    campsite_photos: [],
                    accommodation_types: [],
                    campsite_amenities: [],
                  },
                  error: null,
                }),
              }),
            }),
          }),
        }),
      };

      (supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce(mockQuery1)
        .mockReturnValueOnce(mockQuery2)
        .mockReturnValueOnce(mockQuery3);

      const response = await request(app)
        .get(`/api/campsites/compare?ids=${CAMPSITE_1_ID},${CAMPSITE_2_ID},${CAMPSITE_3_ID}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.campsites.length).toBe(3);

      // Verify all three have different IDs
      const ids = response.body.data.campsites.map((c: any) => c.id);
      expect(ids).toContain(CAMPSITE_1_ID);
      expect(ids).toContain(CAMPSITE_2_ID);
      expect(ids).toContain(CAMPSITE_3_ID);
    });

    it('should return all required fields for comparison', async () => {
      const mockQueryWithAmenities = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    ...mockCampsite1,
                    provinces: mockProvince1,
                    campsite_photos: [
                      { url: 'photo1.jpg', is_primary: true, display_order: 1 },
                      { url: 'photo2.jpg', is_primary: false, display_order: 2 },
                    ],
                    accommodation_types: [
                      { name: 'Tent Site', price: 300, capacity: 2 },
                      { name: 'RV Site', price: 800, capacity: 4 },
                    ],
                    campsite_amenities: [
                      { amenities: { slug: 'wifi', name: 'WiFi', icon: '📶' } },
                      { amenities: { slug: 'parking', name: 'Parking', icon: '🅿️' } },
                    ],
                  },
                  error: null,
                }),
              }),
            }),
          }),
        }),
      };

      const mockQuery2 = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    ...mockCampsite2,
                    provinces: mockProvince1,
                    campsite_photos: [],
                    accommodation_types: [],
                    campsite_amenities: [],
                  },
                  error: null,
                }),
              }),
            }),
          }),
        }),
      };

      (supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce(mockQueryWithAmenities)
        .mockReturnValueOnce(mockQuery2);

      const response = await request(app)
        .get(`/api/campsites/compare?ids=${CAMPSITE_1_ID},${CAMPSITE_2_ID}`)
        .expect(200);

      const campsite = response.body.data.campsites[0];

      // Verify comprehensive field structure
      expect(campsite).toHaveProperty('id');
      expect(campsite).toHaveProperty('name');
      expect(campsite).toHaveProperty('description');
      expect(campsite).toHaveProperty('address');
      expect(campsite).toHaveProperty('latitude');
      expect(campsite).toHaveProperty('longitude');
      expect(campsite).toHaveProperty('campsite_type');
      expect(campsite).toHaveProperty('min_price');
      expect(campsite).toHaveProperty('max_price');
      expect(campsite).toHaveProperty('average_rating');
      expect(campsite).toHaveProperty('review_count');
      expect(campsite).toHaveProperty('contact_phone');
      expect(campsite).toHaveProperty('contact_email');
      expect(campsite).toHaveProperty('check_in_time');
      expect(campsite).toHaveProperty('check_out_time');
      expect(campsite).toHaveProperty('policies');
      expect(campsite).toHaveProperty('province');
      expect(campsite.province).toHaveProperty('id');
      expect(campsite.province).toHaveProperty('name_th');
      expect(campsite.province).toHaveProperty('name_en');
      expect(campsite.province).toHaveProperty('slug');
      expect(campsite).toHaveProperty('photos');
      expect(Array.isArray(campsite.photos)).toBe(true);
      expect(campsite.photos.length).toBe(2);
      expect(campsite).toHaveProperty('accommodations');
      expect(Array.isArray(campsite.accommodations)).toBe(true);
      expect(campsite.accommodations.length).toBe(2);
      expect(campsite).toHaveProperty('amenities');
      expect(Array.isArray(campsite.amenities)).toBe(true);
      expect(campsite.amenities.length).toBe(2);
    });
  });

  describe('GET /api/campsites/compare - Invalid Requests', () => {
    it('should return 400 when ids parameter is missing', async () => {
      const response = await request(app)
        .get('/api/campsites/compare')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Missing ids parameter');
    });

    it('should return 400 when less than 2 campsite IDs are provided', async () => {
      const response = await request(app)
        .get(`/api/campsites/compare?ids=${CAMPSITE_1_ID}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('At least 2 campsite IDs are required');
    });

    it('should return 400 when more than 3 campsite IDs are provided', async () => {
      const response = await request(app)
        .get(`/api/campsites/compare?ids=${CAMPSITE_1_ID},${CAMPSITE_2_ID},${CAMPSITE_3_ID},campsite-444-aaaa-bbbb-ccccddddeeee`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Maximum 3 campsites can be compared');
    });

    it('should return 400 for invalid UUID format', async () => {
      const response = await request(app)
        .get(`/api/campsites/compare?ids=${INVALID_ID},${CAMPSITE_2_ID}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid campsite ID');
    });

    it('should return 400 when campsites do not exist', async () => {
      // Mock non-existent campsites
      const mockQuery1 = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { code: 'PGRST116' }, // No rows returned
                }),
              }),
            }),
          }),
        }),
      };

      const mockQuery2 = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { code: 'PGRST116' },
                }),
              }),
            }),
          }),
        }),
      };

      (supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce(mockQuery1)
        .mockReturnValueOnce(mockQuery2);

      const response = await request(app)
        .get(`/api/campsites/compare?ids=${NON_EXISTENT_ID},campsite-888-aaaa-bbbb-ccccddddeeee`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Could not find enough valid campsites');
    });

    it('should return 400 when only 1 valid campsite is found from 2 IDs', async () => {
      // Mock one valid campsite
      const mockQuery1 = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    ...mockCampsite1,
                    provinces: mockProvince1,
                    campsite_photos: [],
                    accommodation_types: [],
                    campsite_amenities: [],
                  },
                  error: null,
                }),
              }),
            }),
          }),
        }),
      };

      // Mock one non-existent campsite
      const mockQuery2 = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { code: 'PGRST116' },
                }),
              }),
            }),
          }),
        }),
      };

      (supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce(mockQuery1)
        .mockReturnValueOnce(mockQuery2);

      const response = await request(app)
        .get(`/api/campsites/compare?ids=${CAMPSITE_1_ID},${NON_EXISTENT_ID}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Could not find enough valid campsites');
    });
  });

  describe('GET /api/campsites/compare - Edge Cases', () => {
    it('should handle empty ids parameter', async () => {
      const response = await request(app)
        .get('/api/campsites/compare?ids=')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should filter out inactive campsites', async () => {
      // Mock one active campsite
      const mockQuery1 = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    ...mockCampsite1,
                    provinces: mockProvince1,
                    campsite_photos: [],
                    accommodation_types: [],
                    campsite_amenities: [],
                  },
                  error: null,
                }),
              }),
            }),
          }),
        }),
      };

      // Mock one inactive campsite (should return null due to status filter)
      const mockQuery2 = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { code: 'PGRST116' },
                }),
              }),
            }),
          }),
        }),
      };

      (supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce(mockQuery1)
        .mockReturnValueOnce(mockQuery2);

      const response = await request(app)
        .get(`/api/campsites/compare?ids=${CAMPSITE_1_ID},${CAMPSITE_2_ID}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('Could not find enough valid campsites');
    });

    it('should handle whitespace in ids parameter', async () => {
      const response = await request(app)
        .get(`/api/campsites/compare?ids= ${CAMPSITE_1_ID} , ${CAMPSITE_2_ID} `)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle comparison of same campsite ID twice', async () => {
      // Mock query returns same campsite
      const mockQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    ...mockCampsite1,
                    provinces: mockProvince1,
                    campsite_photos: [],
                    accommodation_types: [],
                    campsite_amenities: [],
                  },
                  error: null,
                }),
              }),
            }),
          }),
        }),
      };

      (supabaseAdmin.from as jest.Mock)
        .mockReturnValue(mockQuery);

      const response = await request(app)
        .get(`/api/campsites/compare?ids=${CAMPSITE_1_ID},${CAMPSITE_1_ID}`)
        .expect(200);

      // Should work but return same campsite data twice
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.campsites.length).toBe(2);
      expect(response.body.data.campsites[0].id).toBe(CAMPSITE_1_ID);
      expect(response.body.data.campsites[1].id).toBe(CAMPSITE_1_ID);
    });
  });
});
