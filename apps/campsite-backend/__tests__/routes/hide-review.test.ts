import request from 'supertest';
import app from '../../src/app';
import { supabaseAdmin } from '../../src/lib/supabase';
import * as reviewService from '../../src/services/reviewService';
import * as notificationService from '../../src/services/notification.service';

// Mock Supabase
const mockGetUser = jest.fn();
const mockFrom = jest.fn();
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockSingle = jest.fn();
const mockUpdate = jest.fn();
const mockInsert = jest.fn();

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

// Mock review service
jest.mock('../../src/services/reviewService', () => ({
  hideReview: jest.fn(),
  unhideReview: jest.fn(),
}));

// Mock notification service
jest.mock('../../src/services/notification.service', () => ({
  notifyReviewHidden: jest.fn(),
}));

// Mock logger
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

describe('POST /api/admin/reviews/:id/hide', () => {
  const mockAdminId = '11111111-1111-1111-1111-111111111111';
  const mockUserId = '22222222-2222-2222-2222-222222222222';
  const mockReviewId = 'review-123';
  const mockCampsiteId = 'campsite-456';
  const mockToken = 'mock-jwt-token';

  const mockReview = {
    id: mockReviewId,
    user_id: mockUserId,
    campsite_id: mockCampsiteId,
    rating_overall: 4,
    title: 'Great campsite',
    content: 'Had a wonderful time',
    is_hidden: false,
    campsite: {
      name: 'Test Campsite',
    },
  };

  const mockReportedReview = {
    ...mockReview,
    is_reported: true,
    report_count: 3,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper to mock authentication
  const mockAuth = (userId: string, userRole: 'admin' | 'owner' | 'user') => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: userId, email: 'test@test.com' } },
      error: null,
    });

    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { user_role: userRole },
            error: null,
          }),
        }),
      }),
    });
  };

  describe('Authentication/Authorization', () => {
    it('should return 401 when no token is provided', async () => {
      const response = await request(app)
        .post(`/api/admin/reviews/${mockReviewId}/hide`)
        .send({ hide_reason: 'Inappropriate content' });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('No authentication token provided');
    });

    it('should return 401 when invalid token is provided', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Invalid token'),
      });

      const response = await request(app)
        .post(`/api/admin/reviews/${mockReviewId}/hide`)
        .set('Authorization', `Bearer invalid-token`)
        .send({ hide_reason: 'Inappropriate content' });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 403 for non-admin users (regular user)', async () => {
      mockAuth(mockUserId, 'user');

      const response = await request(app)
        .post(`/api/admin/reviews/${mockReviewId}/hide`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ hide_reason: 'Inappropriate content' });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 403 for non-admin users (owner role)', async () => {
      mockAuth(mockUserId, 'owner');

      const response = await request(app)
        .post(`/api/admin/reviews/${mockReviewId}/hide`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ hide_reason: 'Inappropriate content' });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 200 for admin users', async () => {
      mockAuth(mockAdminId, 'admin');

      (supabaseAdmin.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'reviews') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockReview,
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'moderation_logs') {
          return {
            insert: jest.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        return {};
      });

      (reviewService.hideReview as jest.Mock).mockResolvedValue({ success: true });

      const response = await request(app)
        .post(`/api/admin/reviews/${mockReviewId}/hide`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ hide_reason: 'Inappropriate content' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Validation Tests', () => {
    beforeEach(() => {
      mockAuth(mockAdminId, 'admin');
    });

    it('should return 400 when hide_reason is missing', async () => {
      const response = await request(app)
        .post(`/api/admin/reviews/${mockReviewId}/hide`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 when hide_reason is less than 5 chars', async () => {
      const response = await request(app)
        .post(`/api/admin/reviews/${mockReviewId}/hide`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ hide_reason: 'bad' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 when hide_reason is exactly 4 chars', async () => {
      const response = await request(app)
        .post(`/api/admin/reviews/${mockReviewId}/hide`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ hide_reason: 'spam' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 when hide_reason is greater than 500 chars', async () => {
      const longReason = 'a'.repeat(501);
      const response = await request(app)
        .post(`/api/admin/reviews/${mockReviewId}/hide`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ hide_reason: longReason });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('error');
    });

    it('should accept valid hide_reason (exactly 5 chars)', async () => {
      (supabaseAdmin.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'reviews') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockReview,
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'moderation_logs') {
          return {
            insert: jest.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        return {};
      });

      (reviewService.hideReview as jest.Mock).mockResolvedValue({ success: true });

      const response = await request(app)
        .post(`/api/admin/reviews/${mockReviewId}/hide`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ hide_reason: 'valid' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should accept valid hide_reason (exactly 500 chars)', async () => {
      const validReason = 'a'.repeat(500);

      (supabaseAdmin.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'reviews') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockReview,
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'moderation_logs') {
          return {
            insert: jest.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        return {};
      });

      (reviewService.hideReview as jest.Mock).mockResolvedValue({ success: true });

      const response = await request(app)
        .post(`/api/admin/reviews/${mockReviewId}/hide`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ hide_reason: validReason });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should accept valid hide_reason (normal length)', async () => {
      (supabaseAdmin.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'reviews') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockReview,
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'moderation_logs') {
          return {
            insert: jest.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        return {};
      });

      (reviewService.hideReview as jest.Mock).mockResolvedValue({ success: true });

      const response = await request(app)
        .post(`/api/admin/reviews/${mockReviewId}/hide`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ hide_reason: 'Contains inappropriate language' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Review Validation', () => {
    beforeEach(() => {
      mockAuth(mockAdminId, 'admin');
    });

    it('should return 404 for non-existent review ID', async () => {
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Not found' },
            }),
          }),
        }),
      });

      const response = await request(app)
        .post(`/api/admin/reviews/non-existent-id/hide`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ hide_reason: 'Inappropriate content' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });

    it('should can hide already-visible review', async () => {
      (supabaseAdmin.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'reviews') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { ...mockReview, is_hidden: false },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'moderation_logs') {
          return {
            insert: jest.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        return {};
      });

      (reviewService.hideReview as jest.Mock).mockResolvedValue({ success: true });

      const response = await request(app)
        .post(`/api/admin/reviews/${mockReviewId}/hide`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ hide_reason: 'Inappropriate content' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should can hide reported review', async () => {
      (supabaseAdmin.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'reviews') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockReportedReview,
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'moderation_logs') {
          return {
            insert: jest.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        return {};
      });

      (reviewService.hideReview as jest.Mock).mockResolvedValue({ success: true });

      const response = await request(app)
        .post(`/api/admin/reviews/${mockReviewId}/hide`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ hide_reason: 'Multiple reports received' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Hide Review Action', () => {
    beforeEach(() => {
      mockAuth(mockAdminId, 'admin');

      (supabaseAdmin.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'reviews') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockReview,
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'moderation_logs') {
          return {
            insert: jest.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        return {};
      });
    });

    it('should call hideReview service with correct params', async () => {
      (reviewService.hideReview as jest.Mock).mockResolvedValue({ success: true });

      await request(app)
        .post(`/api/admin/reviews/${mockReviewId}/hide`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ hide_reason: 'Inappropriate content' });

      expect(reviewService.hideReview).toHaveBeenCalledWith(
        mockReviewId,
        mockAdminId,
        'Inappropriate content'
      );
    });

    it('should call hideReview service with review ID', async () => {
      (reviewService.hideReview as jest.Mock).mockResolvedValue({ success: true });

      await request(app)
        .post(`/api/admin/reviews/${mockReviewId}/hide`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ hide_reason: 'Spam content' });

      expect(reviewService.hideReview).toHaveBeenCalledWith(
        expect.any(String),
        mockAdminId,
        'Spam content'
      );
      const callArgs = (reviewService.hideReview as jest.Mock).mock.calls[0];
      expect(callArgs[0]).toBe(mockReviewId);
    });

    it('should call hideReview service with admin ID', async () => {
      (reviewService.hideReview as jest.Mock).mockResolvedValue({ success: true });

      await request(app)
        .post(`/api/admin/reviews/${mockReviewId}/hide`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ hide_reason: 'Offensive language' });

      const callArgs = (reviewService.hideReview as jest.Mock).mock.calls[0];
      expect(callArgs[1]).toBe(mockAdminId);
    });

    it('should set is_hidden to true via service', async () => {
      (reviewService.hideReview as jest.Mock).mockResolvedValue({ success: true });

      await request(app)
        .post(`/api/admin/reviews/${mockReviewId}/hide`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ hide_reason: 'Policy violation' });

      expect(reviewService.hideReview).toHaveBeenCalled();
      // The service itself sets is_hidden to true
    });

    it('should return success response when service succeeds', async () => {
      (reviewService.hideReview as jest.Mock).mockResolvedValue({ success: true });

      const response = await request(app)
        .post(`/api/admin/reviews/${mockReviewId}/hide`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ hide_reason: 'Inappropriate content' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        review_id: mockReviewId,
        action: 'hide',
        message: 'Review hidden successfully',
      });
    });
  });

  describe('Moderation Log', () => {
    let mockInsert: jest.Mock;

    const setupModerationMocks = () => {
      mockInsert = jest.fn().mockResolvedValue({ data: null, error: null });

      (supabaseAdmin.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'reviews') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockReview,
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'moderation_logs') {
          return {
            insert: mockInsert,
          };
        }
        return {};
      });
    };

    beforeEach(() => {
      mockAuth(mockAdminId, 'admin');
      (reviewService.hideReview as jest.Mock).mockResolvedValue({ success: true });
      (notificationService.notifyReviewHidden as jest.Mock).mockResolvedValue(undefined);
      setupModerationMocks();
    });

    it('should create log entry with action_type=review_hide', async () => {
      await request(app)
        .post(`/api/admin/reviews/${mockReviewId}/hide`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ hide_reason: 'Inappropriate content' });

      expect(mockInsert).toHaveBeenCalledWith({
        admin_id: mockAdminId,
        action_type: 'review_hide',
        entity_type: 'review',
        entity_id: mockReviewId,
        reason: 'Inappropriate content',
      });
    });

    it('should create log entry with entity_type=review', async () => {
      const response = await request(app)
        .post(`/api/admin/reviews/${mockReviewId}/hide`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ hide_reason: 'Spam content detected' });

      expect(response.status).toBe(200);
      expect(mockInsert).toHaveBeenCalled();
      const callArgs = mockInsert.mock.calls[0][0];
      expect(callArgs.entity_type).toBe('review');
    });

    it('should create log entry with reason', async () => {
      const testReason = 'Contains hate speech';
      await request(app)
        .post(`/api/admin/reviews/${mockReviewId}/hide`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ hide_reason: testReason });

      const callArgs = mockInsert.mock.calls[0][0];
      expect(callArgs.reason).toBe(testReason);
    });

    it('should create log entry with admin_id', async () => {
      await request(app)
        .post(`/api/admin/reviews/${mockReviewId}/hide`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ hide_reason: 'Inappropriate' });

      const callArgs = mockInsert.mock.calls[0][0];
      expect(callArgs.admin_id).toBe(mockAdminId);
    });

    it('should create log entry with entity_id', async () => {
      await request(app)
        .post(`/api/admin/reviews/${mockReviewId}/hide`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ hide_reason: 'Inappropriate' });

      const callArgs = mockInsert.mock.calls[0][0];
      expect(callArgs.entity_id).toBe(mockReviewId);
    });
  });

  describe('Notification', () => {
    beforeEach(() => {
      mockAuth(mockAdminId, 'admin');
      (reviewService.hideReview as jest.Mock).mockResolvedValue({ success: true });

      (supabaseAdmin.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'reviews') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockReview,
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'moderation_logs') {
          return {
            insert: jest.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        return {};
      });
    });

    it('should call notifyReviewHidden', async () => {
      await request(app)
        .post(`/api/admin/reviews/${mockReviewId}/hide`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ hide_reason: 'Inappropriate content' });

      expect(notificationService.notifyReviewHidden).toHaveBeenCalled();
    });

    it('should pass correct user_id (review author)', async () => {
      await request(app)
        .post(`/api/admin/reviews/${mockReviewId}/hide`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ hide_reason: 'Inappropriate content' });

      expect(notificationService.notifyReviewHidden).toHaveBeenCalledWith(
        mockUserId,
        'Test Campsite',
        mockReviewId,
        'Inappropriate content'
      );
    });

    it('should pass campsite name', async () => {
      await request(app)
        .post(`/api/admin/reviews/${mockReviewId}/hide`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ hide_reason: 'Policy violation' });

      const callArgs = (notificationService.notifyReviewHidden as jest.Mock).mock.calls[0];
      expect(callArgs[1]).toBe('Test Campsite');
    });

    it('should pass hide_reason', async () => {
      const testReason = 'Contains false information';
      await request(app)
        .post(`/api/admin/reviews/${mockReviewId}/hide`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ hide_reason: testReason });

      const callArgs = (notificationService.notifyReviewHidden as jest.Mock).mock.calls[0];
      expect(callArgs[3]).toBe(testReason);
    });

    it('should pass review_id', async () => {
      await request(app)
        .post(`/api/admin/reviews/${mockReviewId}/hide`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ hide_reason: 'Inappropriate' });

      const callArgs = (notificationService.notifyReviewHidden as jest.Mock).mock.calls[0];
      expect(callArgs[2]).toBe(mockReviewId);
    });

    it('should handle missing campsite name gracefully', async () => {
      (supabaseAdmin.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'reviews') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { ...mockReview, campsite: null },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'moderation_logs') {
          return {
            insert: jest.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        return {};
      });

      await request(app)
        .post(`/api/admin/reviews/${mockReviewId}/hide`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ hide_reason: 'Inappropriate' });

      expect(notificationService.notifyReviewHidden).toHaveBeenCalledWith(
        mockUserId,
        'Unknown',
        mockReviewId,
        'Inappropriate'
      );
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      mockAuth(mockAdminId, 'admin');
    });

    it('should handle service errors', async () => {
      (supabaseAdmin.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'reviews') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockReview,
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      (reviewService.hideReview as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Database error',
      });

      const response = await request(app)
        .post(`/api/admin/reviews/${mockReviewId}/hide`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ hide_reason: 'Inappropriate content' });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Database error');
    });

    it('should return 500 on database errors', async () => {
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database connection failed' },
            }),
          }),
        }),
      });

      const response = await request(app)
        .post(`/api/admin/reviews/${mockReviewId}/hide`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ hide_reason: 'Inappropriate content' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should handle moderation log insert failure gracefully', async () => {
      (supabaseAdmin.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'reviews') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockReview,
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'moderation_logs') {
          return {
            insert: jest.fn().mockRejectedValue(new Error('Insert failed')),
          };
        }
        return {};
      });

      (reviewService.hideReview as jest.Mock).mockResolvedValue({ success: true });

      const response = await request(app)
        .post(`/api/admin/reviews/${mockReviewId}/hide`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ hide_reason: 'Inappropriate content' });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    it('should handle notification service failure gracefully', async () => {
      (supabaseAdmin.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'reviews') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockReview,
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'moderation_logs') {
          return {
            insert: jest.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        return {};
      });

      (reviewService.hideReview as jest.Mock).mockResolvedValue({ success: true });
      (notificationService.notifyReviewHidden as jest.Mock).mockRejectedValue(
        new Error('Notification failed')
      );

      const response = await request(app)
        .post(`/api/admin/reviews/${mockReviewId}/hide`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ hide_reason: 'Inappropriate content' });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    it('should handle unexpected errors', async () => {
      (supabaseAdmin.from as jest.Mock).mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const response = await request(app)
        .post(`/api/admin/reviews/${mockReviewId}/hide`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ hide_reason: 'Inappropriate content' });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to hide review');
    });
  });

  describe('Response Format', () => {
    const setupMocks = () => {
      (supabaseAdmin.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'reviews') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockReview,
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'moderation_logs') {
          return {
            insert: jest.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        return {};
      });

      (reviewService.hideReview as jest.Mock).mockResolvedValue({ success: true });
      (notificationService.notifyReviewHidden as jest.Mock).mockResolvedValue(undefined);
    };

    beforeEach(() => {
      mockAuth(mockAdminId, 'admin');
      setupMocks();
    });

    it('should return success: true', async () => {
      const response = await request(app)
        .post(`/api/admin/reviews/${mockReviewId}/hide`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ hide_reason: 'Inappropriate content' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });

    it('should return review_id', async () => {
      const response = await request(app)
        .post(`/api/admin/reviews/${mockReviewId}/hide`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ hide_reason: 'Inappropriate content' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('review_id', mockReviewId);
    });

    it('should return action: hide', async () => {
      const response = await request(app)
        .post(`/api/admin/reviews/${mockReviewId}/hide`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ hide_reason: 'Inappropriate content' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('action', 'hide');
    });

    it('should return message', async () => {
      const response = await request(app)
        .post(`/api/admin/reviews/${mockReviewId}/hide`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ hide_reason: 'Inappropriate content' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Review hidden successfully');
    });
  });
});
