import request from 'supertest';
import app from '../../src/app';
import { supabaseAdmin } from '../../src/lib/supabase';

/**
 * Unit tests for Map API (T009)
 * Tests GET /api/map/campsites endpoint
 * Covers: schema validation, bounds filtering, type filtering, response structure
 */

// Mock Supabase
jest.mock('../../src/lib/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(),
  },
}));

describe('Unit: Map API - GET /api/map/campsites', () => {
  const mockCampsites = [
    {
      id: '123e4567-e89b-12d3-a456-426614174001',
      name: 'Mountain View Camp',
      latitude: 18.7883,
      longitude: 98.9853,
      campsite_type: 'camping',
      average_rating: 4.5,
      review_count: 10,
      min_price: 300,
      max_price: 800,
      provinces: { name_en: 'Chiang Mai' },
      campsite_photos: [{ url: 'https://example.com/photo1.jpg' }],
    },
    {
      id: '123e4567-e89b-12d3-a456-426614174002',
      name: 'Luxury Glamping Resort',
      latitude: 18.8000,
      longitude: 99.0000,
      campsite_type: 'glamping',
      average_rating: 4.8,
      review_count: 25,
      min_price: 1500,
      max_price: 3000,
      provinces: { name_en: 'Chiang Mai' },
      campsite_photos: [{ url: 'https://example.com/photo2.jpg' }],
    },
    {
      id: '123e4567-e89b-12d3-a456-426614174003',
      name: 'Beach Bungalow',
      latitude: 7.8804,
      longitude: 98.3923,
      campsite_type: 'bungalow',
      average_rating: 4.2,
      review_count: 15,
      min_price: 800,
      max_price: 1200,
      provinces: { name_en: 'Phuket' },
      campsite_photos: [],
    },
  ];

  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (supabaseAdmin.from as jest.Mock).mockReturnValue(mockQueryBuilder);
  });

  describe('Successful response with correct schema', () => {
    it('returns 200 and correct schema structure', async () => {
      mockQueryBuilder.limit.mockResolvedValue({
        data: mockCampsites,
        error: null,
        count: 3,
      });

      const response = await request(app).get('/api/map/campsites');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('campsites');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.campsites)).toBe(true);
      expect(typeof response.body.total).toBe('number');
    });

    it('returns campsites with all required fields', async () => {
      mockQueryBuilder.limit.mockResolvedValue({
        data: mockCampsites,
        error: null,
        count: 3,
      });

      const response = await request(app).get('/api/map/campsites');

      expect(response.status).toBe(200);
      expect(response.body.campsites.length).toBeGreaterThan(0);

      const campsite = response.body.campsites[0];

      // Verify all required fields from MapCampsite interface
      expect(campsite).toHaveProperty('id');
      expect(campsite).toHaveProperty('name');
      expect(campsite).toHaveProperty('latitude');
      expect(campsite).toHaveProperty('longitude');
      expect(campsite).toHaveProperty('campsite_type');
      expect(campsite).toHaveProperty('average_rating');
      expect(campsite).toHaveProperty('review_count');
      expect(campsite).toHaveProperty('min_price');
      expect(campsite).toHaveProperty('max_price');
      expect(campsite).toHaveProperty('province_name_en');
      expect(campsite).toHaveProperty('primary_photo_url');
    });

    it('returns correct data types for all fields', async () => {
      mockQueryBuilder.limit.mockResolvedValue({
        data: mockCampsites,
        error: null,
        count: 3,
      });

      const response = await request(app).get('/api/map/campsites');

      expect(response.status).toBe(200);
      const campsite = response.body.campsites[0];

      expect(typeof campsite.id).toBe('string');
      expect(typeof campsite.name).toBe('string');
      expect(typeof campsite.latitude).toBe('number');
      expect(typeof campsite.longitude).toBe('number');
      expect(typeof campsite.campsite_type).toBe('string');
      expect(typeof campsite.average_rating).toBe('number');
      expect(typeof campsite.review_count).toBe('number');
      expect(typeof campsite.min_price).toBe('number');
      expect(typeof campsite.max_price).toBe('number');
      expect(typeof campsite.province_name_en).toBe('string');
      expect(['string', 'object']).toContain(typeof campsite.primary_photo_url);
    });

    it('returns valid campsite_type enum values', async () => {
      mockQueryBuilder.limit.mockResolvedValue({
        data: mockCampsites,
        error: null,
        count: 3,
      });

      const response = await request(app).get('/api/map/campsites');

      expect(response.status).toBe(200);

      const validTypes = ['camping', 'glamping', 'tented-resort', 'bungalow', 'cabin', 'rv-caravan'];

      response.body.campsites.forEach((campsite: any) => {
        expect(validTypes).toContain(campsite.campsite_type);
      });
    });

    it('handles campsites with no photos correctly', async () => {
      mockQueryBuilder.limit.mockResolvedValue({
        data: [mockCampsites[2]], // Beach Bungalow with empty photos array
        error: null,
        count: 1,
      });

      const response = await request(app).get('/api/map/campsites');

      expect(response.status).toBe(200);
      expect(response.body.campsites[0].primary_photo_url).toBeNull();
    });

    it('returns correct total count', async () => {
      mockQueryBuilder.limit.mockResolvedValue({
        data: mockCampsites,
        error: null,
        count: 3,
      });

      const response = await request(app).get('/api/map/campsites');

      expect(response.status).toBe(200);
      expect(response.body.total).toBe(3);
      expect(response.body.campsites.length).toBe(3);
    });
  });

  describe('Bounds filtering', () => {
    it('applies bounds filter when all bounds parameters provided', async () => {
      mockQueryBuilder.limit.mockResolvedValue({
        data: [mockCampsites[0], mockCampsites[1]], // Only Chiang Mai campsites
        error: null,
        count: 2,
      });

      const response = await request(app).get('/api/map/campsites').query({
        north: 19.0,
        south: 18.5,
        east: 99.5,
        west: 98.5,
      });

      expect(response.status).toBe(200);

      // Verify gte and lte were called for bounds filtering
      expect(mockQueryBuilder.gte).toHaveBeenCalledWith('latitude', 18.5);
      expect(mockQueryBuilder.lte).toHaveBeenCalledWith('latitude', 19.0);
      expect(mockQueryBuilder.gte).toHaveBeenCalledWith('longitude', 98.5);
      expect(mockQueryBuilder.lte).toHaveBeenCalledWith('longitude', 99.5);
    });

    it('returns campsites within specified bounds', async () => {
      const chiangMaiCampsites = [mockCampsites[0], mockCampsites[1]];

      mockQueryBuilder.limit.mockResolvedValue({
        data: chiangMaiCampsites,
        error: null,
        count: 2,
      });

      const response = await request(app).get('/api/map/campsites').query({
        north: 19.0,
        south: 18.5,
        east: 99.5,
        west: 98.5,
      });

      expect(response.status).toBe(200);
      expect(response.body.total).toBe(2);

      // Verify all returned campsites are within bounds
      response.body.campsites.forEach((campsite: any) => {
        expect(campsite.latitude).toBeGreaterThanOrEqual(18.5);
        expect(campsite.latitude).toBeLessThanOrEqual(19.0);
        expect(campsite.longitude).toBeGreaterThanOrEqual(98.5);
        expect(campsite.longitude).toBeLessThanOrEqual(99.5);
      });
    });

    it('does not apply bounds filter when bounds are incomplete', async () => {
      mockQueryBuilder.limit.mockResolvedValue({
        data: mockCampsites,
        error: null,
        count: 3,
      });

      const response = await request(app).get('/api/map/campsites').query({
        north: 19.0,
        south: 18.5,
        // Missing east and west
      });

      expect(response.status).toBe(200);

      // Should not call gte/lte for bounds when incomplete
      // Query builder will still be called but bounds filtering not applied
      expect(response.body.total).toBe(3);
    });

    it('validates bounds are within valid latitude range (-90 to 90)', async () => {
      const response = await request(app).get('/api/map/campsites').query({
        north: 100, // Invalid: > 90
        south: 18.5,
        east: 99.5,
        west: 98.5,
      });

      // Should return 400 for invalid query parameters
      expect(response.status).toBe(400);
    });

    it('validates bounds are within valid longitude range (-180 to 180)', async () => {
      const response = await request(app).get('/api/map/campsites').query({
        north: 19.0,
        south: 18.5,
        east: 200, // Invalid: > 180
        west: 98.5,
      });

      // Should return 400 for invalid query parameters
      expect(response.status).toBe(400);
    });
  });

  describe('Type filtering', () => {
    it('filters by single campsite type', async () => {
      mockQueryBuilder.limit.mockResolvedValue({
        data: [mockCampsites[0]], // Only camping type
        error: null,
        count: 1,
      });

      const response = await request(app).get('/api/map/campsites').query({
        campsite_types: 'camping',
      });

      expect(response.status).toBe(200);
      expect(mockQueryBuilder.in).toHaveBeenCalledWith('campsite_type', ['camping']);

      // Verify all returned campsites match the filter
      response.body.campsites.forEach((campsite: any) => {
        expect(campsite.campsite_type).toBe('camping');
      });
    });

    it('filters by multiple campsite types', async () => {
      mockQueryBuilder.limit.mockResolvedValue({
        data: [mockCampsites[0], mockCampsites[1]], // camping and glamping
        error: null,
        count: 2,
      });

      const response = await request(app).get('/api/map/campsites').query({
        campsite_types: 'camping,glamping',
      });

      expect(response.status).toBe(200);
      expect(mockQueryBuilder.in).toHaveBeenCalledWith('campsite_type', ['camping', 'glamping']);

      const types = response.body.campsites.map((c: any) => c.campsite_type);
      expect(types).toContain('camping');
      expect(types).toContain('glamping');
    });

    it('handles empty type filter gracefully', async () => {
      mockQueryBuilder.limit.mockResolvedValue({
        data: mockCampsites,
        error: null,
        count: 3,
      });

      const response = await request(app).get('/api/map/campsites').query({
        campsite_types: '',
      });

      expect(response.status).toBe(200);
      // Should return all campsites when filter is empty
      expect(response.body.total).toBe(3);
    });

    it('filters by bungalow type', async () => {
      mockQueryBuilder.limit.mockResolvedValue({
        data: [mockCampsites[2]], // Only bungalow type
        error: null,
        count: 1,
      });

      const response = await request(app).get('/api/map/campsites').query({
        campsite_types: 'bungalow',
      });

      expect(response.status).toBe(200);
      expect(response.body.campsites[0].campsite_type).toBe('bungalow');
    });
  });

  describe('Combined filters', () => {
    it('applies both bounds and type filters together', async () => {
      mockQueryBuilder.limit.mockResolvedValue({
        data: [mockCampsites[1]], // Only glamping in Chiang Mai bounds
        error: null,
        count: 1,
      });

      const response = await request(app).get('/api/map/campsites').query({
        north: 19.0,
        south: 18.5,
        east: 99.5,
        west: 98.5,
        campsite_types: 'glamping',
      });

      expect(response.status).toBe(200);
      expect(mockQueryBuilder.gte).toHaveBeenCalled();
      expect(mockQueryBuilder.lte).toHaveBeenCalled();
      expect(mockQueryBuilder.in).toHaveBeenCalledWith('campsite_type', ['glamping']);

      expect(response.body.total).toBe(1);
      expect(response.body.campsites[0].campsite_type).toBe('glamping');
    });

    it('respects limit parameter', async () => {
      mockQueryBuilder.limit.mockResolvedValue({
        data: mockCampsites.slice(0, 2),
        error: null,
        count: 2,
      });

      const response = await request(app).get('/api/map/campsites').query({
        limit: 2,
      });

      expect(response.status).toBe(200);
      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(2);
      expect(response.body.campsites.length).toBeLessThanOrEqual(2);
    });

    it('uses default limit of 200 when not specified', async () => {
      mockQueryBuilder.limit.mockResolvedValue({
        data: mockCampsites,
        error: null,
        count: 3,
      });

      await request(app).get('/api/map/campsites');

      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(200);
    });

    it('enforces maximum limit of 500', async () => {
      const response = await request(app).get('/api/map/campsites').query({
        limit: 1000,
      });

      // Should return 400 for exceeding max limit
      expect(response.status).toBe(400);
    });
  });

  describe('Query filters only approved and active campsites', () => {
    it('filters for status=approved', async () => {
      mockQueryBuilder.limit.mockResolvedValue({
        data: mockCampsites,
        error: null,
        count: 3,
      });

      await request(app).get('/api/map/campsites');

      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('status', 'approved');
    });

    it('filters for is_active=true', async () => {
      mockQueryBuilder.limit.mockResolvedValue({
        data: mockCampsites,
        error: null,
        count: 3,
      });

      await request(app).get('/api/map/campsites');

      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('is_active', true);
    });
  });

  describe('Error handling', () => {
    it('returns 500 when database query fails', async () => {
      mockQueryBuilder.limit.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
        count: null,
      });

      const response = await request(app).get('/api/map/campsites');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });

    it('returns empty array when no campsites found', async () => {
      mockQueryBuilder.limit.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      const response = await request(app).get('/api/map/campsites');

      expect(response.status).toBe(200);
      expect(response.body.campsites).toEqual([]);
      expect(response.body.total).toBe(0);
    });

    it('handles null data gracefully', async () => {
      mockQueryBuilder.limit.mockResolvedValue({
        data: null,
        error: null,
        count: 0,
      });

      const response = await request(app).get('/api/map/campsites');

      expect(response.status).toBe(200);
      expect(response.body.campsites).toEqual([]);
    });
  });

  describe('Additional query parameters', () => {
    it('supports province_id filter', async () => {
      mockQueryBuilder.limit.mockResolvedValue({
        data: [mockCampsites[0], mockCampsites[1]],
        error: null,
        count: 2,
      });

      const response = await request(app).get('/api/map/campsites').query({
        province_id: 1,
      });

      expect(response.status).toBe(200);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('province_id', 1);
    });

    it('supports min_price filter', async () => {
      mockQueryBuilder.limit.mockResolvedValue({
        data: [mockCampsites[1], mockCampsites[2]],
        error: null,
        count: 2,
      });

      const response = await request(app).get('/api/map/campsites').query({
        min_price: 500,
      });

      expect(response.status).toBe(200);
      expect(mockQueryBuilder.gte).toHaveBeenCalledWith('max_price', 500);
    });

    it('supports max_price filter', async () => {
      mockQueryBuilder.limit.mockResolvedValue({
        data: [mockCampsites[0]],
        error: null,
        count: 1,
      });

      const response = await request(app).get('/api/map/campsites').query({
        max_price: 1000,
      });

      expect(response.status).toBe(200);
      expect(mockQueryBuilder.lte).toHaveBeenCalledWith('min_price', 1000);
    });

    it('supports min_rating filter', async () => {
      mockQueryBuilder.limit.mockResolvedValue({
        data: [mockCampsites[0], mockCampsites[1]],
        error: null,
        count: 2,
      });

      const response = await request(app).get('/api/map/campsites').query({
        min_rating: 4.5,
      });

      expect(response.status).toBe(200);
      expect(mockQueryBuilder.gte).toHaveBeenCalledWith('average_rating', 4.5);
    });

    it('validates min_rating is between 0 and 5', async () => {
      const response = await request(app).get('/api/map/campsites').query({
        min_rating: 6, // Invalid: > 5
      });

      expect(response.status).toBe(400);
    });
  });
});
