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
  notifyCampsiteApproved: jest.fn(),
}));

// Mock logger
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

describe('POST /api/admin/campsites/:id/approve', () => {
  const mockAdminId = '11111111-1111-1111-1111-111111111111';
  const mockUserId = '22222222-2222-2222-2222-222222222222';
  const mockOwnerId = '33333333-3333-3333-3333-333333333333';
  const mockCampsiteId = 'campsite-123';
  const mockToken = 'mock-jwt-token';

  const mockPendingCampsite = {
    id: mockCampsiteId,
    name: 'Test Campsite',
    owner_id: mockOwnerId,
    status: 'pending',
    owner: {
      id: mockOwnerId,
      full_name: 'John Owner',
    },
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

  // Helper to mock full successful approval flow
  const mockSuccessfulApprovalFlow = () => {
    // Mock auth middleware's createSupabaseClient
    mockGetUser.mockResolvedValue({
      data: { user: { id: mockAdminId, email: 'test@test.com' } },
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

    // Mock supabaseAdmin calls in the route handler
    let callCount = 0;
    (supabaseAdmin.from as jest.Mock).mockImplementation((table: string) => {
      callCount++;
      if (callCount === 1 && table === 'profiles') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { user_role: 'admin' },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === 'campsites') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockPendingCampsite,
                  error: null,
                }),
              }),
            }),
          }),
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        };
      }
      if (table === 'moderation_logs') {
        return {
          insert: jest.fn().mockResolvedValue({ data: null, error: null }),
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
    });
  };

  describe('Authentication/Authorization', () => {
    it('should return 401 when no token is provided', async () => {
      const response = await request(app)
        .post(`/api/admin/campsites/${mockCampsiteId}/approve`);

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
        .post(`/api/admin/campsites/${mockCampsiteId}/approve`)
        .set('Authorization', `Bearer invalid-token`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 403 for non-admin users (regular user)', async () => {
      mockAuth(mockUserId, 'user');

      const response = await request(app)
        .post(`/api/admin/campsites/${mockCampsiteId}/approve`)
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Forbidden');
    });

    it('should return 403 for non-admin users (owner role)', async () => {
      mockAuth(mockOwnerId, 'owner');

      const response = await request(app)
        .post(`/api/admin/campsites/${mockCampsiteId}/approve`)
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Forbidden');
    });

    it('should return 200 for admin users', async () => {
      mockAuth(mockAdminId, 'admin');

      // Mock successful campsite fetch
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockPendingCampsite,
                error: null,
              }),
            }),
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
        insert: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      });

      const response = await request(app)
        .post(`/api/admin/campsites/${mockCampsiteId}/approve`)
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Campsite Validation', () => {
    beforeEach(() => {
      mockAuth(mockAdminId, 'admin');
    });

    it('should return 404 for non-existent campsite ID', async () => {
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Not found' },
              }),
            }),
          }),
        }),
      });

      const response = await request(app)
        .post(`/api/admin/campsites/non-existent-id/approve`)
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });

    it('should return 404 for campsite not in pending status', async () => {
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          }),
        }),
      });

      const response = await request(app)
        .post(`/api/admin/campsites/${mockCampsiteId}/approve`)
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not pending');
    });

    it('should return 404 for already approved campsite', async () => {
      // Mock returns null because the query filters by status='pending'
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          }),
        }),
      });

      const response = await request(app)
        .post(`/api/admin/campsites/${mockCampsiteId}/approve`)
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not pending');
    });

    it('should return 404 for rejected campsite', async () => {
      // Mock returns null because the query filters by status='pending'
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          }),
        }),
      });

      const response = await request(app)
        .post(`/api/admin/campsites/${mockCampsiteId}/approve`)
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not pending');
    });
  });

  describe('Successful Approval', () => {
    beforeEach(() => {
      mockAuth(mockAdminId, 'admin');
      jest.clearAllMocks();
    });

    it('should update campsite status to approved', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      });

      (supabaseAdmin.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'campsites') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: mockPendingCampsite,
                    error: null,
                  }),
                }),
              }),
            }),
            update: mockUpdate,
          };
        }
        return {
          insert: jest.fn().mockResolvedValue({ data: null, error: null }),
        };
      });

      await request(app)
        .post(`/api/admin/campsites/${mockCampsiteId}/approve`)
        .set('Authorization', `Bearer ${mockToken}`);

      expect(mockUpdate).toHaveBeenCalledWith({
        status: 'approved',
        updated_at: expect.any(String),
      });
    });

    it('should update campsite updated_at timestamp', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      });

      (supabaseAdmin.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'campsites') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: mockPendingCampsite,
                    error: null,
                  }),
                }),
              }),
            }),
            update: mockUpdate,
          };
        }
        return {
          insert: jest.fn().mockResolvedValue({ data: null, error: null }),
        };
      });

      const beforeTime = new Date().toISOString();

      await request(app)
        .post(`/api/admin/campsites/${mockCampsiteId}/approve`)
        .set('Authorization', `Bearer ${mockToken}`);

      const afterTime = new Date().toISOString();

      expect(mockUpdate).toHaveBeenCalled();
      const updateCall = mockUpdate.mock.calls[0][0];
      expect(updateCall).toHaveProperty('updated_at');
      expect(updateCall.updated_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should create moderation log entry with correct data', async () => {
      const mockInsert = jest.fn().mockResolvedValue({ data: null, error: null });

      (supabaseAdmin.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'campsites') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: mockPendingCampsite,
                    error: null,
                  }),
                }),
              }),
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: null,
                error: null,
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

      await request(app)
        .post(`/api/admin/campsites/${mockCampsiteId}/approve`)
        .set('Authorization', `Bearer ${mockToken}`);

      expect(mockInsert).toHaveBeenCalledWith({
        admin_id: mockAdminId,
        action_type: 'campsite_approve',
        entity_type: 'campsite',
        entity_id: mockCampsiteId,
        reason: null,
      });
    });

    it('should call notification service with correct params', async () => {
      (supabaseAdmin.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'campsites') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: mockPendingCampsite,
                    error: null,
                  }),
                }),
              }),
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: null,
                error: null,
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
        .post(`/api/admin/campsites/${mockCampsiteId}/approve`)
        .set('Authorization', `Bearer ${mockToken}`);

      expect(notificationService.notifyCampsiteApproved).toHaveBeenCalledWith(
        mockOwnerId,
        'Test Campsite',
        mockCampsiteId
      );
    });

    it('should return correct response structure on success', async () => {
      (supabaseAdmin.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'campsites') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: mockPendingCampsite,
                    error: null,
                  }),
                }),
              }),
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          };
        }
        return {
          insert: jest.fn().mockResolvedValue({ data: null, error: null }),
        };
      });

      const response = await request(app)
        .post(`/api/admin/campsites/${mockCampsiteId}/approve`)
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        campsite_id: mockCampsiteId,
        new_status: 'approved',
        message: 'Campsite approved successfully',
      });
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      jest.clearAllMocks();

      // Reset mock functions before calling mockAuth
      mockGetUser.mockReset();
      mockFrom.mockReset();
      (supabaseAdmin.from as jest.Mock).mockReset();

      mockAuth(mockAdminId, 'admin');
    });

    it('should handle database errors gracefully during fetch', async () => {
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Database connection failed' },
              }),
            }),
          }),
        }),
      });

      const response = await request(app)
        .post(`/api/admin/campsites/${mockCampsiteId}/approve`)
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should return 500 on Supabase update error', async () => {
      (supabaseAdmin.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'campsites') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: mockPendingCampsite,
                    error: null,
                  }),
                }),
              }),
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Update failed' },
              }),
            }),
          };
        }
        return {};
      });

      const response = await request(app)
        .post(`/api/admin/campsites/${mockCampsiteId}/approve`)
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to approve campsite');
    });

    it('should handle moderation log insert failure gracefully', async () => {
      (supabaseAdmin.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'campsites') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: mockPendingCampsite,
                    error: null,
                  }),
                }),
              }),
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: null,
                error: null,
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

      const response = await request(app)
        .post(`/api/admin/campsites/${mockCampsiteId}/approve`)
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    it('should handle notification service failure gracefully', async () => {
      (supabaseAdmin.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'campsites') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: mockPendingCampsite,
                    error: null,
                  }),
                }),
              }),
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: null,
                error: null,
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

      (notificationService.notifyCampsiteApproved as jest.Mock).mockRejectedValue(
        new Error('Notification failed')
      );

      const response = await request(app)
        .post(`/api/admin/campsites/${mockCampsiteId}/approve`)
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Response Format', () => {
    beforeEach(() => {
      jest.clearAllMocks();

      // Reset all mock functions
      mockGetUser.mockReset();
      mockFrom.mockReset();
      (supabaseAdmin.from as jest.Mock).mockReset();
      (notificationService.notifyCampsiteApproved as jest.Mock).mockReset();
    });

    it('should return success: true on success', async () => {
      mockSuccessfulApprovalFlow();
      (notificationService.notifyCampsiteApproved as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .post(`/api/admin/campsites/${mockCampsiteId}/approve`)
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.body).toHaveProperty('success', true);
    });

    it('should return campsite_id in response', async () => {
      mockSuccessfulApprovalFlow();
      (notificationService.notifyCampsiteApproved as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .post(`/api/admin/campsites/${mockCampsiteId}/approve`)
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.body).toHaveProperty('campsite_id', mockCampsiteId);
    });

    it('should return new_status: approved', async () => {
      mockSuccessfulApprovalFlow();
      (notificationService.notifyCampsiteApproved as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .post(`/api/admin/campsites/${mockCampsiteId}/approve`)
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.body).toHaveProperty('new_status', 'approved');
    });

    it('should return appropriate message', async () => {
      mockSuccessfulApprovalFlow();
      (notificationService.notifyCampsiteApproved as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .post(`/api/admin/campsites/${mockCampsiteId}/approve`)
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Campsite approved successfully');
    });
  });

  describe('Integration Tests', () => {
    beforeEach(() => {
      jest.clearAllMocks();

      // Reset all mock functions
      mockGetUser.mockReset();
      mockFrom.mockReset();
      (supabaseAdmin.from as jest.Mock).mockReset();
      (notificationService.notifyCampsiteApproved as jest.Mock).mockReset();
    });

    it('should complete full approval workflow successfully', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      });

      const mockInsert = jest.fn().mockResolvedValue({ data: null, error: null });

      let callCount = 0;
      (supabaseAdmin.from as jest.Mock).mockImplementation((table: string) => {
        callCount++;
        if (callCount === 1 && table === 'profiles') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { user_role: 'admin' },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'campsites') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: mockPendingCampsite,
                    error: null,
                  }),
                }),
              }),
            }),
            update: mockUpdate,
          };
        }
        if (table === 'moderation_logs') {
          return {
            insert: mockInsert,
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
        };
      });

      mockGetUser.mockResolvedValue({
        data: { user: { id: mockAdminId, email: 'test@test.com' } },
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

      (notificationService.notifyCampsiteApproved as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .post(`/api/admin/campsites/${mockCampsiteId}/approve`)
        .set('Authorization', `Bearer ${mockToken}`);

      // Verify all steps completed
      expect(response.status).toBe(200);
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockInsert).toHaveBeenCalled();
      expect(notificationService.notifyCampsiteApproved).toHaveBeenCalled();
      expect(response.body.success).toBe(true);
    });

    it('should handle multiple approval attempts for same campsite', async () => {
      mockSuccessfulApprovalFlow();
      (notificationService.notifyCampsiteApproved as jest.Mock).mockResolvedValue(undefined);

      // First approval
      const response1 = await request(app)
        .post(`/api/admin/campsites/${mockCampsiteId}/approve`)
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response1.status).toBe(200);

      // Second approval attempt (should fail because status changed to approved)
      jest.clearAllMocks();
      mockGetUser.mockReset();
      mockFrom.mockReset();
      (supabaseAdmin.from as jest.Mock).mockReset();

      let callCount = 0;
      (supabaseAdmin.from as jest.Mock).mockImplementation((table: string) => {
        callCount++;
        if (callCount === 1 && table === 'profiles') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { user_role: 'admin' },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'campsites') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: null, // No longer pending
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
        };
      });

      mockGetUser.mockResolvedValue({
        data: { user: { id: mockAdminId, email: 'test@test.com' } },
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

      const response2 = await request(app)
        .post(`/api/admin/campsites/${mockCampsiteId}/approve`)
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response2.status).toBe(404);
      expect(response2.body.success).toBe(false);
    });
  });
});
