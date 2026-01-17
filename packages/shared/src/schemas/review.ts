import { z } from 'zod';

// Reviewer type enum
export const reviewerTypeSchema = z.enum(['family', 'couple', 'solo', 'group']);

// Sort by enum
export const reviewSortBySchema = z.enum(['newest', 'helpful', 'rating_high', 'rating_low']);

// Report reason enum
export const reportReasonSchema = z.enum(['spam', 'inappropriate', 'fake', 'other']);

// Rating validation (1-5)
const ratingSchema = z.number().int().min(1).max(5);
const optionalRatingSchema = z.number().int().min(1).max(5).optional();

// Create review input schema
export const createReviewSchema = z.object({
  campsite_id: z.string().uuid('Invalid campsite ID'),
  rating_overall: ratingSchema,
  rating_cleanliness: optionalRatingSchema,
  rating_staff: optionalRatingSchema,
  rating_facilities: optionalRatingSchema,
  rating_value: optionalRatingSchema,
  rating_location: optionalRatingSchema,
  reviewer_type: reviewerTypeSchema,
  title: z.string().max(100, 'Title must be 100 characters or less').optional(),
  content: z.string()
    .min(20, 'Review must be at least 20 characters')
    .max(2000, 'Review must be 2000 characters or less'),
  pros: z.string().max(500, 'Pros must be 500 characters or less').optional(),
  cons: z.string().max(500, 'Cons must be 500 characters or less').optional(),
  visited_at: z.string().optional(),
  photo_urls: z.array(z.string().url()).max(5, 'Maximum 5 photos allowed').optional(),
});

// Review query params schema
export const reviewQuerySchema = z.object({
  campsite_id: z.string().uuid('Invalid campsite ID'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(5),
  sort_by: reviewSortBySchema.default('newest'),
  reviewer_type: reviewerTypeSchema.optional(),
});

// Report review input schema
export const reportReviewSchema = z.object({
  review_id: z.string().uuid('Invalid review ID'),
  reason: reportReasonSchema,
  details: z.string().max(500, 'Details must be 500 characters or less').optional(),
});

// Helpful vote schema
export const helpfulVoteSchema = z.object({
  review_id: z.string().uuid('Invalid review ID'),
});

// Admin hide review schema
export const hideReviewSchema = z.object({
  review_id: z.string().uuid('Invalid review ID'),
  reason: z.string().min(1, 'Reason is required').max(500),
});

// Admin unhide review schema
export const unhideReviewSchema = z.object({
  review_id: z.string().uuid('Invalid review ID'),
});

// Owner response schema
export const ownerResponseSchema = z.object({
  review_id: z.string().uuid('Invalid review ID'),
  response: z.string()
    .min(10, 'Response must be at least 10 characters')
    .max(1000, 'Response must be 1000 characters or less'),
});

// Photo upload validation
export const photoUploadSchema = z.object({
  file: z.object({
    size: z.number().max(5 * 1024 * 1024, 'File size must be less than 5MB'),
    type: z.string().refine(
      (type) => ['image/jpeg', 'image/png', 'image/webp'].includes(type),
      'Only JPEG, PNG, and WebP images are allowed'
    ),
  }),
});

// Export types
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type ReviewQueryParams = z.infer<typeof reviewQuerySchema>;
export type ReportReviewInput = z.infer<typeof reportReviewSchema>;
export type HelpfulVoteInput = z.infer<typeof helpfulVoteSchema>;
export type HideReviewInput = z.infer<typeof hideReviewSchema>;
export type UnhideReviewInput = z.infer<typeof unhideReviewSchema>;
export type OwnerResponseInput = z.infer<typeof ownerResponseSchema>;
export type ReviewerType = z.infer<typeof reviewerTypeSchema>;
export type ReviewSortBy = z.infer<typeof reviewSortBySchema>;
export type ReportReason = z.infer<typeof reportReasonSchema>;
