import {
  addToWishlistSchema,
  wishlistQuerySchema,
  batchWishlistCheckSchema,
  compareCampsitesSchema,
} from '../../src/schemas/wishlist';
import { ZodError } from 'zod';

describe('Add to Wishlist Schema Validation', () => {
  describe('valid wishlist data', () => {
    it('should accept valid wishlist item with all fields', () => {
      const validData = {
        campsite_id: '550e8400-e29b-41d4-a716-446655440000',
        notes: 'Want to visit this campsite next summer',
      };
      const result = addToWishlistSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.campsite_id).toBe('550e8400-e29b-41d4-a716-446655440000');
        expect(result.data.notes).toBe('Want to visit this campsite next summer');
      }
    });

    it('should accept wishlist item without optional notes', () => {
      const validData = {
        campsite_id: '550e8400-e29b-41d4-a716-446655440000',
      };
      const result = addToWishlistSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.notes).toBeUndefined();
      }
    });

    it('should accept notes at maximum length (500 chars)', () => {
      const validData = {
        campsite_id: '550e8400-e29b-41d4-a716-446655440000',
        notes: 'a'.repeat(500),
      };
      const result = addToWishlistSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept empty string notes', () => {
      const validData = {
        campsite_id: '550e8400-e29b-41d4-a716-446655440000',
        notes: '',
      };
      const result = addToWishlistSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('campsite_id validation', () => {
    it('should accept valid UUID', () => {
      const validData = {
        campsite_id: '123e4567-e89b-12d3-a456-426614174000',
      };
      const result = addToWishlistSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid UUID format', () => {
      const invalidData = {
        campsite_id: 'not-a-valid-uuid',
      };
      const result = addToWishlistSchema.safeParse(invalidData);
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
      const result = addToWishlistSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject missing campsite_id', () => {
      const invalidData = {
        notes: 'Some notes',
      };
      const result = addToWishlistSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.errors.filter(e => e.path.includes('campsite_id'));
        expect(errors.length).toBeGreaterThan(0);
      }
    });
  });

  describe('notes validation', () => {
    it('should reject notes exceeding maximum length', () => {
      const invalidData = {
        campsite_id: '550e8400-e29b-41d4-a716-446655440000',
        notes: 'a'.repeat(501),
      };
      const result = addToWishlistSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.errors.filter(e => e.path.includes('notes'));
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].message).toBe('Notes must be 500 characters or less');
      }
    });
  });

  describe('parse() method throws on invalid input', () => {
    it('should throw ZodError when data is invalid', () => {
      const invalidData = {
        campsite_id: 'invalid-uuid',
      };
      expect(() => addToWishlistSchema.parse(invalidData)).toThrow(ZodError);
    });

    it('should not throw when data is valid', () => {
      const validData = {
        campsite_id: '550e8400-e29b-41d4-a716-446655440000',
      };
      expect(() => addToWishlistSchema.parse(validData)).not.toThrow();
    });
  });
});

describe('Wishlist Query Schema Validation', () => {
  describe('valid query parameters', () => {
    it('should accept valid query with all parameters', () => {
      const validData = {
        page: 2,
        limit: 30,
        sort: 'name',
      };
      const result = wishlistQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(2);
        expect(result.data.limit).toBe(30);
        expect(result.data.sort).toBe('name');
      }
    });

    it('should apply default page value of 1', () => {
      const validData = {};
      const result = wishlistQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
      }
    });

    it('should apply default limit value of 20', () => {
      const validData = {};
      const result = wishlistQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(20);
      }
    });

    it('should apply default sort value of "newest"', () => {
      const validData = {};
      const result = wishlistQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort).toBe('newest');
      }
    });

    it('should not override provided values with defaults', () => {
      const validData = {
        page: 5,
        limit: 10,
        sort: 'oldest',
      };
      const result = wishlistQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(5);
        expect(result.data.limit).toBe(10);
        expect(result.data.sort).toBe('oldest');
      }
    });
  });

  describe('page validation', () => {
    it('should accept page 1', () => {
      const validData = { page: 1 };
      const result = wishlistQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept large page number', () => {
      const validData = { page: 999 };
      const result = wishlistQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should coerce string page to number', () => {
      const validData = { page: '3' };
      const result = wishlistQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data.page).toBe('number');
        expect(result.data.page).toBe(3);
      }
    });

    it('should reject page 0', () => {
      const invalidData = { page: 0 };
      const result = wishlistQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject negative page number', () => {
      const invalidData = { page: -1 };
      const result = wishlistQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject decimal page number', () => {
      const invalidData = { page: 2.5 };
      const result = wishlistQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('limit validation', () => {
    it('should accept limit 1 (minimum)', () => {
      const validData = { limit: 1 };
      const result = wishlistQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept limit 50 (maximum)', () => {
      const validData = { limit: 50 };
      const result = wishlistQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should coerce string limit to number', () => {
      const validData = { limit: '25' };
      const result = wishlistQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data.limit).toBe('number');
        expect(result.data.limit).toBe(25);
      }
    });

    it('should reject limit 0', () => {
      const invalidData = { limit: 0 };
      const result = wishlistQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject limit above maximum (51)', () => {
      const invalidData = { limit: 51 };
      const result = wishlistQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject negative limit', () => {
      const invalidData = { limit: -10 };
      const result = wishlistQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject decimal limit', () => {
      const invalidData = { limit: 10.5 };
      const result = wishlistQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('sort validation', () => {
    it('should accept "newest" sort option', () => {
      const validData = { sort: 'newest' };
      const result = wishlistQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept "oldest" sort option', () => {
      const validData = { sort: 'oldest' };
      const result = wishlistQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept "name" sort option', () => {
      const validData = { sort: 'name' };
      const result = wishlistQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid sort option', () => {
      const invalidData = { sort: 'invalid_sort' };
      const result = wishlistQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.errors.filter(e => e.path.includes('sort'));
        expect(errors.length).toBeGreaterThan(0);
      }
    });

    it('should reject empty string sort option', () => {
      const invalidData = { sort: '' };
      const result = wishlistQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('complex scenarios', () => {
    it('should handle URL query string format with coercion', () => {
      const validData = {
        page: '4',
        limit: '15',
        sort: 'oldest',
      };
      const result = wishlistQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data.page).toBe('number');
        expect(typeof result.data.limit).toBe('number');
        expect(result.data.page).toBe(4);
        expect(result.data.limit).toBe(15);
      }
    });
  });
});

describe('Batch Wishlist Check Schema Validation', () => {
  describe('valid batch check data', () => {
    it('should accept valid array of UUIDs', () => {
      const validData = {
        campsite_ids: [
          '550e8400-e29b-41d4-a716-446655440000',
          '123e4567-e89b-12d3-a456-426614174000',
        ],
      };
      const result = batchWishlistCheckSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.campsite_ids).toHaveLength(2);
      }
    });

    it('should accept minimum 1 campsite ID', () => {
      const validData = {
        campsite_ids: ['550e8400-e29b-41d4-a716-446655440000'],
      };
      const result = batchWishlistCheckSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept maximum 50 campsite IDs', () => {
      const validData = {
        campsite_ids: Array(50).fill('550e8400-e29b-41d4-a716-446655440000'),
      };
      const result = batchWishlistCheckSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.campsite_ids).toHaveLength(50);
      }
    });
  });

  describe('campsite_ids validation', () => {
    it('should reject empty array', () => {
      const invalidData = {
        campsite_ids: [],
      };
      const result = batchWishlistCheckSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.errors.filter(e => e.path.includes('campsite_ids'));
        expect(errors.length).toBeGreaterThan(0);
      }
    });

    it('should reject array with more than 50 IDs', () => {
      const invalidData = {
        campsite_ids: Array(51).fill('550e8400-e29b-41d4-a716-446655440000'),
      };
      const result = batchWishlistCheckSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.errors.filter(e => e.path.includes('campsite_ids'));
        expect(errors.length).toBeGreaterThan(0);
      }
    });

    it('should reject array containing invalid UUID', () => {
      const invalidData = {
        campsite_ids: [
          '550e8400-e29b-41d4-a716-446655440000',
          'not-a-valid-uuid',
        ],
      };
      const result = batchWishlistCheckSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject missing campsite_ids', () => {
      const invalidData = {};
      const result = batchWishlistCheckSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.errors.filter(e => e.path.includes('campsite_ids'));
        expect(errors.length).toBeGreaterThan(0);
      }
    });

    it('should reject non-array campsite_ids', () => {
      const invalidData = {
        campsite_ids: '550e8400-e29b-41d4-a716-446655440000',
      };
      const result = batchWishlistCheckSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('parse() method throws on invalid input', () => {
    it('should throw ZodError when data is invalid', () => {
      const invalidData = {
        campsite_ids: [],
      };
      expect(() => batchWishlistCheckSchema.parse(invalidData)).toThrow(ZodError);
    });

    it('should not throw when data is valid', () => {
      const validData = {
        campsite_ids: ['550e8400-e29b-41d4-a716-446655440000'],
      };
      expect(() => batchWishlistCheckSchema.parse(validData)).not.toThrow();
    });
  });
});

describe('Compare Campsites Schema Validation', () => {
  describe('valid comparison data', () => {
    it('should accept 2 valid UUIDs', () => {
      const validData = {
        ids: '550e8400-e29b-41d4-a716-446655440000,123e4567-e89b-12d3-a456-426614174000',
      };
      const result = compareCampsitesSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ids).toHaveLength(2);
        expect(result.data.ids[0]).toBe('550e8400-e29b-41d4-a716-446655440000');
        expect(result.data.ids[1]).toBe('123e4567-e89b-12d3-a456-426614174000');
      }
    });

    it('should accept 3 valid UUIDs (maximum)', () => {
      const validData = {
        ids: '550e8400-e29b-41d4-a716-446655440000,123e4567-e89b-12d3-a456-426614174000,7c9e6679-7425-40de-944b-e07fc1f90ae7',
      };
      const result = compareCampsitesSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ids).toHaveLength(3);
      }
    });

    it('should filter out empty strings from comma-separated list', () => {
      const validData = {
        ids: '550e8400-e29b-41d4-a716-446655440000,,123e4567-e89b-12d3-a456-426614174000',
      };
      const result = compareCampsitesSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ids).toHaveLength(2);
      }
    });

    it('should transform string to array of IDs', () => {
      const validData = {
        ids: '550e8400-e29b-41d4-a716-446655440000,123e4567-e89b-12d3-a456-426614174000',
      };
      const result = compareCampsitesSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(Array.isArray(result.data.ids)).toBe(true);
      }
    });
  });

  describe('ids validation', () => {
    it('should reject single ID (minimum 2 required)', () => {
      const invalidData = {
        ids: '550e8400-e29b-41d4-a716-446655440000',
      };
      expect(() => compareCampsitesSchema.parse(invalidData)).toThrow('At least 2 campsite IDs required');
    });

    it('should reject more than 3 IDs', () => {
      const invalidData = {
        ids: '550e8400-e29b-41d4-a716-446655440000,123e4567-e89b-12d3-a456-426614174000,7c9e6679-7425-40de-944b-e07fc1f90ae7,f47ac10b-58cc-4372-a567-0e02b2c3d479',
      };
      expect(() => compareCampsitesSchema.parse(invalidData)).toThrow('Maximum 3 campsites can be compared');
    });

    it('should reject invalid UUID format', () => {
      const invalidData = {
        ids: '550e8400-e29b-41d4-a716-446655440000,not-a-valid-uuid',
      };
      expect(() => compareCampsitesSchema.parse(invalidData)).toThrow('Invalid campsite ID: not-a-valid-uuid');
    });

    it('should reject empty string', () => {
      const invalidData = {
        ids: '',
      };
      expect(() => compareCampsitesSchema.parse(invalidData)).toThrow('At least 2 campsite IDs required');
    });

    it('should reject missing ids field', () => {
      const invalidData = {};
      const result = compareCampsitesSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.errors.filter(e => e.path.includes('ids'));
        expect(errors.length).toBeGreaterThan(0);
      }
    });

    it('should validate all UUIDs in the list', () => {
      const invalidData = {
        ids: 'invalid-uuid-1,invalid-uuid-2',
      };
      expect(() => compareCampsitesSchema.parse(invalidData)).toThrow('Invalid campsite ID: invalid-uuid-1');
    });
  });

  describe('parse() method throws on invalid input', () => {
    it('should throw Error when data is invalid', () => {
      const invalidData = {
        ids: 'single-id',
      };
      expect(() => compareCampsitesSchema.parse(invalidData)).toThrow(Error);
      expect(() => compareCampsitesSchema.parse(invalidData)).toThrow('At least 2 campsite IDs required');
    });

    it('should not throw when data is valid', () => {
      const validData = {
        ids: '550e8400-e29b-41d4-a716-446655440000,123e4567-e89b-12d3-a456-426614174000',
      };
      expect(() => compareCampsitesSchema.parse(validData)).not.toThrow();
    });
  });
});
