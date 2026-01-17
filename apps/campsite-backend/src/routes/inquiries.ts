// Inquiry Routes for Camping Thailand Platform
// Rate limiting: 5 inquiries per user per 24 hours (Q18)

import { Router, type IRouter } from 'express';
import { createInquirySchema, inquiryReplySchema, inquiryStatusUpdateSchema } from '@campsite/shared';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { inquiryRateLimiter } from '../middleware/rate-limit';
import * as inquiryController from '../controllers/inquiryController';

const router: IRouter = Router();

// ============================================
// PUBLIC/OPTIONAL AUTH ROUTES
// ============================================

/**
 * POST /api/inquiries
 * Create a new inquiry (rate limited to 5 per 24 hours)
 * Optional auth - guests can send inquiries without login
 */
router.post(
  '/',
  optionalAuthMiddleware,
  inquiryRateLimiter,
  validateBody(createInquirySchema),
  inquiryController.createInquiry
);

/**
 * GET /api/inquiries/rate-limit
 * Check current rate limit status
 */
router.get(
  '/rate-limit',
  optionalAuthMiddleware,
  inquiryRateLimiter, // This sets the headers
  inquiryController.getRateLimitStatus
);

// ============================================
// AUTHENTICATED USER ROUTES
// ============================================

/**
 * GET /api/inquiries/user
 * Get user's sent inquiries (requires login)
 */
router.get(
  '/user',
  authMiddleware,
  inquiryController.getUserInquiries
);

// ============================================
// OWNER ROUTES
// ============================================

/**
 * GET /api/inquiries/owner
 * Get all inquiries for owner's campsites (paginated)
 * Query params: status, campsite_id, page, limit, sort, order
 */
router.get(
  '/owner',
  authMiddleware,
  inquiryController.getOwnerInquiries
);

/**
 * GET /api/inquiries/owner/:inquiryId
 * Get single inquiry details
 */
router.get(
  '/owner/:inquiryId',
  authMiddleware,
  inquiryController.getOwnerInquiryById
);

/**
 * POST /api/inquiries/owner/:inquiryId/reply
 * Reply to an inquiry
 */
router.post(
  '/owner/:inquiryId/reply',
  authMiddleware,
  validateBody(inquiryReplySchema),
  inquiryController.replyToInquiry
);

/**
 * PATCH /api/inquiries/owner/:inquiryId/status
 * Update inquiry status
 */
router.patch(
  '/owner/:inquiryId/status',
  authMiddleware,
  validateBody(inquiryStatusUpdateSchema),
  inquiryController.updateInquiryStatus
);

export default router;
