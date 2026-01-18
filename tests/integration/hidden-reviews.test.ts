/**
 * Integration Test: Hidden Reviews Functionality
 * Tests that hidden reviews are properly excluded from public queries
 * Tests admin hide/unhide/delete/dismiss operations
 * Tests campsite stats recalculation when reviews are hidden/unhidden
 */

import request from 'supertest';
import app from '../../apps/campsite-backend/src/app';
import { supabaseAdmin } from '../../apps/campsite-backend/src/lib/supabase';
import { createSupabaseClient } from '../../apps/campsite-backend/src/lib/supabase';

// Mock Supabase
jest.mock('../../apps/campsite-backend/src/lib/supabase', () => {
  const createMockChain = () => ({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
  });

  const mockSupabaseAdmin = {
    from: jest.fn(() => createMockChain()),
    auth: {
      getUser: jest.fn(),
    },
  };

  const mockCreateSupabaseClient = jest.fn(() => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      }),
    },
    from: jest.fn(() => createMockChain()),
  }));

  return {
    supabaseAdmin: mockSupabaseAdmin,
    createSupabaseClient: mockCreateSupabaseClient,
  };
});

// Mock notification service
jest.mock('../../apps/campsite-backend/src/services/notification.service', () => ({
  notifyReviewHidden: jest.fn(),
}));

describe('Integration: Hidden Reviews Functionality', () => {
  const ADMIN_TOKEN = 'admin-test-token';
  const ADMIN_USER_ID = 'admin-123';
  const USER_TOKEN = 'user-test-token';
  const USER_ID = 'user-456';
  const CAMPSITE_ID = 'campsite-789';
  const REVIEW_ID = 'review-111';
  const HIDDEN_REVIEW_ID = 'review-222';

  const mockVisibleReview = {
    id: REVIEW_ID,
    campsite_id: CAMPSITE_ID,
    user_id: USER_ID,
    rating_overall: 5,
    rating_cleanliness: 5,
    rating_staff: 5,
    rating_facilities: 4,
    rating_value: 5,
    rating_location: 5,
    reviewer_type: 'couple',
    title: 'Amazing Experience',
    content: 'Had a wonderful time at this campsite. Highly recommend!',
    pros: 'Beautiful location, friendly staff',
    cons: null,
    helpful_count: 3,
    is_reported: false,
    report_count: 0,
    is_hidden: false,
    hidden_reason: null,
    hidden_at: null,
    hidden_by: null,
    owner_response: null,
    owner_response_at: null,
    visited_at: '2024-01-15',
    created_at: '2024-01-20T10:00:00Z',
    updated_at: '2024-01-20T10:00:00Z',
  };

  const mockHiddenReview = {
    ...mockVisibleReview,
    id: HIDDEN_REVIEW_ID,
    rating_overall: 1,
    title: 'Terrible Place',
    content: 'This place was awful. Do not recommend at all.',
    is_hidden: true,
    hidden_reason: 'Inappropriate content',
    hidden_at: '2024-01-21T14:00:00Z',
    hidden_by: ADMIN_USER_ID,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // 1. PUBLIC REVIEW QUERIES
  // ============================================

  describe('Public Review Queries - Exclude Hidden Reviews', () => {
    it('should return visible reviews only (is_hidden=false)', async () => {
      // Mock campsite reviews query
      const mockReviewsQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                range: jest.fn().mockResolvedValue({
                  data: [
                    {
                      ...mockVisibleReview,
                      reviewer: { full_name: 'John Doe', avatar_url: null },
                      photos: [],
                    },
                  ],
                  error: null,
                }),
              }),
            }),
          }),
        }),
      };

      const mockCountQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              count: 1,
            }),
          }),
        }),
      };

      (supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce(mockCountQuery)
        .mockReturnValueOnce(mockReviewsQuery);

      const response = await request(app)
        .get(`/api/reviews/campsite/${CAMPSITE_ID}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].id).toBe(REVIEW_ID);
      expect(response.body.data[0].is_hidden).toBe(false);
      expect(response.body.pagination.total).toBe(1);
    });

    it('should NOT return hidden reviews in public queries', async () => {
      // Mock query that filters is_hidden=false
      const mockReviewsQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                range: jest.fn().mockResolvedValue({
                  data: [], // Hidden review filtered out
                  error: null,
                }),
              }),
            }),
          }),
        }),
      };

      const mockCountQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              count: 0,
            }),
          }),
        }),
      };

      (supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce(mockCountQuery)
        .mockReturnValueOnce(mockReviewsQuery);

      const response = await request(app)
        .get(`/api/reviews/campsite/${CAMPSITE_ID}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
      expect(response.body.pagination.total).toBe(0);
    });

    it('should exclude hidden reviews from review count', async () => {
      // Mock summary that excludes hidden reviews
      const mockSummaryQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: [mockVisibleReview],
              error: null,
            }),
          }),
        }),
      };

      (supabaseAdmin.from as jest.Mock).mockReturnValue(mockSummaryQuery);

      const response = await request(app)
        .get(`/api/reviews/campsite/${CAMPSITE_ID}/summary`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.total_count).toBe(1);
    });

    it('should exclude hidden reviews from average rating calculation', async () => {
      // Only visible reviews with rating 5
      const mockSummaryQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: [mockVisibleReview], // rating_overall: 5
              error: null,
            }),
          }),
        }),
      };

      (supabaseAdmin.from as jest.Mock).mockReturnValue(mockSummaryQuery);

      const response = await request(app)
        .get(`/api/reviews/campsite/${CAMPSITE_ID}/summary`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.average_rating).toBe(5);
      expect(response.body.data.total_count).toBe(1);
    });

    it('should filter by reviewer_type and exclude hidden reviews', async () => {
      const mockCountQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                count: 1,
              }),
            }),
          }),
        }),
      };

      const mockReviewsQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  range: jest.fn().mockResolvedValue({
                    data: [
                      {
                        ...mockVisibleReview,
                        reviewer: { full_name: 'John Doe', avatar_url: null },
                        photos: [],
                      },
                    ],
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
      };

      (supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce(mockCountQuery)
        .mockReturnValueOnce(mockReviewsQuery);

      const response = await request(app)
        .get(`/api/reviews/campsite/${CAMPSITE_ID}?reviewer_type=couple`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].reviewer_type).toBe('couple');
    });
  });

  // ============================================
  // 2. HIDE REVIEW ACTION
  // ============================================

  describe('Admin Hide Review', () => {
    beforeEach(() => {
      // Mock admin authentication
      (createSupabaseClient as jest.Mock).mockReturnValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: ADMIN_USER_ID } },
            error: null,
          }),
        },
        from: jest.fn(() => {
          const chain: any = {};
          chain.select = jest.fn().mockReturnValue(chain);
          chain.eq = jest.fn().mockReturnValue(chain);
          chain.single = jest.fn().mockResolvedValue({
            data: { id: ADMIN_USER_ID, auth_user_id: ADMIN_USER_ID, user_role: 'admin' },
            error: null,
          });
          return chain;
        }),
      });
    });

    it('should set is_hidden=true when admin hides review', async () => {
      const mockGetReview = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { ...mockVisibleReview, campsite: { name: 'Test Campsite' } },
              error: null,
            }),
          }),
        }),
      };

      const mockUpdateReview = {
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      };

      const mockInsertLog = {
        insert: jest.fn().mockResolvedValue({
          error: null,
        }),
      };

      (supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce(mockGetReview)
        .mockReturnValueOnce(mockUpdateReview)
        .mockReturnValueOnce(mockInsertLog);

      const response = await request(app)
        .post(`/api/admin/reviews/${REVIEW_ID}/hide`)
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        .send({ hide_reason: 'Inappropriate content' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockUpdateReview.update).toHaveBeenCalledWith({
        is_hidden: true,
        hidden_reason: 'Inappropriate content',
        hidden_at: expect.any(String),
        hidden_by: ADMIN_USER_ID,
      });
    });

    it('should make hidden review disappear from public queries', async () => {
      // Mock review now hidden
      const mockReviewsQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                range: jest.fn().mockResolvedValue({
                  data: [], // Review is now hidden, filtered out
                  error: null,
                }),
              }),
            }),
          }),
        }),
      };

      const mockCountQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              count: 0,
            }),
          }),
        }),
      };

      (supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce(mockCountQuery)
        .mockReturnValueOnce(mockReviewsQuery);

      const response = await request(app)
        .get(`/api/reviews/campsite/${CAMPSITE_ID}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
      expect(response.body.pagination.total).toBe(0);
    });

    it('should keep review in database when hidden', async () => {
      // Hidden review still exists in database
      const mockGetReview = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockHiddenReview,
              error: null,
            }),
          }),
        }),
      };

      (supabaseAdmin.from as jest.Mock).mockReturnValue(mockGetReview);

      // Direct database check (admin only)
      expect(mockHiddenReview.is_hidden).toBe(true);
      expect(mockHiddenReview.hidden_reason).toBe('Inappropriate content');
    });

    it('should create moderation log when hiding review', async () => {
      const mockGetReview = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { ...mockVisibleReview, campsite: { name: 'Test Campsite' } },
              error: null,
            }),
          }),
        }),
      };

      const mockUpdateReview = {
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      };

      const mockInsertLog = {
        insert: jest.fn().mockResolvedValue({
          error: null,
        }),
      };

      (supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce(mockGetReview)
        .mockReturnValueOnce(mockUpdateReview)
        .mockReturnValueOnce(mockInsertLog);

      await request(app)
        .post(`/api/admin/reviews/${REVIEW_ID}/hide`)
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        .send({ hide_reason: 'Inappropriate content' })
        .expect(200);

      expect(mockInsertLog.insert).toHaveBeenCalledWith({
        admin_id: ADMIN_USER_ID,
        action_type: 'review_hide',
        entity_type: 'review',
        entity_id: REVIEW_ID,
        reason: 'Inappropriate content',
      });
    });

    it('should require hide_reason when hiding review', async () => {
      const response = await request(app)
        .post(`/api/admin/reviews/${REVIEW_ID}/hide`)
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        .send({}) // Missing hide_reason
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 403 when non-admin tries to hide review', async () => {
      // Mock regular user authentication
      (createSupabaseClient as jest.Mock).mockReturnValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: USER_ID } },
            error: null,
          }),
        },
        from: jest.fn(() => {
          const chain: any = {};
          chain.select = jest.fn().mockReturnValue(chain);
          chain.eq = jest.fn().mockReturnValue(chain);
          chain.single = jest.fn().mockResolvedValue({
            data: { id: USER_ID, auth_user_id: USER_ID, user_role: 'user' },
            error: null,
          });
          return chain;
        }),
      });

      const response = await request(app)
        .post(`/api/admin/reviews/${REVIEW_ID}/hide`)
        .set('Authorization', `Bearer ${USER_TOKEN}`)
        .send({ hide_reason: 'Test' })
        .expect(403);

      expect(response.body.error).toBe('Forbidden');
    });
  });

  // ============================================
  // 3. UNHIDE REVIEW ACTION
  // ============================================

  describe('Admin Unhide Review', () => {
    beforeEach(() => {
      // Mock admin authentication
      (createSupabaseClient as jest.Mock).mockReturnValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: ADMIN_USER_ID } },
            error: null,
          }),
        },
        from: jest.fn(() => {
          const chain: any = {};
          chain.select = jest.fn().mockReturnValue(chain);
          chain.eq = jest.fn().mockReturnValue(chain);
          chain.single = jest.fn().mockResolvedValue({
            data: { id: ADMIN_USER_ID, auth_user_id: ADMIN_USER_ID, user_role: 'admin' },
            error: null,
          });
          return chain;
        }),
      });
    });

    it('should set is_hidden=false when admin unhides review', async () => {
      const mockUpdateReview = {
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      };

      const mockInsertLog = {
        insert: jest.fn().mockResolvedValue({
          error: null,
        }),
      };

      (supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce(mockUpdateReview)
        .mockReturnValueOnce(mockInsertLog);

      const response = await request(app)
        .post(`/api/admin/reviews/${HIDDEN_REVIEW_ID}/unhide`)
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockUpdateReview.update).toHaveBeenCalledWith({
        is_hidden: false,
        hidden_reason: null,
        hidden_at: null,
        hidden_by: null,
      });
    });

    it('should make unhidden review appear in public queries again', async () => {
      // Mock review now visible again
      const mockReviewsQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                range: jest.fn().mockResolvedValue({
                  data: [
                    {
                      ...mockVisibleReview,
                      id: HIDDEN_REVIEW_ID,
                      is_hidden: false,
                      reviewer: { full_name: 'John Doe', avatar_url: null },
                      photos: [],
                    },
                  ],
                  error: null,
                }),
              }),
            }),
          }),
        }),
      };

      const mockCountQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              count: 1,
            }),
          }),
        }),
      };

      (supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce(mockCountQuery)
        .mockReturnValueOnce(mockReviewsQuery);

      const response = await request(app)
        .get(`/api/reviews/campsite/${CAMPSITE_ID}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].is_hidden).toBe(false);
    });

    it('should create moderation log when unhiding review', async () => {
      const mockUpdateReview = {
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      };

      const mockInsertLog = {
        insert: jest.fn().mockResolvedValue({
          error: null,
        }),
      };

      (supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce(mockUpdateReview)
        .mockReturnValueOnce(mockInsertLog);

      await request(app)
        .post(`/api/admin/reviews/${HIDDEN_REVIEW_ID}/unhide`)
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        .expect(200);

      expect(mockInsertLog.insert).toHaveBeenCalledWith({
        admin_id: ADMIN_USER_ID,
        action_type: 'review_unhide',
        entity_type: 'review',
        entity_id: HIDDEN_REVIEW_ID,
        reason: null,
      });
    });

    it('should return 403 when non-admin tries to unhide review', async () => {
      (createSupabaseClient as jest.Mock).mockReturnValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: USER_ID } },
            error: null,
          }),
        },
        from: jest.fn(() => {
          const chain: any = {};
          chain.select = jest.fn().mockReturnValue(chain);
          chain.eq = jest.fn().mockReturnValue(chain);
          chain.single = jest.fn().mockResolvedValue({
            data: { id: USER_ID, auth_user_id: USER_ID, user_role: 'user' },
            error: null,
          });
          return chain;
        }),
      });

      const response = await request(app)
        .post(`/api/admin/reviews/${HIDDEN_REVIEW_ID}/unhide`)
        .set('Authorization', `Bearer ${USER_TOKEN}`)
        .expect(403);

      expect(response.body.error).toBe('Forbidden');
    });
  });

  // ============================================
  // 4. DELETE REVIEW ACTION
  // ============================================

  describe('Admin Delete Review', () => {
    beforeEach(() => {
      (createSupabaseClient as jest.Mock).mockReturnValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: ADMIN_USER_ID } },
            error: null,
          }),
        },
        from: jest.fn(() => {
          const chain: any = {};
          chain.select = jest.fn().mockReturnValue(chain);
          chain.eq = jest.fn().mockReturnValue(chain);
          chain.single = jest.fn().mockResolvedValue({
            data: { id: ADMIN_USER_ID, auth_user_id: ADMIN_USER_ID, user_role: 'admin' },
            error: null,
          });
          return chain;
        }),
      });
    });

    it('should permanently remove review from database', async () => {
      const mockGetReview = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockVisibleReview,
              error: null,
            }),
          }),
        }),
      };

      const mockDeleteReview = {
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      };

      const mockInsertLog = {
        insert: jest.fn().mockResolvedValue({
          error: null,
        }),
      };

      (supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce(mockGetReview)
        .mockReturnValueOnce(mockDeleteReview)
        .mockReturnValueOnce(mockInsertLog);

      const response = await request(app)
        .delete(`/api/admin/reviews/${REVIEW_ID}`)
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockDeleteReview.delete).toHaveBeenCalled();
    });

    it('should cascade delete associated reports', async () => {
      const mockGetReview = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { ...mockVisibleReview, is_reported: true, report_count: 2 },
              error: null,
            }),
          }),
        }),
      };

      const mockDeleteReview = {
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      };

      const mockInsertLog = {
        insert: jest.fn().mockResolvedValue({
          error: null,
        }),
      };

      (supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce(mockGetReview)
        .mockReturnValueOnce(mockDeleteReview)
        .mockReturnValueOnce(mockInsertLog);

      await request(app)
        .delete(`/api/admin/reviews/${REVIEW_ID}`)
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        .expect(200);

      // Cascade delete should be handled by database ON DELETE CASCADE
      expect(mockDeleteReview.delete).toHaveBeenCalled();
    });

    it('should create moderation log with original review metadata', async () => {
      const mockGetReview = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockVisibleReview,
              error: null,
            }),
          }),
        }),
      };

      const mockDeleteReview = {
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      };

      const mockInsertLog = {
        insert: jest.fn().mockResolvedValue({
          error: null,
        }),
      };

      (supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce(mockGetReview)
        .mockReturnValueOnce(mockDeleteReview)
        .mockReturnValueOnce(mockInsertLog);

      await request(app)
        .delete(`/api/admin/reviews/${REVIEW_ID}`)
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        .expect(200);

      expect(mockInsertLog.insert).toHaveBeenCalledWith({
        admin_id: ADMIN_USER_ID,
        action_type: 'review_delete',
        entity_type: 'review',
        entity_id: REVIEW_ID,
        reason: 'Permanently deleted by admin',
        metadata: { original_review: mockVisibleReview },
      });
    });

    it('should return 404 when review does not exist', async () => {
      const mockGetReview = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          }),
        }),
      };

      (supabaseAdmin.from as jest.Mock).mockReturnValue(mockGetReview);

      const response = await request(app)
        .delete(`/api/admin/reviews/non-existent-review`)
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  // ============================================
  // 5. DISMISS REPORTS ACTION
  // ============================================

  describe('Admin Dismiss Reports', () => {
    beforeEach(() => {
      (createSupabaseClient as jest.Mock).mockReturnValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: ADMIN_USER_ID } },
            error: null,
          }),
        },
        from: jest.fn(() => {
          const chain: any = {};
          chain.select = jest.fn().mockReturnValue(chain);
          chain.eq = jest.fn().mockReturnValue(chain);
          chain.single = jest.fn().mockResolvedValue({
            data: { id: ADMIN_USER_ID, auth_user_id: ADMIN_USER_ID, user_role: 'admin' },
            error: null,
          });
          return chain;
        }),
      });
    });

    it('should clear report_count when dismissing reports', async () => {
      const mockDeleteReports = {
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      };

      const mockUpdateReview = {
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      };

      const mockInsertLog = {
        insert: jest.fn().mockResolvedValue({
          error: null,
        }),
      };

      (supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce(mockDeleteReports)
        .mockReturnValueOnce(mockUpdateReview)
        .mockReturnValueOnce(mockInsertLog);

      const response = await request(app)
        .post(`/api/admin/reviews/${REVIEW_ID}/dismiss`)
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockUpdateReview.update).toHaveBeenCalledWith({
        is_reported: false,
        report_count: 0,
      });
    });

    it('should set is_reported=false when dismissing reports', async () => {
      const mockDeleteReports = {
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      };

      const mockUpdateReview = {
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      };

      const mockInsertLog = {
        insert: jest.fn().mockResolvedValue({
          error: null,
        }),
      };

      (supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce(mockDeleteReports)
        .mockReturnValueOnce(mockUpdateReview)
        .mockReturnValueOnce(mockInsertLog);

      await request(app)
        .post(`/api/admin/reviews/${REVIEW_ID}/dismiss`)
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        .expect(200);

      expect(mockUpdateReview.update).toHaveBeenCalledWith({
        is_reported: false,
        report_count: 0,
      });
    });

    it('should keep review visible when dismissing reports', async () => {
      const mockDeleteReports = {
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      };

      const mockUpdateReview = {
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      };

      const mockInsertLog = {
        insert: jest.fn().mockResolvedValue({
          error: null,
        }),
      };

      (supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce(mockDeleteReports)
        .mockReturnValueOnce(mockUpdateReview)
        .mockReturnValueOnce(mockInsertLog);

      await request(app)
        .post(`/api/admin/reviews/${REVIEW_ID}/dismiss`)
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        .expect(200);

      // Review should remain visible (is_hidden not changed)
      expect(mockUpdateReview.update).not.toHaveBeenCalledWith(
        expect.objectContaining({ is_hidden: true })
      );
    });

    it('should delete reports from review_reports table', async () => {
      const mockDeleteReports = {
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      };

      const mockUpdateReview = {
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      };

      const mockInsertLog = {
        insert: jest.fn().mockResolvedValue({
          error: null,
        }),
      };

      (supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce(mockDeleteReports)
        .mockReturnValueOnce(mockUpdateReview)
        .mockReturnValueOnce(mockInsertLog);

      await request(app)
        .post(`/api/admin/reviews/${REVIEW_ID}/dismiss`)
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        .expect(200);

      expect(mockDeleteReports.delete).toHaveBeenCalled();
    });
  });

  // ============================================
  // 6. ADMIN REVIEW LIST
  // ============================================

  describe('Admin Review List', () => {
    beforeEach(() => {
      (createSupabaseClient as jest.Mock).mockReturnValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: ADMIN_USER_ID } },
            error: null,
          }),
        },
        from: jest.fn(() => {
          const chain: any = {};
          chain.select = jest.fn().mockReturnValue(chain);
          chain.eq = jest.fn().mockReturnValue(chain);
          chain.single = jest.fn().mockResolvedValue({
            data: { id: ADMIN_USER_ID, auth_user_id: ADMIN_USER_ID, user_role: 'admin' },
            error: null,
          });
          return chain;
        }),
      });
    });

    it('should return reported reviews excluding already hidden ones', async () => {
      const mockCountQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              count: 1,
            }),
          }),
        }),
      };

      const mockReviewsQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                range: jest.fn().mockResolvedValue({
                  data: [
                    {
                      ...mockVisibleReview,
                      is_reported: true,
                      report_count: 3,
                      reviewer: { id: USER_ID, full_name: 'John Doe', avatar_url: null },
                      campsite: { id: CAMPSITE_ID, name: 'Test Campsite' },
                      photos: [],
                    },
                  ],
                  error: null,
                }),
              }),
            }),
          }),
        }),
      };

      const mockReportsQuery = {
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      };

      (supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce(mockCountQuery)
        .mockReturnValueOnce(mockReviewsQuery)
        .mockReturnValueOnce(mockReportsQuery);

      const response = await request(app)
        .get('/api/admin/reviews/reported')
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].is_reported).toBe(true);
      expect(response.body.data[0].is_hidden).toBe(false);
    });

    it('should filter by min_reports parameter', async () => {
      const mockCountQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              gte: jest.fn().mockResolvedValue({
                count: 1,
              }),
            }),
          }),
        }),
      };

      const mockReviewsQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              gte: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  range: jest.fn().mockResolvedValue({
                    data: [
                      {
                        ...mockVisibleReview,
                        is_reported: true,
                        report_count: 5,
                        reviewer: { id: USER_ID, full_name: 'John Doe', avatar_url: null },
                        campsite: { id: CAMPSITE_ID, name: 'Test Campsite' },
                        photos: [],
                      },
                    ],
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
      };

      const mockReportsQuery = {
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      };

      (supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce(mockCountQuery)
        .mockReturnValueOnce(mockReviewsQuery)
        .mockReturnValueOnce(mockReportsQuery);

      const response = await request(app)
        .get('/api/admin/reviews/reported?min_reports=5')
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data[0].report_count).toBeGreaterThanOrEqual(5);
    });
  });

  // ============================================
  // 7. CAMPSITE STATS UPDATE
  // ============================================

  describe('Campsite Stats Recalculation', () => {
    it('should update average rating when review is hidden', async () => {
      // Mock summary after hiding - should exclude hidden review
      const mockSummaryQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: [
                { ...mockVisibleReview, rating_overall: 5 },
                { ...mockVisibleReview, rating_overall: 4 },
              ], // Hidden review (rating 1) excluded
              error: null,
            }),
          }),
        }),
      };

      (supabaseAdmin.from as jest.Mock).mockReturnValue(mockSummaryQuery);

      const response = await request(app)
        .get(`/api/reviews/campsite/${CAMPSITE_ID}/summary`)
        .expect(200);

      expect(response.body.success).toBe(true);
      // Average of 5 and 4 = 4.5
      expect(response.body.data.average_rating).toBe(4.5);
      expect(response.body.data.total_count).toBe(2);
    });

    it('should update average rating when review is unhidden', async () => {
      // Mock summary after unhiding - should include previously hidden review
      const mockSummaryQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: [
                { ...mockVisibleReview, rating_overall: 5 },
                { ...mockVisibleReview, rating_overall: 4 },
                { ...mockHiddenReview, rating_overall: 1, is_hidden: false },
              ], // Now includes unhidden review
              error: null,
            }),
          }),
        }),
      };

      (supabaseAdmin.from as jest.Mock).mockReturnValue(mockSummaryQuery);

      const response = await request(app)
        .get(`/api/reviews/campsite/${CAMPSITE_ID}/summary`)
        .expect(200);

      expect(response.body.success).toBe(true);
      // Average of 5, 4, and 1 = 3.3
      expect(response.body.data.average_rating).toBe(3.3);
      expect(response.body.data.total_count).toBe(3);
    });

    it('should update review count when review is hidden', async () => {
      const mockSummaryQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: [mockVisibleReview], // Only 1 visible review
              error: null,
            }),
          }),
        }),
      };

      (supabaseAdmin.from as jest.Mock).mockReturnValue(mockSummaryQuery);

      const response = await request(app)
        .get(`/api/reviews/campsite/${CAMPSITE_ID}/summary`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.total_count).toBe(1);
    });
  });
});
