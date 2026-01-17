import { createReviewSchema, reviewerTypeSchema } from '../../src/schemas/review';
import { ZodError } from 'zod';

describe('Review Submission Schema Validation', () => {
  const validBaseReview = {
    campsite_id: '123e4567-e89b-12d3-a456-426614174000',
    rating_overall: 4,
    reviewer_type: 'family' as const,
    content: 'This is a valid review content that meets the minimum character requirement.',
  };

  describe('valid review submissions', () => {
    it('should accept complete valid review with all fields', () => {
      const validData = {
        ...validBaseReview,
        rating_cleanliness: 5,
        rating_staff: 4,
        rating_facilities: 4,
        rating_value: 5,
        rating_location: 5,
        title: 'Great camping experience',
        pros: 'Beautiful location, friendly staff',
        cons: 'Could use more facilities',
        visited_at: '2024-01-15',
        photo_urls: ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg'],
      };
      const result = createReviewSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept minimal valid review with required fields only', () => {
      const result = createReviewSchema.safeParse(validBaseReview);
      expect(result.success).toBe(true);
    });

    it('should accept review with content at minimum length (20 chars)', () => {
      const validData = {
        ...validBaseReview,
        content: 'a'.repeat(20),
      };
      const result = createReviewSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept review with content at maximum length (2000 chars)', () => {
      const validData = {
        ...validBaseReview,
        content: 'a'.repeat(2000),
      };
      const result = createReviewSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept review with title at maximum length (100 chars)', () => {
      const validData = {
        ...validBaseReview,
        title: 'a'.repeat(100),
      };
      const result = createReviewSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept review without optional title', () => {
      const result = createReviewSchema.safeParse(validBaseReview);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBeUndefined();
      }
    });

    it('should accept review with all sub-ratings', () => {
      const validData = {
        ...validBaseReview,
        rating_cleanliness: 5,
        rating_staff: 4,
        rating_facilities: 3,
        rating_value: 4,
        rating_location: 5,
      };
      const result = createReviewSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept review without sub-ratings', () => {
      const result = createReviewSchema.safeParse(validBaseReview);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.rating_cleanliness).toBeUndefined();
        expect(result.data.rating_staff).toBeUndefined();
        expect(result.data.rating_facilities).toBeUndefined();
        expect(result.data.rating_value).toBeUndefined();
        expect(result.data.rating_location).toBeUndefined();
      }
    });

    it('should accept review with visited_at date', () => {
      const validData = {
        ...validBaseReview,
        visited_at: '2024-01-15',
      };
      const result = createReviewSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept review without visited_at', () => {
      const result = createReviewSchema.safeParse(validBaseReview);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.visited_at).toBeUndefined();
      }
    });
  });

  describe('rating_overall validation', () => {
    it('should accept rating_overall of 1', () => {
      const validData = {
        ...validBaseReview,
        rating_overall: 1,
      };
      const result = createReviewSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept rating_overall of 5', () => {
      const validData = {
        ...validBaseReview,
        rating_overall: 5,
      };
      const result = createReviewSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept rating_overall of 3', () => {
      const validData = {
        ...validBaseReview,
        rating_overall: 3,
      };
      const result = createReviewSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject rating_overall of 0', () => {
      const invalidData = {
        ...validBaseReview,
        rating_overall: 0,
      };
      const result = createReviewSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const ratingErrors = result.error.errors.filter(e => e.path.includes('rating_overall'));
        expect(ratingErrors.length).toBeGreaterThan(0);
      }
    });

    it('should reject rating_overall of 6', () => {
      const invalidData = {
        ...validBaseReview,
        rating_overall: 6,
      };
      const result = createReviewSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const ratingErrors = result.error.errors.filter(e => e.path.includes('rating_overall'));
        expect(ratingErrors.length).toBeGreaterThan(0);
      }
    });

    it('should reject rating_overall with decimal value', () => {
      const invalidData = {
        ...validBaseReview,
        rating_overall: 3.5,
      };
      const result = createReviewSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const ratingErrors = result.error.errors.filter(e => e.path.includes('rating_overall'));
        expect(ratingErrors.length).toBeGreaterThan(0);
      }
    });

    it('should reject missing rating_overall', () => {
      const invalidData = {
        campsite_id: validBaseReview.campsite_id,
        reviewer_type: validBaseReview.reviewer_type,
        content: validBaseReview.content,
      };
      const result = createReviewSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const ratingErrors = result.error.errors.filter(e => e.path.includes('rating_overall'));
        expect(ratingErrors.length).toBeGreaterThan(0);
      }
    });

    it('should reject negative rating_overall', () => {
      const invalidData = {
        ...validBaseReview,
        rating_overall: -1,
      };
      const result = createReviewSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('reviewer_type validation', () => {
    it('should accept reviewer_type "family"', () => {
      const validData = {
        ...validBaseReview,
        reviewer_type: 'family' as const,
      };
      const result = createReviewSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept reviewer_type "couple"', () => {
      const validData = {
        ...validBaseReview,
        reviewer_type: 'couple' as const,
      };
      const result = createReviewSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept reviewer_type "solo"', () => {
      const validData = {
        ...validBaseReview,
        reviewer_type: 'solo' as const,
      };
      const result = createReviewSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept reviewer_type "group"', () => {
      const validData = {
        ...validBaseReview,
        reviewer_type: 'group' as const,
      };
      const result = createReviewSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid reviewer_type', () => {
      const invalidData = {
        ...validBaseReview,
        reviewer_type: 'invalid',
      };
      const result = createReviewSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const typeErrors = result.error.errors.filter(e => e.path.includes('reviewer_type'));
        expect(typeErrors.length).toBeGreaterThan(0);
      }
    });

    it('should reject missing reviewer_type', () => {
      const invalidData = {
        campsite_id: validBaseReview.campsite_id,
        rating_overall: validBaseReview.rating_overall,
        content: validBaseReview.content,
      };
      const result = createReviewSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const typeErrors = result.error.errors.filter(e => e.path.includes('reviewer_type'));
        expect(typeErrors.length).toBeGreaterThan(0);
      }
    });
  });

  describe('content validation', () => {
    it('should accept content with exactly 20 characters', () => {
      const validData = {
        ...validBaseReview,
        content: 'a'.repeat(20),
      };
      const result = createReviewSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept content with exactly 2000 characters', () => {
      const validData = {
        ...validBaseReview,
        content: 'a'.repeat(2000),
      };
      const result = createReviewSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept content with 100 characters', () => {
      const validData = {
        ...validBaseReview,
        content: 'a'.repeat(100),
      };
      const result = createReviewSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject content with 19 characters (too short)', () => {
      const invalidData = {
        ...validBaseReview,
        content: 'a'.repeat(19),
      };
      const result = createReviewSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const contentErrors = result.error.errors.filter(e => e.path.includes('content'));
        expect(contentErrors.length).toBeGreaterThan(0);
        expect(contentErrors[0].message).toBe('Review must be at least 20 characters');
      }
    });

    it('should reject content with 2001 characters (too long)', () => {
      const invalidData = {
        ...validBaseReview,
        content: 'a'.repeat(2001),
      };
      const result = createReviewSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const contentErrors = result.error.errors.filter(e => e.path.includes('content'));
        expect(contentErrors.length).toBeGreaterThan(0);
        expect(contentErrors[0].message).toBe('Review must be 2000 characters or less');
      }
    });

    it('should reject empty content', () => {
      const invalidData = {
        ...validBaseReview,
        content: '',
      };
      const result = createReviewSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const contentErrors = result.error.errors.filter(e => e.path.includes('content'));
        expect(contentErrors.length).toBeGreaterThan(0);
      }
    });

    it('should reject missing content', () => {
      const invalidData = {
        campsite_id: validBaseReview.campsite_id,
        rating_overall: validBaseReview.rating_overall,
        reviewer_type: validBaseReview.reviewer_type,
      };
      const result = createReviewSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const contentErrors = result.error.errors.filter(e => e.path.includes('content'));
        expect(contentErrors.length).toBeGreaterThan(0);
      }
    });

    it('should accept content with Thai characters', () => {
      const validData = {
        ...validBaseReview,
        content: 'สถานที่ดีมาก บรรยากาศดี เหมาะสำหรับครอบครัว แนะนำเลยครับ',
      };
      const result = createReviewSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('title validation', () => {
    it('should accept title with 1 character', () => {
      const validData = {
        ...validBaseReview,
        title: 'a',
      };
      const result = createReviewSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept title with exactly 100 characters', () => {
      const validData = {
        ...validBaseReview,
        title: 'a'.repeat(100),
      };
      const result = createReviewSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject title with 101 characters (too long)', () => {
      const invalidData = {
        ...validBaseReview,
        title: 'a'.repeat(101),
      };
      const result = createReviewSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const titleErrors = result.error.errors.filter(e => e.path.includes('title'));
        expect(titleErrors.length).toBeGreaterThan(0);
        expect(titleErrors[0].message).toBe('Title must be 100 characters or less');
      }
    });

    it('should accept missing title (optional field)', () => {
      const result = createReviewSchema.safeParse(validBaseReview);
      expect(result.success).toBe(true);
    });
  });

  describe('sub-ratings validation', () => {
    it('should accept all sub-ratings with valid values (1-5)', () => {
      const validData = {
        ...validBaseReview,
        rating_cleanliness: 5,
        rating_staff: 4,
        rating_facilities: 3,
        rating_value: 2,
        rating_location: 1,
      };
      const result = createReviewSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject rating_cleanliness of 0', () => {
      const invalidData = {
        ...validBaseReview,
        rating_cleanliness: 0,
      };
      const result = createReviewSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject rating_staff of 6', () => {
      const invalidData = {
        ...validBaseReview,
        rating_staff: 6,
      };
      const result = createReviewSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject rating_facilities with decimal value', () => {
      const invalidData = {
        ...validBaseReview,
        rating_facilities: 3.5,
      };
      const result = createReviewSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject rating_value with negative value', () => {
      const invalidData = {
        ...validBaseReview,
        rating_value: -1,
      };
      const result = createReviewSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject rating_location of 10', () => {
      const invalidData = {
        ...validBaseReview,
        rating_location: 10,
      };
      const result = createReviewSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept review with some sub-ratings missing', () => {
      const validData = {
        ...validBaseReview,
        rating_cleanliness: 5,
        rating_location: 4,
      };
      const result = createReviewSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.rating_cleanliness).toBe(5);
        expect(result.data.rating_location).toBe(4);
        expect(result.data.rating_staff).toBeUndefined();
        expect(result.data.rating_facilities).toBeUndefined();
        expect(result.data.rating_value).toBeUndefined();
      }
    });
  });

  describe('visited_at validation', () => {
    it('should accept valid date string', () => {
      const validData = {
        ...validBaseReview,
        visited_at: '2024-01-15',
      };
      const result = createReviewSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept different date format', () => {
      const validData = {
        ...validBaseReview,
        visited_at: '2024-12-31',
      };
      const result = createReviewSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept missing visited_at (optional field)', () => {
      const result = createReviewSchema.safeParse(validBaseReview);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.visited_at).toBeUndefined();
      }
    });
  });

  describe('campsite_id validation', () => {
    it('should accept valid UUID', () => {
      const validData = {
        ...validBaseReview,
        campsite_id: '550e8400-e29b-41d4-a716-446655440000',
      };
      const result = createReviewSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid UUID format', () => {
      const invalidData = {
        ...validBaseReview,
        campsite_id: 'invalid-uuid',
      };
      const result = createReviewSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const idErrors = result.error.errors.filter(e => e.path.includes('campsite_id'));
        expect(idErrors.length).toBeGreaterThan(0);
        expect(idErrors[0].message).toBe('Invalid campsite ID');
      }
    });

    it('should reject missing campsite_id', () => {
      const invalidData = {
        rating_overall: validBaseReview.rating_overall,
        reviewer_type: validBaseReview.reviewer_type,
        content: validBaseReview.content,
      };
      const result = createReviewSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('parse() method throws on invalid input', () => {
    it('should throw ZodError when review is invalid', () => {
      const invalidData = {
        ...validBaseReview,
        rating_overall: 10,
      };
      expect(() => createReviewSchema.parse(invalidData)).toThrow(ZodError);
    });

    it('should not throw when review is valid', () => {
      expect(() => createReviewSchema.parse(validBaseReview)).not.toThrow();
    });
  });

  describe('error messages', () => {
    it('should provide correct error message for content too short', () => {
      const invalidData = {
        ...validBaseReview,
        content: 'short',
      };
      const result = createReviewSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const contentErrors = result.error.errors.filter(e => e.path.includes('content'));
        expect(contentErrors[0].message).toBe('Review must be at least 20 characters');
      }
    });

    it('should provide correct error message for content too long', () => {
      const invalidData = {
        ...validBaseReview,
        content: 'a'.repeat(2001),
      };
      const result = createReviewSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const contentErrors = result.error.errors.filter(e => e.path.includes('content'));
        expect(contentErrors[0].message).toBe('Review must be 2000 characters or less');
      }
    });

    it('should provide correct error message for title too long', () => {
      const invalidData = {
        ...validBaseReview,
        title: 'a'.repeat(101),
      };
      const result = createReviewSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const titleErrors = result.error.errors.filter(e => e.path.includes('title'));
        expect(titleErrors[0].message).toBe('Title must be 100 characters or less');
      }
    });

    it('should provide correct error message for invalid campsite_id', () => {
      const invalidData = {
        ...validBaseReview,
        campsite_id: 'not-a-uuid',
      };
      const result = createReviewSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const idErrors = result.error.errors.filter(e => e.path.includes('campsite_id'));
        expect(idErrors[0].message).toBe('Invalid campsite ID');
      }
    });
  });

  describe('complex scenarios', () => {
    it('should validate complete review with all optional fields', () => {
      const validData = {
        campsite_id: '123e4567-e89b-12d3-a456-426614174000',
        rating_overall: 5,
        rating_cleanliness: 5,
        rating_staff: 5,
        rating_facilities: 4,
        rating_value: 5,
        rating_location: 5,
        reviewer_type: 'family' as const,
        title: 'Perfect family camping destination',
        content: 'We had an amazing time at this campsite. The facilities were clean, staff was friendly and helpful, and the location was perfect for our family activities. Highly recommended!',
        pros: 'Clean facilities, friendly staff, great location',
        cons: 'Could use more shade in some areas',
        visited_at: '2024-01-20',
        photo_urls: ['https://example.com/photo1.jpg'],
      };
      const result = createReviewSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should handle multiple validation errors simultaneously', () => {
      const invalidData = {
        campsite_id: 'invalid-uuid',
        rating_overall: 0,
        reviewer_type: 'invalid',
        content: 'short',
        title: 'a'.repeat(101),
      };
      const result = createReviewSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.length).toBeGreaterThan(1);
      }
    });
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
    expect(reviewerTypeSchema.safeParse('invalid').success).toBe(false);
  });
});
