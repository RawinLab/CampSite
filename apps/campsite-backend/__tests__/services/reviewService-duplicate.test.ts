import { createReview } from '../../src/services/reviewService';
import type { CreateReviewInput, ReviewerType } from '@campsite/shared';

// Mock Supabase
jest.mock('../../src/lib/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(),
  },
}));

import { supabaseAdmin } from '../../src/lib/supabase';

describe('ReviewService - Duplicate Review Prevention', () => {
  let mockFrom: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFrom = supabaseAdmin.from as jest.Mock;
  });

  const validInput: CreateReviewInput = {
    campsite_id: 'campsite-1',
    rating_overall: 5,
    rating_cleanliness: 5,
    reviewer_type: 'family' as ReviewerType,
    content: 'Great campsite',
  };

  describe('Duplicate prevention', () => {
    it('should throw error when user tries to submit second review for same campsite', async () => {
      // Mock finding existing review
      const existingSingle = jest.fn().mockResolvedValue({
        data: { id: 'existing-review-id' },
        error: null
      });
      const existingEq2 = jest.fn().mockReturnValue({ single: existingSingle });
      const existingEq1 = jest.fn().mockReturnValue({ eq: existingEq2 });
      const existingSelect = jest.fn().mockReturnValue({ eq: existingEq1 });

      mockFrom.mockReturnValueOnce({ select: existingSelect });

      const result = await createReview(validInput, 'user-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('You have already reviewed this campsite');
      expect(result.review).toBeUndefined();
    });

    it('should allow user to review different campsites', async () => {
      const mockReview = {
        id: 'review-2',
        campsite_id: 'campsite-2',
        user_id: 'user-1',
        rating_overall: 4,
        rating_cleanliness: 4,
        reviewer_type: 'family' as ReviewerType,
        content: 'Another great campsite',
        helpful_count: 0,
        is_reported: false,
        report_count: 0,
        is_hidden: false,
        hidden_reason: null,
        hidden_at: null,
        hidden_by: null,
        owner_response: null,
        owner_response_at: null,
        created_at: '2024-01-15',
        updated_at: '2024-01-15',
        reviewer: { full_name: 'John Doe', avatar_url: null },
      };

      // No existing review for campsite-2
      const existingSingle = jest.fn().mockResolvedValue({ data: null, error: null });
      const existingEq2 = jest.fn().mockReturnValue({ single: existingSingle });
      const existingEq1 = jest.fn().mockReturnValue({ eq: existingEq2 });
      const existingSelect = jest.fn().mockReturnValue({ eq: existingEq1 });

      // Campsite exists and is approved
      const campsiteSingle = jest.fn().mockResolvedValue({
        data: { id: 'campsite-2', status: 'approved' },
        error: null
      });
      const campsiteEq = jest.fn().mockReturnValue({ single: campsiteSingle });
      const campsiteSelect = jest.fn().mockReturnValue({ eq: campsiteEq });

      // Insert review
      const insertSingle = jest.fn().mockResolvedValue({ data: mockReview, error: null });
      const insertSelect = jest.fn().mockReturnValue({ single: insertSingle });
      const insertInsert = jest.fn().mockReturnValue({ select: insertSelect });

      // Fetch complete review
      const completeSingle = jest.fn().mockResolvedValue({
        data: { ...mockReview, photos: [] },
        error: null
      });
      const completeEq = jest.fn().mockReturnValue({ single: completeSingle });
      const completeSelect = jest.fn().mockReturnValue({ eq: completeEq });

      mockFrom
        .mockReturnValueOnce({ select: existingSelect })
        .mockReturnValueOnce({ select: campsiteSelect })
        .mockReturnValueOnce({ insert: insertInsert })
        .mockReturnValueOnce({ select: completeSelect });

      const input: CreateReviewInput = {
        campsite_id: 'campsite-2',
        rating_overall: 4,
        rating_cleanliness: 4,
        reviewer_type: 'family',
        content: 'Another great campsite',
      };

      const result = await createReview(input, 'user-1');

      expect(result.success).toBe(true);
      expect(result.review?.id).toBe('review-2');
      expect(result.review?.campsite_id).toBe('campsite-2');
    });

    it('should allow different users to review same campsite', async () => {
      const mockReview = {
        id: 'review-3',
        campsite_id: 'campsite-1',
        user_id: 'user-2',
        rating_overall: 4,
        rating_cleanliness: 4,
        reviewer_type: 'couple' as ReviewerType,
        content: 'Nice place',
        helpful_count: 0,
        is_reported: false,
        report_count: 0,
        is_hidden: false,
        hidden_reason: null,
        hidden_at: null,
        hidden_by: null,
        owner_response: null,
        owner_response_at: null,
        created_at: '2024-01-16',
        updated_at: '2024-01-16',
        reviewer: { full_name: 'Jane Smith', avatar_url: null },
      };

      // No existing review from user-2 for campsite-1
      const existingSingle = jest.fn().mockResolvedValue({ data: null, error: null });
      const existingEq2 = jest.fn().mockReturnValue({ single: existingSingle });
      const existingEq1 = jest.fn().mockReturnValue({ eq: existingEq2 });
      const existingSelect = jest.fn().mockReturnValue({ eq: existingEq1 });

      // Campsite exists and is approved
      const campsiteSingle = jest.fn().mockResolvedValue({
        data: { id: 'campsite-1', status: 'approved' },
        error: null
      });
      const campsiteEq = jest.fn().mockReturnValue({ single: campsiteSingle });
      const campsiteSelect = jest.fn().mockReturnValue({ eq: campsiteEq });

      // Insert review
      const insertSingle = jest.fn().mockResolvedValue({ data: mockReview, error: null });
      const insertSelect = jest.fn().mockReturnValue({ single: insertSingle });
      const insertInsert = jest.fn().mockReturnValue({ select: insertSelect });

      // Fetch complete review
      const completeSingle = jest.fn().mockResolvedValue({
        data: { ...mockReview, photos: [] },
        error: null
      });
      const completeEq = jest.fn().mockReturnValue({ single: completeSingle });
      const completeSelect = jest.fn().mockReturnValue({ eq: completeEq });

      mockFrom
        .mockReturnValueOnce({ select: existingSelect })
        .mockReturnValueOnce({ select: campsiteSelect })
        .mockReturnValueOnce({ insert: insertInsert })
        .mockReturnValueOnce({ select: completeSelect });

      const input: CreateReviewInput = {
        campsite_id: 'campsite-1',
        rating_overall: 4,
        rating_cleanliness: 4,
        reviewer_type: 'couple',
        content: 'Nice place',
      };

      const result = await createReview(input, 'user-2');

      expect(result.success).toBe(true);
      expect(result.review?.id).toBe('review-3');
      expect(result.review?.user_id).toBe('user-2');
    });

    it('should return proper error message when duplicate detected', async () => {
      const existingSingle = jest.fn().mockResolvedValue({
        data: { id: 'existing-review' },
        error: null
      });
      const existingEq2 = jest.fn().mockReturnValue({ single: existingSingle });
      const existingEq1 = jest.fn().mockReturnValue({ eq: existingEq2 });
      const existingSelect = jest.fn().mockReturnValue({ eq: existingEq1 });

      mockFrom.mockReturnValueOnce({ select: existingSelect });

      const result = await createReview(validInput, 'user-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('You have already reviewed this campsite');
      expect(typeof result.error).toBe('string');
    });

    it('should ensure first review still exists after duplicate attempt', async () => {
      // First call: check for existing - returns existing review
      const existingSingle = jest.fn().mockResolvedValue({
        data: { id: 'original-review-id' },
        error: null
      });
      const existingEq2 = jest.fn().mockReturnValue({ single: existingSingle });
      const existingEq1 = jest.fn().mockReturnValue({ eq: existingEq2 });
      const existingSelect = jest.fn().mockReturnValue({ eq: existingEq1 });

      mockFrom.mockReturnValueOnce({ select: existingSelect });

      const result = await createReview(validInput, 'user-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('You have already reviewed this campsite');

      // Verify that existing review check was called with correct parameters
      expect(mockFrom).toHaveBeenCalledWith('reviews');
      expect(existingSelect).toHaveBeenCalledWith('id');
      expect(existingEq1).toHaveBeenCalledWith('campsite_id', validInput.campsite_id);
      expect(existingEq2).toHaveBeenCalledWith('user_id', 'user-1');

      // No insert should have been attempted
      expect(mockFrom).toHaveBeenCalledTimes(1);
    });
  });
});
