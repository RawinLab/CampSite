import { Request, Response, NextFunction } from 'express';
import { createSupabaseClient } from '../lib/supabase';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;           // Auth user ID (from auth.users)
    profileId: string;    // Profile ID (from profiles table)
    email: string;
    role: 'admin' | 'owner' | 'user';
  };
  supabase?: ReturnType<typeof createSupabaseClient>;
}

// Verify JWT and attach user to request
export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : req.cookies?.['sb-access-token'];

    if (!token) {
      return res.status(401).json({ error: 'No authentication token provided' });
    }

    // Create Supabase client with token
    const supabase = createSupabaseClient(token);
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Get user profile with role and profile ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('auth_user_id', user.id)
      .single();

    req.user = {
      id: user.id,
      profileId: profile?.id || user.id,  // Profile ID for table references
      email: user.email!,
      role: profile?.role || 'user',
    };
    req.supabase = supabase;

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
}

// Optional auth - doesn't fail if no token
export async function optionalAuthMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : req.cookies?.['sb-access-token'];

    if (token) {
      const supabase = createSupabaseClient(token);
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, role')
          .eq('auth_user_id', user.id)
          .single();

        req.user = {
          id: user.id,
          profileId: profile?.id || user.id,
          email: user.email!,
          role: profile?.role || 'user',
        };
        req.supabase = supabase;
      }
    }

    next();
  } catch (error) {
    // Ignore auth errors for optional auth
    next();
  }
}
