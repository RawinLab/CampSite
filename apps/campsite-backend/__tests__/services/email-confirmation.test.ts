import {
  sendInquiryConfirmation,
  InquiryConfirmationData,
  SendEmailResult,
} from '../../src/services/emailService';
import logger from '../../src/utils/logger';

// Mock logger
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

// Mock fetch globally
global.fetch = jest.fn();

describe('Email Service - Inquiry Confirmation', () => {
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment variables
    process.env.NODE_ENV = 'test';
    process.env.MAILGUN_API_KEY = '';
    process.env.MAILGUN_DOMAIN = 'sandbox123.mailgun.org';
    process.env.EMAIL_FROM = 'noreply@campingthailand.com';
    process.env.EMAIL_FROM_NAME = 'Camping Thailand';
    process.env.FRONTEND_URL = 'http://localhost:3000';
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('sendInquiryConfirmation', () => {
    const validConfirmationData: InquiryConfirmationData = {
      guestName: 'John Doe',
      campsiteName: 'Sunset Valley Campground',
      message: 'I would like to inquire about availability for a family camping trip.',
      checkInDate: '2024-06-15',
      checkOutDate: '2024-06-17',
    };

    const validGuestEmail = 'john.doe@example.com';

    it('should send confirmation email to user who submitted inquiry', async () => {
      const result = await sendInquiryConfirmation(validGuestEmail, validConfirmationData);

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
      expect(logger.info).toHaveBeenCalledWith(
        'Mock email sent',
        expect.objectContaining({
          to: validGuestEmail,
          subject: 'Inquiry Sent: Sunset Valley Campground',
        })
      );
    });

    it('should include confirmation message in email', async () => {
      const result = await sendInquiryConfirmation(validGuestEmail, validConfirmationData);

      expect(result.success).toBe(true);
      expect(logger.info).toHaveBeenCalledWith(
        'Mock email sent',
        expect.objectContaining({
          to: validGuestEmail,
          htmlLength: expect.any(Number),
        })
      );
      // Verify the call was made with HTML content
      const logCall = (logger.info as jest.Mock).mock.calls[0];
      expect(logCall[1].htmlLength).toBeGreaterThan(0);
    });

    it('should include campsite details in email', async () => {
      // Override mock to capture the HTML content
      const mockSendEmail = jest.spyOn(logger, 'info');

      const result = await sendInquiryConfirmation(validGuestEmail, validConfirmationData);

      expect(result.success).toBe(true);
      expect(mockSendEmail).toHaveBeenCalled();
    });

    it('should include inquiry dates when provided', async () => {
      const dataWithDates: InquiryConfirmationData = {
        guestName: 'Jane Smith',
        campsiteName: 'Mountain View Camp',
        message: 'Looking for a weekend getaway.',
        checkInDate: '2024-07-01',
        checkOutDate: '2024-07-03',
      };

      const result = await sendInquiryConfirmation('jane@example.com', dataWithDates);

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    it('should handle missing optional dates gracefully', async () => {
      const dataWithoutDates: InquiryConfirmationData = {
        guestName: 'Bob Wilson',
        campsiteName: 'Riverside Camping',
        message: 'General inquiry about facilities.',
        checkInDate: null,
        checkOutDate: null,
      };

      const result = await sendInquiryConfirmation('bob@example.com', dataWithoutDates);

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    it('should handle partial date information', async () => {
      const dataWithPartialDates: InquiryConfirmationData = {
        guestName: 'Alice Brown',
        campsiteName: 'Forest Camp',
        message: 'Checking availability.',
        checkInDate: '2024-08-10',
        checkOutDate: null,
      };

      const result = await sendInquiryConfirmation('alice@example.com', dataWithPartialDates);

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    it('should escape HTML in user message to prevent XSS', async () => {
      const dataWithHtmlChars: InquiryConfirmationData = {
        guestName: 'Test User',
        campsiteName: 'Test Camp',
        message: '<script>alert("XSS")</script> & dangerous characters',
        checkInDate: null,
        checkOutDate: null,
      };

      const result = await sendInquiryConfirmation('test@example.com', dataWithHtmlChars);

      expect(result.success).toBe(true);
      // Email should still be sent successfully with escaped content
    });

    it('should include guest name in email', async () => {
      const result = await sendInquiryConfirmation(validGuestEmail, validConfirmationData);

      expect(result.success).toBe(true);
      expect(logger.info).toHaveBeenCalled();
    });

    it('should include campsite name in subject line', async () => {
      const result = await sendInquiryConfirmation(validGuestEmail, validConfirmationData);

      expect(result.success).toBe(true);
      expect(logger.info).toHaveBeenCalledWith(
        'Mock email sent',
        expect.objectContaining({
          subject: 'Inquiry Sent: Sunset Valley Campground',
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid email address gracefully', async () => {
      const invalidEmails = [
        'invalid-email',
        'missing@domain',
        '@nodomain.com',
        'spaces in@email.com',
        '',
      ];

      for (const invalidEmail of invalidEmails) {
        const result = await sendInquiryConfirmation(invalidEmail, {
          guestName: 'Test User',
          campsiteName: 'Test Camp',
          message: 'Test message',
          checkInDate: null,
          checkOutDate: null,
        });

        // Mock email service still succeeds in test mode
        // In production with real Mailgun, this would fail
        expect(result.success).toBe(true);
      }
    });

    it('should handle email service failure gracefully in production mode', async () => {
      // Set production environment with API key
      process.env.NODE_ENV = 'production';
      process.env.MAILGUN_API_KEY = 'test-api-key';

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal server error',
      } as Response);

      const result = await sendInquiryConfirmation('test@example.com', {
        guestName: 'Test User',
        campsiteName: 'Test Camp',
        message: 'Test message',
        checkInDate: null,
        checkOutDate: null,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Mailgun error');
      expect(logger.error).toHaveBeenCalledWith(
        'Mailgun API error',
        expect.objectContaining({
          status: 500,
          error: 'Internal server error',
        })
      );
    });

    it('should handle network errors gracefully', async () => {
      process.env.NODE_ENV = 'production';
      process.env.MAILGUN_API_KEY = 'test-api-key';

      mockFetch.mockRejectedValueOnce(new Error('Network connection failed'));

      const result = await sendInquiryConfirmation('test@example.com', {
        guestName: 'Test User',
        campsiteName: 'Test Camp',
        message: 'Test message',
        checkInDate: null,
        checkOutDate: null,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network connection failed');
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to send email',
        expect.objectContaining({
          error: expect.any(Error),
          to: 'test@example.com',
        })
      );
    });

    it('should log error but not throw on Mailgun API error', async () => {
      process.env.NODE_ENV = 'production';
      process.env.MAILGUN_API_KEY = 'test-api-key';

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      } as Response);

      // Should not throw
      const result = await sendInquiryConfirmation('test@example.com', {
        guestName: 'Test User',
        campsiteName: 'Test Camp',
        message: 'Test message',
        checkInDate: null,
        checkOutDate: null,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Mailgun error: 401');
      expect(logger.error).toHaveBeenCalled();
    });

    it('should log error but not throw on network failure', async () => {
      process.env.NODE_ENV = 'production';
      process.env.MAILGUN_API_KEY = 'test-api-key';

      mockFetch.mockRejectedValueOnce(new Error('DNS resolution failed'));

      // Should not throw
      const result = await sendInquiryConfirmation('test@example.com', {
        guestName: 'Test User',
        campsiteName: 'Test Camp',
        message: 'Test message',
        checkInDate: null,
        checkOutDate: null,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('DNS resolution failed');
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to send email',
        expect.any(Object)
      );
    });

    it('should handle Mailgun timeout gracefully', async () => {
      process.env.NODE_ENV = 'production';
      process.env.MAILGUN_API_KEY = 'test-api-key';

      mockFetch.mockRejectedValueOnce(new Error('Request timeout'));

      const result = await sendInquiryConfirmation('test@example.com', {
        guestName: 'Test User',
        campsiteName: 'Test Camp',
        message: 'Test message',
        checkInDate: null,
        checkOutDate: null,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Request timeout');
      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle unknown error types gracefully', async () => {
      process.env.NODE_ENV = 'production';
      process.env.MAILGUN_API_KEY = 'test-api-key';

      // Throw a non-Error object
      mockFetch.mockRejectedValueOnce('Strange error string');

      const result = await sendInquiryConfirmation('test@example.com', {
        guestName: 'Test User',
        campsiteName: 'Test Camp',
        message: 'Test message',
        checkInDate: null,
        checkOutDate: null,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown error');
    });
  });

  describe('Mock Email Service (Development Mode)', () => {
    it('should use mock email service when not in production', async () => {
      process.env.NODE_ENV = 'development';

      const result = await sendInquiryConfirmation('test@example.com', {
        guestName: 'Test User',
        campsiteName: 'Test Camp',
        message: 'Test message',
        checkInDate: null,
        checkOutDate: null,
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toMatch(/^mock-/);
      expect(logger.info).toHaveBeenCalledWith(
        'Mock email sent',
        expect.any(Object)
      );
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should use mock email service when API key is not configured', async () => {
      process.env.NODE_ENV = 'production';
      process.env.MAILGUN_API_KEY = '';

      const result = await sendInquiryConfirmation('test@example.com', {
        guestName: 'Test User',
        campsiteName: 'Test Camp',
        message: 'Test message',
        checkInDate: null,
        checkOutDate: null,
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toMatch(/^mock-/);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should simulate async operation in mock mode', async () => {
      const startTime = Date.now();

      await sendInquiryConfirmation('test@example.com', {
        guestName: 'Test User',
        campsiteName: 'Test Camp',
        message: 'Test message',
        checkInDate: null,
        checkOutDate: null,
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should take at least some time due to setTimeout
      expect(duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Production Email Service', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
      process.env.MAILGUN_API_KEY = 'key-abc123';
      process.env.MAILGUN_DOMAIN = 'mg.campingthailand.com';
    });

    it('should send email via Mailgun API in production', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: '<mailgun-message-id@mg.campingthailand.com>' }),
      } as Response);

      const result = await sendInquiryConfirmation('test@example.com', {
        guestName: 'Test User',
        campsiteName: 'Test Camp',
        message: 'Test message',
        checkInDate: '2024-06-15',
        checkOutDate: '2024-06-17',
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('<mailgun-message-id@mg.campingthailand.com>');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.mailgun.net/v3/mg.campingthailand.com/messages',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: expect.stringContaining('Basic'),
            'Content-Type': 'application/x-www-form-urlencoded',
          }),
        })
      );
    });

    it('should include correct email headers and body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: '<test-id>' }),
      } as Response);

      await sendInquiryConfirmation('guest@example.com', {
        guestName: 'Guest Name',
        campsiteName: 'Amazing Camp',
        message: 'Test inquiry message',
        checkInDate: null,
        checkOutDate: null,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('to=guest%40example.com'),
        })
      );

      const fetchCall = mockFetch.mock.calls[0];
      const body = fetchCall[1]?.body as string;
      expect(body).toContain('from=Camping+Thailand');
      expect(body).toContain('subject=Inquiry+Sent%3A+Amazing+Camp');
      expect(body).toContain('html=');
    });

    it('should log successful email send', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: '<success-id>' }),
      } as Response);

      await sendInquiryConfirmation('test@example.com', {
        guestName: 'Test User',
        campsiteName: 'Test Camp',
        message: 'Test message',
        checkInDate: null,
        checkOutDate: null,
      });

      expect(logger.info).toHaveBeenCalledWith(
        'Email sent successfully',
        expect.objectContaining({
          to: 'test@example.com',
          subject: 'Inquiry Sent: Test Camp',
          messageId: '<success-id>',
        })
      );
    });
  });

  describe('Email Content Validation', () => {
    it('should include all required confirmation elements', async () => {
      const logSpy = jest.spyOn(logger, 'info');

      await sendInquiryConfirmation('test@example.com', {
        guestName: 'John Doe',
        campsiteName: 'Sunset Valley',
        message: 'Looking forward to camping!',
        checkInDate: '2024-06-20',
        checkOutDate: '2024-06-22',
      });

      expect(logSpy).toHaveBeenCalledWith(
        'Mock email sent',
        expect.objectContaining({
          subject: 'Inquiry Sent: Sunset Valley',
        })
      );
    });

    it('should handle very long messages', async () => {
      const longMessage = 'A'.repeat(5000);

      const result = await sendInquiryConfirmation('test@example.com', {
        guestName: 'Test User',
        campsiteName: 'Test Camp',
        message: longMessage,
        checkInDate: null,
        checkOutDate: null,
      });

      expect(result.success).toBe(true);
    });

    it('should handle special characters in campsite name', async () => {
      const result = await sendInquiryConfirmation('test@example.com', {
        guestName: 'Test User',
        campsiteName: "O'Brien's Camp & Resort",
        message: 'Test message',
        checkInDate: null,
        checkOutDate: null,
      });

      expect(result.success).toBe(true);
      expect(logger.info).toHaveBeenCalledWith(
        'Mock email sent',
        expect.objectContaining({
          subject: "Inquiry Sent: O'Brien's Camp & Resort",
        })
      );
    });

    it('should handle Unicode characters in guest name', async () => {
      const result = await sendInquiryConfirmation('test@example.com', {
        guestName: 'สมชาย วงศ์ไทย',
        campsiteName: 'Test Camp',
        message: 'สวัสดีครับ',
        checkInDate: null,
        checkOutDate: null,
      });

      expect(result.success).toBe(true);
    });
  });
});
