import {
  getReviewSummary,
  getRecentReviews,
  getReviews,
} from '../../src/services/reviewService';
import type { ReviewerType } from '@campsite/shared';

// Mock Supabase
jest.mock('../../src/lib/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(),
  },
}));

import { supabaseAdmin } from '../../src/lib/supabase';

describe('ReviewService - Hidden Review Filtering', () => {
  let mockFrom: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFrom = supabaseAdmin.from as jest.Mock;
  });

  describe('getReviewSummary - exclude hidden reviews', () => {
    it('should exclude is_hidden=true reviews from summary calculation', async () => {
      const mockReviews = [
        { rating_overall: 5, rating_cleanliness: 5, rating_staff: 5, rating_facilities: 5, rating_value: 5, rating_location: 5 },
        { rating_overall: 4, rating_cleanliness: 4, rating_staff: 4, rating_facilities: 4, rating_value: 4, rating_location: 4 },
      ];

      const mockEq2 = jest.fn().mockResolvedValue({ data: mockReviews, error: null });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await getReviewSummary('campsite-1');

      // Verify is_hidden=false filter was applied
      expect(mockEq1).toHaveBeenCalledWith('campsite_id', 'campsite-1');
      expect(mockEq2).toHaveBeenCalledWith('is_hidden', false);

      // Verify calculations only include visible reviews
      expect(result.total_count).toBe(2);
      expect(result.average_rating).toBe(4.5);
    });

    it('should not count hidden reviews in rating distribution', async () => {
      const mockReviews = [
        { rating_overall: 5, rating_cleanliness: 5, rating_staff: 5, rating_facilities: 5, rating_value: 5, rating_location: 5 },
        { rating_overall: 5, rating_cleanliness: 5, rating_staff: 5, rating_facilities: 5, rating_value: 5, rating_location: 5 },
        { rating_overall: 4, rating_cleanliness: 4, rating_staff: 4, rating_facilities: 4, rating_value: 4, rating_location: 4 },
      ];

      const mockEq2 = jest.fn().mockResolvedValue({ data: mockReviews, error: null });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await getReviewSummary('campsite-1');

      expect(result.rating_distribution).toEqual({ 1: 0, 2: 0, 3: 0, 4: 1, 5: 2 });
      expect(result.rating_percentages).toEqual({ 1: 0, 2: 0, 3: 0, 4: 33, 5: 67 });
    });

    it('should not include hidden reviews in category averages', async () => {
      const mockReviews = [
        { rating_overall: 5, rating_cleanliness: 5, rating_staff: 5, rating_facilities: 5, rating_value: 5, rating_location: 5 },
        { rating_overall: 4, rating_cleanliness: 4, rating_staff: 4, rating_facilities: 4, rating_value: 4, rating_location: 4 },
      ];

      const mockEq2 = jest.fn().mockResolvedValue({ data: mockReviews, error: null });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await getReviewSummary('campsite-1');

      // Average should be (5+4)/2 = 4.5 for each category
      expect(result.category_averages.cleanliness).toBe(4.5);
      expect(result.category_averages.staff).toBe(4.5);
      expect(result.category_averages.facilities).toBe(4.5);
      expect(result.category_averages.value).toBe(4.5);
      expect(result.category_averages.location).toBe(4.5);
    });

    it('should return empty summary when all reviews are hidden', async () => {
      const mockEq2 = jest.fn().mockResolvedValue({ data: [], error: null });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await getReviewSummary('campsite-1');

      expect(result.average_rating).toBe(0);
      expect(result.total_count).toBe(0);
      expect(result.rating_distribution).toEqual({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
      expect(result.category_averages.cleanliness).toBeNull();
    });
  });

  describe('getRecentReviews - exclude hidden reviews', () => {
    it('should exclude is_hidden=true reviews from recent list', async () => {
      const mockReviews = [
        {
          id: 'review-1', campsite_id: 'campsite-1', user_id: 'user-1', rating_overall: 5,
          rating_cleanliness: 5, rating_staff: 5, rating_facilities: 5, rating_value: 5, rating_location: 5,
          reviewer_type: 'family' as ReviewerType, title: 'Great', content: 'Amazing', pros: 'Clean', cons: null,
          helpful_count: 10, is_reported: false, report_count: 0, is_hidden: false, hidden_reason: null,
          hidden_at: null, hidden_by: null, owner_response: null, owner_response_at: null, visited_at: '2024-01-01',
          created_at: '2024-01-15', updated_at: '2024-01-15',
          reviewer: { full_name: 'John Doe', avatar_url: null },
          photos: [],
        },
      ];

      const mockLimit = jest.fn().mockResolvedValue({ data: mockReviews, error: null });
      const mockOrder = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockEq2 = jest.fn().mockReturnValue({ order: mockOrder });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await getRecentReviews('campsite-1', 5);

      // Verify is_hidden=false filter was applied
      expect(mockEq1).toHaveBeenCalledWith('campsite_id', 'campsite-1');
      expect(mockEq2).toHaveBeenCalledWith('is_hidden', false);

      expect(result).toHaveLength(1);
      expect(result[0].is_hidden).toBe(false);
    });

    it('should return empty array when all reviews are hidden', async () => {
      const mockLimit = jest.fn().mockResolvedValue({ data: [], error: null });
      const mockOrder = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockEq2 = jest.fn().mockReturnValue({ order: mockOrder });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await getRecentReviews('campsite-1');

      expect(result).toEqual([]);
    });
  });

  describe('getReviews - exclude hidden reviews with filters', () => {
    it('should exclude is_hidden=true reviews from paginated list', async () => {
      const mockReviews = [
        {
          id: 'review-1', campsite_id: 'campsite-1', user_id: 'user-1', rating_overall: 5,
          rating_cleanliness: 5, rating_staff: 5, rating_facilities: 5, rating_value: 5, rating_location: 5,
          reviewer_type: 'family' as ReviewerType, title: 'Great', content: 'Amazing', pros: 'Clean', cons: null,
          helpful_count: 10, is_reported: false, report_count: 0, is_hidden: false, hidden_reason: null,
          hidden_at: null, hidden_by: null, owner_response: null, owner_response_at: null, visited_at: '2024-01-01',
          created_at: '2024-01-15', updated_at: '2024-01-15',
          reviewer: { full_name: 'John Doe', avatar_url: null },
          photos: [],
        },
      ];

      const countEq2 = jest.fn().mockResolvedValue({ count: 1 });
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

      const result = await getReviews('campsite-1');

      // Verify is_hidden=false filter was applied to both count and data queries
      expect(countEq1).toHaveBeenCalledWith('campsite_id', 'campsite-1');
      expect(countEq2).toHaveBeenCalledWith('is_hidden', false);
      expect(dataEq1).toHaveBeenCalledWith('campsite_id', 'campsite-1');
      expect(dataEq2).toHaveBeenCalledWith('is_hidden', false);

      expect(result.reviews).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.reviews[0].is_hidden).toBe(false);
    });

    it('should exclude hidden reviews when filtering by reviewer_type', async () => {
      const mockReviews = [
        {
          id: 'review-1', campsite_id: 'campsite-1', user_id: 'user-1', rating_overall: 5,
          rating_cleanliness: 5, rating_staff: 5, rating_facilities: 5, rating_value: 5, rating_location: 5,
          reviewer_type: 'family' as ReviewerType, title: 'Great', content: 'Amazing', pros: 'Clean', cons: null,
          helpful_count: 10, is_reported: false, report_count: 0, is_hidden: false, hidden_reason: null,
          hidden_at: null, hidden_by: null, owner_response: null, owner_response_at: null, visited_at: '2024-01-01',
          created_at: '2024-01-15', updated_at: '2024-01-15',
          reviewer: { full_name: 'John Doe', avatar_url: null },
          photos: [],
        },
      ];

      const countEq3 = jest.fn().mockResolvedValue({ count: 1 });
      const countEq2 = jest.fn().mockReturnValue({ eq: countEq3 });
      const countEq1 = jest.fn().mockReturnValue({ eq: countEq2 });
      const countSelect = jest.fn().mockReturnValue({ eq: countEq1 });

      const dataRange = jest.fn().mockResolvedValue({ data: mockReviews, error: null });
      const dataOrder = jest.fn().mockReturnValue({ range: dataRange });
      const dataEq3 = jest.fn().mockReturnValue({ order: dataOrder });
      const dataEq2 = jest.fn().mockReturnValue({ eq: dataEq3 });
      const dataEq1 = jest.fn().mockReturnValue({ eq: dataEq2 });
      const dataSelect = jest.fn().mockReturnValue({ eq: dataEq1 });

      mockFrom
        .mockReturnValueOnce({ select: countSelect })
        .mockReturnValueOnce({ select: dataSelect });

      const result = await getReviews('campsite-1', { reviewerType: 'family' });

      // Verify both is_hidden and reviewer_type filters were applied
      expect(countEq1).toHaveBeenCalledWith('campsite_id', 'campsite-1');
      expect(countEq2).toHaveBeenCalledWith('is_hidden', false);
      expect(countEq3).toHaveBeenCalledWith('reviewer_type', 'family');
      expect(dataEq1).toHaveBeenCalledWith('campsite_id', 'campsite-1');
      expect(dataEq2).toHaveBeenCalledWith('is_hidden', false);
      expect(dataEq3).toHaveBeenCalledWith('reviewer_type', 'family');

      expect(result.reviews).toHaveLength(1);
      expect(result.reviews[0].reviewer_type).toBe('family');
    });

    it('should exclude hidden reviews when sorting by rating_high', async () => {
      const mockReviews = [
        {
          id: 'review-1', campsite_id: 'campsite-1', user_id: 'user-1', rating_overall: 5,
          rating_cleanliness: 5, rating_staff: 5, rating_facilities: 5, rating_value: 5, rating_location: 5,
          reviewer_type: 'family' as ReviewerType, title: 'Great', content: 'Amazing', pros: 'Clean', cons: null,
          helpful_count: 10, is_reported: false, report_count: 0, is_hidden: false, hidden_reason: null,
          hidden_at: null, hidden_by: null, owner_response: null, owner_response_at: null, visited_at: '2024-01-01',
          created_at: '2024-01-15', updated_at: '2024-01-15',
          reviewer: { full_name: 'John Doe', avatar_url: null },
          photos: [],
        },
      ];

      const countEq2 = jest.fn().mockResolvedValue({ count: 1 });
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

      await getReviews('campsite-1', { sortBy: 'rating_high' });

      // Verify is_hidden filter is still applied with custom sort
      expect(dataEq1).toHaveBeenCalledWith('campsite_id', 'campsite-1');
      expect(dataEq2).toHaveBeenCalledWith('is_hidden', false);
      expect(dataOrder).toHaveBeenCalledWith('rating_overall', { ascending: false });
    });

    it('should exclude hidden reviews when sorting by helpful', async () => {
      const countEq2 = jest.fn().mockResolvedValue({ count: 0 });
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

      await getReviews('campsite-1', { sortBy: 'helpful' });

      // Verify is_hidden filter is applied with helpful sort
      expect(dataEq1).toHaveBeenCalledWith('campsite_id', 'campsite-1');
      expect(dataEq2).toHaveBeenCalledWith('is_hidden', false);
      expect(dataOrder).toHaveBeenCalledWith('helpful_count', { ascending: false });
    });

    it('should return empty results when all reviews are hidden', async () => {
      const countEq2 = jest.fn().mockResolvedValue({ count: 0 });
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

      const result = await getReviews('campsite-1');

      expect(result.reviews).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should handle pagination with hidden reviews excluded', async () => {
      const mockReviews = [
        {
          id: 'review-2', campsite_id: 'campsite-1', user_id: 'user-2', rating_overall: 4,
          rating_cleanliness: 4, rating_staff: 4, rating_facilities: 4, rating_value: 4, rating_location: 4,
          reviewer_type: 'couple' as ReviewerType, title: 'Good', content: 'Nice', pros: 'Location', cons: null,
          helpful_count: 5, is_reported: false, report_count: 0, is_hidden: false, hidden_reason: null,
          hidden_at: null, hidden_by: null, owner_response: null, owner_response_at: null, visited_at: '2024-01-02',
          created_at: '2024-01-16', updated_at: '2024-01-16',
          reviewer: { full_name: 'Jane Smith', avatar_url: null },
          photos: [],
        },
      ];

      const countEq2 = jest.fn().mockResolvedValue({ count: 15 });
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

      const result = await getReviews('campsite-1', { page: 2, limit: 5 });

      expect(dataRange).toHaveBeenCalledWith(5, 9); // page 2: offset 5, limit 5
      expect(result.total).toBe(15);
    });
  });

  describe('getReviews - visible reviews display correctly', () => {
    it('should return all visible reviews when none are hidden', async () => {
      const mockReviews = [
        {
          id: 'review-1', campsite_id: 'campsite-1', user_id: 'user-1', rating_overall: 5,
          rating_cleanliness: 5, rating_staff: 5, rating_facilities: 5, rating_value: 5, rating_location: 5,
          reviewer_type: 'family' as ReviewerType, title: 'Great', content: 'Amazing', pros: 'Clean', cons: null,
          helpful_count: 10, is_reported: false, report_count: 0, is_hidden: false, hidden_reason: null,
          hidden_at: null, hidden_by: null, owner_response: null, owner_response_at: null, visited_at: '2024-01-01',
          created_at: '2024-01-15', updated_at: '2024-01-15',
          reviewer: { full_name: 'John Doe', avatar_url: null },
          photos: [],
        },
        {
          id: 'review-2', campsite_id: 'campsite-1', user_id: 'user-2', rating_overall: 4,
          rating_cleanliness: 4, rating_staff: 4, rating_facilities: 4, rating_value: 4, rating_location: 4,
          reviewer_type: 'couple' as ReviewerType, title: 'Good', content: 'Nice', pros: 'Location', cons: null,
          helpful_count: 5, is_reported: false, report_count: 0, is_hidden: false, hidden_reason: null,
          hidden_at: null, hidden_by: null, owner_response: null, owner_response_at: null, visited_at: '2024-01-02',
          created_at: '2024-01-16', updated_at: '2024-01-16',
          reviewer: { full_name: 'Jane Smith', avatar_url: null },
          photos: [],
        },
      ];

      const countEq2 = jest.fn().mockResolvedValue({ count: 2 });
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

      const result = await getReviews('campsite-1');

      expect(result.reviews).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.reviews.every(r => r.is_hidden === false)).toBe(true);
    });
  });
});
