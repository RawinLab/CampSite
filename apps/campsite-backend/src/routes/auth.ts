import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import { z } from 'zod';
import { ownerRequestSchema } from '@campsite/shared';
import { supabaseAdmin } from '../lib/supabase';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { inquiryRateLimiter } from '../middleware/rate-limit';
import { validateBody } from '../middleware/validation';

const router: RouterType = Router();

// Get current user profile
router.get(
  '/me',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data: profile, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', req.user!.id)
        .single();

      if (error) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      res.json({ profile });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ error: 'Failed to get profile' });
    }
  }
);

// Update current user profile
router.patch(
  '/me',
  authMiddleware,
  validateBody(
    z.object({
      full_name: z.string().min(2).max(255).optional(),
      phone: z
        .string()
        .regex(/^(0[2-9]\d{7,8}|08\d{8}|09\d{8})$/)
        .optional()
        .or(z.literal('')),
      bio: z.string().max(500).optional(),
    })
  ),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const updateData = req.body;

      // Remove empty strings
      Object.keys(updateData).forEach((key) => {
        if (updateData[key] === '') {
          updateData[key] = null;
        }
      });

      const { data: profile, error } = await supabaseAdmin
        .from('profiles')
        .update(updateData)
        .eq('id', req.user!.id)
        .select()
        .single();

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      res.json({ profile });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }
);

// Submit owner request
router.post(
  '/owner-request',
  authMiddleware,
  inquiryRateLimiter,
  validateBody(ownerRequestSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const { business_name, business_description, contact_phone } = req.body;

      // Check if user is already an owner
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('user_role')
        .eq('id', userId)
        .single();

      if (profile?.user_role === 'owner') {
        return res.status(400).json({ error: 'You are already a campsite owner' });
      }

      if (profile?.user_role === 'admin') {
        return res
          .status(400)
          .json({ error: 'Admins do not need to request owner status' });
      }

      // Check for existing pending request
      const { data: existingRequest } = await supabaseAdmin
        .from('owner_requests')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'pending')
        .single();

      if (existingRequest) {
        return res
          .status(400)
          .json({ error: 'You already have a pending owner request' });
      }

      // Create new owner request
      const { data: request, error } = await supabaseAdmin
        .from('owner_requests')
        .insert({
          user_id: userId,
          business_name,
          business_description,
          contact_phone,
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          return res
            .status(400)
            .json({ error: 'You already have a pending owner request' });
        }
        throw error;
      }

      res.status(201).json({
        message: 'Owner request submitted successfully',
        request,
      });
    } catch (error) {
      console.error('Owner request error:', error);
      res.status(500).json({ error: 'Failed to submit owner request' });
    }
  }
);

// Get user's owner requests
router.get(
  '/owner-request',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data: requests, error } = await supabaseAdmin
        .from('owner_requests')
        .select('*')
        .eq('user_id', req.user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      res.json({ requests });
    } catch (error) {
      console.error('Get owner requests error:', error);
      res.status(500).json({ error: 'Failed to get owner requests' });
    }
  }
);

// Admin: Get all pending owner requests
router.get(
  '/admin/owner-requests',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (req.user!.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const status = req.query.status as string | undefined;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;

      let query = supabaseAdmin
        .from('owner_requests')
        .select('*, profiles!owner_requests_user_id_fkey(full_name, email)', {
          count: 'exact',
        });

      if (status) {
        query = query.eq('status', status);
      }

      const { data: requests, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      res.json({
        requests,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      });
    } catch (error) {
      console.error('Get admin owner requests error:', error);
      res.status(500).json({ error: 'Failed to get owner requests' });
    }
  }
);

// Admin: Review owner request
router.patch(
  '/admin/owner-requests/:id',
  authMiddleware,
  validateBody(
    z.object({
      status: z.enum(['approved', 'rejected']),
      rejection_reason: z.string().optional(),
    })
  ),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (req.user!.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { id } = req.params;
      const { status, rejection_reason } = req.body;

      if (status === 'rejected' && !rejection_reason) {
        return res
          .status(400)
          .json({ error: 'Rejection reason is required when rejecting' });
      }

      // Update owner request
      const { data: request, error } = await supabaseAdmin
        .from('owner_requests')
        .update({
          status,
          rejection_reason: rejection_reason || null,
          reviewed_at: new Date().toISOString(),
          reviewed_by: req.user!.id,
        })
        .eq('id', id)
        .eq('status', 'pending') // Only update pending requests
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res
            .status(404)
            .json({ error: 'Pending request not found' });
        }
        throw error;
      }

      // If approved, the trigger will update the user role
      // We can also send email notification here in the future

      res.json({
        message: `Owner request ${status}`,
        request,
      });
    } catch (error) {
      console.error('Review owner request error:', error);
      res.status(500).json({ error: 'Failed to review owner request' });
    }
  }
);

export default router;
