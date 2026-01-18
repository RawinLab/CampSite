import { Request, Response, NextFunction } from 'express';
import { requireRole, requireAdmin, requireOwner, requireUser } from '../../src/middleware/roleGuard';
import { AuthenticatedRequest } from '../../src/middleware/auth';

describe('Role Guard Middleware', () => {
  let mockReq: Partial<AuthenticatedRequest>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock<NextFunction>;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  describe('requireAdmin', () => {
    it('should return 401 when user is not authenticated', () => {
      mockReq.user = undefined;

      requireAdmin(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Authentication required' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 when user role is "user"', () => {
      mockReq.user = {
        id: '123',
        email: 'user@example.com',
        role: 'user',
      };

      requireAdmin(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Forbidden',
        message: 'This action requires one of the following roles: admin',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 when user role is "owner"', () => {
      mockReq.user = {
        id: '456',
        email: 'owner@example.com',
        role: 'owner',
      };

      requireAdmin(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Forbidden',
        message: 'This action requires one of the following roles: admin',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next() when user role is "admin"', () => {
      mockReq.user = {
        id: '789',
        email: 'admin@example.com',
        role: 'admin',
      };

      requireAdmin(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });

    it('should include proper error message with allowed roles', () => {
      mockReq.user = {
        id: '123',
        email: 'user@example.com',
        role: 'user',
      };

      requireAdmin(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Forbidden',
          message: expect.stringContaining('admin'),
        })
      );
    });
  });

  describe('requireOwner', () => {
    it('should return 401 when user is not authenticated', () => {
      mockReq.user = undefined;

      requireOwner(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Authentication required' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 when user role is "user"', () => {
      mockReq.user = {
        id: '123',
        email: 'user@example.com',
        role: 'user',
      };

      requireOwner(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Forbidden',
        message: 'This action requires one of the following roles: admin, owner',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next() when user role is "owner"', () => {
      mockReq.user = {
        id: '456',
        email: 'owner@example.com',
        role: 'owner',
      };

      requireOwner(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });

    it('should call next() when user role is "admin"', () => {
      mockReq.user = {
        id: '789',
        email: 'admin@example.com',
        role: 'admin',
      };

      requireOwner(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });

    it('should include proper error message with allowed roles', () => {
      mockReq.user = {
        id: '123',
        email: 'user@example.com',
        role: 'user',
      };

      requireOwner(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Forbidden',
          message: expect.stringContaining('admin, owner'),
        })
      );
    });
  });

  describe('requireUser', () => {
    it('should return 401 when user is not authenticated', () => {
      mockReq.user = undefined;

      requireUser(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Authentication required' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next() when user role is "user"', () => {
      mockReq.user = {
        id: '123',
        email: 'user@example.com',
        role: 'user',
      };

      requireUser(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });

    it('should call next() when user role is "owner"', () => {
      mockReq.user = {
        id: '456',
        email: 'owner@example.com',
        role: 'owner',
      };

      requireUser(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });

    it('should call next() when user role is "admin"', () => {
      mockReq.user = {
        id: '789',
        email: 'admin@example.com',
        role: 'admin',
      };

      requireUser(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });
  });

  describe('requireRole factory function', () => {
    it('should create middleware with single role', () => {
      const middleware = requireRole('owner');

      mockReq.user = {
        id: '456',
        email: 'owner@example.com',
        role: 'owner',
      };

      middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should create middleware with multiple roles', () => {
      const middleware = requireRole('admin', 'owner');

      mockReq.user = {
        id: '456',
        email: 'owner@example.com',
        role: 'owner',
      };

      middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should reject user with role not in allowed list', () => {
      const middleware = requireRole('admin', 'owner');

      mockReq.user = {
        id: '123',
        email: 'user@example.com',
        role: 'user',
      };

      middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle empty roles array by rejecting all users', () => {
      const middleware = requireRole();

      mockReq.user = {
        id: '789',
        email: 'admin@example.com',
        role: 'admin',
      };

      middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Error response format', () => {
    it('should return 401 response with correct JSON structure', () => {
      mockReq.user = undefined;

      requireAdmin(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(String),
        })
      );
    });

    it('should return 403 response with correct JSON structure', () => {
      mockReq.user = {
        id: '123',
        email: 'user@example.com',
        role: 'user',
      };

      requireAdmin(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(String),
          message: expect.any(String),
        })
      );
    });

    it('should have descriptive error messages for 401', () => {
      mockReq.user = undefined;

      requireAdmin(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Authentication required',
        })
      );
    });

    it('should have descriptive error messages for 403 with role information', () => {
      mockReq.user = {
        id: '123',
        email: 'user@example.com',
        role: 'user',
      };

      requireOwner(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Forbidden',
          message: expect.stringMatching(/requires.*roles/i),
        })
      );
    });

    it('should list all allowed roles in error message', () => {
      const middleware = requireRole('admin', 'owner', 'user');

      mockReq.user = {
        id: '999',
        email: 'guest@example.com',
        role: 'guest' as any,
      };

      middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('admin, owner, user'),
        })
      );
    });
  });

  describe('Edge cases', () => {
    it('should handle missing user object gracefully', () => {
      delete mockReq.user;

      requireAdmin(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle user object with missing role', () => {
      mockReq.user = {
        id: '123',
        email: 'user@example.com',
      } as any;

      requireAdmin(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should be case-sensitive for role matching', () => {
      mockReq.user = {
        id: '789',
        email: 'admin@example.com',
        role: 'Admin' as any,
      };

      requireAdmin(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should not call next() multiple times', () => {
      mockReq.user = {
        id: '789',
        email: 'admin@example.com',
        role: 'admin',
      };

      requireAdmin(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });
});
