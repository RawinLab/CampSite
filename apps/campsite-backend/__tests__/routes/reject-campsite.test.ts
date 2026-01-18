import request from 'supertest';
import app from '../../src/app';
import { supabaseAdmin } from '../../src/lib/supabase';
import * as notificationService from '../../src/services/notification.service';

// Mock Supabase
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

// Mock notification service
jest.mock('../../src/services/notification.service', () => ({
  notifyCampsiteRejected: jest.fn(),
}));

// Mock rate limiter
jest.mock('../../src/middleware/rate-limit', () => ({
  inquiryRateLimiter: (req: any, res: any, next: any) => next(),
}));

describe('POST /api/admin/campsites/:id/reject', () => {
  const mockAdminId = '123e4567-e89b-12d3-a456-426614174000';
  const mockOwnerId = '223e4567-e89b-12d3-a456-426614174001';
  const mockCampsiteId = '323e4567-e89b-12d3-a456-426614174002';
  const mockToken = 'mock-jwt-token';

  const validRejectionReason = 'The campsite information provided is incomplete and does not meet our quality standards.';

  const mockPendingCampsite = {
    id: mockCampsiteId,
    name: 'Test Campsite',
    status: 'pending',
    owner_id: mockOwnerId,
    owner: {
      id: mockOwnerId,
      full_name: 'Test Owner',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // Authentication Tests
  // ============================================

  describe('Authentication', () => {
    it('should return 401 when no token is provided', async () => {
      const response = await request(app)
        .post(`/api/admin/campsites/${mockCampsiteId}/reject`)
        .send({ rejection_reason: validRejectionReason });

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
        .post(`/api/admin/campsites/${mockCampsiteId}/reject`)
        .set('Authorization', `Bearer invalid-token`)
        .send({ rejection_reason: validRejectionReason });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  // ============================================
  // Authorization Tests
  // ============================================

  describe('Authorization', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: mockAdminId, email: 'admin@test.com' } },
        error: null,
      });
    });

    it('should return 403 for non-admin users (regular user)', async () => {
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
        .post(`/api/admin/campsites/${mockCampsiteId}/reject`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ rejection_reason: validRejectionReason });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 403 for non-admin users (owner)', async () => {
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { user_role: 'owner' },
              error: null,
            }),
          }),
        }),
      });

      const response = await request(app)
        .post(`/api/admin/campsites/${mockCampsiteId}/reject`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ rejection_reason: validRejectionReason });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 200 for admin users', async () => {
      // Mock auth middleware profile check
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { user_role: 'admin' },
              error: null,
            }),
          }),
        }),
      });

      let adminCallCount = 0;
      (supabaseAdmin.from as jest.Mock).mockImplementation(() => {
        adminCallCount++;
        if (adminCallCount === 1) {
          // First call: fetch campsite
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: mockPendingCampsite,
                error: null,
              }),
            }),
          };
        } else if (adminCallCount === 2) {
          // Second call: update campsite
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          };
        } else if (adminCallCount === 3) {
          // Third call: insert moderation log
          return {
            insert: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          };
        }
      });

      const response = await request(app)
        .post(`/api/admin/campsites/${mockCampsiteId}/reject`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ rejection_reason: validRejectionReason });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  // ============================================
  // Validation Tests
  // ============================================

  describe('Validation', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: mockAdminId, email: 'admin@test.com' } },
        error: null,
      });

      // Mock auth middleware profile check
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { user_role: 'admin' },
              error: null,
            }),
          }),
        }),
      });
    });

    it('should return 400 when rejection_reason is missing', async () => {
      const response = await request(app)
        .post(`/api/admin/campsites/${mockCampsiteId}/reject`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return 400 when rejection_reason is too short (less than 10 characters)', async () => {
      const response = await request(app)
        .post(`/api/admin/campsites/${mockCampsiteId}/reject`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ rejection_reason: 'Too short' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return 400 when rejection_reason is exactly 9 characters', async () => {
      const response = await request(app)
        .post(`/api/admin/campsites/${mockCampsiteId}/reject`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ rejection_reason: '123456789' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return 400 when rejection_reason is too long (more than 500 characters)', async () => {
      const longReason = 'a'.repeat(501);
      const response = await request(app)
        .post(`/api/admin/campsites/${mockCampsiteId}/reject`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ rejection_reason: longReason });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should accept valid rejection_reason with exactly 10 characters', async () => {
      let adminCallCount = 0;
      (supabaseAdmin.from as jest.Mock).mockImplementation(() => {
        adminCallCount++;
        if (adminCallCount === 1) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: mockPendingCampsite,
                error: null,
              }),
            }),
          };
        } else if (adminCallCount === 2) {
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          };
        } else if (adminCallCount === 3) {
          return {
            insert: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          };
        }
      });

      const response = await request(app)
        .post(`/api/admin/campsites/${mockCampsiteId}/reject`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ rejection_reason: '1234567890' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should accept valid rejection_reason with exactly 500 characters', async () => {
      let adminCallCount = 0;
      (supabaseAdmin.from as jest.Mock).mockImplementation(() => {
        adminCallCount++;
        if (adminCallCount === 1) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: mockPendingCampsite,
                error: null,
              }),
            }),
          };
        } else if (adminCallCount === 2) {
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          };
        } else if (adminCallCount === 3) {
          return {
            insert: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          };
        }
      });

      const maxLengthReason = 'a'.repeat(500);
      const response = await request(app)
        .post(`/api/admin/campsites/${mockCampsiteId}/reject`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ rejection_reason: maxLengthReason });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should accept valid rejection_reason between 10-500 characters', async () => {
      let adminCallCount = 0;
      (supabaseAdmin.from as jest.Mock).mockImplementation(() => {
        adminCallCount++;
        if (adminCallCount === 1) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: mockPendingCampsite,
                error: null,
              }),
            }),
          };
        } else if (adminCallCount === 2) {
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          };
        } else if (adminCallCount === 3) {
          return {
            insert: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          };
        }
      });

      const response = await request(app)
        .post(`/api/admin/campsites/${mockCampsiteId}/reject`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ rejection_reason: validRejectionReason });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  // ============================================
  // Campsite Validation Tests
  // ============================================

  describe('Campsite Validation', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: mockAdminId, email: 'admin@test.com' } },
        error: null,
      });

      // Mock auth middleware profile check
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { user_role: 'admin' },
              error: null,
            }),
          }),
        }),
      });

      // Mock admin calls to return no campsite found
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      });
    });

    it('should return 404 for non-existent campsite ID', async () => {
      const response = await request(app)
        .post(`/api/admin/campsites/${mockCampsiteId}/reject`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ rejection_reason: validRejectionReason });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });

    it('should return 404 for campsite not in pending status', async () => {
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Not found' },
          }),
        }),
      });

      const response = await request(app)
        .post(`/api/admin/campsites/${mockCampsiteId}/reject`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ rejection_reason: validRejectionReason });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });

    it('should return 404 for already rejected campsite', async () => {
      const response = await request(app)
        .post(`/api/admin/campsites/${mockCampsiteId}/reject`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ rejection_reason: validRejectionReason });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 for already approved campsite', async () => {
      const response = await request(app)
        .post(`/api/admin/campsites/${mockCampsiteId}/reject`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ rejection_reason: validRejectionReason });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  // ============================================
  // Successful Rejection Tests
  // ============================================

  describe('Successful Rejection', () => {
    const setupSuccessfulMocks = (mockUpdate = jest.fn(), mockInsert = jest.fn()) => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: mockAdminId, email: 'admin@test.com' } },
        error: null,
      });

      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { user_role: 'admin' },
              error: null,
            }),
          }),
        }),
      });

      let adminCallCount = 0;
      (supabaseAdmin.from as jest.Mock).mockImplementation(() => {
        adminCallCount++;
        if (adminCallCount === 1) {
          // Fetch campsite
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: mockPendingCampsite,
                error: null,
              }),
            }),
          };
        } else if (adminCallCount === 2) {
          // Update campsite
          return {
            update: mockUpdate.mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          };
        } else if (adminCallCount === 3) {
          // Insert moderation log
          return {
            insert: mockInsert.mockResolvedValue({
              data: null,
              error: null,
            }),
          };
        }
      });

      return { mockUpdate, mockInsert };
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should update campsite status to rejected', async () => {
      const mockUpdate = jest.fn();
      setupSuccessfulMocks(mockUpdate);

      await request(app)
        .post(`/api/admin/campsites/${mockCampsiteId}/reject`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ rejection_reason: validRejectionReason });

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'rejected',
          rejection_reason: validRejectionReason,
          updated_at: expect.any(String),
        })
      );
    });

    it('should store rejection_reason in database', async () => {
      const mockUpdate = jest.fn();
      setupSuccessfulMocks(mockUpdate);

      await request(app)
        .post(`/api/admin/campsites/${mockCampsiteId}/reject`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ rejection_reason: validRejectionReason });

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          rejection_reason: validRejectionReason,
        })
      );
    });

    it('should update campsite updated_at timestamp', async () => {
      const mockUpdate = jest.fn();
      setupSuccessfulMocks(mockUpdate);

      await request(app)
        .post(`/api/admin/campsites/${mockCampsiteId}/reject`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ rejection_reason: validRejectionReason });

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          updated_at: expect.any(String),
        })
      );
    });

    it('should create moderation log entry with reason', async () => {
      const mockInsert = jest.fn();
      setupSuccessfulMocks(jest.fn(), mockInsert);

      await request(app)
        .post(`/api/admin/campsites/${mockCampsiteId}/reject`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ rejection_reason: validRejectionReason });

      expect(mockInsert).toHaveBeenCalledWith({
        admin_id: mockAdminId,
        action_type: 'campsite_reject',
        entity_type: 'campsite',
        entity_id: mockCampsiteId,
        reason: validRejectionReason,
      });
    });

    it('should call notification service with reason parameter', async () => {
      setupSuccessfulMocks();

      await request(app)
        .post(`/api/admin/campsites/${mockCampsiteId}/reject`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ rejection_reason: validRejectionReason });

      expect(notificationService.notifyCampsiteRejected).toHaveBeenCalledWith(
        mockOwnerId,
        'Test Campsite',
        mockCampsiteId,
        validRejectionReason
      );
    });

    it('should return correct response structure', async () => {
      setupSuccessfulMocks();

      const response = await request(app)
        .post(`/api/admin/campsites/${mockCampsiteId}/reject`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ rejection_reason: validRejectionReason });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        campsite_id: mockCampsiteId,
        new_status: 'rejected',
        message: 'Campsite rejected successfully',
      });
    });

    it('should return success: true on success', async () => {
      setupSuccessfulMocks();

      const response = await request(app)
        .post(`/api/admin/campsites/${mockCampsiteId}/reject`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ rejection_reason: validRejectionReason });

      expect(response.body.success).toBe(true);
    });

    it('should return campsite_id in response', async () => {
      setupSuccessfulMocks();

      const response = await request(app)
        .post(`/api/admin/campsites/${mockCampsiteId}/reject`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ rejection_reason: validRejectionReason });

      expect(response.body.campsite_id).toBe(mockCampsiteId);
    });

    it('should return new_status: rejected in response', async () => {
      setupSuccessfulMocks();

      const response = await request(app)
        .post(`/api/admin/campsites/${mockCampsiteId}/reject`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ rejection_reason: validRejectionReason });

      expect(response.body.new_status).toBe('rejected');
    });
  });

  // ============================================
  // Error Handling Tests
  // ============================================

  describe('Error Handling', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: mockAdminId, email: 'admin@test.com' } },
        error: null,
      });

      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { user_role: 'admin' },
              error: null,
            }),
          }),
        }),
      });
    });

    it('should handle database errors gracefully on update failure', async () => {
      let adminCallCount = 0;
      (supabaseAdmin.from as jest.Mock).mockImplementation(() => {
        adminCallCount++;
        if (adminCallCount === 1) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: mockPendingCampsite,
                error: null,
              }),
            }),
          };
        } else if (adminCallCount === 2) {
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Database error' },
              }),
            }),
          };
        }
      });

      const response = await request(app)
        .post(`/api/admin/campsites/${mockCampsiteId}/reject`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ rejection_reason: validRejectionReason });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return 500 on Supabase error', async () => {
      let adminCallCount = 0;
      (supabaseAdmin.from as jest.Mock).mockImplementation(() => {
        adminCallCount++;
        if (adminCallCount === 1) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: mockPendingCampsite,
                error: null,
              }),
            }),
          };
        } else if (adminCallCount === 2) {
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: null,
                error: new Error('Supabase connection failed'),
              }),
            }),
          };
        }
      });

      const response = await request(app)
        .post(`/api/admin/campsites/${mockCampsiteId}/reject`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ rejection_reason: validRejectionReason });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });
});
