import {
  campsiteApprovalActionSchema,
  pendingCampsitesQuerySchema,
  ownerRequestActionSchema,
  ownerRequestsQuerySchema,
  reviewModerationActionSchema,
  reportedReviewsQuerySchema,
  adminDashboardQuerySchema,
  userSearchQuerySchema,
  updateUserRoleSchema,
} from '../../src/schemas/admin';
import { ZodError } from 'zod';

describe('Admin Schemas', () => {
  describe('campsiteApprovalActionSchema', () => {
    describe('approve action', () => {
      it('should accept valid approve action without reason', () => {
        const result = campsiteApprovalActionSchema.safeParse({ action: 'approve' });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.action).toBe('approve');
          expect(result.data.rejection_reason).toBeUndefined();
        }
      });

      it('should accept approve action with optional reason', () => {
        const result = campsiteApprovalActionSchema.safeParse({
          action: 'approve',
          rejection_reason: 'This is a valid reason',
        });
        expect(result.success).toBe(true);
      });
    });

    describe('reject action', () => {
      it('should accept valid reject action with valid reason', () => {
        const result = campsiteApprovalActionSchema.safeParse({
          action: 'reject',
          rejection_reason: 'This campsite does not meet our quality standards',
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.action).toBe('reject');
          expect(result.data.rejection_reason).toBe('This campsite does not meet our quality standards');
        }
      });

      it('should reject reject action without reason', () => {
        const result = campsiteApprovalActionSchema.safeParse({ action: 'reject' });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Rejection reason is required when rejecting a campsite');
          expect(result.error.errors[0].path).toEqual(['rejection_reason']);
        }
      });

      it('should reject reason shorter than 10 characters', () => {
        const result = campsiteApprovalActionSchema.safeParse({
          action: 'reject',
          rejection_reason: 'Too short',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Rejection reason must be at least 10 characters');
        }
      });

      it('should reject reason longer than 500 characters', () => {
        const longReason = 'a'.repeat(501);
        const result = campsiteApprovalActionSchema.safeParse({
          action: 'reject',
          rejection_reason: longReason,
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors.some(err => err.path.includes('rejection_reason'))).toBe(true);
        }
      });

      it('should accept reason exactly 10 characters (edge case)', () => {
        const result = campsiteApprovalActionSchema.safeParse({
          action: 'reject',
          rejection_reason: '1234567890',
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.rejection_reason).toBe('1234567890');
        }
      });

      it('should accept reason exactly 500 characters (edge case)', () => {
        const exactReason = 'a'.repeat(500);
        const result = campsiteApprovalActionSchema.safeParse({
          action: 'reject',
          rejection_reason: exactReason,
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.rejection_reason?.length).toBe(500);
        }
      });
    });

    describe('invalid action', () => {
      it('should reject unknown action', () => {
        const result = campsiteApprovalActionSchema.safeParse({ action: 'unknown' });
        expect(result.success).toBe(false);
      });

      it('should reject missing action', () => {
        const result = campsiteApprovalActionSchema.safeParse({});
        expect(result.success).toBe(false);
      });
    });
  });

  describe('pendingCampsitesQuerySchema', () => {
    describe('default values', () => {
      it('should apply default values when not provided', () => {
        const result = pendingCampsitesQuerySchema.safeParse({});
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.page).toBe(1);
          expect(result.data.limit).toBe(10);
          expect(result.data.sort_by).toBe('submitted_at');
          expect(result.data.sort_order).toBe('desc');
        }
      });
    });

    describe('valid queries', () => {
      it('should accept valid page and limit values', () => {
        const result = pendingCampsitesQuerySchema.safeParse({
          page: 2,
          limit: 25,
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.page).toBe(2);
          expect(result.data.limit).toBe(25);
        }
      });

      it('should accept all valid sort_by options', () => {
        const sortOptions = ['submitted_at', 'name', 'province'];
        sortOptions.forEach(sortBy => {
          const result = pendingCampsitesQuerySchema.safeParse({ sort_by: sortBy });
          expect(result.success).toBe(true);
        });
      });

      it('should accept all valid sort_order options', () => {
        const sortOrders = ['asc', 'desc'];
        sortOrders.forEach(sortOrder => {
          const result = pendingCampsitesQuerySchema.safeParse({ sort_order: sortOrder });
          expect(result.success).toBe(true);
        });
      });

      it('should coerce string numbers to numbers for page', () => {
        const result = pendingCampsitesQuerySchema.safeParse({ page: '5' });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.page).toBe(5);
          expect(typeof result.data.page).toBe('number');
        }
      });

      it('should coerce string numbers to numbers for limit', () => {
        const result = pendingCampsitesQuerySchema.safeParse({ limit: '20' });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.limit).toBe(20);
          expect(typeof result.data.limit).toBe('number');
        }
      });
    });

    describe('invalid queries', () => {
      it('should reject page less than 1', () => {
        const result = pendingCampsitesQuerySchema.safeParse({ page: 0 });
        expect(result.success).toBe(false);
      });

      it('should reject negative page', () => {
        const result = pendingCampsitesQuerySchema.safeParse({ page: -1 });
        expect(result.success).toBe(false);
      });

      it('should reject limit greater than 50', () => {
        const result = pendingCampsitesQuerySchema.safeParse({ limit: 51 });
        expect(result.success).toBe(false);
      });

      it('should reject invalid sort_by value', () => {
        const result = pendingCampsitesQuerySchema.safeParse({ sort_by: 'invalid' });
        expect(result.success).toBe(false);
      });

      it('should reject invalid sort_order value', () => {
        const result = pendingCampsitesQuerySchema.safeParse({ sort_order: 'invalid' });
        expect(result.success).toBe(false);
      });
    });
  });

  describe('ownerRequestActionSchema', () => {
    describe('approve action', () => {
      it('should accept valid approve action without reason', () => {
        const result = ownerRequestActionSchema.safeParse({ action: 'approve' });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.action).toBe('approve');
          expect(result.data.rejection_reason).toBeUndefined();
        }
      });
    });

    describe('reject action', () => {
      it('should accept valid reject action with valid reason', () => {
        const result = ownerRequestActionSchema.safeParse({
          action: 'reject',
          rejection_reason: 'Insufficient business documentation provided',
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.action).toBe('reject');
          expect(result.data.rejection_reason).toBe('Insufficient business documentation provided');
        }
      });

      it('should reject reject action without reason', () => {
        const result = ownerRequestActionSchema.safeParse({ action: 'reject' });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Rejection reason is required when rejecting a request');
          expect(result.error.errors[0].path).toEqual(['rejection_reason']);
        }
      });

      it('should reject reason shorter than 10 characters', () => {
        const result = ownerRequestActionSchema.safeParse({
          action: 'reject',
          rejection_reason: 'Too short',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Rejection reason must be at least 10 characters');
        }
      });

      it('should reject reason longer than 500 characters', () => {
        const longReason = 'a'.repeat(501);
        const result = ownerRequestActionSchema.safeParse({
          action: 'reject',
          rejection_reason: longReason,
        });
        expect(result.success).toBe(false);
      });

      it('should accept reason exactly 10 characters (edge case)', () => {
        const result = ownerRequestActionSchema.safeParse({
          action: 'reject',
          rejection_reason: '1234567890',
        });
        expect(result.success).toBe(true);
      });

      it('should accept reason exactly 500 characters (edge case)', () => {
        const exactReason = 'a'.repeat(500);
        const result = ownerRequestActionSchema.safeParse({
          action: 'reject',
          rejection_reason: exactReason,
        });
        expect(result.success).toBe(true);
      });
    });

    describe('invalid action', () => {
      it('should reject unknown action', () => {
        const result = ownerRequestActionSchema.safeParse({ action: 'unknown' });
        expect(result.success).toBe(false);
      });

      it('should reject missing action', () => {
        const result = ownerRequestActionSchema.safeParse({});
        expect(result.success).toBe(false);
      });
    });
  });

  describe('ownerRequestsQuerySchema', () => {
    describe('default values', () => {
      it('should apply default values when not provided', () => {
        const result = ownerRequestsQuerySchema.safeParse({});
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.page).toBe(1);
          expect(result.data.limit).toBe(10);
          expect(result.data.status).toBe('pending');
          expect(result.data.sort_by).toBe('created_at');
          expect(result.data.sort_order).toBe('desc');
        }
      });
    });

    describe('valid queries', () => {
      it('should accept all valid status options', () => {
        const statuses = ['pending', 'approved', 'rejected', 'all'];
        statuses.forEach(status => {
          const result = ownerRequestsQuerySchema.safeParse({ status });
          expect(result.success).toBe(true);
        });
      });

      it('should accept all valid sort_by options', () => {
        const sortOptions = ['created_at', 'business_name'];
        sortOptions.forEach(sortBy => {
          const result = ownerRequestsQuerySchema.safeParse({ sort_by: sortBy });
          expect(result.success).toBe(true);
        });
      });
    });
  });

  describe('reviewModerationActionSchema', () => {
    describe('hide action', () => {
      it('should accept valid hide action with reason', () => {
        const result = reviewModerationActionSchema.safeParse({
          action: 'hide',
          hide_reason: 'Contains inappropriate content',
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.action).toBe('hide');
          expect(result.data.hide_reason).toBe('Contains inappropriate content');
        }
      });

      it('should reject hide action without reason', () => {
        const result = reviewModerationActionSchema.safeParse({ action: 'hide' });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Hide reason is required when hiding a review');
          expect(result.error.errors[0].path).toEqual(['hide_reason']);
        }
      });

      it('should reject hide reason shorter than 5 characters', () => {
        const result = reviewModerationActionSchema.safeParse({
          action: 'hide',
          hide_reason: 'Bad',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Hide reason must be at least 5 characters');
        }
      });

      it('should reject hide reason longer than 500 characters', () => {
        const longReason = 'a'.repeat(501);
        const result = reviewModerationActionSchema.safeParse({
          action: 'hide',
          hide_reason: longReason,
        });
        expect(result.success).toBe(false);
      });

      it('should accept hide reason exactly 5 characters (edge case)', () => {
        const result = reviewModerationActionSchema.safeParse({
          action: 'hide',
          hide_reason: '12345',
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.hide_reason).toBe('12345');
        }
      });

      it('should accept hide reason exactly 500 characters (edge case)', () => {
        const exactReason = 'a'.repeat(500);
        const result = reviewModerationActionSchema.safeParse({
          action: 'hide',
          hide_reason: exactReason,
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.hide_reason?.length).toBe(500);
        }
      });
    });

    describe('unhide action', () => {
      it('should accept unhide action without reason', () => {
        const result = reviewModerationActionSchema.safeParse({ action: 'unhide' });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.action).toBe('unhide');
          expect(result.data.hide_reason).toBeUndefined();
        }
      });

      it('should accept unhide action with optional reason', () => {
        const result = reviewModerationActionSchema.safeParse({
          action: 'unhide',
          hide_reason: 'Review was verified as legitimate',
        });
        expect(result.success).toBe(true);
      });
    });

    describe('delete action', () => {
      it('should accept delete action without reason', () => {
        const result = reviewModerationActionSchema.safeParse({ action: 'delete' });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.action).toBe('delete');
          expect(result.data.hide_reason).toBeUndefined();
        }
      });
    });

    describe('dismiss action', () => {
      it('should accept dismiss action without reason', () => {
        const result = reviewModerationActionSchema.safeParse({ action: 'dismiss' });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.action).toBe('dismiss');
          expect(result.data.hide_reason).toBeUndefined();
        }
      });
    });

    describe('invalid action', () => {
      it('should reject unknown action', () => {
        const result = reviewModerationActionSchema.safeParse({ action: 'unknown' });
        expect(result.success).toBe(false);
      });

      it('should reject missing action', () => {
        const result = reviewModerationActionSchema.safeParse({});
        expect(result.success).toBe(false);
      });
    });
  });

  describe('reportedReviewsQuerySchema', () => {
    describe('default values', () => {
      it('should apply default values when not provided', () => {
        const result = reportedReviewsQuerySchema.safeParse({});
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.page).toBe(1);
          expect(result.data.limit).toBe(10);
          expect(result.data.sort_by).toBe('report_count');
          expect(result.data.sort_order).toBe('desc');
        }
      });
    });

    describe('valid queries', () => {
      it('should accept valid min_reports value', () => {
        const result = reportedReviewsQuerySchema.safeParse({ min_reports: 5 });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.min_reports).toBe(5);
        }
      });

      it('should coerce string numbers to numbers for min_reports', () => {
        const result = reportedReviewsQuerySchema.safeParse({ min_reports: '3' });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.min_reports).toBe(3);
          expect(typeof result.data.min_reports).toBe('number');
        }
      });

      it('should accept all valid sort_by options', () => {
        const sortOptions = ['report_count', 'created_at'];
        sortOptions.forEach(sortBy => {
          const result = reportedReviewsQuerySchema.safeParse({ sort_by: sortBy });
          expect(result.success).toBe(true);
        });
      });
    });

    describe('invalid queries', () => {
      it('should reject min_reports less than 1', () => {
        const result = reportedReviewsQuerySchema.safeParse({ min_reports: 0 });
        expect(result.success).toBe(false);
      });
    });
  });

  describe('adminDashboardQuerySchema', () => {
    describe('default values', () => {
      it('should apply default activity_limit of 10', () => {
        const result = adminDashboardQuerySchema.safeParse({});
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.activity_limit).toBe(10);
        }
      });
    });

    describe('valid queries', () => {
      it('should accept valid activity_limit value', () => {
        const result = adminDashboardQuerySchema.safeParse({ activity_limit: 25 });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.activity_limit).toBe(25);
        }
      });

      it('should coerce string numbers to numbers', () => {
        const result = adminDashboardQuerySchema.safeParse({ activity_limit: '15' });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.activity_limit).toBe(15);
          expect(typeof result.data.activity_limit).toBe('number');
        }
      });
    });

    describe('invalid queries', () => {
      it('should reject activity_limit less than 1', () => {
        const result = adminDashboardQuerySchema.safeParse({ activity_limit: 0 });
        expect(result.success).toBe(false);
      });

      it('should reject activity_limit greater than 50', () => {
        const result = adminDashboardQuerySchema.safeParse({ activity_limit: 51 });
        expect(result.success).toBe(false);
      });
    });
  });

  describe('userSearchQuerySchema', () => {
    describe('default values', () => {
      it('should apply default values when not provided', () => {
        const result = userSearchQuerySchema.safeParse({});
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.role).toBe('all');
          expect(result.data.page).toBe(1);
          expect(result.data.limit).toBe(20);
        }
      });
    });

    describe('valid queries', () => {
      it('should accept valid query string', () => {
        const result = userSearchQuerySchema.safeParse({ query: 'john@example.com' });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.query).toBe('john@example.com');
        }
      });

      it('should accept all valid role options', () => {
        const roles = ['admin', 'owner', 'user', 'all'];
        roles.forEach(role => {
          const result = userSearchQuerySchema.safeParse({ role });
          expect(result.success).toBe(true);
        });
      });

      it('should accept query string at minimum length (1)', () => {
        const result = userSearchQuerySchema.safeParse({ query: 'a' });
        expect(result.success).toBe(true);
      });

      it('should accept query string at maximum length (100)', () => {
        const maxQuery = 'a'.repeat(100);
        const result = userSearchQuerySchema.safeParse({ query: maxQuery });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.query?.length).toBe(100);
        }
      });

      it('should coerce string numbers for page and limit', () => {
        const result = userSearchQuerySchema.safeParse({ page: '2', limit: '30' });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.page).toBe(2);
          expect(result.data.limit).toBe(30);
        }
      });
    });

    describe('invalid queries', () => {
      it('should reject query string longer than 100 characters', () => {
        const longQuery = 'a'.repeat(101);
        const result = userSearchQuerySchema.safeParse({ query: longQuery });
        expect(result.success).toBe(false);
      });

      it('should reject empty query string', () => {
        const result = userSearchQuerySchema.safeParse({ query: '' });
        expect(result.success).toBe(false);
      });

      it('should reject invalid role', () => {
        const result = userSearchQuerySchema.safeParse({ role: 'invalid' });
        expect(result.success).toBe(false);
      });

      it('should reject page less than 1', () => {
        const result = userSearchQuerySchema.safeParse({ page: 0 });
        expect(result.success).toBe(false);
      });

      it('should reject limit greater than 50', () => {
        const result = userSearchQuerySchema.safeParse({ limit: 51 });
        expect(result.success).toBe(false);
      });
    });
  });

  describe('updateUserRoleSchema', () => {
    describe('valid role updates', () => {
      it('should accept admin role', () => {
        const result = updateUserRoleSchema.safeParse({ role: 'admin' });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.role).toBe('admin');
        }
      });

      it('should accept owner role', () => {
        const result = updateUserRoleSchema.safeParse({ role: 'owner' });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.role).toBe('owner');
        }
      });

      it('should accept user role', () => {
        const result = updateUserRoleSchema.safeParse({ role: 'user' });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.role).toBe('user');
        }
      });
    });

    describe('invalid role updates', () => {
      it('should reject invalid role', () => {
        const result = updateUserRoleSchema.safeParse({ role: 'invalid' });
        expect(result.success).toBe(false);
      });

      it('should reject missing role', () => {
        const result = updateUserRoleSchema.safeParse({});
        expect(result.success).toBe(false);
      });

      it('should reject all as a role (not valid for updates)', () => {
        const result = updateUserRoleSchema.safeParse({ role: 'all' });
        expect(result.success).toBe(false);
      });
    });
  });
});
