import request from 'supertest';
import app from '../../src/app';

/**
 * Unit tests for Photo Upload API Endpoint
 * Tests POST /api/dashboard/campsites/:id/photos endpoint
 * Covers: file validation, authentication, authorization, business rules
 */

// Mock Supabase
const mockGetUser = jest.fn();
const mockFrom = jest.fn();
const mockSupabaseClient = {
  auth: {
    getUser: mockGetUser,
  },
  from: mockFrom,
};

jest.mock('../../src/lib/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(),
    auth: {
      getUser: jest.fn(),
    },
  },
  createSupabaseClient: jest.fn(() => mockSupabaseClient),
}));

// Mock analytics service
jest.mock('../../src/services/analytics.service', () => ({
  analyticsService: {
    getDashboardStats: jest.fn(),
    getAnalytics: jest.fn(),
  },
}));

// Mock email service
jest.mock('../../src/services/email.service', () => ({
  emailService: {
    sendInquiryReply: jest.fn(),
  },
}));

describe('POST /api/dashboard/campsites/:id/photos', () => {
  const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
  const mockOwnerId = '223e4567-e89b-12d3-a456-426614174001';
  const mockCampsiteId = 'campsite-123';
  const mockToken = 'mock-jwt-token';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should return 401 when no token is provided', async () => {
      const response = await request(app)
        .post(`/api/dashboard/campsites/${mockCampsiteId}/photos`)
        .send({ url: 'https://example.com/photo.jpg' });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('No authentication token provided');
    });

    it('should return 401 when invalid token is provided - unauthenticated upload fails', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Invalid token'),
      });

      const response = await request(app)
        .post(`/api/dashboard/campsites/${mockCampsiteId}/photos`)
        .set('Authorization', 'Bearer invalid-token')
        .send({ url: 'https://example.com/photo.jpg' });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Authorization - Role Guard', () => {
    it('should return 403 when user role is not owner or admin', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: mockUserId, email: 'user@test.com' } },
        error: null,
      });

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

      const response = await request(app)
        .post(`/api/dashboard/campsites/${mockCampsiteId}/photos`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ url: 'https://example.com/photo.jpg' });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Campsite Ownership', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: mockUserId, email: 'owner@test.com' } },
        error: null,
      });
    });

    it('should return 404 when campsite does not exist - invalid campsite ID', async () => {
      mockFrom
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { user_role: 'owner' },
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { code: 'PGRST116' },
                }),
              }),
            }),
          }),
        });

      const response = await request(app)
        .post(`/api/dashboard/campsites/${mockCampsiteId}/photos`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ url: 'https://example.com/photo.jpg' });

      expect(response.status).toBe(404);
      expect(response.body.error).toEqual(expect.objectContaining({ message: 'Campsite not found' }));
    });

    it('should return 404 when non-owner cannot upload to campsite - 403 forbidden', async () => {
      mockFrom
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { user_role: 'owner' },
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { code: 'PGRST116' },
                }),
              }),
            }),
          }),
        });

      const response = await request(app)
        .post(`/api/dashboard/campsites/${mockCampsiteId}/photos`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ url: 'https://example.com/photo.jpg' });

      expect(response.status).toBe(404);
    });
  });

  describe('Photo Validation', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: mockUserId, email: 'owner@test.com' } },
        error: null,
      });
    });

    it('should return 400 when photo URL is missing', async () => {
      mockFrom
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { user_role: 'owner' },
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: mockCampsiteId, owner_id: mockUserId },
                  error: null,
                }),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: jest.fn(() => ({
            eq: jest.fn(() => Promise.resolve({ count: 5 })),
          })),
        });

      const response = await request(app)
        .post(`/api/dashboard/campsites/${mockCampsiteId}/photos`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ alt_text: 'Test photo' });

      expect(response.status).toBe(400);
      expect(response.body.error).toEqual(expect.objectContaining({ message: 'Photo URL is required' }));
    });

    it('should accept valid image URLs - JPEG - valid image upload succeeds', async () => {
      mockFrom
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { user_role: 'owner' },
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: mockCampsiteId, owner_id: mockUserId },
                  error: null,
                }),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: jest.fn(() => ({
            eq: jest.fn(() => Promise.resolve({ count: 5 })),
          })),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { sort_order: 5 },
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  id: 'photo-123',
                  campsite_id: mockCampsiteId,
                  url: 'https://example.com/photo.jpg',
                  alt_text: 'Mountain view',
                  is_primary: false,
                  sort_order: 6,
                },
                error: null,
              }),
            }),
          }),
        });

      const response = await request(app)
        .post(`/api/dashboard/campsites/${mockCampsiteId}/photos`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({
          url: 'https://example.com/photo.jpg',
          alt_text: 'Mountain view',
        });

      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('url');
      expect(response.body.data.url).toBe('https://example.com/photo.jpg');
    });

    it('should accept valid image URLs - PNG', async () => {
      mockFrom
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { user_role: 'owner' },
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: mockCampsiteId, owner_id: mockUserId },
                  error: null,
                }),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: jest.fn(() => ({
            eq: jest.fn(() => Promise.resolve({ count: 0 })),
          })),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: null,
                    error: { code: 'PGRST116' },
                  }),
                }),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  id: 'photo-124',
                  campsite_id: mockCampsiteId,
                  url: 'https://example.com/photo.png',
                  alt_text: null,
                  is_primary: false,
                  sort_order: 1,
                },
                error: null,
              }),
            }),
          }),
        });

      const response = await request(app)
        .post(`/api/dashboard/campsites/${mockCampsiteId}/photos`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ url: 'https://example.com/photo.png' });

      expect(response.status).toBe(201);
      expect(response.body.data.url).toBe('https://example.com/photo.png');
    });

    it('should accept valid image URLs - WebP', async () => {
      mockFrom
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { user_role: 'owner' },
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: mockCampsiteId, owner_id: mockUserId },
                  error: null,
                }),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: jest.fn(() => ({
            eq: jest.fn(() => Promise.resolve({ count: 0 })),
          })),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: null,
                    error: { code: 'PGRST116' },
                  }),
                }),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  id: 'photo-125',
                  campsite_id: mockCampsiteId,
                  url: 'https://example.com/photo.webp',
                  alt_text: null,
                  is_primary: false,
                  sort_order: 1,
                },
                error: null,
              }),
            }),
          }),
        });

      const response = await request(app)
        .post(`/api/dashboard/campsites/${mockCampsiteId}/photos`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ url: 'https://example.com/photo.webp' });

      expect(response.status).toBe(201);
      expect(response.body.data.url).toBe('https://example.com/photo.webp');
    });
  });

  describe('Business Rules - Maximum Photos Limit', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: mockUserId, email: 'owner@test.com' } },
        error: null,
      });
    });

    it('should return 400 when campsite already has 20 photos - maximum 20 photos per campsite enforced', async () => {
      mockFrom
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { user_role: 'owner' },
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: mockCampsiteId, owner_id: mockUserId },
                  error: null,
                }),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: jest.fn(() => ({
            eq: jest.fn(() => Promise.resolve({ count: 20 })),
          })),
        });

      const response = await request(app)
        .post(`/api/dashboard/campsites/${mockCampsiteId}/photos`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ url: 'https://example.com/photo.jpg' });

      expect(response.status).toBe(400);
      expect(response.body.error).toEqual(expect.objectContaining({ message: 'Maximum 20 photos allowed per campsite' }));
    });

    it('should allow upload when campsite has 19 photos', async () => {
      mockFrom
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { user_role: 'owner' },
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: mockCampsiteId, owner_id: mockUserId },
                  error: null,
                }),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: jest.fn(() => ({
            eq: jest.fn(() => Promise.resolve({ count: 19 })),
          })),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { sort_order: 19 },
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  id: 'photo-126',
                  campsite_id: mockCampsiteId,
                  url: 'https://example.com/photo.jpg',
                  alt_text: null,
                  is_primary: false,
                  sort_order: 20,
                },
                error: null,
              }),
            }),
          }),
        });

      const response = await request(app)
        .post(`/api/dashboard/campsites/${mockCampsiteId}/photos`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ url: 'https://example.com/photo.jpg' });

      expect(response.status).toBe(201);
      expect(response.body.data.sort_order).toBe(20);
    });
  });

  describe('Photo Order and Primary Photo', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: mockUserId, email: 'owner@test.com' } },
        error: null,
      });
    });

    it('should set correct sort_order when adding first photo - photo order is set correctly', async () => {
      mockFrom
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { user_role: 'owner' },
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: mockCampsiteId, owner_id: mockUserId },
                  error: null,
                }),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: jest.fn(() => ({
            eq: jest.fn(() => Promise.resolve({ count: 0 })),
          })),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: null,
                    error: { code: 'PGRST116' },
                  }),
                }),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  id: 'photo-127',
                  campsite_id: mockCampsiteId,
                  url: 'https://example.com/photo.jpg',
                  alt_text: null,
                  is_primary: false,
                  sort_order: 1,
                },
                error: null,
              }),
            }),
          }),
        });

      const response = await request(app)
        .post(`/api/dashboard/campsites/${mockCampsiteId}/photos`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ url: 'https://example.com/photo.jpg' });

      expect(response.status).toBe(201);
      expect(response.body.data.sort_order).toBe(1);
    });

    it('should increment sort_order when adding subsequent photos', async () => {
      mockFrom
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { user_role: 'owner' },
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: mockCampsiteId, owner_id: mockUserId },
                  error: null,
                }),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: jest.fn(() => ({
            eq: jest.fn(() => Promise.resolve({ count: 5 })),
          })),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { sort_order: 5 },
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  id: 'photo-128',
                  campsite_id: mockCampsiteId,
                  url: 'https://example.com/photo.jpg',
                  alt_text: null,
                  is_primary: false,
                  sort_order: 6,
                },
                error: null,
              }),
            }),
          }),
        });

      const response = await request(app)
        .post(`/api/dashboard/campsites/${mockCampsiteId}/photos`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ url: 'https://example.com/photo.jpg' });

      expect(response.status).toBe(201);
      expect(response.body.data.sort_order).toBe(6);
    });

    it('should unset other primary photos when setting new primary photo', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      mockFrom
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { user_role: 'owner' },
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: mockCampsiteId, owner_id: mockUserId },
                  error: null,
                }),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: jest.fn(() => ({
            eq: jest.fn(() => Promise.resolve({ count: 2 })),
          })),
        })
        .mockReturnValueOnce({
          update: mockUpdate,
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { sort_order: 2 },
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  id: 'photo-129',
                  campsite_id: mockCampsiteId,
                  url: 'https://example.com/photo.jpg',
                  alt_text: null,
                  is_primary: true,
                  sort_order: 3,
                },
                error: null,
              }),
            }),
          }),
        });

      const response = await request(app)
        .post(`/api/dashboard/campsites/${mockCampsiteId}/photos`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({
          url: 'https://example.com/photo.jpg',
          is_primary: true,
        });

      expect(response.status).toBe(201);
      expect(response.body.data.is_primary).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith({ is_primary: false });
    });

    it('should include photo URL in response - response includes uploaded photo URL', async () => {
      mockFrom
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { user_role: 'owner' },
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: mockCampsiteId, owner_id: mockUserId },
                  error: null,
                }),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: jest.fn(() => ({
            eq: jest.fn(() => Promise.resolve({ count: 0 })),
          })),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: null,
                    error: { code: 'PGRST116' },
                  }),
                }),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  id: 'photo-130',
                  campsite_id: mockCampsiteId,
                  url: 'https://storage.example.com/campsites/photo-new.jpg',
                  alt_text: 'Beautiful sunset view',
                  is_primary: false,
                  sort_order: 1,
                  created_at: new Date().toISOString(),
                },
                error: null,
              }),
            }),
          }),
        });

      const response = await request(app)
        .post(`/api/dashboard/campsites/${mockCampsiteId}/photos`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({
          url: 'https://storage.example.com/campsites/photo-new.jpg',
          alt_text: 'Beautiful sunset view',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('url');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('campsite_id');
      expect(response.body.data).toHaveProperty('sort_order');
      expect(response.body.data.url).toBe('https://storage.example.com/campsites/photo-new.jpg');
      expect(response.body.data.alt_text).toBe('Beautiful sunset view');
    });
  });

  describe('Owner Can Upload to Their Campsite', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: mockUserId, email: 'owner@test.com' } },
        error: null,
      });
    });

    it('should allow owner to upload photo to their campsite - owner can upload to their campsite', async () => {
      mockFrom
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { user_role: 'owner' },
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: mockCampsiteId, owner_id: mockUserId },
                  error: null,
                }),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: jest.fn(() => ({
            eq: jest.fn(() => Promise.resolve({ count: 5 })),
          })),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { sort_order: 5 },
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  id: 'photo-131',
                  campsite_id: mockCampsiteId,
                  url: 'https://example.com/photo.jpg',
                  alt_text: 'My campsite photo',
                  is_primary: false,
                  sort_order: 6,
                },
                error: null,
              }),
            }),
          }),
        });

      const response = await request(app)
        .post(`/api/dashboard/campsites/${mockCampsiteId}/photos`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({
          url: 'https://example.com/photo.jpg',
          alt_text: 'My campsite photo',
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Photo uploaded successfully');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('url');
    });
  });
});
