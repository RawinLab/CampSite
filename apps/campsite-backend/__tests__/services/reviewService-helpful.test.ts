import { toggleHelpfulVote } from '../../src/services/reviewService';

// Mock Supabase
jest.mock('../../src/lib/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(),
  },
}));

import { supabaseAdmin } from '../../src/lib/supabase';

describe('ReviewService - Helpful Voting', () => {
  let mockFrom: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFrom = supabaseAdmin.from as jest.Mock;
  });

  describe('toggleHelpfulVote', () => {
    it('should add helpful vote and increment helpful_count when user has not voted', async () => {
      // Mock: No existing vote
      const existingSingle = jest.fn().mockResolvedValue({ data: null, error: null });
      const existingEq2 = jest.fn().mockReturnValue({ single: existingSingle });
      const existingEq1 = jest.fn().mockReturnValue({ eq: existingEq2 });
      const existingSelect = jest.fn().mockReturnValue({ eq: existingEq1 });

      // Mock: Insert vote
      const insertMock = jest.fn().mockResolvedValue({ data: null, error: null });

      // Mock: Get updated helpful_count
      const reviewSingle = jest.fn().mockResolvedValue({ data: { helpful_count: 1 }, error: null });
      const reviewEq = jest.fn().mockReturnValue({ single: reviewSingle });
      const reviewSelect = jest.fn().mockReturnValue({ eq: reviewEq });

      mockFrom
        .mockReturnValueOnce({ select: existingSelect })
        .mockReturnValueOnce({ insert: insertMock })
        .mockReturnValueOnce({ select: reviewSelect });

      const result = await toggleHelpfulVote('review-1', 'user-1');

      expect(result.success).toBe(true);
      expect(result.voted).toBe(true);
      expect(result.helpfulCount).toBe(1);
      expect(insertMock).toHaveBeenCalledWith({
        review_id: 'review-1',
        user_id: 'user-1',
      });
    });

    it('should remove helpful vote and decrement helpful_count when user has already voted', async () => {
      // Mock: Existing vote found
      const existingSingle = jest.fn().mockResolvedValue({ data: { review_id: 'review-1' }, error: null });
      const existingEq2 = jest.fn().mockReturnValue({ single: existingSingle });
      const existingEq1 = jest.fn().mockReturnValue({ eq: existingEq2 });
      const existingSelect = jest.fn().mockReturnValue({ eq: existingEq1 });

      // Mock: Delete vote
      const deleteEq2 = jest.fn().mockResolvedValue({ error: null });
      const deleteEq1 = jest.fn().mockReturnValue({ eq: deleteEq2 });
      const deleteMock = jest.fn().mockReturnValue({ eq: deleteEq1 });

      // Mock: Get updated helpful_count (decremented)
      const reviewSingle = jest.fn().mockResolvedValue({ data: { helpful_count: 0 }, error: null });
      const reviewEq = jest.fn().mockReturnValue({ single: reviewSingle });
      const reviewSelect = jest.fn().mockReturnValue({ eq: reviewEq });

      mockFrom
        .mockReturnValueOnce({ select: existingSelect })
        .mockReturnValueOnce({ delete: deleteMock })
        .mockReturnValueOnce({ select: reviewSelect });

      const result = await toggleHelpfulVote('review-1', 'user-1');

      expect(result.success).toBe(true);
      expect(result.voted).toBe(false);
      expect(result.helpfulCount).toBe(0);
      expect(deleteMock).toHaveBeenCalled();
      expect(deleteEq1).toHaveBeenCalledWith('review_id', 'review-1');
      expect(deleteEq2).toHaveBeenCalledWith('user_id', 'user-1');
    });

    it('should toggle vote: voting again removes the vote', async () => {
      // First call: Add vote
      const existingSingle1 = jest.fn().mockResolvedValue({ data: null, error: null });
      const existingEq2_1 = jest.fn().mockReturnValue({ single: existingSingle1 });
      const existingEq1_1 = jest.fn().mockReturnValue({ eq: existingEq2_1 });
      const existingSelect1 = jest.fn().mockReturnValue({ eq: existingEq1_1 });

      const insertMock = jest.fn().mockResolvedValue({ data: null, error: null });

      const reviewSingle1 = jest.fn().mockResolvedValue({ data: { helpful_count: 1 }, error: null });
      const reviewEq1 = jest.fn().mockReturnValue({ single: reviewSingle1 });
      const reviewSelect1 = jest.fn().mockReturnValue({ eq: reviewEq1 });

      mockFrom
        .mockReturnValueOnce({ select: existingSelect1 })
        .mockReturnValueOnce({ insert: insertMock })
        .mockReturnValueOnce({ select: reviewSelect1 });

      const result1 = await toggleHelpfulVote('review-1', 'user-1');
      expect(result1.voted).toBe(true);
      expect(result1.helpfulCount).toBe(1);

      // Reset mocks for second call
      jest.clearAllMocks();

      // Second call: Remove vote (toggle behavior)
      const existingSingle2 = jest.fn().mockResolvedValue({ data: { review_id: 'review-1' }, error: null });
      const existingEq2_2 = jest.fn().mockReturnValue({ single: existingSingle2 });
      const existingEq1_2 = jest.fn().mockReturnValue({ eq: existingEq2_2 });
      const existingSelect2 = jest.fn().mockReturnValue({ eq: existingEq1_2 });

      const deleteEq2 = jest.fn().mockResolvedValue({ error: null });
      const deleteEq1 = jest.fn().mockReturnValue({ eq: deleteEq2 });
      const deleteMock = jest.fn().mockReturnValue({ eq: deleteEq1 });

      const reviewSingle2 = jest.fn().mockResolvedValue({ data: { helpful_count: 0 }, error: null });
      const reviewEq2 = jest.fn().mockReturnValue({ single: reviewSingle2 });
      const reviewSelect2 = jest.fn().mockReturnValue({ eq: reviewEq2 });

      mockFrom
        .mockReturnValueOnce({ select: existingSelect2 })
        .mockReturnValueOnce({ delete: deleteMock })
        .mockReturnValueOnce({ select: reviewSelect2 });

      const result2 = await toggleHelpfulVote('review-1', 'user-1');
      expect(result2.voted).toBe(false);
      expect(result2.helpfulCount).toBe(0);
    });

    it('should ensure user can only have one vote per review', async () => {
      // Mock: No existing vote
      const existingSingle = jest.fn().mockResolvedValue({ data: null, error: null });
      const existingEq2 = jest.fn().mockReturnValue({ single: existingSingle });
      const existingEq1 = jest.fn().mockReturnValue({ eq: existingEq2 });
      const existingSelect = jest.fn().mockReturnValue({ eq: existingEq1 });

      // Mock: Insert vote
      const insertMock = jest.fn().mockResolvedValue({ data: null, error: null });

      // Mock: Get updated count
      const reviewSingle = jest.fn().mockResolvedValue({ data: { helpful_count: 3 }, error: null });
      const reviewEq = jest.fn().mockReturnValue({ single: reviewSingle });
      const reviewSelect = jest.fn().mockReturnValue({ eq: reviewEq });

      mockFrom
        .mockReturnValueOnce({ select: existingSelect })
        .mockReturnValueOnce({ insert: insertMock })
        .mockReturnValueOnce({ select: reviewSelect });

      await toggleHelpfulVote('review-1', 'user-1');

      // Verify that the check for existing vote is performed
      expect(existingSelect).toHaveBeenCalled();
      expect(existingEq1).toHaveBeenCalledWith('review_id', 'review-1');
      expect(existingEq2).toHaveBeenCalledWith('user_id', 'user-1');
    });

    it('should allow multiple users to vote on the same review', async () => {
      // User 1 votes
      const existingSingle1 = jest.fn().mockResolvedValue({ data: null, error: null });
      const existingEq2_1 = jest.fn().mockReturnValue({ single: existingSingle1 });
      const existingEq1_1 = jest.fn().mockReturnValue({ eq: existingEq2_1 });
      const existingSelect1 = jest.fn().mockReturnValue({ eq: existingEq1_1 });

      const insertMock1 = jest.fn().mockResolvedValue({ data: null, error: null });

      const reviewSingle1 = jest.fn().mockResolvedValue({ data: { helpful_count: 1 }, error: null });
      const reviewEq1 = jest.fn().mockReturnValue({ single: reviewSingle1 });
      const reviewSelect1 = jest.fn().mockReturnValue({ eq: reviewEq1 });

      mockFrom
        .mockReturnValueOnce({ select: existingSelect1 })
        .mockReturnValueOnce({ insert: insertMock1 })
        .mockReturnValueOnce({ select: reviewSelect1 });

      const result1 = await toggleHelpfulVote('review-1', 'user-1');
      expect(result1.helpfulCount).toBe(1);

      jest.clearAllMocks();

      // User 2 votes on same review
      const existingSingle2 = jest.fn().mockResolvedValue({ data: null, error: null });
      const existingEq2_2 = jest.fn().mockReturnValue({ single: existingSingle2 });
      const existingEq1_2 = jest.fn().mockReturnValue({ eq: existingEq2_2 });
      const existingSelect2 = jest.fn().mockReturnValue({ eq: existingEq1_2 });

      const insertMock2 = jest.fn().mockResolvedValue({ data: null, error: null });

      const reviewSingle2 = jest.fn().mockResolvedValue({ data: { helpful_count: 2 }, error: null });
      const reviewEq2 = jest.fn().mockReturnValue({ single: reviewSingle2 });
      const reviewSelect2 = jest.fn().mockReturnValue({ eq: reviewEq2 });

      mockFrom
        .mockReturnValueOnce({ select: existingSelect2 })
        .mockReturnValueOnce({ insert: insertMock2 })
        .mockReturnValueOnce({ select: reviewSelect2 });

      const result2 = await toggleHelpfulVote('review-1', 'user-2');
      expect(result2.helpfulCount).toBe(2);
    });

    it('should create entry in review_helpful table when voting', async () => {
      // Mock: No existing vote
      const existingSingle = jest.fn().mockResolvedValue({ data: null, error: null });
      const existingEq2 = jest.fn().mockReturnValue({ single: existingSingle });
      const existingEq1 = jest.fn().mockReturnValue({ eq: existingEq2 });
      const existingSelect = jest.fn().mockReturnValue({ eq: existingEq1 });

      // Mock: Insert vote - verify table entry creation
      const insertMock = jest.fn().mockResolvedValue({ data: null, error: null });

      // Mock: Get updated count
      const reviewSingle = jest.fn().mockResolvedValue({ data: { helpful_count: 1 }, error: null });
      const reviewEq = jest.fn().mockReturnValue({ single: reviewSingle });
      const reviewSelect = jest.fn().mockReturnValue({ eq: reviewEq });

      mockFrom
        .mockReturnValueOnce({ select: existingSelect })
        .mockReturnValueOnce({ insert: insertMock })
        .mockReturnValueOnce({ select: reviewSelect });

      await toggleHelpfulVote('review-1', 'user-1');

      // Verify insert was called with correct data
      expect(mockFrom).toHaveBeenCalledWith('review_helpful');
      expect(insertMock).toHaveBeenCalledWith({
        review_id: 'review-1',
        user_id: 'user-1',
      });
    });

    it('should delete entry from review_helpful table when unvoting', async () => {
      // Mock: Existing vote found
      const existingSingle = jest.fn().mockResolvedValue({ data: { review_id: 'review-1' }, error: null });
      const existingEq2 = jest.fn().mockReturnValue({ single: existingSingle });
      const existingEq1 = jest.fn().mockReturnValue({ eq: existingEq2 });
      const existingSelect = jest.fn().mockReturnValue({ eq: existingEq1 });

      // Mock: Delete vote - verify table entry deletion
      const deleteEq2 = jest.fn().mockResolvedValue({ error: null });
      const deleteEq1 = jest.fn().mockReturnValue({ eq: deleteEq2 });
      const deleteMock = jest.fn().mockReturnValue({ eq: deleteEq1 });

      // Mock: Get updated count
      const reviewSingle = jest.fn().mockResolvedValue({ data: { helpful_count: 2 }, error: null });
      const reviewEq = jest.fn().mockReturnValue({ single: reviewSingle });
      const reviewSelect = jest.fn().mockReturnValue({ eq: reviewEq });

      mockFrom
        .mockReturnValueOnce({ select: existingSelect })
        .mockReturnValueOnce({ delete: deleteMock })
        .mockReturnValueOnce({ select: reviewSelect });

      await toggleHelpfulVote('review-1', 'user-1');

      // Verify delete was called on correct table with correct filters
      expect(mockFrom).toHaveBeenCalledWith('review_helpful');
      expect(deleteMock).toHaveBeenCalled();
      expect(deleteEq1).toHaveBeenCalledWith('review_id', 'review-1');
      expect(deleteEq2).toHaveBeenCalledWith('user_id', 'user-1');
    });

    it('should handle database error when inserting vote', async () => {
      // Mock: No existing vote
      const existingSingle = jest.fn().mockResolvedValue({ data: null, error: null });
      const existingEq2 = jest.fn().mockReturnValue({ single: existingSingle });
      const existingEq1 = jest.fn().mockReturnValue({ eq: existingEq2 });
      const existingSelect = jest.fn().mockReturnValue({ eq: existingEq1 });

      // Mock: Insert vote fails
      const insertMock = jest.fn().mockResolvedValue({ error: { message: 'Insert failed' } });

      mockFrom
        .mockReturnValueOnce({ select: existingSelect })
        .mockReturnValueOnce({ insert: insertMock });

      const result = await toggleHelpfulVote('review-1', 'user-1');

      expect(result.success).toBe(false);
      expect(result.voted).toBe(false);
      expect(result.helpfulCount).toBe(0);
    });

    it('should handle database error when deleting vote', async () => {
      // Mock: Existing vote found
      const existingSingle = jest.fn().mockResolvedValue({ data: { review_id: 'review-1' }, error: null });
      const existingEq2 = jest.fn().mockReturnValue({ single: existingSingle });
      const existingEq1 = jest.fn().mockReturnValue({ eq: existingEq2 });
      const existingSelect = jest.fn().mockReturnValue({ eq: existingEq1 });

      // Mock: Delete vote fails
      const deleteEq2 = jest.fn().mockResolvedValue({ error: { message: 'Delete failed' } });
      const deleteEq1 = jest.fn().mockReturnValue({ eq: deleteEq2 });
      const deleteMock = jest.fn().mockReturnValue({ eq: deleteEq1 });

      mockFrom
        .mockReturnValueOnce({ select: existingSelect })
        .mockReturnValueOnce({ delete: deleteMock });

      const result = await toggleHelpfulVote('review-1', 'user-1');

      expect(result.success).toBe(false);
      expect(result.voted).toBe(true);
      expect(result.helpfulCount).toBe(0);
    });

    it('should handle missing helpful_count in review response', async () => {
      // Mock: No existing vote
      const existingSingle = jest.fn().mockResolvedValue({ data: null, error: null });
      const existingEq2 = jest.fn().mockReturnValue({ single: existingSingle });
      const existingEq1 = jest.fn().mockReturnValue({ eq: existingEq2 });
      const existingSelect = jest.fn().mockReturnValue({ eq: existingEq1 });

      // Mock: Insert vote
      const insertMock = jest.fn().mockResolvedValue({ data: null, error: null });

      // Mock: Review response with null helpful_count
      const reviewSingle = jest.fn().mockResolvedValue({ data: null, error: null });
      const reviewEq = jest.fn().mockReturnValue({ single: reviewSingle });
      const reviewSelect = jest.fn().mockReturnValue({ eq: reviewEq });

      mockFrom
        .mockReturnValueOnce({ select: existingSelect })
        .mockReturnValueOnce({ insert: insertMock })
        .mockReturnValueOnce({ select: reviewSelect });

      const result = await toggleHelpfulVote('review-1', 'user-1');

      expect(result.success).toBe(true);
      expect(result.voted).toBe(true);
      expect(result.helpfulCount).toBe(0); // Fallback to 0
    });
  });
});
