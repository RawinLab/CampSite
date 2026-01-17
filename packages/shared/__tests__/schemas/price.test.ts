import { priceRangeSchema, PRICE_CONSTANTS } from '../../src/schemas/price';
import { ZodError } from 'zod';

describe('Price Range Validation', () => {
  describe('valid price ranges', () => {
    it('should accept valid price range (min < max)', () => {
      const validData = {
        minPrice: 500,
        maxPrice: 2000,
      };
      const result = priceRangeSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.minPrice).toBe(500);
        expect(result.data.maxPrice).toBe(2000);
      }
    });

    it('should accept minimum price equal to maximum price', () => {
      const validData = {
        minPrice: 1000,
        maxPrice: 1000,
      };
      const result = priceRangeSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.minPrice).toBe(1000);
        expect(result.data.maxPrice).toBe(1000);
      }
    });

    it('should accept minimum price of 0', () => {
      const validData = {
        minPrice: 0,
        maxPrice: 5000,
      };
      const result = priceRangeSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.minPrice).toBe(0);
        expect(result.data.maxPrice).toBe(5000);
      }
    });

    it('should accept maximum price of 10000', () => {
      const validData = {
        minPrice: 0,
        maxPrice: 10000,
      };
      const result = priceRangeSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.minPrice).toBe(0);
        expect(result.data.maxPrice).toBe(10000);
      }
    });

    it('should accept both prices at 0', () => {
      const validData = {
        minPrice: 0,
        maxPrice: 0,
      };
      const result = priceRangeSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.minPrice).toBe(0);
        expect(result.data.maxPrice).toBe(0);
      }
    });

    it('should accept both prices at maximum (10000)', () => {
      const validData = {
        minPrice: 10000,
        maxPrice: 10000,
      };
      const result = priceRangeSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.minPrice).toBe(10000);
        expect(result.data.maxPrice).toBe(10000);
      }
    });

    it('should coerce string numbers to numbers', () => {
      const validData = {
        minPrice: '500',
        maxPrice: '2000',
      };
      const result = priceRangeSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.minPrice).toBe(500);
        expect(result.data.maxPrice).toBe(2000);
        expect(typeof result.data.minPrice).toBe('number');
        expect(typeof result.data.maxPrice).toBe('number');
      }
    });
  });

  describe('default values', () => {
    it('should apply default minPrice of 0 when not provided', () => {
      const dataWithoutMin = {
        maxPrice: 5000,
      };
      const result = priceRangeSchema.safeParse(dataWithoutMin);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.minPrice).toBe(PRICE_CONSTANTS.DEFAULT_MIN);
        expect(result.data.minPrice).toBe(0);
      }
    });

    it('should apply default maxPrice of 10000 when not provided', () => {
      const dataWithoutMax = {
        minPrice: 500,
      };
      const result = priceRangeSchema.safeParse(dataWithoutMax);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.maxPrice).toBe(PRICE_CONSTANTS.DEFAULT_MAX);
        expect(result.data.maxPrice).toBe(10000);
      }
    });

    it('should apply both defaults when neither price is provided', () => {
      const emptyData = {};
      const result = priceRangeSchema.safeParse(emptyData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.minPrice).toBe(PRICE_CONSTANTS.DEFAULT_MIN);
        expect(result.data.maxPrice).toBe(PRICE_CONSTANTS.DEFAULT_MAX);
        expect(result.data.minPrice).toBe(0);
        expect(result.data.maxPrice).toBe(10000);
      }
    });
  });

  describe('invalid price ranges - minPrice >= 0', () => {
    it('should reject negative minimum price', () => {
      const invalidData = {
        minPrice: -100,
        maxPrice: 5000,
      };
      const result = priceRangeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const minPriceErrors = result.error.errors.filter(e => e.path.includes('minPrice'));
        expect(minPriceErrors.some(e => e.message.includes('greater than or equal to 0'))).toBe(true);
      }
    });

    it('should reject negative maximum price', () => {
      const invalidData = {
        minPrice: 0,
        maxPrice: -500,
      };
      const result = priceRangeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const maxPriceErrors = result.error.errors.filter(e => e.path.includes('maxPrice'));
        expect(maxPriceErrors.some(e => e.message.includes('greater than or equal to 0'))).toBe(true);
      }
    });

    it('should reject both prices negative', () => {
      const invalidData = {
        minPrice: -500,
        maxPrice: -100,
      };
      const result = priceRangeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.length).toBeGreaterThanOrEqual(2);
      }
    });
  });

  describe('invalid price ranges - maxPrice <= 100000', () => {
    it('should reject maximum price above 100000', () => {
      const invalidData = {
        minPrice: 1000,
        maxPrice: 150000,
      };
      const result = priceRangeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const maxPriceErrors = result.error.errors.filter(e => e.path.includes('maxPrice'));
        expect(maxPriceErrors.some(e => e.message.includes('less than or equal to 100000'))).toBe(true);
      }
    });

    it('should reject minimum price above 100000', () => {
      const invalidData = {
        minPrice: 150000,
        maxPrice: 200000,
      };
      const result = priceRangeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.length).toBeGreaterThanOrEqual(1);
      }
    });

    it('should accept maximum price of exactly 100000', () => {
      const validData = {
        minPrice: 50000,
        maxPrice: 100000,
      };
      const result = priceRangeSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('invalid price ranges - min > max', () => {
    it('should reject minimum price greater than maximum price', () => {
      const invalidData = {
        minPrice: 5000,
        maxPrice: 2000,
      };
      const result = priceRangeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const minPriceErrors = result.error.errors.filter(e => e.path.includes('minPrice'));
        expect(minPriceErrors.some(e => e.message.includes('Minimum price must be less than or equal to maximum price'))).toBe(true);
      }
    });

    it('should reject when minimum is much greater than maximum', () => {
      const invalidData = {
        minPrice: 10000,
        maxPrice: 100,
      };
      const result = priceRangeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const minPriceErrors = result.error.errors.filter(e => e.path.includes('minPrice'));
        expect(minPriceErrors.some(e => e.message.includes('Minimum price must be less than or equal to maximum price'))).toBe(true);
      }
    });

    it('should reject minimum > maximum even with coerced strings', () => {
      const invalidData = {
        minPrice: '8000',
        maxPrice: '3000',
      };
      const result = priceRangeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const minPriceErrors = result.error.errors.filter(e => e.path.includes('minPrice'));
        expect(minPriceErrors.some(e => e.message.includes('Minimum price must be less than or equal to maximum price'))).toBe(true);
      }
    });
  });

  describe('edge cases', () => {
    it('should handle decimal prices (coerced to numbers)', () => {
      const validData = {
        minPrice: 99.99,
        maxPrice: 999.99,
      };
      const result = priceRangeSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.minPrice).toBe(99.99);
        expect(result.data.maxPrice).toBe(999.99);
      }
    });

    it('should handle string decimal prices', () => {
      const validData = {
        minPrice: '150.50',
        maxPrice: '2500.75',
      };
      const result = priceRangeSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.minPrice).toBe(150.50);
        expect(result.data.maxPrice).toBe(2500.75);
      }
    });

    it('should reject non-numeric strings', () => {
      const invalidData = {
        minPrice: 'abc',
        maxPrice: 5000,
      };
      const result = priceRangeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should handle zero minimum with default maximum', () => {
      const validData = {
        minPrice: 0,
      };
      const result = priceRangeSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.minPrice).toBe(0);
        expect(result.data.maxPrice).toBe(10000);
      }
    });

    it('should handle maximum at limit (10000)', () => {
      const validData = {
        minPrice: 9000,
        maxPrice: 10000,
      };
      const result = priceRangeSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.minPrice).toBe(9000);
        expect(result.data.maxPrice).toBe(10000);
      }
    });
  });

  describe('parse() method throws on invalid input', () => {
    it('should throw ZodError when minPrice > maxPrice', () => {
      const invalidData = {
        minPrice: 5000,
        maxPrice: 2000,
      };
      expect(() => priceRangeSchema.parse(invalidData)).toThrow(ZodError);
    });

    it('should throw ZodError when prices are negative', () => {
      const invalidData = {
        minPrice: -100,
        maxPrice: 5000,
      };
      expect(() => priceRangeSchema.parse(invalidData)).toThrow(ZodError);
    });

    it('should not throw when price range is valid', () => {
      const validData = {
        minPrice: 500,
        maxPrice: 5000,
      };
      expect(() => priceRangeSchema.parse(validData)).not.toThrow();
    });

    it('should not throw when using defaults', () => {
      const validData = {};
      expect(() => priceRangeSchema.parse(validData)).not.toThrow();
      const result = priceRangeSchema.parse(validData);
      expect(result.minPrice).toBe(0);
      expect(result.maxPrice).toBe(10000);
    });
  });

  describe('PRICE_CONSTANTS validation', () => {
    it('should have correct constant values', () => {
      expect(PRICE_CONSTANTS.MIN).toBe(0);
      expect(PRICE_CONSTANTS.MAX).toBe(10000);
      expect(PRICE_CONSTANTS.DEFAULT_MIN).toBe(0);
      expect(PRICE_CONSTANTS.DEFAULT_MAX).toBe(10000);
      expect(PRICE_CONSTANTS.STEP).toBe(100);
      expect(PRICE_CONSTANTS.CURRENCY).toBe('฿');
    });

    it('should accept prices matching PRICE_CONSTANTS boundaries', () => {
      const validData = {
        minPrice: PRICE_CONSTANTS.MIN,
        maxPrice: PRICE_CONSTANTS.MAX,
      };
      const result = priceRangeSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });
});
