import request from 'supertest';
import app from '../../src/app';
import { supabaseAdmin } from '../../src/lib/supabase';

// Mock Supabase
const mockGetUser = jest.fn();
const mockFrom = jest.fn();

jest.mock('../../src/lib/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(),
    auth: {
      getUser: jest.fn(),
    },
  },
  createSupabaseClient: jest.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
  })),
}));

// Mock rate limiter
jest.mock('../../src/middleware/rate-limit', () => ({
  inquiryRateLimiter: (req: any, res: any, next: any) => next(),
}));

describe('POST /api/auth/owner-request', () => {
  const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
  const mockToken = 'mock-jwt-token';

  const validOwnerRequest = {
    business_name: 'Camp Adventure Thailand',
    business_description:
      'We provide premium camping experiences with full amenities and beautiful mountain views.',
    contact_phone: '0812345678',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should return 401 when no token is provided', async () => {
      const response = await request(app)
        .post('/api/auth/owner-request')
        .send(validOwnerRequest);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('No authentication token provided');
    });

    it('should return 401 when invalid token is provided', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Invalid token'),
      });

      const response = await request(app)
        .post('/api/auth/owner-request')
        .set('Authorization', `Bearer invalid-token`)
        .send(validOwnerRequest);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Validation', () => {
    beforeEach(() => {
      // Mock successful authentication
      mockGetUser.mockResolvedValue({
        data: { user: { id: mockUserId, email: 'test@test.com' } },
        error: null,
      });

      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { user_role: 'user' },
              error: null,
            }),
          }),
        }),
      });
    });

    it('should pass validation with valid owner request data', async () => {
      let callCount = 0;
      (supabaseAdmin.from as jest.Mock).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call: check user role
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { user_role: 'user' },
                  error: null,
                }),
              }),
            }),
          };
        } else if (callCount === 2) {
          // Second call: check existing pending request
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: null,
                    error: { code: 'PGRST116' },
                  }),
                }),
              }),
            }),
          };
        } else {
          // Third call: insert new request
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    id: 'request-123',
                    user_id: mockUserId,
                    ...validOwnerRequest,
                    status: 'pending',
                    created_at: new Date().toISOString(),
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
      });

      const response = await request(app)
        .post('/api/auth/owner-request')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(validOwnerRequest);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('request');
    });

    it('should return 400 when required fields are missing', async () => {
      const response = await request(app)
        .post('/api/auth/owner-request')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({
          business_name: 'Test Camp',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Validation failed');
      expect(response.body).toHaveProperty('details');
      expect(response.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'business_description' }),
          expect.objectContaining({ field: 'contact_phone' }),
        ])
      );
    });

    it('should return 400 when business_name is too short', async () => {
      const response = await request(app)
        .post('/api/auth/owner-request')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({
          ...validOwnerRequest,
          business_name: 'AB',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Validation failed');
      expect(response.body).toHaveProperty('details');
      expect(response.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'business_name',
            message: 'Business name must be at least 3 characters',
          }),
        ])
      );
    });

    it('should return 400 when business_description is too short', async () => {
      const response = await request(app)
        .post('/api/auth/owner-request')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({
          ...validOwnerRequest,
          business_description: 'Too short',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Validation failed');
      expect(response.body).toHaveProperty('details');
      expect(response.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'business_description',
            message: 'Description must be at least 20 characters',
          }),
        ])
      );
    });

    it('should return 400 when contact_phone has invalid format', async () => {
      const invalidPhones = [
        '123456789', // Not starting with 0
        '01234567', // Too short
        '0123456789012', // Too long
        '0112345678', // Invalid area code (01)
        'abc1234567', // Contains letters
      ];

      for (const phone of invalidPhones) {
        const response = await request(app)
          .post('/api/auth/owner-request')
          .set('Authorization', `Bearer ${mockToken}`)
          .send({
            ...validOwnerRequest,
            contact_phone: phone,
          });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toBe('Validation failed');
        expect(response.body).toHaveProperty('details');
        expect(response.body.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'contact_phone',
              message: 'Invalid Thai phone number',
            }),
          ])
        );
      }
    });

    it('should accept valid Thai phone numbers', async () => {
      const validPhones = [
        '0212345678', // Bangkok landline (9 digits)
        '021234567', // Bangkok landline (8 digits)
        '0812345678', // Mobile 08
        '0912345678', // Mobile 09
      ];

      for (const phone of validPhones) {
        let callCount = 0;
        (supabaseAdmin.from as jest.Mock).mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { user_role: 'user' },
                    error: null,
                  }),
                }),
              }),
            };
          } else if (callCount === 2) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: null,
                      error: { code: 'PGRST116' },
                    }),
                  }),
                }),
              }),
            };
          } else {
            return {
              insert: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: {
                      id: 'request-123',
                      user_id: mockUserId,
                      ...validOwnerRequest,
                      contact_phone: phone,
                      status: 'pending',
                      created_at: new Date().toISOString(),
                    },
                    error: null,
                  }),
                }),
              }),
            };
          }
        });

        const response = await request(app)
          .post('/api/auth/owner-request')
          .set('Authorization', `Bearer ${mockToken}`)
          .send({
            ...validOwnerRequest,
            contact_phone: phone,
          });

        expect(response.status).toBe(201);
      }
    });

    it('should return 400 when business_name exceeds max length', async () => {
      const response = await request(app)
        .post('/api/auth/owner-request')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({
          ...validOwnerRequest,
          business_name: 'A'.repeat(256),
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Validation failed');
    });

    it('should return 400 when business_description exceeds max length', async () => {
      const response = await request(app)
        .post('/api/auth/owner-request')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({
          ...validOwnerRequest,
          business_description: 'A'.repeat(2001),
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('Business Logic', () => {
    beforeEach(() => {
      // Mock successful authentication
      mockGetUser.mockResolvedValue({
        data: { user: { id: mockUserId, email: 'test@test.com' } },
        error: null,
      });

      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { user_role: 'user' },
              error: null,
            }),
          }),
        }),
      });
    });

    it('should return 400 if user is already an owner', async () => {
      let callCount = 0;
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockImplementation(() => {
              callCount++;
              if (callCount === 1) {
                return Promise.resolve({
                  data: { user_role: 'owner' },
                  error: null,
                });
              }
              return Promise.resolve({
                data: null,
                error: null,
              });
            }),
          }),
        }),
      });

      const response = await request(app)
        .post('/api/auth/owner-request')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(validOwnerRequest);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('You are already a campsite owner');
    });

    it('should return 400 if user is an admin', async () => {
      let callCount = 0;
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockImplementation(() => {
              callCount++;
              if (callCount === 1) {
                return Promise.resolve({
                  data: { user_role: 'admin' },
                  error: null,
                });
              }
              return Promise.resolve({
                data: null,
                error: null,
              });
            }),
          }),
        }),
      });

      const response = await request(app)
        .post('/api/auth/owner-request')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(validOwnerRequest);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Admins do not need to request owner status');
    });
  });
});
