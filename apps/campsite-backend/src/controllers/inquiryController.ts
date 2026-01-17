// Inquiry Controller for Camping Thailand Platform
// Handles HTTP requests for inquiry operations
// Rate limiting: 5 inquiries per user per 24 hours (Q18)

import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import * as inquiryService from '../services/inquiryService';
import { inquiryListQuerySchema } from '@campsite/shared';
import logger from '../utils/logger';

/**
 * POST /api/inquiries
 * Create a new inquiry (rate limited to 5 per 24 hours)
 */
export async function createInquiry(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const result = await inquiryService.createInquiry(req.body, userId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
      });
    }

    // Get remaining rate limit info from headers
    const remaining = res.getHeader('X-RateLimit-Remaining') as string;
    const limit = res.getHeader('X-RateLimit-Limit') as string;
    const reset = res.getHeader('X-RateLimit-Reset') as string;

    res.status(201).json({
      success: true,
      message: 'Inquiry sent successfully. The owner will be notified.',
      data: result.inquiry,
      rateLimitInfo: {
        remaining: parseInt(remaining) || 0,
        limit: parseInt(limit) || 5,
        resetAt: reset ? new Date(parseInt(reset)).toISOString() : null,
      },
    });
  } catch (error) {
    logger.error('Create inquiry controller error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to send inquiry',
    });
  }
}

/**
 * GET /api/inquiries/owner
 * Get all inquiries for owner's campsites (paginated)
 */
export async function getOwnerInquiries(req: AuthenticatedRequest, res: Response) {
  try {
    // Verify owner role
    if (req.user!.role !== 'owner' && req.user!.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Owner access required',
      });
    }

    // Parse and validate query params
    const queryResult = inquiryListQuerySchema.safeParse(req.query);
    if (!queryResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        details: queryResult.error.flatten().fieldErrors,
      });
    }

    const result = await inquiryService.getOwnerInquiries(req.user!.id, queryResult.data);

    res.json({
      success: true,
      data: result.inquiries,
      pagination: {
        page: queryResult.data.page,
        limit: queryResult.data.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / queryResult.data.limit),
      },
      unread_count: result.unread_count,
    });
  } catch (error) {
    logger.error('Get owner inquiries controller error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get inquiries',
    });
  }
}

/**
 * GET /api/inquiries/owner/:inquiryId
 * Get single inquiry details for owner
 */
export async function getOwnerInquiryById(req: AuthenticatedRequest, res: Response) {
  try {
    // Verify owner role
    if (req.user!.role !== 'owner' && req.user!.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Owner access required',
      });
    }

    const { inquiryId } = req.params;
    const result = await inquiryService.getInquiryById(inquiryId, req.user!.id);

    if (!result.inquiry) {
      return res.status(404).json({
        success: false,
        error: result.error || 'Inquiry not found',
      });
    }

    res.json({
      success: true,
      data: result.inquiry,
    });
  } catch (error) {
    logger.error('Get owner inquiry by ID controller error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get inquiry',
    });
  }
}

/**
 * POST /api/inquiries/owner/:inquiryId/reply
 * Reply to an inquiry
 */
export async function replyToInquiry(req: AuthenticatedRequest, res: Response) {
  try {
    // Verify owner role
    if (req.user!.role !== 'owner' && req.user!.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Owner access required',
      });
    }

    const { inquiryId } = req.params;
    const { reply } = req.body;

    if (!reply || reply.length < 10 || reply.length > 2000) {
      return res.status(400).json({
        success: false,
        error: 'Reply must be between 10 and 2000 characters',
      });
    }

    const result = await inquiryService.replyToInquiry(inquiryId, req.user!.id, reply);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
      });
    }

    res.json({
      success: true,
      message: 'Reply sent successfully. The guest will be notified.',
    });
  } catch (error) {
    logger.error('Reply to inquiry controller error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to send reply',
    });
  }
}

/**
 * PATCH /api/inquiries/owner/:inquiryId/status
 * Update inquiry status
 */
export async function updateInquiryStatus(req: AuthenticatedRequest, res: Response) {
  try {
    // Verify owner role
    if (req.user!.role !== 'owner' && req.user!.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Owner access required',
      });
    }

    const { inquiryId } = req.params;
    const { status } = req.body;

    const validStatuses = ['new', 'in_progress', 'resolved', 'closed'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Status must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const result = await inquiryService.updateInquiryStatus(inquiryId, req.user!.id, status);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
      });
    }

    res.json({
      success: true,
      message: 'Inquiry status updated',
    });
  } catch (error) {
    logger.error('Update inquiry status controller error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to update status',
    });
  }
}

/**
 * GET /api/inquiries/user
 * Get user's sent inquiries
 */
export async function getUserInquiries(req: AuthenticatedRequest, res: Response) {
  try {
    const { page = '1', limit = '10' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = Math.min(parseInt(limit as string), 50);

    const result = await inquiryService.getUserInquiries(req.user!.id, pageNum, limitNum);

    res.json({
      success: true,
      data: result.inquiries,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: result.total,
        totalPages: Math.ceil(result.total / limitNum),
      },
    });
  } catch (error) {
    logger.error('Get user inquiries controller error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get inquiries',
    });
  }
}

/**
 * GET /api/inquiries/rate-limit
 * Get current rate limit status for the user
 */
export async function getRateLimitStatus(req: AuthenticatedRequest, res: Response) {
  try {
    // Rate limit headers are set by the middleware
    const remaining = res.getHeader('X-RateLimit-Remaining') as string;
    const limit = res.getHeader('X-RateLimit-Limit') as string;
    const reset = res.getHeader('X-RateLimit-Reset') as string;

    res.json({
      success: true,
      data: {
        remaining: parseInt(remaining) || 5,
        limit: parseInt(limit) || 5,
        resetAt: reset ? new Date(parseInt(reset)).toISOString() : null,
      },
    });
  } catch (error) {
    logger.error('Get rate limit status error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get rate limit status',
    });
  }
}
