import { EmailService } from '../../src/services/email.service';
import logger from '../../src/utils/logger';

// Mock logger
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

// Mock fetch globally
global.fetch = jest.fn();

describe('EmailService', () => {
  let emailService: EmailService;
  let originalEnv: NodeJS.ProcessEnv;

  beforeAll(() => {
    originalEnv = { ...process.env };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Constructor and initialization', () => {
    it('should initialize with Mailgun configuration', () => {
      process.env.MAILGUN_DOMAIN = 'test.mailgun.org';
      process.env.MAILGUN_API_KEY = 'test-api-key';
      process.env.EMAIL_FROM = 'test@example.com';

      const service = new EmailService();
      expect(service).toBeInstanceOf(EmailService);
    });

    it('should warn when Mailgun configuration is missing', () => {
      delete process.env.MAILGUN_DOMAIN;
      delete process.env.MAILGUN_API_KEY;

      new EmailService();
      expect(logger.warn).toHaveBeenCalledWith('Email service disabled: Missing Mailgun configuration');
    });

    it('should use default from email when not configured', () => {
      delete process.env.EMAIL_FROM;
      process.env.MAILGUN_DOMAIN = 'test.mailgun.org';
      process.env.MAILGUN_API_KEY = 'test-api-key';

      const service = new EmailService();
      expect(service).toBeInstanceOf(EmailService);
    });
  });

  describe('sendEmail', () => {
    beforeEach(() => {
      process.env.MAILGUN_DOMAIN = 'test.mailgun.org';
      process.env.MAILGUN_API_KEY = 'test-api-key';
      process.env.EMAIL_FROM = 'noreply@campingthailand.com';
      emailService = new EmailService();
    });

    it('should send email successfully with valid options', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
      });

      const result = await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        text: 'Test text',
      });

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.mailgun.net/v3/test.mailgun.org/messages',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: expect.stringContaining('Basic'),
          }),
        })
      );
      expect(logger.info).toHaveBeenCalledWith('Email sent successfully:', {
        to: 'test@example.com',
        subject: 'Test Subject',
      });
    });

    it('should send email without text field when not provided', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
      });

      const result = await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
      });

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should handle email send failure gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Invalid email address',
      });

      const result = await emailService.sendEmail({
        to: 'invalid-email',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
      });

      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith('Mailgun API error:', {
        status: 400,
        error: 'Invalid email address',
      });
    });

    it('should handle network errors gracefully', async () => {
      const networkError = new Error('Network error');
      (global.fetch as jest.Mock).mockRejectedValueOnce(networkError);

      const result = await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
      });

      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith('Failed to send email:', networkError);
    });

    it('should return true when service is disabled (dev mode)', async () => {
      delete process.env.MAILGUN_DOMAIN;
      delete process.env.MAILGUN_API_KEY;
      const disabledService = new EmailService();

      const result = await disabledService.sendEmail({
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
      });

      expect(result).toBe(true);
      expect(global.fetch).not.toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith('Email not sent (service disabled):', {
        to: 'test@example.com',
        subject: 'Test Subject',
      });
    });

    it('should encode API key correctly in Authorization header', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
      });

      await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      const expectedAuth = Buffer.from('api:test-api-key').toString('base64');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: {
            Authorization: `Basic ${expectedAuth}`,
          },
        })
      );
    });
  });

  describe('sendInquiryNotification', () => {
    beforeEach(() => {
      process.env.MAILGUN_DOMAIN = 'test.mailgun.org';
      process.env.MAILGUN_API_KEY = 'test-api-key';
      process.env.EMAIL_FROM = 'noreply@campingthailand.com';
      emailService = new EmailService();

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
      });
    });

    it('should send inquiry notification with all fields', async () => {
      const data = {
        ownerName: 'John Owner',
        ownerEmail: 'owner@example.com',
        campsiteName: 'Mountain View Campsite',
        guestName: 'Jane Guest',
        guestEmail: 'guest@example.com',
        guestPhone: '+66123456789',
        message: 'I would like to book a campsite',
        inquiryType: 'Booking',
        checkInDate: '2026-02-01',
        checkOutDate: '2026-02-05',
        dashboardUrl: 'https://campingthailand.com/dashboard/inquiries/123',
      };

      const result = await emailService.sendInquiryNotification(data);

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(1);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const url = fetchCall[0];
      const options = fetchCall[1];

      expect(url).toBe('https://api.mailgun.net/v3/test.mailgun.org/messages');
      expect(options.method).toBe('POST');

      // Verify email was sent to owner
      const formData = options.body as FormData;
      expect(formData.get('to')).toBe('owner@example.com');
      expect(formData.get('subject')).toContain('Mountain View Campsite');

      // Verify HTML content includes all key information
      const htmlContent = formData.get('html') as string;
      expect(htmlContent).toContain('John Owner');
      expect(htmlContent).toContain('Mountain View Campsite');
      expect(htmlContent).toContain('Jane Guest');
      expect(htmlContent).toContain('guest@example.com');
      expect(htmlContent).toContain('+66123456789');
      expect(htmlContent).toContain('I would like to book a campsite');
      expect(htmlContent).toContain('Booking');
      expect(htmlContent).toContain('2026-02-01');
      expect(htmlContent).toContain('2026-02-05');
      expect(htmlContent).toContain('https://campingthailand.com/dashboard/inquiries/123');

      // Verify text content
      const textContent = formData.get('text') as string;
      expect(textContent).toContain('Mountain View Campsite');
      expect(textContent).toContain('Jane Guest');
      expect(textContent).toContain('I would like to book a campsite');
    });

    it('should send inquiry notification without optional fields', async () => {
      const data = {
        ownerName: 'John Owner',
        ownerEmail: 'owner@example.com',
        campsiteName: 'Mountain View Campsite',
        guestName: 'Jane Guest',
        guestEmail: 'guest@example.com',
        message: 'General inquiry',
        inquiryType: 'General',
        dashboardUrl: 'https://campingthailand.com/dashboard/inquiries/123',
      };

      const result = await emailService.sendInquiryNotification(data);

      expect(result).toBe(true);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const formData = fetchCall[1].body as FormData;
      const htmlContent = formData.get('html') as string;

      expect(htmlContent).toContain('General inquiry');
      expect(htmlContent).not.toContain('Phone:');
      expect(htmlContent).not.toContain('Check-in:');
      expect(htmlContent).not.toContain('Check-out:');
    });

    it('should handle multi-line messages correctly', async () => {
      const data = {
        ownerName: 'John Owner',
        ownerEmail: 'owner@example.com',
        campsiteName: 'Mountain View Campsite',
        guestName: 'Jane Guest',
        guestEmail: 'guest@example.com',
        message: 'Line 1\nLine 2\nLine 3',
        inquiryType: 'General',
        dashboardUrl: 'https://campingthailand.com/dashboard/inquiries/123',
      };

      const result = await emailService.sendInquiryNotification(data);

      expect(result).toBe(true);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const formData = fetchCall[1].body as FormData;
      const htmlContent = formData.get('html') as string;

      // HTML should convert newlines to <br>
      expect(htmlContent).toContain('Line 1<br>Line 2<br>Line 3');
    });
  });

  describe('sendInquiryReply', () => {
    beforeEach(() => {
      process.env.MAILGUN_DOMAIN = 'test.mailgun.org';
      process.env.MAILGUN_API_KEY = 'test-api-key';
      process.env.EMAIL_FROM = 'noreply@campingthailand.com';
      emailService = new EmailService();

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
      });
    });

    it('should send inquiry reply successfully', async () => {
      const data = {
        guestName: 'Jane Guest',
        guestEmail: 'guest@example.com',
        ownerName: 'John Owner',
        campsiteName: 'Mountain View Campsite',
        originalMessage: 'I would like to book a campsite',
        replyMessage: 'Thank you for your inquiry. We have availability on those dates.',
        campsiteUrl: 'https://campingthailand.com/campsites/123',
      };

      const result = await emailService.sendInquiryReply(data);

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should include correct recipient (guest email)', async () => {
      const data = {
        guestName: 'Jane Guest',
        guestEmail: 'guest@example.com',
        ownerName: 'John Owner',
        campsiteName: 'Mountain View Campsite',
        originalMessage: 'I would like to book a campsite',
        replyMessage: 'Thank you for your inquiry',
        campsiteUrl: 'https://campingthailand.com/campsites/123',
      };

      await emailService.sendInquiryReply(data);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const formData = fetchCall[1].body as FormData;

      expect(formData.get('to')).toBe('guest@example.com');
    });

    it('should include reply content in email', async () => {
      const data = {
        guestName: 'Jane Guest',
        guestEmail: 'guest@example.com',
        ownerName: 'John Owner',
        campsiteName: 'Mountain View Campsite',
        originalMessage: 'I would like to book a campsite',
        replyMessage: 'Thank you for your inquiry. We have availability on those dates.',
        campsiteUrl: 'https://campingthailand.com/campsites/123',
      };

      await emailService.sendInquiryReply(data);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const formData = fetchCall[1].body as FormData;
      const htmlContent = formData.get('html') as string;

      expect(htmlContent).toContain('Thank you for your inquiry. We have availability on those dates.');
    });

    it('should include campsite name in email', async () => {
      const data = {
        guestName: 'Jane Guest',
        guestEmail: 'guest@example.com',
        ownerName: 'John Owner',
        campsiteName: 'Mountain View Campsite',
        originalMessage: 'I would like to book a campsite',
        replyMessage: 'Thank you for your inquiry',
        campsiteUrl: 'https://campingthailand.com/campsites/123',
      };

      await emailService.sendInquiryReply(data);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const formData = fetchCall[1].body as FormData;
      const htmlContent = formData.get('html') as string;
      const subject = formData.get('subject') as string;

      expect(htmlContent).toContain('Mountain View Campsite');
      expect(subject).toContain('Mountain View Campsite');
    });

    it('should include owner name in email', async () => {
      const data = {
        guestName: 'Jane Guest',
        guestEmail: 'guest@example.com',
        ownerName: 'John Owner',
        campsiteName: 'Mountain View Campsite',
        originalMessage: 'I would like to book a campsite',
        replyMessage: 'Thank you for your inquiry',
        campsiteUrl: 'https://campingthailand.com/campsites/123',
      };

      await emailService.sendInquiryReply(data);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const formData = fetchCall[1].body as FormData;
      const htmlContent = formData.get('html') as string;

      expect(htmlContent).toContain('John Owner');
    });

    it('should include original message in email', async () => {
      const data = {
        guestName: 'Jane Guest',
        guestEmail: 'guest@example.com',
        ownerName: 'John Owner',
        campsiteName: 'Mountain View Campsite',
        originalMessage: 'I would like to book a campsite for 4 people',
        replyMessage: 'Thank you for your inquiry',
        campsiteUrl: 'https://campingthailand.com/campsites/123',
      };

      await emailService.sendInquiryReply(data);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const formData = fetchCall[1].body as FormData;
      const htmlContent = formData.get('html') as string;

      expect(htmlContent).toContain('I would like to book a campsite for 4 people');
      expect(htmlContent).toContain('Your original message:');
    });

    it('should include campsite URL in email', async () => {
      const data = {
        guestName: 'Jane Guest',
        guestEmail: 'guest@example.com',
        ownerName: 'John Owner',
        campsiteName: 'Mountain View Campsite',
        originalMessage: 'I would like to book',
        replyMessage: 'Thank you',
        campsiteUrl: 'https://campingthailand.com/campsites/123',
      };

      await emailService.sendInquiryReply(data);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const formData = fetchCall[1].body as FormData;
      const htmlContent = formData.get('html') as string;

      expect(htmlContent).toContain('https://campingthailand.com/campsites/123');
      expect(htmlContent).toContain('View Campsite');
    });

    it('should handle multi-line reply messages correctly', async () => {
      const data = {
        guestName: 'Jane Guest',
        guestEmail: 'guest@example.com',
        ownerName: 'John Owner',
        campsiteName: 'Mountain View Campsite',
        originalMessage: 'Original message',
        replyMessage: 'Line 1\nLine 2\nLine 3',
        campsiteUrl: 'https://campingthailand.com/campsites/123',
      };

      await emailService.sendInquiryReply(data);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const formData = fetchCall[1].body as FormData;
      const htmlContent = formData.get('html') as string;

      expect(htmlContent).toContain('Line 1<br>Line 2<br>Line 3');
    });

    it('should handle email send failure gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Server error',
      });

      const data = {
        guestName: 'Jane Guest',
        guestEmail: 'guest@example.com',
        ownerName: 'John Owner',
        campsiteName: 'Mountain View Campsite',
        originalMessage: 'Original message',
        replyMessage: 'Reply message',
        campsiteUrl: 'https://campingthailand.com/campsites/123',
      };

      const result = await emailService.sendInquiryReply(data);

      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith('Mailgun API error:', {
        status: 500,
        error: 'Server error',
      });
    });
  });

  describe('Email template rendering', () => {
    beforeEach(() => {
      process.env.MAILGUN_DOMAIN = 'test.mailgun.org';
      process.env.MAILGUN_API_KEY = 'test-api-key';
      process.env.EMAIL_FROM = 'noreply@campingthailand.com';
      emailService = new EmailService();

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
      });
    });

    it('should render inquiry notification template correctly', async () => {
      const data = {
        ownerName: 'John Owner',
        ownerEmail: 'owner@example.com',
        campsiteName: 'Mountain View Campsite',
        guestName: 'Jane Guest',
        guestEmail: 'guest@example.com',
        message: 'Test message',
        inquiryType: 'General',
        dashboardUrl: 'https://example.com/dashboard',
      };

      await emailService.sendInquiryNotification(data);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const formData = fetchCall[1].body as FormData;
      const htmlContent = formData.get('html') as string;

      // Verify HTML structure
      expect(htmlContent).toContain('<!DOCTYPE html>');
      expect(htmlContent).toContain('<html>');
      expect(htmlContent).toContain('</html>');
      expect(htmlContent).toContain('charset="utf-8"');

      // Verify styling
      expect(htmlContent).toContain('<style>');
      expect(htmlContent).toContain('font-family');
      expect(htmlContent).toContain('.container');
      expect(htmlContent).toContain('.header');
      expect(htmlContent).toContain('.content');
      expect(htmlContent).toContain('.message-box');

      // Verify content sections
      expect(htmlContent).toContain('New Inquiry Received');
      expect(htmlContent).toContain('View in Dashboard');
    });

    it('should render inquiry reply template correctly', async () => {
      const data = {
        guestName: 'Jane Guest',
        guestEmail: 'guest@example.com',
        ownerName: 'John Owner',
        campsiteName: 'Mountain View Campsite',
        originalMessage: 'Original',
        replyMessage: 'Reply',
        campsiteUrl: 'https://example.com/campsite',
      };

      await emailService.sendInquiryReply(data);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const formData = fetchCall[1].body as FormData;
      const htmlContent = formData.get('html') as string;

      // Verify HTML structure
      expect(htmlContent).toContain('<!DOCTYPE html>');
      expect(htmlContent).toContain('<html>');
      expect(htmlContent).toContain('</html>');

      // Verify styling
      expect(htmlContent).toContain('<style>');
      expect(htmlContent).toContain('.message-box');
      expect(htmlContent).toContain('.original-box');

      // Verify content sections
      expect(htmlContent).toContain('Reply from');
      expect(htmlContent).toContain('View Campsite');
      expect(htmlContent).toContain('Your original message:');
    });

    it('should include both HTML and text versions', async () => {
      const data = {
        guestName: 'Jane Guest',
        guestEmail: 'guest@example.com',
        ownerName: 'John Owner',
        campsiteName: 'Mountain View Campsite',
        originalMessage: 'Original',
        replyMessage: 'Reply',
        campsiteUrl: 'https://example.com/campsite',
      };

      await emailService.sendInquiryReply(data);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const formData = fetchCall[1].body as FormData;

      expect(formData.get('html')).toBeTruthy();
      expect(formData.get('text')).toBeTruthy();
      expect(formData.get('html')).toContain('<html>');
      expect(formData.get('text')).not.toContain('<html>');
    });
  });

  describe('Email address validation', () => {
    beforeEach(() => {
      process.env.MAILGUN_DOMAIN = 'test.mailgun.org';
      process.env.MAILGUN_API_KEY = 'test-api-key';
      process.env.EMAIL_FROM = 'noreply@campingthailand.com';
      emailService = new EmailService();
    });

    it('should handle invalid email addresses', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Invalid recipient address',
      });

      const result = await emailService.sendEmail({
        to: 'invalid-email',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith('Mailgun API error:', {
        status: 400,
        error: 'Invalid recipient address',
      });
    });

    it('should accept valid email addresses', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
      });

      const result = await emailService.sendEmail({
        to: 'valid.email@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      expect(result).toBe(true);
    });
  });

  describe('Rate limiting considerations', () => {
    beforeEach(() => {
      process.env.MAILGUN_DOMAIN = 'test.mailgun.org';
      process.env.MAILGUN_API_KEY = 'test-api-key';
      process.env.EMAIL_FROM = 'noreply@campingthailand.com';
      emailService = new EmailService();

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
      });
    });

    it('should handle multiple concurrent email sends', async () => {
      const promises = Array.from({ length: 5 }, (_, i) =>
        emailService.sendEmail({
          to: `user${i}@example.com`,
          subject: `Test ${i}`,
          html: `<p>Test ${i}</p>`,
        })
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      expect(results.every((r) => r === true)).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(5);
    });

    it('should handle Mailgun rate limit errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: async () => 'Too many requests',
      });

      const result = await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith('Mailgun API error:', {
        status: 429,
        error: 'Too many requests',
      });
    });

    it('should successfully send multiple inquiry notifications', async () => {
      const data1 = {
        ownerName: 'Owner 1',
        ownerEmail: 'owner1@example.com',
        campsiteName: 'Campsite 1',
        guestName: 'Guest 1',
        guestEmail: 'guest1@example.com',
        message: 'Message 1',
        inquiryType: 'General',
        dashboardUrl: 'https://example.com/1',
      };

      const data2 = {
        ownerName: 'Owner 2',
        ownerEmail: 'owner2@example.com',
        campsiteName: 'Campsite 2',
        guestName: 'Guest 2',
        guestEmail: 'guest2@example.com',
        message: 'Message 2',
        inquiryType: 'Booking',
        dashboardUrl: 'https://example.com/2',
      };

      const results = await Promise.all([
        emailService.sendInquiryNotification(data1),
        emailService.sendInquiryNotification(data2),
      ]);

      expect(results).toEqual([true, true]);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should successfully send multiple inquiry replies', async () => {
      const reply1 = {
        guestName: 'Guest 1',
        guestEmail: 'guest1@example.com',
        ownerName: 'Owner 1',
        campsiteName: 'Campsite 1',
        originalMessage: 'Original 1',
        replyMessage: 'Reply 1',
        campsiteUrl: 'https://example.com/1',
      };

      const reply2 = {
        guestName: 'Guest 2',
        guestEmail: 'guest2@example.com',
        ownerName: 'Owner 2',
        campsiteName: 'Campsite 2',
        originalMessage: 'Original 2',
        replyMessage: 'Reply 2',
        campsiteUrl: 'https://example.com/2',
      };

      const results = await Promise.all([
        emailService.sendInquiryReply(reply1),
        emailService.sendInquiryReply(reply2),
      ]);

      expect(results).toEqual([true, true]);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });
});
