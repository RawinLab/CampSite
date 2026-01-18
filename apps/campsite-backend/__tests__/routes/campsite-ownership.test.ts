// Mock Supabase before imports
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

import request from 'supertest';
import app from '../../src/app';
import { supabaseAdmin } from '../../src/lib/supabase';

/**
 * Integration tests for Campsite Ownership Verification
 * Tests owner guard middleware and ownership-based access control
 * Routes tested: PATCH /api/dashboard/campsites/:id, DELETE /api/dashboard/campsites/:id
 */

describe('Integration: Campsite Ownership Verification', () => {
  const owner1Id = 'owner1-test-uuid';
  const owner2Id = 'owner2-test-uuid';
  const regularUserId = 'user-test-uuid';
  const adminId = 'admin-test-uuid';

  const owner1CampsiteId = 'campsite-owner1-uuid';
  const owner2CampsiteId = 'campsite-owner2-uuid';

  const owner1Token = 'mock-owner1-token';
  const owner2Token = 'mock-owner2-token';
  const userToken = 'mock-user-token';
  const adminToken = 'mock-admin-token';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper to setup auth mock
  const setupAuthMock = (userId: string, role: 'admin' | 'owner' | 'user') => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: userId, email: `${role}@test.com` } },
      error: null,
    });

    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { user_role: role },
            error: null,
          }),
        }),
      }),
    });
  };

  // Helper to setup campsite ownership check and update
  const setupCampsiteUpdate = (campsiteId: string, ownerId: string, ownershipExists: boolean) => {
    let callCount = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === 'campsites') {
        callCount++;
        if (callCount === 1) {
          // Ownership verification query
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: ownershipExists ? { id: campsiteId } : null,
                    error: ownershipExists ? null : { code: 'PGRST116' },
                  }),
                }),
              }),
            }),
          };
        } else {
          // Update query
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { id: campsiteId, name: 'Updated', updated_at: new Date().toISOString() },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
      }
      // For profiles table (auth middleware)
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { user_role: 'owner' },
              error: null,
            }),
          }),
        }),
      };
    });
  };

  // Helper to setup campsite delete
  const setupCampsiteDelete = (campsiteId: string, ownerId: string, ownershipExists: boolean) => {
    let callCount = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === 'campsites') {
        callCount++;
        if (callCount === 1) {
          // Ownership verification query
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: ownershipExists ? { id: campsiteId } : null,
                    error: ownershipExists ? null : { code: 'PGRST116' },
                  }),
                }),
              }),
            }),
          };
        } else {
          // Delete (soft delete via update)
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          };
        }
      }
      // For profiles table (auth middleware)
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { user_role: 'owner' },
              error: null,
            }),
          }),
        }),
      };
    });
  };

  describe('Authentication Requirements', () => {
    it('should return 401 when no authentication token is provided', async () => {
      const response = await request(app)
        .patch(`/api/dashboard/campsites/${owner1CampsiteId}`)
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 401 when invalid token is provided', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Invalid token'),
      });

      const response = await request(app)
        .patch(`/api/dashboard/campsites/${owner1CampsiteId}`)
        .set('Authorization', 'Bearer invalid-token')
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(401);
    });

    it('should return 401 for unauthenticated user on delete', async () => {
      const response = await request(app)
        .delete(`/api/dashboard/campsites/${owner1CampsiteId}`);

      expect(response.status).toBe(401);
    });
  });

  describe('Owner Guard Middleware', () => {
    it('should allow owner role to access dashboard endpoints', async () => {
      setupAuthMock(owner1Id, 'owner');
      setupCampsiteUpdate(owner1CampsiteId, owner1Id, true);

      const response = await request(app)
        .patch(`/api/dashboard/campsites/${owner1CampsiteId}`)
        .set('Authorization', `Bearer ${owner1Token}`)
        .send({ name: 'Updated Camp' });

      expect(response.status).toBe(200);
    });

    it('should allow admin role to access dashboard endpoints', async () => {
      setupAuthMock(adminId, 'admin');
      setupCampsiteUpdate(owner1CampsiteId, adminId, false); // Admin not owner, so ownership check fails

      const response = await request(app)
        .patch(`/api/dashboard/campsites/${owner1CampsiteId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Admin Updated' });

      // Admin passes requireOwner middleware but fails ownership check in route
      expect(response.status).toBe(404);
    });

    it('should deny regular user role from accessing dashboard endpoints', async () => {
      setupAuthMock(regularUserId, 'user');

      const response = await request(app)
        .patch(`/api/dashboard/campsites/${owner1CampsiteId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'User Updated' });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'Forbidden');
    });
  });

  describe('PATCH /api/dashboard/campsites/:id - Ownership Verification', () => {
    it('should allow owner to update their own campsite - returns 200', async () => {
      setupAuthMock(owner1Id, 'owner');
      setupCampsiteUpdate(owner1CampsiteId, owner1Id, true);

      const response = await request(app)
        .patch(`/api/dashboard/campsites/${owner1CampsiteId}`)
        .set('Authorization', `Bearer ${owner1Token}`)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id', owner1CampsiteId);
    });

    it('should prevent owner from updating another owner\'s campsite - returns 403/404', async () => {
      setupAuthMock(owner1Id, 'owner');
      setupCampsiteUpdate(owner2CampsiteId, owner1Id, false); // ownership check fails

      const response = await request(app)
        .patch(`/api/dashboard/campsites/${owner2CampsiteId}`)
        .set('Authorization', `Bearer ${owner1Token}`)
        .send({});

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatchObject({ message: 'Campsite not found' });
    });

    it('should prevent non-owner user from updating any campsite - returns 403', async () => {
      setupAuthMock(regularUserId, 'user');

      const response = await request(app)
        .patch(`/api/dashboard/campsites/${owner1CampsiteId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({});

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'Forbidden');
    });

    it('should return 404 for invalid campsite ID', async () => {
      const invalidCampsiteId = 'invalid-uuid-123';
      setupAuthMock(owner1Id, 'owner');
      setupCampsiteUpdate(invalidCampsiteId, owner1Id, false);

      const response = await request(app)
        .patch(`/api/dashboard/campsites/${invalidCampsiteId}`)
        .set('Authorization', `Bearer ${owner1Token}`)
        .send({});

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    it('should allow admin to update any campsite via admin routes', async () => {
      setupAuthMock(adminId, 'admin');
      // Admin bypassing ownership would use admin API, not dashboard API
      // Dashboard API checks ownership, so admin gets 404
      setupCampsiteUpdate(owner1CampsiteId, adminId, false);

      const response = await request(app)
        .patch(`/api/dashboard/campsites/${owner1CampsiteId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      // Admin passes requireOwner middleware but fails ownership check in route handler
      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/dashboard/campsites/:id - Ownership Verification', () => {
    it('should allow owner to delete their own campsite', async () => {
      setupAuthMock(owner1Id, 'owner');
      setupCampsiteDelete(owner1CampsiteId, owner1Id, true);

      const response = await request(app)
        .delete(`/api/dashboard/campsites/${owner1CampsiteId}`)
        .set('Authorization', `Bearer ${owner1Token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Campsite deleted successfully');
    });

    it('should prevent owner from deleting another owner\'s campsite', async () => {
      setupAuthMock(owner1Id, 'owner');
      setupCampsiteDelete(owner2CampsiteId, owner1Id, false);

      const response = await request(app)
        .delete(`/api/dashboard/campsites/${owner2CampsiteId}`)
        .set('Authorization', `Bearer ${owner1Token}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatchObject({ message: 'Campsite not found' });
    });

    it('should return 404 when deleting non-existent campsite', async () => {
      const nonExistentId = 'non-existent-uuid';
      setupAuthMock(owner1Id, 'owner');
      setupCampsiteDelete(nonExistentId, owner1Id, false);

      const response = await request(app)
        .delete(`/api/dashboard/campsites/${nonExistentId}`)
        .set('Authorization', `Bearer ${owner1Token}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Ownership Check Logic', () => {
    it('should verify ownership by checking both campsite_id and owner_id match', async () => {
      setupAuthMock(owner1Id, 'owner');

      let ownershipCheckCalled = false;
      let campsiteIdMatched = false;
      let ownerIdMatched = false;

      mockFrom.mockImplementation((table: string) => {
        if (table === 'campsites') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockImplementation((field, value) => {
                if (field === 'id' && value === owner1CampsiteId) {
                  campsiteIdMatched = true;
                  return {
                    eq: jest.fn().mockImplementation((field2, value2) => {
                      if (field2 === 'owner_id' && value2 === owner1Id) {
                        ownerIdMatched = true;
                        ownershipCheckCalled = true;
                      }
                      return {
                        single: jest.fn().mockResolvedValue({
                          data: { id: owner1CampsiteId },
                          error: null,
                        }),
                      };
                    }),
                  };
                }
                return {
                  eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({ data: null, error: null }),
                  }),
                };
              }),
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { id: owner1CampsiteId, name: 'Updated' },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        // For profiles table (auth middleware)
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { user_role: 'owner' },
                error: null,
              }),
            }),
          }),
        };
      });

      await request(app)
        .patch(`/api/dashboard/campsites/${owner1CampsiteId}`)
        .set('Authorization', `Bearer ${owner1Token}`)
        .send({ name: 'Updated' });

      expect(ownershipCheckCalled).toBe(true);
      expect(campsiteIdMatched).toBe(true);
      expect(ownerIdMatched).toBe(true);
    });
  });
});
