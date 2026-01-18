/**
 * Integration Test: Mailgun API Connection
 *
 * Tests the integration logic for Mailgun email service.
 * Mocks actual API calls but validates integration patterns.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock environment variables
const originalEnv = process.env;

beforeEach(() => {
  vi.resetModules();
  process.env = {
    ...originalEnv,
    MAILGUN_API_KEY: 'test-api-key-12345',
    MAILGUN_DOMAIN: 'test.mailgun.org',
    EMAIL_FROM: 'test@campingthailand.com',
    EMAIL_FROM_NAME: 'Camping Thailand Test',
    NODE_ENV: 'production',
    FRONTEND_URL: 'http://localhost:3000',
  };
});

afterEach(() => {
  process.env = originalEnv;
  vi.restoreAllMocks();
});

describe('Mailgun API Integration', () => {
  describe('Client Initialization', () => {
    it('should initialize with API key from environment', async () => {
      const { default: emailService } = await import('../../apps/campsite-backend/src/services/emailService');

      // Mock fetch to capture initialization
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'test-message-id', message: 'Queued. Thank you.' }),
      });
      global.fetch = fetchMock;

      await emailService.sendInquiryConfirmation('test@example.com', {
        guestName: 'Test User',
        campsiteName: 'Test Campsite',
        message: 'Test message',
        checkInDate: '2026-01-20',
        checkOutDate: '2026-01-22',
      });

      // Verify Authorization header contains API key
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('api.mailgun.net'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: expect.stringContaining('Basic'),
          }),
        })
      );

      const authHeader = fetchMock.mock.calls[0][1].headers.Authorization;
      const decodedAuth = Buffer.from(authHeader.replace('Basic ', ''), 'base64').toString();
      expect(decodedAuth).toBe('api:test-api-key-12345');
    });

    it('should initialize with domain from environment', async () => {
      const { default: emailService } = await import('../../apps/campsite-backend/src/services/emailService');

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'test-message-id', message: 'Queued. Thank you.' }),
      });
      global.fetch = fetchMock;

      await emailService.sendInquiryConfirmation('test@example.com', {
        guestName: 'Test User',
        campsiteName: 'Test Campsite',
        message: 'Test message',
      });

      // Verify domain is used in API endpoint
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.mailgun.net/v3/test.mailgun.org/messages',
        expect.any(Object)
      );
    });

    it('should use mock in development environment', async () => {
      process.env.NODE_ENV = 'development';

      const { default: emailService } = await import('../../apps/campsite-backend/src/services/emailService');

      const fetchMock = vi.fn();
      global.fetch = fetchMock;

      const result = await emailService.sendInquiryConfirmation('test@example.com', {
        guestName: 'Test User',
        campsiteName: 'Test Campsite',
        message: 'Test message',
      });

      // Should use mock, not call Mailgun API
      expect(fetchMock).not.toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.messageId).toMatch(/^mock-/);
    });

    it('should use mock when API key is not configured', async () => {
      process.env.MAILGUN_API_KEY = '';

      const { default: emailService } = await import('../../apps/campsite-backend/src/services/emailService');

      const fetchMock = vi.fn();
      global.fetch = fetchMock;

      const result = await emailService.sendInquiryConfirmation('test@example.com', {
        guestName: 'Test User',
        campsiteName: 'Test Campsite',
        message: 'Test message',
      });

      expect(fetchMock).not.toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.messageId).toMatch(/^mock-/);
    });
  });

  describe('Email Sending Capability', () => {
    it('should send email with proper payload structure', async () => {
      const { default: emailService } = await import('../../apps/campsite-backend/src/services/emailService');

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: '<20260118123456.1.ABCD@test.mailgun.org>', message: 'Queued. Thank you.' }),
      });
      global.fetch = fetchMock;

      const result = await emailService.sendInquiryNotification('owner@example.com', {
        ownerName: 'John Doe',
        campsiteName: 'Forest Camp',
        guestName: 'Jane Smith',
        guestEmail: 'jane@example.com',
        guestPhone: '+66812345678',
        inquiryType: 'Availability',
        message: 'Is this campsite available for the weekend?',
        checkInDate: '2026-01-20',
        checkOutDate: '2026-01-22',
        inquiryId: 'inq_123',
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('<20260118123456.1.ABCD@test.mailgun.org>');

      // Verify payload structure
      const callArgs = fetchMock.mock.calls[0];
      expect(callArgs[0]).toBe('https://api.mailgun.net/v3/test.mailgun.org/messages');

      const requestBody = callArgs[1].body;
      expect(requestBody).toContain('from=Camping+Thailand+Test+%3Ctest%40campingthailand.com%3E');
      expect(requestBody).toContain('to=owner%40example.com');
      expect(requestBody).toContain('subject=New+Inquiry%3A+Forest+Camp+-+Availability');
      expect(requestBody).toContain('html=');
    });

    it('should handle inquiry confirmation emails', async () => {
      const { default: emailService } = await import('../../apps/campsite-backend/src/services/emailService');

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'confirmation-msg-id' }),
      });
      global.fetch = fetchMock;

      const result = await emailService.sendInquiryConfirmation('guest@example.com', {
        guestName: 'Jane Smith',
        campsiteName: 'Forest Camp',
        message: 'I would like to book this campsite.',
        checkInDate: '2026-01-20',
        checkOutDate: '2026-01-22',
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('confirmation-msg-id');

      const requestBody = fetchMock.mock.calls[0][1].body;
      expect(requestBody).toContain('to=guest%40example.com');
      expect(requestBody).toContain('subject=Inquiry+Sent%3A+Forest+Camp');
    });

    it('should handle inquiry reply emails', async () => {
      const { default: emailService } = await import('../../apps/campsite-backend/src/services/emailService');

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'reply-msg-id' }),
      });
      global.fetch = fetchMock;

      const result = await emailService.sendInquiryReplyNotification('guest@example.com', {
        guestName: 'Jane Smith',
        campsiteName: 'Forest Camp',
        ownerReply: 'Yes, we have availability for those dates!',
        originalMessage: 'Is this campsite available for the weekend?',
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('reply-msg-id');

      const requestBody = fetchMock.mock.calls[0][1].body;
      expect(requestBody).toContain('to=guest%40example.com');
      expect(requestBody).toContain('subject=Reply+from+Forest+Camp');
    });

    it('should include HTML content in email payload', async () => {
      const { default: emailService } = await import('../../apps/campsite-backend/src/services/emailService');

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'msg-id' }),
      });
      global.fetch = fetchMock;

      await emailService.sendInquiryConfirmation('test@example.com', {
        guestName: 'Test User',
        campsiteName: 'Test Camp',
        message: 'Test message with <script>alert("xss")</script>',
      });

      const requestBody = fetchMock.mock.calls[0][1].body;

      // Should include escaped HTML
      expect(requestBody).toContain('html=');
      expect(requestBody).toContain('Test+User');
      expect(requestBody).toContain('Test+Camp');

      // XSS should be escaped
      expect(decodeURIComponent(requestBody)).toContain('&lt;script&gt;');
    });

    it('should set proper content-type header', async () => {
      const { default: emailService } = await import('../../apps/campsite-backend/src/services/emailService');

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'msg-id' }),
      });
      global.fetch = fetchMock;

      await emailService.sendInquiryConfirmation('test@example.com', {
        guestName: 'Test User',
        campsiteName: 'Test Camp',
        message: 'Test',
      });

      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/x-www-form-urlencoded',
          }),
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle 401 Unauthorized error', async () => {
      const { default: emailService } = await import('../../apps/campsite-backend/src/services/emailService');

      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Forbidden - Invalid API key',
      });
      global.fetch = fetchMock;

      const result = await emailService.sendInquiryConfirmation('test@example.com', {
        guestName: 'Test User',
        campsiteName: 'Test Camp',
        message: 'Test',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Mailgun error: 401');
      expect(result.messageId).toBeUndefined();
    });

    it('should handle 500 Internal Server Error', async () => {
      const { default: emailService } = await import('../../apps/campsite-backend/src/services/emailService');

      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      });
      global.fetch = fetchMock;

      const result = await emailService.sendInquiryNotification('owner@example.com', {
        ownerName: 'Owner',
        campsiteName: 'Camp',
        guestName: 'Guest',
        guestEmail: 'guest@example.com',
        inquiryType: 'General',
        message: 'Test',
        inquiryId: 'inq_123',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Mailgun error: 500');
    });

    it('should handle network errors', async () => {
      const { default: emailService } = await import('../../apps/campsite-backend/src/services/emailService');

      const fetchMock = vi.fn().mockRejectedValue(new Error('Network connection failed'));
      global.fetch = fetchMock;

      const result = await emailService.sendInquiryConfirmation('test@example.com', {
        guestName: 'Test User',
        campsiteName: 'Test Camp',
        message: 'Test',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network connection failed');
    });

    it('should handle invalid response format', async () => {
      const { default: emailService } = await import('../../apps/campsite-backend/src/services/emailService');

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON response');
        },
      });
      global.fetch = fetchMock;

      const result = await emailService.sendInquiryConfirmation('test@example.com', {
        guestName: 'Test User',
        campsiteName: 'Test Camp',
        message: 'Test',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid JSON response');
    });

    it('should handle timeout errors', async () => {
      const { default: emailService } = await import('../../apps/campsite-backend/src/services/emailService');

      const fetchMock = vi.fn().mockRejectedValue(new Error('Request timeout'));
      global.fetch = fetchMock;

      const result = await emailService.sendInquiryReplyNotification('guest@example.com', {
        guestName: 'Guest',
        campsiteName: 'Camp',
        ownerReply: 'Reply',
        originalMessage: 'Original',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Request timeout');
    });

    it('should handle unknown error types', async () => {
      const { default: emailService } = await import('../../apps/campsite-backend/src/services/emailService');

      const fetchMock = vi.fn().mockRejectedValue('String error instead of Error object');
      global.fetch = fetchMock;

      const result = await emailService.sendInquiryConfirmation('test@example.com', {
        guestName: 'Test User',
        campsiteName: 'Test Camp',
        message: 'Test',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown error');
    });
  });

  describe('API Request Structure', () => {
    it('should use POST method for sending emails', async () => {
      const { default: emailService } = await import('../../apps/campsite-backend/src/services/emailService');

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'msg-id' }),
      });
      global.fetch = fetchMock;

      await emailService.sendInquiryConfirmation('test@example.com', {
        guestName: 'Test',
        campsiteName: 'Camp',
        message: 'Test',
      });

      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should construct proper Mailgun API endpoint', async () => {
      const { default: emailService } = await import('../../apps/campsite-backend/src/services/emailService');

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'msg-id' }),
      });
      global.fetch = fetchMock;

      await emailService.sendInquiryConfirmation('test@example.com', {
        guestName: 'Test',
        campsiteName: 'Camp',
        message: 'Test',
      });

      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.mailgun.net/v3/test.mailgun.org/messages',
        expect.any(Object)
      );
    });

    it('should encode form data properly', async () => {
      const { default: emailService } = await import('../../apps/campsite-backend/src/services/emailService');

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'msg-id' }),
      });
      global.fetch = fetchMock;

      await emailService.sendInquiryConfirmation('test+alias@example.com', {
        guestName: 'Test User',
        campsiteName: 'Camp & Resort',
        message: 'Question about rates & availability?',
      });

      const requestBody = fetchMock.mock.calls[0][1].body;

      // Special characters should be URL encoded
      expect(requestBody).toContain('test%2Balias%40example.com');
      expect(requestBody).toContain('Camp+%26+Resort');
    });
  });
});
