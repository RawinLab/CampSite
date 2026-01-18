import { Request, Response } from 'express';
import { rateLimiter, resetRateLimit } from '../../src/middleware/rate-limit';

describe('Rate Limiter - Block Requests', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;
  let setHeaderSpy: jest.Mock;
  let statusSpy: jest.Mock;
  let jsonSpy: jest.Mock;

  beforeEach(() => {
    setHeaderSpy = jest.fn();
    statusSpy = jest.fn().mockReturnThis();
    jsonSpy = jest.fn();

    mockReq = {
      ip: '127.0.0.1',
      user: undefined,
    } as Partial<Request>;

    mockRes = {
      setHeader: setHeaderSpy,
      status: statusSpy,
      json: jsonSpy,
    } as Partial<Response>;

    mockNext = jest.fn();

    // Clear rate limit state
    resetRateLimit('test-user');
    resetRateLimit('127.0.0.1');
  });

  describe('6th request blocked with 429 status', () => {
    it('should block the 6th request and return 429 status', () => {
      const limiter = rateLimiter({
        windowMs: 24 * 60 * 60 * 1000, // 24 hours
        max: 5,
        message: 'You have reached the maximum number of inquiries for today.',
      });

      // Make 5 allowed requests
      for (let i = 0; i < 5; i++) {
        limiter(mockReq as Request, mockRes as Response, mockNext);
      }

      expect(mockNext).toHaveBeenCalledTimes(5);

      // 6th request should be blocked
      mockNext.mockClear();
      limiter(mockReq as Request, mockRes as Response, mockNext);

      expect(statusSpy).toHaveBeenCalledWith(429);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should not call next() when request is blocked', () => {
      const limiter = rateLimiter({
        windowMs: 24 * 60 * 60 * 1000,
        max: 5,
      });

      // Exhaust limit
      for (let i = 0; i < 6; i++) {
        mockNext.mockClear();
        limiter(mockReq as Request, mockRes as Response, mockNext);
      }

      // Last call should not invoke next()
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should block all subsequent requests after limit reached', () => {
      const limiter = rateLimiter({
        windowMs: 24 * 60 * 60 * 1000,
        max: 5,
      });

      // Make 5 requests
      for (let i = 0; i < 5; i++) {
        limiter(mockReq as Request, mockRes as Response, mockNext);
      }

      // Make 3 more requests - all should be blocked
      for (let i = 0; i < 3; i++) {
        statusSpy.mockClear();
        jsonSpy.mockClear();
        limiter(mockReq as Request, mockRes as Response, mockNext);

        expect(statusSpy).toHaveBeenCalledWith(429);
        expect(jsonSpy).toHaveBeenCalled();
      }
    });

    it('should show 0 remaining when limit is exceeded', () => {
      const limiter = rateLimiter({
        windowMs: 24 * 60 * 60 * 1000,
        max: 5,
      });

      // Exhaust limit
      for (let i = 0; i < 5; i++) {
        limiter(mockReq as Request, mockRes as Response, mockNext);
      }

      // 6th request
      setHeaderSpy.mockClear();
      limiter(mockReq as Request, mockRes as Response, mockNext);

      expect(setHeaderSpy).toHaveBeenCalledWith('X-RateLimit-Limit', '5');
      expect(setHeaderSpy).toHaveBeenCalledWith('X-RateLimit-Remaining', '0');
    });
  });

  describe('Error message includes rate limit info', () => {
    it('should return custom error message in response', () => {
      const customMessage = 'You have reached the maximum number of inquiries for today.';
      const limiter = rateLimiter({
        windowMs: 24 * 60 * 60 * 1000,
        max: 5,
        message: customMessage,
      });

      // Exhaust limit
      for (let i = 0; i < 6; i++) {
        limiter(mockReq as Request, mockRes as Response, mockNext);
      }

      expect(jsonSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          error: customMessage,
        })
      );
    });

    it('should include retryAfter field in error response', () => {
      const limiter = rateLimiter({
        windowMs: 24 * 60 * 60 * 1000,
        max: 5,
      });

      // Exhaust limit
      for (let i = 0; i < 6; i++) {
        limiter(mockReq as Request, mockRes as Response, mockNext);
      }

      expect(jsonSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          retryAfter: expect.any(Number),
        })
      );
    });

    it('should return retryAfter in seconds', () => {
      const windowMs = 24 * 60 * 60 * 1000; // 24 hours
      const limiter = rateLimiter({
        windowMs,
        max: 5,
      });

      // Exhaust limit
      for (let i = 0; i < 6; i++) {
        limiter(mockReq as Request, mockRes as Response, mockNext);
      }

      const response = jsonSpy.mock.calls[0][0];
      const retryAfter = response.retryAfter;

      // Should be approximately 24 hours in seconds (86400)
      expect(retryAfter).toBeGreaterThan(86390);
      expect(retryAfter).toBeLessThanOrEqual(86400);
    });

    it('should return default error message when not specified', () => {
      const limiter = rateLimiter({
        windowMs: 24 * 60 * 60 * 1000,
        max: 5,
      });

      // Exhaust limit
      for (let i = 0; i < 6; i++) {
        limiter(mockReq as Request, mockRes as Response, mockNext);
      }

      expect(jsonSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Too many requests, please try again later.',
        })
      );
    });

    it('should maintain error format consistency', () => {
      const limiter = rateLimiter({
        windowMs: 24 * 60 * 60 * 1000,
        max: 5,
        message: 'Rate limit exceeded',
      });

      // Exhaust limit
      for (let i = 0; i < 6; i++) {
        limiter(mockReq as Request, mockRes as Response, mockNext);
      }

      const response = jsonSpy.mock.calls[0][0];

      expect(response).toHaveProperty('error');
      expect(response).toHaveProperty('retryAfter');
      expect(Object.keys(response)).toHaveLength(2);
    });
  });

  describe('Retry-After header is set', () => {
    it('should set Retry-After header when request is blocked', () => {
      const limiter = rateLimiter({
        windowMs: 24 * 60 * 60 * 1000,
        max: 5,
      });

      // Exhaust limit
      for (let i = 0; i < 5; i++) {
        limiter(mockReq as Request, mockRes as Response, mockNext);
      }

      // 6th request
      setHeaderSpy.mockClear();
      limiter(mockReq as Request, mockRes as Response, mockNext);

      const retryAfterCall = setHeaderSpy.mock.calls.find(
        call => call[0] === 'Retry-After'
      );

      expect(retryAfterCall).toBeDefined();
      expect(retryAfterCall?.[1]).toBeTruthy();
    });

    it('should set Retry-After in seconds', () => {
      const windowMs = 24 * 60 * 60 * 1000;
      const limiter = rateLimiter({
        windowMs,
        max: 5,
      });

      // Exhaust limit
      for (let i = 0; i < 6; i++) {
        limiter(mockReq as Request, mockRes as Response, mockNext);
      }

      const retryAfterCall = setHeaderSpy.mock.calls.find(
        call => call[0] === 'Retry-After'
      );

      const retryAfterSeconds = parseInt(retryAfterCall?.[1] || '0');

      // Should be approximately 24 hours in seconds
      expect(retryAfterSeconds).toBeGreaterThan(86390);
      expect(retryAfterSeconds).toBeLessThanOrEqual(86400);
    });

    it('should not set Retry-After header for allowed requests', () => {
      const limiter = rateLimiter({
        windowMs: 24 * 60 * 60 * 1000,
        max: 5,
      });

      // Make 3 allowed requests
      for (let i = 0; i < 3; i++) {
        setHeaderSpy.mockClear();
        limiter(mockReq as Request, mockRes as Response, mockNext);

        const retryAfterCall = setHeaderSpy.mock.calls.find(
          call => call[0] === 'Retry-After'
        );

        expect(retryAfterCall).toBeUndefined();
      }
    });

    it('should match Retry-After header with response retryAfter', () => {
      const limiter = rateLimiter({
        windowMs: 24 * 60 * 60 * 1000,
        max: 5,
      });

      // Exhaust limit
      for (let i = 0; i < 6; i++) {
        limiter(mockReq as Request, mockRes as Response, mockNext);
      }

      const retryAfterCall = setHeaderSpy.mock.calls.find(
        call => call[0] === 'Retry-After'
      );
      const headerValue = retryAfterCall?.[1];

      const response = jsonSpy.mock.calls[0][0];
      const bodyValue = response.retryAfter.toString();

      expect(headerValue).toBe(bodyValue);
    });

    it('should decrease Retry-After for subsequent blocked requests', () => {
      const windowMs = 1000; // 1 second for testing
      const limiter = rateLimiter({
        windowMs,
        max: 2,
      });

      // Use 2 requests
      for (let i = 0; i < 2; i++) {
        limiter(mockReq as Request, mockRes as Response, mockNext);
      }

      // 3rd request blocked
      setHeaderSpy.mockClear();
      limiter(mockReq as Request, mockRes as Response, mockNext);

      const firstRetryAfter = setHeaderSpy.mock.calls.find(
        call => call[0] === 'Retry-After'
      )?.[1];

      // Wait a bit
      jest.useFakeTimers();
      jest.advanceTimersByTime(200);
      jest.useRealTimers();

      // 4th request blocked
      setHeaderSpy.mockClear();
      limiter(mockReq as Request, mockRes as Response, mockNext);

      const secondRetryAfter = setHeaderSpy.mock.calls.find(
        call => call[0] === 'Retry-After'
      )?.[1];

      // Second retry after should be less than or equal to first
      expect(parseInt(secondRetryAfter || '0')).toBeLessThanOrEqual(
        parseInt(firstRetryAfter || '0')
      );

      jest.clearAllTimers();
    });
  });

  describe('Edge cases and special scenarios', () => {
    it('should block different users independently', () => {
      const limiter = rateLimiter({
        windowMs: 24 * 60 * 60 * 1000,
        max: 5,
      });

      // User 1 exhausts limit
      const user1Req = {
        ...mockReq,
        user: { id: 'user-1' },
      };

      for (let i = 0; i < 6; i++) {
        limiter(user1Req as Request, mockRes as Response, mockNext);
      }

      expect(statusSpy).toHaveBeenCalledWith(429);

      // User 2 should still be able to make requests
      const user2Req = {
        ...mockReq,
        user: { id: 'user-2' },
      };

      statusSpy.mockClear();
      mockNext.mockClear();

      limiter(user2Req as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(statusSpy).not.toHaveBeenCalled();
    });

    it('should handle exactly at limit (5th request allowed, 6th blocked)', () => {
      const limiter = rateLimiter({
        windowMs: 24 * 60 * 60 * 1000,
        max: 5,
      });

      // 5th request should be allowed
      for (let i = 0; i < 5; i++) {
        limiter(mockReq as Request, mockRes as Response, mockNext);
      }

      expect(mockNext).toHaveBeenCalledTimes(5);
      expect(statusSpy).not.toHaveBeenCalled();

      // 6th request should be blocked
      mockNext.mockClear();
      limiter(mockReq as Request, mockRes as Response, mockNext);

      expect(statusSpy).toHaveBeenCalledWith(429);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should maintain block even with many subsequent requests', () => {
      const limiter = rateLimiter({
        windowMs: 24 * 60 * 60 * 1000,
        max: 5,
      });

      // Exhaust limit + 10 more
      for (let i = 0; i < 15; i++) {
        limiter(mockReq as Request, mockRes as Response, mockNext);
      }

      // All requests after 5th should be blocked
      expect(statusSpy).toHaveBeenCalledTimes(10);
      expect(mockNext).toHaveBeenCalledTimes(5);
    });
  });
});
