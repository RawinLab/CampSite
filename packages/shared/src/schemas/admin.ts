// Admin Dashboard Schemas for Camping Thailand Platform
// Module 10: Admin Dashboard (Q8, Q9, Q11)

import { z } from 'zod';

// ============================================
// Campsite Approval Schemas (Q8)
// ============================================

export const campsiteApprovalActionSchema = z.object({
  action: z.enum(['approve', 'reject']),
  rejection_reason: z.string().min(10, 'Rejection reason must be at least 10 characters').max(500).optional(),
}).refine(
  (data) => data.action === 'approve' || (data.action === 'reject' && data.rejection_reason),
  { message: 'Rejection reason is required when rejecting a campsite', path: ['rejection_reason'] }
);

export const pendingCampsitesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  sort_by: z.enum(['submitted_at', 'name', 'province']).default('submitted_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

export type CampsiteApprovalAction = z.infer<typeof campsiteApprovalActionSchema>;
export type PendingCampsitesQuery = z.infer<typeof pendingCampsitesQuerySchema>;

// ============================================
// Owner Request Schemas (Q9)
// ============================================

export const ownerRequestActionSchema = z.object({
  action: z.enum(['approve', 'reject']),
  rejection_reason: z.string().min(10, 'Rejection reason must be at least 10 characters').max(500).optional(),
}).refine(
  (data) => data.action === 'approve' || (data.action === 'reject' && data.rejection_reason),
  { message: 'Rejection reason is required when rejecting a request', path: ['rejection_reason'] }
);

export const ownerRequestsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  status: z.enum(['pending', 'approved', 'rejected', 'all']).default('pending'),
  sort_by: z.enum(['created_at', 'business_name']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

export type OwnerRequestAction = z.infer<typeof ownerRequestActionSchema>;
export type OwnerRequestsQuery = z.infer<typeof ownerRequestsQuerySchema>;

// ============================================
// Review Moderation Schemas (Q11)
// ============================================

export const reviewModerationActionSchema = z.object({
  action: z.enum(['hide', 'unhide', 'delete', 'dismiss']),
  hide_reason: z.string().min(5, 'Hide reason must be at least 5 characters').max(500).optional(),
}).refine(
  (data) => data.action !== 'hide' || data.hide_reason,
  { message: 'Hide reason is required when hiding a review', path: ['hide_reason'] }
);

export const reportedReviewsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  sort_by: z.enum(['report_count', 'created_at']).default('report_count'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  min_reports: z.coerce.number().int().min(1).optional(),
});

export type ReviewModerationAction = z.infer<typeof reviewModerationActionSchema>;
export type ReportedReviewsQuery = z.infer<typeof reportedReviewsQuerySchema>;

// ============================================
// Admin Dashboard Query Schemas
// ============================================

export const adminDashboardQuerySchema = z.object({
  activity_limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type AdminDashboardQuery = z.infer<typeof adminDashboardQuerySchema>;

// ============================================
// User Management Schemas
// ============================================

export const userSearchQuerySchema = z.object({
  query: z.string().min(1).max(100).optional(),
  role: z.enum(['admin', 'owner', 'user', 'all']).default('all'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(['admin', 'owner', 'user']),
});

export type UserSearchQuery = z.infer<typeof userSearchQuerySchema>;
export type UpdateUserRole = z.infer<typeof updateUserRoleSchema>;
