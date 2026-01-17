import { Router, type IRouter } from 'express';
import {
  createReviewSchema,
  reportReviewSchema,
  hideReviewSchema,
  ownerResponseSchema,
} from '@campsite/shared';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import * as reviewController from '../controllers/reviewController';

const router: IRouter = Router();

// ============================================
// PUBLIC ROUTES (optional auth for user-specific data)
// ============================================

/**
 * GET /api/reviews/campsite/:campsiteId
 * Get paginated reviews for a campsite
 * Query params: page, limit, sort_by, reviewer_type
 */
router.get(
  '/campsite/:campsiteId',
  optionalAuthMiddleware,
  reviewController.getReviews
);

/**
 * GET /api/reviews/campsite/:campsiteId/summary
 * Get review summary for a campsite (average rating, distribution, category breakdown)
 */
router.get(
  '/campsite/:campsiteId/summary',
  reviewController.getReviewSummary
);

// ============================================
// AUTHENTICATED USER ROUTES
// ============================================

/**
 * POST /api/reviews
 * Create a new review (auto-approved per Q11)
 * Requires authentication
 */
router.post(
  '/',
  authMiddleware,
  validateBody(createReviewSchema),
  reviewController.createReview
);

/**
 * POST /api/reviews/:reviewId/helpful
 * Toggle helpful vote on a review
 * Requires authentication
 */
router.post(
  '/:reviewId/helpful',
  authMiddleware,
  reviewController.toggleHelpfulVote
);

/**
 * POST /api/reviews/:reviewId/report
 * Report a review for moderation
 * Requires authentication
 */
router.post(
  '/:reviewId/report',
  authMiddleware,
  validateBody(reportReviewSchema.omit({ review_id: true })),
  reviewController.reportReview
);

// ============================================
// OWNER ROUTES
// ============================================

/**
 * POST /api/reviews/:reviewId/response
 * Add owner response to a review
 * Requires owner role
 */
router.post(
  '/:reviewId/response',
  authMiddleware,
  validateBody(ownerResponseSchema.omit({ review_id: true })),
  reviewController.addOwnerResponse
);

// ============================================
// ADMIN ROUTES
// ============================================

/**
 * GET /api/reviews/admin/reported
 * Get all reported reviews for moderation
 * Requires admin role
 */
router.get(
  '/admin/reported',
  authMiddleware,
  reviewController.getReportedReviews
);

/**
 * POST /api/reviews/admin/:reviewId/hide
 * Hide a review (moderation action)
 * Requires admin role
 */
router.post(
  '/admin/:reviewId/hide',
  authMiddleware,
  validateBody(hideReviewSchema.omit({ review_id: true })),
  reviewController.hideReview
);

/**
 * POST /api/reviews/admin/:reviewId/unhide
 * Unhide a previously hidden review
 * Requires admin role
 */
router.post(
  '/admin/:reviewId/unhide',
  authMiddleware,
  reviewController.unhideReview
);

export default router;
