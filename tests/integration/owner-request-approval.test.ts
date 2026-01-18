import request from 'supertest';
import app from '../../apps/campsite-backend/src/app';
import { supabaseAdmin } from '../../apps/campsite-backend/src/lib/supabase';
import * as notificationService from '../../apps/campsite-backend/src/services/notification.service';

/**
 * Integration Tests: Owner Request Approval Workflow (T031)
 * Tests complete owner request workflow from submission to approval/rejection
 *
 * Tests cover:
 * 1. List Owner Requests:
 *    - Returns requests with status filter
 *    - Default returns 'pending' status
 *    - Can filter by 'all' status
 *    - Includes user info in response
 *    - Supports pagination
 *    - Supports sorting
 *    - Only accessible by admin
 * 2. Approve Workflow:
 *    - Pending request can be approved
 *    - Request status changes to 'approved'
 *    - CRITICAL: User profile role changes to 'owner'
 *    - Approved request no longer in pending list
 *    - User can now access owner routes
 *    - Moderation log created
 *    - Notification sent to user
 * 3. Reject Workflow:
 *    - Pending request can be rejected
 *    - Request status changes to 'rejected'
 *    - Rejection reason is stored
 *    - User role remains 'user' (NOT upgraded)
 *    - Moderation log created with reason
 *    - Notification sent with reason
 *    - Requires rejection_reason
 * 4. Role Verification:
 *    - Before approval: user cannot create campsite
 *    - After approval: user can create campsite
 *    - After rejection: user still cannot create campsite
 * 5. State Transitions:
 *    - pending → approved (valid, upgrades role)
 *    - pending → rejected (valid, preserves role)
 *    - Cannot re-approve rejected request
 *    - Cannot re-reject approved request
 * 6. Admin Stats:
 *    - pending_owner_requests decreases after action
 */

// Mock notification service to avoid sending real notifications
jest.mock('../../apps/campsite-backend/src/services/notification.service', () => ({
  notifyOwnerRequestApproved: jest.fn().mockResolvedValue({ success: true }),
  notifyOwnerRequestRejected: jest.fn().mockResolvedValue({ success: true }),
  notifyCampsiteApproved: jest.fn().mockResolvedValue({ success: true }),
  notifyCampsiteRejected: jest.fn().mockResolvedValue({ success: true }),
  notifyReviewHidden: jest.fn().mockResolvedValue({ success: true }),
}));

describe('Integration: Owner Request Approval Workflow', () => {
  let adminUserId: string;
  let adminToken: string;
  let regularUserId: string;
  let regularUserToken: string;
  let ownerRequestId: string;

  beforeAll(async () => {
    // Check if the database has the owner_requests table
    const { error: tableCheckError } = await supabaseAdmin
      .from('owner_requests')
      .select('id')
      .limit(0);

    if (tableCheckError && tableCheckError.code === 'PGRST205') {
      console.error('\n\n=== DATABASE SETUP REQUIRED ===');
      console.error('The owner_requests table does not exist in the database.');
      console.error('Please run Supabase migrations before running this test:');
      console.error('  cd supabase && supabase db push\n');
      throw new Error('Database not set up. Run Supabase migrations first.');
    }

    // Create admin user
    const { data: adminAuthData, error: adminSignUpError } = await supabaseAdmin.auth.admin.createUser({
      email: `admin-owner-req-${Date.now()}@example.com`,
      password: 'adminPassword123!',
      email_confirm: true,
    });

    if (adminSignUpError || !adminAuthData.user) {
      throw new Error('Failed to create admin user');
    }

    adminUserId = adminAuthData.user.id;

    // Update admin profile with role
    await supabaseAdmin
      .from('profiles')
      .update({
        user_role: 'admin',
        full_name: 'Test Admin'
      })
      .eq('id', adminUserId);

    // Sign in admin to get access token
    const { data: adminSignInData } = await supabaseAdmin.auth.signInWithPassword({
      email: adminAuthData.user.email!,
      password: 'adminPassword123!',
    });

    if (adminSignInData.session) {
      adminToken = adminSignInData.session.access_token;
    }

    // Create regular user
    const { data: regularAuthData, error: regularSignUpError } = await supabaseAdmin.auth.admin.createUser({
      email: `user-owner-req-${Date.now()}@example.com`,
      password: 'userPassword123!',
      email_confirm: true,
    });

    if (regularSignUpError || !regularAuthData.user) {
      throw new Error('Failed to create regular user');
    }

    regularUserId = regularAuthData.user.id;

    // Update regular user profile
    await supabaseAdmin
      .from('profiles')
      .update({
        user_role: 'user',
        full_name: 'Test User'
      })
      .eq('id', regularUserId);

    // Sign in regular user to get access token
    const { data: regularSignInData } = await supabaseAdmin.auth.signInWithPassword({
      email: regularAuthData.user.email!,
      password: 'userPassword123!',
    });

    if (regularSignInData.session) {
      regularUserToken = regularSignInData.session.access_token;
    }

    // Create pending owner request
    const { data: ownerRequest, error: ownerRequestError } = await supabaseAdmin
      .from('owner_requests')
      .insert({
        user_id: regularUserId,
        business_name: 'Test Campsite Business',
        business_description: 'We run multiple camping sites across Thailand and want to list them on the platform.',
        contact_phone: '0812345678',
        status: 'pending',
      })
      .select()
      .single();

    if (ownerRequestError || !ownerRequest) {
      console.error('Owner request error:', ownerRequestError);
      throw new Error(`Failed to create owner request: ${ownerRequestError?.message || 'Unknown error'}`);
    }

    ownerRequestId = ownerRequest.id;
  });

  afterAll(async () => {
    // Clean up test data
    if (ownerRequestId) {
      await supabaseAdmin.from('owner_requests').delete().eq('id', ownerRequestId);
    }
    if (regularUserId) {
      await supabaseAdmin.from('campsites').delete().eq('owner_id', regularUserId);
      await supabaseAdmin.from('moderation_logs').delete().eq('entity_id', ownerRequestId);
      await supabaseAdmin.auth.admin.deleteUser(regularUserId);
    }
    if (adminUserId) {
      await supabaseAdmin.from('moderation_logs').delete().eq('admin_id', adminUserId);
      await supabaseAdmin.auth.admin.deleteUser(adminUserId);
    }
  });

  beforeEach(() => {
    // Clear mock calls before each test
    jest.clearAllMocks();
  });

  describe('T031.1: List Owner Requests', () => {
    it('should return pending requests by default', async () => {
      const response = await request(app)
        .get('/api/admin/owner-requests')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.pagination).toBeDefined();

      // Should include our pending request
      const pendingRequest = response.body.data.find((r: any) => r.id === ownerRequestId);
      expect(pendingRequest).toBeDefined();
      expect(pendingRequest.status).toBe('pending');
    });

    it('should filter by pending status explicitly', async () => {
      const response = await request(app)
        .get('/api/admin/owner-requests?status=pending')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();

      // All requests should be pending
      response.body.data.forEach((request: any) => {
        expect(request.status).toBe('pending');
      });
    });

    it('should filter by all status', async () => {
      const response = await request(app)
        .get('/api/admin/owner-requests?status=all')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('should include user info in response', async () => {
      const response = await request(app)
        .get('/api/admin/owner-requests')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      const pendingRequest = response.body.data.find((r: any) => r.id === ownerRequestId);
      expect(pendingRequest).toBeDefined();
      expect(pendingRequest.user_id).toBe(regularUserId);
      expect(pendingRequest.user_full_name).toBe('Test User');
      expect(pendingRequest.business_name).toBe('Test Campsite Business');
      expect(pendingRequest.contact_phone).toBe('0812345678');
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/admin/owner-requests?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(10);
      expect(response.body.pagination.total).toBeDefined();
      expect(response.body.pagination.totalPages).toBeDefined();
    });

    it('should support sorting by created_at', async () => {
      const responseAsc = await request(app)
        .get('/api/admin/owner-requests?sort_by=created_at&sort_order=asc')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(responseAsc.body.success).toBe(true);

      const responseDesc = await request(app)
        .get('/api/admin/owner-requests?sort_by=created_at&sort_order=desc')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(responseDesc.body.success).toBe(true);
    });

    it('should support sorting by business_name', async () => {
      const response = await request(app)
        .get('/api/admin/owner-requests?sort_by=business_name&sort_order=asc')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should only be accessible by admin', async () => {
      const response = await request(app)
        .get('/api/admin/owner-requests')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/admin/owner-requests')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('T031.2: Approve Workflow', () => {
    let approveRequestId: string;
    let approveUserId: string;
    let approveUserToken: string;

    beforeEach(async () => {
      // Create a fresh user and request for approval test
      const { data: authData } = await supabaseAdmin.auth.admin.createUser({
        email: `approve-user-${Date.now()}@example.com`,
        password: 'userPassword123!',
        email_confirm: true,
      });

      approveUserId = authData!.user!.id;

      await supabaseAdmin
        .from('profiles')
        .update({ user_role: 'user', full_name: 'Approve Test User' })
        .eq('id', approveUserId);

      const { data: signInData } = await supabaseAdmin.auth.signInWithPassword({
        email: authData!.user!.email!,
        password: 'userPassword123!',
      });

      approveUserToken = signInData.session!.access_token;

      const { data: request } = await supabaseAdmin
        .from('owner_requests')
        .insert({
          user_id: approveUserId,
          business_name: 'Approval Test Business',
          business_description: 'Testing approval workflow',
          contact_phone: '0823456789',
          status: 'pending',
        })
        .select()
        .single();

      approveRequestId = request!.id;
    });

    afterEach(async () => {
      if (approveRequestId) {
        await supabaseAdmin.from('owner_requests').delete().eq('id', approveRequestId);
      }
      if (approveUserId) {
        await supabaseAdmin.from('campsites').delete().eq('owner_id', approveUserId);
        await supabaseAdmin.auth.admin.deleteUser(approveUserId);
      }
    });

    it('should approve pending request', async () => {
      const response = await request(app)
        .post(`/api/admin/owner-requests/${approveRequestId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.request_id).toBe(approveRequestId);
      expect(response.body.new_status).toBe('approved');
      expect(response.body.user_role_updated).toBe(true);
      expect(response.body.message).toBe('Owner request approved successfully');
    });

    it('should change request status to approved', async () => {
      await request(app)
        .post(`/api/admin/owner-requests/${approveRequestId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify request status changed
      const { data: updatedRequest } = await supabaseAdmin
        .from('owner_requests')
        .select('*')
        .eq('id', approveRequestId)
        .single();

      expect(updatedRequest).toBeDefined();
      expect(updatedRequest!.status).toBe('approved');
      expect(updatedRequest!.reviewed_by).toBe(adminUserId);
      expect(updatedRequest!.reviewed_at).toBeDefined();
    });

    it('CRITICAL: should upgrade user role to owner', async () => {
      // Verify user is currently a regular user
      const { data: beforeProfile } = await supabaseAdmin
        .from('profiles')
        .select('user_role')
        .eq('id', approveUserId)
        .single();

      expect(beforeProfile!.user_role).toBe('user');

      // Approve request
      await request(app)
        .post(`/api/admin/owner-requests/${approveRequestId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify user role upgraded to owner
      const { data: afterProfile } = await supabaseAdmin
        .from('profiles')
        .select('user_role')
        .eq('id', approveUserId)
        .single();

      expect(afterProfile).toBeDefined();
      expect(afterProfile!.user_role).toBe('owner');
    });

    it('should remove approved request from pending list', async () => {
      // Approve request
      await request(app)
        .post(`/api/admin/owner-requests/${approveRequestId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Query pending requests
      const response = await request(app)
        .get('/api/admin/owner-requests?status=pending')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Should not include approved request
      const pendingRequest = response.body.data.find((r: any) => r.id === approveRequestId);
      expect(pendingRequest).toBeUndefined();
    });

    it('should allow user to create campsite after approval', async () => {
      // Before approval: user cannot create campsite
      const beforeResponse = await request(app)
        .post('/api/campsites')
        .set('Authorization', `Bearer ${approveUserToken}`)
        .send({
          name: 'Test Campsite',
          description: 'Testing campsite creation',
          slug: `test-campsite-${Date.now()}`,
          campsite_type: 'camping',
          province_id: 1,
          min_price: 500,
          max_price: 1500,
          latitude: 13.7563,
          longitude: 100.5018,
        })
        .expect(403);

      expect(beforeResponse.body.success).toBe(false);

      // Approve request
      await request(app)
        .post(`/api/admin/owner-requests/${approveRequestId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // After approval: user can create campsite
      const afterResponse = await request(app)
        .post('/api/campsites')
        .set('Authorization', `Bearer ${approveUserToken}`)
        .send({
          name: 'Test Campsite',
          description: 'Testing campsite creation after approval',
          slug: `test-campsite-approved-${Date.now()}`,
          campsite_type: 'camping',
          province_id: 1,
          min_price: 500,
          max_price: 1500,
          latitude: 13.7563,
          longitude: 100.5018,
        })
        .expect(201);

      expect(afterResponse.body.success).toBe(true);
    });

    it('should create moderation log on approval', async () => {
      await request(app)
        .post(`/api/admin/owner-requests/${approveRequestId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify moderation log created
      const { data: moderationLog } = await supabaseAdmin
        .from('moderation_logs')
        .select('*')
        .eq('entity_id', approveRequestId)
        .eq('action_type', 'owner_approve')
        .single();

      expect(moderationLog).toBeDefined();
      expect(moderationLog!.admin_id).toBe(adminUserId);
      expect(moderationLog!.entity_type).toBe('owner_request');
    });

    it('should send notification to user on approval', async () => {
      await request(app)
        .post(`/api/admin/owner-requests/${approveRequestId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(notificationService.notifyOwnerRequestApproved).toHaveBeenCalledTimes(1);
      expect(notificationService.notifyOwnerRequestApproved).toHaveBeenCalledWith(
        approveUserId,
        'Approval Test Business',
        approveRequestId
      );
    });
  });

  describe('T031.3: Reject Workflow', () => {
    let rejectRequestId: string;
    let rejectUserId: string;

    beforeEach(async () => {
      // Create a fresh user and request for rejection test
      const { data: authData } = await supabaseAdmin.auth.admin.createUser({
        email: `reject-user-${Date.now()}@example.com`,
        password: 'userPassword123!',
        email_confirm: true,
      });

      rejectUserId = authData!.user!.id;

      await supabaseAdmin
        .from('profiles')
        .update({ user_role: 'user', full_name: 'Reject Test User' })
        .eq('id', rejectUserId);

      const { data: request } = await supabaseAdmin
        .from('owner_requests')
        .insert({
          user_id: rejectUserId,
          business_name: 'Rejection Test Business',
          business_description: 'Testing rejection workflow',
          contact_phone: '0834567890',
          status: 'pending',
        })
        .select()
        .single();

      rejectRequestId = request!.id;
    });

    afterEach(async () => {
      if (rejectRequestId) {
        await supabaseAdmin.from('owner_requests').delete().eq('id', rejectRequestId);
      }
      if (rejectUserId) {
        await supabaseAdmin.auth.admin.deleteUser(rejectUserId);
      }
    });

    it('should reject pending request with reason', async () => {
      const response = await request(app)
        .post(`/api/admin/owner-requests/${rejectRequestId}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          rejection_reason: 'Insufficient business documentation provided',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.request_id).toBe(rejectRequestId);
      expect(response.body.new_status).toBe('rejected');
      expect(response.body.message).toBe('Owner request rejected successfully');
    });

    it('should change request status to rejected', async () => {
      const rejectionReason = 'Business registration number is invalid';

      await request(app)
        .post(`/api/admin/owner-requests/${rejectRequestId}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ rejection_reason: rejectionReason })
        .expect(200);

      // Verify request status changed
      const { data: updatedRequest } = await supabaseAdmin
        .from('owner_requests')
        .select('*')
        .eq('id', rejectRequestId)
        .single();

      expect(updatedRequest).toBeDefined();
      expect(updatedRequest!.status).toBe('rejected');
      expect(updatedRequest!.rejection_reason).toBe(rejectionReason);
      expect(updatedRequest!.reviewed_by).toBe(adminUserId);
      expect(updatedRequest!.reviewed_at).toBeDefined();
    });

    it('should store rejection reason', async () => {
      const rejectionReason = 'Business address cannot be verified';

      await request(app)
        .post(`/api/admin/owner-requests/${rejectRequestId}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ rejection_reason: rejectionReason })
        .expect(200);

      const { data: ownerRequest } = await supabaseAdmin
        .from('owner_requests')
        .select('rejection_reason')
        .eq('id', rejectRequestId)
        .single();

      expect(ownerRequest!.rejection_reason).toBe(rejectionReason);
    });

    it('should NOT upgrade user role on rejection', async () => {
      // Verify user is a regular user before rejection
      const { data: beforeProfile } = await supabaseAdmin
        .from('profiles')
        .select('user_role')
        .eq('id', rejectUserId)
        .single();

      expect(beforeProfile!.user_role).toBe('user');

      // Reject request
      await request(app)
        .post(`/api/admin/owner-requests/${rejectRequestId}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ rejection_reason: 'Testing rejection' })
        .expect(200);

      // Verify user role STILL 'user'
      const { data: afterProfile } = await supabaseAdmin
        .from('profiles')
        .select('user_role')
        .eq('id', rejectUserId)
        .single();

      expect(afterProfile).toBeDefined();
      expect(afterProfile!.user_role).toBe('user');
    });

    it('should create moderation log with rejection reason', async () => {
      const rejectionReason = 'Duplicate business registration';

      await request(app)
        .post(`/api/admin/owner-requests/${rejectRequestId}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ rejection_reason: rejectionReason })
        .expect(200);

      // Verify moderation log created
      const { data: moderationLog } = await supabaseAdmin
        .from('moderation_logs')
        .select('*')
        .eq('entity_id', rejectRequestId)
        .eq('action_type', 'owner_reject')
        .single();

      expect(moderationLog).toBeDefined();
      expect(moderationLog!.admin_id).toBe(adminUserId);
      expect(moderationLog!.entity_type).toBe('owner_request');
      expect(moderationLog!.reason).toBe(rejectionReason);
    });

    it('should send notification with rejection reason', async () => {
      const rejectionReason = 'Contact information could not be verified';

      await request(app)
        .post(`/api/admin/owner-requests/${rejectRequestId}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ rejection_reason: rejectionReason })
        .expect(200);

      expect(notificationService.notifyOwnerRequestRejected).toHaveBeenCalledTimes(1);
      expect(notificationService.notifyOwnerRequestRejected).toHaveBeenCalledWith(
        rejectUserId,
        'Rejection Test Business',
        rejectRequestId,
        rejectionReason
      );
    });

    it('should require rejection_reason', async () => {
      const response = await request(app)
        .post(`/api/admin/owner-requests/${rejectRequestId}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('T031.4: Role Verification', () => {
    let roleTestUserId: string;
    let roleTestUserToken: string;
    let roleTestRequestId: string;

    beforeEach(async () => {
      const { data: authData } = await supabaseAdmin.auth.admin.createUser({
        email: `role-test-${Date.now()}@example.com`,
        password: 'userPassword123!',
        email_confirm: true,
      });

      roleTestUserId = authData!.user!.id;

      await supabaseAdmin
        .from('profiles')
        .update({ user_role: 'user', full_name: 'Role Test User' })
        .eq('id', roleTestUserId);

      const { data: signInData } = await supabaseAdmin.auth.signInWithPassword({
        email: authData!.user!.email!,
        password: 'userPassword123!',
      });

      roleTestUserToken = signInData.session!.access_token;

      const { data: request } = await supabaseAdmin
        .from('owner_requests')
        .insert({
          user_id: roleTestUserId,
          business_name: 'Role Test Business',
          business_description: 'Testing role changes',
          contact_phone: '0845678901',
          status: 'pending',
        })
        .select()
        .single();

      roleTestRequestId = request!.id;
    });

    afterEach(async () => {
      if (roleTestRequestId) {
        await supabaseAdmin.from('owner_requests').delete().eq('id', roleTestRequestId);
      }
      if (roleTestUserId) {
        await supabaseAdmin.from('campsites').delete().eq('owner_id', roleTestUserId);
        await supabaseAdmin.auth.admin.deleteUser(roleTestUserId);
      }
    });

    it('should prevent campsite creation before approval', async () => {
      const response = await request(app)
        .post('/api/campsites')
        .set('Authorization', `Bearer ${roleTestUserToken}`)
        .send({
          name: 'Should Fail Campsite',
          description: 'This should fail',
          slug: `should-fail-${Date.now()}`,
          campsite_type: 'camping',
          province_id: 1,
          min_price: 500,
          max_price: 1500,
          latitude: 13.7563,
          longitude: 100.5018,
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should allow campsite creation after approval', async () => {
      // Approve request
      await request(app)
        .post(`/api/admin/owner-requests/${roleTestRequestId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Should now be able to create campsite
      const response = await request(app)
        .post('/api/campsites')
        .set('Authorization', `Bearer ${roleTestUserToken}`)
        .send({
          name: 'Approved Owner Campsite',
          description: 'Created after approval',
          slug: `approved-owner-campsite-${Date.now()}`,
          campsite_type: 'camping',
          province_id: 1,
          min_price: 500,
          max_price: 1500,
          latitude: 13.7563,
          longitude: 100.5018,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    it('should still prevent campsite creation after rejection', async () => {
      // Reject request
      await request(app)
        .post(`/api/admin/owner-requests/${roleTestRequestId}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ rejection_reason: 'Testing rejection' })
        .expect(200);

      // Should still not be able to create campsite
      const response = await request(app)
        .post('/api/campsites')
        .set('Authorization', `Bearer ${roleTestUserToken}`)
        .send({
          name: 'Should Still Fail Campsite',
          description: 'This should still fail',
          slug: `should-still-fail-${Date.now()}`,
          campsite_type: 'camping',
          province_id: 1,
          min_price: 500,
          max_price: 1500,
          latitude: 13.7563,
          longitude: 100.5018,
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('T031.5: State Transitions', () => {
    let stateTestUserId: string;
    let stateTestRequestId: string;

    beforeEach(async () => {
      const { data: authData } = await supabaseAdmin.auth.admin.createUser({
        email: `state-test-${Date.now()}@example.com`,
        password: 'userPassword123!',
        email_confirm: true,
      });

      stateTestUserId = authData!.user!.id;

      await supabaseAdmin
        .from('profiles')
        .update({ user_role: 'user', full_name: 'State Test User' })
        .eq('id', stateTestUserId);

      const { data: request } = await supabaseAdmin
        .from('owner_requests')
        .insert({
          user_id: stateTestUserId,
          business_name: 'State Test Business',
          business_description: 'Testing state transitions',
          contact_phone: '0856789012',
          status: 'pending',
        })
        .select()
        .single();

      stateTestRequestId = request!.id;
    });

    afterEach(async () => {
      if (stateTestRequestId) {
        await supabaseAdmin.from('owner_requests').delete().eq('id', stateTestRequestId);
      }
      if (stateTestUserId) {
        await supabaseAdmin.auth.admin.deleteUser(stateTestUserId);
      }
    });

    it('should transition from pending to approved', async () => {
      const response = await request(app)
        .post(`/api/admin/owner-requests/${stateTestRequestId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.new_status).toBe('approved');

      // Verify role upgraded
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('user_role')
        .eq('id', stateTestUserId)
        .single();

      expect(profile!.user_role).toBe('owner');
    });

    it('should transition from pending to rejected', async () => {
      const response = await request(app)
        .post(`/api/admin/owner-requests/${stateTestRequestId}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ rejection_reason: 'Testing state transition' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.new_status).toBe('rejected');

      // Verify role NOT upgraded
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('user_role')
        .eq('id', stateTestUserId)
        .single();

      expect(profile!.user_role).toBe('user');
    });

    it('should not re-approve rejected request', async () => {
      // Reject first
      await request(app)
        .post(`/api/admin/owner-requests/${stateTestRequestId}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ rejection_reason: 'Initial rejection' })
        .expect(200);

      // Try to approve
      const response = await request(app)
        .post(`/api/admin/owner-requests/${stateTestRequestId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not pending');
    });

    it('should not re-reject approved request', async () => {
      // Approve first
      await request(app)
        .post(`/api/admin/owner-requests/${stateTestRequestId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Try to reject
      const response = await request(app)
        .post(`/api/admin/owner-requests/${stateTestRequestId}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ rejection_reason: 'Trying to reject' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not pending');
    });
  });

  describe('T031.6: Admin Stats', () => {
    let statsTestUserId: string;
    let statsTestRequestId: string;

    beforeEach(async () => {
      const { data: authData } = await supabaseAdmin.auth.admin.createUser({
        email: `stats-test-${Date.now()}@example.com`,
        password: 'userPassword123!',
        email_confirm: true,
      });

      statsTestUserId = authData!.user!.id;

      await supabaseAdmin
        .from('profiles')
        .update({ user_role: 'user', full_name: 'Stats Test User' })
        .eq('id', statsTestUserId);

      const { data: request } = await supabaseAdmin
        .from('owner_requests')
        .insert({
          user_id: statsTestUserId,
          business_name: 'Stats Test Business',
          business_description: 'Testing admin stats',
          contact_phone: '0867890123',
          status: 'pending',
        })
        .select()
        .single();

      statsTestRequestId = request!.id;
    });

    afterEach(async () => {
      if (statsTestRequestId) {
        await supabaseAdmin.from('owner_requests').delete().eq('id', statsTestRequestId);
      }
      if (statsTestUserId) {
        await supabaseAdmin.auth.admin.deleteUser(statsTestUserId);
      }
    });

    it('should decrease pending_owner_requests after approval', async () => {
      // Get stats before approval
      const beforeResponse = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const beforeCount = beforeResponse.body.data.pending_owner_requests;

      // Approve request
      await request(app)
        .post(`/api/admin/owner-requests/${statsTestRequestId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Get stats after approval
      const afterResponse = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const afterCount = afterResponse.body.data.pending_owner_requests;

      // Should have decreased by 1
      expect(afterCount).toBe(beforeCount - 1);
    });

    it('should decrease pending_owner_requests after rejection', async () => {
      // Get stats before rejection
      const beforeResponse = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const beforeCount = beforeResponse.body.data.pending_owner_requests;

      // Reject request
      await request(app)
        .post(`/api/admin/owner-requests/${statsTestRequestId}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ rejection_reason: 'Testing stats' })
        .expect(200);

      // Get stats after rejection
      const afterResponse = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const afterCount = afterResponse.body.data.pending_owner_requests;

      // Should have decreased by 1
      expect(afterCount).toBe(beforeCount - 1);
    });
  });

  describe('T031.7: Edge Cases and Error Handling', () => {
    it('should return 404 for non-existent request', async () => {
      const fakeRequestId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app)
        .post(`/api/admin/owner-requests/${fakeRequestId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });

    it('should validate UUID format for request ID', async () => {
      const response = await request(app)
        .post('/api/admin/owner-requests/invalid-uuid/approve')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should require admin role for approval', async () => {
      const response = await request(app)
        .post(`/api/admin/owner-requests/${ownerRequestId}/approve`)
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should require admin role for rejection', async () => {
      const response = await request(app)
        .post(`/api/admin/owner-requests/${ownerRequestId}/reject`)
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send({ rejection_reason: 'Should not work' })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should require authentication for all endpoints', async () => {
      const listResponse = await request(app)
        .get('/api/admin/owner-requests')
        .expect(401);

      expect(listResponse.body.success).toBe(false);

      const approveResponse = await request(app)
        .post(`/api/admin/owner-requests/${ownerRequestId}/approve`)
        .expect(401);

      expect(approveResponse.body.success).toBe(false);

      const rejectResponse = await request(app)
        .post(`/api/admin/owner-requests/${ownerRequestId}/reject`)
        .send({ rejection_reason: 'Should not work' })
        .expect(401);

      expect(rejectResponse.body.success).toBe(false);
    });
  });
});
