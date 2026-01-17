import { z } from 'zod';

/**
 * Province Autocomplete Query Schema
 * Used for validating province search parameters
 */
export const provinceAutocompleteQuerySchema = z.object({
  q: z.string().min(2, 'Search query must be at least 2 characters').max(100),
  limit: z.coerce.number().int().min(1).max(20).default(10),
});

export type ProvinceAutocompleteQuery = z.infer<typeof provinceAutocompleteQuerySchema>;

/**
 * Province Response Schema
 * Represents a province in search results
 */
export const provinceSchema = z.object({
  id: z.number(),
  name_th: z.string(),
  name_en: z.string(),
  slug: z.string(),
  region: z.string(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export type Province = z.infer<typeof provinceSchema>;

/**
 * Province List Response Schema
 */
export const provinceListResponseSchema = z.object({
  data: z.array(provinceSchema),
  count: z.number(),
});

export type ProvinceListResponse = z.infer<typeof provinceListResponseSchema>;
