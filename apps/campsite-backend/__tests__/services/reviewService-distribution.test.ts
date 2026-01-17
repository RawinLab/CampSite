import { getReviewSummary } from '../../src/services/reviewService';

// Mock Supabase
jest.mock('../../src/lib/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(),
  },
}));

import { supabaseAdmin } from '../../src/lib/supabase';

describe('ReviewService - Distribution Percentages', () => {
  let mockFrom: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFrom = supabaseAdmin.from as jest.Mock;
  });

  describe('Distribution percentage calculation', () => {
    it('should calculate percentages correctly (count/total * 100)', async () => {
      const mockReviews = [
        { rating_overall: 5, rating_cleanliness: null, rating_staff: null, rating_facilities: null, rating_value: null, rating_location: null },
        { rating_overall: 5, rating_cleanliness: null, rating_staff: null, rating_facilities: null, rating_value: null, rating_location: null },
        { rating_overall: 4, rating_cleanliness: null, rating_staff: null, rating_facilities: null, rating_value: null, rating_location: null },
        { rating_overall: 3, rating_cleanliness: null, rating_staff: null, rating_facilities: null, rating_value: null, rating_location: null },
      ];

      const mockEq2 = jest.fn().mockResolvedValue({ data: mockReviews, error: null });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await getReviewSummary('campsite-1');

      expect(result.total_count).toBe(4);
      expect(result.rating_distribution).toEqual({ 1: 0, 2: 0, 3: 1, 4: 1, 5: 2 });
      // 5-star: 2/4 * 100 = 50%, 4-star: 1/4 * 100 = 25%, 3-star: 1/4 * 100 = 25%
      expect(result.rating_percentages[5]).toBe(50);
      expect(result.rating_percentages[4]).toBe(25);
      expect(result.rating_percentages[3]).toBe(25);
    });

    it('should include all 5 ratings even with 0 count', async () => {
      const mockReviews = [
        { rating_overall: 5, rating_cleanliness: null, rating_staff: null, rating_facilities: null, rating_value: null, rating_location: null },
        { rating_overall: 4, rating_cleanliness: null, rating_staff: null, rating_facilities: null, rating_value: null, rating_location: null },
      ];

      const mockEq2 = jest.fn().mockResolvedValue({ data: mockReviews, error: null });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await getReviewSummary('campsite-1');

      // All ratings 1-5 should be present
      expect(result.rating_distribution).toHaveProperty('1');
      expect(result.rating_distribution).toHaveProperty('2');
      expect(result.rating_distribution).toHaveProperty('3');
      expect(result.rating_distribution).toHaveProperty('4');
      expect(result.rating_distribution).toHaveProperty('5');

      expect(result.rating_percentages).toHaveProperty('1');
      expect(result.rating_percentages).toHaveProperty('2');
      expect(result.rating_percentages).toHaveProperty('3');
      expect(result.rating_percentages).toHaveProperty('4');
      expect(result.rating_percentages).toHaveProperty('5');

      // Unused ratings should be 0
      expect(result.rating_distribution[1]).toBe(0);
      expect(result.rating_distribution[2]).toBe(0);
      expect(result.rating_distribution[3]).toBe(0);
      expect(result.rating_percentages[1]).toBe(0);
      expect(result.rating_percentages[2]).toBe(0);
      expect(result.rating_percentages[3]).toBe(0);
    });

    it('should have percentages sum to 100% with even distribution', async () => {
      const mockReviews = [
        { rating_overall: 5, rating_cleanliness: null, rating_staff: null, rating_facilities: null, rating_value: null, rating_location: null },
        { rating_overall: 4, rating_cleanliness: null, rating_staff: null, rating_facilities: null, rating_value: null, rating_location: null },
        { rating_overall: 3, rating_cleanliness: null, rating_staff: null, rating_facilities: null, rating_value: null, rating_location: null },
        { rating_overall: 2, rating_cleanliness: null, rating_staff: null, rating_facilities: null, rating_value: null, rating_location: null },
      ];

      const mockEq2 = jest.fn().mockResolvedValue({ data: mockReviews, error: null });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await getReviewSummary('campsite-1');

      const percentageSum =
        result.rating_percentages[1] +
        result.rating_percentages[2] +
        result.rating_percentages[3] +
        result.rating_percentages[4] +
        result.rating_percentages[5];

      expect(percentageSum).toBe(100);
    });

    it('should handle uneven distribution correctly', async () => {
      const mockReviews = [
        { rating_overall: 5, rating_cleanliness: null, rating_staff: null, rating_facilities: null, rating_value: null, rating_location: null },
        { rating_overall: 5, rating_cleanliness: null, rating_staff: null, rating_facilities: null, rating_value: null, rating_location: null },
        { rating_overall: 5, rating_cleanliness: null, rating_staff: null, rating_facilities: null, rating_value: null, rating_location: null },
        { rating_overall: 5, rating_cleanliness: null, rating_staff: null, rating_facilities: null, rating_value: null, rating_location: null },
        { rating_overall: 5, rating_cleanliness: null, rating_staff: null, rating_facilities: null, rating_value: null, rating_location: null },
        { rating_overall: 5, rating_cleanliness: null, rating_staff: null, rating_facilities: null, rating_value: null, rating_location: null },
        { rating_overall: 5, rating_cleanliness: null, rating_staff: null, rating_facilities: null, rating_value: null, rating_location: null },
        { rating_overall: 4, rating_cleanliness: null, rating_staff: null, rating_facilities: null, rating_value: null, rating_location: null },
        { rating_overall: 3, rating_cleanliness: null, rating_staff: null, rating_facilities: null, rating_value: null, rating_location: null },
        { rating_overall: 1, rating_cleanliness: null, rating_staff: null, rating_facilities: null, rating_value: null, rating_location: null },
      ];

      const mockEq2 = jest.fn().mockResolvedValue({ data: mockReviews, error: null });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await getReviewSummary('campsite-1');

      expect(result.total_count).toBe(10);
      expect(result.rating_distribution).toEqual({ 1: 1, 2: 0, 3: 1, 4: 1, 5: 7 });
      // 7/10 = 70%, 1/10 = 10% each
      expect(result.rating_percentages[5]).toBe(70);
      expect(result.rating_percentages[4]).toBe(10);
      expect(result.rating_percentages[3]).toBe(10);
      expect(result.rating_percentages[2]).toBe(0);
      expect(result.rating_percentages[1]).toBe(10);

      const percentageSum = Object.values(result.rating_percentages).reduce((a, b) => a + b, 0);
      expect(percentageSum).toBe(100);
    });

    it('should handle all reviews having same rating', async () => {
      const mockReviews = [
        { rating_overall: 5, rating_cleanliness: null, rating_staff: null, rating_facilities: null, rating_value: null, rating_location: null },
        { rating_overall: 5, rating_cleanliness: null, rating_staff: null, rating_facilities: null, rating_value: null, rating_location: null },
        { rating_overall: 5, rating_cleanliness: null, rating_staff: null, rating_facilities: null, rating_value: null, rating_location: null },
      ];

      const mockEq2 = jest.fn().mockResolvedValue({ data: mockReviews, error: null });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await getReviewSummary('campsite-1');

      expect(result.total_count).toBe(3);
      expect(result.rating_distribution).toEqual({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 3 });
      expect(result.rating_percentages).toEqual({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 100 });

      const percentageSum = Object.values(result.rating_percentages).reduce((a, b) => a + b, 0);
      expect(percentageSum).toBe(100);
    });

    it('should round percentages correctly', async () => {
      // 3 reviews: 1/3 = 33.333...% each, should round to 33%
      const mockReviews = [
        { rating_overall: 5, rating_cleanliness: null, rating_staff: null, rating_facilities: null, rating_value: null, rating_location: null },
        { rating_overall: 4, rating_cleanliness: null, rating_staff: null, rating_facilities: null, rating_value: null, rating_location: null },
        { rating_overall: 3, rating_cleanliness: null, rating_staff: null, rating_facilities: null, rating_value: null, rating_location: null },
      ];

      const mockEq2 = jest.fn().mockResolvedValue({ data: mockReviews, error: null });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await getReviewSummary('campsite-1');

      // Each should be rounded to 33%
      expect(result.rating_percentages[5]).toBe(33);
      expect(result.rating_percentages[4]).toBe(33);
      expect(result.rating_percentages[3]).toBe(33);
      expect(result.rating_percentages[2]).toBe(0);
      expect(result.rating_percentages[1]).toBe(0);

      // Due to rounding, sum might be 99% instead of 100%
      const percentageSum = Object.values(result.rating_percentages).reduce((a, b) => a + b, 0);
      expect(percentageSum).toBeLessThanOrEqual(100);
      expect(percentageSum).toBeGreaterThanOrEqual(99);
    });

    it('should handle percentage rounding with 7 reviews', async () => {
      // Test rounding with 7 reviews: different ratings
      const mockReviews = [
        { rating_overall: 5, rating_cleanliness: null, rating_staff: null, rating_facilities: null, rating_value: null, rating_location: null },
        { rating_overall: 5, rating_cleanliness: null, rating_staff: null, rating_facilities: null, rating_value: null, rating_location: null },
        { rating_overall: 5, rating_cleanliness: null, rating_staff: null, rating_facilities: null, rating_value: null, rating_location: null },
        { rating_overall: 4, rating_cleanliness: null, rating_staff: null, rating_facilities: null, rating_value: null, rating_location: null },
        { rating_overall: 4, rating_cleanliness: null, rating_staff: null, rating_facilities: null, rating_value: null, rating_location: null },
        { rating_overall: 3, rating_cleanliness: null, rating_staff: null, rating_facilities: null, rating_value: null, rating_location: null },
        { rating_overall: 2, rating_cleanliness: null, rating_staff: null, rating_facilities: null, rating_value: null, rating_location: null },
      ];

      const mockEq2 = jest.fn().mockResolvedValue({ data: mockReviews, error: null });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await getReviewSummary('campsite-1');

      expect(result.total_count).toBe(7);
      // 3/7 = 42.857...% -> 43%, 2/7 = 28.571...% -> 29%, 1/7 = 14.285...% -> 14%
      expect(result.rating_percentages[5]).toBe(43);
      expect(result.rating_percentages[4]).toBe(29);
      expect(result.rating_percentages[3]).toBe(14);
      expect(result.rating_percentages[2]).toBe(14);
      expect(result.rating_percentages[1]).toBe(0);

      const percentageSum = Object.values(result.rating_percentages).reduce((a, b) => a + b, 0);
      expect(percentageSum).toBe(100);
    });

    it('should return all zeros when no reviews exist', async () => {
      const mockEq2 = jest.fn().mockResolvedValue({ data: [], error: null });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await getReviewSummary('campsite-1');

      expect(result.total_count).toBe(0);
      expect(result.rating_distribution).toEqual({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
      expect(result.rating_percentages).toEqual({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });

      const percentageSum = Object.values(result.rating_percentages).reduce((a, b) => a + b, 0);
      expect(percentageSum).toBe(0);
    });
  });
});
