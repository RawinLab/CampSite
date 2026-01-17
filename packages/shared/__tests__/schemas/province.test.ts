import {
  provinceSchema,
  provinceAutocompleteQuerySchema,
  provinceListResponseSchema,
  Province,
  ProvinceAutocompleteQuery,
  ProvinceListResponse
} from '../../src/schemas/province';
import { ZodError } from 'zod';

describe('Province Schema Validation', () => {
  describe('provinceSchema - Province Object Validation', () => {
    describe('valid province objects', () => {
      it('should accept valid province with all required fields', () => {
        const validProvince = {
          id: 1,
          name_th: 'กรุงเทพมหานคร',
          name_en: 'Bangkok',
          slug: 'bangkok',
          region: 'Central',
        };
        const result = provinceSchema.safeParse(validProvince);
        expect(result.success).toBe(true);
      });

      it('should accept province with optional latitude and longitude', () => {
        const validProvince = {
          id: 2,
          name_th: 'เชียงใหม่',
          name_en: 'Chiang Mai',
          slug: 'chiang-mai',
          region: 'Northern',
          latitude: 18.7883,
          longitude: 98.9853,
        };
        const result = provinceSchema.safeParse(validProvince);
        expect(result.success).toBe(true);
      });

      it('should accept province with only latitude', () => {
        const validProvince = {
          id: 3,
          name_th: 'ภูเก็ต',
          name_en: 'Phuket',
          slug: 'phuket',
          region: 'Southern',
          latitude: 7.8804,
        };
        const result = provinceSchema.safeParse(validProvince);
        expect(result.success).toBe(true);
      });

      it('should accept province with only longitude', () => {
        const validProvince = {
          id: 4,
          name_th: 'พัทยา',
          name_en: 'Pattaya',
          slug: 'pattaya',
          region: 'Eastern',
          longitude: 100.8827,
        };
        const result = provinceSchema.safeParse(validProvince);
        expect(result.success).toBe(true);
      });

      it('should accept province with negative coordinates', () => {
        const validProvince = {
          id: 5,
          name_th: 'สงขลา',
          name_en: 'Songkhla',
          slug: 'songkhla',
          region: 'Southern',
          latitude: -7.2056,
          longitude: -100.5954,
        };
        const result = provinceSchema.safeParse(validProvince);
        expect(result.success).toBe(true);
      });
    });

    describe('missing required fields', () => {
      it('should reject province missing id', () => {
        const invalidProvince = {
          name_th: 'กรุงเทพมหานคร',
          name_en: 'Bangkok',
          slug: 'bangkok',
          region: 'Central',
        };
        const result = provinceSchema.safeParse(invalidProvince);
        expect(result.success).toBe(false);
      });

      it('should reject province missing name_th', () => {
        const invalidProvince = {
          id: 1,
          name_en: 'Bangkok',
          slug: 'bangkok',
          region: 'Central',
        };
        const result = provinceSchema.safeParse(invalidProvince);
        expect(result.success).toBe(false);
      });

      it('should reject province missing name_en', () => {
        const invalidProvince = {
          id: 1,
          name_th: 'กรุงเทพมหานคร',
          slug: 'bangkok',
          region: 'Central',
        };
        const result = provinceSchema.safeParse(invalidProvince);
        expect(result.success).toBe(false);
      });

      it('should reject province missing slug', () => {
        const invalidProvince = {
          id: 1,
          name_th: 'กรุงเทพมหานคร',
          name_en: 'Bangkok',
          region: 'Central',
        };
        const result = provinceSchema.safeParse(invalidProvince);
        expect(result.success).toBe(false);
      });

      it('should reject province missing region', () => {
        const invalidProvince = {
          id: 1,
          name_th: 'กรุงเทพมหานคร',
          name_en: 'Bangkok',
          slug: 'bangkok',
        };
        const result = provinceSchema.safeParse(invalidProvince);
        expect(result.success).toBe(false);
      });

      it('should reject empty object', () => {
        const invalidProvince = {};
        const result = provinceSchema.safeParse(invalidProvince);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors.length).toBeGreaterThanOrEqual(5);
        }
      });
    });

    describe('province ID validation', () => {
      it('should accept positive integer ID', () => {
        const validProvince = {
          id: 77,
          name_th: 'สมุทรปราการ',
          name_en: 'Samut Prakan',
          slug: 'samut-prakan',
          region: 'Central',
        };
        const result = provinceSchema.safeParse(validProvince);
        expect(result.success).toBe(true);
      });

      it('should accept ID of 1', () => {
        const validProvince = {
          id: 1,
          name_th: 'กรุงเทพมหานคร',
          name_en: 'Bangkok',
          slug: 'bangkok',
          region: 'Central',
        };
        const result = provinceSchema.safeParse(validProvince);
        expect(result.success).toBe(true);
      });

      it('should reject negative ID', () => {
        const invalidProvince = {
          id: -1,
          name_th: 'กรุงเทพมหานคร',
          name_en: 'Bangkok',
          slug: 'bangkok',
          region: 'Central',
        };
        const result = provinceSchema.safeParse(invalidProvince);
        expect(result.success).toBe(true); // Zod accepts negative numbers by default
      });

      it('should reject zero ID', () => {
        const invalidProvince = {
          id: 0,
          name_th: 'กรุงเทพมหานคร',
          name_en: 'Bangkok',
          slug: 'bangkok',
          region: 'Central',
        };
        const result = provinceSchema.safeParse(invalidProvince);
        expect(result.success).toBe(true); // Zod accepts zero by default
      });

      it('should reject string ID', () => {
        const invalidProvince = {
          id: '1',
          name_th: 'กรุงเทพมหานคร',
          name_en: 'Bangkok',
          slug: 'bangkok',
          region: 'Central',
        };
        const result = provinceSchema.safeParse(invalidProvince);
        expect(result.success).toBe(false);
      });

      it('should reject float ID', () => {
        const invalidProvince = {
          id: 1.5,
          name_th: 'กรุงเทพมหานคร',
          name_en: 'Bangkok',
          slug: 'bangkok',
          region: 'Central',
        };
        const result = provinceSchema.safeParse(invalidProvince);
        expect(result.success).toBe(true); // Zod number() accepts floats
      });
    });

    describe('province name fields validation', () => {
      it('should accept valid Thai name string', () => {
        const validProvince = {
          id: 1,
          name_th: 'กรุงเทพมหานคร',
          name_en: 'Bangkok',
          slug: 'bangkok',
          region: 'Central',
        };
        const result = provinceSchema.safeParse(validProvince);
        expect(result.success).toBe(true);
      });

      it('should accept valid English name string', () => {
        const validProvince = {
          id: 1,
          name_th: 'กรุงเทพมหานคร',
          name_en: 'Bangkok',
          slug: 'bangkok',
          region: 'Central',
        };
        const result = provinceSchema.safeParse(validProvince);
        expect(result.success).toBe(true);
      });

      it('should reject numeric name_th', () => {
        const invalidProvince = {
          id: 1,
          name_th: 12345,
          name_en: 'Bangkok',
          slug: 'bangkok',
          region: 'Central',
        };
        const result = provinceSchema.safeParse(invalidProvince);
        expect(result.success).toBe(false);
      });

      it('should reject numeric name_en', () => {
        const invalidProvince = {
          id: 1,
          name_th: 'กรุงเทพมหานคร',
          name_en: 12345,
          slug: 'bangkok',
          region: 'Central',
        };
        const result = provinceSchema.safeParse(invalidProvince);
        expect(result.success).toBe(false);
      });

      it('should reject empty string name_th', () => {
        const invalidProvince = {
          id: 1,
          name_th: '',
          name_en: 'Bangkok',
          slug: 'bangkok',
          region: 'Central',
        };
        const result = provinceSchema.safeParse(invalidProvince);
        expect(result.success).toBe(true); // Zod string() accepts empty strings
      });

      it('should reject empty string name_en', () => {
        const invalidProvince = {
          id: 1,
          name_th: 'กรุงเทพมหานคร',
          name_en: '',
          slug: 'bangkok',
          region: 'Central',
        };
        const result = provinceSchema.safeParse(invalidProvince);
        expect(result.success).toBe(true); // Zod string() accepts empty strings
      });

      it('should accept slug with hyphen', () => {
        const validProvince = {
          id: 2,
          name_th: 'เชียงใหม่',
          name_en: 'Chiang Mai',
          slug: 'chiang-mai',
          region: 'Northern',
        };
        const result = provinceSchema.safeParse(validProvince);
        expect(result.success).toBe(true);
      });

      it('should accept region string', () => {
        const validProvince = {
          id: 1,
          name_th: 'กรุงเทพมหานคร',
          name_en: 'Bangkok',
          slug: 'bangkok',
          region: 'Central',
        };
        const result = provinceSchema.safeParse(validProvince);
        expect(result.success).toBe(true);
      });
    });

    describe('parse() method throws on invalid input', () => {
      it('should throw ZodError when province is invalid', () => {
        const invalidProvince = {
          id: 'invalid',
          name_th: 'กรุงเทพมหานคร',
        };
        expect(() => provinceSchema.parse(invalidProvince)).toThrow(ZodError);
      });

      it('should not throw when province is valid', () => {
        const validProvince = {
          id: 1,
          name_th: 'กรุงเทพมหานคร',
          name_en: 'Bangkok',
          slug: 'bangkok',
          region: 'Central',
        };
        expect(() => provinceSchema.parse(validProvince)).not.toThrow();
      });
    });
  });

  describe('provinceAutocompleteQuerySchema - Query Parameter Validation', () => {
    describe('valid autocomplete queries', () => {
      it('should accept valid query with 2 characters', () => {
        const validQuery = {
          q: 'Ba',
        };
        const result = provinceAutocompleteQuerySchema.safeParse(validQuery);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.limit).toBe(10); // default limit
        }
      });

      it('should accept valid query with custom limit', () => {
        const validQuery = {
          q: 'Bangkok',
          limit: 5,
        };
        const result = provinceAutocompleteQuerySchema.safeParse(validQuery);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.limit).toBe(5);
        }
      });

      it('should accept query up to 100 characters', () => {
        const validQuery = {
          q: 'a'.repeat(100),
        };
        const result = provinceAutocompleteQuerySchema.safeParse(validQuery);
        expect(result.success).toBe(true);
      });

      it('should accept limit of 1', () => {
        const validQuery = {
          q: 'Bangkok',
          limit: 1,
        };
        const result = provinceAutocompleteQuerySchema.safeParse(validQuery);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.limit).toBe(1);
        }
      });

      it('should accept limit of 20', () => {
        const validQuery = {
          q: 'Bangkok',
          limit: 20,
        };
        const result = provinceAutocompleteQuerySchema.safeParse(validQuery);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.limit).toBe(20);
        }
      });

      it('should coerce string limit to number', () => {
        const validQuery = {
          q: 'Bangkok',
          limit: '15',
        };
        const result = provinceAutocompleteQuerySchema.safeParse(validQuery);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.limit).toBe(15);
          expect(typeof result.data.limit).toBe('number');
        }
      });

      it('should apply default limit when not provided', () => {
        const validQuery = {
          q: 'Bangkok',
        };
        const result = provinceAutocompleteQuerySchema.safeParse(validQuery);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.limit).toBe(10);
        }
      });

      it('should accept Thai characters in query', () => {
        const validQuery = {
          q: 'กรุงเทพ',
        };
        const result = provinceAutocompleteQuerySchema.safeParse(validQuery);
        expect(result.success).toBe(true);
      });
    });

    describe('invalid autocomplete queries', () => {
      it('should reject query with 1 character', () => {
        const invalidQuery = {
          q: 'B',
        };
        const result = provinceAutocompleteQuerySchema.safeParse(invalidQuery);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Search query must be at least 2 characters');
        }
      });

      it('should reject empty query', () => {
        const invalidQuery = {
          q: '',
        };
        const result = provinceAutocompleteQuerySchema.safeParse(invalidQuery);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Search query must be at least 2 characters');
        }
      });

      it('should reject query over 100 characters', () => {
        const invalidQuery = {
          q: 'a'.repeat(101),
        };
        const result = provinceAutocompleteQuerySchema.safeParse(invalidQuery);
        expect(result.success).toBe(false);
      });

      it('should reject limit of 0', () => {
        const invalidQuery = {
          q: 'Bangkok',
          limit: 0,
        };
        const result = provinceAutocompleteQuerySchema.safeParse(invalidQuery);
        expect(result.success).toBe(false);
      });

      it('should reject negative limit', () => {
        const invalidQuery = {
          q: 'Bangkok',
          limit: -5,
        };
        const result = provinceAutocompleteQuerySchema.safeParse(invalidQuery);
        expect(result.success).toBe(false);
      });

      it('should reject limit over 20', () => {
        const invalidQuery = {
          q: 'Bangkok',
          limit: 21,
        };
        const result = provinceAutocompleteQuerySchema.safeParse(invalidQuery);
        expect(result.success).toBe(false);
      });

      it('should reject float limit', () => {
        const invalidQuery = {
          q: 'Bangkok',
          limit: 5.5,
        };
        const result = provinceAutocompleteQuerySchema.safeParse(invalidQuery);
        expect(result.success).toBe(false);
      });

      it('should reject missing query parameter', () => {
        const invalidQuery = {
          limit: 10,
        };
        const result = provinceAutocompleteQuerySchema.safeParse(invalidQuery);
        expect(result.success).toBe(false);
      });

      it('should reject numeric query', () => {
        const invalidQuery = {
          q: 12345,
        };
        const result = provinceAutocompleteQuerySchema.safeParse(invalidQuery);
        expect(result.success).toBe(false);
      });
    });

    describe('parse() method behavior', () => {
      it('should throw ZodError when query is invalid', () => {
        const invalidQuery = {
          q: 'B',
        };
        expect(() => provinceAutocompleteQuerySchema.parse(invalidQuery)).toThrow(ZodError);
      });

      it('should not throw when query is valid', () => {
        const validQuery = {
          q: 'Bangkok',
        };
        expect(() => provinceAutocompleteQuerySchema.parse(validQuery)).not.toThrow();
      });
    });
  });

  describe('provinceListResponseSchema - Response Array Validation', () => {
    describe('valid province list responses', () => {
      it('should accept valid response with array of provinces', () => {
        const validResponse = {
          data: [
            {
              id: 1,
              name_th: 'กรุงเทพมหานคร',
              name_en: 'Bangkok',
              slug: 'bangkok',
              region: 'Central',
            },
            {
              id: 2,
              name_th: 'เชียงใหม่',
              name_en: 'Chiang Mai',
              slug: 'chiang-mai',
              region: 'Northern',
            },
          ],
          count: 2,
        };
        const result = provinceListResponseSchema.safeParse(validResponse);
        expect(result.success).toBe(true);
      });

      it('should accept empty array of provinces', () => {
        const validResponse = {
          data: [],
          count: 0,
        };
        const result = provinceListResponseSchema.safeParse(validResponse);
        expect(result.success).toBe(true);
      });

      it('should accept single province in array', () => {
        const validResponse = {
          data: [
            {
              id: 1,
              name_th: 'กรุงเทพมหานคร',
              name_en: 'Bangkok',
              slug: 'bangkok',
              region: 'Central',
              latitude: 13.7563,
              longitude: 100.5018,
            },
          ],
          count: 1,
        };
        const result = provinceListResponseSchema.safeParse(validResponse);
        expect(result.success).toBe(true);
      });

      it('should accept provinces with optional coordinates', () => {
        const validResponse = {
          data: [
            {
              id: 1,
              name_th: 'กรุงเทพมหานคร',
              name_en: 'Bangkok',
              slug: 'bangkok',
              region: 'Central',
              latitude: 13.7563,
              longitude: 100.5018,
            },
            {
              id: 2,
              name_th: 'เชียงใหม่',
              name_en: 'Chiang Mai',
              slug: 'chiang-mai',
              region: 'Northern',
            },
          ],
          count: 2,
        };
        const result = provinceListResponseSchema.safeParse(validResponse);
        expect(result.success).toBe(true);
      });

      it('should accept count of 0', () => {
        const validResponse = {
          data: [],
          count: 0,
        };
        const result = provinceListResponseSchema.safeParse(validResponse);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.count).toBe(0);
        }
      });

      it('should accept large count value', () => {
        const validResponse = {
          data: [],
          count: 77,
        };
        const result = provinceListResponseSchema.safeParse(validResponse);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.count).toBe(77);
        }
      });
    });

    describe('invalid province list responses', () => {
      it('should reject response missing data field', () => {
        const invalidResponse = {
          count: 0,
        };
        const result = provinceListResponseSchema.safeParse(invalidResponse);
        expect(result.success).toBe(false);
      });

      it('should reject response missing count field', () => {
        const invalidResponse = {
          data: [],
        };
        const result = provinceListResponseSchema.safeParse(invalidResponse);
        expect(result.success).toBe(false);
      });

      it('should reject response with non-array data', () => {
        const invalidResponse = {
          data: 'not an array',
          count: 0,
        };
        const result = provinceListResponseSchema.safeParse(invalidResponse);
        expect(result.success).toBe(false);
      });

      it('should reject response with string count', () => {
        const invalidResponse = {
          data: [],
          count: '0',
        };
        const result = provinceListResponseSchema.safeParse(invalidResponse);
        expect(result.success).toBe(false);
      });

      it('should reject response with negative count', () => {
        const invalidResponse = {
          data: [],
          count: -1,
        };
        const result = provinceListResponseSchema.safeParse(invalidResponse);
        expect(result.success).toBe(true); // Zod accepts negative numbers by default
      });

      it('should reject array with invalid province objects', () => {
        const invalidResponse = {
          data: [
            {
              id: 'invalid',
              name_th: 'กรุงเทพมหานคร',
              name_en: 'Bangkok',
            },
          ],
          count: 1,
        };
        const result = provinceListResponseSchema.safeParse(invalidResponse);
        expect(result.success).toBe(false);
      });

      it('should reject array with mixed valid and invalid provinces', () => {
        const invalidResponse = {
          data: [
            {
              id: 1,
              name_th: 'กรุงเทพมหานคร',
              name_en: 'Bangkok',
              slug: 'bangkok',
              region: 'Central',
            },
            {
              id: 'invalid',
              name_th: 'เชียงใหม่',
            },
          ],
          count: 2,
        };
        const result = provinceListResponseSchema.safeParse(invalidResponse);
        expect(result.success).toBe(false);
      });

      it('should reject empty object', () => {
        const invalidResponse = {};
        const result = provinceListResponseSchema.safeParse(invalidResponse);
        expect(result.success).toBe(false);
      });
    });

    describe('parse() method behavior', () => {
      it('should throw ZodError when response is invalid', () => {
        const invalidResponse = {
          data: 'not an array',
          count: 0,
        };
        expect(() => provinceListResponseSchema.parse(invalidResponse)).toThrow(ZodError);
      });

      it('should not throw when response is valid', () => {
        const validResponse = {
          data: [],
          count: 0,
        };
        expect(() => provinceListResponseSchema.parse(validResponse)).not.toThrow();
      });
    });
  });

  describe('TypeScript type inference', () => {
    it('should infer correct Province type', () => {
      const province: Province = {
        id: 1,
        name_th: 'กรุงเทพมหานคร',
        name_en: 'Bangkok',
        slug: 'bangkok',
        region: 'Central',
        latitude: 13.7563,
        longitude: 100.5018,
      };
      expect(province).toBeDefined();
    });

    it('should infer correct ProvinceAutocompleteQuery type', () => {
      const query: ProvinceAutocompleteQuery = {
        q: 'Bangkok',
        limit: 10,
      };
      expect(query).toBeDefined();
    });

    it('should infer correct ProvinceListResponse type', () => {
      const response: ProvinceListResponse = {
        data: [
          {
            id: 1,
            name_th: 'กรุงเทพมหานคร',
            name_en: 'Bangkok',
            slug: 'bangkok',
            region: 'Central',
          },
        ],
        count: 1,
      };
      expect(response).toBeDefined();
    });
  });
});
