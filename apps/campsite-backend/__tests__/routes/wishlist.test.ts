import request from 'supertest';
import app from '../../src/app';

// Mock the entire wishlist service
jest.mock('../../src/services/wishlistService', () => ({
  getWishlist: jest.fn(),
  addToWishlist: jest.fn(),
  removeFromWishlist: jest.fn(),
  isInWishlist: jest.fn(),
  batchCheckWishlist: jest.fn(),
  getWishlistCount: jest.fn(),
}));

// Mock createSupabaseClient for auth
const mockGetUser = jest.fn();
const mockFrom = jest.fn();
jest.mock('../../src/lib/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(),
    auth: {
      getUser: jest.fn(),
    },
  },
  createSupabaseClient: jest.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
  })),
}));

import * as wishlistService from '../../src/services/wishlistService';

const mockedWishlistService = wishlistService as jest.Mocked<typeof wishlistService>;

/**
 * Unit tests for Wishlist API
 * Tests all wishlist endpoints with authentication and error handling
 */

describe('Wishlist API Routes', () => {
  const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
  const mockToken = 'mock-jwt-token';
  const validCampsiteId = '223e4567-e89b-12d3-a456-426614174000';
  const secondCampsiteId = '323e4567-e89b-12d3-a456-426614174000';

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock successful authentication by default
    mockGetUser.mockResolvedValue({
      data: { user: { id: mockUserId, email: 'test@test.com' } },
      error: null,
    });

    // Mock profile fetch
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { user_role: 'user' },
            error: null,
          }),
        }),
      }),
    });
  });

  describe('GET /api/wishlist', () => {
    describe('Authentication', () => {
      it('returns 401 when no auth token provided', async () => {
        const response = await request(app).get('/api/wishlist');

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error');
      });

      it('returns 401 when invalid auth token provided', async () => {
        mockGetUser.mockResolvedValue({
          data: { user: null },
          error: new Error('Invalid token'),
        });

        const response = await request(app)
          .get('/api/wishlist')
          .set('Authorization', 'Bearer invalid-token');

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error');
      });
    });

    describe('Successful retrieval', () => {
      it('returns 200 and empty array when user has no wishlist items', async () => {
        mockedWishlistService.getWishlist.mockResolvedValue({
          items: [],
          total: 0,
        });

        const response = await request(app)
          .get('/api/wishlist')
          .set('Authorization', `Bearer ${mockToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(Array.isArray(response.body.data.data)).toBe(true);
        expect(response.body.data).toHaveProperty('count', 0);
        expect(response.body.data).toHaveProperty('pagination');
        expect(response.body.data.pagination).toHaveProperty('page');
        expect(response.body.data.pagination).toHaveProperty('limit');
        expect(response.body.data.pagination).toHaveProperty('total');
        expect(response.body.data.pagination).toHaveProperty('totalPages');
      });

      it('returns wishlist items with correct structure', async () => {
        const mockWishlistItem = {
          id: 'wishlist-1',
          user_id: mockUserId,
          campsite_id: validCampsiteId,
          notes: 'Test note',
          created_at: new Date().toISOString(),
          campsite: {
            id: validCampsiteId,
            name: 'Test Campsite',
            slug: 'test-campsite',
          },
        };

        mockedWishlistService.getWishlist.mockResolvedValue({
          items: [mockWishlistItem] as any,
          total: 1,
        });

        const response = await request(app)
          .get('/api/wishlist')
          .set('Authorization', `Bearer ${mockToken}`);

        expect(response.status).toBe(200);
        const items = response.body.data.data;
        expect(items.length).toBe(1);
        expect(items[0]).toHaveProperty('id', 'wishlist-1');
        expect(items[0]).toHaveProperty('notes', 'Test note');
      });
    });

    describe('Pagination', () => {
      it('respects page parameter', async () => {
        mockedWishlistService.getWishlist.mockResolvedValue({
          items: [],
          total: 5,
        });

        const response = await request(app)
          .get('/api/wishlist?page=2&limit=2')
          .set('Authorization', `Bearer ${mockToken}`);

        expect(response.status).toBe(200);
        expect(response.body.data.pagination.page).toBe(2);
        expect(response.body.data.pagination.limit).toBe(2);
        expect(mockedWishlistService.getWishlist).toHaveBeenCalledWith(
          mockUserId,
          expect.objectContaining({ page: 2, limit: 2 })
        );
      });

      it('respects limit parameter', async () => {
        mockedWishlistService.getWishlist.mockResolvedValue({
          items: [],
          total: 0,
        });

        const response = await request(app)
          .get('/api/wishlist?limit=5')
          .set('Authorization', `Bearer ${mockToken}`);

        expect(response.status).toBe(200);
        expect(response.body.data.pagination.limit).toBe(5);
      });

      it('uses default pagination values when not specified', async () => {
        mockedWishlistService.getWishlist.mockResolvedValue({
          items: [],
          total: 0,
        });

        const response = await request(app)
          .get('/api/wishlist')
          .set('Authorization', `Bearer ${mockToken}`);

        expect(response.status).toBe(200);
        expect(response.body.data.pagination.page).toBe(1);
        expect(response.body.data.pagination.limit).toBe(20);
      });
    });

    describe('Sorting', () => {
      it('sorts by newest by default', async () => {
        mockedWishlistService.getWishlist.mockResolvedValue({
          items: [],
          total: 0,
        });

        const response = await request(app)
          .get('/api/wishlist')
          .set('Authorization', `Bearer ${mockToken}`);

        expect(response.status).toBe(200);
        expect(mockedWishlistService.getWishlist).toHaveBeenCalledWith(
          mockUserId,
          expect.objectContaining({ sort: 'newest' })
        );
      });

      it('respects sort parameter', async () => {
        mockedWishlistService.getWishlist.mockResolvedValue({
          items: [],
          total: 0,
        });

        const response = await request(app)
          .get('/api/wishlist?sort=oldest')
          .set('Authorization', `Bearer ${mockToken}`);

        expect(response.status).toBe(200);
        expect(mockedWishlistService.getWishlist).toHaveBeenCalledWith(
          mockUserId,
          expect.objectContaining({ sort: 'oldest' })
        );
      });
    });

    describe('Error handling', () => {
      it('returns 500 when service throws error', async () => {
        mockedWishlistService.getWishlist.mockRejectedValue(new Error('Database error'));

        const response = await request(app)
          .get('/api/wishlist')
          .set('Authorization', `Bearer ${mockToken}`);

        expect(response.status).toBe(500);
        expect(response.body).toHaveProperty('error');
      });
    });
  });

  describe('POST /api/wishlist', () => {
    describe('Authentication', () => {
      it('returns 401 when no auth token provided', async () => {
        const response = await request(app)
          .post('/api/wishlist')
          .send({ campsite_id: validCampsiteId });

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error');
      });

      it('returns 401 when invalid auth token provided', async () => {
        mockGetUser.mockResolvedValue({
          data: { user: null },
          error: new Error('Invalid token'),
        });

        const response = await request(app)
          .post('/api/wishlist')
          .set('Authorization', 'Bearer invalid-token')
          .send({ campsite_id: validCampsiteId });

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error');
      });
    });

    describe('Validation', () => {
      it('returns 400 when campsite_id is missing', async () => {
        const response = await request(app)
          .post('/api/wishlist')
          .set('Authorization', `Bearer ${mockToken}`)
          .send({});

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
      });

      it('returns 400 when campsite_id is invalid UUID', async () => {
        const response = await request(app)
          .post('/api/wishlist')
          .set('Authorization', `Bearer ${mockToken}`)
          .send({ campsite_id: 'invalid-uuid' });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
      });
    });

    describe('Successful addition', () => {
      it('returns 201 and adds campsite to wishlist', async () => {
        const mockWishlistItem = {
          id: 'wishlist-1',
          user_id: mockUserId,
          campsite_id: validCampsiteId,
          notes: null,
          created_at: new Date().toISOString(),
        };

        mockedWishlistService.addToWishlist.mockResolvedValue(mockWishlistItem as any);

        const response = await request(app)
          .post('/api/wishlist')
          .set('Authorization', `Bearer ${mockToken}`)
          .send({ campsite_id: validCampsiteId });

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(response.body.data.data).toHaveProperty('id', 'wishlist-1');
      });

      it('adds campsite with optional notes', async () => {
        const notes = 'Want to visit in summer';
        const mockWishlistItem = {
          id: 'wishlist-1',
          user_id: mockUserId,
          campsite_id: validCampsiteId,
          notes,
          created_at: new Date().toISOString(),
        };

        mockedWishlistService.addToWishlist.mockResolvedValue(mockWishlistItem as any);

        const response = await request(app)
          .post('/api/wishlist')
          .set('Authorization', `Bearer ${mockToken}`)
          .send({ campsite_id: validCampsiteId, notes });

        expect(response.status).toBe(201);
        expect(response.body.data.data).toHaveProperty('notes', notes);
      });
    });

    describe('Error handling', () => {
      it('returns 404 when campsite does not exist', async () => {
        mockedWishlistService.addToWishlist.mockRejectedValue(
          new Error('Campsite not found or not available')
        );

        const response = await request(app)
          .post('/api/wishlist')
          .set('Authorization', `Bearer ${mockToken}`)
          .send({ campsite_id: validCampsiteId });

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error');
      });

      it('returns 409 when campsite already in wishlist', async () => {
        mockedWishlistService.addToWishlist.mockRejectedValue(
          new Error('Campsite already in wishlist')
        );

        const response = await request(app)
          .post('/api/wishlist')
          .set('Authorization', `Bearer ${mockToken}`)
          .send({ campsite_id: validCampsiteId });

        expect(response.status).toBe(409);
        expect(response.body).toHaveProperty('error');
      });

      it('returns 500 on unexpected errors', async () => {
        mockedWishlistService.addToWishlist.mockRejectedValue(
          new Error('Database connection failed')
        );

        const response = await request(app)
          .post('/api/wishlist')
          .set('Authorization', `Bearer ${mockToken}`)
          .send({ campsite_id: validCampsiteId });

        expect(response.status).toBe(500);
        expect(response.body).toHaveProperty('error');
      });
    });
  });

  describe('DELETE /api/wishlist/:campsiteId', () => {
    describe('Authentication', () => {
      it('returns 401 when no auth token provided', async () => {
        const response = await request(app).delete(
          `/api/wishlist/${validCampsiteId}`
        );

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error');
      });

      it('returns 401 when invalid auth token provided', async () => {
        mockGetUser.mockResolvedValue({
          data: { user: null },
          error: new Error('Invalid token'),
        });

        const response = await request(app)
          .delete(`/api/wishlist/${validCampsiteId}`)
          .set('Authorization', 'Bearer invalid-token');

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error');
      });
    });

    describe('Successful deletion', () => {
      it('returns 200 and removes campsite from wishlist', async () => {
        mockedWishlistService.removeFromWishlist.mockResolvedValue(undefined);

        const response = await request(app)
          .delete(`/api/wishlist/${validCampsiteId}`)
          .set('Authorization', `Bearer ${mockToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
        expect(mockedWishlistService.removeFromWishlist).toHaveBeenCalledWith(
          mockUserId,
          validCampsiteId
        );
      });
    });

    describe('Error handling', () => {
      it('returns 500 when service throws error', async () => {
        mockedWishlistService.removeFromWishlist.mockRejectedValue(
          new Error('Database error')
        );

        const response = await request(app)
          .delete(`/api/wishlist/${validCampsiteId}`)
          .set('Authorization', `Bearer ${mockToken}`);

        expect(response.status).toBe(500);
        expect(response.body).toHaveProperty('error');
      });
    });
  });

  describe('GET /api/wishlist/check/:campsiteId', () => {
    describe('Authentication', () => {
      it('returns 401 when no auth token provided', async () => {
        const response = await request(app).get(
          `/api/wishlist/check/${validCampsiteId}`
        );

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error');
      });
    });

    describe('Check wishlist status', () => {
      it('returns true when campsite is in wishlist', async () => {
        mockedWishlistService.isInWishlist.mockResolvedValue({
          is_wishlisted: true,
          wishlist_id: 'wishlist-1',
        });

        const response = await request(app)
          .get(`/api/wishlist/check/${validCampsiteId}`)
          .set('Authorization', `Bearer ${mockToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body.data).toHaveProperty('is_wishlisted', true);
        expect(response.body.data).toHaveProperty('wishlist_id', 'wishlist-1');
      });

      it('returns false when campsite is not in wishlist', async () => {
        mockedWishlistService.isInWishlist.mockResolvedValue({
          is_wishlisted: false,
          wishlist_id: null,
        });

        const response = await request(app)
          .get(`/api/wishlist/check/${validCampsiteId}`)
          .set('Authorization', `Bearer ${mockToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body.data).toHaveProperty('is_wishlisted', false);
      });
    });

    describe('Error handling', () => {
      it('returns 500 when service throws error', async () => {
        mockedWishlistService.isInWishlist.mockRejectedValue(
          new Error('Database error')
        );

        const response = await request(app)
          .get(`/api/wishlist/check/${validCampsiteId}`)
          .set('Authorization', `Bearer ${mockToken}`);

        expect(response.status).toBe(500);
        expect(response.body).toHaveProperty('error');
      });
    });
  });

  describe('POST /api/wishlist/check-batch', () => {
    describe('Authentication', () => {
      it('returns 401 when no auth token provided', async () => {
        const response = await request(app)
          .post('/api/wishlist/check-batch')
          .send({ campsite_ids: [validCampsiteId] });

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error');
      });
    });

    describe('Batch check', () => {
      it('returns status for multiple campsites', async () => {
        mockedWishlistService.batchCheckWishlist.mockResolvedValue({
          [validCampsiteId]: true,
          [secondCampsiteId]: false,
        });

        const response = await request(app)
          .post('/api/wishlist/check-batch')
          .set('Authorization', `Bearer ${mockToken}`)
          .send({ campsite_ids: [validCampsiteId, secondCampsiteId] });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body.data).toHaveProperty(validCampsiteId, true);
        expect(response.body.data).toHaveProperty(secondCampsiteId, false);
      });

      it('returns 400 when campsite_ids is missing', async () => {
        const response = await request(app)
          .post('/api/wishlist/check-batch')
          .set('Authorization', `Bearer ${mockToken}`)
          .send({});

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
      });

      it('returns 400 when campsite_ids is not an array', async () => {
        const response = await request(app)
          .post('/api/wishlist/check-batch')
          .set('Authorization', `Bearer ${mockToken}`)
          .send({ campsite_ids: 'not-an-array' });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
      });

      it('returns 400 when campsite_ids is empty array', async () => {
        const response = await request(app)
          .post('/api/wishlist/check-batch')
          .set('Authorization', `Bearer ${mockToken}`)
          .send({ campsite_ids: [] });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
      });
    });

    describe('Error handling', () => {
      it('returns 500 when service throws error', async () => {
        mockedWishlistService.batchCheckWishlist.mockRejectedValue(
          new Error('Database error')
        );

        const response = await request(app)
          .post('/api/wishlist/check-batch')
          .set('Authorization', `Bearer ${mockToken}`)
          .send({ campsite_ids: [validCampsiteId] });

        expect(response.status).toBe(500);
        expect(response.body).toHaveProperty('error');
      });
    });
  });

  describe('GET /api/wishlist/count', () => {
    describe('Authentication', () => {
      it('returns 401 when no auth token provided', async () => {
        const response = await request(app).get('/api/wishlist/count');

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error');
      });
    });

    describe('Count retrieval', () => {
      it('returns correct wishlist count', async () => {
        mockedWishlistService.getWishlistCount.mockResolvedValue(5);

        const response = await request(app)
          .get('/api/wishlist/count')
          .set('Authorization', `Bearer ${mockToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body.data).toHaveProperty('count', 5);
      });

      it('returns 0 when wishlist is empty', async () => {
        mockedWishlistService.getWishlistCount.mockResolvedValue(0);

        const response = await request(app)
          .get('/api/wishlist/count')
          .set('Authorization', `Bearer ${mockToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body.data).toHaveProperty('count', 0);
      });
    });

    describe('Error handling', () => {
      it('returns 500 when service throws error', async () => {
        mockedWishlistService.getWishlistCount.mockRejectedValue(
          new Error('Database error')
        );

        const response = await request(app)
          .get('/api/wishlist/count')
          .set('Authorization', `Bearer ${mockToken}`);

        expect(response.status).toBe(500);
        expect(response.body).toHaveProperty('error');
      });
    });
  });
});
