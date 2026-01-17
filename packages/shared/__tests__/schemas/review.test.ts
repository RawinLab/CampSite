import {
  reviewQuerySchema,
  reviewSortBySchema,
  reviewerTypeSchema,
  createReviewSchema,
} from '../../src/schemas/review';
import { ZodError } from 'zod';

describe('Review Query Schema Validation', () => {
  describe('valid review queries', () => {
    it('should accept valid query with all parameters', () => {
      const validData = {
        campsite_id: '550e8400-e29b-41d4-a716-446655440000',
        page: 1,
        limit: 10,
        sort_by: 'newest',
        reviewer_type: 'family',
      };
      const result = reviewQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.campsite_id).toBe('550e8400-e29b-41d4-a716-446655440000');
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(10);
        expect(result.data.sort_by).toBe('newest');
        expect(result.data.reviewer_type).toBe('family');
      }
    });

    it('should accept query without optional reviewer_type', () => {
      const validData = {
        campsite_id: '550e8400-e29b-41d4-a716-446655440000',
        page: 1,
        limit: 5,
        sort_by: 'helpful',
      };
      const result = reviewQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.reviewer_type).toBeUndefined();
      }
    });

    it('should apply default page value of 1', () => {
      const validData = {
        campsite_id: '550e8400-e29b-41d4-a716-446655440000',
      };
      const result = reviewQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
      }
    });

    it('should apply default limit value of 5', () => {
      const validData = {
        campsite_id: '550e8400-e29b-41d4-a716-446655440000',
      };
      const result = reviewQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(5);
      }
    });

    it('should apply default sort_by value of "newest"', () => {
      const validData = {
        campsite_id: '550e8400-e29b-41d4-a716-446655440000',
      };
      const result = reviewQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort_by).toBe('newest');
      }
    });

    it('should not override provided values with defaults', () => {
      const validData = {
        campsite_id: '550e8400-e29b-41d4-a716-446655440000',
        page: 3,
        limit: 20,
        sort_by: 'rating_high',
      };
      const result = reviewQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(3);
        expect(result.data.limit).toBe(20);
        expect(result.data.sort_by).toBe('rating_high');
      }
    });
  });

  describe('campsite_id validation', () => {
    it('should accept valid UUID', () => {
      const validData = {
        campsite_id: '550e8400-e29b-41d4-a716-446655440000',
      };
      const result = reviewQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid UUID format', () => {
      const invalidData = {
        campsite_id: 'not-a-valid-uuid',
      };
      const result = reviewQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.errors.filter(e => e.path.includes('campsite_id'));
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].message).toBe('Invalid campsite ID');
      }
    });

    it('should reject empty string campsite_id', () => {
      const invalidData = {
        campsite_id: '',
      };
      const result = reviewQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject missing campsite_id', () => {
      const invalidData = {
        page: 1,
        limit: 5,
      };
      const result = reviewQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.errors.filter(e => e.path.includes('campsite_id'));
        expect(errors.length).toBeGreaterThan(0);
      }
    });
  });

  describe('sort_by validation', () => {
    it('should accept "newest" sort option', () => {
      const validData = {
        campsite_id: '550e8400-e29b-41d4-a716-446655440000',
        sort_by: 'newest',
      };
      const result = reviewQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept "helpful" sort option', () => {
      const validData = {
        campsite_id: '550e8400-e29b-41d4-a716-446655440000',
        sort_by: 'helpful',
      };
      const result = reviewQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept "rating_high" sort option', () => {
      const validData = {
        campsite_id: '550e8400-e29b-41d4-a716-446655440000',
        sort_by: 'rating_high',
      };
      const result = reviewQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept "rating_low" sort option', () => {
      const validData = {
        campsite_id: '550e8400-e29b-41d4-a716-446655440000',
        sort_by: 'rating_low',
      };
      const result = reviewQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid sort option', () => {
      const invalidData = {
        campsite_id: '550e8400-e29b-41d4-a716-446655440000',
        sort_by: 'invalid_sort',
      };
      const result = reviewQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.errors.filter(e => e.path.includes('sort_by'));
        expect(errors.length).toBeGreaterThan(0);
      }
    });

    it('should reject empty string sort option', () => {
      const invalidData = {
        campsite_id: '550e8400-e29b-41d4-a716-446655440000',
        sort_by: '',
      };
      const result = reviewQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('reviewer_type validation', () => {
    it('should accept "family" reviewer type', () => {
      const validData = {
        campsite_id: '550e8400-e29b-41d4-a716-446655440000',
        reviewer_type: 'family',
      };
      const result = reviewQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept "couple" reviewer type', () => {
      const validData = {
        campsite_id: '550e8400-e29b-41d4-a716-446655440000',
        reviewer_type: 'couple',
      };
      const result = reviewQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept "solo" reviewer type', () => {
      const validData = {
        campsite_id: '550e8400-e29b-41d4-a716-446655440000',
        reviewer_type: 'solo',
      };
      const result = reviewQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept "group" reviewer type', () => {
      const validData = {
        campsite_id: '550e8400-e29b-41d4-a716-446655440000',
        reviewer_type: 'group',
      };
      const result = reviewQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid reviewer type', () => {
      const invalidData = {
        campsite_id: '550e8400-e29b-41d4-a716-446655440000',
        reviewer_type: 'invalid_type',
      };
      const result = reviewQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.errors.filter(e => e.path.includes('reviewer_type'));
        expect(errors.length).toBeGreaterThan(0);
      }
    });

    it('should allow reviewer_type to be omitted', () => {
      const validData = {
        campsite_id: '550e8400-e29b-41d4-a716-446655440000',
      };
      const result = reviewQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.reviewer_type).toBeUndefined();
      }
    });
  });

  describe('pagination validation', () => {
    it('should accept page 1', () => {
      const validData = {
        campsite_id: '550e8400-e29b-41d4-a716-446655440000',
        page: 1,
      };
      const result = reviewQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept large page number', () => {
      const validData = {
        campsite_id: '550e8400-e29b-41d4-a716-446655440000',
        page: 999,
      };
      const result = reviewQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should coerce string page to number', () => {
      const validData = {
        campsite_id: '550e8400-e29b-41d4-a716-446655440000',
        page: '5',
      };
      const result = reviewQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data.page).toBe('number');
        expect(result.data.page).toBe(5);
      }
    });

    it('should reject page 0', () => {
      const invalidData = {
        campsite_id: '550e8400-e29b-41d4-a716-446655440000',
        page: 0,
      };
      const result = reviewQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject negative page number', () => {
      const invalidData = {
        campsite_id: '550e8400-e29b-41d4-a716-446655440000',
        page: -1,
      };
      const result = reviewQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject decimal page number', () => {
      const invalidData = {
        campsite_id: '550e8400-e29b-41d4-a716-446655440000',
        page: 2.5,
      };
      const result = reviewQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept limit 1', () => {
      const validData = {
        campsite_id: '550e8400-e29b-41d4-a716-446655440000',
        limit: 1,
      };
      const result = reviewQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept limit 50 (maximum)', () => {
      const validData = {
        campsite_id: '550e8400-e29b-41d4-a716-446655440000',
        limit: 50,
      };
      const result = reviewQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should coerce string limit to number', () => {
      const validData = {
        campsite_id: '550e8400-e29b-41d4-a716-446655440000',
        limit: '20',
      };
      const result = reviewQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data.limit).toBe('number');
        expect(result.data.limit).toBe(20);
      }
    });

    it('should reject limit 0', () => {
      const invalidData = {
        campsite_id: '550e8400-e29b-41d4-a716-446655440000',
        limit: 0,
      };
      const result = reviewQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject limit above maximum (51)', () => {
      const invalidData = {
        campsite_id: '550e8400-e29b-41d4-a716-446655440000',
        limit: 51,
      };
      const result = reviewQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject negative limit', () => {
      const invalidData = {
        campsite_id: '550e8400-e29b-41d4-a716-446655440000',
        limit: -10,
      };
      const result = reviewQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject decimal limit', () => {
      const invalidData = {
        campsite_id: '550e8400-e29b-41d4-a716-446655440000',
        limit: 10.5,
      };
      const result = reviewQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('parse() method throws on invalid input', () => {
    it('should throw ZodError when query is invalid', () => {
      const invalidData = {
        campsite_id: 'invalid-uuid',
      };
      expect(() => reviewQuerySchema.parse(invalidData)).toThrow(ZodError);
    });

    it('should not throw when query is valid', () => {
      const validData = {
        campsite_id: '550e8400-e29b-41d4-a716-446655440000',
        page: 1,
      };
      expect(() => reviewQuerySchema.parse(validData)).not.toThrow();
    });
  });

  describe('complex scenarios', () => {
    it('should handle URL query string format with coercion', () => {
      const validData = {
        campsite_id: '550e8400-e29b-41d4-a716-446655440000',
        page: '2',
        limit: '15',
        sort_by: 'helpful',
        reviewer_type: 'couple',
      };
      const result = reviewQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data.page).toBe('number');
        expect(typeof result.data.limit).toBe('number');
        expect(result.data.page).toBe(2);
        expect(result.data.limit).toBe(15);
      }
    });
  });
});

describe('Review Sort By Schema', () => {
  it('should accept all valid sort options', () => {
    expect(reviewSortBySchema.safeParse('newest').success).toBe(true);
    expect(reviewSortBySchema.safeParse('helpful').success).toBe(true);
    expect(reviewSortBySchema.safeParse('rating_high').success).toBe(true);
    expect(reviewSortBySchema.safeParse('rating_low').success).toBe(true);
  });

  it('should reject invalid sort option', () => {
    expect(reviewSortBySchema.safeParse('invalid').success).toBe(false);
    expect(reviewSortBySchema.safeParse('oldest').success).toBe(false);
    expect(reviewSortBySchema.safeParse('').success).toBe(false);
  });
});

describe('Reviewer Type Schema', () => {
  it('should accept all valid reviewer types', () => {
    expect(reviewerTypeSchema.safeParse('family').success).toBe(true);
    expect(reviewerTypeSchema.safeParse('couple').success).toBe(true);
    expect(reviewerTypeSchema.safeParse('solo').success).toBe(true);
    expect(reviewerTypeSchema.safeParse('group').success).toBe(true);
  });

  it('should reject invalid reviewer type', () => {
    expect(reviewerTypeSchema.safeParse('invalid-type').success).toBe(false);
    expect(reviewerTypeSchema.safeParse('friends').success).toBe(false);
    expect(reviewerTypeSchema.safeParse('').success).toBe(false);
  });
});

describe('Create Review Schema Validation', () => {
  const validReviewBase = {
    campsite_id: '550e8400-e29b-41d4-a716-446655440000',
    rating_overall: 4,
    reviewer_type: 'family' as const,
    content: 'This is a valid review with at least 20 characters of content.',
  };

  describe('valid review submissions', () => {
    it('should accept complete valid review with all fields', () => {
      const validData = {
        ...validReviewBase,
        rating_cleanliness: 5,
        rating_staff: 4,
        rating_facilities: 3,
        rating_value: 4,
        rating_location: 5,
        title: 'Great camping experience',
        pros: 'Beautiful location, friendly staff',
        cons: 'Limited facilities',
        visited_at: '2024-01-15',
        photo_urls: ['https://example.com/photo1.jpg'],
      };
      const result = createReviewSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept review with only required fields', () => {
      const result = createReviewSchema.safeParse(validReviewBase);
      expect(result.success).toBe(true);
    });

    it('should accept maximum 5 photos', () => {
      const validData = {
        ...validReviewBase,
        photo_urls: [
          'https://example.com/1.jpg',
          'https://example.com/2.jpg',
          'https://example.com/3.jpg',
          'https://example.com/4.jpg',
          'https://example.com/5.jpg',
        ],
      };
      const result = createReviewSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('required fields validation', () => {
    it('should reject review without campsite_id', () => {
      const invalidData = {
        rating_overall: 4,
        reviewer_type: 'family',
        content: 'This is a valid review with at least 20 characters.',
      };
      const result = createReviewSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject review without rating_overall', () => {
      const invalidData = {
        campsite_id: '550e8400-e29b-41d4-a716-446655440000',
        reviewer_type: 'family',
        content: 'This is a valid review with at least 20 characters.',
      };
      const result = createReviewSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject review without reviewer_type', () => {
      const invalidData = {
        campsite_id: '550e8400-e29b-41d4-a716-446655440000',
        rating_overall: 4,
        content: 'This is a valid review with at least 20 characters.',
      };
      const result = createReviewSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject review without content', () => {
      const invalidData = {
        campsite_id: '550e8400-e29b-41d4-a716-446655440000',
        rating_overall: 4,
        reviewer_type: 'family',
      };
      const result = createReviewSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('rating validation', () => {
    it('should accept rating_overall between 1 and 5', () => {
      [1, 2, 3, 4, 5].forEach(rating => {
        const validData = {
          ...validReviewBase,
          rating_overall: rating,
        };
        const result = createReviewSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });
    });

    it('should reject rating_overall below 1', () => {
      const invalidData = {
        ...validReviewBase,
        rating_overall: 0,
      };
      const result = createReviewSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject rating_overall above 5', () => {
      const invalidData = {
        ...validReviewBase,
        rating_overall: 6,
      };
      const result = createReviewSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject decimal rating_overall', () => {
      const invalidData = {
        ...validReviewBase,
        rating_overall: 3.5,
      };
      const result = createReviewSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept optional ratings within valid range', () => {
      const validData = {
        ...validReviewBase,
        rating_cleanliness: 4,
        rating_staff: 5,
        rating_facilities: 3,
        rating_value: 2,
        rating_location: 5,
      };
      const result = createReviewSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject optional rating below 1', () => {
      const invalidData = {
        ...validReviewBase,
        rating_cleanliness: 0,
      };
      const result = createReviewSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject optional rating above 5', () => {
      const invalidData = {
        ...validReviewBase,
        rating_staff: 6,
      };
      const result = createReviewSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('content validation', () => {
    it('should accept content at minimum length (20 chars)', () => {
      const validData = {
        ...validReviewBase,
        content: 'a'.repeat(20),
      };
      const result = createReviewSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept content at maximum length (2000 chars)', () => {
      const validData = {
        ...validReviewBase,
        content: 'a'.repeat(2000),
      };
      const result = createReviewSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject content below minimum length', () => {
      const invalidData = {
        ...validReviewBase,
        content: 'Too short',
      };
      const result = createReviewSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.errors.filter(e => e.path.includes('content'));
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].message).toBe('Review must be at least 20 characters');
      }
    });

    it('should reject content exceeding maximum length', () => {
      const invalidData = {
        ...validReviewBase,
        content: 'a'.repeat(2001),
      };
      const result = createReviewSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.errors.filter(e => e.path.includes('content'));
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].message).toBe('Review must be 2000 characters or less');
      }
    });
  });

  describe('optional fields validation', () => {
    it('should accept title up to 100 characters', () => {
      const validData = {
        ...validReviewBase,
        title: 'a'.repeat(100),
      };
      const result = createReviewSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject title exceeding 100 characters', () => {
      const invalidData = {
        ...validReviewBase,
        title: 'a'.repeat(101),
      };
      const result = createReviewSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept pros up to 500 characters', () => {
      const validData = {
        ...validReviewBase,
        pros: 'a'.repeat(500),
      };
      const result = createReviewSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject pros exceeding 500 characters', () => {
      const invalidData = {
        ...validReviewBase,
        pros: 'a'.repeat(501),
      };
      const result = createReviewSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept cons up to 500 characters', () => {
      const validData = {
        ...validReviewBase,
        cons: 'a'.repeat(500),
      };
      const result = createReviewSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject cons exceeding 500 characters', () => {
      const invalidData = {
        ...validReviewBase,
        cons: 'a'.repeat(501),
      };
      const result = createReviewSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject more than 5 photos', () => {
      const invalidData = {
        ...validReviewBase,
        photo_urls: [
          'https://example.com/1.jpg',
          'https://example.com/2.jpg',
          'https://example.com/3.jpg',
          'https://example.com/4.jpg',
          'https://example.com/5.jpg',
          'https://example.com/6.jpg',
        ],
      };
      const result = createReviewSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.errors.filter(e => e.path.includes('photo_urls'));
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].message).toBe('Maximum 5 photos allowed');
      }
    });

    it('should reject invalid photo URL format', () => {
      const invalidData = {
        ...validReviewBase,
        photo_urls: ['not-a-valid-url'],
      };
      const result = createReviewSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
