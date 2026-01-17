import { Router, type IRouter } from 'express';
import { optionalAuthMiddleware, authMiddleware } from '../middleware/auth';
import {
  getCampsiteDetail,
  getCampsiteReviews,
  getCampsitePhotos,
  getCampsiteAccommodations,
  getCampsiteAttractions,
  toggleReviewHelpful,
  submitReviewReport,
  compareCampsites,
} from '../controllers/campsiteController';

const router: IRouter = Router();

/**
 * @route GET /api/campsites/compare
 * @desc Compare 2-3 campsites side-by-side
 * @access Public
 * @query ids - Comma-separated campsite IDs (2-3 required)
 */
router.get('/compare', compareCampsites);

/**
 * @route GET /api/campsites/:id
 * @desc Get campsite detail by ID
 * @access Public (with optional auth for tracking)
 */
router.get('/:id', optionalAuthMiddleware, getCampsiteDetail);

/**
 * @route GET /api/campsites/:id/reviews
 * @desc Get campsite reviews with pagination
 * @access Public
 * @query page - Page number (default: 1)
 * @query limit - Items per page (default: 10, max: 50)
 * @query sort - Sort order: newest, highest, lowest, helpful (default: newest)
 */
router.get('/:id/reviews', getCampsiteReviews);

/**
 * @route GET /api/campsites/:id/photos
 * @desc Get campsite photos
 * @access Public
 */
router.get('/:id/photos', getCampsitePhotos);

/**
 * @route GET /api/campsites/:id/accommodations
 * @desc Get campsite accommodation types
 * @access Public
 */
router.get('/:id/accommodations', getCampsiteAccommodations);

/**
 * @route GET /api/campsites/:id/attractions
 * @desc Get campsite nearby attractions
 * @access Public
 */
router.get('/:id/attractions', getCampsiteAttractions);

/**
 * @route POST /api/reviews/:id/helpful
 * @desc Toggle helpful status on a review
 * @access Private (requires auth)
 */
router.post('/reviews/:id/helpful', authMiddleware, toggleReviewHelpful);

/**
 * @route POST /api/reviews/:id/report
 * @desc Report a review
 * @access Public (no auth required)
 */
router.post('/reviews/:id/report', submitReviewReport);

export default router;
