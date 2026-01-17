import request from 'supertest';
import app from '../../src/app';
import { supabaseAdmin } from '../../src/lib/supabase';

/**
 * Integration tests for Reviews List API (T011)
 * Tests GET /api/reviews/campsite/:campsiteId endpoint
 * Covers: sorting, filtering by reviewer_type, pagination, user info, photos, hidden reviews exclusion
 */

describe('Integration: Reviews List API - GET /api/reviews/campsite/:campsiteId', () => {
  let validCampsiteId: string;
  let campsiteWithReviews: string;

  beforeAll(async () => {
    // Find an approved campsite for testing
    const { data: approvedCampsite } = await supabaseAdmin
      .from('campsites')
      .select('id')
      .eq('status', 'approved')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (approvedCampsite) {
      validCampsiteId = approvedCampsite.id;
    }

    // Find a campsite with reviews
    const { data: campsiteReviews } = await supabaseAdmin
      .from('reviews')
      .select('campsite_id')
      .eq('is_hidden', false)
      .limit(1);

    if (campsiteReviews && campsiteReviews.length > 0) {
      campsiteWithReviews = campsiteReviews[0].campsite_id;
    }
  });

  // Test 1: Returns reviews for a campsite
  describe('Successful reviews retrieval', () => {
    it('returns 200 and reviews list for valid campsite', async () => {
      if (!validCampsiteId) {
        console.warn('Skipping test: No approved campsite found');
        return;
      }

      const response = await request(app).get(
        `/api/reviews/campsite/${validCampsiteId}`
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination).toHaveProperty('page');
      expect(response.body.pagination).toHaveProperty('limit');
      expect(response.body.pagination).toHaveProperty('total');
      expect(response.body.pagination).toHaveProperty('totalPages');
    });

    it('returns reviews with correct structure', async () => {
      if (!campsiteWithReviews) {
        console.warn('Skipping test: No campsite with reviews found');
        return;
      }

      const response = await request(app).get(
        `/api/reviews/campsite/${campsiteWithReviews}`
      );

      expect(response.status).toBe(200);
      const reviews = response.body.data;

      if (reviews.length > 0) {
        const review = reviews[0];

        // Core review fields
        expect(review).toHaveProperty('id');
        expect(review).toHaveProperty('campsite_id', campsiteWithReviews);
        expect(review).toHaveProperty('user_id');
        expect(review).toHaveProperty('rating_overall');
        expect(review).toHaveProperty('review_text');
        expect(review).toHaveProperty('reviewer_type');
        expect(review).toHaveProperty('created_at');

        // Rating fields
        expect(review).toHaveProperty('rating_cleanliness');
        expect(review).toHaveProperty('rating_staff');
        expect(review).toHaveProperty('rating_facilities');
        expect(review).toHaveProperty('rating_value');
        expect(review).toHaveProperty('rating_location');

        // Helpful count
        expect(review).toHaveProperty('helpful_count');
        expect(typeof review.helpful_count).toBe('number');

        // User voted helpful (optional based on authentication)
        expect(review).toHaveProperty('user_voted_helpful');
      }
    });

    it('returns user info with each review', async () => {
      if (!campsiteWithReviews) {
        console.warn('Skipping test: No campsite with reviews found');
        return;
      }

      const response = await request(app).get(
        `/api/reviews/campsite/${campsiteWithReviews}`
      );

      expect(response.status).toBe(200);
      const reviews = response.body.data;

      if (reviews.length > 0) {
        const review = reviews[0];

        expect(review).toHaveProperty('reviewer');
        expect(review.reviewer).toHaveProperty('full_name');
        expect(review.reviewer).toHaveProperty('avatar_url');
      }
    });

    it('returns photos array with each review', async () => {
      if (!campsiteWithReviews) {
        console.warn('Skipping test: No campsite with reviews found');
        return;
      }

      const response = await request(app).get(
        `/api/reviews/campsite/${campsiteWithReviews}`
      );

      expect(response.status).toBe(200);
      const reviews = response.body.data;

      if (reviews.length > 0) {
        const review = reviews[0];

        expect(review).toHaveProperty('photos');
        expect(Array.isArray(review.photos)).toBe(true);

        if (review.photos.length > 0) {
          const photo = review.photos[0];
          expect(photo).toHaveProperty('id');
          expect(photo).toHaveProperty('url');
          expect(photo).toHaveProperty('sort_order');
        }
      }
    });
  });

  // Test 2: Sort by newest (default)
  describe('Sorting - Newest (default)', () => {
    it('returns reviews sorted by newest when no sort_by param', async () => {
      if (!campsiteWithReviews) {
        console.warn('Skipping test: No campsite with reviews found');
        return;
      }

      const response = await request(app).get(
        `/api/reviews/campsite/${campsiteWithReviews}`
      );

      expect(response.status).toBe(200);
      const reviews = response.body.data;

      if (reviews.length > 1) {
        // Check reviews are in descending order by created_at
        for (let i = 0; i < reviews.length - 1; i++) {
          const current = new Date(reviews[i].created_at).getTime();
          const next = new Date(reviews[i + 1].created_at).getTime();
          expect(current).toBeGreaterThanOrEqual(next);
        }
      }
    });

    it('returns reviews sorted by newest when sort_by=newest', async () => {
      if (!campsiteWithReviews) {
        console.warn('Skipping test: No campsite with reviews found');
        return;
      }

      const response = await request(app).get(
        `/api/reviews/campsite/${campsiteWithReviews}?sort_by=newest`
      );

      expect(response.status).toBe(200);
      const reviews = response.body.data;

      if (reviews.length > 1) {
        for (let i = 0; i < reviews.length - 1; i++) {
          const current = new Date(reviews[i].created_at).getTime();
          const next = new Date(reviews[i + 1].created_at).getTime();
          expect(current).toBeGreaterThanOrEqual(next);
        }
      }
    });
  });

  // Test 3: Sort by helpful count
  describe('Sorting - Helpful Count', () => {
    it('returns reviews sorted by helpful count when sort_by=helpful', async () => {
      if (!campsiteWithReviews) {
        console.warn('Skipping test: No campsite with reviews found');
        return;
      }

      const response = await request(app).get(
        `/api/reviews/campsite/${campsiteWithReviews}?sort_by=helpful`
      );

      expect(response.status).toBe(200);
      const reviews = response.body.data;

      if (reviews.length > 1) {
        // Check reviews are in descending order by helpful_count
        for (let i = 0; i < reviews.length - 1; i++) {
          expect(reviews[i].helpful_count).toBeGreaterThanOrEqual(
            reviews[i + 1].helpful_count
          );
        }
      }
    });
  });

  // Test 4: Sort by rating high-low
  describe('Sorting - Rating High to Low', () => {
    it('returns reviews sorted by rating (high to low) when sort_by=rating_high', async () => {
      if (!campsiteWithReviews) {
        console.warn('Skipping test: No campsite with reviews found');
        return;
      }

      const response = await request(app).get(
        `/api/reviews/campsite/${campsiteWithReviews}?sort_by=rating_high`
      );

      expect(response.status).toBe(200);
      const reviews = response.body.data;

      if (reviews.length > 1) {
        // Check reviews are in descending order by rating_overall
        for (let i = 0; i < reviews.length - 1; i++) {
          expect(reviews[i].rating_overall).toBeGreaterThanOrEqual(
            reviews[i + 1].rating_overall
          );
        }
      }
    });
  });

  // Test 5: Sort by rating low-high
  describe('Sorting - Rating Low to High', () => {
    it('returns reviews sorted by rating (low to high) when sort_by=rating_low', async () => {
      if (!campsiteWithReviews) {
        console.warn('Skipping test: No campsite with reviews found');
        return;
      }

      const response = await request(app).get(
        `/api/reviews/campsite/${campsiteWithReviews}?sort_by=rating_low`
      );

      expect(response.status).toBe(200);
      const reviews = response.body.data;

      if (reviews.length > 1) {
        // Check reviews are in ascending order by rating_overall
        for (let i = 0; i < reviews.length - 1; i++) {
          expect(reviews[i].rating_overall).toBeLessThanOrEqual(
            reviews[i + 1].rating_overall
          );
        }
      }
    });
  });

  // Test 6: Filter by reviewer_type
  describe('Filtering - Reviewer Type', () => {
    it('filters reviews by reviewer_type=family', async () => {
      if (!campsiteWithReviews) {
        console.warn('Skipping test: No campsite with reviews found');
        return;
      }

      const response = await request(app).get(
        `/api/reviews/campsite/${campsiteWithReviews}?reviewer_type=family`
      );

      expect(response.status).toBe(200);
      const reviews = response.body.data;

      // All returned reviews should be from family reviewers
      reviews.forEach((review: any) => {
        expect(review.reviewer_type).toBe('family');
      });
    });

    it('filters reviews by reviewer_type=couple', async () => {
      if (!campsiteWithReviews) {
        console.warn('Skipping test: No campsite with reviews found');
        return;
      }

      const response = await request(app).get(
        `/api/reviews/campsite/${campsiteWithReviews}?reviewer_type=couple`
      );

      expect(response.status).toBe(200);
      const reviews = response.body.data;

      reviews.forEach((review: any) => {
        expect(review.reviewer_type).toBe('couple');
      });
    });

    it('filters reviews by reviewer_type=solo', async () => {
      if (!campsiteWithReviews) {
        console.warn('Skipping test: No campsite with reviews found');
        return;
      }

      const response = await request(app).get(
        `/api/reviews/campsite/${campsiteWithReviews}?reviewer_type=solo`
      );

      expect(response.status).toBe(200);
      const reviews = response.body.data;

      reviews.forEach((review: any) => {
        expect(review.reviewer_type).toBe('solo');
      });
    });

    it('filters reviews by reviewer_type=group', async () => {
      if (!campsiteWithReviews) {
        console.warn('Skipping test: No campsite with reviews found');
        return;
      }

      const response = await request(app).get(
        `/api/reviews/campsite/${campsiteWithReviews}?reviewer_type=group`
      );

      expect(response.status).toBe(200);
      const reviews = response.body.data;

      reviews.forEach((review: any) => {
        expect(review.reviewer_type).toBe('group');
      });
    });
  });

  // Test 7: Pagination
  describe('Pagination', () => {
    it('respects page parameter', async () => {
      if (!campsiteWithReviews) {
        console.warn('Skipping test: No campsite with reviews found');
        return;
      }

      const page1Response = await request(app).get(
        `/api/reviews/campsite/${campsiteWithReviews}?page=1&limit=2`
      );

      expect(page1Response.status).toBe(200);
      expect(page1Response.body.pagination.page).toBe(1);

      const page2Response = await request(app).get(
        `/api/reviews/campsite/${campsiteWithReviews}?page=2&limit=2`
      );

      expect(page2Response.status).toBe(200);
      expect(page2Response.body.pagination.page).toBe(2);

      // Results should be different if there are enough reviews
      const page1Data = page1Response.body.data;
      const page2Data = page2Response.body.data;

      if (page1Data.length > 0 && page2Data.length > 0) {
        expect(page1Data[0].id).not.toBe(page2Data[0].id);
      }
    });

    it('respects limit parameter', async () => {
      if (!campsiteWithReviews) {
        console.warn('Skipping test: No campsite with reviews found');
        return;
      }

      const response = await request(app).get(
        `/api/reviews/campsite/${campsiteWithReviews}?limit=3`
      );

      expect(response.status).toBe(200);
      expect(response.body.pagination.limit).toBe(3);
      expect(response.body.data.length).toBeLessThanOrEqual(3);
    });

    it('calculates totalPages correctly', async () => {
      if (!campsiteWithReviews) {
        console.warn('Skipping test: No campsite with reviews found');
        return;
      }

      const response = await request(app).get(
        `/api/reviews/campsite/${campsiteWithReviews}?limit=2`
      );

      expect(response.status).toBe(200);
      const { total, limit, totalPages } = response.body.pagination;

      expect(totalPages).toBe(Math.ceil(total / limit));
    });

    it('uses default pagination values when not specified', async () => {
      if (!campsiteWithReviews) {
        console.warn('Skipping test: No campsite with reviews found');
        return;
      }

      const response = await request(app).get(
        `/api/reviews/campsite/${campsiteWithReviews}`
      );

      expect(response.status).toBe(200);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(5);
    });
  });

  // Test 8: Hidden reviews are excluded
  describe('Hidden reviews exclusion', () => {
    it('excludes hidden reviews from results', async () => {
      if (!validCampsiteId) {
        console.warn('Skipping test: No approved campsite found');
        return;
      }

      const response = await request(app).get(
        `/api/reviews/campsite/${validCampsiteId}`
      );

      expect(response.status).toBe(200);
      const reviews = response.body.data;

      // All reviews should have is_hidden = false
      reviews.forEach((review: any) => {
        // Since is_hidden is not returned in the API response,
        // we verify by checking the reviews directly from DB
        // The service layer filters them out, so we just verify
        // the count matches non-hidden count
        expect(review).toHaveProperty('id');
      });

      // Verify count matches only non-hidden reviews
      const { count } = await supabaseAdmin
        .from('reviews')
        .select('*', { count: 'exact', head: true })
        .eq('campsite_id', validCampsiteId)
        .eq('is_hidden', false);

      expect(response.body.pagination.total).toBe(count || 0);
    });
  });

  // Test 9: 404 for non-existent campsite
  describe('Non-existent campsite', () => {
    it('returns empty results for non-existent campsite UUID', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app).get(
        `/api/reviews/campsite/${nonExistentId}`
      );

      // The endpoint returns 200 with empty results for non-existent campsites
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toEqual([]);
      expect(response.body.pagination.total).toBe(0);
    });

    it('handles invalid UUID format gracefully', async () => {
      const invalidId = 'invalid-uuid-format';
      const response = await request(app).get(
        `/api/reviews/campsite/${invalidId}`
      );

      // Should return 200 with empty results
      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
    });
  });

  // Test 10: Combined filters and sorting
  describe('Combined filters and sorting', () => {
    it('applies both reviewer_type filter and sort_by together', async () => {
      if (!campsiteWithReviews) {
        console.warn('Skipping test: No campsite with reviews found');
        return;
      }

      const response = await request(app).get(
        `/api/reviews/campsite/${campsiteWithReviews}?reviewer_type=family&sort_by=rating_high`
      );

      expect(response.status).toBe(200);
      const reviews = response.body.data;

      // All reviews should be from family
      reviews.forEach((review: any) => {
        expect(review.reviewer_type).toBe('family');
      });

      // Reviews should be sorted by rating (high to low)
      if (reviews.length > 1) {
        for (let i = 0; i < reviews.length - 1; i++) {
          expect(reviews[i].rating_overall).toBeGreaterThanOrEqual(
            reviews[i + 1].rating_overall
          );
        }
      }
    });

    it('applies pagination with filters and sorting', async () => {
      if (!campsiteWithReviews) {
        console.warn('Skipping test: No campsite with reviews found');
        return;
      }

      const response = await request(app).get(
        `/api/reviews/campsite/${campsiteWithReviews}?reviewer_type=solo&sort_by=helpful&page=1&limit=2`
      );

      expect(response.status).toBe(200);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(2);

      const reviews = response.body.data;

      // Check all filters are applied
      reviews.forEach((review: any) => {
        expect(review.reviewer_type).toBe('solo');
      });

      // Check sorting
      if (reviews.length > 1) {
        for (let i = 0; i < reviews.length - 1; i++) {
          expect(reviews[i].helpful_count).toBeGreaterThanOrEqual(
            reviews[i + 1].helpful_count
          );
        }
      }
    });
  });

  // Test 11: Edge cases
  describe('Edge cases', () => {
    it('handles page=0 gracefully', async () => {
      if (!campsiteWithReviews) {
        console.warn('Skipping test: No campsite with reviews found');
        return;
      }

      const response = await request(app).get(
        `/api/reviews/campsite/${campsiteWithReviews}?page=0`
      );

      expect(response.status).toBe(200);
      // Should still return results (page 0 treated as page 1 or returns empty)
      expect(response.body).toHaveProperty('data');
    });

    it('handles very large page number', async () => {
      if (!campsiteWithReviews) {
        console.warn('Skipping test: No campsite with reviews found');
        return;
      }

      const response = await request(app).get(
        `/api/reviews/campsite/${campsiteWithReviews}?page=9999`
      );

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
    });

    it('handles invalid sort_by value gracefully', async () => {
      if (!campsiteWithReviews) {
        console.warn('Skipping test: No campsite with reviews found');
        return;
      }

      const response = await request(app).get(
        `/api/reviews/campsite/${campsiteWithReviews}?sort_by=invalid_sort`
      );

      // Should default to 'newest' or return results sorted by default
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
    });

    it('handles invalid reviewer_type value gracefully', async () => {
      if (!campsiteWithReviews) {
        console.warn('Skipping test: No campsite with reviews found');
        return;
      }

      const response = await request(app).get(
        `/api/reviews/campsite/${campsiteWithReviews}?reviewer_type=invalid_type`
      );

      // Should return empty results or all results
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
    });
  });
});
