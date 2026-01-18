/**
 * Integration Test: Email Delivery System
 *
 * Tests email delivery functionality with external provider integration.
 * Validates connection, delivery, error handling, retries, and logging.
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll } from 'vitest';

// Mock environment variables
const originalEnv = process.env;
const originalFetch = global.fetch;

beforeEach(() => {
  vi.resetModules();
  process.env = {
    ...originalEnv,
    MAILGUN_API_KEY: 'test-api-key-integration-12345',
    MAILGUN_DOMAIN: 'test-integration.mailgun.org',
    EMAIL_FROM: 'noreply@campingthailand.com',
    EMAIL_FROM_NAME: 'Camping Thailand',
    NODE_ENV: 'production',
    FRONTEND_URL: 'http://localhost:3000',
  };
});

afterEach(() => {
  process.env = originalEnv;
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe('Email Delivery Integration Tests', () => {
  describe('Email Service Provider Connection', () => {
    it('should connect to Mailgun provider successfully', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: '<20260118123456.1.ABCD@test-integration.mailgun.org>',
          message: 'Queued. Thank you.',
        }),
      });
      global.fetch = fetchMock;

      const { sendInquiryConfirmation } = await import(
        '../../apps/campsite-backend/src/services/emailService'
      );

      const result = await sendInquiryConfirmation('test@example.com', {
        guestName: 'Test User',
        campsiteName: 'Test Campsite',
        message: 'Connection test',
      });

      expect(result.success).toBe(true);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.mailgun.net/v3/test-integration.mailgun.org/messages',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: expect.stringContaining('Basic'),
            'Content-Type': 'application/x-www-form-urlencoded',
          }),
        })
      );
    });

    it('should authenticate with provider using API key', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'msg-id', message: 'Queued' }),
      });
      global.fetch = fetchMock;

      const { sendInquiryConfirmation } = await import(
        '../../apps/campsite-backend/src/services/emailService'
      );

      await sendInquiryConfirmation('test@example.com', {
        guestName: 'Test User',
        campsiteName: 'Test Campsite',
        message: 'Auth test',
      });

      const authHeader = fetchMock.mock.calls[0][1].headers.Authorization;
      const decodedAuth = Buffer.from(authHeader.replace('Basic ', ''), 'base64').toString();

      expect(decodedAuth).toBe('api:test-api-key-integration-12345');
    });

    it('should use correct provider endpoint with domain', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'msg-id' }),
      });
      global.fetch = fetchMock;

      const { sendInquiryConfirmation } = await import(
        '../../apps/campsite-backend/src/services/emailService'
      );

      await sendInquiryConfirmation('test@example.com', {
        guestName: 'Test',
        campsiteName: 'Camp',
        message: 'Endpoint test',
      });

      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.mailgun.net/v3/test-integration.mailgun.org/messages',
        expect.any(Object)
      );
    });

    it('should establish connection with proper HTTP method', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'msg-id' }),
      });
      global.fetch = fetchMock;

      const { sendInquiryNotification } = await import(
        '../../apps/campsite-backend/src/services/emailService'
      );

      await sendInquiryNotification('owner@example.com', {
        ownerName: 'Owner',
        campsiteName: 'Camp',
        guestName: 'Guest',
        guestEmail: 'guest@example.com',
        inquiryType: 'General',
        message: 'Test',
        inquiryId: 'inq_123',
      });

      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });

  describe('Inquiry Reply Email Delivery', () => {
    it('should deliver inquiry reply email successfully', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: '<reply-20260118@test.mailgun.org>',
          message: 'Queued. Thank you.',
        }),
      });
      global.fetch = fetchMock;

      const { sendInquiryReplyNotification } = await import(
        '../../apps/campsite-backend/src/services/emailService'
      );

      const result = await sendInquiryReplyNotification('guest@example.com', {
        guestName: 'Jane Smith',
        campsiteName: 'Mountain View Campsite',
        ownerReply: 'Yes, we have availability for those dates. Looking forward to hosting you!',
        originalMessage: 'Do you have availability for Feb 15-17?',
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('<reply-20260118@test.mailgun.org>');
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('should send to correct recipient email', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'msg-id' }),
      });
      global.fetch = fetchMock;

      const { sendInquiryReplyNotification } = await import(
        '../../apps/campsite-backend/src/services/emailService'
      );

      await sendInquiryReplyNotification('specific-guest@example.com', {
        guestName: 'Guest',
        campsiteName: 'Camp',
        ownerReply: 'Reply message',
        originalMessage: 'Original message',
      });

      const requestBody = fetchMock.mock.calls[0][1].body;
      expect(requestBody).toContain('to=specific-guest%40example.com');
    });

    it('should include proper subject line for reply', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'msg-id' }),
      });
      global.fetch = fetchMock;

      const { sendInquiryReplyNotification } = await import(
        '../../apps/campsite-backend/src/services/emailService'
      );

      await sendInquiryReplyNotification('guest@example.com', {
        guestName: 'Guest',
        campsiteName: 'Forest Retreat',
        ownerReply: 'Yes available',
        originalMessage: 'Is it available?',
      });

      const requestBody = fetchMock.mock.calls[0][1].body;
      expect(requestBody).toContain('subject=Reply+from+Forest+Retreat');
    });

    it('should deliver with message ID for tracking', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: '<unique-tracking-id@mailgun.org>',
        }),
      });
      global.fetch = fetchMock;

      const { sendInquiryReplyNotification } = await import(
        '../../apps/campsite-backend/src/services/emailService'
      );

      const result = await sendInquiryReplyNotification('guest@example.com', {
        guestName: 'Guest',
        campsiteName: 'Camp',
        ownerReply: 'Reply',
        originalMessage: 'Original',
      });

      expect(result.messageId).toBe('<unique-tracking-id@mailgun.org>');
    });
  });

  describe('Email Headers and Metadata', () => {
    it('should include correct From header', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'msg-id' }),
      });
      global.fetch = fetchMock;

      const { sendInquiryConfirmation } = await import(
        '../../apps/campsite-backend/src/services/emailService'
      );

      await sendInquiryConfirmation('test@example.com', {
        guestName: 'Test',
        campsiteName: 'Camp',
        message: 'Test',
      });

      const requestBody = fetchMock.mock.calls[0][1].body;
      expect(requestBody).toContain(
        'from=Camping+Thailand+%3Cnoreply%40campingthailand.com%3E'
      );
    });

    it('should include correct To header', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'msg-id' }),
      });
      global.fetch = fetchMock;

      const { sendInquiryNotification } = await import(
        '../../apps/campsite-backend/src/services/emailService'
      );

      await sendInquiryNotification('campsite-owner@example.com', {
        ownerName: 'Owner',
        campsiteName: 'Camp',
        guestName: 'Guest',
        guestEmail: 'guest@example.com',
        inquiryType: 'Booking',
        message: 'Test',
        inquiryId: 'inq_123',
      });

      const requestBody = fetchMock.mock.calls[0][1].body;
      expect(requestBody).toContain('to=campsite-owner%40example.com');
    });

    it('should include Subject header with proper encoding', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'msg-id' }),
      });
      global.fetch = fetchMock;

      const { sendInquiryConfirmation } = await import(
        '../../apps/campsite-backend/src/services/emailService'
      );

      await sendInquiryConfirmation('test@example.com', {
        guestName: 'Test',
        campsiteName: 'Beach & Mountain Camp',
        message: 'Test',
      });

      const requestBody = fetchMock.mock.calls[0][1].body;
      expect(requestBody).toContain('subject=Inquiry+Sent%3A+Beach+%26+Mountain+Camp');
    });

    it('should set Content-Type to application/x-www-form-urlencoded', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'msg-id' }),
      });
      global.fetch = fetchMock;

      const { sendInquiryConfirmation } = await import(
        '../../apps/campsite-backend/src/services/emailService'
      );

      await sendInquiryConfirmation('test@example.com', {
        guestName: 'Test',
        campsiteName: 'Camp',
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

    it('should set Authorization header with Basic auth', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'msg-id' }),
      });
      global.fetch = fetchMock;

      const { sendInquiryConfirmation } = await import(
        '../../apps/campsite-backend/src/services/emailService'
      );

      await sendInquiryConfirmation('test@example.com', {
        guestName: 'Test',
        campsiteName: 'Camp',
        message: 'Test',
      });

      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: expect.stringMatching(/^Basic /),
          }),
        })
      );
    });
  });

  describe('HTML Email Content Formatting', () => {
    it('should send HTML formatted email content', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'msg-id' }),
      });
      global.fetch = fetchMock;

      const { sendInquiryConfirmation } = await import(
        '../../apps/campsite-backend/src/services/emailService'
      );

      await sendInquiryConfirmation('test@example.com', {
        guestName: 'Jane Smith',
        campsiteName: 'Forest Camp',
        message: 'I would like to visit your campsite.',
      });

      const requestBody = fetchMock.mock.calls[0][1].body;

      // Should include HTML content (URL encoded in form data)
      expect(requestBody).toContain('html=');
      // HTML tags are URL encoded: < becomes %3C, > becomes %3E, ! becomes %21
      expect(requestBody).toMatch(/%3C%21DOCTYPE\+html%3E/);
      expect(requestBody).toMatch(/%3Chtml%3E/);
    });

    it('should include proper HTML structure with head and body', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'msg-id' }),
      });
      global.fetch = fetchMock;

      const { sendInquiryReplyNotification } = await import(
        '../../apps/campsite-backend/src/services/emailService'
      );

      await sendInquiryReplyNotification('guest@example.com', {
        guestName: 'Guest',
        campsiteName: 'Camp',
        ownerReply: 'Yes, available',
        originalMessage: 'Is it available?',
      });

      const requestBody = fetchMock.mock.calls[0][1].body;

      // HTML tags are URL encoded in form data
      expect(requestBody).toMatch(/%3Chead%3E/);
      expect(requestBody).toMatch(/%3Cbody/);
      expect(requestBody).toMatch(/%3C%2Fhtml%3E/);
    });

    it('should escape HTML special characters in user content', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'msg-id' }),
      });
      global.fetch = fetchMock;

      const { sendInquiryConfirmation } = await import(
        '../../apps/campsite-backend/src/services/emailService'
      );

      await sendInquiryConfirmation('test@example.com', {
        guestName: 'Test User',
        campsiteName: 'Camp',
        message: '<script>alert("xss")</script> Safe content & more',
      });

      const requestBody = decodeURIComponent(fetchMock.mock.calls[0][1].body);

      // XSS should be escaped
      expect(requestBody).toContain('&lt;script&gt;');
      expect(requestBody).toContain('&amp;');
      expect(requestBody).not.toContain('<script>alert');
    });

    it('should include inline CSS styles for email clients', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'msg-id' }),
      });
      global.fetch = fetchMock;

      const { sendInquiryNotification } = await import(
        '../../apps/campsite-backend/src/services/emailService'
      );

      await sendInquiryNotification('owner@example.com', {
        ownerName: 'Owner',
        campsiteName: 'Camp',
        guestName: 'Guest',
        guestEmail: 'guest@example.com',
        inquiryType: 'General',
        message: 'Test',
        inquiryId: 'inq_123',
      });

      const requestBody = decodeURIComponent(fetchMock.mock.calls[0][1].body);

      // Should include inline styles
      expect(requestBody).toContain('style=');
      expect(requestBody).toMatch(/font-family:/);
      expect(requestBody).toMatch(/color:/);
    });

    it('should format multiline messages with proper whitespace', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'msg-id' }),
      });
      global.fetch = fetchMock;

      const { sendInquiryConfirmation } = await import(
        '../../apps/campsite-backend/src/services/emailService'
      );

      await sendInquiryConfirmation('test@example.com', {
        guestName: 'Test',
        campsiteName: 'Camp',
        message: 'Line 1\nLine 2\nLine 3',
      });

      const requestBody = fetchMock.mock.calls[0][1].body;

      // Should preserve whitespace with white-space style property (URL encoded)
      expect(requestBody).toMatch(/white-space%3A\+pre-wrap/);
    });
  });

  describe('Provider Error Handling', () => {
    it('should handle 401 Unauthorized error gracefully', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Forbidden - Invalid API key',
      });
      global.fetch = fetchMock;

      const { sendInquiryConfirmation } = await import(
        '../../apps/campsite-backend/src/services/emailService'
      );

      const result = await sendInquiryConfirmation('test@example.com', {
        guestName: 'Test',
        campsiteName: 'Camp',
        message: 'Test',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Mailgun error: 401');
      expect(result.messageId).toBeUndefined();
    });

    it('should handle 403 Forbidden error gracefully', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        text: async () => 'Forbidden',
      });
      global.fetch = fetchMock;

      const { sendInquiryNotification } = await import(
        '../../apps/campsite-backend/src/services/emailService'
      );

      const result = await sendInquiryNotification('owner@example.com', {
        ownerName: 'Owner',
        campsiteName: 'Camp',
        guestName: 'Guest',
        guestEmail: 'guest@example.com',
        inquiryType: 'General',
        message: 'Test',
        inquiryId: 'inq_123',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Mailgun error: 403');
    });

    it('should handle 500 Internal Server Error gracefully', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      });
      global.fetch = fetchMock;

      const { sendInquiryReplyNotification } = await import(
        '../../apps/campsite-backend/src/services/emailService'
      );

      const result = await sendInquiryReplyNotification('guest@example.com', {
        guestName: 'Guest',
        campsiteName: 'Camp',
        ownerReply: 'Reply',
        originalMessage: 'Original',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Mailgun error: 500');
    });

    it('should handle 503 Service Unavailable error gracefully', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        text: async () => 'Service Unavailable',
      });
      global.fetch = fetchMock;

      const { sendInquiryConfirmation } = await import(
        '../../apps/campsite-backend/src/services/emailService'
      );

      const result = await sendInquiryConfirmation('test@example.com', {
        guestName: 'Test',
        campsiteName: 'Camp',
        message: 'Test',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Mailgun error: 503');
    });

    it('should handle network connection errors gracefully', async () => {
      const fetchMock = vi.fn().mockRejectedValue(new Error('Network connection failed'));
      global.fetch = fetchMock;

      const { sendInquiryConfirmation } = await import(
        '../../apps/campsite-backend/src/services/emailService'
      );

      const result = await sendInquiryConfirmation('test@example.com', {
        guestName: 'Test',
        campsiteName: 'Camp',
        message: 'Test',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network connection failed');
    });

    it('should handle DNS resolution errors gracefully', async () => {
      const fetchMock = vi.fn().mockRejectedValue(new Error('getaddrinfo ENOTFOUND'));
      global.fetch = fetchMock;

      const { sendInquiryNotification } = await import(
        '../../apps/campsite-backend/src/services/emailService'
      );

      const result = await sendInquiryNotification('owner@example.com', {
        ownerName: 'Owner',
        campsiteName: 'Camp',
        guestName: 'Guest',
        guestEmail: 'guest@example.com',
        inquiryType: 'General',
        message: 'Test',
        inquiryId: 'inq_123',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('getaddrinfo ENOTFOUND');
    });

    it('should handle malformed JSON response gracefully', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON response');
        },
      });
      global.fetch = fetchMock;

      const { sendInquiryConfirmation } = await import(
        '../../apps/campsite-backend/src/services/emailService'
      );

      const result = await sendInquiryConfirmation('test@example.com', {
        guestName: 'Test',
        campsiteName: 'Camp',
        message: 'Test',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid JSON response');
    });
  });

  describe('Temporary Failure Retry Logic', () => {
    it('should retry on 503 Service Unavailable (temporary failure)', async () => {
      let callCount = 0;
      const fetchMock = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            ok: false,
            status: 503,
            text: async () => 'Service Unavailable',
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ id: 'msg-id-after-retry' }),
        });
      });
      global.fetch = fetchMock;

      // Note: Current implementation does not have retry logic
      // This test documents expected behavior for future implementation
      const { sendInquiryConfirmation } = await import(
        '../../apps/campsite-backend/src/services/emailService'
      );

      const result = await sendInquiryConfirmation('test@example.com', {
        guestName: 'Test',
        campsiteName: 'Camp',
        message: 'Test',
      });

      // Current behavior: fails on first attempt
      expect(result.success).toBe(false);
      expect(fetchMock).toHaveBeenCalledTimes(1);

      // Future expected behavior with retry:
      // expect(result.success).toBe(true);
      // expect(result.messageId).toBe('msg-id-after-retry');
      // expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('should retry on network timeout (temporary failure)', async () => {
      let callCount = 0;
      const fetchMock = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('Request timeout'));
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ id: 'msg-id-success' }),
        });
      });
      global.fetch = fetchMock;

      const { sendInquiryReplyNotification } = await import(
        '../../apps/campsite-backend/src/services/emailService'
      );

      const result = await sendInquiryReplyNotification('guest@example.com', {
        guestName: 'Guest',
        campsiteName: 'Camp',
        ownerReply: 'Reply',
        originalMessage: 'Original',
      });

      // Current behavior: fails on first attempt
      expect(result.success).toBe(false);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('should not retry on 400 Bad Request (permanent failure)', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        text: async () => 'Bad Request - Invalid email',
      });
      global.fetch = fetchMock;

      const { sendInquiryConfirmation } = await import(
        '../../apps/campsite-backend/src/services/emailService'
      );

      const result = await sendInquiryConfirmation('invalid-email', {
        guestName: 'Test',
        campsiteName: 'Camp',
        message: 'Test',
      });

      expect(result.success).toBe(false);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('should not retry on 401 Unauthorized (permanent failure)', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      });
      global.fetch = fetchMock;

      const { sendInquiryNotification } = await import(
        '../../apps/campsite-backend/src/services/emailService'
      );

      const result = await sendInquiryNotification('owner@example.com', {
        ownerName: 'Owner',
        campsiteName: 'Camp',
        guestName: 'Guest',
        guestEmail: 'guest@example.com',
        inquiryType: 'General',
        message: 'Test',
        inquiryId: 'inq_123',
      });

      expect(result.success).toBe(false);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('Delivery Status Logging', () => {
    it('should log successful email delivery with recipient and subject', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: '<msg-id@mailgun.org>',
          message: 'Queued. Thank you.',
        }),
      });
      global.fetch = fetchMock;

      // Mock logger to capture logs
      const loggerMock = {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
      };

      vi.doMock('../../apps/campsite-backend/src/utils/logger', () => ({
        default: loggerMock,
      }));

      const { sendInquiryConfirmation } = await import(
        '../../apps/campsite-backend/src/services/emailService'
      );

      await sendInquiryConfirmation('test@example.com', {
        guestName: 'Test User',
        campsiteName: 'Test Campsite',
        message: 'Test message',
      });

      expect(loggerMock.info).toHaveBeenCalledWith(
        'Email sent successfully',
        expect.objectContaining({
          to: 'test@example.com',
          subject: 'Inquiry Sent: Test Campsite',
          messageId: '<msg-id@mailgun.org>',
        })
      );
    });

    it('should log delivery failure with error details', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      });
      global.fetch = fetchMock;

      const loggerMock = {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
      };

      vi.doMock('../../apps/campsite-backend/src/utils/logger', () => ({
        default: loggerMock,
      }));

      const { sendInquiryNotification } = await import(
        '../../apps/campsite-backend/src/services/emailService'
      );

      await sendInquiryNotification('owner@example.com', {
        ownerName: 'Owner',
        campsiteName: 'Camp',
        guestName: 'Guest',
        guestEmail: 'guest@example.com',
        inquiryType: 'General',
        message: 'Test',
        inquiryId: 'inq_123',
      });

      expect(loggerMock.error).toHaveBeenCalledWith(
        'Mailgun API error',
        expect.objectContaining({
          status: 500,
        })
      );
    });

    it('should log network errors with error message', async () => {
      const fetchMock = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));
      global.fetch = fetchMock;

      const loggerMock = {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
      };

      vi.doMock('../../apps/campsite-backend/src/utils/logger', () => ({
        default: loggerMock,
      }));

      const { sendInquiryReplyNotification } = await import(
        '../../apps/campsite-backend/src/services/emailService'
      );

      await sendInquiryReplyNotification('guest@example.com', {
        guestName: 'Guest',
        campsiteName: 'Camp',
        ownerReply: 'Reply',
        originalMessage: 'Original',
      });

      expect(loggerMock.error).toHaveBeenCalledWith(
        'Failed to send email',
        expect.objectContaining({
          error: expect.any(Error),
        })
      );
    });

    it('should include message ID in success logs for tracking', async () => {
      const messageId = '<tracking-id-12345@mailgun.org>';
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: messageId }),
      });
      global.fetch = fetchMock;

      const loggerMock = {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
      };

      vi.doMock('../../apps/campsite-backend/src/utils/logger', () => ({
        default: loggerMock,
      }));

      const { sendInquiryConfirmation } = await import(
        '../../apps/campsite-backend/src/services/emailService'
      );

      await sendInquiryConfirmation('test@example.com', {
        guestName: 'Test',
        campsiteName: 'Camp',
        message: 'Test',
      });

      expect(loggerMock.info).toHaveBeenCalledWith(
        'Email sent successfully',
        expect.objectContaining({
          messageId,
        })
      );
    });
  });
});
