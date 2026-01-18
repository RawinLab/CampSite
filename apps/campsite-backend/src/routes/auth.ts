import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import { z } from 'zod';
import {
  ownerRequestSchema,
  loginSchema,
  signupSchema,
  refreshTokenSchema,
  googleOAuthCallbackSchema,
} from '@campsite/shared';
import { supabaseAdmin } from '../lib/supabase';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { inquiryRateLimiter } from '../middleware/rate-limit';
import { validateBody } from '../middleware/validation';

const router: RouterType = Router();

// ============================================================
// Authentication Endpoints (Login, Register, Logout, OAuth)
// ============================================================

// Login with email and password
router.post(
  '/login',
  validateBody(loginSchema),
  async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      const { data, error } = await supabaseAdmin.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Handle specific Supabase auth errors
        if (error.message.includes('Invalid login credentials')) {
          return res.status(401).json({ error: 'Invalid email or password' });
        }
        if (error.message.includes('Email not confirmed')) {
          return res.status(401).json({ error: 'Please verify your email before logging in' });
        }
        return res.status(401).json({ error: error.message });
      }

      if (!data.user || !data.session) {
        return res.status(401).json({ error: 'Authentication failed' });
      }

      // Get user profile with role
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('auth_user_id', data.user.id)
        .single();

      res.json({
        user: {
          id: data.user.id,
          email: data.user.email,
          email_confirmed_at: data.user.email_confirmed_at,
        },
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_in: data.session.expires_in,
          expires_at: data.session.expires_at,
          token_type: data.session.token_type,
        },
        profile,
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }
);

// Register new user
router.post(
  '/register',
  validateBody(signupSchema),
  async (req: Request, res: Response) => {
    try {
      const { email, password, full_name, phone } = req.body;

      // Sign up the user with Supabase Auth
      const { data, error } = await supabaseAdmin.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name, // This will be used by the database trigger to create profile
          },
          emailRedirectTo: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/callback`,
        },
      });

      if (error) {
        // Handle specific errors
        if (error.message.includes('already registered')) {
          return res.status(400).json({ error: 'Email is already registered' });
        }
        return res.status(400).json({ error: error.message });
      }

      if (!data.user) {
        return res.status(400).json({ error: 'Registration failed' });
      }

      // If phone number provided, update the profile
      // Note: Profile is created automatically by database trigger (handle_new_user)
      if (phone) {
        // Wait briefly for trigger to create profile, then update
        setTimeout(async () => {
          await supabaseAdmin
            .from('profiles')
            .update({ phone })
            .eq('auth_user_id', data.user!.id);
        }, 100);
      }

      res.status(201).json({
        message: 'Registration successful. Please check your email to verify your account.',
        user: {
          id: data.user.id,
          email: data.user.email,
        },
        session: data.session ? {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_in: data.session.expires_in,
          expires_at: data.session.expires_at,
          token_type: data.session.token_type,
        } : null,
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  }
);

// Logout (requires authentication)
router.post(
  '/logout',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Note: Supabase handles token invalidation on the client side
      // The server can optionally call signOut to revoke the session
      // For stateless JWT approach, we just return success and let client clear tokens

      // If we want to revoke the session on server side (optional):
      // const token = req.headers.authorization?.replace('Bearer ', '');
      // await supabaseAdmin.auth.admin.signOut(token);

      res.json({
        message: 'Logged out successfully',
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Even if there's an error, we return success since client will clear tokens
      res.json({
        message: 'Logged out successfully',
      });
    }
  }
);

// Initiate Google OAuth - returns URL to redirect to
router.post(
  '/google',
  async (req: Request, res: Response) => {
    try {
      const redirectTo = req.body.redirectTo || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/callback`;

      const { data, error } = await supabaseAdmin.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      if (!data.url) {
        return res.status(400).json({ error: 'Failed to generate OAuth URL' });
      }

      res.json({
        url: data.url,
        provider: data.provider,
      });
    } catch (error) {
      console.error('Google OAuth initiation error:', error);
      res.status(500).json({ error: 'Failed to initiate Google OAuth' });
    }
  }
);

// Handle Google OAuth callback - exchange code for session
router.post(
  '/google/callback',
  validateBody(googleOAuthCallbackSchema),
  async (req: Request, res: Response) => {
    try {
      const { code } = req.body;

      // Exchange the code for a session
      const { data, error } = await supabaseAdmin.auth.exchangeCodeForSession(code);

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      if (!data.user || !data.session) {
        return res.status(400).json({ error: 'Failed to authenticate with Google' });
      }

      // Get or wait for profile (trigger creates it on first OAuth login)
      let profile = null;
      let retries = 3;

      while (retries > 0 && !profile) {
        const { data: profileData } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('auth_user_id', data.user.id)
          .single();

        profile = profileData;

        if (!profile && retries > 1) {
          // Wait briefly for trigger to complete
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        retries--;
      }

      res.json({
        user: {
          id: data.user.id,
          email: data.user.email,
          email_confirmed_at: data.user.email_confirmed_at,
        },
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_in: data.session.expires_in,
          expires_at: data.session.expires_at,
          token_type: data.session.token_type,
        },
        profile,
      });
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      res.status(500).json({ error: 'Failed to complete Google authentication' });
    }
  }
);

// Refresh access token using refresh token
router.post(
  '/refresh',
  validateBody(refreshTokenSchema),
  async (req: Request, res: Response) => {
    try {
      const { refresh_token } = req.body;

      const { data, error } = await supabaseAdmin.auth.refreshSession({
        refresh_token,
      });

      if (error) {
        return res.status(401).json({ error: 'Invalid or expired refresh token' });
      }

      if (!data.session) {
        return res.status(401).json({ error: 'Failed to refresh session' });
      }

      res.json({
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_in: data.session.expires_in,
          expires_at: data.session.expires_at,
          token_type: data.session.token_type,
        },
        user: data.user ? {
          id: data.user.id,
          email: data.user.email,
        } : null,
      });
    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(500).json({ error: 'Failed to refresh token' });
    }
  }
);

// ============================================================
// Password Reset Endpoints
// ============================================================

// Password reset request schema
const resetPasswordRequestSchema = z.object({
  email: z.string().email('Invalid email format'),
});

// Password reset confirm schema
const resetPasswordConfirmSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one digit'),
});

// Request password reset email
router.post(
  '/reset-password/request',
  inquiryRateLimiter,
  validateBody(resetPasswordRequestSchema),
  async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      // Always return success to prevent email enumeration
      // Even if user doesn't exist, we return success message
      await supabaseAdmin.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password`,
      });

      res.json({
        message: 'If your email is registered, you will receive a password reset link',
      });
    } catch (error) {
      console.error('Password reset request error:', error);
      // Still return success to prevent enumeration
      res.json({
        message: 'If your email is registered, you will receive a password reset link',
      });
    }
  }
);

// Confirm password reset with new password
router.post(
  '/reset-password/confirm',
  authMiddleware,
  validateBody(resetPasswordConfirmSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { password } = req.body;

      const { error } = await supabaseAdmin.auth.updateUser({
        password,
      });

      if (error) {
        return res.status(401).json({
          error: 'Invalid or expired token',
        });
      }

      res.json({
        message: 'Password updated successfully',
      });
    } catch (error) {
      console.error('Password reset confirm error:', error);
      res.status(500).json({ error: 'Failed to update password' });
    }
  }
);

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
