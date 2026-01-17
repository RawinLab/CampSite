import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';

type UserRole = 'admin' | 'owner' | 'user';

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `This action requires one of the following roles: ${allowedRoles.join(', ')}`,
      });
    }

    next();
  };
}

export const requireAdmin = requireRole('admin');
export const requireOwner = requireRole('admin', 'owner');
export const requireUser = requireRole('admin', 'owner', 'user');
