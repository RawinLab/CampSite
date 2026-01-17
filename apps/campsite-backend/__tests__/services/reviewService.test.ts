import {
  getReviewSummary,
  getRecentReviews,
  getReviews,
  createReview,
  toggleHelpfulVote,
  reportReview,
  hideReview,
  unhideReview,
  getReportedReviews,
  addOwnerResponse,
} from '../../src/services/reviewService';
import type {
  ReviewerType,
  CreateReviewInput,
} from '@campsite/shared';

// Mock Supabase
jest.mock('../../src/lib/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(),
  },
}));

import { supabaseAdmin } from '../../src/lib/supabase';

describe('ReviewService', () => {
  let mockFrom: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFrom = supabaseAdmin.from as jest.Mock;
  });

  describe('getReviewSummary', () => {
    it('should calculate review summary correctly with multiple reviews', async () => {
      const mockReviews = [
        { rating_overall: 5, rating_cleanliness: 5, rating_staff: 4, rating_facilities: 5, rating_value: 4, rating_location: 5 },
        { rating_overall: 4, rating_cleanliness: 4, rating_staff: 4, rating_facilities: 4, rating_value: 4, rating_location: 4 },
        { rating_overall: 5, rating_cleanliness: 5, rating_staff: 5, rating_facilities: 5, rating_value: 5, rating_location: 5 },
        { rating_overall: 3, rating_cleanliness: 3, rating_staff: 3, rating_facilities: 3, rating_value: 3, rating_location: 3 },
      ];

      const mockEq2 = jest.fn().mockResolvedValue({ data: mockReviews, error: null });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await getReviewSummary('campsite-1');

      expect(result.average_rating).toBe(4.3);
      expect(result.total_count).toBe(4);
      expect(result.rating_distribution).toEqual({ 1: 0, 2: 0, 3: 1, 4: 1, 5: 2 });
      expect(result.rating_percentages).toEqual({ 1: 0, 2: 0, 3: 25, 4: 25, 5: 50 });
      expect(result.category_averages.cleanliness).toBe(4.3);
      expect(result.category_averages.staff).toBe(4.0);
    });

    it('should return empty summary when no reviews exist', async () => {
      const mockEq2 = jest.fn().mockResolvedValue({ data: [], error: null });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await getReviewSummary('campsite-1');

      expect(result.average_rating).toBe(0);
      expect(result.total_count).toBe(0);
      expect(result.category_averages.cleanliness).toBeNull();
    });

    it('should handle reviews with null category ratings', async () => {
      const mockReviews = [
        { rating_overall: 5, rating_cleanliness: 5, rating_staff: null, rating_facilities: null, rating_value: null, rating_location: null },
        { rating_overall: 4, rating_cleanliness: 4, rating_staff: null, rating_facilities: null, rating_value: null, rating_location: null },
      ];

      const mockEq2 = jest.fn().mockResolvedValue({ data: mockReviews, error: null });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await getReviewSummary('campsite-1');

      expect(result.category_averages.cleanliness).toBe(4.5);
      expect(result.category_averages.staff).toBeNull();
    });
  });

  describe('getRecentReviews', () => {
    it('should fetch recent reviews with user info and photos', async () => {
      const mockReviews = [{
        id: 'review-1', campsite_id: 'campsite-1', user_id: 'user-1', rating_overall: 5,
        rating_cleanliness: 5, rating_staff: 5, rating_facilities: 5, rating_value: 5, rating_location: 5,
        reviewer_type: 'family' as ReviewerType, title: 'Great', content: 'Amazing', pros: 'Clean', cons: null,
        helpful_count: 10, is_reported: false, report_count: 0, is_hidden: false, hidden_reason: null,
        hidden_at: null, hidden_by: null, owner_response: null, owner_response_at: null, visited_at: '2024-01-01',
        created_at: '2024-01-15', updated_at: '2024-01-15',
        reviewer: { full_name: 'John Doe', avatar_url: 'https://example.com/avatar.jpg' },
        photos: [{ id: 'photo-1', review_id: 'review-1', url: 'https://example.com/photo.jpg', sort_order: 0 }],
      }];

      const mockLimit = jest.fn().mockResolvedValue({ data: mockReviews, error: null });
      const mockOrder = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockEq2 = jest.fn().mockReturnValue({ order: mockOrder });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await getRecentReviews('campsite-1', 5);

      expect(result).toHaveLength(1);
      expect(result[0].reviewer_name).toBe('John Doe');
      expect(result[0].photos).toHaveLength(1);
    });

    it('should return empty array on error', async () => {
      const mockLimit = jest.fn().mockResolvedValue({ data: null, error: { message: 'Error' } });
      const mockOrder = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockEq2 = jest.fn().mockReturnValue({ order: mockOrder });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await getRecentReviews('campsite-1');

      expect(result).toEqual([]);
    });
  });

  describe('getReviews', () => {
    it('should fetch paginated reviews with default options', async () => {
      const mockReviews = [{
        id: 'review-1', campsite_id: 'campsite-1', user_id: 'user-1', rating_overall: 5,
        rating_cleanliness: 5, rating_staff: 5, rating_facilities: 5, rating_value: 5, rating_location: 5,
        reviewer_type: 'family' as ReviewerType, title: 'Great', content: 'Amazing', pros: 'Clean', cons: null,
        helpful_count: 10, is_reported: false, report_count: 0, is_hidden: false, hidden_reason: null,
        hidden_at: null, hidden_by: null, owner_response: null, owner_response_at: null, visited_at: '2024-01-01',
        created_at: '2024-01-15', updated_at: '2024-01-15',
        reviewer: { full_name: 'John Doe', avatar_url: null },
        photos: [],
      }];

      // Count query - needs double eq chain
      const countEq2 = jest.fn().mockResolvedValue({ count: 10 });
      const countEq1 = jest.fn().mockReturnValue({ eq: countEq2 });
      const countSelect = jest.fn().mockReturnValue({ eq: countEq1 });

      // Data query - needs double eq chain
      const dataRange = jest.fn().mockResolvedValue({ data: mockReviews, error: null });
      const dataOrder = jest.fn().mockReturnValue({ range: dataRange });
      const dataEq2 = jest.fn().mockReturnValue({ order: dataOrder });
      const dataEq1 = jest.fn().mockReturnValue({ eq: dataEq2 });
      const dataSelect = jest.fn().mockReturnValue({ eq: dataEq1 });

      mockFrom
        .mockReturnValueOnce({ select: countSelect })
        .mockReturnValueOnce({ select: dataSelect });

      const result = await getReviews('campsite-1');

      expect(result.reviews).toHaveLength(1);
      expect(result.total).toBe(10);
      expect(dataRange).toHaveBeenCalledWith(0, 4);
    });

    it('should sort by rating high', async () => {
      const countEq2 = jest.fn().mockResolvedValue({ count: 5 });
      const countEq1 = jest.fn().mockReturnValue({ eq: countEq2 });
      const countSelect = jest.fn().mockReturnValue({ eq: countEq1 });

      const dataRange = jest.fn().mockResolvedValue({ data: [], error: null });
      const dataOrder = jest.fn().mockReturnValue({ range: dataRange });
      const dataEq2 = jest.fn().mockReturnValue({ order: dataOrder });
      const dataEq1 = jest.fn().mockReturnValue({ eq: dataEq2 });
      const dataSelect = jest.fn().mockReturnValue({ eq: dataEq1 });

      mockFrom
        .mockReturnValueOnce({ select: countSelect })
        .mockReturnValueOnce({ select: dataSelect });

      await getReviews('campsite-1', { sortBy: 'rating_high' });

      expect(dataOrder).toHaveBeenCalledWith('rating_overall', { ascending: false });
    });

    it('should filter by reviewer type', async () => {
      const countEq3 = jest.fn().mockResolvedValue({ count: 3 });
      const countEq2 = jest.fn().mockReturnValue({ eq: countEq3 });
      const countEq1 = jest.fn().mockReturnValue({ eq: countEq2 });
      const countSelect = jest.fn().mockReturnValue({ eq: countEq1 });

      const dataRange = jest.fn().mockResolvedValue({ data: [], error: null });
      const dataOrder = jest.fn().mockReturnValue({ range: dataRange });
      const dataEq3 = jest.fn().mockReturnValue({ order: dataOrder });
      const dataEq2 = jest.fn().mockReturnValue({ eq: dataEq3 });
      const dataEq1 = jest.fn().mockReturnValue({ eq: dataEq2 });
      const dataSelect = jest.fn().mockReturnValue({ eq: dataEq1 });

      mockFrom
        .mockReturnValueOnce({ select: countSelect })
        .mockReturnValueOnce({ select: dataSelect });

      await getReviews('campsite-1', { reviewerType: 'family' });

      expect(countEq2).toHaveBeenCalled();
      expect(dataEq2).toHaveBeenCalled();
    });
  });

  describe('createReview', () => {
    const validInput: CreateReviewInput = {
      campsite_id: 'campsite-1',
      rating_overall: 5,
      rating_cleanliness: 5,
      reviewer_type: 'family',
      content: 'Great campsite',
    };

    it('should create a new review successfully', async () => {
      const mockReview = {
        id: 'review-1', ...validInput, user_id: 'user-1', helpful_count: 0,
        is_reported: false, report_count: 0, is_hidden: false, hidden_reason: null,
        hidden_at: null, hidden_by: null, owner_response: null, owner_response_at: null,
        created_at: '2024-01-15', updated_at: '2024-01-15',
        reviewer: { full_name: 'John Doe', avatar_url: null },
      };

      // Mock existing check
      const existingSingle = jest.fn().mockResolvedValue({ data: null, error: null });
      const existingEq = jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ single: existingSingle }) });
      const existingSelect = jest.fn().mockReturnValue({ eq: existingEq });

      // Mock campsite check
      const campsiteSingle = jest.fn().mockResolvedValue({ data: { id: 'campsite-1', status: 'approved' }, error: null });
      const campsiteEq = jest.fn().mockReturnValue({ single: campsiteSingle });
      const campsiteSelect = jest.fn().mockReturnValue({ eq: campsiteEq });

      // Mock insert
      const insertSingle = jest.fn().mockResolvedValue({ data: mockReview, error: null });
      const insertSelect = jest.fn().mockReturnValue({ single: insertSingle });
      const insertInsert = jest.fn().mockReturnValue({ select: insertSelect });

      // Mock complete review fetch
      const completeSingle = jest.fn().mockResolvedValue({ data: { ...mockReview, photos: [] }, error: null });
      const completeEq = jest.fn().mockReturnValue({ single: completeSingle });
      const completeSelect = jest.fn().mockReturnValue({ eq: completeEq });

      mockFrom
        .mockReturnValueOnce({ select: existingSelect })
        .mockReturnValueOnce({ select: campsiteSelect })
        .mockReturnValueOnce({ insert: insertInsert })
        .mockReturnValueOnce({ select: completeSelect });

      const result = await createReview(validInput, 'user-1');

      expect(result.success).toBe(true);
      expect(result.review?.id).toBe('review-1');
    });

    it('should reject duplicate review from same user', async () => {
      const existingSingle = jest.fn().mockResolvedValue({ data: { id: 'existing-review' }, error: null });
      const existingEq = jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ single: existingSingle }) });
      const existingSelect = jest.fn().mockReturnValue({ eq: existingEq });

      mockFrom.mockReturnValueOnce({ select: existingSelect });

      const result = await createReview(validInput, 'user-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('You have already reviewed this campsite');
    });

    it('should reject review for non-approved campsite', async () => {
      const existingSingle = jest.fn().mockResolvedValue({ data: null, error: null });
      const existingEq = jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ single: existingSingle }) });
      const existingSelect = jest.fn().mockReturnValue({ eq: existingEq });

      const campsiteSingle = jest.fn().mockResolvedValue({ data: { id: 'campsite-1', status: 'pending' }, error: null });
      const campsiteEq = jest.fn().mockReturnValue({ single: campsiteSingle });
      const campsiteSelect = jest.fn().mockReturnValue({ eq: campsiteEq });

      mockFrom
        .mockReturnValueOnce({ select: existingSelect })
        .mockReturnValueOnce({ select: campsiteSelect });

      const result = await createReview(validInput, 'user-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Campsite not found or not available for reviews');
    });
  });

  describe('toggleHelpfulVote', () => {
    it('should add helpful vote when not already voted', async () => {
      const existingSingle = jest.fn().mockResolvedValue({ data: null, error: null });
      const existingEq = jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ single: existingSingle }) });
      const existingSelect = jest.fn().mockReturnValue({ eq: existingEq });

      const insertMock = jest.fn().mockResolvedValue({ data: null, error: null });

      const reviewSingle = jest.fn().mockResolvedValue({ data: { helpful_count: 5 }, error: null });
      const reviewEq = jest.fn().mockReturnValue({ single: reviewSingle });
      const reviewSelect = jest.fn().mockReturnValue({ eq: reviewEq });

      mockFrom
        .mockReturnValueOnce({ select: existingSelect })
        .mockReturnValueOnce({ insert: insertMock })
        .mockReturnValueOnce({ select: reviewSelect });

      const result = await toggleHelpfulVote('review-1', 'user-1');

      expect(result.success).toBe(true);
      expect(result.voted).toBe(true);
      expect(result.helpfulCount).toBe(5);
    });

    it('should remove helpful vote when already voted', async () => {
      const existingSingle = jest.fn().mockResolvedValue({ data: { review_id: 'review-1' }, error: null });
      const existingEq2 = jest.fn().mockReturnValue({ single: existingSingle });
      const existingEq1 = jest.fn().mockReturnValue({ eq: existingEq2 });
      const existingSelect = jest.fn().mockReturnValue({ eq: existingEq1 });

      const deleteEq2 = jest.fn().mockResolvedValue({ error: null });
      const deleteEq1 = jest.fn().mockReturnValue({ eq: deleteEq2 });
      const deleteMock = jest.fn().mockReturnValue({ eq: deleteEq1 });

      const reviewSingle = jest.fn().mockResolvedValue({ data: { helpful_count: 4 }, error: null });
      const reviewEq = jest.fn().mockReturnValue({ single: reviewSingle });
      const reviewSelect = jest.fn().mockReturnValue({ eq: reviewEq });

      mockFrom
        .mockReturnValueOnce({ select: existingSelect })
        .mockReturnValueOnce({ delete: deleteMock })
        .mockReturnValueOnce({ select: reviewSelect });

      const result = await toggleHelpfulVote('review-1', 'user-1');

      expect(result.success).toBe(true);
      expect(result.voted).toBe(false);
      expect(result.helpfulCount).toBe(4);
    });
  });

  describe('reportReview', () => {
    it('should report review successfully', async () => {
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

      const result = await reportReview('review-1', 'user-1', 'spam', 'This is spam');

      expect(result.success).toBe(true);
    });

    it('should reject reporting own review', async () => {
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
  });

  describe('hideReview', () => {
    it('should hide review successfully', async () => {
      const mockEq = jest.fn().mockResolvedValue({ error: null });
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });

      mockFrom.mockReturnValue({ update: mockUpdate });

      const result = await hideReview('review-1', 'admin-1', 'Inappropriate content');

      expect(result.success).toBe(true);
      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should handle database error', async () => {
      const mockEq = jest.fn().mockResolvedValue({ error: { message: 'Update failed' } });
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });

      mockFrom.mockReturnValue({ update: mockUpdate });

      const result = await hideReview('review-1', 'admin-1', 'Spam');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to hide review');
    });
  });

  describe('unhideReview', () => {
    it('should unhide review successfully', async () => {
      const updateEq = jest.fn().mockResolvedValue({ error: null });
      const updateMock = jest.fn().mockReturnValue({ eq: updateEq });

      mockFrom.mockReturnValue({ update: updateMock });

      const result = await unhideReview('review-1');

      expect(result.success).toBe(true);
    });
  });

  describe('getReportedReviews', () => {
    it('should fetch reported reviews successfully', async () => {
      const mockReviews = [{
        id: 'review-1', campsite_id: 'campsite-1', user_id: 'user-1', rating_overall: 1,
        rating_cleanliness: null, rating_staff: null, rating_facilities: null, rating_value: null, rating_location: null,
        reviewer_type: 'solo' as ReviewerType, title: 'Bad', content: 'Spam', pros: null, cons: null,
        helpful_count: 0, is_reported: true, report_count: 5, is_hidden: false, hidden_reason: null,
        hidden_at: null, hidden_by: null, owner_response: null, owner_response_at: null, visited_at: null,
        created_at: '2024-01-15', updated_at: '2024-01-15',
        reviewer: { full_name: 'Spammer', avatar_url: null },
        photos: [],
        campsite: { id: 'campsite-1', name: 'Test Campsite' },
      }];

      const countEq2 = jest.fn().mockResolvedValue({ count: 10 });
      const countEq1 = jest.fn().mockReturnValue({ eq: countEq2 });
      const countSelect = jest.fn().mockReturnValue({ eq: countEq1 });

      const dataRange = jest.fn().mockResolvedValue({ data: mockReviews, error: null });
      const dataOrder = jest.fn().mockReturnValue({ range: dataRange });
      const dataEq2 = jest.fn().mockReturnValue({ order: dataOrder });
      const dataEq1 = jest.fn().mockReturnValue({ eq: dataEq2 });
      const dataSelect = jest.fn().mockReturnValue({ eq: dataEq1 });

      mockFrom
        .mockReturnValueOnce({ select: countSelect })
        .mockReturnValueOnce({ select: dataSelect });

      const result = await getReportedReviews(1, 20);

      expect(result.reviews).toHaveLength(1);
      expect(result.total).toBe(10);
      expect(result.reviews[0].is_reported).toBe(true);
    });
  });

  describe('addOwnerResponse', () => {
    it('should add owner response successfully', async () => {
      const reviewSingle = jest.fn().mockResolvedValue({
        data: { campsite_id: 'campsite-1', campsite: { owner_id: 'owner-1' } },
        error: null,
      });
      const reviewEq = jest.fn().mockReturnValue({ single: reviewSingle });
      const reviewSelect = jest.fn().mockReturnValue({ eq: reviewEq });

      const updateEq = jest.fn().mockResolvedValue({ error: null });
      const updateMock = jest.fn().mockReturnValue({ eq: updateEq });

      mockFrom
        .mockReturnValueOnce({ select: reviewSelect })
        .mockReturnValueOnce({ update: updateMock });

      const result = await addOwnerResponse('review-1', 'owner-1', 'Thank you!');

      expect(result.success).toBe(true);
    });

    it('should reject when owner does not own the campsite', async () => {
      const reviewSingle = jest.fn().mockResolvedValue({
        data: { campsite_id: 'campsite-1', campsite: { owner_id: 'different-owner' } },
        error: null,
      });
      const reviewEq = jest.fn().mockReturnValue({ single: reviewSingle });
      const reviewSelect = jest.fn().mockReturnValue({ eq: reviewEq });

      mockFrom.mockReturnValueOnce({ select: reviewSelect });

      const result = await addOwnerResponse('review-1', 'owner-1', 'Response');

      expect(result.success).toBe(false);
      expect(result.error).toBe('You are not authorized to respond to this review');
    });
  });
});
