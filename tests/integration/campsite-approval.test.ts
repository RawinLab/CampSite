/**
 * Integration Test: Campsite Approval Workflow End-to-End
 * Task T009: Integration test for campsite approval workflow
 *
 * Tests the complete approval workflow from pending to approved/rejected
 * Q8: Admin approval required for campsites
 */

// Mock Supabase client
jest.mock('../../apps/campsite-backend/src/lib/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(),
  },
}));

// Mock auth middleware
jest.mock('../../apps/campsite-backend/src/middleware/auth', () => ({
  authMiddleware: (req: any, res: any, next: any) => {
    if (!req.headers.authorization) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const userId = req.headers.authorization.replace('Bearer ', '');
    const role = req.headers['x-user-role'] || 'user';
    req.user = { id: userId, role };
    next();
  },
  optionalAuthMiddleware: (req: any, res: any, next: any) => {
    if (req.headers.authorization) {
      const userId = req.headers.authorization.replace('Bearer ', '');
      const role = req.headers['x-user-role'] || 'user';
      req.user = { id: userId, role };
    }
    next();
  },
}));

// Mock role guard middleware
jest.mock('../../apps/campsite-backend/src/middleware/roleGuard', () => ({
  requireAdmin: (req: any, res: any, next: any) => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  },
  requireOwner: (req: any, res: any, next: any) => {
    if (req.user?.role !== 'admin' && req.user?.role !== 'owner') {
      return res.status(403).json({ error: 'Owner access required' });
    }
    next();
  },
  requireUser: (req: any, res: any, next: any) => {
    next();
  },
  requireRole: (...allowedRoles: string[]) => {
    return (req: any, res: any, next: any) => {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      next();
    };
  },
}));

// Mock notification service
jest.mock('../../apps/campsite-backend/src/services/notification.service', () => ({
  notifyCampsiteApproved: jest.fn().mockResolvedValue(undefined),
  notifyCampsiteRejected: jest.fn().mockResolvedValue(undefined),
}));

import request from 'supertest';
import app from '../../apps/campsite-backend/src/app';
import { supabaseAdmin } from '../../apps/campsite-backend/src/lib/supabase';

const {
  notifyCampsiteApproved,
  notifyCampsiteRejected,
} = require('../../apps/campsite-backend/src/services/notification.service');

describe('Integration: Campsite Approval Workflow', () => {
  const mockAdminId = 'admin-123-456-789';
  const mockOwnerId = 'owner-123-456-789';
  const mockCampsiteId = 'campsite-123-456-789';
  const mockProvinceId = 2;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // 1. List Pending Campsites
  // ============================================

  describe('GET /api/admin/campsites/pending - List Pending Campsites', () => {
    // Test 1: Returns only status='pending' campsites
    it('should return only pending campsites', async () => {
      const mockPendingCampsites = [
        {
          id: 'campsite-1',
          name: 'Pending Campsite 1',
          status: 'pending',
          owner_id: mockOwnerId,
          province_id: mockProvinceId,
          created_at: new Date().toISOString(),
          owner: { id: mockOwnerId, full_name: 'Test Owner', avatar_url: null },
          province: { id: mockProvinceId, name_th: 'เชียงใหม่', name_en: 'Chiang Mai' },
          photos: [{ count: 3 }],
        },
      ];

      // Mock count query
      const mockCountSelect = jest.fn().mockReturnThis();
      const mockCountEq = jest.fn().mockResolvedValue({ count: 1, error: null });

      // Mock data query
      const mockDataSelect = jest.fn().mockReturnThis();
      const mockDataEq = jest.fn().mockReturnThis();
      const mockDataOrder = jest.fn().mockReturnThis();
      const mockDataRange = jest.fn().mockResolvedValue({
        data: mockPendingCampsites,
        error: null,
      });

      (supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce({
          select: mockCountSelect.mockReturnValue({
            eq: mockCountEq,
          }),
        })
        .mockReturnValueOnce({
          select: mockDataSelect.mockReturnValue({
            eq: mockDataEq.mockReturnValue({
              order: mockDataOrder.mockReturnValue({
                range: mockDataRange,
              }),
            }),
          }),
        });

      const response = await request(app)
        .get('/api/admin/campsites/pending')
        .set('Authorization', `Bearer ${mockAdminId}`)
        .set('X-User-Role', 'admin');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].status).toBe('pending');
      expect(mockCountEq).toHaveBeenCalledWith('status', 'pending');
      expect(mockDataEq).toHaveBeenCalledWith('status', 'pending');
    });

    // Test 2: Returns empty array when none pending
    it('should return empty array when no pending campsites', async () => {
      // Mock count query
      const mockCountSelect = jest.fn().mockReturnThis();
      const mockCountEq = jest.fn().mockResolvedValue({ count: 0, error: null });

      // Mock data query
      const mockDataSelect = jest.fn().mockReturnThis();
      const mockDataEq = jest.fn().mockReturnThis();
      const mockDataOrder = jest.fn().mockReturnThis();
      const mockDataRange = jest.fn().mockResolvedValue({ data: [], error: null });

      (supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce({
          select: mockCountSelect.mockReturnValue({
            eq: mockCountEq,
          }),
        })
        .mockReturnValueOnce({
          select: mockDataSelect.mockReturnValue({
            eq: mockDataEq.mockReturnValue({
              order: mockDataOrder.mockReturnValue({
                range: mockDataRange,
              }),
            }),
          }),
        });

      const response = await request(app)
        .get('/api/admin/campsites/pending')
        .set('Authorization', `Bearer ${mockAdminId}`)
        .set('X-User-Role', 'admin');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
      expect(response.body.pagination.total).toBe(0);
    });

    // Test 3: Includes owner info in response
    it('should include owner info in response', async () => {
      const mockPendingCampsites = [
        {
          id: 'campsite-1',
          name: 'Test Campsite',
          status: 'pending',
          owner_id: mockOwnerId,
          province_id: mockProvinceId,
          created_at: new Date().toISOString(),
          owner: {
            id: mockOwnerId,
            full_name: 'John Doe',
            avatar_url: 'https://example.com/avatar.jpg',
          },
          province: { id: mockProvinceId, name_th: 'เชียงใหม่', name_en: 'Chiang Mai' },
          photos: [{ count: 2 }],
        },
      ];

      // Mock count query
      const mockCountSelect = jest.fn().mockReturnThis();
      const mockCountEq = jest.fn().mockResolvedValue({ count: 1, error: null });

      // Mock data query
      const mockDataSelect = jest.fn().mockReturnThis();
      const mockDataEq = jest.fn().mockReturnThis();
      const mockDataOrder = jest.fn().mockReturnThis();
      const mockDataRange = jest.fn().mockResolvedValue({
        data: mockPendingCampsites,
        error: null,
      });

      (supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce({
          select: mockCountSelect.mockReturnValue({
            eq: mockCountEq,
          }),
        })
        .mockReturnValueOnce({
          select: mockDataSelect.mockReturnValue({
            eq: mockDataEq.mockReturnValue({
              order: mockDataOrder.mockReturnValue({
                range: mockDataRange,
              }),
            }),
          }),
        });

      const response = await request(app)
        .get('/api/admin/campsites/pending')
        .set('Authorization', `Bearer ${mockAdminId}`)
        .set('X-User-Role', 'admin');

      expect(response.status).toBe(200);
      expect(response.body.data[0]).toHaveProperty('owner_name', 'John Doe');
      expect(response.body.data[0]).toHaveProperty('owner_id', mockOwnerId);
    });

    // Test 4: Includes province info
    it('should include province info in response', async () => {
      const mockPendingCampsites = [
        {
          id: 'campsite-1',
          name: 'Test Campsite',
          status: 'pending',
          owner_id: mockOwnerId,
          province_id: mockProvinceId,
          created_at: new Date().toISOString(),
          owner: { id: mockOwnerId, full_name: 'Test Owner', avatar_url: null },
          province: { id: mockProvinceId, name_th: 'เชียงใหม่', name_en: 'Chiang Mai' },
          photos: [{ count: 2 }],
        },
      ];

      // Mock count query
      const mockCountSelect = jest.fn().mockReturnThis();
      const mockCountEq = jest.fn().mockResolvedValue({ count: 1, error: null });

      // Mock data query
      const mockDataSelect = jest.fn().mockReturnThis();
      const mockDataEq = jest.fn().mockReturnThis();
      const mockDataOrder = jest.fn().mockReturnThis();
      const mockDataRange = jest.fn().mockResolvedValue({
        data: mockPendingCampsites,
        error: null,
      });

      (supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce({
          select: mockCountSelect.mockReturnValue({
            eq: mockCountEq,
          }),
        })
        .mockReturnValueOnce({
          select: mockDataSelect.mockReturnValue({
            eq: mockDataEq.mockReturnValue({
              order: mockDataOrder.mockReturnValue({
                range: mockDataRange,
              }),
            }),
          }),
        });

      const response = await request(app)
        .get('/api/admin/campsites/pending')
        .set('Authorization', `Bearer ${mockAdminId}`)
        .set('X-User-Role', 'admin');

      expect(response.status).toBe(200);
      expect(response.body.data[0]).toHaveProperty('province_name', 'Chiang Mai');
      expect(response.body.data[0]).toHaveProperty('province_id', mockProvinceId);
    });

    // Test 5: Supports pagination
    it('should support pagination', async () => {
      // Mock count query
      const mockCountSelect = jest.fn().mockReturnThis();
      const mockCountEq = jest.fn().mockResolvedValue({ count: 25, error: null });

      // Mock data query
      const mockDataSelect = jest.fn().mockReturnThis();
      const mockDataEq = jest.fn().mockReturnThis();
      const mockDataOrder = jest.fn().mockReturnThis();
      const mockDataRange = jest.fn().mockResolvedValue({ data: [], error: null });

      (supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce({
          select: mockCountSelect.mockReturnValue({
            eq: mockCountEq,
          }),
        })
        .mockReturnValueOnce({
          select: mockDataSelect.mockReturnValue({
            eq: mockDataEq.mockReturnValue({
              order: mockDataOrder.mockReturnValue({
                range: mockDataRange,
              }),
            }),
          }),
        });

      const response = await request(app)
        .get('/api/admin/campsites/pending?page=2&limit=10')
        .set('Authorization', `Bearer ${mockAdminId}`)
        .set('X-User-Role', 'admin');

      expect(response.status).toBe(200);
      expect(response.body.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3,
      });
      expect(mockDataRange).toHaveBeenCalledWith(10, 19);
    });

    // Test 6: Supports sorting by submitted_at
    it('should support sorting by submitted_at', async () => {
      // Mock count query
      const mockCountSelect = jest.fn().mockReturnThis();
      const mockCountEq = jest.fn().mockResolvedValue({ count: 1, error: null });

      // Mock data query
      const mockDataSelect = jest.fn().mockReturnThis();
      const mockDataEq = jest.fn().mockReturnThis();
      const mockDataOrder = jest.fn().mockReturnThis();
      const mockDataRange = jest.fn().mockResolvedValue({ data: [], error: null });

      (supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce({
          select: mockCountSelect.mockReturnValue({
            eq: mockCountEq,
          }),
        })
        .mockReturnValueOnce({
          select: mockDataSelect.mockReturnValue({
            eq: mockDataEq.mockReturnValue({
              order: mockDataOrder.mockReturnValue({
                range: mockDataRange,
              }),
            }),
          }),
        });

      await request(app)
        .get('/api/admin/campsites/pending?sort_by=submitted_at&sort_order=desc')
        .set('Authorization', `Bearer ${mockAdminId}`)
        .set('X-User-Role', 'admin');

      expect(mockDataOrder).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    // Test 7: Only accessible by admin
    it('should reject non-admin users', async () => {
      const response = await request(app)
        .get('/api/admin/campsites/pending')
        .set('Authorization', `Bearer user-123`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Admin access required');
    });
  });

  // ============================================
  // 2. Approve Workflow
  // ============================================

  describe('POST /api/admin/campsites/:id/approve - Approve Workflow', () => {
    // Test 8: Pending campsite can be approved
    it('should successfully approve a pending campsite', async () => {
      const mockCampsite = {
        id: mockCampsiteId,
        name: 'Test Campsite',
        status: 'pending',
        owner_id: mockOwnerId,
        owner: { id: mockOwnerId, full_name: 'Test Owner' },
      };

      // Mock: Get campsite
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq1 = jest.fn().mockReturnThis();
      const mockEq2 = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ data: mockCampsite, error: null });

      // Mock: Update campsite
      const mockUpdate = jest.fn().mockReturnThis();
      const mockUpdateEq = jest.fn().mockResolvedValue({ error: null });

      // Mock: Insert moderation log
      const mockInsert = jest.fn().mockResolvedValue({ error: null });

      (supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce({
          select: mockSelect.mockReturnValue({
            eq: mockEq1.mockReturnValue({
              eq: mockEq2.mockReturnValue({
                single: mockSingle,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          update: mockUpdate.mockReturnValue({
            eq: mockUpdateEq,
          }),
        })
        .mockReturnValueOnce({
          insert: mockInsert,
        });

      const response = await request(app)
        .post(`/api/admin/campsites/${mockCampsiteId}/approve`)
        .set('Authorization', `Bearer ${mockAdminId}`)
        .set('X-User-Role', 'admin');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.new_status).toBe('approved');
      expect(response.body.campsite_id).toBe(mockCampsiteId);
    });

    // Test 9: Status changes from 'pending' to 'approved'
    it('should change status from pending to approved', async () => {
      const mockCampsite = {
        id: mockCampsiteId,
        name: 'Test Campsite',
        status: 'pending',
        owner_id: mockOwnerId,
        owner: { id: mockOwnerId, full_name: 'Test Owner' },
      };

      // Mock: Get campsite
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq1 = jest.fn().mockReturnThis();
      const mockEq2 = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ data: mockCampsite, error: null });

      // Mock: Update campsite
      const mockUpdate = jest.fn().mockReturnThis();
      const mockUpdateEq = jest.fn().mockResolvedValue({ error: null });

      // Mock: Insert moderation log
      const mockInsert = jest.fn().mockResolvedValue({ error: null });

      (supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce({
          select: mockSelect.mockReturnValue({
            eq: mockEq1.mockReturnValue({
              eq: mockEq2.mockReturnValue({
                single: mockSingle,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          update: mockUpdate.mockReturnValue({
            eq: mockUpdateEq,
          }),
        })
        .mockReturnValueOnce({
          insert: mockInsert,
        });

      await request(app)
        .post(`/api/admin/campsites/${mockCampsiteId}/approve`)
        .set('Authorization', `Bearer ${mockAdminId}`)
        .set('X-User-Role', 'admin');

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'approved',
        })
      );
    });

    // Test 10: Moderation log created
    it('should create moderation log on approval', async () => {
      const mockCampsite = {
        id: mockCampsiteId,
        name: 'Test Campsite',
        status: 'pending',
        owner_id: mockOwnerId,
        owner: { id: mockOwnerId, full_name: 'Test Owner' },
      };

      // Mock: Get campsite
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq1 = jest.fn().mockReturnThis();
      const mockEq2 = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ data: mockCampsite, error: null });

      // Mock: Update campsite
      const mockUpdate = jest.fn().mockReturnThis();
      const mockUpdateEq = jest.fn().mockResolvedValue({ error: null });

      // Mock: Insert moderation log
      const mockInsert = jest.fn().mockResolvedValue({ error: null });

      (supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce({
          select: mockSelect.mockReturnValue({
            eq: mockEq1.mockReturnValue({
              eq: mockEq2.mockReturnValue({
                single: mockSingle,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          update: mockUpdate.mockReturnValue({
            eq: mockUpdateEq,
          }),
        })
        .mockReturnValueOnce({
          insert: mockInsert,
        });

      await request(app)
        .post(`/api/admin/campsites/${mockCampsiteId}/approve`)
        .set('Authorization', `Bearer ${mockAdminId}`)
        .set('X-User-Role', 'admin');

      expect(supabaseAdmin.from).toHaveBeenCalledWith('moderation_logs');
      expect(mockInsert).toHaveBeenCalledWith({
        admin_id: mockAdminId,
        action_type: 'campsite_approve',
        entity_type: 'campsite',
        entity_id: mockCampsiteId,
        reason: null,
      });
    });

    // Test 11: Notification sent to owner
    it('should send notification to owner on approval', async () => {
      const mockCampsite = {
        id: mockCampsiteId,
        name: 'Test Campsite',
        status: 'pending',
        owner_id: mockOwnerId,
        owner: { id: mockOwnerId, full_name: 'Test Owner' },
      };

      // Mock: Get campsite
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq1 = jest.fn().mockReturnThis();
      const mockEq2 = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ data: mockCampsite, error: null });

      // Mock: Update campsite
      const mockUpdate = jest.fn().mockReturnThis();
      const mockUpdateEq = jest.fn().mockResolvedValue({ error: null });

      // Mock: Insert moderation log
      const mockInsert = jest.fn().mockResolvedValue({ error: null });

      (supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce({
          select: mockSelect.mockReturnValue({
            eq: mockEq1.mockReturnValue({
              eq: mockEq2.mockReturnValue({
                single: mockSingle,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          update: mockUpdate.mockReturnValue({
            eq: mockUpdateEq,
          }),
        })
        .mockReturnValueOnce({
          insert: mockInsert,
        });

      await request(app)
        .post(`/api/admin/campsites/${mockCampsiteId}/approve`)
        .set('Authorization', `Bearer ${mockAdminId}`)
        .set('X-User-Role', 'admin');

      expect(notifyCampsiteApproved).toHaveBeenCalledWith(
        mockOwnerId,
        'Test Campsite',
        mockCampsiteId
      );
    });

    // Test 12: Cannot approve non-pending campsite
    it('should reject approval of non-pending campsite', async () => {
      // Mock: Get campsite - not pending
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq1 = jest.fn().mockReturnThis();
      const mockEq2 = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ data: null, error: null });

      (supabaseAdmin.from as jest.Mock).mockReturnValueOnce({
        select: mockSelect.mockReturnValue({
          eq: mockEq1.mockReturnValue({
            eq: mockEq2.mockReturnValue({
              single: mockSingle,
            }),
          }),
        }),
      });

      const response = await request(app)
        .post(`/api/admin/campsites/${mockCampsiteId}/approve`)
        .set('Authorization', `Bearer ${mockAdminId}`)
        .set('X-User-Role', 'admin');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Campsite not found or not pending');
    });
  });

  // ============================================
  // 3. Reject Workflow
  // ============================================

  describe('POST /api/admin/campsites/:id/reject - Reject Workflow', () => {
    // Test 13: Pending campsite can be rejected
    it('should successfully reject a pending campsite', async () => {
      const mockCampsite = {
        id: mockCampsiteId,
        name: 'Test Campsite',
        status: 'pending',
        owner_id: mockOwnerId,
        owner: { id: mockOwnerId, full_name: 'Test Owner' },
      };

      // Mock: Get campsite
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq1 = jest.fn().mockReturnThis();
      const mockEq2 = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ data: mockCampsite, error: null });

      // Mock: Update campsite
      const mockUpdate = jest.fn().mockReturnThis();
      const mockUpdateEq = jest.fn().mockResolvedValue({ error: null });

      // Mock: Insert moderation log
      const mockInsert = jest.fn().mockResolvedValue({ error: null });

      (supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce({
          select: mockSelect.mockReturnValue({
            eq: mockEq1.mockReturnValue({
              eq: mockEq2.mockReturnValue({
                single: mockSingle,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          update: mockUpdate.mockReturnValue({
            eq: mockUpdateEq,
          }),
        })
        .mockReturnValueOnce({
          insert: mockInsert,
        });

      const response = await request(app)
        .post(`/api/admin/campsites/${mockCampsiteId}/reject`)
        .set('Authorization', `Bearer ${mockAdminId}`)
        .set('X-User-Role', 'admin')
        .send({
          rejection_reason: 'Incomplete information',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.new_status).toBe('rejected');
    });

    // Test 14: Status changes from 'pending' to 'rejected'
    it('should change status from pending to rejected', async () => {
      const mockCampsite = {
        id: mockCampsiteId,
        name: 'Test Campsite',
        status: 'pending',
        owner_id: mockOwnerId,
        owner: { id: mockOwnerId, full_name: 'Test Owner' },
      };

      // Mock: Get campsite
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq1 = jest.fn().mockReturnThis();
      const mockEq2 = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ data: mockCampsite, error: null });

      // Mock: Update campsite
      const mockUpdate = jest.fn().mockReturnThis();
      const mockUpdateEq = jest.fn().mockResolvedValue({ error: null });

      // Mock: Insert moderation log
      const mockInsert = jest.fn().mockResolvedValue({ error: null });

      (supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce({
          select: mockSelect.mockReturnValue({
            eq: mockEq1.mockReturnValue({
              eq: mockEq2.mockReturnValue({
                single: mockSingle,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          update: mockUpdate.mockReturnValue({
            eq: mockUpdateEq,
          }),
        })
        .mockReturnValueOnce({
          insert: mockInsert,
        });

      await request(app)
        .post(`/api/admin/campsites/${mockCampsiteId}/reject`)
        .set('Authorization', `Bearer ${mockAdminId}`)
        .set('X-User-Role', 'admin')
        .send({
          rejection_reason: 'Invalid location',
        });

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'rejected',
          rejection_reason: 'Invalid location',
        })
      );
    });

    // Test 15: Rejection reason is stored
    it('should store rejection reason', async () => {
      const mockCampsite = {
        id: mockCampsiteId,
        name: 'Test Campsite',
        status: 'pending',
        owner_id: mockOwnerId,
        owner: { id: mockOwnerId, full_name: 'Test Owner' },
      };

      // Mock: Get campsite
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq1 = jest.fn().mockReturnThis();
      const mockEq2 = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ data: mockCampsite, error: null });

      // Mock: Update campsite
      const mockUpdate = jest.fn().mockReturnThis();
      const mockUpdateEq = jest.fn().mockResolvedValue({ error: null });

      // Mock: Insert moderation log
      const mockInsert = jest.fn().mockResolvedValue({ error: null });

      (supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce({
          select: mockSelect.mockReturnValue({
            eq: mockEq1.mockReturnValue({
              eq: mockEq2.mockReturnValue({
                single: mockSingle,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          update: mockUpdate.mockReturnValue({
            eq: mockUpdateEq,
          }),
        })
        .mockReturnValueOnce({
          insert: mockInsert,
        });

      const rejectionReason = 'Inappropriate content';

      await request(app)
        .post(`/api/admin/campsites/${mockCampsiteId}/reject`)
        .set('Authorization', `Bearer ${mockAdminId}`)
        .set('X-User-Role', 'admin')
        .send({
          rejection_reason: rejectionReason,
        });

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          rejection_reason: rejectionReason,
        })
      );
    });

    // Test 16: Moderation log created with reason
    it('should create moderation log with reason on rejection', async () => {
      const mockCampsite = {
        id: mockCampsiteId,
        name: 'Test Campsite',
        status: 'pending',
        owner_id: mockOwnerId,
        owner: { id: mockOwnerId, full_name: 'Test Owner' },
      };

      // Mock: Get campsite
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq1 = jest.fn().mockReturnThis();
      const mockEq2 = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ data: mockCampsite, error: null });

      // Mock: Update campsite
      const mockUpdate = jest.fn().mockReturnThis();
      const mockUpdateEq = jest.fn().mockResolvedValue({ error: null });

      // Mock: Insert moderation log
      const mockInsert = jest.fn().mockResolvedValue({ error: null });

      (supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce({
          select: mockSelect.mockReturnValue({
            eq: mockEq1.mockReturnValue({
              eq: mockEq2.mockReturnValue({
                single: mockSingle,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          update: mockUpdate.mockReturnValue({
            eq: mockUpdateEq,
          }),
        })
        .mockReturnValueOnce({
          insert: mockInsert,
        });

      const rejectionReason = 'Missing required photos';

      await request(app)
        .post(`/api/admin/campsites/${mockCampsiteId}/reject`)
        .set('Authorization', `Bearer ${mockAdminId}`)
        .set('X-User-Role', 'admin')
        .send({
          rejection_reason: rejectionReason,
        });

      expect(mockInsert).toHaveBeenCalledWith({
        admin_id: mockAdminId,
        action_type: 'campsite_reject',
        entity_type: 'campsite',
        entity_id: mockCampsiteId,
        reason: rejectionReason,
      });
    });

    // Test 17: Notification sent to owner with reason
    it('should send notification to owner with reason on rejection', async () => {
      const mockCampsite = {
        id: mockCampsiteId,
        name: 'Test Campsite',
        status: 'pending',
        owner_id: mockOwnerId,
        owner: { id: mockOwnerId, full_name: 'Test Owner' },
      };

      // Mock: Get campsite
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq1 = jest.fn().mockReturnThis();
      const mockEq2 = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ data: mockCampsite, error: null });

      // Mock: Update campsite
      const mockUpdate = jest.fn().mockReturnThis();
      const mockUpdateEq = jest.fn().mockResolvedValue({ error: null });

      // Mock: Insert moderation log
      const mockInsert = jest.fn().mockResolvedValue({ error: null });

      (supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce({
          select: mockSelect.mockReturnValue({
            eq: mockEq1.mockReturnValue({
              eq: mockEq2.mockReturnValue({
                single: mockSingle,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          update: mockUpdate.mockReturnValue({
            eq: mockUpdateEq,
          }),
        })
        .mockReturnValueOnce({
          insert: mockInsert,
        });

      const rejectionReason = 'Invalid business registration';

      await request(app)
        .post(`/api/admin/campsites/${mockCampsiteId}/reject`)
        .set('Authorization', `Bearer ${mockAdminId}`)
        .set('X-User-Role', 'admin')
        .send({
          rejection_reason: rejectionReason,
        });

      expect(notifyCampsiteRejected).toHaveBeenCalledWith(
        mockOwnerId,
        'Test Campsite',
        mockCampsiteId,
        rejectionReason
      );
    });

    // Test 18: Cannot reject without reason
    it('should require rejection reason', async () => {
      const response = await request(app)
        .post(`/api/admin/campsites/${mockCampsiteId}/reject`)
        .set('Authorization', `Bearer ${mockAdminId}`)
        .set('X-User-Role', 'admin')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  // ============================================
  // 4. State Transitions
  // ============================================

  describe('State Transitions', () => {
    // Test 19: pending → approved (valid)
    it('should allow pending to approved transition', async () => {
      const mockCampsite = {
        id: mockCampsiteId,
        name: 'Test Campsite',
        status: 'pending',
        owner_id: mockOwnerId,
        owner: { id: mockOwnerId, full_name: 'Test Owner' },
      };

      // Mock: Get campsite
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq1 = jest.fn().mockReturnThis();
      const mockEq2 = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ data: mockCampsite, error: null });

      // Mock: Update campsite
      const mockUpdate = jest.fn().mockReturnThis();
      const mockUpdateEq = jest.fn().mockResolvedValue({ error: null });

      // Mock: Insert moderation log
      const mockInsert = jest.fn().mockResolvedValue({ error: null });

      (supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce({
          select: mockSelect.mockReturnValue({
            eq: mockEq1.mockReturnValue({
              eq: mockEq2.mockReturnValue({
                single: mockSingle,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          update: mockUpdate.mockReturnValue({
            eq: mockUpdateEq,
          }),
        })
        .mockReturnValueOnce({
          insert: mockInsert,
        });

      const response = await request(app)
        .post(`/api/admin/campsites/${mockCampsiteId}/approve`)
        .set('Authorization', `Bearer ${mockAdminId}`)
        .set('X-User-Role', 'admin');

      expect(response.status).toBe(200);
      expect(response.body.new_status).toBe('approved');
    });

    // Test 20: pending → rejected (valid)
    it('should allow pending to rejected transition', async () => {
      const mockCampsite = {
        id: mockCampsiteId,
        name: 'Test Campsite',
        status: 'pending',
        owner_id: mockOwnerId,
        owner: { id: mockOwnerId, full_name: 'Test Owner' },
      };

      // Mock: Get campsite
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq1 = jest.fn().mockReturnThis();
      const mockEq2 = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ data: mockCampsite, error: null });

      // Mock: Update campsite
      const mockUpdate = jest.fn().mockReturnThis();
      const mockUpdateEq = jest.fn().mockResolvedValue({ error: null });

      // Mock: Insert moderation log
      const mockInsert = jest.fn().mockResolvedValue({ error: null });

      (supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce({
          select: mockSelect.mockReturnValue({
            eq: mockEq1.mockReturnValue({
              eq: mockEq2.mockReturnValue({
                single: mockSingle,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          update: mockUpdate.mockReturnValue({
            eq: mockUpdateEq,
          }),
        })
        .mockReturnValueOnce({
          insert: mockInsert,
        });

      const response = await request(app)
        .post(`/api/admin/campsites/${mockCampsiteId}/reject`)
        .set('Authorization', `Bearer ${mockAdminId}`)
        .set('X-User-Role', 'admin')
        .send({
          rejection_reason: 'Invalid data',
        });

      expect(response.status).toBe(200);
      expect(response.body.new_status).toBe('rejected');
    });

    // Test 21: approved → rejected (invalid)
    it('should prevent approved to rejected transition', async () => {
      // Mock: Get campsite - already approved
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq1 = jest.fn().mockReturnThis();
      const mockEq2 = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ data: null, error: null });

      (supabaseAdmin.from as jest.Mock).mockReturnValueOnce({
        select: mockSelect.mockReturnValue({
          eq: mockEq1.mockReturnValue({
            eq: mockEq2.mockReturnValue({
              single: mockSingle,
            }),
          }),
        }),
      });

      const response = await request(app)
        .post(`/api/admin/campsites/${mockCampsiteId}/reject`)
        .set('Authorization', `Bearer ${mockAdminId}`)
        .set('X-User-Role', 'admin')
        .send({
          rejection_reason: 'Test reason',
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Campsite not found or not pending');
    });

    // Test 22: rejected → approved (invalid)
    it('should prevent rejected to approved transition', async () => {
      // Mock: Get campsite - already rejected
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq1 = jest.fn().mockReturnThis();
      const mockEq2 = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ data: null, error: null });

      (supabaseAdmin.from as jest.Mock).mockReturnValueOnce({
        select: mockSelect.mockReturnValue({
          eq: mockEq1.mockReturnValue({
            eq: mockEq2.mockReturnValue({
              single: mockSingle,
            }),
          }),
        }),
      });

      const response = await request(app)
        .post(`/api/admin/campsites/${mockCampsiteId}/approve`)
        .set('Authorization', `Bearer ${mockAdminId}`)
        .set('X-User-Role', 'admin');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Campsite not found or not pending');
    });
  });

  // ============================================
  // 5. Admin Stats
  // ============================================

  describe('GET /api/admin/stats - Admin Stats', () => {
    // Test 23: pending_campsites count decreases after approval
    it('should decrease pending count after approval', async () => {
      const mockCampsite = {
        id: mockCampsiteId,
        name: 'Test Campsite',
        status: 'pending',
        owner_id: mockOwnerId,
        owner: { id: mockOwnerId, full_name: 'Test Owner' },
      };

      // Mock: Get campsite
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq1 = jest.fn().mockReturnThis();
      const mockEq2 = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ data: mockCampsite, error: null });

      // Mock: Update campsite
      const mockUpdate = jest.fn().mockReturnThis();
      const mockUpdateEq = jest.fn().mockResolvedValue({ error: null });

      // Mock: Insert moderation log
      const mockInsert = jest.fn().mockResolvedValue({ error: null });

      (supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce({
          select: mockSelect.mockReturnValue({
            eq: mockEq1.mockReturnValue({
              eq: mockEq2.mockReturnValue({
                single: mockSingle,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          update: mockUpdate.mockReturnValue({
            eq: mockUpdateEq,
          }),
        })
        .mockReturnValueOnce({
          insert: mockInsert,
        });

      // Approve campsite
      const approveResponse = await request(app)
        .post(`/api/admin/campsites/${mockCampsiteId}/approve`)
        .set('Authorization', `Bearer ${mockAdminId}`)
        .set('X-User-Role', 'admin');

      expect(approveResponse.status).toBe(200);

      // Verify status changed to approved (would no longer be counted as pending)
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'approved',
        })
      );
    });

    // Test 24: pending_campsites count decreases after rejection
    it('should decrease pending count after rejection', async () => {
      const mockCampsite = {
        id: mockCampsiteId,
        name: 'Test Campsite',
        status: 'pending',
        owner_id: mockOwnerId,
        owner: { id: mockOwnerId, full_name: 'Test Owner' },
      };

      // Mock: Get campsite
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq1 = jest.fn().mockReturnThis();
      const mockEq2 = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ data: mockCampsite, error: null });

      // Mock: Update campsite
      const mockUpdate = jest.fn().mockReturnThis();
      const mockUpdateEq = jest.fn().mockResolvedValue({ error: null });

      // Mock: Insert moderation log
      const mockInsert = jest.fn().mockResolvedValue({ error: null });

      (supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce({
          select: mockSelect.mockReturnValue({
            eq: mockEq1.mockReturnValue({
              eq: mockEq2.mockReturnValue({
                single: mockSingle,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          update: mockUpdate.mockReturnValue({
            eq: mockUpdateEq,
          }),
        })
        .mockReturnValueOnce({
          insert: mockInsert,
        });

      // Reject campsite
      const rejectResponse = await request(app)
        .post(`/api/admin/campsites/${mockCampsiteId}/reject`)
        .set('Authorization', `Bearer ${mockAdminId}`)
        .set('X-User-Role', 'admin')
        .send({
          rejection_reason: 'Test reason',
        });

      expect(rejectResponse.status).toBe(200);

      // Verify status changed to rejected (would no longer be counted as pending)
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'rejected',
        })
      );
    });
  });
});
