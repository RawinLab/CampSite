import request from 'supertest';
import app from '../../src/app';
import { supabaseAdmin } from '../../src/lib/supabase';
import * as emailService from '../../src/services/emailService';

/**
 * Unit tests for Inquiry API Endpoint
 * Tests POST /api/inquiries endpoint
 * Covers: validation, authentication, error handling, rate limiting
 */

// Mock Supabase
jest.mock('../../src/lib/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(),
    auth: {
      admin: {
        getUserById: jest.fn(),
      },
    },
  },
}));

// Mock email service
jest.mock('../../src/services/emailService', () => ({
  sendInquiryNotification: jest.fn().mockResolvedValue(undefined),
  sendInquiryConfirmation: jest.fn().mockResolvedValue(undefined),
  sendInquiryReplyNotification: jest.fn().mockResolvedValue(undefined),
}));

// Mock rate limiter middleware to avoid Redis dependency
jest.mock('../../src/middleware/rate-limit', () => ({
  inquiryRateLimiter: (req: any, res: any, next: any) => {
    res.setHeader('X-RateLimit-Limit', '5');
    res.setHeader('X-RateLimit-Remaining', '4');
    res.setHeader('X-RateLimit-Reset', Date.now() + 86400000);
    next();
  },
}));

// Mock auth middleware
jest.mock('../../src/middleware/auth', () => ({
  authMiddleware: (req: any, res: any, next: any) => {
    if (req.headers.authorization === 'Bearer valid-token') {
      req.user = {
        id: 'user-123',
        email: 'user@example.com',
        role: 'user',
      };
    }
    next();
  },
  optionalAuthMiddleware: (req: any, res: any, next: any) => {
    if (req.headers.authorization === 'Bearer valid-token') {
      req.user = {
        id: 'user-123',
        email: 'user@example.com',
        role: 'user',
      };
    }
    next();
  },
}));

describe('Unit: Inquiry API - POST /api/inquiries', () => {
  const validInquiryData = {
    campsite_id: '123e4567-e89b-12d3-a456-426614174000',
    guest_name: 'John Doe',
    guest_email: 'john@example.com',
    guest_phone: '0812345678',
    inquiry_type: 'booking',
    subject: 'Weekend booking inquiry',
    message: 'I would like to book a campsite for the upcoming weekend. Do you have availability?',
    check_in_date: '2024-12-15',
    check_out_date: '2024-12-17',
    guest_count: 4,
  };

  const mockCampsite = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Mountain View Camp',
    owner_id: 'owner-123',
    profiles: {
      id: 'owner-123',
      full_name: 'Owner Name',
      email: 'owner@example.com',
    },
  };

  const mockInquiryResponse = {
    id: 'inquiry-123',
  };

  const mockQueryBuilder = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (supabaseAdmin.from as jest.Mock).mockReturnValue(mockQueryBuilder);
  });

  describe('Valid inquiry submission', () => {
    it('returns 201 for valid inquiry data', async () => {
      mockQueryBuilder.single
        .mockResolvedValueOnce({ data: mockCampsite, error: null })
        .mockResolvedValueOnce({ data: mockInquiryResponse, error: null });

      mockQueryBuilder.insert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockInquiryResponse, error: null }),
        }),
      });

      const response = await request(app)
        .post('/api/inquiries')
        .send(validInquiryData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id');
    });

    it('returns correct response structure with rate limit info', async () => {
      mockQueryBuilder.single
        .mockResolvedValueOnce({ data: mockCampsite, error: null })
        .mockResolvedValueOnce({ data: mockInquiryResponse, error: null });

      mockQueryBuilder.insert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockInquiryResponse, error: null }),
        }),
      });

      const response = await request(app)
        .post('/api/inquiries')
        .send(validInquiryData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('rateLimitInfo');
      expect(response.body.rateLimitInfo).toHaveProperty('remaining');
      expect(response.body.rateLimitInfo).toHaveProperty('limit');
      expect(response.body.rateLimitInfo).toHaveProperty('resetAt');
      expect(typeof response.body.rateLimitInfo.remaining).toBe('number');
      expect(typeof response.body.rateLimitInfo.limit).toBe('number');
    });

    it('works for authenticated users', async () => {
      mockQueryBuilder.single
        .mockResolvedValueOnce({ data: mockCampsite, error: null })
        .mockResolvedValueOnce({ data: mockInquiryResponse, error: null });

      mockQueryBuilder.insert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockInquiryResponse, error: null }),
        }),
      });

      const response = await request(app)
        .post('/api/inquiries')
        .set('Authorization', 'Bearer valid-token')
        .send(validInquiryData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('works for anonymous users', async () => {
      mockQueryBuilder.single
        .mockResolvedValueOnce({ data: mockCampsite, error: null })
        .mockResolvedValueOnce({ data: mockInquiryResponse, error: null });

      mockQueryBuilder.insert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockInquiryResponse, error: null }),
        }),
      });

      const response = await request(app)
        .post('/api/inquiries')
        .send(validInquiryData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('accepts valid inquiry without optional fields', async () => {
      const minimalInquiry = {
        campsite_id: '123e4567-e89b-12d3-a456-426614174000',
        guest_name: 'Jane Smith',
        guest_email: 'jane@example.com',
        message: 'I am interested in visiting your campsite next month.',
      };

      mockQueryBuilder.single
        .mockResolvedValueOnce({ data: mockCampsite, error: null })
        .mockResolvedValueOnce({ data: mockInquiryResponse, error: null });

      mockQueryBuilder.insert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockInquiryResponse, error: null }),
        }),
      });

      const response = await request(app)
        .post('/api/inquiries')
        .send(minimalInquiry);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Required fields validation', () => {
    it('returns 400 for missing campsite_id', async () => {
      const invalidData = { ...validInquiryData };
      delete (invalidData as any).campsite_id;

      const response = await request(app)
        .post('/api/inquiries')
        .send(invalidData);

      expect(response.status).toBe(400);
    });

    it('returns 400 for missing guest_name', async () => {
      const invalidData = { ...validInquiryData };
      delete (invalidData as any).guest_name;

      const response = await request(app)
        .post('/api/inquiries')
        .send(invalidData);

      expect(response.status).toBe(400);
    });

    it('returns 400 for missing guest_email', async () => {
      const invalidData = { ...validInquiryData };
      delete (invalidData as any).guest_email;

      const response = await request(app)
        .post('/api/inquiries')
        .send(invalidData);

      expect(response.status).toBe(400);
    });

    it('returns 400 for missing message', async () => {
      const invalidData = { ...validInquiryData };
      delete (invalidData as any).message;

      const response = await request(app)
        .post('/api/inquiries')
        .send(invalidData);

      expect(response.status).toBe(400);
    });

    it('returns 400 for empty request body', async () => {
      const response = await request(app)
        .post('/api/inquiries')
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('Email validation', () => {
    it('returns 400 for invalid email format', async () => {
      const invalidData = {
        ...validInquiryData,
        guest_email: 'not-an-email',
      };

      const response = await request(app)
        .post('/api/inquiries')
        .send(invalidData);

      expect(response.status).toBe(400);
    });

    it('returns 400 for email without @', async () => {
      const invalidData = {
        ...validInquiryData,
        guest_email: 'invalidemail.com',
      };

      const response = await request(app)
        .post('/api/inquiries')
        .send(invalidData);

      expect(response.status).toBe(400);
    });

    it('returns 400 for email without domain', async () => {
      const invalidData = {
        ...validInquiryData,
        guest_email: 'invalid@',
      };

      const response = await request(app)
        .post('/api/inquiries')
        .send(invalidData);

      expect(response.status).toBe(400);
    });

    it('accepts valid email formats', async () => {
      const validEmails = [
        'user@example.com',
        'user.name@example.co.th',
        'user+tag@example.com',
        'user123@test-domain.com',
      ];

      for (const email of validEmails) {
        mockQueryBuilder.single
          .mockResolvedValueOnce({ data: mockCampsite, error: null })
          .mockResolvedValueOnce({ data: mockInquiryResponse, error: null });

        mockQueryBuilder.insert.mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockInquiryResponse, error: null }),
          }),
        });

        const response = await request(app)
          .post('/api/inquiries')
          .send({ ...validInquiryData, guest_email: email });

        expect(response.status).toBe(201);
      }
    });
  });

  describe('Message validation', () => {
    it('returns 400 for message too short (< 20 chars)', async () => {
      const invalidData = {
        ...validInquiryData,
        message: 'Too short',
      };

      const response = await request(app)
        .post('/api/inquiries')
        .send(invalidData);

      expect(response.status).toBe(400);
    });

    it('returns 400 for message too long (> 2000 chars)', async () => {
      const invalidData = {
        ...validInquiryData,
        message: 'a'.repeat(2001),
      };

      const response = await request(app)
        .post('/api/inquiries')
        .send(invalidData);

      expect(response.status).toBe(400);
    });

    it('accepts message exactly 20 characters', async () => {
      mockQueryBuilder.single
        .mockResolvedValueOnce({ data: mockCampsite, error: null })
        .mockResolvedValueOnce({ data: mockInquiryResponse, error: null });

      mockQueryBuilder.insert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockInquiryResponse, error: null }),
        }),
      });

      const validData = {
        ...validInquiryData,
        message: 'a'.repeat(20),
      };

      const response = await request(app)
        .post('/api/inquiries')
        .send(validData);

      expect(response.status).toBe(201);
    });

    it('accepts message exactly 2000 characters', async () => {
      mockQueryBuilder.single
        .mockResolvedValueOnce({ data: mockCampsite, error: null })
        .mockResolvedValueOnce({ data: mockInquiryResponse, error: null });

      mockQueryBuilder.insert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockInquiryResponse, error: null }),
        }),
      });

      const validData = {
        ...validInquiryData,
        message: 'a'.repeat(2000),
      };

      const response = await request(app)
        .post('/api/inquiries')
        .send(validData);

      expect(response.status).toBe(201);
    });
  });

  describe('Phone validation', () => {
    it('accepts valid Thai phone number (0812345678)', async () => {
      mockQueryBuilder.single
        .mockResolvedValueOnce({ data: mockCampsite, error: null })
        .mockResolvedValueOnce({ data: mockInquiryResponse, error: null });

      mockQueryBuilder.insert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockInquiryResponse, error: null }),
        }),
      });

      const validData = {
        ...validInquiryData,
        guest_phone: '0812345678',
      };

      const response = await request(app)
        .post('/api/inquiries')
        .send(validData);

      expect(response.status).toBe(201);
    });

    it('accepts Thai phone with dashes (081-234-5678)', async () => {
      mockQueryBuilder.single
        .mockResolvedValueOnce({ data: mockCampsite, error: null })
        .mockResolvedValueOnce({ data: mockInquiryResponse, error: null });

      mockQueryBuilder.insert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockInquiryResponse, error: null }),
        }),
      });

      const validData = {
        ...validInquiryData,
        guest_phone: '081-234-5678',
      };

      const response = await request(app)
        .post('/api/inquiries')
        .send(validData);

      expect(response.status).toBe(201);
    });

    it('accepts Thai phone with spaces (081 234 5678)', async () => {
      mockQueryBuilder.single
        .mockResolvedValueOnce({ data: mockCampsite, error: null })
        .mockResolvedValueOnce({ data: mockInquiryResponse, error: null });

      mockQueryBuilder.insert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockInquiryResponse, error: null }),
        }),
      });

      const validData = {
        ...validInquiryData,
        guest_phone: '081 234 5678',
      };

      const response = await request(app)
        .post('/api/inquiries')
        .send(validData);

      expect(response.status).toBe(201);
    });

    it('returns 400 for invalid phone format (not starting with 0)', async () => {
      const invalidData = {
        ...validInquiryData,
        guest_phone: '812345678',
      };

      const response = await request(app)
        .post('/api/inquiries')
        .send(invalidData);

      expect(response.status).toBe(400);
    });

    it('returns 400 for phone number too short', async () => {
      const invalidData = {
        ...validInquiryData,
        guest_phone: '081234567',
      };

      const response = await request(app)
        .post('/api/inquiries')
        .send(invalidData);

      expect(response.status).toBe(400);
    });

    it('returns 400 for phone number too long', async () => {
      const invalidData = {
        ...validInquiryData,
        guest_phone: '08123456789',
      };

      const response = await request(app)
        .post('/api/inquiries')
        .send(invalidData);

      expect(response.status).toBe(400);
    });

    it('accepts null phone number', async () => {
      mockQueryBuilder.single
        .mockResolvedValueOnce({ data: mockCampsite, error: null })
        .mockResolvedValueOnce({ data: mockInquiryResponse, error: null });

      mockQueryBuilder.insert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockInquiryResponse, error: null }),
        }),
      });

      const validData = {
        ...validInquiryData,
        guest_phone: null,
      };

      const response = await request(app)
        .post('/api/inquiries')
        .send(validData);

      expect(response.status).toBe(201);
    });
  });

  describe('Inquiry type validation', () => {
    it('accepts valid inquiry_type: booking', async () => {
      mockQueryBuilder.single
        .mockResolvedValueOnce({ data: mockCampsite, error: null })
        .mockResolvedValueOnce({ data: mockInquiryResponse, error: null });

      mockQueryBuilder.insert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockInquiryResponse, error: null }),
        }),
      });

      const validData = {
        ...validInquiryData,
        inquiry_type: 'booking',
      };

      const response = await request(app)
        .post('/api/inquiries')
        .send(validData);

      expect(response.status).toBe(201);
    });

    it('accepts valid inquiry_type: general', async () => {
      mockQueryBuilder.single
        .mockResolvedValueOnce({ data: mockCampsite, error: null })
        .mockResolvedValueOnce({ data: mockInquiryResponse, error: null });

      mockQueryBuilder.insert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockInquiryResponse, error: null }),
        }),
      });

      const validData = {
        ...validInquiryData,
        inquiry_type: 'general',
      };

      const response = await request(app)
        .post('/api/inquiries')
        .send(validData);

      expect(response.status).toBe(201);
    });

    it('accepts valid inquiry_type: complaint', async () => {
      mockQueryBuilder.single
        .mockResolvedValueOnce({ data: mockCampsite, error: null })
        .mockResolvedValueOnce({ data: mockInquiryResponse, error: null });

      mockQueryBuilder.insert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockInquiryResponse, error: null }),
        }),
      });

      const validData = {
        ...validInquiryData,
        inquiry_type: 'complaint',
      };

      const response = await request(app)
        .post('/api/inquiries')
        .send(validData);

      expect(response.status).toBe(201);
    });

    it('accepts valid inquiry_type: other', async () => {
      mockQueryBuilder.single
        .mockResolvedValueOnce({ data: mockCampsite, error: null })
        .mockResolvedValueOnce({ data: mockInquiryResponse, error: null });

      mockQueryBuilder.insert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockInquiryResponse, error: null }),
        }),
      });

      const validData = {
        ...validInquiryData,
        inquiry_type: 'other',
      };

      const response = await request(app)
        .post('/api/inquiries')
        .send(validData);

      expect(response.status).toBe(201);
    });

    it('returns 400 for invalid inquiry_type', async () => {
      const invalidData = {
        ...validInquiryData,
        inquiry_type: 'invalid_type',
      };

      const response = await request(app)
        .post('/api/inquiries')
        .send(invalidData);

      expect(response.status).toBe(400);
    });

    it('defaults to general when inquiry_type not provided', async () => {
      mockQueryBuilder.single
        .mockResolvedValueOnce({ data: mockCampsite, error: null })
        .mockResolvedValueOnce({ data: mockInquiryResponse, error: null });

      mockQueryBuilder.insert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockInquiryResponse, error: null }),
        }),
      });

      const validData = { ...validInquiryData };
      delete (validData as any).inquiry_type;

      const response = await request(app)
        .post('/api/inquiries')
        .send(validData);

      expect(response.status).toBe(201);
    });
  });

  describe('Date validation', () => {
    it('accepts valid date format (YYYY-MM-DD)', async () => {
      mockQueryBuilder.single
        .mockResolvedValueOnce({ data: mockCampsite, error: null })
        .mockResolvedValueOnce({ data: mockInquiryResponse, error: null });

      mockQueryBuilder.insert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockInquiryResponse, error: null }),
        }),
      });

      const validData = {
        ...validInquiryData,
        check_in_date: '2024-12-15',
        check_out_date: '2024-12-17',
      };

      const response = await request(app)
        .post('/api/inquiries')
        .send(validData);

      expect(response.status).toBe(201);
    });

    it('returns 400 for invalid date format', async () => {
      const invalidData = {
        ...validInquiryData,
        check_in_date: '15-12-2024',
      };

      const response = await request(app)
        .post('/api/inquiries')
        .send(invalidData);

      expect(response.status).toBe(400);
    });

    it('returns 400 when check_out_date is before check_in_date', async () => {
      const invalidData = {
        ...validInquiryData,
        check_in_date: '2024-12-17',
        check_out_date: '2024-12-15',
      };

      const response = await request(app)
        .post('/api/inquiries')
        .send(invalidData);

      expect(response.status).toBe(400);
    });

    it('returns 400 when check_out_date equals check_in_date', async () => {
      const invalidData = {
        ...validInquiryData,
        check_in_date: '2024-12-15',
        check_out_date: '2024-12-15',
      };

      const response = await request(app)
        .post('/api/inquiries')
        .send(invalidData);

      expect(response.status).toBe(400);
    });

    it('accepts null dates', async () => {
      mockQueryBuilder.single
        .mockResolvedValueOnce({ data: mockCampsite, error: null })
        .mockResolvedValueOnce({ data: mockInquiryResponse, error: null });

      mockQueryBuilder.insert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockInquiryResponse, error: null }),
        }),
      });

      const validData = {
        ...validInquiryData,
        check_in_date: null,
        check_out_date: null,
      };

      const response = await request(app)
        .post('/api/inquiries')
        .send(validData);

      expect(response.status).toBe(201);
    });

    it('accepts only check_in_date without check_out_date', async () => {
      mockQueryBuilder.single
        .mockResolvedValueOnce({ data: mockCampsite, error: null })
        .mockResolvedValueOnce({ data: mockInquiryResponse, error: null });

      mockQueryBuilder.insert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockInquiryResponse, error: null }),
        }),
      });

      const validData = {
        ...validInquiryData,
        check_in_date: '2024-12-15',
        check_out_date: null,
      };

      const response = await request(app)
        .post('/api/inquiries')
        .send(validData);

      expect(response.status).toBe(201);
    });
  });

  describe('Campsite validation', () => {
    it('returns 400 for non-existent campsite_id', async () => {
      // Mock campsite query to return error (campsite not found)
      (supabaseAdmin.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'No rows found' },
            }),
          }),
        }),
      });

      const response = await request(app)
        .post('/api/inquiries')
        .send(validInquiryData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Campsite not found');
    });

    it('returns 400 for invalid UUID format in campsite_id', async () => {
      const invalidData = {
        ...validInquiryData,
        campsite_id: 'not-a-uuid',
      };

      const response = await request(app)
        .post('/api/inquiries')
        .send(invalidData);

      expect(response.status).toBe(400);
    });
  });

  describe('Guest name validation', () => {
    it('returns 400 for name too short (< 2 chars)', async () => {
      const invalidData = {
        ...validInquiryData,
        guest_name: 'A',
      };

      const response = await request(app)
        .post('/api/inquiries')
        .send(invalidData);

      expect(response.status).toBe(400);
    });

    it('returns 400 for name too long (> 100 chars)', async () => {
      const invalidData = {
        ...validInquiryData,
        guest_name: 'a'.repeat(101),
      };

      const response = await request(app)
        .post('/api/inquiries')
        .send(invalidData);

      expect(response.status).toBe(400);
    });

    it('accepts name exactly 2 characters', async () => {
      mockQueryBuilder.single
        .mockResolvedValueOnce({ data: mockCampsite, error: null })
        .mockResolvedValueOnce({ data: mockInquiryResponse, error: null });

      mockQueryBuilder.insert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockInquiryResponse, error: null }),
        }),
      });

      const validData = {
        ...validInquiryData,
        guest_name: 'AB',
      };

      const response = await request(app)
        .post('/api/inquiries')
        .send(validData);

      expect(response.status).toBe(201);
    });

    it('accepts name exactly 100 characters', async () => {
      mockQueryBuilder.single
        .mockResolvedValueOnce({ data: mockCampsite, error: null })
        .mockResolvedValueOnce({ data: mockInquiryResponse, error: null });

      mockQueryBuilder.insert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockInquiryResponse, error: null }),
        }),
      });

      const validData = {
        ...validInquiryData,
        guest_name: 'a'.repeat(100),
      };

      const response = await request(app)
        .post('/api/inquiries')
        .send(validData);

      expect(response.status).toBe(201);
    });
  });

  describe('Guest count validation', () => {
    it('accepts valid guest_count', async () => {
      mockQueryBuilder.single
        .mockResolvedValueOnce({ data: mockCampsite, error: null })
        .mockResolvedValueOnce({ data: mockInquiryResponse, error: null });

      mockQueryBuilder.insert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockInquiryResponse, error: null }),
        }),
      });

      const validData = {
        ...validInquiryData,
        guest_count: 5,
      };

      const response = await request(app)
        .post('/api/inquiries')
        .send(validData);

      expect(response.status).toBe(201);
    });

    it('returns 400 for guest_count less than 1', async () => {
      const invalidData = {
        ...validInquiryData,
        guest_count: 0,
      };

      const response = await request(app)
        .post('/api/inquiries')
        .send(invalidData);

      expect(response.status).toBe(400);
    });

    it('returns 400 for guest_count greater than 100', async () => {
      const invalidData = {
        ...validInquiryData,
        guest_count: 101,
      };

      const response = await request(app)
        .post('/api/inquiries')
        .send(invalidData);

      expect(response.status).toBe(400);
    });

    it('accepts null guest_count', async () => {
      mockQueryBuilder.single
        .mockResolvedValueOnce({ data: mockCampsite, error: null })
        .mockResolvedValueOnce({ data: mockInquiryResponse, error: null });

      mockQueryBuilder.insert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockInquiryResponse, error: null }),
        }),
      });

      const validData = {
        ...validInquiryData,
        guest_count: null,
      };

      const response = await request(app)
        .post('/api/inquiries')
        .send(validData);

      expect(response.status).toBe(201);
    });
  });

  describe('Subject validation', () => {
    it('accepts valid subject', async () => {
      mockQueryBuilder.single
        .mockResolvedValueOnce({ data: mockCampsite, error: null })
        .mockResolvedValueOnce({ data: mockInquiryResponse, error: null });

      mockQueryBuilder.insert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockInquiryResponse, error: null }),
        }),
      });

      const validData = {
        ...validInquiryData,
        subject: 'Booking for Christmas vacation',
      };

      const response = await request(app)
        .post('/api/inquiries')
        .send(validData);

      expect(response.status).toBe(201);
    });

    it('returns 400 for subject longer than 200 characters', async () => {
      const invalidData = {
        ...validInquiryData,
        subject: 'a'.repeat(201),
      };

      const response = await request(app)
        .post('/api/inquiries')
        .send(invalidData);

      expect(response.status).toBe(400);
    });

    it('accepts null subject', async () => {
      mockQueryBuilder.single
        .mockResolvedValueOnce({ data: mockCampsite, error: null })
        .mockResolvedValueOnce({ data: mockInquiryResponse, error: null });

      mockQueryBuilder.insert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockInquiryResponse, error: null }),
        }),
      });

      const validData = {
        ...validInquiryData,
        subject: null,
      };

      const response = await request(app)
        .post('/api/inquiries')
        .send(validData);

      expect(response.status).toBe(201);
    });
  });

  describe('Accommodation type validation', () => {
    it('accepts valid UUID for accommodation_type_id', async () => {
      mockQueryBuilder.single
        .mockResolvedValueOnce({ data: mockCampsite, error: null })
        .mockResolvedValueOnce({ data: mockInquiryResponse, error: null });

      mockQueryBuilder.insert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockInquiryResponse, error: null }),
        }),
      });

      const validData = {
        ...validInquiryData,
        accommodation_type_id: '123e4567-e89b-12d3-a456-426614174001',
      };

      const response = await request(app)
        .post('/api/inquiries')
        .send(validData);

      expect(response.status).toBe(201);
    });

    it('returns 400 for invalid UUID in accommodation_type_id', async () => {
      const invalidData = {
        ...validInquiryData,
        accommodation_type_id: 'not-a-uuid',
      };

      const response = await request(app)
        .post('/api/inquiries')
        .send(invalidData);

      expect(response.status).toBe(400);
    });

    it('accepts null accommodation_type_id', async () => {
      mockQueryBuilder.single
        .mockResolvedValueOnce({ data: mockCampsite, error: null })
        .mockResolvedValueOnce({ data: mockInquiryResponse, error: null });

      mockQueryBuilder.insert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockInquiryResponse, error: null }),
        }),
      });

      const validData = {
        ...validInquiryData,
        accommodation_type_id: null,
      };

      const response = await request(app)
        .post('/api/inquiries')
        .send(validData);

      expect(response.status).toBe(201);
    });
  });

  describe('Error handling', () => {
    it('returns 400 when database insert fails', async () => {
      // Mock successful campsite query
      (supabaseAdmin.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockCampsite,
              error: null,
            }),
          }),
        }),
      });

      // Mock failed insert
      (supabaseAdmin.from as jest.Mock).mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        }),
      });

      const response = await request(app)
        .post('/api/inquiries')
        .send(validInquiryData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('returns 400 for unexpected service errors', async () => {
      // Mock campsite query to throw unexpected error (caught by service try/catch)
      (supabaseAdmin.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockRejectedValue(new Error('Unexpected error')),
          }),
        }),
      });

      const response = await request(app)
        .post('/api/inquiries')
        .send(validInquiryData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('An unexpected error occurred');
    });
  });
});
