import { Response, NextFunction } from 'express';
import { requireRole, requireAdmin, requireOwner, requireUser } from '../../src/middleware/roleGuard';
import { AuthenticatedRequest } from '../../src/middleware/auth';

describe('Role Guard Middleware', () => {
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  describe('requireRole', () => {
    it('returns 401 when user not authenticated', () => {
      const mockReq: Partial<AuthenticatedRequest> = {};
      const middleware = requireRole('admin');

      middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Authentication required' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('returns 403 when user does not have required role', () => {
      const mockReq: Partial<AuthenticatedRequest> = {
        user: { id: 'user-123', email: 'test@test.com', role: 'user' },
      };
      const middleware = requireRole('admin');

      middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Forbidden',
        message: 'This action requires one of the following roles: admin',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('calls next when user has required role', () => {
      const mockReq: Partial<AuthenticatedRequest> = {
        user: { id: 'user-123', email: 'test@test.com', role: 'admin' },
      };
      const middleware = requireRole('admin');

      middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('allows multiple roles', () => {
      const mockReq: Partial<AuthenticatedRequest> = {
        user: { id: 'user-123', email: 'test@test.com', role: 'owner' },
      };
      const middleware = requireRole('admin', 'owner');

      middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('requireAdmin', () => {
    it('only allows admin role', () => {
      const mockReq: Partial<AuthenticatedRequest> = {
        user: { id: 'user-123', email: 'test@test.com', role: 'owner' },
      };

      requireAdmin(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    it('allows admin', () => {
      const mockReq: Partial<AuthenticatedRequest> = {
        user: { id: 'user-123', email: 'test@test.com', role: 'admin' },
      };

      requireAdmin(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('requireOwner', () => {
    it('allows admin', () => {
      const mockReq: Partial<AuthenticatedRequest> = {
        user: { id: 'user-123', email: 'test@test.com', role: 'admin' },
      };

      requireOwner(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('allows owner', () => {
      const mockReq: Partial<AuthenticatedRequest> = {
        user: { id: 'user-123', email: 'test@test.com', role: 'owner' },
      };

      requireOwner(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('denies regular user', () => {
      const mockReq: Partial<AuthenticatedRequest> = {
        user: { id: 'user-123', email: 'test@test.com', role: 'user' },
      };

      requireOwner(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });
  });

  describe('requireUser', () => {
    it('allows all authenticated users', () => {
      const roles: Array<'admin' | 'owner' | 'user'> = ['admin', 'owner', 'user'];

      roles.forEach((role) => {
        const mockReq: Partial<AuthenticatedRequest> = {
          user: { id: 'user-123', email: 'test@test.com', role },
        };
        const mockNextFn = jest.fn();

        requireUser(mockReq as AuthenticatedRequest, mockRes as Response, mockNextFn);

        expect(mockNextFn).toHaveBeenCalled();
      });
    });
  });
});
