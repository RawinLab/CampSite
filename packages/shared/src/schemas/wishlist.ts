import { z } from 'zod';

/**
 * Add to wishlist request schema
 */
export const addToWishlistSchema = z.object({
  campsite_id: z.string().uuid('Invalid campsite ID'),
  notes: z.string().max(500, 'Notes must be 500 characters or less').optional(),
});

export type AddToWishlistInput = z.infer<typeof addToWishlistSchema>;

/**
 * Wishlist query parameters schema
 */
export const wishlistQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  sort: z.enum(['newest', 'oldest', 'name']).default('newest'),
});

export type WishlistQueryInput = z.infer<typeof wishlistQuerySchema>;

/**
 * Batch check wishlist status schema
 */
export const batchWishlistCheckSchema = z.object({
  campsite_ids: z.array(z.string().uuid()).min(1).max(50),
});

export type BatchWishlistCheckInput = z.infer<typeof batchWishlistCheckSchema>;

/**
 * Compare campsites query schema
 */
export const compareCampsitesSchema = z.object({
  ids: z.string().transform((val) => {
    const ids = val.split(',').filter(Boolean);
    if (ids.length < 2) {
      throw new Error('At least 2 campsite IDs required');
    }
    if (ids.length > 3) {
      throw new Error('Maximum 3 campsites can be compared');
    }
    // Validate each ID is a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    for (const id of ids) {
      if (!uuidRegex.test(id)) {
        throw new Error(`Invalid campsite ID: ${id}`);
      }
    }
    return ids;
  }),
});

export type CompareCampsitesInput = z.infer<typeof compareCampsitesSchema>;
