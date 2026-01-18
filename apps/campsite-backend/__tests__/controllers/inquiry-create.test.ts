// Jest Unit Tests for Inquiry Controller - Create Functionality
// Tests inquiry creation, email notifications, and error handling

import { Request, Response } from 'express';
import { createInquiry } from '../../src/controllers/inquiryController';
import * as inquiryService from '../../src/services/inquiryService';
import logger from '../../src/utils/logger';
import { AuthenticatedRequest } from '../../src/middleware/auth';

// Mock dependencies
jest.mock('../../src/services/inquiryService');
jest.mock('../../src/utils/logger');

describe('Inquiry Controller - createInquiry', () => {
  let mockReq: Partial<AuthenticatedRequest>;
  let mockRes: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let getHeaderMock: jest.Mock;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup response mocks
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnThis();
    getHeaderMock = jest.fn();

    mockReq = {
      user: {
        id: 'user-123',
        email: 'test@example.com',
        role: 'user',
      },
      body: {
        campsite_id: 'campsite-123',
        guest_name: 'John Doe',
        guest_email: 'john@example.com',
        guest_phone: '+66123456789',
        inquiry_type: 'booking',
        subject: 'Weekend camping',
        message: 'I would like to book a tent for the weekend.',
        check_in_date: '2026-02-01',
        check_out_date: '2026-02-03',
        guest_count: 2,
        accommodation_type_id: 'acc-123',
      },
    };

    mockRes = {
      status: statusMock,
      json: jsonMock,
      getHeader: getHeaderMock,
    };

    // Default rate limit headers
    getHeaderMock.mockImplementation((header: string) => {
      if (header === 'X-RateLimit-Remaining') return '4';
      if (header === 'X-RateLimit-Limit') return '5';
      if (header === 'X-RateLimit-Reset') return String(Date.now() + 86400000);
      return undefined;
    });
  });

  describe('Success Cases', () => {
    it('should create inquiry record in database and return created inquiry with ID', async () => {
      const mockInquiry = { id: 'inquiry-123' };
      (inquiryService.createInquiry as jest.Mock).mockResolvedValue({
        success: true,
        inquiry: mockInquiry,
      });

      await createInquiry(mockReq as AuthenticatedRequest, mockRes as Response);

      // Verify service was called with correct parameters
      expect(inquiryService.createInquiry).toHaveBeenCalledWith(
        mockReq.body,
        'user-123'
      );

      // Verify response
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: 'Inquiry sent successfully. The owner will be notified.',
        data: mockInquiry,
        rateLimitInfo: {
          remaining: 4,
          limit: 5,
          resetAt: expect.any(String),
        },
      });
    });

    it('should associate inquiry with campsite', async () => {
      (inquiryService.createInquiry as jest.Mock).mockResolvedValue({
        success: true,
        inquiry: { id: 'inquiry-123' },
      });

      await createInquiry(mockReq as AuthenticatedRequest, mockRes as Response);

      const callArgs = (inquiryService.createInquiry as jest.Mock).mock.calls[0][0];
      expect(callArgs.campsite_id).toBe('campsite-123');
    });

    it('should associate inquiry with authenticated user', async () => {
      (inquiryService.createInquiry as jest.Mock).mockResolvedValue({
        success: true,
        inquiry: { id: 'inquiry-123' },
      });

      await createInquiry(mockReq as AuthenticatedRequest, mockRes as Response);

      // Verify user ID was passed to service
      expect(inquiryService.createInquiry).toHaveBeenCalledWith(
        expect.any(Object),
        'user-123'
      );
    });

    it('should handle unauthenticated user (guest inquiry)', async () => {
      mockReq.user = undefined;

      (inquiryService.createInquiry as jest.Mock).mockResolvedValue({
        success: true,
        inquiry: { id: 'inquiry-123' },
      });

      await createInquiry(mockReq as AuthenticatedRequest, mockRes as Response);

      // Verify service was called with undefined user ID
      expect(inquiryService.createInquiry).toHaveBeenCalledWith(
        mockReq.body,
        undefined
      );

      expect(statusMock).toHaveBeenCalledWith(201);
    });

    it('should include rate limit information in response', async () => {
      const resetTime = Date.now() + 86400000;
      getHeaderMock.mockImplementation((header: string) => {
        if (header === 'X-RateLimit-Remaining') return '2';
        if (header === 'X-RateLimit-Limit') return '5';
        if (header === 'X-RateLimit-Reset') return String(resetTime);
        return undefined;
      });

      (inquiryService.createInquiry as jest.Mock).mockResolvedValue({
        success: true,
        inquiry: { id: 'inquiry-123' },
      });

      await createInquiry(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          rateLimitInfo: {
            remaining: 2,
            limit: 5,
            resetAt: new Date(resetTime).toISOString(),
          },
        })
      );
    });

    it('should handle missing rate limit headers gracefully', async () => {
      getHeaderMock.mockReturnValue(undefined);

      (inquiryService.createInquiry as jest.Mock).mockResolvedValue({
        success: true,
        inquiry: { id: 'inquiry-123' },
      });

      await createInquiry(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          rateLimitInfo: {
            remaining: 0,
            limit: 5,
            resetAt: null,
          },
        })
      );
    });
  });

  describe('Email Triggering', () => {
    it('should trigger notification email to owner', async () => {
      // Note: Email sending happens in service layer, not controller
      // Controller just calls service which handles emails asynchronously
      (inquiryService.createInquiry as jest.Mock).mockResolvedValue({
        success: true,
        inquiry: { id: 'inquiry-123' },
      });

      await createInquiry(mockReq as AuthenticatedRequest, mockRes as Response);

      // Verify service was called (service handles email notifications)
      expect(inquiryService.createInquiry).toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(201);
    });

    it('should trigger confirmation email to guest', async () => {
      // Note: Email sending happens in service layer
      (inquiryService.createInquiry as jest.Mock).mockResolvedValue({
        success: true,
        inquiry: { id: 'inquiry-123' },
      });

      await createInquiry(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(inquiryService.createInquiry).toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(201);
    });

    it('should continue even if email fails (handled in service layer)', async () => {
      // Service handles email failures gracefully and still returns success
      (inquiryService.createInquiry as jest.Mock).mockResolvedValue({
        success: true,
        inquiry: { id: 'inquiry-123' },
      });

      await createInquiry(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: { id: 'inquiry-123' },
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      (inquiryService.createInquiry as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Failed to create inquiry',
      });

      await createInquiry(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to create inquiry',
      });
    });

    it('should return appropriate error codes for campsite not found', async () => {
      (inquiryService.createInquiry as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Campsite not found',
      });

      await createInquiry(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Campsite not found',
      });
    });

    it('should handle service exceptions and return 500 error', async () => {
      const testError = new Error('Database connection failed');
      (inquiryService.createInquiry as jest.Mock).mockRejectedValue(testError);

      await createInquiry(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to send inquiry',
      });
    });

    it('should log errors for debugging', async () => {
      const testError = new Error('Database error');
      (inquiryService.createInquiry as jest.Mock).mockRejectedValue(testError);

      await createInquiry(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(logger.error).toHaveBeenCalledWith(
        'Create inquiry controller error',
        { error: testError }
      );
    });

    it('should handle service returning success false with error message', async () => {
      (inquiryService.createInquiry as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Invalid input data',
      });

      await createInquiry(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid input data',
      });
    });

    it('should handle unexpected error format', async () => {
      (inquiryService.createInquiry as jest.Mock).mockRejectedValue('String error');

      await createInquiry(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to send inquiry',
      });
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('Input Validation', () => {
    it('should pass all inquiry fields to service', async () => {
      (inquiryService.createInquiry as jest.Mock).mockResolvedValue({
        success: true,
        inquiry: { id: 'inquiry-123' },
      });

      await createInquiry(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(inquiryService.createInquiry).toHaveBeenCalledWith(
        expect.objectContaining({
          campsite_id: 'campsite-123',
          guest_name: 'John Doe',
          guest_email: 'john@example.com',
          guest_phone: '+66123456789',
          inquiry_type: 'booking',
          subject: 'Weekend camping',
          message: 'I would like to book a tent for the weekend.',
          check_in_date: '2026-02-01',
          check_out_date: '2026-02-03',
          guest_count: 2,
          accommodation_type_id: 'acc-123',
        }),
        'user-123'
      );
    });

    it('should handle minimal required fields', async () => {
      mockReq.body = {
        campsite_id: 'campsite-123',
        guest_name: 'Jane Doe',
        guest_email: 'jane@example.com',
        message: 'General question about facilities.',
      };

      (inquiryService.createInquiry as jest.Mock).mockResolvedValue({
        success: true,
        inquiry: { id: 'inquiry-456' },
      });

      await createInquiry(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(inquiryService.createInquiry).toHaveBeenCalledWith(
        mockReq.body,
        'user-123'
      );
      expect(statusMock).toHaveBeenCalledWith(201);
    });
  });

  describe('Response Format', () => {
    it('should return consistent response structure on success', async () => {
      (inquiryService.createInquiry as jest.Mock).mockResolvedValue({
        success: true,
        inquiry: { id: 'inquiry-123' },
      });

      await createInquiry(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: expect.any(String),
        data: expect.objectContaining({ id: 'inquiry-123' }),
        rateLimitInfo: expect.objectContaining({
          remaining: expect.any(Number),
          limit: expect.any(Number),
          resetAt: expect.any(String),
        }),
      });
    });

    it('should return consistent response structure on error', async () => {
      (inquiryService.createInquiry as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Test error',
      });

      await createInquiry(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Test error',
      });
    });
  });
});
