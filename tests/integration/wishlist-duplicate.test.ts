/**
 * Integration Test: Wishlist Duplicate Prevention
 * Tests that duplicate wishlist entries are blocked
 * Tests unique constraint enforcement on (user_id, campsite_id)
 */

import request from 'supertest';
import app from '../../apps/campsite-backend/src/app';
import { supabaseAdmin } from '../../apps/campsite-backend/src/lib/supabase';
import { createSupabaseClient } from '../../apps/campsite-backend/src/lib/supabase';

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

describe('Integration: Wishlist Duplicate Prevention', () => {
  const VALID_TOKEN = 'valid-test-token';
  const VALID_USER_ID = 'user-123';
  const VALID_CAMPSITE_ID = 'campsite-456';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/wishlist - Duplicate Prevention', () => {
    it('should successfully add campsite to wishlist for the first time', async () => {
      // Mock valid authentication
      (createSupabaseClient as jest.Mock).mockReturnValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: VALID_USER_ID } },
            error: null,
          }),
        },
      });

      // Mock profile lookup
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: VALID_USER_ID, auth_user_id: VALID_USER_ID },
              error: null,
            }),
          }),
        }),
      });

      // Mock campsite existence check
      const mockCampsiteCheck = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: VALID_CAMPSITE_ID },
                  error: null,
                }),
              }),
            }),
          }),
        }),
      };

      // Mock no existing wishlist entry
      const mockExistingCheck = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116' }, // No rows returned
              }),
            }),
          }),
        }),
      };

      // Mock successful insert
      const mockInsert = {
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'wishlist-123',
                user_id: VALID_USER_ID,
                campsite_id: VALID_CAMPSITE_ID,
                notes: null,
                created_at: new Date().toISOString(),
              },
              error: null,
            }),
          }),
        }),
      };

      (supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce(mockCampsiteCheck) // First call for campsite check
        .mockReturnValueOnce(mockExistingCheck) // Second call for existing check
        .mockReturnValueOnce(mockInsert); // Third call for insert

      const response = await request(app)
        .post('/api/wishlist')
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .send({ campsite_id: VALID_CAMPSITE_ID })
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('campsite_id', VALID_CAMPSITE_ID);
    });

    it('should return 409 when campsite is already in wishlist', async () => {
      // Mock valid authentication
      (createSupabaseClient as jest.Mock).mockReturnValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: VALID_USER_ID } },
            error: null,
          }),
        },
      });

      // Mock profile lookup
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: VALID_USER_ID, auth_user_id: VALID_USER_ID },
              error: null,
            }),
          }),
        }),
      });

      // Mock campsite existence check
      const mockCampsiteCheck = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: VALID_CAMPSITE_ID },
                  error: null,
                }),
              }),
            }),
          }),
        }),
      };

      // Mock existing wishlist entry found
      const mockExistingCheck = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  id: 'existing-wishlist-123',
                  user_id: VALID_USER_ID,
                  campsite_id: VALID_CAMPSITE_ID,
                },
                error: null,
              }),
            }),
          }),
        }),
      };

      (supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce(mockCampsiteCheck) // First call for campsite check
        .mockReturnValueOnce(mockExistingCheck); // Second call for existing check

      const response = await request(app)
        .post('/api/wishlist')
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .send({ campsite_id: VALID_CAMPSITE_ID })
        .expect(409);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('already in wishlist');
    });

    it('should enforce unique constraint at database level', async () => {
      // Mock valid authentication
      (createSupabaseClient as jest.Mock).mockReturnValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: VALID_USER_ID } },
            error: null,
          }),
        },
      });

      // Mock profile lookup
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: VALID_USER_ID, auth_user_id: VALID_USER_ID },
              error: null,
            }),
          }),
        }),
      });

      // Mock campsite existence check
      const mockCampsiteCheck = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: VALID_CAMPSITE_ID },
                  error: null,
                }),
              }),
            }),
          }),
        }),
      };

      // Mock no existing wishlist entry (race condition scenario)
      const mockExistingCheck = {
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
      };

      // Mock database constraint violation on insert
      const mockInsert = {
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: {
                code: '23505', // PostgreSQL unique constraint violation
                message: 'duplicate key value violates unique constraint "wishlists_user_id_campsite_id_key"',
              },
            }),
          }),
        }),
      };

      (supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce(mockCampsiteCheck)
        .mockReturnValueOnce(mockExistingCheck)
        .mockReturnValueOnce(mockInsert);

      const response = await request(app)
        .post('/api/wishlist')
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .send({ campsite_id: VALID_CAMPSITE_ID })
        .expect(500);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Failed to add to wishlist');
    });

    it('should return 404 when campsite does not exist', async () => {
      // Mock valid authentication
      (createSupabaseClient as jest.Mock).mockReturnValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: VALID_USER_ID } },
            error: null,
          }),
        },
      });

      // Mock profile lookup
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: VALID_USER_ID, auth_user_id: VALID_USER_ID },
              error: null,
            }),
          }),
        }),
      });

      // Mock campsite not found
      const mockCampsiteCheck = {
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

      (supabaseAdmin.from as jest.Mock).mockReturnValueOnce(mockCampsiteCheck);

      const response = await request(app)
        .post('/api/wishlist')
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .send({ campsite_id: 'non-existent-campsite' })
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('not found');
    });

    it('should return 401 when user is not authenticated', async () => {
      const response = await request(app)
        .post('/api/wishlist')
        .send({ campsite_id: VALID_CAMPSITE_ID })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('authentication');
    });

    it('should return 400 when campsite_id is missing', async () => {
      // Mock valid authentication
      (createSupabaseClient as jest.Mock).mockReturnValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: VALID_USER_ID } },
            error: null,
          }),
        },
      });

      // Mock profile lookup
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: VALID_USER_ID, auth_user_id: VALID_USER_ID },
              error: null,
            }),
          }),
        }),
      });

      const response = await request(app)
        .post('/api/wishlist')
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Wishlist Unique Constraint Behavior', () => {
    it('should allow same campsite for different users', async () => {
      const ANOTHER_USER_ID = 'user-789';

      // Mock valid authentication for second user
      (createSupabaseClient as jest.Mock).mockReturnValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: ANOTHER_USER_ID } },
            error: null,
          }),
        },
      });

      // Mock profile lookup
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: ANOTHER_USER_ID, auth_user_id: ANOTHER_USER_ID },
              error: null,
            }),
          }),
        }),
      });

      // Mock campsite existence
      const mockCampsiteCheck = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: VALID_CAMPSITE_ID },
                  error: null,
                }),
              }),
            }),
          }),
        }),
      };

      // Mock no existing wishlist for this user
      const mockExistingCheck = {
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
      };

      // Mock successful insert
      const mockInsert = {
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'wishlist-789',
                user_id: ANOTHER_USER_ID,
                campsite_id: VALID_CAMPSITE_ID,
                notes: null,
                created_at: new Date().toISOString(),
              },
              error: null,
            }),
          }),
        }),
      };

      (supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce(mockCampsiteCheck)
        .mockReturnValueOnce(mockExistingCheck)
        .mockReturnValueOnce(mockInsert);

      const response = await request(app)
        .post('/api/wishlist')
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .send({ campsite_id: VALID_CAMPSITE_ID })
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('user_id', ANOTHER_USER_ID);
      expect(response.body.data).toHaveProperty('campsite_id', VALID_CAMPSITE_ID);
    });

    it('should not allow same user to add different campsites multiple times each', async () => {
      const CAMPSITE_1 = 'campsite-111';
      const CAMPSITE_2 = 'campsite-222';

      // Mock valid authentication
      (createSupabaseClient as jest.Mock).mockReturnValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: VALID_USER_ID } },
            error: null,
          }),
        },
      });

      // Mock profile lookup
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: VALID_USER_ID, auth_user_id: VALID_USER_ID },
              error: null,
            }),
          }),
        }),
      });

      // Mock campsite 1 exists, no existing wishlist, successful insert
      const mockCampsiteCheck1 = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: CAMPSITE_1 },
                  error: null,
                }),
              }),
            }),
          }),
        }),
      };

      const mockExistingCheck1 = {
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
      };

      const mockInsert1 = {
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'wishlist-c1',
                user_id: VALID_USER_ID,
                campsite_id: CAMPSITE_1,
                notes: null,
                created_at: new Date().toISOString(),
              },
              error: null,
            }),
          }),
        }),
      };

      (supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce(mockCampsiteCheck1)
        .mockReturnValueOnce(mockExistingCheck1)
        .mockReturnValueOnce(mockInsert1);

      // First add should succeed
      await request(app)
        .post('/api/wishlist')
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .send({ campsite_id: CAMPSITE_1 })
        .expect(201);

      // Mock attempt to add campsite 1 again - should fail
      const mockCampsiteCheck1Again = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: CAMPSITE_1 },
                  error: null,
                }),
              }),
            }),
          }),
        }),
      };

      const mockExistingCheck1Again = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: 'wishlist-c1', user_id: VALID_USER_ID, campsite_id: CAMPSITE_1 },
                error: null,
              }),
            }),
          }),
        }),
      };

      (supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce(mockCampsiteCheck1Again)
        .mockReturnValueOnce(mockExistingCheck1Again);

      // Second add of same campsite should fail
      await request(app)
        .post('/api/wishlist')
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .send({ campsite_id: CAMPSITE_1 })
        .expect(409);
    });
  });
});
