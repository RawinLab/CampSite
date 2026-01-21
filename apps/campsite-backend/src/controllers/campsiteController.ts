import type { Request, Response } from 'express';
import { campsiteService } from '../services/campsiteService';
import { getReviews, toggleHelpfulVote, reportReview } from '../services/reviewService';
import { sendSuccess, sendNotFound, sendError, sendBadRequest, sendUnauthorized } from '../utils/response';
import type { AuthenticatedRequest } from '../middleware/auth';
import type { ReportReason } from '@campsite/shared';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Get campsite detail by ID or slug
 * GET /api/campsites/:id
 * Supports both UUID (e.g., 123e4567-e89b-12d3-a456-426614174000) and slug (e.g., camping-khao-yai-12345678)
 */
export async function getCampsiteDetail(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params; // Can be UUID or slug
  const userId = req.user?.id;

  // Validate: must be either valid UUID or valid slug format (alphanumeric with hyphens)
  const isValidSlug = /^[a-z0-9\u0E00-\u0E7F-]+$/i.test(id) && id.length >= 1 && id.length <= 255;
  if (!isValidSlug) {
    sendNotFound(res, 'Campsite not found');
    return;
  }

  try {
    const campsite = await campsiteService.getCampsiteById(id);

    if (!campsite) {
      sendNotFound(res, 'Campsite not found');
      return;
    }

    // Track view analytics (non-blocking)
    campsiteService.trackCampsiteView(id, userId).catch(() => {});

    sendSuccess(res, campsite);
  } catch (error) {
    console.error('Error fetching campsite detail:', error);
    sendError(res, 'Failed to fetch campsite detail', 500);
  }
}

/**
 * Get campsite reviews with pagination
 * GET /api/campsites/:id/reviews
 */
export async function getCampsiteReviews(req: Request, res: Response): Promise<void> {
  const { id } = req.params; // Can be UUID or slug
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
  const sortBy = (req.query.sort as 'newest' | 'highest' | 'lowest' | 'helpful') || 'newest';

  // Validate: must be either valid UUID or valid slug format
  const isValidSlug = /^[a-z0-9\u0E00-\u0E7F-]+$/i.test(id) && id.length >= 1 && id.length <= 255;
  if (!isValidSlug) {
    sendNotFound(res, 'Campsite not found');
    return;
  }

  try {
    // Check if campsite exists (supports both UUID and slug)
    const exists = await campsiteService.campsiteExists(id);
    if (!exists) {
      sendNotFound(res, 'Campsite not found');
      return;
    }

    // Get campsite ID if slug was provided
    let campsiteId = id;
    if (!UUID_REGEX.test(id)) {
      const resolvedId = await campsiteService.getCampsiteIdFromSlug(id);
      if (!resolvedId) {
        sendNotFound(res, 'Campsite not found');
        return;
      }
      campsiteId = resolvedId;
    }

    // Map sortBy to the expected format
    const sortByMap: Record<string, 'newest' | 'helpful' | 'rating_high' | 'rating_low'> = {
      newest: 'newest',
      highest: 'rating_high',
      lowest: 'rating_low',
      helpful: 'helpful',
    };

    const { reviews, total } = await getReviews(campsiteId, {
      page,
      limit,
      sortBy: sortByMap[sortBy] || 'newest',
    });

    sendSuccess(res, {
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching campsite reviews:', error);
    sendError(res, 'Failed to fetch reviews', 500);
  }
}

/**
 * Mark a review as helpful
 * POST /api/reviews/:id/helpful
 */
export async function toggleReviewHelpful(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    sendUnauthorized(res, 'Authentication required');
    return;
  }

  try {
    const result = await toggleHelpfulVote(id, userId);

    if (result.success) {
      sendSuccess(res, {
        message: 'Review helpful status toggled',
        voted: result.voted,
        helpfulCount: result.helpfulCount,
      });
    } else {
      sendBadRequest(res, 'Failed to update helpful status');
    }
  } catch (error) {
    console.error('Error toggling review helpful:', error);
    sendError(res, 'Failed to update helpful status', 500);
  }
}

/**
 * Report a review
 * POST /api/reviews/:id/report
 */
export async function submitReviewReport(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { reason, details } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    sendUnauthorized(res, 'Authentication required');
    return;
  }

  if (!reason || typeof reason !== 'string') {
    sendBadRequest(res, 'Please provide a reason for the report');
    return;
  }

  const validReasons: ReportReason[] = ['spam', 'inappropriate', 'fake', 'other'];
  if (!validReasons.includes(reason as ReportReason)) {
    sendBadRequest(res, 'Invalid report reason');
    return;
  }

  try {
    const result = await reportReview(id, userId, reason as ReportReason, details);

    if (result.success) {
      sendSuccess(res, { message: 'Report submitted successfully' });
    } else {
      sendBadRequest(res, result.error || 'Failed to submit report');
    }
  } catch (error) {
    console.error('Error reporting review:', error);
    sendError(res, 'Failed to submit report', 500);
  }
}

/**
 * Get campsite photos
 * GET /api/campsites/:id/photos
 */
export async function getCampsitePhotos(req: Request, res: Response): Promise<void> {
  const { id } = req.params; // Can be UUID or slug

  // Validate slug format
  const isValidSlug = /^[a-z0-9\u0E00-\u0E7F-]+$/i.test(id) && id.length >= 1 && id.length <= 255;
  if (!isValidSlug) {
    sendNotFound(res, 'Campsite not found');
    return;
  }

  try {
    // Resolve to UUID if slug was provided
    let campsiteId = id;
    if (!UUID_REGEX.test(id)) {
      const resolvedId = await campsiteService.getCampsiteIdFromSlug(id);
      if (!resolvedId) {
        sendNotFound(res, 'Campsite not found');
        return;
      }
      campsiteId = resolvedId;
    }

    const photos = await campsiteService.getCampsitePhotos(campsiteId);
    sendSuccess(res, photos);
  } catch (error) {
    console.error('Error fetching campsite photos:', error);
    sendError(res, 'Failed to fetch photos', 500);
  }
}

/**
 * Get campsite accommodation types
 * GET /api/campsites/:id/accommodations
 */
export async function getCampsiteAccommodations(req: Request, res: Response): Promise<void> {
  const { id } = req.params; // Can be UUID or slug

  // Validate slug format
  const isValidSlug = /^[a-z0-9\u0E00-\u0E7F-]+$/i.test(id) && id.length >= 1 && id.length <= 255;
  if (!isValidSlug) {
    sendNotFound(res, 'Campsite not found');
    return;
  }

  try {
    // Resolve to UUID if slug was provided
    let campsiteId = id;
    if (!UUID_REGEX.test(id)) {
      const resolvedId = await campsiteService.getCampsiteIdFromSlug(id);
      if (!resolvedId) {
        sendNotFound(res, 'Campsite not found');
        return;
      }
      campsiteId = resolvedId;
    }

    const accommodations = await campsiteService.getAccommodationTypes(campsiteId);
    sendSuccess(res, accommodations);
  } catch (error) {
    console.error('Error fetching accommodations:', error);
    sendError(res, 'Failed to fetch accommodations', 500);
  }
}

/**
 * Get campsite nearby attractions
 * GET /api/campsites/:id/attractions
 */
export async function getCampsiteAttractions(req: Request, res: Response): Promise<void> {
  const { id } = req.params; // Can be UUID or slug

  // Validate slug format
  const isValidSlug = /^[a-z0-9\u0E00-\u0E7F-]+$/i.test(id) && id.length >= 1 && id.length <= 255;
  if (!isValidSlug) {
    sendNotFound(res, 'Campsite not found');
    return;
  }

  try {
    // Resolve to UUID if slug was provided
    let campsiteId = id;
    if (!UUID_REGEX.test(id)) {
      const resolvedId = await campsiteService.getCampsiteIdFromSlug(id);
      if (!resolvedId) {
        sendNotFound(res, 'Campsite not found');
        return;
      }
      campsiteId = resolvedId;
    }

    const attractions = await campsiteService.getNearbyAttractions(campsiteId);
    sendSuccess(res, attractions);
  } catch (error) {
    console.error('Error fetching attractions:', error);
    sendError(res, 'Failed to fetch attractions', 500);
  }
}

/**
 * Get multiple campsites for comparison
 * GET /api/campsites/compare?ids=id1,id2,id3
 */
export async function compareCampsites(req: Request, res: Response): Promise<void> {
  const idsParam = req.query.ids as string;

  if (!idsParam) {
    sendBadRequest(res, 'Missing ids parameter');
    return;
  }

  const ids = idsParam.split(',').filter(Boolean);

  // Validate count
  if (ids.length < 2) {
    sendBadRequest(res, 'At least 2 campsite IDs are required for comparison');
    return;
  }

  if (ids.length > 3) {
    sendBadRequest(res, 'Maximum 3 campsites can be compared');
    return;
  }

  // Validate each ID is a valid UUID
  for (const id of ids) {
    if (!UUID_REGEX.test(id)) {
      sendBadRequest(res, `Invalid campsite ID: ${id}`);
      return;
    }
  }

  try {
    const campsites = await campsiteService.getCampsitesForComparison(ids);

    if (campsites.length < 2) {
      sendBadRequest(res, 'Could not find enough valid campsites for comparison');
      return;
    }

    sendSuccess(res, { campsites });
  } catch (error) {
    console.error('Error comparing campsites:', error);
    sendError(res, 'Failed to compare campsites', 500);
  }
}
