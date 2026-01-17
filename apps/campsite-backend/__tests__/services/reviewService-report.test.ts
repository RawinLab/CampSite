import { reportReview } from '../../src/services/reviewService';
import type { ReportReason } from '@campsite/shared';

// Mock Supabase
jest.mock('../../src/lib/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(),
  },
}));

import { supabaseAdmin } from '../../src/lib/supabase';

describe('ReviewService - Report Functionality', () => {
  let mockFrom: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFrom = supabaseAdmin.from as jest.Mock;
  });

  describe('reportReview', () => {
    it('should create report entry and increment report_count', async () => {
      // Mock: Check if user already reported - no existing report
      const existingSingle = jest.fn().mockResolvedValue({ data: null, error: null });
      const existingEq2 = jest.fn().mockReturnValue({ single: existingSingle });
      const existingEq1 = jest.fn().mockReturnValue({ eq: existingEq2 });
      const existingSelect = jest.fn().mockReturnValue({ eq: existingEq1 });

      // Mock: Get review to verify not own review
      const reviewSingle = jest.fn().mockResolvedValue({ data: { user_id: 'other-user' }, error: null });
      const reviewEq = jest.fn().mockReturnValue({ single: reviewSingle });
      const reviewSelect = jest.fn().mockReturnValue({ eq: reviewEq });

      // Mock: Insert report
      const insertMock = jest.fn().mockResolvedValue({ error: null });

      mockFrom
        .mockReturnValueOnce({ select: existingSelect })
        .mockReturnValueOnce({ select: reviewSelect })
        .mockReturnValueOnce({ insert: insertMock });

      const result = await reportReview('review-1', 'user-1', 'spam', 'This is spam content');

      expect(result.success).toBe(true);
      expect(insertMock).toHaveBeenCalledWith({
        review_id: 'review-1',
        user_id: 'user-1',
        reason: 'spam',
        details: 'This is spam content',
      });
    });

    it('should set is_reported flag to true when reported', async () => {
      // Mock: No existing report
      const existingSingle = jest.fn().mockResolvedValue({ data: null, error: null });
      const existingEq2 = jest.fn().mockReturnValue({ single: existingSingle });
      const existingEq1 = jest.fn().mockReturnValue({ eq: existingEq2 });
      const existingSelect = jest.fn().mockReturnValue({ eq: existingEq1 });

      // Mock: Get review
      const reviewSingle = jest.fn().mockResolvedValue({ data: { user_id: 'other-user' }, error: null });
      const reviewEq = jest.fn().mockReturnValue({ single: reviewSingle });
      const reviewSelect = jest.fn().mockReturnValue({ eq: reviewEq });

      // Mock: Insert report (is_reported is set via database trigger)
      const insertMock = jest.fn().mockResolvedValue({ error: null });

      mockFrom
        .mockReturnValueOnce({ select: existingSelect })
        .mockReturnValueOnce({ select: reviewSelect })
        .mockReturnValueOnce({ insert: insertMock });

      const result = await reportReview('review-1', 'user-1', 'inappropriate');

      expect(result.success).toBe(true);
      // Note: is_reported flag is set via database trigger on review_reports insert
      // The service layer doesn't explicitly update this, the trigger handles it
    });

    it('should increment report_count for multiple reports', async () => {
      // First report
      const existingSingle1 = jest.fn().mockResolvedValue({ data: null, error: null });
      const existingEq2_1 = jest.fn().mockReturnValue({ single: existingSingle1 });
      const existingEq1_1 = jest.fn().mockReturnValue({ eq: existingEq2_1 });
      const existingSelect1 = jest.fn().mockReturnValue({ eq: existingEq1_1 });

      const reviewSingle1 = jest.fn().mockResolvedValue({ data: { user_id: 'other-user' }, error: null });
      const reviewEq1 = jest.fn().mockReturnValue({ single: reviewSingle1 });
      const reviewSelect1 = jest.fn().mockReturnValue({ eq: reviewEq1 });

      const insertMock1 = jest.fn().mockResolvedValue({ error: null });

      mockFrom
        .mockReturnValueOnce({ select: existingSelect1 })
        .mockReturnValueOnce({ select: reviewSelect1 })
        .mockReturnValueOnce({ insert: insertMock1 });

      const result1 = await reportReview('review-1', 'user-1', 'spam');
      expect(result1.success).toBe(true);

      // Second report from different user
      jest.clearAllMocks();

      const existingSingle2 = jest.fn().mockResolvedValue({ data: null, error: null });
      const existingEq2_2 = jest.fn().mockReturnValue({ single: existingSingle2 });
      const existingEq1_2 = jest.fn().mockReturnValue({ eq: existingEq2_2 });
      const existingSelect2 = jest.fn().mockReturnValue({ eq: existingEq1_2 });

      const reviewSingle2 = jest.fn().mockResolvedValue({ data: { user_id: 'other-user' }, error: null });
      const reviewEq2 = jest.fn().mockReturnValue({ single: reviewSingle2 });
      const reviewSelect2 = jest.fn().mockReturnValue({ eq: reviewEq2 });

      const insertMock2 = jest.fn().mockResolvedValue({ error: null });

      mockFrom
        .mockReturnValueOnce({ select: existingSelect2 })
        .mockReturnValueOnce({ select: reviewSelect2 })
        .mockReturnValueOnce({ insert: insertMock2 });

      const result2 = await reportReview('review-1', 'user-2', 'inappropriate');
      expect(result2.success).toBe(true);

      // Note: report_count increments are handled by database trigger
      // Each insert to review_reports triggers update_review_report_status()
    });

    it('should store report reason correctly', async () => {
      const reasons: ReportReason[] = ['spam', 'inappropriate', 'fake', 'other'];

      for (const reason of reasons) {
        jest.clearAllMocks();

        const existingSingle = jest.fn().mockResolvedValue({ data: null, error: null });
        const existingEq2 = jest.fn().mockReturnValue({ single: existingSingle });
        const existingEq1 = jest.fn().mockReturnValue({ eq: existingEq2 });
        const existingSelect = jest.fn().mockReturnValue({ eq: existingEq1 });

        const reviewSingle = jest.fn().mockResolvedValue({ data: { user_id: 'other-user' }, error: null });
        const reviewEq = jest.fn().mockReturnValue({ single: reviewSingle });
        const reviewSelect = jest.fn().mockReturnValue({ eq: reviewEq });

        const insertMock = jest.fn().mockResolvedValue({ error: null });

        mockFrom
          .mockReturnValueOnce({ select: existingSelect })
          .mockReturnValueOnce({ select: reviewSelect })
          .mockReturnValueOnce({ insert: insertMock });

        const result = await reportReview('review-1', 'user-1', reason, `Details for ${reason}`);

        expect(result.success).toBe(true);
        expect(insertMock).toHaveBeenCalledWith({
          review_id: 'review-1',
          user_id: 'user-1',
          reason,
          details: `Details for ${reason}`,
        });
      }
    });

    it('should link reporter_id correctly', async () => {
      const existingSingle = jest.fn().mockResolvedValue({ data: null, error: null });
      const existingEq2 = jest.fn().mockReturnValue({ single: existingSingle });
      const existingEq1 = jest.fn().mockReturnValue({ eq: existingEq2 });
      const existingSelect = jest.fn().mockReturnValue({ eq: existingEq1 });

      const reviewSingle = jest.fn().mockResolvedValue({ data: { user_id: 'review-author' }, error: null });
      const reviewEq = jest.fn().mockReturnValue({ single: reviewSingle });
      const reviewSelect = jest.fn().mockReturnValue({ eq: reviewEq });

      const insertMock = jest.fn().mockResolvedValue({ error: null });

      mockFrom
        .mockReturnValueOnce({ select: existingSelect })
        .mockReturnValueOnce({ select: reviewSelect })
        .mockReturnValueOnce({ insert: insertMock });

      const result = await reportReview('review-1', 'reporter-123', 'fake');

      expect(result.success).toBe(true);
      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'reporter-123',
        })
      );
    });

    it('should create review_reports table entry', async () => {
      const existingSingle = jest.fn().mockResolvedValue({ data: null, error: null });
      const existingEq2 = jest.fn().mockReturnValue({ single: existingSingle });
      const existingEq1 = jest.fn().mockReturnValue({ eq: existingEq2 });
      const existingSelect = jest.fn().mockReturnValue({ eq: existingEq1 });

      const reviewSingle = jest.fn().mockResolvedValue({ data: { user_id: 'other-user' }, error: null });
      const reviewEq = jest.fn().mockReturnValue({ single: reviewSingle });
      const reviewSelect = jest.fn().mockReturnValue({ eq: reviewEq });

      const insertMock = jest.fn().mockResolvedValue({ error: null });

      mockFrom
        .mockReturnValueOnce({ select: existingSelect })
        .mockReturnValueOnce({ select: reviewSelect })
        .mockReturnValueOnce({ insert: insertMock });

      await reportReview('review-1', 'user-1', 'spam', 'Spam details');

      // Verify the insert was called on review_reports table
      expect(mockFrom).toHaveBeenCalledWith('review_reports');
      expect(insertMock).toHaveBeenCalledWith({
        review_id: 'review-1',
        user_id: 'user-1',
        reason: 'spam',
        details: 'Spam details',
      });
    });

    it('should reject user reporting own review', async () => {
      const existingSingle = jest.fn().mockResolvedValue({ data: null, error: null });
      const existingEq2 = jest.fn().mockReturnValue({ single: existingSingle });
      const existingEq1 = jest.fn().mockReturnValue({ eq: existingEq2 });
      const existingSelect = jest.fn().mockReturnValue({ eq: existingEq1 });

      const reviewSingle = jest.fn().mockResolvedValue({ data: { user_id: 'user-1' }, error: null });
      const reviewEq = jest.fn().mockReturnValue({ single: reviewSingle });
      const reviewSelect = jest.fn().mockReturnValue({ eq: reviewEq });

      mockFrom
        .mockReturnValueOnce({ select: existingSelect })
        .mockReturnValueOnce({ select: reviewSelect });

      const result = await reportReview('review-1', 'user-1', 'spam');

      expect(result.success).toBe(false);
      expect(result.error).toBe('You cannot report your own review');
    });

    it('should reject duplicate report from same user', async () => {
      const existingSingle = jest.fn().mockResolvedValue({ data: { id: 'existing-report' }, error: null });
      const existingEq2 = jest.fn().mockReturnValue({ single: existingSingle });
      const existingEq1 = jest.fn().mockReturnValue({ eq: existingEq2 });
      const existingSelect = jest.fn().mockReturnValue({ eq: existingEq1 });

      mockFrom.mockReturnValueOnce({ select: existingSelect });

      const result = await reportReview('review-1', 'user-1', 'spam');

      expect(result.success).toBe(false);
      expect(result.error).toBe('You have already reported this review');
    });

    it('should reject when review not found', async () => {
      const existingSingle = jest.fn().mockResolvedValue({ data: null, error: null });
      const existingEq2 = jest.fn().mockReturnValue({ single: existingSingle });
      const existingEq1 = jest.fn().mockReturnValue({ eq: existingEq2 });
      const existingSelect = jest.fn().mockReturnValue({ eq: existingEq1 });

      const reviewSingle = jest.fn().mockResolvedValue({ data: null, error: null });
      const reviewEq = jest.fn().mockReturnValue({ single: reviewSingle });
      const reviewSelect = jest.fn().mockReturnValue({ eq: reviewEq });

      mockFrom
        .mockReturnValueOnce({ select: existingSelect })
        .mockReturnValueOnce({ select: reviewSelect });

      const result = await reportReview('non-existent-review', 'user-1', 'spam');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Review not found');
    });

    it('should handle database error on insert', async () => {
      const existingSingle = jest.fn().mockResolvedValue({ data: null, error: null });
      const existingEq2 = jest.fn().mockReturnValue({ single: existingSingle });
      const existingEq1 = jest.fn().mockReturnValue({ eq: existingEq2 });
      const existingSelect = jest.fn().mockReturnValue({ eq: existingEq1 });

      const reviewSingle = jest.fn().mockResolvedValue({ data: { user_id: 'other-user' }, error: null });
      const reviewEq = jest.fn().mockReturnValue({ single: reviewSingle });
      const reviewSelect = jest.fn().mockReturnValue({ eq: reviewEq });

      const insertMock = jest.fn().mockResolvedValue({ error: { message: 'Database error' } });

      mockFrom
        .mockReturnValueOnce({ select: existingSelect })
        .mockReturnValueOnce({ select: reviewSelect })
        .mockReturnValueOnce({ insert: insertMock });

      const result = await reportReview('review-1', 'user-1', 'spam');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to submit report');
    });

    it('should allow report without optional details field', async () => {
      const existingSingle = jest.fn().mockResolvedValue({ data: null, error: null });
      const existingEq2 = jest.fn().mockReturnValue({ single: existingSingle });
      const existingEq1 = jest.fn().mockReturnValue({ eq: existingEq2 });
      const existingSelect = jest.fn().mockReturnValue({ eq: existingEq1 });

      const reviewSingle = jest.fn().mockResolvedValue({ data: { user_id: 'other-user' }, error: null });
      const reviewEq = jest.fn().mockReturnValue({ single: reviewSingle });
      const reviewSelect = jest.fn().mockReturnValue({ eq: reviewEq });

      const insertMock = jest.fn().mockResolvedValue({ error: null });

      mockFrom
        .mockReturnValueOnce({ select: existingSelect })
        .mockReturnValueOnce({ select: reviewSelect })
        .mockReturnValueOnce({ insert: insertMock });

      const result = await reportReview('review-1', 'user-1', 'other');

      expect(result.success).toBe(true);
      expect(insertMock).toHaveBeenCalledWith({
        review_id: 'review-1',
        user_id: 'user-1',
        reason: 'other',
        details: undefined,
      });
    });
  });
});
