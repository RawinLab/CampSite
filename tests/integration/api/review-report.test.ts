/**
 * Integration Test: Review Report API Endpoint
 * Task T062: Integration test for report endpoint
 *
 * Tests the POST /api/reviews/:id/report endpoint
 * Part of Q11 report-based moderation system
 */

import request from 'supertest';
import app from '../../../apps/campsite-backend/src/app';
import { supabaseAdmin } from '../../../apps/campsite-backend/src/lib/supabase';

// Mock Supabase client
jest.mock('../../../apps/campsite-backend/src/lib/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(),
  },
}));

// Mock auth middleware
jest.mock('../../../apps/campsite-backend/src/middleware/auth', () => ({
  authMiddleware: (req: any, res: any, next: any) => {
    if (!req.headers.authorization) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const userId = req.headers.authorization.replace('Bearer ', '');
    req.user = { id: userId, role: 'user' };
    next();
  },
  optionalAuthMiddleware: (req: any, res: any, next: any) => {
    if (req.headers.authorization) {
      const userId = req.headers.authorization.replace('Bearer ', '');
      req.user = { id: userId, role: 'user' };
    }
    next();
  },
}));

describe('Integration: Review Report API', () => {
  const mockReviewId = 'review-123-456-789';
  const mockUserId = 'user-123-456-789';
  const mockReviewOwnerId = 'review-owner-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/reviews/:reviewId/report', () => {
    // Test 1: Successful report creation
    it('should successfully report a review with valid data', async () => {
      // Mock: Check for existing report (none found)
      const mockSelect1 = jest.fn().mockReturnThis();
      const mockEq1 = jest.fn().mockReturnThis();
      const mockEq2 = jest.fn().mockReturnThis();
      const mockSingle1 = jest.fn().mockResolvedValue({ data: null, error: null });

      // Mock: Get review to check owner
      const mockSelect2 = jest.fn().mockReturnThis();
      const mockEq3 = jest.fn().mockReturnThis();
      const mockSingle2 = jest.fn().mockResolvedValue({
        data: { user_id: mockReviewOwnerId },
        error: null,
      });

      // Mock: Insert report
      const mockInsert = jest.fn().mockResolvedValue({ data: {}, error: null });

      (supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce({
          select: mockSelect1.mockReturnValue({
            eq: mockEq1.mockReturnValue({
              eq: mockEq2.mockReturnValue({
                single: mockSingle1,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: mockSelect2.mockReturnValue({
            eq: mockEq3.mockReturnValue({
              single: mockSingle2,
            }),
          }),
        })
        .mockReturnValueOnce({
          insert: mockInsert,
        });

      const response = await request(app)
        .post(`/api/reviews/${mockReviewId}/report`)
        .set('Authorization', `Bearer ${mockUserId}`)
        .send({
          reason: 'spam',
          details: 'This review is clearly spam',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Review reported successfully');

      // Verify report was inserted
      expect(mockInsert).toHaveBeenCalledWith({
        review_id: mockReviewId,
        user_id: mockUserId,
        reason: 'spam',
        details: 'This review is clearly spam',
      });
    });

    // Test 2: Requires authentication
    it('should return 401 if user is not authenticated', async () => {
      const response = await request(app)
        .post(`/api/reviews/${mockReviewId}/report`)
        .send({
          reason: 'spam',
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Authentication required');
    });

    // Test 3: Validates reason field
    it('should validate reason field - accepts valid reasons', async () => {
      const validReasons = ['spam', 'inappropriate', 'fake', 'other'];

      for (const reason of validReasons) {
        jest.clearAllMocks();

        // Mock: Check for existing report (none found)
        const mockSelect1 = jest.fn().mockReturnThis();
        const mockEq1 = jest.fn().mockReturnThis();
        const mockEq2 = jest.fn().mockReturnThis();
        const mockSingle1 = jest.fn().mockResolvedValue({ data: null, error: null });

        // Mock: Get review to check owner
        const mockSelect2 = jest.fn().mockReturnThis();
        const mockEq3 = jest.fn().mockReturnThis();
        const mockSingle2 = jest.fn().mockResolvedValue({
          data: { user_id: mockReviewOwnerId },
          error: null,
        });

        // Mock: Insert report
        const mockInsert = jest.fn().mockResolvedValue({ data: {}, error: null });

        (supabaseAdmin.from as jest.Mock)
          .mockReturnValueOnce({
            select: mockSelect1.mockReturnValue({
              eq: mockEq1.mockReturnValue({
                eq: mockEq2.mockReturnValue({
                  single: mockSingle1,
                }),
              }),
            }),
          })
          .mockReturnValueOnce({
            select: mockSelect2.mockReturnValue({
              eq: mockEq3.mockReturnValue({
                single: mockSingle2,
              }),
            }),
          })
          .mockReturnValueOnce({
            insert: mockInsert,
          });

        const response = await request(app)
          .post(`/api/reviews/${mockReviewId}/report`)
          .set('Authorization', `Bearer ${mockUserId}`)
          .send({ reason });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      }
    });

    it('should reject invalid reason field', async () => {
      const response = await request(app)
        .post(`/api/reviews/${mockReviewId}/report`)
        .set('Authorization', `Bearer ${mockUserId}`)
        .send({
          reason: 'invalid_reason',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid request body');
    });

    it('should reject missing reason field', async () => {
      const response = await request(app)
        .post(`/api/reviews/${mockReviewId}/report`)
        .set('Authorization', `Bearer ${mockUserId}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    // Test 4: Cannot report own review
    it('should prevent user from reporting their own review', async () => {
      // Mock: Check for existing report (none found)
      const mockSelect1 = jest.fn().mockReturnThis();
      const mockEq1 = jest.fn().mockReturnThis();
      const mockEq2 = jest.fn().mockReturnThis();
      const mockSingle1 = jest.fn().mockResolvedValue({ data: null, error: null });

      // Mock: Get review to check owner - user owns the review
      const mockSelect2 = jest.fn().mockReturnThis();
      const mockEq3 = jest.fn().mockReturnThis();
      const mockSingle2 = jest.fn().mockResolvedValue({
        data: { user_id: mockUserId },
        error: null,
      });

      (supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce({
          select: mockSelect1.mockReturnValue({
            eq: mockEq1.mockReturnValue({
              eq: mockEq2.mockReturnValue({
                single: mockSingle1,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: mockSelect2.mockReturnValue({
            eq: mockEq3.mockReturnValue({
              single: mockSingle2,
            }),
          }),
        });

      const response = await request(app)
        .post(`/api/reviews/${mockReviewId}/report`)
        .set('Authorization', `Bearer ${mockUserId}`)
        .send({
          reason: 'spam',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('You cannot report your own review');
    });

    // Test 5: 404 for non-existent review
    it('should return 400 for non-existent review', async () => {
      // Mock: Check for existing report (none found)
      const mockSelect1 = jest.fn().mockReturnThis();
      const mockEq1 = jest.fn().mockReturnThis();
      const mockEq2 = jest.fn().mockReturnThis();
      const mockSingle1 = jest.fn().mockResolvedValue({ data: null, error: null });

      // Mock: Get review - not found
      const mockSelect2 = jest.fn().mockReturnThis();
      const mockEq3 = jest.fn().mockReturnThis();
      const mockSingle2 = jest.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      (supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce({
          select: mockSelect1.mockReturnValue({
            eq: mockEq1.mockReturnValue({
              eq: mockEq2.mockReturnValue({
                single: mockSingle1,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: mockSelect2.mockReturnValue({
            eq: mockEq3.mockReturnValue({
              single: mockSingle2,
            }),
          }),
        });

      const response = await request(app)
        .post(`/api/reviews/${mockReviewId}/report`)
        .set('Authorization', `Bearer ${mockUserId}`)
        .send({
          reason: 'spam',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Review not found');
    });

    // Test 6: Multiple reports from same user blocked (429)
    it('should prevent duplicate reports from same user', async () => {
      // Mock: Check for existing report (found)
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq1 = jest.fn().mockReturnThis();
      const mockEq2 = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: { id: 'existing-report-id' },
        error: null,
      });

      (supabaseAdmin.from as jest.Mock).mockReturnValueOnce({
        select: mockSelect.mockReturnValue({
          eq: mockEq1.mockReturnValue({
            eq: mockEq2.mockReturnValue({
              single: mockSingle,
            }),
          }),
        }),
      });

      const response = await request(app)
        .post(`/api/reviews/${mockReviewId}/report`)
        .set('Authorization', `Bearer ${mockUserId}`)
        .send({
          reason: 'spam',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('You have already reported this review');
    });

    // Test 7: Report stored in review_reports table
    it('should store report in review_reports table with correct fields', async () => {
      // Mock: Check for existing report (none found)
      const mockSelect1 = jest.fn().mockReturnThis();
      const mockEq1 = jest.fn().mockReturnThis();
      const mockEq2 = jest.fn().mockReturnThis();
      const mockSingle1 = jest.fn().mockResolvedValue({ data: null, error: null });

      // Mock: Get review to check owner
      const mockSelect2 = jest.fn().mockReturnThis();
      const mockEq3 = jest.fn().mockReturnThis();
      const mockSingle2 = jest.fn().mockResolvedValue({
        data: { user_id: mockReviewOwnerId },
        error: null,
      });

      // Mock: Insert report
      const mockInsert = jest.fn().mockResolvedValue({ data: {}, error: null });

      (supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce({
          select: mockSelect1.mockReturnValue({
            eq: mockEq1.mockReturnValue({
              eq: mockEq2.mockReturnValue({
                single: mockSingle1,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: mockSelect2.mockReturnValue({
            eq: mockEq3.mockReturnValue({
              single: mockSingle2,
            }),
          }),
        })
        .mockReturnValueOnce({
          insert: mockInsert,
        });

      const reportData = {
        reason: 'inappropriate',
        details: 'Contains offensive language',
      };

      await request(app)
        .post(`/api/reviews/${mockReviewId}/report`)
        .set('Authorization', `Bearer ${mockUserId}`)
        .send(reportData);

      // Verify insert was called with correct table
      expect(supabaseAdmin.from).toHaveBeenCalledWith('review_reports');

      // Verify insert was called with correct data
      expect(mockInsert).toHaveBeenCalledWith({
        review_id: mockReviewId,
        user_id: mockUserId,
        reason: reportData.reason,
        details: reportData.details,
      });
    });

    // Test 8: Optional details field
    it('should accept report without details field', async () => {
      // Mock: Check for existing report (none found)
      const mockSelect1 = jest.fn().mockReturnThis();
      const mockEq1 = jest.fn().mockReturnThis();
      const mockEq2 = jest.fn().mockReturnThis();
      const mockSingle1 = jest.fn().mockResolvedValue({ data: null, error: null });

      // Mock: Get review to check owner
      const mockSelect2 = jest.fn().mockReturnThis();
      const mockEq3 = jest.fn().mockReturnThis();
      const mockSingle2 = jest.fn().mockResolvedValue({
        data: { user_id: mockReviewOwnerId },
        error: null,
      });

      // Mock: Insert report
      const mockInsert = jest.fn().mockResolvedValue({ data: {}, error: null });

      (supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce({
          select: mockSelect1.mockReturnValue({
            eq: mockEq1.mockReturnValue({
              eq: mockEq2.mockReturnValue({
                single: mockSingle1,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: mockSelect2.mockReturnValue({
            eq: mockEq3.mockReturnValue({
              single: mockSingle2,
            }),
          }),
        })
        .mockReturnValueOnce({
          insert: mockInsert,
        });

      const response = await request(app)
        .post(`/api/reviews/${mockReviewId}/report`)
        .set('Authorization', `Bearer ${mockUserId}`)
        .send({
          reason: 'fake',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify insert was called with undefined details
      expect(mockInsert).toHaveBeenCalledWith({
        review_id: mockReviewId,
        user_id: mockUserId,
        reason: 'fake',
        details: undefined,
      });
    });

    // Test 9: Details field validation (max length)
    it('should validate details field maximum length', async () => {
      const longDetails = 'a'.repeat(501); // Exceeds 500 character limit

      const response = await request(app)
        .post(`/api/reviews/${mockReviewId}/report`)
        .set('Authorization', `Bearer ${mockUserId}`)
        .send({
          reason: 'spam',
          details: longDetails,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid request body');
    });

    it('should accept details at maximum length', async () => {
      const maxDetails = 'a'.repeat(500); // Exactly 500 characters

      // Mock: Check for existing report (none found)
      const mockSelect1 = jest.fn().mockReturnThis();
      const mockEq1 = jest.fn().mockReturnThis();
      const mockEq2 = jest.fn().mockReturnThis();
      const mockSingle1 = jest.fn().mockResolvedValue({ data: null, error: null });

      // Mock: Get review to check owner
      const mockSelect2 = jest.fn().mockReturnThis();
      const mockEq3 = jest.fn().mockReturnThis();
      const mockSingle2 = jest.fn().mockResolvedValue({
        data: { user_id: mockReviewOwnerId },
        error: null,
      });

      // Mock: Insert report
      const mockInsert = jest.fn().mockResolvedValue({ data: {}, error: null });

      (supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce({
          select: mockSelect1.mockReturnValue({
            eq: mockEq1.mockReturnValue({
              eq: mockEq2.mockReturnValue({
                single: mockSingle1,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: mockSelect2.mockReturnValue({
            eq: mockEq3.mockReturnValue({
              single: mockSingle2,
            }),
          }),
        })
        .mockReturnValueOnce({
          insert: mockInsert,
        });

      const response = await request(app)
        .post(`/api/reviews/${mockReviewId}/report`)
        .set('Authorization', `Bearer ${mockUserId}`)
        .send({
          reason: 'spam',
          details: maxDetails,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    // Test 10: Database error handling
    it('should handle database errors gracefully', async () => {
      // Mock: Check for existing report fails
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq1 = jest.fn().mockReturnThis();
      const mockEq2 = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database connection error' },
      });

      (supabaseAdmin.from as jest.Mock).mockReturnValueOnce({
        select: mockSelect.mockReturnValue({
          eq: mockEq1.mockReturnValue({
            eq: mockEq2.mockReturnValue({
              single: mockSingle,
            }),
          }),
        }),
      });

      const response = await request(app)
        .post(`/api/reviews/${mockReviewId}/report`)
        .set('Authorization', `Bearer ${mockUserId}`)
        .send({
          reason: 'spam',
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to report review');
    });
  });
});
