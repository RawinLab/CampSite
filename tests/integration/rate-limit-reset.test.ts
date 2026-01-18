import { rateLimiter, resetRateLimit } from '../../apps/campsite-backend/src/middleware/rate-limit';

interface MockRequest {
  ip?: string;
  user?: { id: string };
}

interface MockResponse {
  status: jest.Mock;
  json: jest.Mock;
  setHeader: jest.Mock;
}

describe('Rate Limit Reset After 24 Hours', () => {
  let req: MockRequest;
  let res: MockResponse;
  let next: jest.Mock;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;
  let setHeaderMock: jest.Mock;

  beforeEach(() => {
    // Reset all timers and mocks
    jest.clearAllMocks();
    jest.useRealTimers();

    statusMock = jest.fn().mockReturnThis();
    jsonMock = jest.fn();
    setHeaderMock = jest.fn();

    req = {
      ip: '192.168.1.1',
    };

    res = {
      status: statusMock,
      json: jsonMock,
      setHeader: setHeaderMock,
    };

    next = jest.fn();
  });

  afterEach(() => {
    // Clean up rate limit store
    resetRateLimit('192.168.1.1');
    jest.useRealTimers();
  });

  describe('Rate limit counter resets after window expires', () => {
    it('should reset counter after 24 hour window expires', () => {
      jest.useFakeTimers();
      const now = Date.now();
      jest.setSystemTime(now);

      const limiter = rateLimiter({
        windowMs: 24 * 60 * 60 * 1000, // 24 hours
        max: 5,
        message: 'Rate limit exceeded',
      });

      // Make 5 requests (all should succeed)
      for (let i = 0; i < 5; i++) {
        limiter(req as any, res as any, next);
        expect(next).toHaveBeenCalledTimes(i + 1);
        expect(statusMock).not.toHaveBeenCalled();
      }

      // 6th request should be blocked
      limiter(req as any, res as any, next);
      expect(statusMock).toHaveBeenCalledWith(429);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Rate limit exceeded',
        retryAfter: expect.any(Number),
      });
      expect(next).toHaveBeenCalledTimes(5); // Still 5, not called on 6th

      // Advance time by 24 hours + 1ms
      jest.advanceTimersByTime(24 * 60 * 60 * 1000 + 1);

      // Reset mocks
      statusMock.mockClear();
      jsonMock.mockClear();
      next.mockClear();

      // Make another request (should succeed, counter reset)
      limiter(req as any, res as any, next);
      expect(next).toHaveBeenCalledTimes(1);
      expect(statusMock).not.toHaveBeenCalled();
      expect(jsonMock).not.toHaveBeenCalled();

      // Verify headers show reset counter
      expect(setHeaderMock).toHaveBeenCalledWith('X-RateLimit-Limit', '5');
      expect(setHeaderMock).toHaveBeenCalledWith('X-RateLimit-Remaining', '4');
      expect(setHeaderMock).toHaveBeenCalledWith('X-RateLimit-Reset', expect.any(String));

      jest.useRealTimers();
    });

    it('should allow full quota after window reset', () => {
      jest.useFakeTimers();
      const now = Date.now();
      jest.setSystemTime(now);

      const limiter = rateLimiter({
        windowMs: 24 * 60 * 60 * 1000,
        max: 5,
      });

      // Make 5 requests
      for (let i = 0; i < 5; i++) {
        limiter(req as any, res as any, next);
      }
      expect(next).toHaveBeenCalledTimes(5);

      // Fast-forward 24 hours
      jest.advanceTimersByTime(24 * 60 * 60 * 1000 + 1);

      // Reset mocks
      next.mockClear();
      statusMock.mockClear();

      // Should be able to make another 5 requests
      for (let i = 0; i < 5; i++) {
        limiter(req as any, res as any, next);
        expect(next).toHaveBeenCalledTimes(i + 1);
      }

      // 6th request in new window should be blocked
      limiter(req as any, res as any, next);
      expect(statusMock).toHaveBeenCalledWith(429);
      expect(next).toHaveBeenCalledTimes(5);

      jest.useRealTimers();
    });

    it('should not reset counter before window expires', () => {
      jest.useFakeTimers();
      const now = Date.now();
      jest.setSystemTime(now);

      const limiter = rateLimiter({
        windowMs: 24 * 60 * 60 * 1000,
        max: 5,
      });

      // Make 5 requests
      for (let i = 0; i < 5; i++) {
        limiter(req as any, res as any, next);
      }

      // Fast-forward 23 hours (not enough)
      jest.advanceTimersByTime(23 * 60 * 60 * 1000);

      // Reset mocks
      next.mockClear();
      statusMock.mockClear();

      // Should still be blocked
      limiter(req as any, res as any, next);
      expect(statusMock).toHaveBeenCalledWith(429);
      expect(next).not.toHaveBeenCalled();

      jest.useRealTimers();
    });
  });

  describe('Window time validation', () => {
    it('should verify rate limit window is 24 hours (86400000ms)', () => {
      const windowMs = 24 * 60 * 60 * 1000;
      expect(windowMs).toBe(86400000);

      const limiter = rateLimiter({
        windowMs,
        max: 5,
      });

      expect(limiter).toBeDefined();
    });

    it('should start counter fresh after window expires', () => {
      jest.useFakeTimers();
      const now = Date.now();
      jest.setSystemTime(now);

      const limiter = rateLimiter({
        windowMs: 24 * 60 * 60 * 1000,
        max: 5,
      });

      // Make 3 requests
      for (let i = 0; i < 3; i++) {
        limiter(req as any, res as any, next);
      }

      // Check headers show 2 remaining
      expect(setHeaderMock).toHaveBeenCalledWith('X-RateLimit-Remaining', '2');

      // Fast-forward past window
      jest.advanceTimersByTime(24 * 60 * 60 * 1000 + 1);

      // Reset mocks
      setHeaderMock.mockClear();

      // Make request in new window
      limiter(req as any, res as any, next);

      // Should show 4 remaining (fresh start, not 2)
      expect(setHeaderMock).toHaveBeenCalledWith('X-RateLimit-Remaining', '4');
      expect(setHeaderMock).toHaveBeenCalledWith('X-RateLimit-Limit', '5');

      jest.useRealTimers();
    });

    it('should have independent windows for different users', () => {
      jest.useFakeTimers();
      const now = Date.now();
      jest.setSystemTime(now);

      const limiter = rateLimiter({
        windowMs: 24 * 60 * 60 * 1000,
        max: 5,
      });

      const req1 = { ...req, ip: '192.168.1.1' };
      const req2 = { ...req, ip: '192.168.1.2' };

      // User 1 makes 5 requests
      for (let i = 0; i < 5; i++) {
        limiter(req1 as any, res as any, next);
      }

      // User 1 is blocked
      next.mockClear();
      statusMock.mockClear();
      limiter(req1 as any, res as any, next);
      expect(statusMock).toHaveBeenCalledWith(429);

      // User 2 should still have full quota
      next.mockClear();
      statusMock.mockClear();
      limiter(req2 as any, res as any, next);
      expect(next).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();

      // Fast-forward 24 hours
      jest.advanceTimersByTime(24 * 60 * 60 * 1000 + 1);

      // Both users should have fresh windows
      next.mockClear();
      limiter(req1 as any, res as any, next);
      expect(next).toHaveBeenCalled();

      next.mockClear();
      limiter(req2 as any, res as any, next);
      expect(next).toHaveBeenCalled();

      // Clean up
      resetRateLimit('192.168.1.2');

      jest.useRealTimers();
    });

    it('should set correct reset time in headers', () => {
      jest.useFakeTimers();
      const now = 1700000000000; // Fixed timestamp
      jest.setSystemTime(now);

      const windowMs = 24 * 60 * 60 * 1000;
      const limiter = rateLimiter({
        windowMs,
        max: 5,
      });

      limiter(req as any, res as any, next);

      // Reset time should be now + windowMs
      const expectedResetTime = now + windowMs;
      expect(setHeaderMock).toHaveBeenCalledWith('X-RateLimit-Reset', expectedResetTime.toString());

      jest.useRealTimers();
    });
  });
});
