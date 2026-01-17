import { Request, Response, NextFunction } from 'express';
import { authMiddleware, optionalAuthMiddleware, AuthenticatedRequest } from '../../src/middleware/auth';

// Mock Supabase
jest.mock('../../src/lib/supabase', () => ({
  createSupabaseClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
    })),
  })),
}));

import { createSupabaseClient } from '../../src/lib/supabase';

describe('Auth Middleware', () => {
  let mockReq: Partial<AuthenticatedRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let mockSupabase: any;

  beforeEach(() => {
    mockReq = {
      headers: {},
      cookies: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    mockSupabase = (createSupabaseClient as jest.Mock)();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('authMiddleware', () => {
    it('returns 401 when no token provided', async () => {
      await authMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'No authentication token provided' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('extracts token from Authorization header', async () => {
      mockReq.headers = { authorization: 'Bearer test-token' };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@test.com' } },
        error: null,
      });

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { user_role: 'user' },
        error: null,
      });

      (createSupabaseClient as jest.Mock).mockReturnValue(mockSupabase);

      await authMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(createSupabaseClient).toHaveBeenCalledWith('test-token');
    });

    it('returns 401 for invalid token', async () => {
      mockReq.headers = { authorization: 'Bearer invalid-token' };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Invalid token'),
      });

      (createSupabaseClient as jest.Mock).mockReturnValue(mockSupabase);

      await authMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
    });
  });

  describe('optionalAuthMiddleware', () => {
    it('continues without error when no token provided', async () => {
      await optionalAuthMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toBeUndefined();
    });

    it('attaches user when valid token provided', async () => {
      mockReq.headers = { authorization: 'Bearer valid-token' };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@test.com' } },
        error: null,
      });

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { user_role: 'owner' },
        error: null,
      });

      (createSupabaseClient as jest.Mock).mockReturnValue(mockSupabase);

      await optionalAuthMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });
});
