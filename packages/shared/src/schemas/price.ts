import { z } from 'zod';

/**
 * Price Range Filter Schema
 * Used for validating price filter parameters
 */
export const priceRangeSchema = z
  .object({
    minPrice: z.coerce.number().min(0).max(100000).default(0),
    maxPrice: z.coerce.number().min(0).max(100000).default(10000),
  })
  .refine((data) => data.minPrice <= data.maxPrice, {
    message: 'Minimum price must be less than or equal to maximum price',
    path: ['minPrice'],
  });

export type PriceRange = z.infer<typeof priceRangeSchema>;

/**
 * Price constants
 */
export const PRICE_CONSTANTS = {
  MIN: 0,
  MAX: 10000,
  DEFAULT_MIN: 0,
  DEFAULT_MAX: 10000,
  STEP: 100,
  CURRENCY: '฿',
} as const;
