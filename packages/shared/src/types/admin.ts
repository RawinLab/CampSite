// Admin Dashboard Types for Camping Thailand Platform
// Module 10: Admin Dashboard (Q8, Q9, Q11)

import type { Campsite, CampsiteStatus } from './campsite';
import type { OwnerRequest } from './user';
import type { ReviewWithUser, ReportReason } from './review';

// ============================================
// Campsite Approval Types (Q8)
// ============================================

export interface PendingCampsite extends Omit<Campsite, 'status'> {
  status: 'pending';
  owner_name: string;
  owner_email: string;
  province_name: string;
  photo_count: number;
  submitted_at: string;
}

// Note: CampsiteApprovalAction schema type is defined in schemas/admin.ts
// This interface is for API request/response with campsite_id
export interface CampsiteApprovalRequest {
  campsite_id: string;
  action: 'approve' | 'reject';
  rejection_reason?: string;
}

export interface CampsiteApprovalResult {
  success: boolean;
  campsite_id: string;
  new_status: CampsiteStatus;
  message: string;
}

export interface PendingCampsitesResponse {
  success: boolean;
  data: PendingCampsite[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================
// Owner Request Types (Q9)
// ============================================

export interface OwnerRequestWithUser extends OwnerRequest {
  user_email: string;
  user_full_name: string;
  user_avatar_url: string | null;
  user_created_at: string;
}

// Note: OwnerRequestAction schema type is defined in schemas/admin.ts
// This interface is for API request/response with request_id
export interface OwnerRequestActionInput {
  request_id: string;
  action: 'approve' | 'reject';
  rejection_reason?: string;
}

export interface OwnerRequestResult {
  success: boolean;
  request_id: string;
  new_status: 'approved' | 'rejected';
  user_role_updated?: boolean;
  message: string;
}

export interface OwnerRequestsResponse {
  success: boolean;
  data: OwnerRequestWithUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================
// Review Moderation Types (Q11)
// ============================================

export interface ReportedReview extends ReviewWithUser {
  campsite_name: string;
  campsite_id: string;
  reports: ReviewReportDetail[];
}

export interface ReviewReportDetail {
  id: string;
  user_id: string;
  reporter_name: string;
  reason: ReportReason;
  details: string | null;
  created_at: string;
}

// Note: ReviewModerationAction schema type is defined in schemas/admin.ts
// This interface is for API request/response with review_id
export interface ReviewModerationInput {
  review_id: string;
  action: 'hide' | 'unhide' | 'delete' | 'dismiss';
  hide_reason?: string;
}

export interface ReviewModerationResult {
  success: boolean;
  review_id: string;
  action: string;
  message: string;
}

export interface ReportedReviewsResponse {
  success: boolean;
  data: ReportedReview[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================
// Admin Dashboard Stats Types
// ============================================

export interface AdminDashboardStats {
  pending_campsites: number;
  pending_owner_requests: number;
  reported_reviews: number;
  total_campsites: number;
  total_users: number;
  total_reviews: number;
  recent_activity: AdminActivity[];
}

export interface AdminActivity {
  id: string;
  type: 'campsite_approved' | 'campsite_rejected' | 'owner_approved' | 'owner_rejected' | 'review_hidden' | 'review_unhidden' | 'review_deleted';
  entity_id: string;
  entity_name: string;
  admin_id: string;
  admin_name: string;
  created_at: string;
}

// ============================================
// Moderation Log Types
// ============================================

export interface ModerationLog {
  id: string;
  admin_id: string;
  action_type: 'campsite_approve' | 'campsite_reject' | 'owner_approve' | 'owner_reject' | 'review_hide' | 'review_unhide' | 'review_delete';
  entity_type: 'campsite' | 'owner_request' | 'review';
  entity_id: string;
  reason: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

// ============================================
// Notification Types
// ============================================

export interface AdminNotification {
  id: string;
  user_id: string;
  type: 'campsite_approved' | 'campsite_rejected' | 'owner_approved' | 'owner_rejected' | 'review_hidden';
  title: string;
  message: string;
  entity_id: string | null;
  read: boolean;
  created_at: string;
}

export interface CreateNotificationInput {
  user_id: string;
  type: AdminNotification['type'];
  title: string;
  message: string;
  entity_id?: string;
}
