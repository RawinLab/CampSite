import { Router, Response } from 'express';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth';
import { requireOwner } from '../middleware/roleGuard';
import { validate } from '../middleware/validation';
import { analyticsService } from '../services/analytics.service';
import { emailService } from '../services/email.service';
import { createSupabaseClient } from '../lib/supabase';
import {
  dashboardStatsQuerySchema,
  analyticsChartQuerySchema,
  ownerCampsitesQuerySchema,
  createCampsiteSchema,
  updateCampsiteSchema,
  photoReorderSchema,
  amenitiesUpdateSchema,
  inquiryListQuerySchema,
  inquiryReplySchema,
  inquiryStatusUpdateSchema,
} from '@campsite/shared';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response';
import logger from '../utils/logger';

const router: ReturnType<typeof Router> = Router();

// All dashboard routes require authentication and owner/admin role
router.use(authMiddleware);
router.use(requireOwner);

// ============================================
// ANALYTICS ENDPOINTS
// ============================================

/**
 * GET /api/dashboard/stats
 * Get dashboard statistics for owner
 */
router.get(
  '/stats',
  validate(dashboardStatsQuerySchema, 'query'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { period } = req.query as { period?: number };
      const stats = await analyticsService.getDashboardStats(
        req.user!.id,
        period || 30,
        req.headers.authorization?.replace('Bearer ', '')
      );
      return res.json(successResponse(stats));
    } catch (error) {
      logger.error('Error fetching dashboard stats:', error);
      return res.status(500).json(errorResponse('Failed to fetch dashboard stats'));
    }
  }
);

/**
 * GET /api/dashboard/analytics
 * Get full analytics data with charts
 */
router.get(
  '/analytics',
  validate(analyticsChartQuerySchema, 'query'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { period, campsite_id } = req.query as { period?: number; campsite_id?: string };
      const analytics = await analyticsService.getAnalytics(
        req.user!.id,
        period || 30,
        campsite_id,
        req.headers.authorization?.replace('Bearer ', '')
      );
      return res.json(successResponse(analytics));
    } catch (error) {
      logger.error('Error fetching analytics:', error);
      return res.status(500).json(errorResponse('Failed to fetch analytics'));
    }
  }
);

// ============================================
// CAMPSITE MANAGEMENT ENDPOINTS
// ============================================

/**
 * GET /api/dashboard/campsites
 * Get all campsites for the owner
 */
router.get(
  '/campsites',
  validate(ownerCampsitesQuerySchema, 'query'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { status, page, limit, sort, order } = req.query as {
        status?: string;
        page?: number;
        limit?: number;
        sort?: string;
        order?: string;
      };

      const supabase = req.supabase || createSupabaseClient();
      const offset = ((page || 1) - 1) * (limit || 20);

      // Build query
      let query = supabase
        .from('campsites')
        .select(
          `
          id, name, status, average_rating, review_count,
          created_at, updated_at,
          campsite_photos!inner(url, is_primary)
        `,
          { count: 'exact' }
        )
        .eq('owner_id', req.user!.id);

      // Apply status filter
      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      // Apply sorting
      const sortColumn = sort || 'created_at';
      const sortOrder = order === 'asc' ? true : false;
      query = query.order(sortColumn, { ascending: sortOrder });

      // Apply pagination
      query = query.range(offset, offset + (limit || 20) - 1);

      const { data: campsites, error, count } = await query;

      if (error) {
        logger.error('Error fetching owner campsites:', error);
        return res.status(500).json(errorResponse('Failed to fetch campsites'));
      }

      // Get views and inquiries count for this month
      const campsiteIds = campsites?.map((c) => c.id) || [];
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      // Get analytics
      const { data: analytics } = await supabase
        .from('analytics_events')
        .select('campsite_id, event_type')
        .in('campsite_id', campsiteIds)
        .gte('created_at', monthStart.toISOString());

      const { data: inquiries } = await supabase
        .from('inquiries')
        .select('campsite_id')
        .in('campsite_id', campsiteIds)
        .gte('created_at', monthStart.toISOString());

      // Map data
      const campsitesWithStats = campsites?.map((campsite) => {
        const primaryPhoto = campsite.campsite_photos?.find((p: { is_primary: boolean }) => p.is_primary);
        const viewsThisMonth = analytics?.filter(
          (a) => a.campsite_id === campsite.id && a.event_type === 'profile_view'
        ).length || 0;
        const inquiriesThisMonth = inquiries?.filter((i) => i.campsite_id === campsite.id).length || 0;

        return {
          id: campsite.id,
          name: campsite.name,
          status: campsite.status,
          thumbnail_url: primaryPhoto?.url || null,
          average_rating: campsite.average_rating,
          review_count: campsite.review_count,
          views_this_month: viewsThisMonth,
          inquiries_this_month: inquiriesThisMonth,
          created_at: campsite.created_at,
          updated_at: campsite.updated_at,
        };
      });

      return res.json(
        paginatedResponse(campsitesWithStats || [], count || 0, page || 1, limit || 20)
      );
    } catch (error) {
      logger.error('Error fetching owner campsites:', error);
      return res.status(500).json(errorResponse('Failed to fetch campsites'));
    }
  }
);

/**
 * GET /api/dashboard/campsites/:id
 * Get single campsite for editing
 */
router.get('/campsites/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const supabase = req.supabase || createSupabaseClient();

    const { data: campsite, error } = await supabase
      .from('campsites')
      .select(
        `
        *,
        province:provinces(id, name_th, name_en, slug),
        campsite_type:campsite_types(id, name_th, name_en, slug),
        campsite_photos(id, url, alt_text, is_primary, sort_order),
        campsite_amenities(amenity_id, amenities(id, name_th, name_en, slug, icon, category)),
        accommodation_types(id, name, description, capacity, price_per_night, quantity)
      `
      )
      .eq('id', id)
      .eq('owner_id', req.user!.id)
      .single();

    if (error || !campsite) {
      return res.status(404).json(errorResponse('Campsite not found'));
    }

    return res.json(successResponse(campsite));
  } catch (error) {
    logger.error('Error fetching campsite:', error);
    return res.status(500).json(errorResponse('Failed to fetch campsite'));
  }
});

/**
 * POST /api/dashboard/campsites
 * Create new campsite
 */
router.post(
  '/campsites',
  validate(createCampsiteSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const supabase = req.supabase || createSupabaseClient();
      const { amenity_ids, ...campsiteData } = req.body;

      // Create campsite with pending status
      const { data: campsite, error } = await supabase
        .from('campsites')
        .insert({
          ...campsiteData,
          owner_id: req.user!.id,
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating campsite:', error);
        return res.status(500).json(errorResponse('Failed to create campsite'));
      }

      // Add amenities if provided
      if (amenity_ids && amenity_ids.length > 0) {
        const amenityInserts = amenity_ids.map((amenityId: number) => ({
          campsite_id: campsite.id,
          amenity_id: amenityId,
        }));

        await supabase.from('campsite_amenities').insert(amenityInserts);
      }

      return res.status(201).json(
        successResponse(campsite, 'Campsite created successfully. Pending admin approval.')
      );
    } catch (error) {
      logger.error('Error creating campsite:', error);
      return res.status(500).json(errorResponse('Failed to create campsite'));
    }
  }
);

/**
 * PATCH /api/dashboard/campsites/:id
 * Update campsite
 */
router.patch(
  '/campsites/:id',
  validate(updateCampsiteSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const supabase = req.supabase || createSupabaseClient();
      const { amenity_ids, ...updateData } = req.body;

      // Verify ownership
      const { data: existing } = await supabase
        .from('campsites')
        .select('id')
        .eq('id', id)
        .eq('owner_id', req.user!.id)
        .single();

      if (!existing) {
        return res.status(404).json(errorResponse('Campsite not found'));
      }

      // Update campsite
      const { data: campsite, error } = await supabase
        .from('campsites')
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error('Error updating campsite:', error);
        return res.status(500).json(errorResponse('Failed to update campsite'));
      }

      // Update amenities if provided
      if (amenity_ids !== undefined) {
        // Delete existing
        await supabase.from('campsite_amenities').delete().eq('campsite_id', id);

        // Insert new
        if (amenity_ids.length > 0) {
          const amenityInserts = amenity_ids.map((amenityId: number) => ({
            campsite_id: id,
            amenity_id: amenityId,
          }));
          await supabase.from('campsite_amenities').insert(amenityInserts);
        }
      }

      return res.json(successResponse(campsite, 'Campsite updated successfully'));
    } catch (error) {
      logger.error('Error updating campsite:', error);
      return res.status(500).json(errorResponse('Failed to update campsite'));
    }
  }
);

/**
 * DELETE /api/dashboard/campsites/:id
 * Delete campsite (soft delete - sets status to archived)
 */
router.delete('/campsites/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const supabase = req.supabase || createSupabaseClient();

    // Verify ownership
    const { data: existing } = await supabase
      .from('campsites')
      .select('id')
      .eq('id', id)
      .eq('owner_id', req.user!.id)
      .single();

    if (!existing) {
      return res.status(404).json(errorResponse('Campsite not found'));
    }

    // Soft delete
    const { error } = await supabase
      .from('campsites')
      .update({ status: 'archived', updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      logger.error('Error deleting campsite:', error);
      return res.status(500).json(errorResponse('Failed to delete campsite'));
    }

    return res.json(successResponse(null, 'Campsite deleted successfully'));
  } catch (error) {
    logger.error('Error deleting campsite:', error);
    return res.status(500).json(errorResponse('Failed to delete campsite'));
  }
});

// ============================================
// PHOTO MANAGEMENT ENDPOINTS
// ============================================

/**
 * POST /api/dashboard/campsites/:id/photos
 * Upload photo (expects multipart form data with 'photo' field)
 */
router.post('/campsites/:id/photos', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const supabase = req.supabase || createSupabaseClient();

    // Verify ownership
    const { data: existing } = await supabase
      .from('campsites')
      .select('id')
      .eq('id', id)
      .eq('owner_id', req.user!.id)
      .single();

    if (!existing) {
      return res.status(404).json(errorResponse('Campsite not found'));
    }

    // Check current photo count
    const { count } = await supabase
      .from('campsite_photos')
      .select('*', { count: 'exact', head: true })
      .eq('campsite_id', id);

    if ((count || 0) >= 20) {
      return res.status(400).json(errorResponse('Maximum 20 photos allowed per campsite'));
    }

    // Photo upload handling should be done with multer middleware
    // For now, expect url in body (frontend uploads directly to Supabase Storage)
    const { url, alt_text, is_primary } = req.body;

    if (!url) {
      return res.status(400).json(errorResponse('Photo URL is required'));
    }

    // If setting as primary, unset other primary photos
    if (is_primary) {
      await supabase
        .from('campsite_photos')
        .update({ is_primary: false })
        .eq('campsite_id', id);
    }

    // Get next sort order
    const { data: lastPhoto } = await supabase
      .from('campsite_photos')
      .select('sort_order')
      .eq('campsite_id', id)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single();

    const sortOrder = (lastPhoto?.sort_order || 0) + 1;

    // Insert photo
    const { data: photo, error } = await supabase
      .from('campsite_photos')
      .insert({
        campsite_id: id,
        url,
        alt_text: alt_text || null,
        is_primary: is_primary || false,
        sort_order: sortOrder,
      })
      .select()
      .single();

    if (error) {
      logger.error('Error creating photo:', error);
      return res.status(500).json(errorResponse('Failed to upload photo'));
    }

    return res.status(201).json(successResponse(photo, 'Photo uploaded successfully'));
  } catch (error) {
    logger.error('Error uploading photo:', error);
    return res.status(500).json(errorResponse('Failed to upload photo'));
  }
});

/**
 * POST /api/dashboard/campsites/:id/photos/reorder
 * Reorder photos
 */
router.post(
  '/campsites/:id/photos/reorder',
  validate(photoReorderSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { photos } = req.body;
      const supabase = req.supabase || createSupabaseClient();

      // Verify ownership
      const { data: existing } = await supabase
        .from('campsites')
        .select('id')
        .eq('id', id)
        .eq('owner_id', req.user!.id)
        .single();

      if (!existing) {
        return res.status(404).json(errorResponse('Campsite not found'));
      }

      // Update sort orders
      for (const photo of photos) {
        await supabase
          .from('campsite_photos')
          .update({ sort_order: photo.sort_order })
          .eq('id', photo.id)
          .eq('campsite_id', id);
      }

      return res.json(successResponse(null, 'Photos reordered successfully'));
    } catch (error) {
      logger.error('Error reordering photos:', error);
      return res.status(500).json(errorResponse('Failed to reorder photos'));
    }
  }
);

/**
 * PATCH /api/dashboard/campsites/:id/photos/:photoId/primary
 * Set photo as primary
 */
router.patch(
  '/campsites/:id/photos/:photoId/primary',
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id, photoId } = req.params;
      const supabase = req.supabase || createSupabaseClient();

      // Verify ownership
      const { data: existing } = await supabase
        .from('campsites')
        .select('id')
        .eq('id', id)
        .eq('owner_id', req.user!.id)
        .single();

      if (!existing) {
        return res.status(404).json(errorResponse('Campsite not found'));
      }

      // Unset all primary photos
      await supabase
        .from('campsite_photos')
        .update({ is_primary: false })
        .eq('campsite_id', id);

      // Set new primary
      const { error } = await supabase
        .from('campsite_photos')
        .update({ is_primary: true })
        .eq('id', photoId)
        .eq('campsite_id', id);

      if (error) {
        logger.error('Error setting primary photo:', error);
        return res.status(500).json(errorResponse('Failed to set primary photo'));
      }

      return res.json(successResponse(null, 'Primary photo updated'));
    } catch (error) {
      logger.error('Error setting primary photo:', error);
      return res.status(500).json(errorResponse('Failed to set primary photo'));
    }
  }
);

/**
 * DELETE /api/dashboard/campsites/:id/photos/:photoId
 * Delete photo
 */
router.delete(
  '/campsites/:id/photos/:photoId',
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id, photoId } = req.params;
      const supabase = req.supabase || createSupabaseClient();

      // Verify ownership
      const { data: existing } = await supabase
        .from('campsites')
        .select('id')
        .eq('id', id)
        .eq('owner_id', req.user!.id)
        .single();

      if (!existing) {
        return res.status(404).json(errorResponse('Campsite not found'));
      }

      // Get photo URL for storage deletion
      const { data: photo } = await supabase
        .from('campsite_photos')
        .select('url')
        .eq('id', photoId)
        .eq('campsite_id', id)
        .single();

      if (!photo) {
        return res.status(404).json(errorResponse('Photo not found'));
      }

      // Delete from database
      const { error } = await supabase
        .from('campsite_photos')
        .delete()
        .eq('id', photoId)
        .eq('campsite_id', id);

      if (error) {
        logger.error('Error deleting photo:', error);
        return res.status(500).json(errorResponse('Failed to delete photo'));
      }

      // TODO: Delete from Supabase Storage

      return res.json(successResponse(null, 'Photo deleted successfully'));
    } catch (error) {
      logger.error('Error deleting photo:', error);
      return res.status(500).json(errorResponse('Failed to delete photo'));
    }
  }
);

// ============================================
// AMENITIES MANAGEMENT ENDPOINTS
// ============================================

/**
 * PUT /api/dashboard/campsites/:id/amenities
 * Update campsite amenities
 */
router.put(
  '/campsites/:id/amenities',
  validate(amenitiesUpdateSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { amenity_ids } = req.body;
      const supabase = req.supabase || createSupabaseClient();

      // Verify ownership
      const { data: existing } = await supabase
        .from('campsites')
        .select('id')
        .eq('id', id)
        .eq('owner_id', req.user!.id)
        .single();

      if (!existing) {
        return res.status(404).json(errorResponse('Campsite not found'));
      }

      // Delete existing amenities
      await supabase.from('campsite_amenities').delete().eq('campsite_id', id);

      // Insert new amenities
      if (amenity_ids.length > 0) {
        const amenityInserts = amenity_ids.map((amenityId: number) => ({
          campsite_id: id,
          amenity_id: amenityId,
        }));
        await supabase.from('campsite_amenities').insert(amenityInserts);
      }

      return res.json(successResponse(null, 'Amenities updated successfully'));
    } catch (error) {
      logger.error('Error updating amenities:', error);
      return res.status(500).json(errorResponse('Failed to update amenities'));
    }
  }
);

// ============================================
// INQUIRY MANAGEMENT ENDPOINTS
// ============================================

/**
 * GET /api/dashboard/inquiries
 * Get all inquiries for owner's campsites
 */
router.get(
  '/inquiries',
  validate(inquiryListQuerySchema, 'query'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { status, campsite_id, page, limit, sort, order } = req.query as {
        status?: string;
        campsite_id?: string;
        page?: number;
        limit?: number;
        sort?: string;
        order?: string;
      };

      const supabase = req.supabase || createSupabaseClient();

      // Get owner's campsite IDs
      const { data: ownerCampsites } = await supabase
        .from('campsites')
        .select('id')
        .eq('owner_id', req.user!.id);

      const campsiteIds = ownerCampsites?.map((c) => c.id) || [];

      if (campsiteIds.length === 0) {
        return res.json(paginatedResponse([], 0, page || 1, limit || 20));
      }

      const offset = ((page || 1) - 1) * (limit || 20);

      // Build query
      let query = supabase
        .from('inquiries')
        .select(
          `
          *,
          campsite:campsites(id, name, campsite_photos(url, is_primary))
        `,
          { count: 'exact' }
        )
        .in('campsite_id', campsiteIds);

      // Filter by specific campsite
      if (campsite_id) {
        query = query.eq('campsite_id', campsite_id);
      }

      // Filter by status
      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      // Sort
      const sortColumn = sort || 'created_at';
      const sortOrder = order === 'asc' ? true : false;
      query = query.order(sortColumn, { ascending: sortOrder });

      // Paginate
      query = query.range(offset, offset + (limit || 20) - 1);

      const { data: inquiries, error, count } = await query;

      if (error) {
        logger.error('Error fetching inquiries:', error);
        return res.status(500).json(errorResponse('Failed to fetch inquiries'));
      }

      // Get unread count
      const { count: unreadCount } = await supabase
        .from('inquiries')
        .select('*', { count: 'exact', head: true })
        .in('campsite_id', campsiteIds)
        .is('read_at', null);

      // Format response
      const formattedInquiries = inquiries?.map((inquiry) => ({
        ...inquiry,
        campsite: {
          id: inquiry.campsite?.id,
          name: inquiry.campsite?.name,
          thumbnail_url:
            inquiry.campsite?.campsite_photos?.find((p: { is_primary: boolean }) => p.is_primary)?.url || null,
        },
      }));

      return res.json({
        ...paginatedResponse(formattedInquiries || [], count || 0, page || 1, limit || 20),
        unread_count: unreadCount || 0,
      });
    } catch (error) {
      logger.error('Error fetching inquiries:', error);
      return res.status(500).json(errorResponse('Failed to fetch inquiries'));
    }
  }
);

/**
 * GET /api/dashboard/inquiries/:id
 * Get single inquiry detail
 */
router.get('/inquiries/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const supabase = req.supabase || createSupabaseClient();

    // Get owner's campsite IDs
    const { data: ownerCampsites } = await supabase
      .from('campsites')
      .select('id')
      .eq('owner_id', req.user!.id);

    const campsiteIds = ownerCampsites?.map((c) => c.id) || [];

    const { data: inquiry, error } = await supabase
      .from('inquiries')
      .select(
        `
        *,
        campsite:campsites(id, name, campsite_photos(url, is_primary)),
        accommodation_type:accommodation_types(id, name, price_per_night)
      `
      )
      .eq('id', id)
      .in('campsite_id', campsiteIds)
      .single();

    if (error || !inquiry) {
      return res.status(404).json(errorResponse('Inquiry not found'));
    }

    // Mark as read if not already
    if (!inquiry.read_at) {
      await supabase
        .from('inquiries')
        .update({ read_at: new Date().toISOString() })
        .eq('id', id);
    }

    return res.json(successResponse(inquiry));
  } catch (error) {
    logger.error('Error fetching inquiry:', error);
    return res.status(500).json(errorResponse('Failed to fetch inquiry'));
  }
});

/**
 * POST /api/dashboard/inquiries/:id/reply
 * Reply to inquiry
 */
router.post(
  '/inquiries/:id/reply',
  validate(inquiryReplySchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { reply } = req.body;
      const supabase = req.supabase || createSupabaseClient();

      // Get owner's campsite IDs
      const { data: ownerCampsites } = await supabase
        .from('campsites')
        .select('id')
        .eq('owner_id', req.user!.id);

      const campsiteIds = ownerCampsites?.map((c) => c.id) || [];

      // Get inquiry with campsite and owner info
      const { data: inquiry, error: fetchError } = await supabase
        .from('inquiries')
        .select(
          `
          *,
          campsite:campsites(id, name, slug, owner:profiles(full_name))
        `
        )
        .eq('id', id)
        .in('campsite_id', campsiteIds)
        .single();

      if (fetchError || !inquiry) {
        return res.status(404).json(errorResponse('Inquiry not found'));
      }

      // Update inquiry with reply
      const { error: updateError } = await supabase
        .from('inquiries')
        .update({
          owner_reply: reply,
          replied_at: new Date().toISOString(),
          status: 'in_progress',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) {
        logger.error('Error replying to inquiry:', updateError);
        return res.status(500).json(errorResponse('Failed to send reply'));
      }

      // Send email notification to guest
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      await emailService.sendInquiryReply({
        guestName: inquiry.guest_name,
        guestEmail: inquiry.guest_email,
        ownerName: inquiry.campsite?.owner?.full_name || 'Owner',
        campsiteName: inquiry.campsite?.name || 'Campsite',
        originalMessage: inquiry.message,
        replyMessage: reply,
        campsiteUrl: `${frontendUrl}/campsites/${inquiry.campsite?.slug}`,
      });

      return res.json(successResponse(null, 'Reply sent successfully'));
    } catch (error) {
      logger.error('Error replying to inquiry:', error);
      return res.status(500).json(errorResponse('Failed to send reply'));
    }
  }
);

/**
 * PATCH /api/dashboard/inquiries/:id/status
 * Update inquiry status
 */
router.patch(
  '/inquiries/:id/status',
  validate(inquiryStatusUpdateSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const supabase = req.supabase || createSupabaseClient();

      // Get owner's campsite IDs
      const { data: ownerCampsites } = await supabase
        .from('campsites')
        .select('id')
        .eq('owner_id', req.user!.id);

      const campsiteIds = ownerCampsites?.map((c) => c.id) || [];

      const { error } = await supabase
        .from('inquiries')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .in('campsite_id', campsiteIds);

      if (error) {
        logger.error('Error updating inquiry status:', error);
        return res.status(500).json(errorResponse('Failed to update status'));
      }

      return res.json(successResponse(null, 'Status updated successfully'));
    } catch (error) {
      logger.error('Error updating inquiry status:', error);
      return res.status(500).json(errorResponse('Failed to update status'));
    }
  }
);

export default router;
