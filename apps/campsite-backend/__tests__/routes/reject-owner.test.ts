import request from 'supertest';
import app from '../../src/app';
import { supabaseAdmin } from '../../src/lib/supabase';
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

// Mock notification service
jest.mock('../../src/services/notification.service', () => ({
  notifyOwnerRequestRejected: jest.fn(),
}));

// Mock logger
jest.mock('../../src/utils/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

/**
 * Unit tests for POST /api/admin/owner-requests/:id/reject
 * Tests owner request rejection endpoint with focus on user role preservation
 * Critical requirement: Rejection MUST NOT change user role (keeps 'user')
 */

describe('POST /api/admin/owner-requests/:id/reject', () => {
  const mockAdminId = '11111111-1111-1111-1111-111111111111';
  const mockUserId = '22222222-2222-2222-2222-222222222222';
  const mockOwnerId = '33333333-3333-3333-3333-333333333333';
  const mockRequestId = 'request-123';
  const mockToken = 'mock-jwt-token';

  const validRejectionReason = 'Insufficient business documentation provided for verification';
  const mockPendingRequest = {
    id: mockRequestId,
    user_id: mockUserId,
    business_name: 'Test Business',
    business_description: 'Test business description for camping services',
    contact_phone: '0812345678',
    status: 'pending',
    rejection_reason: null,
    created_at: '2024-01-01T00:00:00Z',
    reviewed_at: null,
    reviewed_by: null,
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

  // Helper to mock owner request query
  const mockOwnerRequestQuery = (request: any, error: any = null) => {
    (supabaseAdmin.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'owner_requests') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: request,
                  error,
                }),
              }),
            }),
          }),
          update: mockUpdate.mockReturnThis(),
        };
      }
      if (table === 'moderation_logs') {
        return {
          insert: mockInsert,
        };
      }
      return {
        select: mockSelect,
        update: mockUpdate,
        eq: mockEq,
        single: mockSingle,
        insert: mockInsert,
      };
    });
  };

  // ============================================
  // 1. Authentication/Authorization Tests
  // ============================================

  describe('Authentication and Authorization', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post(`/api/admin/owner-requests/${mockRequestId}/reject`)
        .send({ rejection_reason: validRejectionReason });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('No authentication token provided');
    });

    it('should return 403 for non-admin users', async () => {
      mockAuth(mockUserId, 'user');

      const response = await request(app)
        .post(`/api/admin/owner-requests/${mockRequestId}/reject`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ rejection_reason: validRejectionReason });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 200 for admin users', async () => {
      mockAuth(mockAdminId, 'admin');

      (supabaseAdmin.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'owner_requests') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: mockPendingRequest,
                    error: null,
                  }),
                }),
              }),
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: null }),
            }),
          };
        }
        if (table === 'moderation_logs') {
          return {
            insert: jest.fn().mockResolvedValue({ error: null }),
          };
        }
      });

      const response = await request(app)
        .post(`/api/admin/owner-requests/${mockRequestId}/reject`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ rejection_reason: validRejectionReason });

      expect(response.status).toBe(200);
    });
  });

  // ============================================
  // 2. Validation Tests
  // ============================================

  describe('Request Validation', () => {
    beforeEach(() => {
      mockAuth(mockAdminId, 'admin');
    });

    it('should return 400 when rejection_reason is missing', async () => {
      const response = await request(app)
        .post(`/api/admin/owner-requests/${mockRequestId}/reject`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return 400 when rejection_reason is less than 10 characters', async () => {
      const response = await request(app)
        .post(`/api/admin/owner-requests/${mockRequestId}/reject`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ rejection_reason: 'Too short' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return 400 when rejection_reason exceeds 500 characters', async () => {
      const longReason = 'a'.repeat(501);

      const response = await request(app)
        .post(`/api/admin/owner-requests/${mockRequestId}/reject`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ rejection_reason: longReason });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should accept valid rejection_reason with exactly 10 characters', async () => {
      (supabaseAdmin.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'owner_requests') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: mockPendingRequest,
                    error: null,
                  }),
                }),
              }),
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: null }),
            }),
          };
        }
        if (table === 'moderation_logs') {
          return {
            insert: jest.fn().mockResolvedValue({ error: null }),
          };
        }
      });

      const response = await request(app)
        .post(`/api/admin/owner-requests/${mockRequestId}/reject`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ rejection_reason: '1234567890' });

      expect(response.status).toBe(200);
    });

    it('should accept valid rejection_reason with exactly 500 characters', async () => {
      const maxReason = 'a'.repeat(500);

      (supabaseAdmin.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'owner_requests') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: mockPendingRequest,
                    error: null,
                  }),
                }),
              }),
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: null }),
            }),
          };
        }
        if (table === 'moderation_logs') {
          return {
            insert: jest.fn().mockResolvedValue({ error: null }),
          };
        }
      });

      const response = await request(app)
        .post(`/api/admin/owner-requests/${mockRequestId}/reject`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ rejection_reason: maxReason });

      expect(response.status).toBe(200);
    });

    it('should accept valid rejection_reason', async () => {
      (supabaseAdmin.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'owner_requests') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: mockPendingRequest,
                    error: null,
                  }),
                }),
              }),
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: null }),
            }),
          };
        }
        if (table === 'moderation_logs') {
          return {
            insert: jest.fn().mockResolvedValue({ error: null }),
          };
        }
      });

      const response = await request(app)
        .post(`/api/admin/owner-requests/${mockRequestId}/reject`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ rejection_reason: validRejectionReason });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  // ============================================
  // 3. Request Validation Tests
  // ============================================

  describe('Owner Request Validation', () => {
    beforeEach(() => {
      mockAuth(mockAdminId, 'admin');
    });

    it('should return 404 for non-existent request ID', async () => {
      mockOwnerRequestQuery(null, new Error('Not found'));

      const response = await request(app)
        .post(`/api/admin/owner-requests/non-existent/reject`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ rejection_reason: validRejectionReason });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });

    it('should return 404 for request not in pending status', async () => {
      mockOwnerRequestQuery(null);

      const response = await request(app)
        .post(`/api/admin/owner-requests/${mockRequestId}/reject`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ rejection_reason: validRejectionReason });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 for already rejected request', async () => {
      mockOwnerRequestQuery(null);

      const response = await request(app)
        .post(`/api/admin/owner-requests/${mockRequestId}/reject`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ rejection_reason: validRejectionReason });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  // ============================================
  // 4. Owner Request Update Tests
  // ============================================

  describe('Owner Request Update', () => {
    beforeEach(() => {
      mockAuth(mockAdminId, 'admin');
    });

    it('should update request status to rejected', async () => {
      const mockUpdateFn = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      (supabaseAdmin.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'owner_requests') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: mockPendingRequest,
                    error: null,
                  }),
                }),
              }),
            }),
            update: mockUpdateFn,
          };
        }
        if (table === 'moderation_logs') {
          return {
            insert: jest.fn().mockResolvedValue({ error: null }),
          };
        }
      });

      const response = await request(app)
        .post(`/api/admin/owner-requests/${mockRequestId}/reject`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ rejection_reason: validRejectionReason });

      expect(response.status).toBe(200);
      expect(mockUpdateFn).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'rejected',
        })
      );
    });

    it('should set reviewed_at timestamp', async () => {
      const mockUpdateFn = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      (supabaseAdmin.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'owner_requests') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: mockPendingRequest,
                    error: null,
                  }),
                }),
              }),
            }),
            update: mockUpdateFn,
          };
        }
        if (table === 'moderation_logs') {
          return {
            insert: jest.fn().mockResolvedValue({ error: null }),
          };
        }
      });

      const response = await request(app)
        .post(`/api/admin/owner-requests/${mockRequestId}/reject`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ rejection_reason: validRejectionReason });

      expect(response.status).toBe(200);
      expect(mockUpdateFn).toHaveBeenCalledWith(
        expect.objectContaining({
          reviewed_at: expect.any(String),
        })
      );
    });

    it('should set reviewed_by to admin user ID', async () => {
      const mockUpdateFn = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      (supabaseAdmin.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'owner_requests') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: mockPendingRequest,
                    error: null,
                  }),
                }),
              }),
            }),
            update: mockUpdateFn,
          };
        }
        if (table === 'moderation_logs') {
          return {
            insert: jest.fn().mockResolvedValue({ error: null }),
          };
        }
      });

      const response = await request(app)
        .post(`/api/admin/owner-requests/${mockRequestId}/reject`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ rejection_reason: validRejectionReason });

      expect(response.status).toBe(200);
      expect(mockUpdateFn).toHaveBeenCalledWith(
        expect.objectContaining({
          reviewed_by: mockAdminId,
        })
      );
    });

    it('should store rejection_reason', async () => {
      const mockUpdateFn = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      (supabaseAdmin.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'owner_requests') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: mockPendingRequest,
                    error: null,
                  }),
                }),
              }),
            }),
            update: mockUpdateFn,
          };
        }
        if (table === 'moderation_logs') {
          return {
            insert: jest.fn().mockResolvedValue({ error: null }),
          };
        }
      });

      const response = await request(app)
        .post(`/api/admin/owner-requests/${mockRequestId}/reject`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ rejection_reason: validRejectionReason });

      expect(response.status).toBe(200);
      expect(mockUpdateFn).toHaveBeenCalledWith(
        expect.objectContaining({
          rejection_reason: validRejectionReason,
        })
      );
    });
  });

  // ============================================
  // 5. User Role Preservation Tests (CRITICAL)
  // ============================================

  describe('User Role Preservation (CRITICAL)', () => {
    beforeEach(() => {
      mockAuth(mockAdminId, 'admin');
    });

    it('should NOT update profiles table', async () => {
      const mockFromSpy = jest.fn();

      (supabaseAdmin.from as jest.Mock).mockImplementation((table: string) => {
        mockFromSpy(table);

        if (table === 'owner_requests') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: mockPendingRequest,
                    error: null,
                  }),
                }),
              }),
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: null }),
            }),
          };
        }
        if (table === 'moderation_logs') {
          return {
            insert: jest.fn().mockResolvedValue({ error: null }),
          };
        }
        return {
          select: jest.fn(),
          update: jest.fn(),
        };
      });

      await request(app)
        .post(`/api/admin/owner-requests/${mockRequestId}/reject`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ rejection_reason: validRejectionReason });

      const profilesCalls = mockFromSpy.mock.calls.filter((call) => call[0] === 'profiles');

      // profiles table should never be accessed during rejection
      expect(profilesCalls.length).toBe(0);
    });

    it('should ensure user role remains user after rejection', async () => {
      let profilesUpdateCalled = false;

      (supabaseAdmin.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            update: jest.fn(() => {
              profilesUpdateCalled = true;
              return {
                eq: jest.fn().mockResolvedValue({ error: null }),
              };
            }),
          };
        }
        if (table === 'owner_requests') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: mockPendingRequest,
                    error: null,
                  }),
                }),
              }),
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: null }),
            }),
          };
        }
        if (table === 'moderation_logs') {
          return {
            insert: jest.fn().mockResolvedValue({ error: null }),
          };
        }
      });

      const response = await request(app)
        .post(`/api/admin/owner-requests/${mockRequestId}/reject`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ rejection_reason: validRejectionReason });

      expect(response.status).toBe(200);
      expect(profilesUpdateCalled).toBe(false);
    });

    it('should not call update on profiles table for user role change', async () => {
      const mockProfilesUpdate = jest.fn();

      (supabaseAdmin.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            update: mockProfilesUpdate,
          };
        }
        if (table === 'owner_requests') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: mockPendingRequest,
                    error: null,
                  }),
                }),
              }),
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: null }),
            }),
          };
        }
        if (table === 'moderation_logs') {
          return {
            insert: jest.fn().mockResolvedValue({ error: null }),
          };
        }
      });

      await request(app)
        .post(`/api/admin/owner-requests/${mockRequestId}/reject`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ rejection_reason: validRejectionReason });

      expect(mockProfilesUpdate).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // 6. Moderation Log Tests
  // ============================================

  describe('Moderation Log', () => {
    beforeEach(() => {
      mockAuth(mockAdminId, 'admin');
    });

    it('should create log entry with action_type owner_reject', async () => {
      const mockInsertFn = jest.fn().mockResolvedValue({ error: null });

      (supabaseAdmin.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'owner_requests') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: mockPendingRequest,
                    error: null,
                  }),
                }),
              }),
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: null }),
            }),
          };
        }
        if (table === 'moderation_logs') {
          return {
            insert: mockInsertFn,
          };
        }
      });

      const response = await request(app)
        .post(`/api/admin/owner-requests/${mockRequestId}/reject`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ rejection_reason: validRejectionReason });

      expect(response.status).toBe(200);
      expect(mockInsertFn).toHaveBeenCalledWith(
        expect.objectContaining({
          action_type: 'owner_reject',
        })
      );
    });

    it('should create log entry with entity_type owner_request', async () => {
      const mockInsertFn = jest.fn().mockResolvedValue({ error: null });

      (supabaseAdmin.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'owner_requests') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: mockPendingRequest,
                    error: null,
                  }),
                }),
              }),
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: null }),
            }),
          };
        }
        if (table === 'moderation_logs') {
          return {
            insert: mockInsertFn,
          };
        }
      });

      const response = await request(app)
        .post(`/api/admin/owner-requests/${mockRequestId}/reject`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ rejection_reason: validRejectionReason });

      expect(response.status).toBe(200);
      expect(mockInsertFn).toHaveBeenCalledWith(
        expect.objectContaining({
          entity_type: 'owner_request',
        })
      );
    });

    it('should create log entry with rejection reason', async () => {
      const mockInsertFn = jest.fn().mockResolvedValue({ error: null });

      (supabaseAdmin.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'owner_requests') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: mockPendingRequest,
                    error: null,
                  }),
                }),
              }),
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: null }),
            }),
          };
        }
        if (table === 'moderation_logs') {
          return {
            insert: mockInsertFn,
          };
        }
      });

      const response = await request(app)
        .post(`/api/admin/owner-requests/${mockRequestId}/reject`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ rejection_reason: validRejectionReason });

      expect(response.status).toBe(200);
      expect(mockInsertFn).toHaveBeenCalledWith(
        expect.objectContaining({
          reason: validRejectionReason,
        })
      );
    });
  });

  // ============================================
  // 7. Notification Tests
  // ============================================

  describe('Notification', () => {
    beforeEach(() => {
      mockAuth(mockAdminId, 'admin');
    });

    it('should call notifyOwnerRequestRejected', async () => {
      (supabaseAdmin.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'owner_requests') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: mockPendingRequest,
                    error: null,
                  }),
                }),
              }),
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: null }),
            }),
          };
        }
        if (table === 'moderation_logs') {
          return {
            insert: jest.fn().mockResolvedValue({ error: null }),
          };
        }
      });

      const response = await request(app)
        .post(`/api/admin/owner-requests/${mockRequestId}/reject`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ rejection_reason: validRejectionReason });

      expect(response.status).toBe(200);
      expect(notificationService.notifyOwnerRequestRejected).toHaveBeenCalled();
    });

    it('should pass rejection_reason in notification', async () => {
      (supabaseAdmin.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'owner_requests') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: mockPendingRequest,
                    error: null,
                  }),
                }),
              }),
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: null }),
            }),
          };
        }
        if (table === 'moderation_logs') {
          return {
            insert: jest.fn().mockResolvedValue({ error: null }),
          };
        }
      });

      const response = await request(app)
        .post(`/api/admin/owner-requests/${mockRequestId}/reject`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ rejection_reason: validRejectionReason });

      expect(response.status).toBe(200);
      expect(notificationService.notifyOwnerRequestRejected).toHaveBeenCalledWith(
        mockUserId,
        mockPendingRequest.business_name,
        mockRequestId,
        validRejectionReason
      );
    });
  });

  // ============================================
  // 8. Error Handling Tests
  // ============================================

  describe('Error Handling', () => {
    beforeEach(() => {
      mockAuth(mockAdminId, 'admin');
    });

    it('should handle database errors when fetching request', async () => {
      mockOwnerRequestQuery(null, new Error('Database error'));

      const response = await request(app)
        .post(`/api/admin/owner-requests/${mockRequestId}/reject`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ rejection_reason: validRejectionReason });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should handle database errors when updating request', async () => {
      (supabaseAdmin.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'owner_requests') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: mockPendingRequest,
                    error: null,
                  }),
                }),
              }),
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: new Error('Update failed') }),
            }),
          };
        }
      });

      const response = await request(app)
        .post(`/api/admin/owner-requests/${mockRequestId}/reject`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ rejection_reason: validRejectionReason });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    it('should return 500 on critical errors', async () => {
      (supabaseAdmin.from as jest.Mock).mockImplementation(() => {
        throw new Error('Critical database error');
      });

      const response = await request(app)
        .post(`/api/admin/owner-requests/${mockRequestId}/reject`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ rejection_reason: validRejectionReason });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  // ============================================
  // 9. Response Format Tests
  // ============================================

  describe('Response Format', () => {
    beforeEach(() => {
      mockAuth(mockAdminId, 'admin');
    });

    it('should return success true on successful rejection', async () => {
      (supabaseAdmin.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'owner_requests') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: mockPendingRequest,
                    error: null,
                  }),
                }),
              }),
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: null }),
            }),
          };
        }
        if (table === 'moderation_logs') {
          return {
            insert: jest.fn().mockResolvedValue({ error: null }),
          };
        }
      });

      const response = await request(app)
        .post(`/api/admin/owner-requests/${mockRequestId}/reject`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ rejection_reason: validRejectionReason });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return request_id in response', async () => {
      (supabaseAdmin.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'owner_requests') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: mockPendingRequest,
                    error: null,
                  }),
                }),
              }),
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: null }),
            }),
          };
        }
        if (table === 'moderation_logs') {
          return {
            insert: jest.fn().mockResolvedValue({ error: null }),
          };
        }
      });

      const response = await request(app)
        .post(`/api/admin/owner-requests/${mockRequestId}/reject`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ rejection_reason: validRejectionReason });

      expect(response.status).toBe(200);
      expect(response.body.request_id).toBe(mockRequestId);
    });

    it('should return new_status as rejected', async () => {
      (supabaseAdmin.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'owner_requests') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: mockPendingRequest,
                    error: null,
                  }),
                }),
              }),
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: null }),
            }),
          };
        }
        if (table === 'moderation_logs') {
          return {
            insert: jest.fn().mockResolvedValue({ error: null }),
          };
        }
      });

      const response = await request(app)
        .post(`/api/admin/owner-requests/${mockRequestId}/reject`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ rejection_reason: validRejectionReason });

      expect(response.status).toBe(200);
      expect(response.body.new_status).toBe('rejected');
    });
  });
});
