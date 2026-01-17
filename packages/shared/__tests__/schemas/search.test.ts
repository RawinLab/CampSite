import { searchQuerySchema, sortOptionsSchema, campsiteTypeFilterSchema, SEARCH_DEFAULTS } from '../../src/schemas/search';
import { ZodError } from 'zod';

describe('Search Query Schema Validation', () => {
  describe('valid search queries', () => {
    it('should accept empty search query with defaults applied', () => {
      const result = searchQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(12);
        expect(result.data.sort).toBe('rating');
      }
    });

    it('should accept complete valid search query', () => {
      const validData = {
        q: 'beach camping',
        provinceId: 42,
        types: ['camping', 'glamping'],
        minPrice: 500,
        maxPrice: 2000,
        amenities: ['wifi', 'parking'],
        minRating: 4,
        sort: 'price_asc',
        page: 2,
        limit: 24,
        featured: true,
      };
      const result = searchQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept query with text search only', () => {
      const validData = {
        q: 'mountain camping',
      };
      const result = searchQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept query with province filter', () => {
      const validData = {
        provinceId: 1,
      };
      const result = searchQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept query with province slug filter', () => {
      const validData = {
        provinceSlug: 'chiang-mai',
      };
      const result = searchQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept maximum text search length (200 chars)', () => {
      const validData = {
        q: 'a'.repeat(200),
      };
      const result = searchQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept featured filter as boolean', () => {
      const validData = {
        featured: true,
      };
      const result = searchQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.featured).toBe(true);
      }
    });

    it('should accept featured filter as string "true"', () => {
      const validData = {
        featured: 'true',
      };
      const result = searchQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.featured).toBe(true);
      }
    });

    it('should transform featured string "false" to false', () => {
      const validData = {
        featured: 'false',
      };
      const result = searchQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.featured).toBe(false);
      }
    });
  });

  describe('default values', () => {
    it('should apply default page value of 1', () => {
      const result = searchQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(SEARCH_DEFAULTS.PAGE);
      }
    });

    it('should apply default limit value of 12', () => {
      const result = searchQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(SEARCH_DEFAULTS.LIMIT);
      }
    });

    it('should apply default sort value of "rating"', () => {
      const result = searchQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort).toBe(SEARCH_DEFAULTS.SORT);
      }
    });

    it('should not override provided values with defaults', () => {
      const validData = {
        page: 5,
        limit: 20,
        sort: 'price_desc',
      };
      const result = searchQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(5);
        expect(result.data.limit).toBe(20);
        expect(result.data.sort).toBe('price_desc');
      }
    });
  });

  describe('province ID validation', () => {
    it('should accept positive province ID', () => {
      const validData = {
        provinceId: 42,
      };
      const result = searchQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should coerce string province ID to number', () => {
      const validData = {
        provinceId: '42',
      };
      const result = searchQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.provinceId).toBe(42);
        expect(typeof result.data.provinceId).toBe('number');
      }
    });

    it('should reject zero province ID', () => {
      const invalidData = {
        provinceId: 0,
      };
      const result = searchQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const provinceErrors = result.error.errors.filter(e => e.path.includes('provinceId'));
        expect(provinceErrors.length).toBeGreaterThan(0);
      }
    });

    it('should reject negative province ID', () => {
      const invalidData = {
        provinceId: -5,
      };
      const result = searchQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const provinceErrors = result.error.errors.filter(e => e.path.includes('provinceId'));
        expect(provinceErrors.length).toBeGreaterThan(0);
      }
    });

    it('should reject decimal province ID', () => {
      const invalidData = {
        provinceId: 3.14,
      };
      const result = searchQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const provinceErrors = result.error.errors.filter(e => e.path.includes('provinceId'));
        expect(provinceErrors.length).toBeGreaterThan(0);
      }
    });
  });

  describe('campsite types validation', () => {
    it('should accept valid single campsite type', () => {
      const validData = {
        types: ['camping'],
      };
      const result = searchQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept multiple valid campsite types', () => {
      const validData = {
        types: ['camping', 'glamping', 'tented-resort'],
      };
      const result = searchQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept all valid campsite types', () => {
      const validData = {
        types: ['camping', 'glamping', 'tented-resort', 'bungalow', 'cabin', 'rv-caravan'],
      };
      const result = searchQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should transform comma-separated string to array', () => {
      const validData = {
        types: 'camping,glamping,bungalow',
      };
      const result = searchQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(Array.isArray(result.data.types)).toBe(true);
        expect(result.data.types).toEqual(['camping', 'glamping', 'bungalow']);
      }
    });

    it('should handle single type as string', () => {
      const validData = {
        types: 'camping',
      };
      const result = searchQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(Array.isArray(result.data.types)).toBe(true);
        expect(result.data.types).toEqual(['camping']);
      }
    });

    it('should reject invalid campsite type', () => {
      const invalidData = {
        types: ['invalid-type'],
      };
      const result = searchQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject mix of valid and invalid types', () => {
      const invalidData = {
        types: ['camping', 'invalid-type', 'glamping'],
      };
      const result = searchQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('price range validation', () => {
    it('should accept valid price range', () => {
      const validData = {
        minPrice: 500,
        maxPrice: 2000,
      };
      const result = searchQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept equal min and max prices', () => {
      const validData = {
        minPrice: 1000,
        maxPrice: 1000,
      };
      const result = searchQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept zero as minimum price', () => {
      const validData = {
        minPrice: 0,
        maxPrice: 1000,
      };
      const result = searchQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept maximum allowed price (100000)', () => {
      const validData = {
        minPrice: 0,
        maxPrice: 100000,
      };
      const result = searchQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should coerce string prices to numbers', () => {
      const validData = {
        minPrice: '500',
        maxPrice: '2000',
      };
      const result = searchQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data.minPrice).toBe('number');
        expect(typeof result.data.maxPrice).toBe('number');
        expect(result.data.minPrice).toBe(500);
        expect(result.data.maxPrice).toBe(2000);
      }
    });

    it('should reject negative minimum price', () => {
      const invalidData = {
        minPrice: -100,
      };
      const result = searchQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject negative maximum price', () => {
      const invalidData = {
        maxPrice: -100,
      };
      const result = searchQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject minimum price above maximum allowed', () => {
      const invalidData = {
        minPrice: 100001,
      };
      const result = searchQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject maximum price above maximum allowed', () => {
      const invalidData = {
        maxPrice: 100001,
      };
      const result = searchQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept minPrice only without maxPrice', () => {
      const validData = {
        minPrice: 500,
      };
      const result = searchQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept maxPrice only without minPrice', () => {
      const validData = {
        maxPrice: 2000,
      };
      const result = searchQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('amenity IDs validation', () => {
    it('should accept single amenity', () => {
      const validData = {
        amenities: ['wifi'],
      };
      const result = searchQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept multiple amenities', () => {
      const validData = {
        amenities: ['wifi', 'parking', 'shower'],
      };
      const result = searchQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should transform comma-separated string to array', () => {
      const validData = {
        amenities: 'wifi,parking,shower',
      };
      const result = searchQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(Array.isArray(result.data.amenities)).toBe(true);
        expect(result.data.amenities).toEqual(['wifi', 'parking', 'shower']);
      }
    });

    it('should handle single amenity as string', () => {
      const validData = {
        amenities: 'wifi',
      };
      const result = searchQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(Array.isArray(result.data.amenities)).toBe(true);
        expect(result.data.amenities).toEqual(['wifi']);
      }
    });

    it('should accept numeric string amenity IDs', () => {
      const validData = {
        amenities: ['1', '2', '3'],
      };
      const result = searchQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept empty amenities array', () => {
      const validData = {
        amenities: [],
      };
      const result = searchQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('sort options validation', () => {
    it('should accept "rating" sort option', () => {
      const validData = {
        sort: 'rating',
      };
      const result = searchQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept "price_asc" sort option', () => {
      const validData = {
        sort: 'price_asc',
      };
      const result = searchQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept "price_desc" sort option', () => {
      const validData = {
        sort: 'price_desc',
      };
      const result = searchQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept "newest" sort option', () => {
      const validData = {
        sort: 'newest',
      };
      const result = searchQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid sort option', () => {
      const invalidData = {
        sort: 'invalid-sort',
      };
      const result = searchQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject empty string sort option', () => {
      const invalidData = {
        sort: '',
      };
      const result = searchQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject numeric sort option', () => {
      const invalidData = {
        sort: 123,
      };
      const result = searchQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('pagination validation', () => {
    it('should accept page 1', () => {
      const validData = {
        page: 1,
      };
      const result = searchQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept large page number', () => {
      const validData = {
        page: 9999,
      };
      const result = searchQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should coerce string page to number', () => {
      const validData = {
        page: '5',
      };
      const result = searchQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data.page).toBe('number');
        expect(result.data.page).toBe(5);
      }
    });

    it('should reject page 0', () => {
      const invalidData = {
        page: 0,
      };
      const result = searchQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject negative page number', () => {
      const invalidData = {
        page: -1,
      };
      const result = searchQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject decimal page number', () => {
      const invalidData = {
        page: 2.5,
      };
      const result = searchQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept limit 1', () => {
      const validData = {
        limit: 1,
      };
      const result = searchQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept limit 50 (maximum)', () => {
      const validData = {
        limit: 50,
      };
      const result = searchQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should coerce string limit to number', () => {
      const validData = {
        limit: '24',
      };
      const result = searchQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data.limit).toBe('number');
        expect(result.data.limit).toBe(24);
      }
    });

    it('should reject limit 0', () => {
      const invalidData = {
        limit: 0,
      };
      const result = searchQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject limit above maximum (51)', () => {
      const invalidData = {
        limit: 51,
      };
      const result = searchQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject negative limit', () => {
      const invalidData = {
        limit: -10,
      };
      const result = searchQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject decimal limit', () => {
      const invalidData = {
        limit: 12.5,
      };
      const result = searchQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('rating validation', () => {
    it('should accept minimum rating 0', () => {
      const validData = {
        minRating: 0,
      };
      const result = searchQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept maximum rating 5', () => {
      const validData = {
        minRating: 5,
      };
      const result = searchQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept decimal rating', () => {
      const validData = {
        minRating: 4.5,
      };
      const result = searchQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should coerce string rating to number', () => {
      const validData = {
        minRating: '4',
      };
      const result = searchQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data.minRating).toBe('number');
        expect(result.data.minRating).toBe(4);
      }
    });

    it('should reject rating below 0', () => {
      const invalidData = {
        minRating: -1,
      };
      const result = searchQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject rating above 5', () => {
      const invalidData = {
        minRating: 6,
      };
      const result = searchQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('text search validation', () => {
    it('should accept short search query', () => {
      const validData = {
        q: 'beach',
      };
      const result = searchQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept long search query (200 chars)', () => {
      const validData = {
        q: 'a'.repeat(200),
      };
      const result = searchQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject search query exceeding 200 chars', () => {
      const invalidData = {
        q: 'a'.repeat(201),
      };
      const result = searchQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept search query with special characters', () => {
      const validData = {
        q: 'beach & mountains (Thailand)',
      };
      const result = searchQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept search query with Thai characters', () => {
      const validData = {
        q: 'แคมป์ปิ้ง ภูเขา',
      };
      const result = searchQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('province slug validation', () => {
    it('should accept valid province slug', () => {
      const validData = {
        provinceSlug: 'chiang-mai',
      };
      const result = searchQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept province slug at maximum length (100 chars)', () => {
      const validData = {
        provinceSlug: 'a'.repeat(100),
      };
      const result = searchQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject province slug exceeding 100 chars', () => {
      const invalidData = {
        provinceSlug: 'a'.repeat(101),
      };
      const result = searchQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('error messages', () => {
    it('should provide clear error for invalid sort option', () => {
      const invalidData = {
        sort: 'invalid',
      };
      const result = searchQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const sortErrors = result.error.errors.filter(e => e.path.includes('sort'));
        expect(sortErrors.length).toBeGreaterThan(0);
      }
    });

    it('should provide clear error for invalid campsite type', () => {
      const invalidData = {
        types: ['invalid-type'],
      };
      const result = searchQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const typeErrors = result.error.errors.filter(e => e.path.includes('types'));
        expect(typeErrors.length).toBeGreaterThan(0);
      }
    });

    it('should provide clear error for invalid page number', () => {
      const invalidData = {
        page: 0,
      };
      const result = searchQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const pageErrors = result.error.errors.filter(e => e.path.includes('page'));
        expect(pageErrors.length).toBeGreaterThan(0);
      }
    });

    it('should provide clear error for invalid limit', () => {
      const invalidData = {
        limit: 51,
      };
      const result = searchQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const limitErrors = result.error.errors.filter(e => e.path.includes('limit'));
        expect(limitErrors.length).toBeGreaterThan(0);
      }
    });
  });

  describe('parse() method throws on invalid input', () => {
    it('should throw ZodError when query is invalid', () => {
      const invalidData = {
        page: -1,
      };
      expect(() => searchQuerySchema.parse(invalidData)).toThrow(ZodError);
    });

    it('should not throw when query is valid', () => {
      const validData = {
        q: 'camping',
        page: 1,
      };
      expect(() => searchQuerySchema.parse(validData)).not.toThrow();
    });
  });

  describe('complex scenarios', () => {
    it('should accept complete search with all filters', () => {
      const validData = {
        q: 'family camping',
        provinceId: 10,
        types: 'camping,glamping',
        minPrice: 500,
        maxPrice: 3000,
        amenities: 'wifi,parking,shower',
        minRating: 4,
        sort: 'rating',
        page: 2,
        limit: 20,
        featured: 'true',
      };
      const result = searchQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.q).toBe('family camping');
        expect(result.data.provinceId).toBe(10);
        expect(result.data.types).toEqual(['camping', 'glamping']);
        expect(result.data.minPrice).toBe(500);
        expect(result.data.maxPrice).toBe(3000);
        expect(result.data.amenities).toEqual(['wifi', 'parking', 'shower']);
        expect(result.data.minRating).toBe(4);
        expect(result.data.sort).toBe('rating');
        expect(result.data.page).toBe(2);
        expect(result.data.limit).toBe(20);
        expect(result.data.featured).toBe(true);
      }
    });

    it('should handle URL query string format', () => {
      const validData = {
        q: 'beach',
        provinceId: '15',
        types: 'camping,glamping',
        minPrice: '1000',
        maxPrice: '2000',
        page: '3',
        limit: '24',
      };
      const result = searchQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data.provinceId).toBe('number');
        expect(typeof result.data.minPrice).toBe('number');
        expect(typeof result.data.maxPrice).toBe('number');
        expect(typeof result.data.page).toBe('number');
        expect(typeof result.data.limit).toBe('number');
      }
    });
  });
});

describe('Sort Options Schema', () => {
  it('should accept all valid sort options', () => {
    expect(sortOptionsSchema.safeParse('rating').success).toBe(true);
    expect(sortOptionsSchema.safeParse('price_asc').success).toBe(true);
    expect(sortOptionsSchema.safeParse('price_desc').success).toBe(true);
    expect(sortOptionsSchema.safeParse('newest').success).toBe(true);
  });

  it('should reject invalid sort option', () => {
    expect(sortOptionsSchema.safeParse('invalid').success).toBe(false);
  });
});

describe('Campsite Type Filter Schema', () => {
  it('should accept all valid campsite types', () => {
    expect(campsiteTypeFilterSchema.safeParse('camping').success).toBe(true);
    expect(campsiteTypeFilterSchema.safeParse('glamping').success).toBe(true);
    expect(campsiteTypeFilterSchema.safeParse('tented-resort').success).toBe(true);
    expect(campsiteTypeFilterSchema.safeParse('bungalow').success).toBe(true);
    expect(campsiteTypeFilterSchema.safeParse('cabin').success).toBe(true);
    expect(campsiteTypeFilterSchema.safeParse('rv-caravan').success).toBe(true);
  });

  it('should reject invalid campsite type', () => {
    expect(campsiteTypeFilterSchema.safeParse('invalid-type').success).toBe(false);
  });
});
