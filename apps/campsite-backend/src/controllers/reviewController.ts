import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import * as reviewService from '../services/reviewService';
import type {
  ReviewSortBy,
  ReviewerType,
  ReportReason,
} from '@campsite/shared';

/**
 * Get review summary for a campsite
 */
export async function getReviewSummary(req: AuthenticatedRequest, res: Response) {
  try {
    const { campsiteId } = req.params;
    const summary = await reviewService.getReviewSummary(campsiteId);
    res.json({ success: true, data: summary });
  } catch (error) {
    console.error('Get review summary error:', error);
    res.status(500).json({ error: 'Failed to get review summary' });
  }
}

/**
 * Get paginated reviews for a campsite
 */
export async function getReviews(req: AuthenticatedRequest, res: Response) {
  try {
    const { campsiteId } = req.params;
    const {
      page = '1',
      limit = '5',
      sort_by = 'newest',
      reviewer_type,
    } = req.query;

    const { reviews, total } = await reviewService.getReviews(campsiteId, {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      sortBy: sort_by as ReviewSortBy,
      reviewerType: reviewer_type as ReviewerType | undefined,
      userId: req.user?.id,
    });

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    res.json({
      success: true,
      data: reviews,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ error: 'Failed to get reviews' });
  }
}

/**
 * Create a new review (auto-approved per Q11)
 */
export async function createReview(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const result = await reviewService.createReview(req.body, userId);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: result.review,
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ error: 'Failed to create review' });
  }
}

/**
 * Toggle helpful vote on a review
 */
export async function toggleHelpfulVote(req: AuthenticatedRequest, res: Response) {
  try {
    const { reviewId } = req.params;
    const userId = req.user!.id;

    const result = await reviewService.toggleHelpfulVote(reviewId, userId);

    if (!result.success) {
      return res.status(400).json({ error: 'Failed to update helpful vote' });
    }

    res.json({
      success: true,
      data: {
        helpful_count: result.helpfulCount,
        user_voted: result.voted,
      },
    });
  } catch (error) {
    console.error('Toggle helpful vote error:', error);
    res.status(500).json({ error: 'Failed to update helpful vote' });
  }
}

/**
 * Report a review (Q11: report-based moderation)
 */
export async function reportReview(req: AuthenticatedRequest, res: Response) {
  try {
    const { reviewId } = req.params;
    const userId = req.user!.id;
    const { reason, details } = req.body;

    const result = await reviewService.reportReview(
      reviewId,
      userId,
      reason as ReportReason,
      details
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      message: 'Review reported successfully',
    });
  } catch (error) {
    console.error('Report review error:', error);
    res.status(500).json({ error: 'Failed to report review' });
  }
}

/**
 * Admin: Get reported reviews
 */
export async function getReportedReviews(req: AuthenticatedRequest, res: Response) {
  try {
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { page = '1', limit = '20' } = req.query;
    const { reviews, total } = await reviewService.getReportedReviews(
      parseInt(page as string),
      parseInt(limit as string)
    );

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    res.json({
      success: true,
      data: reviews,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get reported reviews error:', error);
    res.status(500).json({ error: 'Failed to get reported reviews' });
  }
}

/**
 * Admin: Hide a review
 */
export async function hideReview(req: AuthenticatedRequest, res: Response) {
  try {
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { reviewId } = req.params;
    const { reason } = req.body;

    const result = await reviewService.hideReview(reviewId, req.user!.id, reason);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      message: 'Review hidden successfully',
    });
  } catch (error) {
    console.error('Hide review error:', error);
    res.status(500).json({ error: 'Failed to hide review' });
  }
}

/**
 * Admin: Unhide a review
 */
export async function unhideReview(req: AuthenticatedRequest, res: Response) {
  try {
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { reviewId } = req.params;

    const result = await reviewService.unhideReview(reviewId);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      message: 'Review unhidden successfully',
    });
  } catch (error) {
    console.error('Unhide review error:', error);
    res.status(500).json({ error: 'Failed to unhide review' });
  }
}

/**
 * Owner: Add response to a review
 */
export async function addOwnerResponse(req: AuthenticatedRequest, res: Response) {
  try {
    if (req.user!.role !== 'owner' && req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Owner access required' });
    }

    const { reviewId } = req.params;
    const { response } = req.body;

    const result = await reviewService.addOwnerResponse(reviewId, req.user!.id, response);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      message: 'Response added successfully',
    });
  } catch (error) {
    console.error('Add owner response error:', error);
    res.status(500).json({ error: 'Failed to add response' });
  }
}
