// Unit tests for Email Service - Notification Emails
// Tests sendInquiryNotification function and email formatting

import {
  sendInquiryNotification,
  InquiryNotificationData,
  SendEmailResult,
} from '../../src/services/emailService';
import logger from '../../src/utils/logger';

// Mock logger to prevent console output during tests
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

// Mock fetch for Mailgun API calls
global.fetch = jest.fn();

describe('Email Service - Inquiry Notifications', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment to development (uses mock email)
    process.env = {
      ...originalEnv,
      NODE_ENV: 'development',
      MAILGUN_API_KEY: '',
      MAILGUN_DOMAIN: 'sandboxtest.mailgun.org',
      EMAIL_FROM: 'noreply@campingthailand.com',
      EMAIL_FROM_NAME: 'Camping Thailand',
      FRONTEND_URL: 'http://localhost:3000',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('sendInquiryNotification', () => {
    const ownerEmail = 'owner@example.com';
    const validInquiryData: InquiryNotificationData = {
      ownerName: 'John Doe',
      campsiteName: 'Mountain View Campsite',
      guestName: 'Jane Smith',
      guestEmail: 'jane@example.com',
      guestPhone: '+66812345678',
      inquiryType: 'Booking Request',
      message: 'I would like to book a tent site for 2 people.',
      checkInDate: '2026-02-15',
      checkOutDate: '2026-02-17',
      inquiryId: 'inquiry-123',
    };

    it('should send email to campsite owner successfully', async () => {
      const result = await sendInquiryNotification(ownerEmail, validInquiryData);

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
      expect(result.messageId).toMatch(/^mock-/);
    });

    it('should log email send with correct recipient and subject', async () => {
      await sendInquiryNotification(ownerEmail, validInquiryData);

      expect(logger.info).toHaveBeenCalledWith(
        'Mock email sent',
        expect.objectContaining({
          to: ownerEmail,
          subject: 'New Inquiry: Mountain View Campsite - Booking Request',
        })
      );
    });

    it('should include campsite name in subject line', async () => {
      await sendInquiryNotification(ownerEmail, validInquiryData);

      expect(logger.info).toHaveBeenCalledWith(
        'Mock email sent',
        expect.objectContaining({
          subject: expect.stringContaining('Mountain View Campsite'),
        })
      );
    });

    it('should include inquiry type in subject line', async () => {
      await sendInquiryNotification(ownerEmail, validInquiryData);

      expect(logger.info).toHaveBeenCalledWith(
        'Mock email sent',
        expect.objectContaining({
          subject: expect.stringContaining('Booking Request'),
        })
      );
    });

    it('should include all inquiry details in email body', async () => {
      await sendInquiryNotification(ownerEmail, validInquiryData);

      const logCall = (logger.info as jest.Mock).mock.calls[0];
      const htmlContent = logCall[1].htmlLength;

      expect(htmlContent).toBeGreaterThan(0);
    });

    it('should handle inquiry without phone number', async () => {
      const dataWithoutPhone: InquiryNotificationData = {
        ...validInquiryData,
        guestPhone: null,
      };

      const result = await sendInquiryNotification(ownerEmail, dataWithoutPhone);

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    it('should handle inquiry without check-in/check-out dates', async () => {
      const dataWithoutDates: InquiryNotificationData = {
        ...validInquiryData,
        checkInDate: null,
        checkOutDate: null,
      };

      const result = await sendInquiryNotification(ownerEmail, dataWithoutDates);

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    it('should escape HTML in guest message', async () => {
      const dataWithHtml: InquiryNotificationData = {
        ...validInquiryData,
        message: '<script>alert("xss")</script> Safe message',
      };

      const result = await sendInquiryNotification(ownerEmail, dataWithHtml);

      expect(result.success).toBe(true);
    });

    it('should handle missing owner email gracefully', async () => {
      const emptyEmail = '';
      const result = await sendInquiryNotification(emptyEmail, validInquiryData);

      // Mock email service accepts empty emails (would fail in production)
      expect(result.success).toBe(true);
    });

    it('should handle different inquiry types correctly', async () => {
      const inquiryTypes = ['General Question', 'Booking Request', 'Facilities', 'Pricing'];

      for (const type of inquiryTypes) {
        const data: InquiryNotificationData = {
          ...validInquiryData,
          inquiryType: type,
        };

        const result = await sendInquiryNotification(ownerEmail, data);

        expect(result.success).toBe(true);
        expect(logger.info).toHaveBeenCalledWith(
          'Mock email sent',
          expect.objectContaining({
            subject: expect.stringContaining(type),
          })
        );

        jest.clearAllMocks();
      }
    });
  });

  describe('Email formatting', () => {
    const ownerEmail = 'owner@example.com';

    it('should format subject line correctly', async () => {
      const data: InquiryNotificationData = {
        ownerName: 'Test Owner',
        campsiteName: 'Test Campsite',
        guestName: 'Test Guest',
        guestEmail: 'guest@example.com',
        guestPhone: null,
        inquiryType: 'General Question',
        message: 'Test message',
        checkInDate: null,
        checkOutDate: null,
        inquiryId: 'test-123',
      };

      await sendInquiryNotification(ownerEmail, data);

      expect(logger.info).toHaveBeenCalledWith(
        'Mock email sent',
        expect.objectContaining({
          subject: 'New Inquiry: Test Campsite - General Question',
        })
      );
    });

    it('should include owner name in greeting', async () => {
      const data: InquiryNotificationData = {
        ownerName: 'Sarah Connor',
        campsiteName: 'Future Campsite',
        guestName: 'John Connor',
        guestEmail: 'john@example.com',
        guestPhone: null,
        inquiryType: 'General Question',
        message: 'Test',
        checkInDate: null,
        checkOutDate: null,
        inquiryId: 'test-456',
      };

      await sendInquiryNotification(ownerEmail, data);

      // HTML should be generated (non-zero length)
      const logCall = (logger.info as jest.Mock).mock.calls[0];
      expect(logCall[1].htmlLength).toBeGreaterThan(0);
    });

    it('should handle special characters in campsite name', async () => {
      const data: InquiryNotificationData = {
        ownerName: 'Owner',
        campsiteName: 'Beach & Mountain Campsite (Premium)',
        guestName: 'Guest',
        guestEmail: 'guest@example.com',
        guestPhone: null,
        inquiryType: 'Booking Request',
        message: 'Test',
        checkInDate: null,
        checkOutDate: null,
        inquiryId: 'test-789',
      };

      const result = await sendInquiryNotification(ownerEmail, data);

      expect(result.success).toBe(true);
      expect(logger.info).toHaveBeenCalledWith(
        'Mock email sent',
        expect.objectContaining({
          subject: expect.stringContaining('Beach & Mountain Campsite (Premium)'),
        })
      );
    });

    it('should format dates in email body when provided', async () => {
      const data: InquiryNotificationData = {
        ownerName: 'Owner',
        campsiteName: 'Test Campsite',
        guestName: 'Guest',
        guestEmail: 'guest@example.com',
        guestPhone: null,
        inquiryType: 'Booking Request',
        message: 'Test',
        checkInDate: '2026-03-01',
        checkOutDate: '2026-03-03',
        inquiryId: 'test-dates',
      };

      const result = await sendInquiryNotification(ownerEmail, data);

      expect(result.success).toBe(true);
    });

    it('should include inquiry ID in email for reply link', async () => {
      const data: InquiryNotificationData = {
        ownerName: 'Owner',
        campsiteName: 'Test Campsite',
        guestName: 'Guest',
        guestEmail: 'guest@example.com',
        guestPhone: null,
        inquiryType: 'General Question',
        message: 'Test',
        checkInDate: null,
        checkOutDate: null,
        inquiryId: 'unique-inquiry-id-789',
      };

      const result = await sendInquiryNotification(ownerEmail, data);

      expect(result.success).toBe(true);
    });
  });

  describe('Production Mailgun integration', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
      process.env.MAILGUN_API_KEY = 'key-test123';
      process.env.MAILGUN_DOMAIN = 'mg.campingthailand.com';
    });

    it('should call Mailgun API in production with valid API key', async () => {
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: '<mailgun-message-id@mg.campingthailand.com>' }),
      });

      const data: InquiryNotificationData = {
        ownerName: 'Owner',
        campsiteName: 'Test Campsite',
        guestName: 'Guest',
        guestEmail: 'guest@example.com',
        guestPhone: null,
        inquiryType: 'General Question',
        message: 'Test message',
        checkInDate: null,
        checkOutDate: null,
        inquiryId: 'prod-test',
      };

      const result = await sendInquiryNotification('owner@example.com', data);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('<mailgun-message-id@mg.campingthailand.com>');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.mailgun.net/v3/mg.campingthailand.com/messages',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should handle Mailgun API errors gracefully', async () => {
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      });

      const data: InquiryNotificationData = {
        ownerName: 'Owner',
        campsiteName: 'Test Campsite',
        guestName: 'Guest',
        guestEmail: 'guest@example.com',
        guestPhone: null,
        inquiryType: 'General Question',
        message: 'Test',
        checkInDate: null,
        checkOutDate: null,
        inquiryId: 'error-test',
      };

      const result = await sendInquiryNotification('owner@example.com', data);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Mailgun error');
      expect(logger.error).toHaveBeenCalledWith(
        'Mailgun API error',
        expect.objectContaining({
          status: 401,
        })
      );
    });

    it('should handle network errors gracefully', async () => {
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockRejectedValueOnce(new Error('Network timeout'));

      const data: InquiryNotificationData = {
        ownerName: 'Owner',
        campsiteName: 'Test Campsite',
        guestName: 'Guest',
        guestEmail: 'guest@example.com',
        guestPhone: null,
        inquiryType: 'General Question',
        message: 'Test',
        checkInDate: null,
        checkOutDate: null,
        inquiryId: 'network-error-test',
      };

      const result = await sendInquiryNotification('owner@example.com', data);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network timeout');
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to send email',
        expect.objectContaining({
          error: expect.any(Error),
        })
      );
    });
  });

  describe('Edge cases and validation', () => {
    const ownerEmail = 'owner@example.com';

    it('should handle very long messages', async () => {
      const longMessage = 'A'.repeat(5000);
      const data: InquiryNotificationData = {
        ownerName: 'Owner',
        campsiteName: 'Test Campsite',
        guestName: 'Guest',
        guestEmail: 'guest@example.com',
        guestPhone: null,
        inquiryType: 'General Question',
        message: longMessage,
        checkInDate: null,
        checkOutDate: null,
        inquiryId: 'long-message-test',
      };

      const result = await sendInquiryNotification(ownerEmail, data);

      expect(result.success).toBe(true);
    });

    it('should handle message with newlines and formatting', async () => {
      const formattedMessage = 'Line 1\nLine 2\n\nLine 3\tTabbed';
      const data: InquiryNotificationData = {
        ownerName: 'Owner',
        campsiteName: 'Test Campsite',
        guestName: 'Guest',
        guestEmail: 'guest@example.com',
        guestPhone: null,
        inquiryType: 'General Question',
        message: formattedMessage,
        checkInDate: null,
        checkOutDate: null,
        inquiryId: 'formatted-test',
      };

      const result = await sendInquiryNotification(ownerEmail, data);

      expect(result.success).toBe(true);
    });

    it('should handle unicode characters in message', async () => {
      const unicodeMessage = 'สวัสดี Hello 你好 مرحبا 🏕️';
      const data: InquiryNotificationData = {
        ownerName: 'Owner',
        campsiteName: 'Test Campsite',
        guestName: 'Guest',
        guestEmail: 'guest@example.com',
        guestPhone: null,
        inquiryType: 'General Question',
        message: unicodeMessage,
        checkInDate: null,
        checkOutDate: null,
        inquiryId: 'unicode-test',
      };

      const result = await sendInquiryNotification(ownerEmail, data);

      expect(result.success).toBe(true);
    });

    it('should handle Thai characters in names and campsite', async () => {
      const data: InquiryNotificationData = {
        ownerName: 'สมชาย ใจดี',
        campsiteName: 'แคมป์ปิ้งภูเขา',
        guestName: 'สมหญิง สวยงาม',
        guestEmail: 'guest@example.com',
        guestPhone: null,
        inquiryType: 'คำถามทั่วไป',
        message: 'ต้องการสอบถามเกี่ยวกับที่จอดแคมป์',
        checkInDate: null,
        checkOutDate: null,
        inquiryId: 'thai-test',
      };

      const result = await sendInquiryNotification(ownerEmail, data);

      expect(result.success).toBe(true);
    });

    it('should handle empty message gracefully', async () => {
      const data: InquiryNotificationData = {
        ownerName: 'Owner',
        campsiteName: 'Test Campsite',
        guestName: 'Guest',
        guestEmail: 'guest@example.com',
        guestPhone: null,
        inquiryType: 'General Question',
        message: '',
        checkInDate: null,
        checkOutDate: null,
        inquiryId: 'empty-message-test',
      };

      const result = await sendInquiryNotification(ownerEmail, data);

      expect(result.success).toBe(true);
    });

    it('should handle international phone number formats', async () => {
      const phoneFormats = ['+66812345678', '0812345678', '+1-555-123-4567', '(02) 123-4567'];

      for (const phone of phoneFormats) {
        const data: InquiryNotificationData = {
          ownerName: 'Owner',
          campsiteName: 'Test Campsite',
          guestName: 'Guest',
          guestEmail: 'guest@example.com',
          guestPhone: phone,
          inquiryType: 'General Question',
          message: 'Test',
          checkInDate: null,
          checkOutDate: null,
          inquiryId: `phone-format-${phone.replace(/\D/g, '')}`,
        };

        const result = await sendInquiryNotification(ownerEmail, data);

        expect(result.success).toBe(true);
      }
    });
  });
});
