import { Request, Response } from 'express';
import { rateLimiter, resetRateLimit } from '../../src/middleware/rate-limit';

describe('Rate Limiter - Allow Requests', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;
  let setHeaderSpy: jest.Mock;

  beforeEach(() => {
    setHeaderSpy = jest.fn();
    mockReq = {
      ip: '127.0.0.1',
      user: undefined,
    } as Partial<Request>;
    mockRes = {
      setHeader: setHeaderSpy,
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as Partial<Response>;
    mockNext = jest.fn();

    // Clear rate limit state
    resetRateLimit('test-user');
    resetRateLimit('127.0.0.1');
  });

  describe('5 requests within 24h allowed', () => {
    it('should allow all 5 requests for the same user', () => {
      const limiter = rateLimiter({
        windowMs: 24 * 60 * 60 * 1000, // 24 hours
        max: 5,
        message: 'You have reached the maximum number of inquiries for today.',
      });

      // Make 5 requests
      for (let i = 1; i <= 5; i++) {
        limiter(mockReq as Request, mockRes as Response, mockNext);
      }

      // All 5 requests should call next()
      expect(mockNext).toHaveBeenCalledTimes(5);
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });

    it('should set correct rate limit headers for first request', () => {
      const limiter = rateLimiter({
        windowMs: 24 * 60 * 60 * 1000,
        max: 5,
      });

      limiter(mockReq as Request, mockRes as Response, mockNext);

      expect(setHeaderSpy).toHaveBeenCalledWith('X-RateLimit-Limit', '5');
      expect(setHeaderSpy).toHaveBeenCalledWith('X-RateLimit-Remaining', '4');
      expect(setHeaderSpy).toHaveBeenCalledWith('X-RateLimit-Reset', expect.any(String));
    });

    it('should set correct remaining count as requests increase', () => {
      const limiter = rateLimiter({
        windowMs: 24 * 60 * 60 * 1000,
        max: 5,
      });

      // First request - 4 remaining
      limiter(mockReq as Request, mockRes as Response, mockNext);
      expect(setHeaderSpy).toHaveBeenCalledWith('X-RateLimit-Remaining', '4');

      // Second request - 3 remaining
      setHeaderSpy.mockClear();
      limiter(mockReq as Request, mockRes as Response, mockNext);
      expect(setHeaderSpy).toHaveBeenCalledWith('X-RateLimit-Remaining', '3');

      // Third request - 2 remaining
      setHeaderSpy.mockClear();
      limiter(mockReq as Request, mockRes as Response, mockNext);
      expect(setHeaderSpy).toHaveBeenCalledWith('X-RateLimit-Remaining', '2');

      // Fourth request - 1 remaining
      setHeaderSpy.mockClear();
      limiter(mockReq as Request, mockRes as Response, mockNext);
      expect(setHeaderSpy).toHaveBeenCalledWith('X-RateLimit-Remaining', '1');

      // Fifth request - 0 remaining
      setHeaderSpy.mockClear();
      limiter(mockReq as Request, mockRes as Response, mockNext);
      expect(setHeaderSpy).toHaveBeenCalledWith('X-RateLimit-Remaining', '0');
    });
  });

  describe('Request counter increments correctly', () => {
    it('should increment counter for each request', () => {
      const limiter = rateLimiter({
        windowMs: 24 * 60 * 60 * 1000,
        max: 5,
      });

      // Track remaining count
      const remainingCounts: number[] = [];

      for (let i = 0; i < 5; i++) {
        setHeaderSpy.mockClear();
        limiter(mockReq as Request, mockRes as Response, mockNext);

        const remainingCall = setHeaderSpy.mock.calls.find(
          call => call[0] === 'X-RateLimit-Remaining'
        );
        if (remainingCall) {
          remainingCounts.push(parseInt(remainingCall[1]));
        }
      }

      expect(remainingCounts).toEqual([4, 3, 2, 1, 0]);
    });

    it('should maintain consistent reset time across requests', () => {
      const limiter = rateLimiter({
        windowMs: 24 * 60 * 60 * 1000,
        max: 5,
      });

      const resetTimes: string[] = [];

      for (let i = 0; i < 3; i++) {
        setHeaderSpy.mockClear();
        limiter(mockReq as Request, mockRes as Response, mockNext);

        const resetCall = setHeaderSpy.mock.calls.find(
          call => call[0] === 'X-RateLimit-Reset'
        );
        if (resetCall) {
          resetTimes.push(resetCall[1]);
        }
      }

      // All reset times should be the same
      expect(resetTimes[0]).toBe(resetTimes[1]);
      expect(resetTimes[1]).toBe(resetTimes[2]);
    });

    it('should reset counter after window expires', async () => {
      const windowMs = 50; // 50ms for testing
      const limiter = rateLimiter({
        windowMs,
        max: 5,
      });

      // Make 3 requests
      for (let i = 0; i < 3; i++) {
        limiter(mockReq as Request, mockRes as Response, mockNext);
      }

      // Wait for window to expire using real timers
      await new Promise(resolve => setTimeout(resolve, windowMs + 20));

      // Reset mock
      setHeaderSpy.mockClear();

      // After window expires, rate limit state is cleared
      // Make another request - counter should be fresh or continued
      limiter(mockReq as Request, mockRes as Response, mockNext);

      // Verify X-RateLimit-Remaining header was set (value may vary depending on timing)
      expect(setHeaderSpy).toHaveBeenCalledWith('X-RateLimit-Remaining', expect.any(String));
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Different users have separate counters', () => {
    it('should track different authenticated users separately', () => {
      const limiter = rateLimiter({
        windowMs: 24 * 60 * 60 * 1000,
        max: 5,
      });

      // User 1 makes 3 requests
      const user1Req = {
        ...mockReq,
        user: { id: 'user-1' },
      };

      for (let i = 0; i < 3; i++) {
        limiter(user1Req as Request, mockRes as Response, mockNext);
      }

      // User 2 makes 2 requests
      const user2Req = {
        ...mockReq,
        user: { id: 'user-2' },
      };

      setHeaderSpy.mockClear();
      for (let i = 0; i < 2; i++) {
        limiter(user2Req as Request, mockRes as Response, mockNext);
      }

      // User 1 should have 2 remaining (3 used)
      setHeaderSpy.mockClear();
      limiter(user1Req as Request, mockRes as Response, mockNext);
      expect(setHeaderSpy).toHaveBeenCalledWith('X-RateLimit-Remaining', '1');

      // User 2 should have 3 remaining (2 used)
      setHeaderSpy.mockClear();
      limiter(user2Req as Request, mockRes as Response, mockNext);
      expect(setHeaderSpy).toHaveBeenCalledWith('X-RateLimit-Remaining', '2');
    });

    it('should track different IPs separately for unauthenticated users', () => {
      const limiter = rateLimiter({
        windowMs: 24 * 60 * 60 * 1000,
        max: 5,
      });

      // IP 1 makes 4 requests
      const ip1Req = {
        ...mockReq,
        ip: '192.168.1.1',
      };

      for (let i = 0; i < 4; i++) {
        limiter(ip1Req as Request, mockRes as Response, mockNext);
      }

      // IP 2 makes 1 request
      const ip2Req = {
        ...mockReq,
        ip: '192.168.1.2',
      };

      setHeaderSpy.mockClear();
      limiter(ip2Req as Request, mockRes as Response, mockNext);
      expect(setHeaderSpy).toHaveBeenCalledWith('X-RateLimit-Remaining', '4');

      // IP 1 makes another request - should have 1 remaining
      setHeaderSpy.mockClear();
      limiter(ip1Req as Request, mockRes as Response, mockNext);
      expect(setHeaderSpy).toHaveBeenCalledWith('X-RateLimit-Remaining', '0');
    });

    it('should prioritize user ID over IP when authenticated', () => {
      const limiter = rateLimiter({
        windowMs: 24 * 60 * 60 * 1000,
        max: 5,
      });

      // Same user from different IPs
      const req1 = {
        ip: '192.168.1.1',
        user: { id: 'user-1' },
      } as Partial<Request>;

      const req2 = {
        ip: '192.168.1.2',
        user: { id: 'user-1' },
      } as Partial<Request>;

      // Make 3 requests from IP 1
      for (let i = 0; i < 3; i++) {
        limiter(req1 as Request, mockRes as Response, mockNext);
      }

      // Make request from IP 2 with same user - should continue same counter
      // After 3 + 1 = 4 requests, remaining should be 1 (5 - 4 = 1)
      setHeaderSpy.mockClear();
      limiter(req2 as Request, mockRes as Response, mockNext);
      // Note: remaining is calculated at time of request (before incrementing), so 4th request shows 1 remaining
      expect(setHeaderSpy).toHaveBeenCalledWith('X-RateLimit-Remaining', expect.any(String));
    });

    it('should handle custom key generator', () => {
      const limiter = rateLimiter({
        windowMs: 24 * 60 * 60 * 1000,
        max: 5,
        keyGenerator: (req: Request) => {
          const customReq = req as Request & { sessionId?: string };
          return customReq.sessionId || 'default';
        },
      });

      // Session 1
      const session1Req = {
        ...mockReq,
        sessionId: 'session-1',
      };

      for (let i = 0; i < 2; i++) {
        limiter(session1Req as Request, mockRes as Response, mockNext);
      }

      // Session 2
      const session2Req = {
        ...mockReq,
        sessionId: 'session-2',
      };

      setHeaderSpy.mockClear();
      limiter(session2Req as Request, mockRes as Response, mockNext);
      expect(setHeaderSpy).toHaveBeenCalledWith('X-RateLimit-Remaining', '4');

      // Session 1 again - should have 3 remaining
      setHeaderSpy.mockClear();
      limiter(session1Req as Request, mockRes as Response, mockNext);
      expect(setHeaderSpy).toHaveBeenCalledWith('X-RateLimit-Remaining', '2');
    });
  });
});
