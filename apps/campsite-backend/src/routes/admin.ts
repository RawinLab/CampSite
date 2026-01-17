// Admin Routes for Camping Thailand Platform
// Module 10: Admin Dashboard (Q8, Q9, Q11)

import { Router, type IRouter } from 'express';
import { authMiddleware, type AuthenticatedRequest } from '../middleware/auth';
import { requireAdmin } from '../middleware/roleGuard';
import { supabaseAdmin } from '../lib/supabase';
import {
  campsiteApprovalActionSchema,
  pendingCampsitesQuerySchema,
  ownerRequestActionSchema,
  ownerRequestsQuerySchema,
  reviewModerationActionSchema,
  reportedReviewsQuerySchema,
} from '@campsite/shared';
import {
  notifyCampsiteApproved,
  notifyCampsiteRejected,
  notifyOwnerRequestApproved,
  notifyOwnerRequestRejected,
  notifyReviewHidden,
} from '../services/notification.service';
import { hideReview, unhideReview } from '../services/reviewService';
import logger from '../utils/logger';
import type { Response } from 'express';

const router: IRouter = Router();

// All admin routes require authentication and admin role
router.use(authMiddleware);
router.use(requireAdmin);

// ============================================
// Admin Dashboard Stats
// ============================================

/**
 * @route GET /api/admin/stats
 * @desc Get admin dashboard statistics
 * @access Admin only
 */
router.get('/stats', async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Get pending campsites count
    const { count: pendingCampsites } = await supabaseAdmin
      .from('campsites')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    // Get pending owner requests count
    const { count: pendingOwnerRequests } = await supabaseAdmin
      .from('owner_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    // Get reported reviews count
    const { count: reportedReviews } = await supabaseAdmin
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('is_reported', true)
      .eq('is_hidden', false);

    // Get total counts
    const { count: totalCampsites } = await supabaseAdmin
      .from('campsites')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved');

    const { count: totalUsers } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const { count: totalReviews } = await supabaseAdmin
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('is_hidden', false);

    res.json({
      success: true,
      data: {
        pending_campsites: pendingCampsites || 0,
        pending_owner_requests: pendingOwnerRequests || 0,
        reported_reviews: reportedReviews || 0,
        total_campsites: totalCampsites || 0,
        total_users: totalUsers || 0,
        total_reviews: totalReviews || 0,
      },
    });
  } catch (error) {
    logger.error('Error fetching admin stats', { error });
    res.status(500).json({ success: false, error: 'Failed to fetch admin stats' });
  }
});

// ============================================
// Campsite Approval (Q8)
// ============================================

/**
 * @route GET /api/admin/campsites/pending
 * @desc Get list of pending campsites awaiting approval
 * @access Admin only
 */
router.get('/campsites/pending', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const query = pendingCampsitesQuerySchema.parse(req.query);
    const { page, limit, sort_by, sort_order } = query;
    const offset = (page - 1) * limit;

    // Get total count
    const { count: total } = await supabaseAdmin
      .from('campsites')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    // Get pending campsites with owner info
    let campsiteQuery = supabaseAdmin
      .from('campsites')
      .select(`
        *,
        owner:profiles!campsites_owner_id_fkey(id, full_name, avatar_url),
        province:provinces(id, name_th, name_en),
        photos:campsite_photos(count)
      `)
      .eq('status', 'pending');

    // Apply sorting
    if (sort_by === 'submitted_at') {
      campsiteQuery = campsiteQuery.order('created_at', { ascending: sort_order === 'asc' });
    } else if (sort_by === 'name') {
      campsiteQuery = campsiteQuery.order('name', { ascending: sort_order === 'asc' });
    }

    const { data: campsites, error } = await campsiteQuery.range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    // Map to response format
    const pendingCampsites = (campsites || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      campsite_type: c.campsite_type,
      status: c.status,
      province_id: c.province_id,
      province_name: c.province?.name_en || c.province?.name_th || 'Unknown',
      address: c.address,
      latitude: c.latitude,
      longitude: c.longitude,
      min_price: c.min_price,
      max_price: c.max_price,
      owner_id: c.owner_id,
      owner_name: c.owner?.full_name || 'Unknown',
      owner_email: '', // Will fetch separately if needed
      photo_count: c.photos?.[0]?.count || 0,
      submitted_at: c.created_at,
      created_at: c.created_at,
      updated_at: c.updated_at,
    }));

    res.json({
      success: true,
      data: pendingCampsites,
      pagination: {
        page,
        limit,
        total: total || 0,
        totalPages: Math.ceil((total || 0) / limit),
      },
    });
  } catch (error) {
    logger.error('Error fetching pending campsites', { error });
    res.status(500).json({ success: false, error: 'Failed to fetch pending campsites' });
  }
});

/**
 * @route POST /api/admin/campsites/:id/approve
 * @desc Approve a pending campsite
 * @access Admin only
 */
router.post('/campsites/:id/approve', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const parsed = campsiteApprovalActionSchema.safeParse({ action: 'approve' });

    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.errors });
    }

    // Get campsite info
    const { data: campsite, error: fetchError } = await supabaseAdmin
      .from('campsites')
      .select('*, owner:profiles!campsites_owner_id_fkey(id, full_name)')
      .eq('id', id)
      .eq('status', 'pending')
      .single();

    if (fetchError || !campsite) {
      return res.status(404).json({ success: false, error: 'Campsite not found or not pending' });
    }

    // Update campsite status
    const { error: updateError } = await supabaseAdmin
      .from('campsites')
      .update({
        status: 'approved',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      throw updateError;
    }

    // Log moderation action
    await supabaseAdmin.from('moderation_logs').insert({
      admin_id: req.user!.id,
      action_type: 'campsite_approve',
      entity_type: 'campsite',
      entity_id: id,
      reason: null,
    });

    // Notify owner
    await notifyCampsiteApproved(campsite.owner_id, campsite.name, id);

    logger.info('Campsite approved', { campsiteId: id, adminId: req.user!.id });

    res.json({
      success: true,
      campsite_id: id,
      new_status: 'approved',
      message: 'Campsite approved successfully',
    });
  } catch (error) {
    logger.error('Error approving campsite', { error, campsiteId: req.params.id });
    res.status(500).json({ success: false, error: 'Failed to approve campsite' });
  }
});

/**
 * @route POST /api/admin/campsites/:id/reject
 * @desc Reject a pending campsite
 * @access Admin only
 */
router.post('/campsites/:id/reject', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const parsed = campsiteApprovalActionSchema.safeParse({ action: 'reject', ...req.body });

    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.errors });
    }

    const { rejection_reason } = parsed.data;

    // Get campsite info
    const { data: campsite, error: fetchError } = await supabaseAdmin
      .from('campsites')
      .select('*, owner:profiles!campsites_owner_id_fkey(id, full_name)')
      .eq('id', id)
      .eq('status', 'pending')
      .single();

    if (fetchError || !campsite) {
      return res.status(404).json({ success: false, error: 'Campsite not found or not pending' });
    }

    // Update campsite status
    const { error: updateError } = await supabaseAdmin
      .from('campsites')
      .update({
        status: 'rejected',
        rejection_reason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      throw updateError;
    }

    // Log moderation action
    await supabaseAdmin.from('moderation_logs').insert({
      admin_id: req.user!.id,
      action_type: 'campsite_reject',
      entity_type: 'campsite',
      entity_id: id,
      reason: rejection_reason,
    });

    // Notify owner
    await notifyCampsiteRejected(campsite.owner_id, campsite.name, id, rejection_reason!);

    logger.info('Campsite rejected', { campsiteId: id, adminId: req.user!.id, reason: rejection_reason });

    res.json({
      success: true,
      campsite_id: id,
      new_status: 'rejected',
      message: 'Campsite rejected successfully',
    });
  } catch (error) {
    logger.error('Error rejecting campsite', { error, campsiteId: req.params.id });
    res.status(500).json({ success: false, error: 'Failed to reject campsite' });
  }
});

// ============================================
// Owner Request Approval (Q9)
// ============================================

/**
 * @route GET /api/admin/owner-requests
 * @desc Get list of owner requests
 * @access Admin only
 */
router.get('/owner-requests', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const query = ownerRequestsQuerySchema.parse(req.query);
    const { page, limit, status, sort_by, sort_order } = query;
    const offset = (page - 1) * limit;

    // Build count query
    let countQuery = supabaseAdmin.from('owner_requests').select('*', { count: 'exact', head: true });
    if (status !== 'all') {
      countQuery = countQuery.eq('status', status);
    }
    const { count: total } = await countQuery;

    // Build data query
    let dataQuery = supabaseAdmin
      .from('owner_requests')
      .select(`
        *,
        user:profiles!owner_requests_user_id_fkey(id, full_name, avatar_url)
      `);

    if (status !== 'all') {
      dataQuery = dataQuery.eq('status', status);
    }

    if (sort_by === 'created_at') {
      dataQuery = dataQuery.order('created_at', { ascending: sort_order === 'asc' });
    } else if (sort_by === 'business_name') {
      dataQuery = dataQuery.order('business_name', { ascending: sort_order === 'asc' });
    }

    const { data: requests, error } = await dataQuery.range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    // Map to response format
    const ownerRequests = (requests || []).map((r: any) => ({
      id: r.id,
      user_id: r.user_id,
      business_name: r.business_name,
      business_description: r.business_description,
      contact_phone: r.contact_phone,
      status: r.status,
      created_at: r.created_at,
      reviewed_at: r.reviewed_at,
      reviewed_by: r.reviewed_by,
      rejection_reason: r.rejection_reason,
      user_full_name: r.user?.full_name || 'Unknown',
      user_avatar_url: r.user?.avatar_url || null,
      user_email: '', // Privacy - don't expose email
      user_created_at: '', // Will fetch if needed
    }));

    res.json({
      success: true,
      data: ownerRequests,
      pagination: {
        page,
        limit,
        total: total || 0,
        totalPages: Math.ceil((total || 0) / limit),
      },
    });
  } catch (error) {
    logger.error('Error fetching owner requests', { error });
    res.status(500).json({ success: false, error: 'Failed to fetch owner requests' });
  }
});

/**
 * @route POST /api/admin/owner-requests/:id/approve
 * @desc Approve an owner request
 * @access Admin only
 */
router.post('/owner-requests/:id/approve', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const parsed = ownerRequestActionSchema.safeParse({ action: 'approve' });

    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.errors });
    }

    // Get owner request info
    const { data: request, error: fetchError } = await supabaseAdmin
      .from('owner_requests')
      .select('*')
      .eq('id', id)
      .eq('status', 'pending')
      .single();

    if (fetchError || !request) {
      return res.status(404).json({ success: false, error: 'Owner request not found or not pending' });
    }

    // Update request status
    const { error: updateRequestError } = await supabaseAdmin
      .from('owner_requests')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: req.user!.id,
      })
      .eq('id', id);

    if (updateRequestError) {
      throw updateRequestError;
    }

    // Upgrade user role to 'owner'
    const { error: updateRoleError } = await supabaseAdmin
      .from('profiles')
      .update({
        user_role: 'owner',
        updated_at: new Date().toISOString(),
      })
      .eq('id', request.user_id);

    if (updateRoleError) {
      logger.error('Failed to upgrade user role', { error: updateRoleError, userId: request.user_id });
    }

    // Log moderation action
    await supabaseAdmin.from('moderation_logs').insert({
      admin_id: req.user!.id,
      action_type: 'owner_approve',
      entity_type: 'owner_request',
      entity_id: id,
      reason: null,
    });

    // Notify user
    await notifyOwnerRequestApproved(request.user_id, request.business_name, id);

    logger.info('Owner request approved', { requestId: id, userId: request.user_id, adminId: req.user!.id });

    res.json({
      success: true,
      request_id: id,
      new_status: 'approved',
      user_role_updated: !updateRoleError,
      message: 'Owner request approved successfully',
    });
  } catch (error) {
    logger.error('Error approving owner request', { error, requestId: req.params.id });
    res.status(500).json({ success: false, error: 'Failed to approve owner request' });
  }
});

/**
 * @route POST /api/admin/owner-requests/:id/reject
 * @desc Reject an owner request
 * @access Admin only
 */
router.post('/owner-requests/:id/reject', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const parsed = ownerRequestActionSchema.safeParse({ action: 'reject', ...req.body });

    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.errors });
    }

    const { rejection_reason } = parsed.data;

    // Get owner request info
    const { data: request, error: fetchError } = await supabaseAdmin
      .from('owner_requests')
      .select('*')
      .eq('id', id)
      .eq('status', 'pending')
      .single();

    if (fetchError || !request) {
      return res.status(404).json({ success: false, error: 'Owner request not found or not pending' });
    }

    // Update request status
    const { error: updateError } = await supabaseAdmin
      .from('owner_requests')
      .update({
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
        reviewed_by: req.user!.id,
        rejection_reason,
      })
      .eq('id', id);

    if (updateError) {
      throw updateError;
    }

    // Log moderation action
    await supabaseAdmin.from('moderation_logs').insert({
      admin_id: req.user!.id,
      action_type: 'owner_reject',
      entity_type: 'owner_request',
      entity_id: id,
      reason: rejection_reason,
    });

    // Notify user
    await notifyOwnerRequestRejected(request.user_id, request.business_name, id, rejection_reason!);

    logger.info('Owner request rejected', { requestId: id, adminId: req.user!.id, reason: rejection_reason });

    res.json({
      success: true,
      request_id: id,
      new_status: 'rejected',
      message: 'Owner request rejected successfully',
    });
  } catch (error) {
    logger.error('Error rejecting owner request', { error, requestId: req.params.id });
    res.status(500).json({ success: false, error: 'Failed to reject owner request' });
  }
});

// ============================================
// Review Moderation (Q11)
// ============================================

/**
 * @route GET /api/admin/reviews/reported
 * @desc Get list of reported reviews
 * @access Admin only
 */
router.get('/reviews/reported', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const query = reportedReviewsQuerySchema.parse(req.query);
    const { page, limit, sort_by, sort_order, min_reports } = query;
    const offset = (page - 1) * limit;

    // Build count query
    let countQuery = supabaseAdmin
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('is_reported', true)
      .eq('is_hidden', false);

    if (min_reports) {
      countQuery = countQuery.gte('report_count', min_reports);
    }

    const { count: total } = await countQuery;

    // Build data query
    let dataQuery = supabaseAdmin
      .from('reviews')
      .select(`
        *,
        reviewer:profiles!reviews_user_id_fkey(id, full_name, avatar_url),
        campsite:campsites(id, name),
        photos:review_photos(*)
      `)
      .eq('is_reported', true)
      .eq('is_hidden', false);

    if (min_reports) {
      dataQuery = dataQuery.gte('report_count', min_reports);
    }

    if (sort_by === 'report_count') {
      dataQuery = dataQuery.order('report_count', { ascending: sort_order === 'asc' });
    } else if (sort_by === 'created_at') {
      dataQuery = dataQuery.order('created_at', { ascending: sort_order === 'asc' });
    }

    const { data: reviews, error } = await dataQuery.range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    // Get reports for each review
    const reviewIds = (reviews || []).map((r: any) => r.id);
    const { data: reports } = await supabaseAdmin
      .from('review_reports')
      .select(`
        *,
        reporter:profiles!review_reports_user_id_fkey(full_name)
      `)
      .in('review_id', reviewIds);

    // Group reports by review_id
    const reportsByReviewId: Record<string, any[]> = {};
    (reports || []).forEach((report: any) => {
      if (!reportsByReviewId[report.review_id]) {
        reportsByReviewId[report.review_id] = [];
      }
      reportsByReviewId[report.review_id].push({
        id: report.id,
        user_id: report.user_id,
        reporter_name: report.reporter?.full_name || 'Anonymous',
        reason: report.reason,
        details: report.details,
        created_at: report.created_at,
      });
    });

    // Map to response format
    const reportedReviews = (reviews || []).map((r: any) => ({
      id: r.id,
      campsite_id: r.campsite_id,
      campsite_name: r.campsite?.name || 'Unknown',
      user_id: r.user_id,
      rating_overall: r.rating_overall,
      reviewer_type: r.reviewer_type,
      title: r.title,
      content: r.content,
      pros: r.pros,
      cons: r.cons,
      helpful_count: r.helpful_count,
      is_reported: r.is_reported,
      report_count: r.report_count,
      is_hidden: r.is_hidden,
      created_at: r.created_at,
      reviewer_name: r.reviewer?.full_name || 'Anonymous',
      reviewer_avatar: r.reviewer?.avatar_url || null,
      photos: r.photos || [],
      reports: reportsByReviewId[r.id] || [],
    }));

    res.json({
      success: true,
      data: reportedReviews,
      pagination: {
        page,
        limit,
        total: total || 0,
        totalPages: Math.ceil((total || 0) / limit),
      },
    });
  } catch (error) {
    logger.error('Error fetching reported reviews', { error });
    res.status(500).json({ success: false, error: 'Failed to fetch reported reviews' });
  }
});

/**
 * @route POST /api/admin/reviews/:id/hide
 * @desc Hide a reported review
 * @access Admin only
 */
router.post('/reviews/:id/hide', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const parsed = reviewModerationActionSchema.safeParse({ action: 'hide', ...req.body });

    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.errors });
    }

    const { hide_reason } = parsed.data;

    // Get review info
    const { data: review, error: fetchError } = await supabaseAdmin
      .from('reviews')
      .select(`
        *,
        campsite:campsites(name)
      `)
      .eq('id', id)
      .single();

    if (fetchError || !review) {
      return res.status(404).json({ success: false, error: 'Review not found' });
    }

    // Hide the review
    const result = await hideReview(id, req.user!.id, hide_reason!);

    if (!result.success) {
      return res.status(500).json({ success: false, error: result.error });
    }

    // Log moderation action
    await supabaseAdmin.from('moderation_logs').insert({
      admin_id: req.user!.id,
      action_type: 'review_hide',
      entity_type: 'review',
      entity_id: id,
      reason: hide_reason,
    });

    // Notify review author
    await notifyReviewHidden(review.user_id, (review.campsite as any)?.name || 'Unknown', id, hide_reason!);

    logger.info('Review hidden', { reviewId: id, adminId: req.user!.id, reason: hide_reason });

    res.json({
      success: true,
      review_id: id,
      action: 'hide',
      message: 'Review hidden successfully',
    });
  } catch (error) {
    logger.error('Error hiding review', { error, reviewId: req.params.id });
    res.status(500).json({ success: false, error: 'Failed to hide review' });
  }
});

/**
 * @route POST /api/admin/reviews/:id/unhide
 * @desc Unhide a hidden review
 * @access Admin only
 */
router.post('/reviews/:id/unhide', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Unhide the review
    const result = await unhideReview(id);

    if (!result.success) {
      return res.status(500).json({ success: false, error: result.error });
    }

    // Log moderation action
    await supabaseAdmin.from('moderation_logs').insert({
      admin_id: req.user!.id,
      action_type: 'review_unhide',
      entity_type: 'review',
      entity_id: id,
      reason: null,
    });

    logger.info('Review unhidden', { reviewId: id, adminId: req.user!.id });

    res.json({
      success: true,
      review_id: id,
      action: 'unhide',
      message: 'Review unhidden successfully',
    });
  } catch (error) {
    logger.error('Error unhiding review', { error, reviewId: req.params.id });
    res.status(500).json({ success: false, error: 'Failed to unhide review' });
  }
});

/**
 * @route DELETE /api/admin/reviews/:id
 * @desc Permanently delete a review
 * @access Admin only
 */
router.delete('/reviews/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Get review info before deletion
    const { data: review, error: fetchError } = await supabaseAdmin
      .from('reviews')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !review) {
      return res.status(404).json({ success: false, error: 'Review not found' });
    }

    // Delete the review (cascade will delete photos and reports)
    const { error: deleteError } = await supabaseAdmin
      .from('reviews')
      .delete()
      .eq('id', id);

    if (deleteError) {
      throw deleteError;
    }

    // Log moderation action
    await supabaseAdmin.from('moderation_logs').insert({
      admin_id: req.user!.id,
      action_type: 'review_delete',
      entity_type: 'review',
      entity_id: id,
      reason: 'Permanently deleted by admin',
      metadata: { original_review: review },
    });

    logger.info('Review deleted', { reviewId: id, adminId: req.user!.id });

    res.json({
      success: true,
      review_id: id,
      action: 'delete',
      message: 'Review deleted permanently',
    });
  } catch (error) {
    logger.error('Error deleting review', { error, reviewId: req.params.id });
    res.status(500).json({ success: false, error: 'Failed to delete review' });
  }
});

/**
 * @route POST /api/admin/reviews/:id/dismiss
 * @desc Dismiss reports on a review (clear reports, keep review)
 * @access Admin only
 */
router.post('/reviews/:id/dismiss', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Clear the reports
    const { error: deleteError } = await supabaseAdmin
      .from('review_reports')
      .delete()
      .eq('review_id', id);

    if (deleteError) {
      throw deleteError;
    }

    // Update review to clear reported status
    const { error: updateError } = await supabaseAdmin
      .from('reviews')
      .update({
        is_reported: false,
        report_count: 0,
      })
      .eq('id', id);

    if (updateError) {
      throw updateError;
    }

    // Log moderation action
    await supabaseAdmin.from('moderation_logs').insert({
      admin_id: req.user!.id,
      action_type: 'review_dismiss',
      entity_type: 'review',
      entity_id: id,
      reason: 'Reports dismissed by admin',
    });

    logger.info('Review reports dismissed', { reviewId: id, adminId: req.user!.id });

    res.json({
      success: true,
      review_id: id,
      action: 'dismiss',
      message: 'Reports dismissed successfully',
    });
  } catch (error) {
    logger.error('Error dismissing review reports', { error, reviewId: req.params.id });
    res.status(500).json({ success: false, error: 'Failed to dismiss reports' });
  }
});

export default router;
