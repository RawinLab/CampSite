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
  notifyOwnerRequestApproved: jest.fn(),
}));

// Mock logger
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

describe('POST /api/admin/owner-requests/:id/approve', () => {
  const mockAdminId = '11111111-1111-1111-1111-111111111111';
  const mockUserId = '22222222-2222-2222-2222-222222222222';
  const mockOwnerId = '33333333-3333-3333-3333-333333333333';
  const mockRequestId = 'request-123';
  const mockToken = 'mock-jwt-token';

  const mockPendingRequest = {
    id: mockRequestId,
    user_id: mockUserId,
    business_name: 'Test Business',
    status: 'pending',
    created_at: '2024-01-01T00:00:00Z',
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
      if (table === 'profiles') {
        return {
          update: mockUpdate.mockReturnThis(),
          eq: mockEq,
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

  describe('Authentication/Authorization', () => {
    it('should return 401 when no token is provided', async () => {
      const response = await request(app)
        .post(`/api/admin/owner-requests/${mockRequestId}/approve`);

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
        .post(`/api/admin/owner-requests/${mockRequestId}/approve`)
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.status).toBe(401);
    });

    it('should return 403 for non-admin users (role=user)', async () => {
      mockAuth(mockUserId, 'user');

      const response = await request(app)
        .post(`/api/admin/owner-requests/${mockRequestId}/approve`)
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 403 for owner role users', async () => {
      mockAuth(mockOwnerId, 'owner');

      const response = await request(app)
        .post(`/api/admin/owner-requests/${mockRequestId}/approve`)
        .set('Authorization', `Bearer ${mockToken}`);

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
        if (table === 'profiles') {
          return {
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
        .post(`/api/admin/owner-requests/${mockRequestId}/approve`)
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.status).toBe(200);
    });
  });

  describe('Request Validation', () => {
    beforeEach(() => {
      mockAuth(mockAdminId, 'admin');
    });

    it('should return 404 for non-existent request ID', async () => {
      mockOwnerRequestQuery(null, new Error('Not found'));

      const response = await request(app)
        .post(`/api/admin/owner-requests/non-existent/approve`)
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Owner request not found or not pending');
    });

    it('should return 404 for request not in pending status', async () => {
      mockOwnerRequestQuery(null);

      const response = await request(app)
        .post(`/api/admin/owner-requests/${mockRequestId}/approve`)
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Owner request not found or not pending');
    });

    it('should return 404 for already approved request', async () => {
      const approvedRequest = { ...mockPendingRequest, status: 'approved' };
      mockOwnerRequestQuery(null); // Query only returns pending requests

      const response = await request(app)
        .post(`/api/admin/owner-requests/${mockRequestId}/approve`)
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 for already rejected request', async () => {
      const rejectedRequest = { ...mockPendingRequest, status: 'rejected' };
      mockOwnerRequestQuery(null); // Query only returns pending requests

      const response = await request(app)
        .post(`/api/admin/owner-requests/${mockRequestId}/approve`)
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Owner Request Update', () => {
    beforeEach(() => {
      mockAuth(mockAdminId, 'admin');
    });

    it('should update request status to approved', async () => {
      let requestUpdateData: any;

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
            update: jest.fn((data: any) => {
              requestUpdateData = data;
              return {
                eq: jest.fn().mockResolvedValue({ error: null }),
              };
            }),
          };
        }
        if (table === 'profiles') {
          return {
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
        .post(`/api/admin/owner-requests/${mockRequestId}/approve`)
        .set('Authorization', `Bearer ${mockToken}`);

      expect(requestUpdateData).toBeDefined();
      expect(requestUpdateData.status).toBe('approved');
    });

    it('should set reviewed_at timestamp', async () => {
      let requestUpdateData: any;

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
            update: jest.fn((data: any) => {
              requestUpdateData = data;
              return {
                eq: jest.fn().mockResolvedValue({ error: null }),
              };
            }),
          };
        }
        if (table === 'profiles') {
          return {
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
        .post(`/api/admin/owner-requests/${mockRequestId}/approve`)
        .set('Authorization', `Bearer ${mockToken}`);

      expect(requestUpdateData.reviewed_at).toBeDefined();
      expect(typeof requestUpdateData.reviewed_at).toBe('string');
      expect(new Date(requestUpdateData.reviewed_at).getTime()).toBeGreaterThan(0);
    });

    it('should set reviewed_by to admin user ID', async () => {
      let requestUpdateData: any;

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
            update: jest.fn((data: any) => {
              requestUpdateData = data;
              return {
                eq: jest.fn().mockResolvedValue({ error: null }),
              };
            }),
          };
        }
        if (table === 'profiles') {
          return {
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
        .post(`/api/admin/owner-requests/${mockRequestId}/approve`)
        .set('Authorization', `Bearer ${mockToken}`);

      expect(requestUpdateData.reviewed_by).toBe(mockAdminId);
    });

    it('should not set rejection_reason', async () => {
      let requestUpdateData: any;

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
            update: jest.fn((data: any) => {
              requestUpdateData = data;
              return {
                eq: jest.fn().mockResolvedValue({ error: null }),
              };
            }),
          };
        }
        if (table === 'profiles') {
          return {
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
        .post(`/api/admin/owner-requests/${mockRequestId}/approve`)
        .set('Authorization', `Bearer ${mockToken}`);

      expect(requestUpdateData.rejection_reason).toBeUndefined();
    });
  });

  describe('User Role Upgrade Tests (CRITICAL)', () => {
    beforeEach(() => {
      mockAuth(mockAdminId, 'admin');
      mockOwnerRequestQuery(mockPendingRequest);
      mockInsert.mockResolvedValue({ error: null });
    });

    it('should update profiles.user_role to owner', async () => {
      let profileUpdateData: any;

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
        if (table === 'profiles') {
          return {
            update: jest.fn((data: any) => {
              profileUpdateData = data;
              return {
                eq: jest.fn().mockResolvedValue({ error: null }),
              };
            }),
          };
        }
        if (table === 'moderation_logs') {
          return {
            insert: mockInsert,
          };
        }
      });

      await request(app)
        .post(`/api/admin/owner-requests/${mockRequestId}/approve`)
        .set('Authorization', `Bearer ${mockToken}`);

      expect(profileUpdateData).toBeDefined();
      expect(profileUpdateData.user_role).toBe('owner');
    });

    it('should update only the correct user (request.user_id)', async () => {
      let profileEqColumn: string | undefined;
      let profileEqValue: string | undefined;

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
        if (table === 'profiles') {
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn((column: string, value?: string) => {
                profileEqColumn = column;
                if (value !== undefined) {
                  profileEqValue = value;
                } else {
                  profileEqValue = column; // Sometimes the column value is passed as first arg
                }
                return Promise.resolve({ error: null });
              }),
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
        .post(`/api/admin/owner-requests/${mockRequestId}/approve`)
        .set('Authorization', `Bearer ${mockToken}`);

      // Check that eq was called with the correct user ID (it's typically: eq('id', userId))
      expect(profileEqColumn).toBe('id');
      expect(profileEqValue).toBe(mockUserId);
    });

    it('should update profile updated_at timestamp', async () => {
      let profileUpdateData: any;

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
        if (table === 'profiles') {
          return {
            update: jest.fn((data: any) => {
              profileUpdateData = data;
              return {
                eq: jest.fn().mockResolvedValue({ error: null }),
              };
            }),
          };
        }
        if (table === 'moderation_logs') {
          return {
            insert: mockInsert,
          };
        }
      });

      await request(app)
        .post(`/api/admin/owner-requests/${mockRequestId}/approve`)
        .set('Authorization', `Bearer ${mockToken}`);

      expect(profileUpdateData.updated_at).toBeDefined();
      expect(typeof profileUpdateData.updated_at).toBe('string');
      expect(new Date(profileUpdateData.updated_at).getTime()).toBeGreaterThan(0);
    });

    it('should return user_role_updated: true on success', async () => {
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
        if (table === 'profiles') {
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: null }),
            }),
          };
        }
        if (table === 'moderation_logs') {
          return {
            insert: mockInsert,
          };
        }
      });

      const response = await request(app)
        .post(`/api/admin/owner-requests/${mockRequestId}/approve`)
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.status).toBe(200);
      expect(response.body.user_role_updated).toBe(true);
    });

    it('should return user_role_updated: false if role update fails', async () => {
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
        if (table === 'profiles') {
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: new Error('Profile update failed') }),
            }),
          };
        }
        if (table === 'moderation_logs') {
          return {
            insert: mockInsert,
          };
        }
      });

      const response = await request(app)
        .post(`/api/admin/owner-requests/${mockRequestId}/approve`)
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.status).toBe(200);
      expect(response.body.user_role_updated).toBe(false);
    });

    it('should handle role update error gracefully (does not fail whole request)', async () => {
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
        if (table === 'profiles') {
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: new Error('Database error') }),
            }),
          };
        }
        if (table === 'moderation_logs') {
          return {
            insert: mockInsert,
          };
        }
      });

      const response = await request(app)
        .post(`/api/admin/owner-requests/${mockRequestId}/approve`)
        .set('Authorization', `Bearer ${mockToken}`);

      // Request should succeed even if role update fails
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.new_status).toBe('approved');
      expect(response.body.user_role_updated).toBe(false);
    });
  });

  describe('Moderation Log', () => {
    beforeEach(() => {
      mockAuth(mockAdminId, 'admin');
    });

    it('should create log entry with action_type=owner_approve', async () => {
      let moderationLogData: any;

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
        if (table === 'profiles') {
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: null }),
            }),
          };
        }
        if (table === 'moderation_logs') {
          return {
            insert: jest.fn((data: any) => {
              moderationLogData = data;
              return Promise.resolve({ error: null });
            }),
          };
        }
      });

      await request(app)
        .post(`/api/admin/owner-requests/${mockRequestId}/approve`)
        .set('Authorization', `Bearer ${mockToken}`);

      expect(moderationLogData).toBeDefined();
      expect(moderationLogData.action_type).toBe('owner_approve');
    });

    it('should create log entry with entity_type=owner_request', async () => {
      let moderationLogData: any;

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
        if (table === 'profiles') {
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: null }),
            }),
          };
        }
        if (table === 'moderation_logs') {
          return {
            insert: jest.fn((data: any) => {
              moderationLogData = data;
              return Promise.resolve({ error: null });
            }),
          };
        }
      });

      await request(app)
        .post(`/api/admin/owner-requests/${mockRequestId}/approve`)
        .set('Authorization', `Bearer ${mockToken}`);

      expect(moderationLogData).toBeDefined();
      expect(moderationLogData.entity_type).toBe('owner_request');
    });

    it('should create log entry with correct entity_id', async () => {
      let moderationLogData: any;

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
        if (table === 'profiles') {
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: null }),
            }),
          };
        }
        if (table === 'moderation_logs') {
          return {
            insert: jest.fn((data: any) => {
              moderationLogData = data;
              return Promise.resolve({ error: null });
            }),
          };
        }
      });

      await request(app)
        .post(`/api/admin/owner-requests/${mockRequestId}/approve`)
        .set('Authorization', `Bearer ${mockToken}`);

      expect(moderationLogData).toBeDefined();
      expect(moderationLogData.entity_id).toBe(mockRequestId);
    });
  });

  describe('Notification', () => {
    beforeEach(() => {
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
        if (table === 'profiles') {
          return {
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
    });

    it('should call notifyOwnerRequestApproved', async () => {
      await request(app)
        .post(`/api/admin/owner-requests/${mockRequestId}/approve`)
        .set('Authorization', `Bearer ${mockToken}`);

      expect(notificationService.notifyOwnerRequestApproved).toHaveBeenCalled();
    });

    it('should pass correct user_id to notification', async () => {
      await request(app)
        .post(`/api/admin/owner-requests/${mockRequestId}/approve`)
        .set('Authorization', `Bearer ${mockToken}`);

      expect(notificationService.notifyOwnerRequestApproved).toHaveBeenCalledWith(
        mockUserId,
        expect.any(String),
        expect.any(String)
      );
    });

    it('should pass business_name to notification', async () => {
      await request(app)
        .post(`/api/admin/owner-requests/${mockRequestId}/approve`)
        .set('Authorization', `Bearer ${mockToken}`);

      expect(notificationService.notifyOwnerRequestApproved).toHaveBeenCalledWith(
        expect.any(String),
        'Test Business',
        expect.any(String)
      );
    });

    it('should pass request_id to notification', async () => {
      await request(app)
        .post(`/api/admin/owner-requests/${mockRequestId}/approve`)
        .set('Authorization', `Bearer ${mockToken}`);

      expect(notificationService.notifyOwnerRequestApproved).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        mockRequestId
      );
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      mockAuth(mockAdminId, 'admin');
    });

    it('should handle database errors', async () => {
      mockOwnerRequestQuery(mockPendingRequest);
      mockUpdate.mockResolvedValue({ error: new Error('Database error') });

      const response = await request(app)
        .post(`/api/admin/owner-requests/${mockRequestId}/approve`)
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    it('should return 500 on critical errors', async () => {
      (supabaseAdmin.from as jest.Mock).mockImplementation(() => {
        throw new Error('Critical database failure');
      });

      const response = await request(app)
        .post(`/api/admin/owner-requests/${mockRequestId}/approve`)
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to approve owner request');
    });

    it('should log errors appropriately', async () => {
      const logger = require('../../src/utils/logger');
      mockOwnerRequestQuery(mockPendingRequest);
      mockUpdate.mockResolvedValue({ error: new Error('Update failed') });

      await request(app)
        .post(`/api/admin/owner-requests/${mockRequestId}/approve`)
        .set('Authorization', `Bearer ${mockToken}`);

      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('Response Format', () => {
    beforeEach(() => {
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
        if (table === 'profiles') {
          return {
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
    });

    it('should return success: true', async () => {
      const response = await request(app)
        .post(`/api/admin/owner-requests/${mockRequestId}/approve`)
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.body.success).toBe(true);
    });

    it('should return request_id', async () => {
      const response = await request(app)
        .post(`/api/admin/owner-requests/${mockRequestId}/approve`)
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.body.request_id).toBe(mockRequestId);
    });

    it('should return new_status: approved', async () => {
      const response = await request(app)
        .post(`/api/admin/owner-requests/${mockRequestId}/approve`)
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.body.new_status).toBe('approved');
    });

    it('should return user_role_updated boolean', async () => {
      const response = await request(app)
        .post(`/api/admin/owner-requests/${mockRequestId}/approve`)
        .set('Authorization', `Bearer ${mockToken}`);

      expect(typeof response.body.user_role_updated).toBe('boolean');
    });

    it('should return appropriate message', async () => {
      const response = await request(app)
        .post(`/api/admin/owner-requests/${mockRequestId}/approve`)
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.body.message).toBe('Owner request approved successfully');
    });
  });
});
