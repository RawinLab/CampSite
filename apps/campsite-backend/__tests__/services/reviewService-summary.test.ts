import { getReviewSummary } from '../../src/services/reviewService';

// Mock Supabase
jest.mock('../../src/lib/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(),
  },
}));

import { supabaseAdmin } from '../../src/lib/supabase';

describe('ReviewService - Review Summary Calculation', () => {
  let mockFrom: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFrom = supabaseAdmin.from as jest.Mock;
  });

  describe('getReviewSummary - Average Rating Calculation', () => {
    it('should calculate average rating correctly with multiple reviews', async () => {
      const mockReviews = [
        { rating_overall: 5, rating_cleanliness: 5, rating_staff: 5, rating_facilities: 5, rating_value: 5, rating_location: 5 },
        { rating_overall: 4, rating_cleanliness: 4, rating_staff: 4, rating_facilities: 4, rating_value: 4, rating_location: 4 },
        { rating_overall: 3, rating_cleanliness: 3, rating_staff: 3, rating_facilities: 3, rating_value: 3, rating_location: 3 },
      ];

      const mockEq2 = jest.fn().mockResolvedValue({ data: mockReviews, error: null });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await getReviewSummary('campsite-1');

      // Average: (5 + 4 + 3) / 3 = 4.0
      expect(result.average_rating).toBe(4.0);
      expect(result.total_count).toBe(3);
    });

    it('should round average rating to 1 decimal place', async () => {
      const mockReviews = [
        { rating_overall: 5, rating_cleanliness: 5, rating_staff: 5, rating_facilities: 5, rating_value: 5, rating_location: 5 },
        { rating_overall: 4, rating_cleanliness: 4, rating_staff: 4, rating_facilities: 4, rating_value: 4, rating_location: 4 },
        { rating_overall: 4, rating_cleanliness: 4, rating_staff: 4, rating_facilities: 4, rating_value: 4, rating_location: 4 },
      ];

      const mockEq2 = jest.fn().mockResolvedValue({ data: mockReviews, error: null });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await getReviewSummary('campsite-1');

      // Average: (5 + 4 + 4) / 3 = 4.333... -> 4.3
      expect(result.average_rating).toBe(4.3);
    });

    it('should handle single review correctly', async () => {
      const mockReviews = [
        { rating_overall: 5, rating_cleanliness: 5, rating_staff: 4, rating_facilities: 5, rating_value: 4, rating_location: 5 },
      ];

      const mockEq2 = jest.fn().mockResolvedValue({ data: mockReviews, error: null });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await getReviewSummary('campsite-1');

      expect(result.average_rating).toBe(5.0);
      expect(result.total_count).toBe(1);
    });
  });

  describe('getReviewSummary - Count Calculation', () => {
    it('should count reviews correctly', async () => {
      const mockReviews = [
        { rating_overall: 5, rating_cleanliness: 5, rating_staff: 5, rating_facilities: 5, rating_value: 5, rating_location: 5 },
        { rating_overall: 4, rating_cleanliness: 4, rating_staff: 4, rating_facilities: 4, rating_value: 4, rating_location: 4 },
        { rating_overall: 5, rating_cleanliness: 5, rating_staff: 5, rating_facilities: 5, rating_value: 5, rating_location: 5 },
        { rating_overall: 3, rating_cleanliness: 3, rating_staff: 3, rating_facilities: 3, rating_value: 3, rating_location: 3 },
        { rating_overall: 4, rating_cleanliness: 4, rating_staff: 4, rating_facilities: 4, rating_value: 4, rating_location: 4 },
      ];

      const mockEq2 = jest.fn().mockResolvedValue({ data: mockReviews, error: null });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await getReviewSummary('campsite-1');

      expect(result.total_count).toBe(5);
    });

    it('should return zero count when no reviews exist', async () => {
      const mockEq2 = jest.fn().mockResolvedValue({ data: [], error: null });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await getReviewSummary('campsite-1');

      expect(result.total_count).toBe(0);
    });

    it('should return zero count when reviews is null', async () => {
      const mockEq2 = jest.fn().mockResolvedValue({ data: null, error: null });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await getReviewSummary('campsite-1');

      expect(result.total_count).toBe(0);
    });
  });

  describe('getReviewSummary - Distribution Calculation', () => {
    it('should calculate rating distribution correctly', async () => {
      const mockReviews = [
        { rating_overall: 5, rating_cleanliness: 5, rating_staff: 5, rating_facilities: 5, rating_value: 5, rating_location: 5 },
        { rating_overall: 5, rating_cleanliness: 5, rating_staff: 5, rating_facilities: 5, rating_value: 5, rating_location: 5 },
        { rating_overall: 4, rating_cleanliness: 4, rating_staff: 4, rating_facilities: 4, rating_value: 4, rating_location: 4 },
        { rating_overall: 3, rating_cleanliness: 3, rating_staff: 3, rating_facilities: 3, rating_value: 3, rating_location: 3 },
        { rating_overall: 2, rating_cleanliness: 2, rating_staff: 2, rating_facilities: 2, rating_value: 2, rating_location: 2 },
        { rating_overall: 1, rating_cleanliness: 1, rating_staff: 1, rating_facilities: 1, rating_value: 1, rating_location: 1 },
      ];

      const mockEq2 = jest.fn().mockResolvedValue({ data: mockReviews, error: null });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await getReviewSummary('campsite-1');

      expect(result.rating_distribution).toEqual({ 1: 1, 2: 1, 3: 1, 4: 1, 5: 2 });
    });

    it('should initialize all distribution buckets to zero when no reviews', async () => {
      const mockEq2 = jest.fn().mockResolvedValue({ data: [], error: null });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await getReviewSummary('campsite-1');

      expect(result.rating_distribution).toEqual({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
    });

    it('should handle distribution with only one rating value', async () => {
      const mockReviews = [
        { rating_overall: 5, rating_cleanliness: 5, rating_staff: 5, rating_facilities: 5, rating_value: 5, rating_location: 5 },
        { rating_overall: 5, rating_cleanliness: 5, rating_staff: 5, rating_facilities: 5, rating_value: 5, rating_location: 5 },
        { rating_overall: 5, rating_cleanliness: 5, rating_staff: 5, rating_facilities: 5, rating_value: 5, rating_location: 5 },
      ];

      const mockEq2 = jest.fn().mockResolvedValue({ data: mockReviews, error: null });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await getReviewSummary('campsite-1');

      expect(result.rating_distribution).toEqual({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 3 });
    });
  });

  describe('getReviewSummary - Percentage Calculation', () => {
    it('should calculate rating percentages correctly', async () => {
      const mockReviews = [
        { rating_overall: 5, rating_cleanliness: 5, rating_staff: 5, rating_facilities: 5, rating_value: 5, rating_location: 5 },
        { rating_overall: 5, rating_cleanliness: 5, rating_staff: 5, rating_facilities: 5, rating_value: 5, rating_location: 5 },
        { rating_overall: 4, rating_cleanliness: 4, rating_staff: 4, rating_facilities: 4, rating_value: 4, rating_location: 4 },
        { rating_overall: 3, rating_cleanliness: 3, rating_staff: 3, rating_facilities: 3, rating_value: 3, rating_location: 3 },
      ];

      const mockEq2 = jest.fn().mockResolvedValue({ data: mockReviews, error: null });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await getReviewSummary('campsite-1');

      // 5-star: 2/4 = 50%, 4-star: 1/4 = 25%, 3-star: 1/4 = 25%
      expect(result.rating_percentages).toEqual({ 1: 0, 2: 0, 3: 25, 4: 25, 5: 50 });
    });

    it('should round percentages correctly', async () => {
      const mockReviews = [
        { rating_overall: 5, rating_cleanliness: 5, rating_staff: 5, rating_facilities: 5, rating_value: 5, rating_location: 5 },
        { rating_overall: 4, rating_cleanliness: 4, rating_staff: 4, rating_facilities: 4, rating_value: 4, rating_location: 4 },
        { rating_overall: 3, rating_cleanliness: 3, rating_staff: 3, rating_facilities: 3, rating_value: 3, rating_location: 3 },
      ];

      const mockEq2 = jest.fn().mockResolvedValue({ data: mockReviews, error: null });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await getReviewSummary('campsite-1');

      // Each rating: 1/3 = 33.333...% -> 33%
      expect(result.rating_percentages).toEqual({ 1: 0, 2: 0, 3: 33, 4: 33, 5: 33 });
    });

    it('should return zero percentages when no reviews', async () => {
      const mockEq2 = jest.fn().mockResolvedValue({ data: [], error: null });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await getReviewSummary('campsite-1');

      expect(result.rating_percentages).toEqual({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
    });

    it('should handle 100% in one category', async () => {
      const mockReviews = [
        { rating_overall: 5, rating_cleanliness: 5, rating_staff: 5, rating_facilities: 5, rating_value: 5, rating_location: 5 },
        { rating_overall: 5, rating_cleanliness: 5, rating_staff: 5, rating_facilities: 5, rating_value: 5, rating_location: 5 },
      ];

      const mockEq2 = jest.fn().mockResolvedValue({ data: mockReviews, error: null });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await getReviewSummary('campsite-1');

      expect(result.rating_percentages).toEqual({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 100 });
    });
  });

  describe('getReviewSummary - No Reviews Edge Case', () => {
    it('should return default summary when no reviews exist', async () => {
      const mockEq2 = jest.fn().mockResolvedValue({ data: [], error: null });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await getReviewSummary('campsite-1');

      expect(result.average_rating).toBe(0);
      expect(result.total_count).toBe(0);
      expect(result.rating_distribution).toEqual({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
      expect(result.rating_percentages).toEqual({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
      expect(result.category_averages.cleanliness).toBeNull();
      expect(result.category_averages.staff).toBeNull();
      expect(result.category_averages.facilities).toBeNull();
      expect(result.category_averages.value).toBeNull();
      expect(result.category_averages.location).toBeNull();
    });

    it('should return default summary when database error occurs', async () => {
      const mockEq2 = jest.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await getReviewSummary('campsite-1');

      expect(result.average_rating).toBe(0);
      expect(result.total_count).toBe(0);
      expect(result.rating_distribution).toEqual({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
      expect(result.rating_percentages).toEqual({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
    });

    it('should return default summary when reviews is null', async () => {
      const mockEq2 = jest.fn().mockResolvedValue({ data: null, error: null });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await getReviewSummary('campsite-1');

      expect(result.average_rating).toBe(0);
      expect(result.total_count).toBe(0);
      expect(result.rating_distribution).toEqual({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
      expect(result.rating_percentages).toEqual({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
    });
  });

  describe('getReviewSummary - Category Averages', () => {
    it('should calculate category averages correctly', async () => {
      const mockReviews = [
        { rating_overall: 5, rating_cleanliness: 5, rating_staff: 4, rating_facilities: 5, rating_value: 4, rating_location: 5 },
        { rating_overall: 4, rating_cleanliness: 4, rating_staff: 4, rating_facilities: 4, rating_value: 4, rating_location: 4 },
        { rating_overall: 3, rating_cleanliness: 3, rating_staff: 3, rating_facilities: 3, rating_value: 3, rating_location: 3 },
      ];

      const mockEq2 = jest.fn().mockResolvedValue({ data: mockReviews, error: null });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await getReviewSummary('campsite-1');

      expect(result.category_averages.cleanliness).toBe(4.0);
      expect(result.category_averages.staff).toBe(3.7);
      expect(result.category_averages.facilities).toBe(4.0);
      expect(result.category_averages.value).toBe(3.7);
      expect(result.category_averages.location).toBe(4.0);
    });

    it('should handle null category ratings correctly', async () => {
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
      expect(result.category_averages.facilities).toBeNull();
      expect(result.category_averages.value).toBeNull();
      expect(result.category_averages.location).toBeNull();
    });

    it('should round category averages to 1 decimal place', async () => {
      const mockReviews = [
        { rating_overall: 5, rating_cleanliness: 5, rating_staff: 5, rating_facilities: 5, rating_value: 5, rating_location: 5 },
        { rating_overall: 4, rating_cleanliness: 4, rating_staff: 4, rating_facilities: 4, rating_value: 4, rating_location: 4 },
        { rating_overall: 4, rating_cleanliness: 4, rating_staff: 4, rating_facilities: 4, rating_value: 4, rating_location: 4 },
      ];

      const mockEq2 = jest.fn().mockResolvedValue({ data: mockReviews, error: null });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await getReviewSummary('campsite-1');

      // (5 + 4 + 4) / 3 = 4.333... -> 4.3
      expect(result.category_averages.cleanliness).toBe(4.3);
      expect(result.category_averages.staff).toBe(4.3);
      expect(result.category_averages.facilities).toBe(4.3);
      expect(result.category_averages.value).toBe(4.3);
      expect(result.category_averages.location).toBe(4.3);
    });

    it('should handle mixed null and non-null category ratings', async () => {
      const mockReviews = [
        { rating_overall: 5, rating_cleanliness: 5, rating_staff: 5, rating_facilities: null, rating_value: 4, rating_location: null },
        { rating_overall: 4, rating_cleanliness: 4, rating_staff: null, rating_facilities: 4, rating_value: null, rating_location: 3 },
      ];

      const mockEq2 = jest.fn().mockResolvedValue({ data: mockReviews, error: null });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await getReviewSummary('campsite-1');

      expect(result.category_averages.cleanliness).toBe(4.5);
      expect(result.category_averages.staff).toBe(5.0);
      expect(result.category_averages.facilities).toBe(4.0);
      expect(result.category_averages.value).toBe(4.0);
      expect(result.category_averages.location).toBe(3.0);
    });
  });

  describe('getReviewSummary - Database Query', () => {
    it('should query reviews with correct parameters', async () => {
      const mockEq2 = jest.fn().mockResolvedValue({ data: [], error: null });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });
      mockFrom.mockReturnValue({ select: mockSelect });

      await getReviewSummary('campsite-123');

      expect(mockFrom).toHaveBeenCalledWith('reviews');
      expect(mockSelect).toHaveBeenCalledWith('rating_overall, rating_cleanliness, rating_staff, rating_facilities, rating_value, rating_location');
      expect(mockEq1).toHaveBeenCalledWith('campsite_id', 'campsite-123');
      expect(mockEq2).toHaveBeenCalledWith('is_hidden', false);
    });
  });
});
