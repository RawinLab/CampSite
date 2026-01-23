import { Router, type IRouter, Response } from 'express';
import { authMiddleware, type AuthenticatedRequest } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validation';
import {
  addToWishlistSchema,
  wishlistQuerySchema,
  batchWishlistCheckSchema,
} from '@campsite/shared';
import * as wishlistService from '../services/wishlistService';
import { sendSuccess, sendError, sendNotFound, sendConflict, sendCreated } from '../utils/response';

const router: IRouter = Router();

/**
 * @route GET /api/wishlist
 * @desc Get user's wishlist
 * @access Private
 */
router.get(
  '/',
  authMiddleware,
  validateQuery(wishlistQuerySchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { page, limit, sort } = req.query as any;
      const userId = req.user!.profileId;

      const { items, total } = await wishlistService.getWishlist(userId, {
        page: Number(page) || 1,
        limit: Number(limit) || 20,
        sort: sort || 'newest',
      });

      return sendSuccess(res, {
        data: items,
        count: total,
        pagination: {
          page: Number(page) || 1,
          limit: Number(limit) || 20,
          total,
          totalPages: Math.ceil(total / (Number(limit) || 20)),
        },
      });
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      return sendError(res, 'Failed to fetch wishlist', 500);
    }
  }
);

/**
 * @route POST /api/wishlist
 * @desc Toggle campsite in wishlist (add if not exists, remove if exists)
 * @access Private
 */
router.post(
  '/',
  authMiddleware,
  validateBody(addToWishlistSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { campsite_id, notes } = req.body;
      const userId = req.user!.profileId;

      // Check if already in wishlist
      const { is_wishlisted } = await wishlistService.isInWishlist(userId, campsite_id);

      if (is_wishlisted) {
        // Remove from wishlist
        await wishlistService.removeFromWishlist(userId, campsite_id);
        return sendSuccess(res, {
          action: 'removed',
          isInWishlist: false,
          message: 'Removed from wishlist'
        });
      } else {
        // Add to wishlist
        const item = await wishlistService.addToWishlist(userId, campsite_id, notes);
        return sendCreated(res, {
          action: 'added',
          isInWishlist: true,
          data: item
        });
      }
    } catch (error: any) {
      console.error('Error toggling wishlist:', error);
      if (error.message === 'Campsite not found or not available') {
        return sendNotFound(res, error.message);
      }
      return sendError(res, 'Failed to toggle wishlist', 500);
    }
  }
);

/**
 * @route DELETE /api/wishlist/:campsiteId
 * @desc Remove campsite from wishlist
 * @access Private
 */
router.delete(
  '/:campsiteId',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { campsiteId } = req.params;
      const userId = req.user!.profileId;

      await wishlistService.removeFromWishlist(userId, campsiteId);

      return sendSuccess(res, { message: 'Removed from wishlist' });
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      return sendError(res, 'Failed to remove from wishlist', 500);
    }
  }
);

/**
 * @route GET /api/wishlist/check/:campsiteId
 * @desc Check if campsite is in user's wishlist
 * @access Private
 */
router.get(
  '/check/:campsiteId',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { campsiteId } = req.params;
      const userId = req.user!.profileId;

      const result = await wishlistService.isInWishlist(userId, campsiteId);

      return sendSuccess(res, result);
    } catch (error) {
      console.error('Error checking wishlist:', error);
      return sendError(res, 'Failed to check wishlist status', 500);
    }
  }
);

/**
 * @route POST /api/wishlist/check-batch
 * @desc Batch check if campsites are in user's wishlist
 * @access Private
 */
router.post(
  '/check-batch',
  authMiddleware,
  validateBody(batchWishlistCheckSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { campsite_ids } = req.body;
      const userId = req.user!.profileId;

      const result = await wishlistService.batchCheckWishlist(userId, campsite_ids);

      return sendSuccess(res, result);
    } catch (error) {
      console.error('Error batch checking wishlist:', error);
      return sendError(res, 'Failed to check wishlist status', 500);
    }
  }
);

/**
 * @route GET /api/wishlist/count
 * @desc Get wishlist count for user
 * @access Private
 */
router.get(
  '/count',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.profileId;
      const count = await wishlistService.getWishlistCount(userId);

      return sendSuccess(res, { count });
    } catch (error) {
      console.error('Error getting wishlist count:', error);
      return sendError(res, 'Failed to get wishlist count', 500);
    }
  }
);

export default router;
