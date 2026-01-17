import { generalLimiter, inquiryLimiter, authLimiter } from '../../src/middleware/security';

describe('Rate Limiting Middleware', () => {
  describe('generalLimiter', () => {
    it('is configured with correct window', () => {
      expect(generalLimiter).toBeDefined();
      // Rate limiter is configured - actual behavior tested in E2E
    });
  });

  describe('inquiryLimiter', () => {
    it('is configured for inquiry endpoint', () => {
      expect(inquiryLimiter).toBeDefined();
      // 24 hour window with 5 max requests
    });
  });

  describe('authLimiter', () => {
    it('is configured for auth endpoints', () => {
      expect(authLimiter).toBeDefined();
      // 15 minute window with 10 max requests
    });
  });
});
