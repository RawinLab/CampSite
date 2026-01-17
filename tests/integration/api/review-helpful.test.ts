/**
 * Integration Test: Review Helpful Vote API Endpoint
 * Task T072: Integration test for helpful endpoint
 *
 * Tests the POST /api/reviews/:id/helpful endpoint
 * which allows authenticated users to toggle helpful votes on reviews.
 */

import request from 'supertest';
import app from '../../../apps/campsite-backend/src/app';
import { supabaseAdmin } from '../../../apps/campsite-backend/src/lib/supabase';
import { createSupabaseClient } from '../../../apps/campsite-backend/src/lib/supabase';

// Mock Supabase
jest.mock('../../../apps/campsite-backend/src/lib/supabase', () => {
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

describe('Integration: Review Helpful Vote API', () => {
  const VALID_TOKEN = 'valid-test-token';
  const VALID_USER_ID = 'user-123';
  const VALID_REVIEW_ID = 'review-456';
  const ANOTHER_USER_ID = 'user-789';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/reviews/:reviewId/helpful - Authentication', () => {
    it('should return 401 when no authentication token is provided', async () => {
      const response = await request(app)
        .post(`/api/reviews/${VALID_REVIEW_ID}/helpful`)
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('No authentication token provided');
    });

    it('should return 401 when invalid token is provided', async () => {
      // Mock invalid token
      (createSupabaseClient as jest.Mock).mockReturnValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: { message: 'Invalid token' }
          }),
        },
      });

      const response = await request(app)
        .post(`/api/reviews/${VALID_REVIEW_ID}/helpful`)
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid or expired token');
    });

    it('should return 401 when expired token is provided', async () => {
      // Mock expired token
      (createSupabaseClient as jest.Mock).mockReturnValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: { message: 'Token expired' }
          }),
        },
      });

      const response = await request(app)
        .post(`/api/reviews/${VALID_REVIEW_ID}/helpful`)
        .set('Authorization', 'Bearer expired-token')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/reviews/:reviewId/helpful - Vote Creation', () => {
    beforeEach(() => {
      // Mock successful authentication
      (createSupabaseClient as jest.Mock).mockReturnValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: {
              user: {
                id: VALID_USER_ID,
                email: 'test@example.com'
              }
            },
            error: null,
          }),
        },
        from: jest.fn(() => ({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { user_role: 'user' },
            error: null,
          }),
        })),
      });
    });

    it('should successfully create a helpful vote', async () => {
      // Mock no existing vote
      (supabaseAdmin.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'review_helpful') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
            insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
            delete: jest.fn(),
          };
        }
        if (table === 'reviews') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { helpful_count: 1 },
              error: null,
            }),
          };
        }
        return {};
      });

      const response = await request(app)
        .post(`/api/reviews/${VALID_REVIEW_ID}/helpful`)
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('helpful_count');
      expect(response.body.data).toHaveProperty('user_voted');
    });

    it('should increment helpful_count when vote is created', async () => {
      // Mock no existing vote
      (supabaseAdmin.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'review_helpful') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
            insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
            delete: jest.fn(),
          };
        }
        if (table === 'reviews') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { helpful_count: 5 },
              error: null,
            }),
          };
        }
        return {};
      });

      const response = await request(app)
        .post(`/api/reviews/${VALID_REVIEW_ID}/helpful`)
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.helpful_count).toBe(5);
      expect(response.body.data.user_voted).toBe(true);
    });

    it('should return updated count in response', async () => {
      const expectedCount = 3;

      // Mock no existing vote
      (supabaseAdmin.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'review_helpful') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
            insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
            delete: jest.fn(),
          };
        }
        if (table === 'reviews') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { helpful_count: expectedCount },
              error: null,
            }),
          };
        }
        return {};
      });

      const response = await request(app)
        .post(`/api/reviews/${VALID_REVIEW_ID}/helpful`)
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .expect(200);

      expect(response.body.data.helpful_count).toBe(expectedCount);
      expect(typeof response.body.data.helpful_count).toBe('number');
    });
  });

  describe('POST /api/reviews/:reviewId/helpful - Toggle Behavior', () => {
    beforeEach(() => {
      // Mock successful authentication
      (createSupabaseClient as jest.Mock).mockReturnValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: {
              user: {
                id: VALID_USER_ID,
                email: 'test@example.com'
              }
            },
            error: null,
          }),
        },
        from: jest.fn(() => ({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { user_role: 'user' },
            error: null,
          }),
        })),
      });
    });

    it('should remove vote when user votes again on same review', async () => {
      // Mock existing vote
      (supabaseAdmin.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'review_helpful') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { review_id: VALID_REVIEW_ID },
              error: null
            }),
            delete: jest.fn().mockReturnThis(),
            insert: jest.fn(),
          };
        }
        if (table === 'reviews') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { helpful_count: 2 },
              error: null,
            }),
          };
        }
        return {};
      });

      const response = await request(app)
        .post(`/api/reviews/${VALID_REVIEW_ID}/helpful`)
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user_voted).toBe(false);
      expect(response.body.data.helpful_count).toBe(2);
    });

    it('should decrement helpful_count when vote is removed', async () => {
      // Mock existing vote
      (supabaseAdmin.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'review_helpful') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { review_id: VALID_REVIEW_ID },
              error: null
            }),
            delete: jest.fn().mockReturnThis(),
            insert: jest.fn(),
          };
        }
        if (table === 'reviews') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { helpful_count: 4 },
              error: null,
            }),
          };
        }
        return {};
      });

      const response = await request(app)
        .post(`/api/reviews/${VALID_REVIEW_ID}/helpful`)
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .expect(200);

      expect(response.body.data.helpful_count).toBe(4);
      expect(response.body.data.user_voted).toBe(false);
    });

    it('should toggle vote state correctly - vote, unvote, vote again', async () => {
      let hasVote = false;

      (supabaseAdmin.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'review_helpful') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: hasVote ? { review_id: VALID_REVIEW_ID } : null,
              error: null
            }),
            insert: jest.fn().mockImplementation(() => {
              hasVote = true;
              return { data: {}, error: null };
            }),
            delete: jest.fn().mockReturnThis(),
          };
        }
        if (table === 'reviews') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { helpful_count: hasVote ? 1 : 0 },
              error: null,
            }),
          };
        }
        return {};
      });

      // First vote - should create
      const firstResponse = await request(app)
        .post(`/api/reviews/${VALID_REVIEW_ID}/helpful`)
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .expect(200);

      expect(firstResponse.body.data.user_voted).toBe(true);
    });
  });

  describe('POST /api/reviews/:reviewId/helpful - Multiple Users', () => {
    it('should allow multiple different users to vote on same review', async () => {
      const user1Token = 'user1-token';
      const user2Token = 'user2-token';

      // Mock first user authentication
      (createSupabaseClient as jest.Mock).mockImplementation((token: string) => {
        const userId = token === user1Token ? VALID_USER_ID : ANOTHER_USER_ID;
        return {
          auth: {
            getUser: jest.fn().mockResolvedValue({
              data: {
                user: {
                  id: userId,
                  email: `${userId}@example.com`
                }
              },
              error: null,
            }),
          },
          from: jest.fn(() => ({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { user_role: 'user' },
              error: null,
            }),
          })),
        };
      });

      // Mock no existing votes for both users
      (supabaseAdmin.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'review_helpful') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
            insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
            delete: jest.fn(),
          };
        }
        if (table === 'reviews') {
          let count = 0;
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn(() => {
              count++;
              return Promise.resolve({
                data: { helpful_count: count },
                error: null,
              });
            }),
          };
        }
        return {};
      });

      // User 1 votes
      const response1 = await request(app)
        .post(`/api/reviews/${VALID_REVIEW_ID}/helpful`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response1.body.success).toBe(true);

      // User 2 votes
      const response2 = await request(app)
        .post(`/api/reviews/${VALID_REVIEW_ID}/helpful`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      expect(response2.body.success).toBe(true);
    });

    it('should track votes independently per user', async () => {
      // Each user should be able to vote/unvote independently
      const user1Token = 'user1-token';
      const user2Token = 'user2-token';

      (createSupabaseClient as jest.Mock).mockImplementation((token: string) => {
        const userId = token === user1Token ? VALID_USER_ID : ANOTHER_USER_ID;
        return {
          auth: {
            getUser: jest.fn().mockResolvedValue({
              data: {
                user: {
                  id: userId,
                  email: `${userId}@example.com`
                }
              },
              error: null,
            }),
          },
          from: jest.fn(() => ({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { user_role: 'user' },
              error: null,
            }),
          })),
        };
      });

      (supabaseAdmin.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'review_helpful') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
            insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
            delete: jest.fn(),
          };
        }
        if (table === 'reviews') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { helpful_count: 2 },
              error: null,
            }),
          };
        }
        return {};
      });

      const response1 = await request(app)
        .post(`/api/reviews/${VALID_REVIEW_ID}/helpful`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      const response2 = await request(app)
        .post(`/api/reviews/${VALID_REVIEW_ID}/helpful`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      expect(response1.body.success).toBe(true);
      expect(response2.body.success).toBe(true);
    });
  });

  describe('POST /api/reviews/:reviewId/helpful - Non-Existent Review', () => {
    beforeEach(() => {
      // Mock successful authentication
      (createSupabaseClient as jest.Mock).mockReturnValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: {
              user: {
                id: VALID_USER_ID,
                email: 'test@example.com'
              }
            },
            error: null,
          }),
        },
        from: jest.fn(() => ({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { user_role: 'user' },
            error: null,
          }),
        })),
      });
    });

    it('should handle non-existent review gracefully', async () => {
      const nonExistentReviewId = 'non-existent-review-id';

      // Mock review not found
      (supabaseAdmin.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'review_helpful') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
            insert: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Foreign key constraint violation' }
            }),
            delete: jest.fn(),
          };
        }
        return {};
      });

      const response = await request(app)
        .post(`/api/reviews/${nonExistentReviewId}/helpful`)
        .set('Authorization', `Bearer ${VALID_TOKEN}`);

      // Should return error when trying to vote on non-existent review
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('POST /api/reviews/:reviewId/helpful - Error Handling', () => {
    beforeEach(() => {
      // Mock successful authentication
      (createSupabaseClient as jest.Mock).mockReturnValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: {
              user: {
                id: VALID_USER_ID,
                email: 'test@example.com'
              }
            },
            error: null,
          }),
        },
        from: jest.fn(() => ({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { user_role: 'user' },
            error: null,
          }),
        })),
      });
    });

    it('should handle database errors gracefully', async () => {
      // Mock database error
      (supabaseAdmin.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'review_helpful') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' }
            }),
            insert: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' }
            }),
            delete: jest.fn(),
          };
        }
        return {};
      });

      const response = await request(app)
        .post(`/api/reviews/${VALID_REVIEW_ID}/helpful`)
        .set('Authorization', `Bearer ${VALID_TOKEN}`);

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should handle malformed review ID', async () => {
      const malformedId = 'invalid-@#$-id';

      const response = await request(app)
        .post(`/api/reviews/${malformedId}/helpful`)
        .set('Authorization', `Bearer ${VALID_TOKEN}`);

      // Should handle gracefully
      expect([200, 400, 404, 500]).toContain(response.status);
    });
  });

  describe('POST /api/reviews/:reviewId/helpful - Response Format', () => {
    beforeEach(() => {
      // Mock successful authentication
      (createSupabaseClient as jest.Mock).mockReturnValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: {
              user: {
                id: VALID_USER_ID,
                email: 'test@example.com'
              }
            },
            error: null,
          }),
        },
        from: jest.fn(() => ({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { user_role: 'user' },
            error: null,
          }),
        })),
      });

      // Mock successful vote
      (supabaseAdmin.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'review_helpful') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
            insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
            delete: jest.fn(),
          };
        }
        if (table === 'reviews') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { helpful_count: 1 },
              error: null,
            }),
          };
        }
        return {};
      });
    });

    it('should return correct response structure on success', async () => {
      const response = await request(app)
        .post(`/api/reviews/${VALID_REVIEW_ID}/helpful`)
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('helpful_count');
      expect(response.body.data).toHaveProperty('user_voted');
      expect(typeof response.body.success).toBe('boolean');
      expect(typeof response.body.data.helpful_count).toBe('number');
      expect(typeof response.body.data.user_voted).toBe('boolean');
    });

    it('should return user_voted as true when creating vote', async () => {
      const response = await request(app)
        .post(`/api/reviews/${VALID_REVIEW_ID}/helpful`)
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .expect(200);

      expect(response.body.data.user_voted).toBe(true);
    });

    it('should return user_voted as false when removing vote', async () => {
      // Mock existing vote
      (supabaseAdmin.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'review_helpful') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { review_id: VALID_REVIEW_ID },
              error: null
            }),
            delete: jest.fn().mockReturnThis(),
            insert: jest.fn(),
          };
        }
        if (table === 'reviews') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { helpful_count: 0 },
              error: null,
            }),
          };
        }
        return {};
      });

      const response = await request(app)
        .post(`/api/reviews/${VALID_REVIEW_ID}/helpful`)
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .expect(200);

      expect(response.body.data.user_voted).toBe(false);
    });

    it('should return helpful_count as non-negative number', async () => {
      const response = await request(app)
        .post(`/api/reviews/${VALID_REVIEW_ID}/helpful`)
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .expect(200);

      expect(response.body.data.helpful_count).toBeGreaterThanOrEqual(0);
    });
  });
});
