import { z } from 'zod';

/**
 * Sort options for search results
 */
export const sortOptionsSchema = z.enum(['rating', 'price_asc', 'price_desc', 'newest']);
export type SortOption = z.infer<typeof sortOptionsSchema>;

/**
 * Campsite type filter options (matches database)
 */
export const campsiteTypeFilterSchema = z.enum([
  'camping',
  'glamping',
  'tented-resort',
  'bungalow',
  'cabin',
  'rv-caravan',
]);
export type CampsiteTypeFilter = z.infer<typeof campsiteTypeFilterSchema>;

/**
 * Search Query Schema
 * Comprehensive validation for all search parameters
 */
export const searchQuerySchema = z.object({
  // Text search
  q: z.string().max(200).optional(),

  // Location filter
  provinceId: z.coerce.number().int().positive().optional(),
  provinceSlug: z.string().max(100).optional(),

  // Type filter (multi-select)
  types: z
    .union([z.string(), z.array(z.string())])
    .transform((val) => (Array.isArray(val) ? val : val ? val.split(',') : []))
    .pipe(z.array(campsiteTypeFilterSchema))
    .optional(),

  // Price filter
  minPrice: z.coerce.number().min(0).max(100000).optional(),
  maxPrice: z.coerce.number().min(0).max(100000).optional(),

  // Amenity filter (multi-select, AND logic)
  amenities: z
    .union([z.string(), z.array(z.string())])
    .transform((val) => (Array.isArray(val) ? val : val ? val.split(',') : []))
    .pipe(z.array(z.string()))
    .optional(),

  // Rating filter
  minRating: z.coerce.number().min(0).max(5).optional(),

  // Sorting
  sort: sortOptionsSchema.default('rating'),

  // Pagination
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),

  // Featured filter
  featured: z
    .union([z.boolean(), z.string()])
    .transform((val) => val === true || val === 'true')
    .optional(),
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;

/**
 * Search Results Response Schema
 */
export const searchResultsResponseSchema = z.object({
  data: z.array(z.any()), // Campsite card data
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
    hasNext: z.boolean(),
    hasPrev: z.boolean(),
  }),
  filters: z.object({
    provinceId: z.number().optional(),
    types: z.array(z.string()).optional(),
    minPrice: z.number().optional(),
    maxPrice: z.number().optional(),
    amenities: z.array(z.string()).optional(),
    minRating: z.number().optional(),
  }),
  sort: sortOptionsSchema,
});

export type SearchResultsResponse = z.infer<typeof searchResultsResponseSchema>;

/**
 * Default search values
 */
export const SEARCH_DEFAULTS = {
  PAGE: 1,
  LIMIT: 12,
  SORT: 'rating' as const,
  MIN_PRICE: 0,
  MAX_PRICE: 10000,
} as const;
