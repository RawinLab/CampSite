// Admin Routes for Google Places API Integration
// Module 12: Google Places Data Ingestion

import { Router, type IRouter } from 'express';
import { authMiddleware, type AuthenticatedRequest } from '../../middleware/auth';
import { requireAdmin } from '../../middleware/roleGuard';
import { supabaseAdmin } from '../../lib/supabase';
import {
  triggerSyncRequestSchema,
  syncLogsQuerySchema,
  importCandidatesQuerySchema,
  approveCandidateRequestSchema,
  rejectCandidateRequestSchema,
  bulkApproveRequestSchema,
  triggerAIProcessingRequestSchema,
} from '@campsite/shared';
import googlePlacesSync from '../../services/google-places/sync.service';
import aiProcessingService from '../../services/google-places/ai-processing.service';
import logger from '../../utils/logger';
import type { Response } from 'express';

const router: IRouter = Router();

// All admin routes require authentication and admin role
router.use(authMiddleware);
router.use(requireAdmin);

// ============================================
// Google Places Sync Management
// ============================================

/**
 * @route POST /api/admin/google-places/sync/trigger
 * @desc Trigger a Google Places sync (manual or scheduled)
 * @access Admin only
 */
router.post('/sync/trigger', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = triggerSyncRequestSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.errors });
    }

    const { syncType, provinces, maxPlaces } = parsed.data;
    const config = {
      type: syncType,
      provinces,
      maxPlaces,
      downloadPhotos: true,
      fetchReviews: true,
    };

    // Start sync asynchronously (don't await)
    googlePlacesSync.startSync(config).catch((err) => {
      logger.error('Background sync failed', { error: err });
    });

    res.status(202).json({
      success: true,
      message: 'Sync started',
      estimatedDuration: '15-30 minutes',
    });

    logger.info('Google Places sync triggered', {
      config,
    });
  } catch (error: any) {
    if (error.code === 'GP_008') {
      return res.status(409).json({
        success: false,
        error: 'Sync is already running',
        code: 'SYNC_ALREADY_RUNNING',
      });
    }

    logger.error('Failed to trigger Google Places sync', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
    });
    res.status(500).json({ success: false, error: 'Failed to trigger sync' });
  }
});

/**
 * @route GET /api/admin/google-places/sync/logs
 * @desc Get Google Places sync execution history
 * @access Admin only
 */
router.get('/sync/logs', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const query = syncLogsQuerySchema.safeParse(req.query);

    if (!query.success) {
      return res.status(400).json({ success: false, error: query.error.errors });
    }

    const { status, limit, offset } = query.data;

    // Build query
    let syncQuery = supabaseAdmin
      .from('sync_logs')
      .select('*')
      .order('started_at', { ascending: false });

    if (status) {
      syncQuery = syncQuery.eq('status', status);
    }

    // Get total count
    const { count: total } = await supabaseAdmin
      .from('sync_logs')
      .select('*', { count: 'exact', head: true });

    if (status) {
      await supabaseAdmin
        .from('sync_logs')
        .select('*', { count: 'exact', head: true })
        .eq('status', status);
    }

    // Get paginated results
    const { data: logs, error } = await syncQuery.range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: logs || [],
      pagination: {
        total: total || 0,
        limit,
        offset,
      },
    });
  } catch (error) {
    logger.error('Error fetching sync logs', { error });
    res.status(500).json({ success: false, error: 'Failed to fetch sync logs' });
  }
});

/**
 * @route GET /api/admin/google-places/sync/status
 * @desc Get current sync status
 * @access Admin only
 */
router.get('/sync/status', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const status = googlePlacesSync.getSyncStatus();

    if (!status) {
      return res.json({
        success: true,
        data: null,
        message: 'No sync currently running',
      });
    }

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    logger.error('Error fetching sync status', { error });
    res.status(500).json({ success: false, error: 'Failed to fetch sync status' });
  }
});

/**
 * @route POST /api/admin/google-places/sync/cancel
 * @desc Cancel running sync
 * @access Admin only
 */
router.post('/sync/cancel', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { syncLogId } = req.body;

    if (!syncLogId) {
      return res.status(400).json({ success: false, error: 'syncLogId is required' });
    }

    await googlePlacesSync.cancelSync(syncLogId);

    res.json({
      success: true,
      message: 'Sync cancelled',
    });

    logger.info('Google Places sync cancelled', { syncLogId, adminId: req.user!.id });
  } catch (error) {
    logger.error('Error cancelling sync', { error });
    res.status(500).json({ success: false, error: 'Failed to cancel sync' });
  }
});

// ============================================
// Import Candidates Management
// ============================================

/**
 * @route GET /api/admin/google-places/candidates
 * @desc Get import candidates list
 * @access Admin only
 */
router.get('/candidates', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const query = importCandidatesQuerySchema.safeParse(req.query);

    if (!query.success) {
      return res.status(400).json({ success: false, error: query.error.errors });
    }

    const { status, minConfidence, isDuplicate, provinceId, limit, offset } = query.data;

    // Build query
    let candidatesQuery = supabaseAdmin
      .from('google_places_import_candidates')
      .select(`
        id,
        google_place_raw_id,
        confidence_score,
        is_duplicate,
        duplicate_of_campsite_id,
        suggested_province_id,
        suggested_type_id,
        status,
        created_at,
        updated_at,
        -- Denormalized fields for easier querying
        raw_data:google_places_raw!google_places_import_candidates_google_place_raw_id_fkey(
          place_id,
          raw_data
        )
      `)
      .order('confidence_score', { ascending: false })
      .order('created_at', { ascending: false });

    // Apply filters
    if (status) {
      candidatesQuery = candidatesQuery.eq('status', status);
    }

    if (minConfidence !== undefined) {
      candidatesQuery = candidatesQuery.gte('confidence_score', minConfidence);
    }

    if (isDuplicate !== undefined) {
      candidatesQuery = candidatesQuery.eq('is_duplicate', isDuplicate);
    }

    if (provinceId) {
      candidatesQuery = candidatesQuery.eq('suggested_province_id', provinceId);
    }

    // Get total count
    const { count: total } = await supabaseAdmin
      .from('google_places_import_candidates')
      .select('*', { count: 'exact', head: true });

    // Apply filters to count as well
    if (status) {
      await supabaseAdmin
        .from('google_places_import_candidates')
        .select('*', { count: 'exact', head: true })
        .eq('status', status);
    }

    if (minConfidence !== undefined) {
      await supabaseAdmin
        .from('google_places_import_candidates')
        .select('*', { count: 'exact', head: true })
        .gte('confidence_score', minConfidence);
    }

    if (isDuplicate !== undefined) {
      await supabaseAdmin
        .from('google_places_import_candidates')
        .select('*', { count: 'exact', head: true })
        .eq('is_duplicate', isDuplicate);
    }

    if (provinceId) {
      await supabaseAdmin
        .from('google_places_import_candidates')
        .select('*', { count: 'exact', head: true })
        .eq('suggested_province_id', provinceId);
    }

    // Get paginated results
    const { data: candidates, error } = await candidatesQuery.range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    // Map to response format
    const mappedCandidates = (candidates || []).map((c: any) => {
      const rawData = c.raw_data || {};
      return {
        id: c.id,
        google_place_raw_id: c.google_place_raw_id,
        place_id: rawData.place_id,
        name: rawData.name,
        address: rawData.formatted_address,
        confidence_score: c.confidence_score,
        is_duplicate: c.is_duplicate,
        duplicate_of_campsite_id: c.duplicate_of_campsite_id,
        suggested_province_id: c.suggested_province_id,
        suggested_type_id: c.suggested_type_id,
        status: c.status,
        validation_warnings: c.validation_warnings || [],
        created_at: c.created_at,
        updated_at: c.updated_at,
        // Photos from processed_data
        photos: c.processed_data?.photos || [],
        rating: rawData.rating,
      };
    });

    res.json({
      success: true,
      data: mappedCandidates,
      pagination: {
        total: total || 0,
        limit,
        offset,
      },
    });
  } catch (error) {
    logger.error('Error fetching import candidates', { error });
    res.status(500).json({ success: false, error: 'Failed to fetch candidates' });
  }
});

/**
 * @route GET /api/admin/google-places/candidates/:id
 * @desc Get single import candidate details with comparison
 * @access Admin only
 */
router.get('/candidates/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Get candidate with related data
    const { data: candidate, error } = await supabaseAdmin
      .from('google_places_import_candidates')
      .select(`
        *,
        raw_data:google_places_raw!google_places_import_candidates_google_place_raw_id_fkey(
          place_id,
          raw_data
        ),
        province:provinces!google_places_import_candidates_suggested_province_id_fkey(
          id,
          name_en,
          name_th
        ),
        type:campsite_types!google_places_import_candidates_suggested_type_id_fkey(
          id,
          name_en,
          name_th
        )
      `)
      .eq('id', id)
      .single();

    if (error || !candidate) {
      return res.status(404).json({ success: false, error: 'Candidate not found' });
    }

    // Get similar campsites if duplicate detected
    let similarCampsites: any[] = [];
    let confidenceBreakdown = {
      overall: candidate.confidence_score,
      locationMatch: 1,
      dataCompleteness: 1,
      provinceMatch: 1,
      typeMatch: 1,
    };

    if (candidate.is_duplicate && candidate.duplicate_of_campsite_id) {
      const { data: duplicate } = await supabaseAdmin
        .from('campsites')
        .select('id, name, address, latitude, longitude')
        .eq('id', candidate.duplicate_of_campsite_id)
        .single();

      if (duplicate) {
        similarCampsites.push({
          campsiteId: duplicate.id,
          name: duplicate.name,
          similarityScore: 0.9,
          distanceKm: 0,
          address: duplicate.address,
        });
      }
    }

    // Also get any nearby campsites
    const rawData = candidate.raw_data || {};
    if (rawData.geometry?.location) {
      const { data: nearby } = await supabaseAdmin
        .from('campsites')
        .select('id, name, address, latitude, longitude')
        .eq('is_active', true)
        .limit(5);

      if (nearby) {
        // Calculate distances (using simple distance formula)
        const lat1 = rawData.geometry.location.lat;
        const lng1 = rawData.geometry.location.lng;

        similarCampsites.push(...nearby
          .filter((c: any) => c.id !== candidate.duplicate_of_campsite_id)
          .map((c: any) => {
            const lat2 = c.latitude;
            const lng2 = c.longitude;
            const distance = Math.sqrt(
              Math.pow((lat2 - lat1) * 111, 2) +
              Math.pow((lng2 - lng1) * 111 * Math.cos(lat1 * Math.PI / 180), 2)
            );
            return {
              campsiteId: c.id,
              name: c.name,
              similarityScore: 0.5,
              distanceKm: distance,
              address: c.address,
            };
          })
        );
      }
    }

    // Sort by similarity score
    similarCampsites.sort((a: any, b: any) => b.similarityScore - a.similarityScore);

    res.json({
      success: true,
      data: {
        id: candidate.id,
        googlePlaceRaw: {
          id: candidate.google_place_raw_id,
          place_id: rawData.place_id,
          raw_data: rawData,
        },
        processedData: candidate.processed_data,
        duplicateComparison: {
          isDuplicate: candidate.is_duplicate,
          duplicateOfCampsiteId: candidate.duplicate_of_campsite_id,
          similarityScore: candidate.is_duplicate ? 0.9 : candidate.confidence_score,
          similarCampsites,
        },
        confidenceBreakdown,
      },
    });
  } catch (error) {
    logger.error('Error fetching candidate details', { error });
    res.status(500).json({ success: false, error: 'Failed to fetch candidate details' });
  }
});

/**
 * @route POST /api/admin/google-places/candidates/:id/approve
 * @desc Approve and import a candidate as a campsite
 * @access Admin only
 */
router.post('/candidates/:id/approve', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const parsed = approveCandidateRequestSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.errors });
    }

    const { edits, assignToOwnerId, markAsFeatured } = parsed.data;

    // Get candidate
    const { data: candidate, error: fetchError } = await supabaseAdmin
      .from('google_places_import_candidates')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !candidate) {
      return res.status(404).json({ success: false, error: 'Candidate not found' });
    }

    // Apply edits if provided
    const finalData = {
      ...candidate.processed_data,
      ...edits,
    };

    // Get raw data for photos
    const { data: rawPlace } = await supabaseAdmin
      .from('google_places_raw')
      .select('raw_data')
      .eq('id', candidate.google_place_raw_id)
      .single();

    // Use downloaded photos if available, otherwise use Google Places photo references
    let photos = finalData.photos || [];
    if (!photos || photos.length === 0) {
      // Get photo records
      const { data: photoRecords } = await supabaseAdmin
        .from('google_places_photos')
        .select('original_url, thumbnail_url')
        .eq('google_place_id', rawPlace?.raw_data?.place_id)
        .eq('download_status', 'completed')
        .limit(3);

      if (photoRecords && photoRecords.length > 0) {
        photos = photoRecords.map((p: any) => p.original_url || p.thumbnail_url).filter(Boolean);
      }
    }

    // Create campsite
    const { data: campsite, error: insertError } = await supabaseAdmin
      .from('campsites')
      .insert({
        owner_id: assignToOwnerId || null,
        province_id: finalData.province_id,
        type_id: finalData.type_id,
        name: finalData.name,
        description: finalData.description,
        address: finalData.address,
        latitude: finalData.latitude,
        longitude: finalData.longitude,
        phone: finalData.phone,
        email: finalData.email,
        website: finalData.website,
        price_min: finalData.price_min,
        price_max: finalData.price_max,
        rating_average: rawPlace?.raw_data?.rating || 0,
        review_count: rawPlace?.raw_data?.user_ratings_total || 0,
        status: 'approved', // Directly approve since it came from Google Places
        is_featured: markAsFeatured || false,
        is_verified: true, // Verified from Google Places
        is_active: true,
      })
      .select()
      .single();

    if (insertError || !campsite) {
      logger.error('Failed to create campsite from candidate', { insertError });
      throw new Error('Failed to create campsite');
    }

    // Upload photos to campsite_photos table
    if (photos.length > 0) {
      for (let i = 0; i < photos.length; i++) {
        await supabaseAdmin.from('campsite_photos').insert({
          campsite_id: campsite.id,
          url: photos[i],
          alt_text: `${finalData.name} - Photo ${i + 1}`,
          is_primary: i === 0,
          sort_order: i,
        });
      }
    }

    // Update candidate status
    await supabaseAdmin
      .from('google_places_import_candidates')
      .update({
        status: 'imported',
        imported_to_campsite_id: campsite.id,
        imported_at: new Date().toISOString(),
        reviewed_by: req.user!.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id);

    // Update raw place as imported
    await supabaseAdmin
      .from('google_places_raw')
      .update({
        is_imported: true,
        imported_to_campsite_id: campsite.id,
        imported_at: new Date().toISOString(),
      })
      .eq('id', candidate.google_place_raw_id);

    logger.info('Campsite imported from Google Places', {
      candidateId: id,
      campsiteId: campsite.id,
      adminId: req.user!.id,
    });

    res.json({
      success: true,
      campsiteId: campsite.id,
      message: 'Campsite imported successfully',
    });
  } catch (error) {
    logger.error('Error approving candidate', { error, candidateId: req.params.id });
    res.status(500).json({ success: false, error: 'Failed to approve candidate' });
  }
});

/**
 * @route POST /api/admin/google-places/candidates/:id/reject
 * @desc Reject an import candidate
 * @access Admin only
 */
router.post('/candidates/:id/reject', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const parsed = rejectCandidateRequestSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.errors });
    }

    const { reason, notes } = parsed.data;

    // Update candidate status
    const { error } = await supabaseAdmin
      .from('google_places_import_candidates')
      .update({
        status: 'rejected',
        reviewed_by: req.user!.id,
        reviewed_at: new Date().toISOString(),
        admin_notes: notes,
        validation_warnings: [`Rejected: ${reason}`],
      })
      .eq('id', id);

    if (error) {
      throw error;
    }

    logger.info('Google Places candidate rejected', {
      candidateId: id,
      adminId: req.user!.id,
      reason,
    });

    res.json({
      success: true,
      message: 'Candidate rejected',
    });
  } catch (error) {
    logger.error('Error rejecting candidate', { error, candidateId: req.params.id });
    res.status(500).json({ success: false, error: 'Failed to reject candidate' });
  }
});

/**
 * @route POST /api/admin/google-places/candidates/bulk-approve
 * @desc Bulk approve multiple candidates
 * @access Admin only
 */
router.post('/candidates/bulk-approve', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = bulkApproveRequestSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.errors });
    }

    const { candidateIds, autoAssignOwner } = parsed.data;

    const imported: string[] = [];
    const failed: Array<{ candidateId: string; error: string }> = [];

    // Process each candidate
    for (const candidateId of candidateIds) {
      try {
        // Get candidate
        const { data: candidate } = await supabaseAdmin
          .from('google_places_import_candidates')
          .select('*')
          .eq('id', candidateId)
          .single();

        if (!candidate) {
          failed.push({ candidateId, error: 'Candidate not found' });
          continue;
        }

        // Get processed data
        const processedData = candidate.processed_data;

        // Create campsite (without edits in bulk mode)
        const { data: campsite } = await supabaseAdmin
          .from('campsites')
          .insert({
            owner_id: null, // No auto-assignment in bulk mode
            province_id: processedData.province_id,
            type_id: processedData.type_id,
            name: processedData.name,
            description: processedData.description,
            address: processedData.address,
            latitude: processedData.latitude,
            longitude: processedData.longitude,
            phone: processedData.phone,
            email: processedData.email,
            website: processedData.website,
            price_min: processedData.price_min,
            price_max: processedData.price_max,
            rating_average: 0, // Will be calculated from actual user reviews
            review_count: 0,
            status: 'approved',
            is_featured: false,
            is_verified: true,
            is_active: true,
          })
          .select()
          .single();

        if (campsite) {
          // Update candidate status
          await supabaseAdmin
            .from('google_places_import_candidates')
            .update({
              status: 'imported',
              imported_to_campsite_id: campsite.id,
              imported_at: new Date().toISOString(),
              reviewed_by: req.user!.id,
              reviewed_at: new Date().toISOString(),
            })
            .eq('id', candidateId);

          // Update raw place
          await supabaseAdmin
            .from('google_places_raw')
            .update({
              is_imported: true,
              imported_to_campsite_id: campsite.id,
              imported_at: new Date().toISOString(),
            })
            .eq('id', candidate.google_place_raw_id);

          imported.push(campsite.id);
        } else {
          failed.push({ candidateId, error: 'Failed to create campsite' });
        }
      } catch (error: any) {
        logger.error('Failed to import candidate in bulk', { candidateId, error });
        failed.push({ candidateId, error: error.message || 'Unknown error' });
      }
    }

    logger.info('Bulk approve completed', {
      total: candidateIds.length,
      imported: imported.length,
      failed: failed.length,
      adminId: req.user!.id,
    });

    res.json({
      success: true,
      imported,
      failed,
      message: `Imported ${imported.length} campsites, ${failed.length} failed`,
    });
  } catch (error) {
    logger.error('Error in bulk approve', { error });
    res.status(500).json({ success: false, error: 'Failed to bulk approve' });
  }
});

// ============================================
// AI Processing Trigger
// ============================================

/**
 * @route POST /api/admin/google-places/process
 * @desc Trigger AI processing for pending raw places
 * @access Admin only
 */
router.post('/process', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = triggerAIProcessingRequestSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.errors });
    }

    const { rawPlaceIds, processAll } = parsed.data;

    // Get places to process
    let placeIdsToProcess: string[] = [];

    if (processAll) {
      // Get all pending raw places
      const { data: rawPlaces } = await supabaseAdmin
        .from('google_places_raw')
        .select('id')
        .eq('sync_status', 'pending')
        .limit(100);

      placeIdsToProcess = rawPlaces?.map((p: any) => p.id) || [];
    } else if (rawPlaceIds && rawPlaceIds.length > 0) {
      placeIdsToProcess = rawPlaceIds;
    }

    if (placeIdsToProcess.length === 0) {
      return res.json({
        success: true,
        message: 'No places to process',
        placesToProcess: 0,
      });
    }

    // Trigger AI processing asynchronously
    aiProcessingService.processPlaces(placeIdsToProcess).catch((err) => {
      logger.error('Background AI processing failed', { error: err });
    });

    logger.info('AI processing triggered', {
      placesToProcess: placeIdsToProcess.length,
      adminId: req.user!.id,
    });

    res.json({
      success: true,
      message: 'Processing started',
      placesToProcess: placeIdsToProcess.length,
    });
  } catch (error: any) {
    if (error.message === 'AI processing is already running') {
      return res.status(409).json({
        success: false,
        error: 'AI processing is already running',
        code: 'PROCESSING_ALREADY_RUNNING',
      });
    }

    logger.error('Error triggering AI processing', { error });
    res.status(500).json({ success: false, error: 'Failed to trigger AI processing' });
  }
});

export default router;
