import request from 'supertest';
import app from '../../src/app';
import { supabaseAdmin } from '../../src/lib/supabase';

/**
 * Integration tests for Campsite Detail API (T045)
 * Tests GET /api/campsites/:id endpoint
 * Covers: detail retrieval, 404 cases, approval status, nested relations, response time
 */

describe('Integration: Campsite Detail API - GET /api/campsites/:id', () => {
  let validCampsiteId: string;
  let nonApprovedCampsiteId: string;

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

    // Find or create a non-approved campsite for testing
    const { data: nonApprovedCampsite } = await supabaseAdmin
      .from('campsites')
      .select('id')
      .neq('status', 'approved')
      .limit(1)
      .single();

    if (nonApprovedCampsite) {
      nonApprovedCampsiteId = nonApprovedCampsite.id;
    }
  });

  // Test 1: GET /api/campsites/:id returns complete detail data
  describe('Successful detail retrieval', () => {
    it('returns 200 and complete campsite detail for valid approved campsite', async () => {
      if (!validCampsiteId) {
        console.warn('Skipping test: No approved campsite found');
        return;
      }

      const startTime = Date.now();
      const response = await request(app).get(`/api/campsites/${validCampsiteId}`);
      const responseTime = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');

      const campsite = response.body.data;

      // Core fields
      expect(campsite).toHaveProperty('id', validCampsiteId);
      expect(campsite).toHaveProperty('name');
      expect(campsite).toHaveProperty('description');
      expect(campsite).toHaveProperty('owner_id');
      expect(campsite).toHaveProperty('province_id');
      expect(campsite).toHaveProperty('address');
      expect(campsite).toHaveProperty('latitude');
      expect(campsite).toHaveProperty('longitude');
      expect(campsite).toHaveProperty('campsite_type');
      expect(campsite).toHaveProperty('status', 'approved');

      // Rating and pricing
      expect(campsite).toHaveProperty('average_rating');
      expect(campsite).toHaveProperty('review_count');
      expect(campsite).toHaveProperty('min_price');
      expect(campsite).toHaveProperty('max_price');

      // Contact info
      expect(campsite).toHaveProperty('phone');
      expect(campsite).toHaveProperty('email');

      // Timestamps
      expect(campsite).toHaveProperty('created_at');
      expect(campsite).toHaveProperty('updated_at');

      // Response time validation (should be under 2 seconds)
      expect(responseTime).toBeLessThan(2000);
    }, 10000);

    it('returns correct data types for all fields', async () => {
      if (!validCampsiteId) {
        console.warn('Skipping test: No approved campsite found');
        return;
      }

      const response = await request(app).get(`/api/campsites/${validCampsiteId}`);
      const campsite = response.body.data;

      expect(typeof campsite.id).toBe('string');
      expect(typeof campsite.name).toBe('string');
      expect(typeof campsite.description).toBe('string');
      expect(typeof campsite.status).toBe('string');
      expect(typeof campsite.average_rating).toBe('number');
      expect(typeof campsite.review_count).toBe('number');

      if (campsite.latitude !== null) {
        expect(typeof campsite.latitude).toBe('number');
      }
      if (campsite.longitude !== null) {
        expect(typeof campsite.longitude).toBe('number');
      }
    });

    it('campsite_type is valid enum value', async () => {
      if (!validCampsiteId) {
        console.warn('Skipping test: No approved campsite found');
        return;
      }

      const response = await request(app).get(`/api/campsites/${validCampsiteId}`);
      const campsite = response.body.data;

      const validTypes = ['camping', 'glamping', 'tented-resort', 'bungalow'];
      expect(validTypes).toContain(campsite.campsite_type);
    });
  });

  // Test 2: Returns 404 for non-existent campsite
  describe('Non-existent campsite', () => {
    it('returns 404 for non-existent UUID', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app).get(`/api/campsites/${nonExistentId}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error.message.toLowerCase()).toContain('not found');
    });

    it('returns 404 for invalid UUID format', async () => {
      const invalidId = 'invalid-uuid-format';
      const response = await request(app).get(`/api/campsites/${invalidId}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
    });

    it('returns 404 for numeric ID (not UUID)', async () => {
      const response = await request(app).get('/api/campsites/12345');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  // Test 3: Returns 404 for non-approved campsite
  describe('Non-approved campsite access', () => {
    it('returns 404 for pending campsite', async () => {
      if (!nonApprovedCampsiteId) {
        console.warn('Skipping test: No non-approved campsite found');
        return;
      }

      const response = await request(app).get(`/api/campsites/${nonApprovedCampsiteId}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('returns 404 for rejected campsite', async () => {
      // Try to find a rejected campsite
      const { data: rejectedCampsite } = await supabaseAdmin
        .from('campsites')
        .select('id')
        .eq('status', 'rejected')
        .limit(1)
        .single();

      if (!rejectedCampsite) {
        console.warn('Skipping test: No rejected campsite found');
        return;
      }

      const response = await request(app).get(`/api/campsites/${rejectedCampsite.id}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
    });

    it('returns 404 for inactive campsite', async () => {
      // Try to find an inactive campsite
      const { data: inactiveCampsite } = await supabaseAdmin
        .from('campsites')
        .select('id')
        .eq('is_active', false)
        .limit(1)
        .single();

      if (!inactiveCampsite) {
        console.warn('Skipping test: No inactive campsite found');
        return;
      }

      const response = await request(app).get(`/api/campsites/${inactiveCampsite.id}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  // Test 4: Response includes all nested relations
  describe('Nested relations', () => {
    it('includes province relation with correct structure', async () => {
      if (!validCampsiteId) {
        console.warn('Skipping test: No approved campsite found');
        return;
      }

      const response = await request(app).get(`/api/campsites/${validCampsiteId}`);
      const campsite = response.body.data;

      expect(campsite).toHaveProperty('province');
      expect(campsite.province).toBeDefined();

      if (campsite.province) {
        expect(campsite.province).toHaveProperty('id');
        expect(campsite.province).toHaveProperty('name_en');
        expect(campsite.province).toHaveProperty('name_th');
        expect(campsite.province).toHaveProperty('slug');
      }
    });

    it('includes owner relation with correct structure', async () => {
      if (!validCampsiteId) {
        console.warn('Skipping test: No approved campsite found');
        return;
      }

      const response = await request(app).get(`/api/campsites/${validCampsiteId}`);
      const campsite = response.body.data;

      expect(campsite).toHaveProperty('owner');
      expect(campsite.owner).toBeDefined();

      if (campsite.owner) {
        expect(campsite.owner).toHaveProperty('id');
        expect(campsite.owner).toHaveProperty('full_name');
        expect(campsite.owner).toHaveProperty('created_at');
        // avatar_url may be null
        expect(campsite.owner).toHaveProperty('avatar_url');
      }
    });

    it('includes photos array', async () => {
      if (!validCampsiteId) {
        console.warn('Skipping test: No approved campsite found');
        return;
      }

      const response = await request(app).get(`/api/campsites/${validCampsiteId}`);
      const campsite = response.body.data;

      expect(campsite).toHaveProperty('photos');
      expect(Array.isArray(campsite.photos)).toBe(true);

      if (campsite.photos.length > 0) {
        const photo = campsite.photos[0];
        expect(photo).toHaveProperty('id');
        expect(photo).toHaveProperty('campsite_id', validCampsiteId);
        expect(photo).toHaveProperty('url');
        expect(photo).toHaveProperty('alt_text');
        expect(photo).toHaveProperty('sort_order');
      }
    });

    it('includes amenities array', async () => {
      if (!validCampsiteId) {
        console.warn('Skipping test: No approved campsite found');
        return;
      }

      const response = await request(app).get(`/api/campsites/${validCampsiteId}`);
      const campsite = response.body.data;

      expect(campsite).toHaveProperty('amenities');
      expect(Array.isArray(campsite.amenities)).toBe(true);

      if (campsite.amenities.length > 0) {
        const amenity = campsite.amenities[0];
        expect(amenity).toHaveProperty('id');
        expect(amenity).toHaveProperty('name_en');
        expect(amenity).toHaveProperty('name_th');
        expect(amenity).toHaveProperty('icon');
        expect(amenity).toHaveProperty('category');
      }
    });

    it('includes accommodation_types array', async () => {
      if (!validCampsiteId) {
        console.warn('Skipping test: No approved campsite found');
        return;
      }

      const response = await request(app).get(`/api/campsites/${validCampsiteId}`);
      const campsite = response.body.data;

      expect(campsite).toHaveProperty('accommodation_types');
      expect(Array.isArray(campsite.accommodation_types)).toBe(true);

      if (campsite.accommodation_types.length > 0) {
        const accommodation = campsite.accommodation_types[0];
        expect(accommodation).toHaveProperty('id');
        expect(accommodation).toHaveProperty('campsite_id', validCampsiteId);
        expect(accommodation).toHaveProperty('name');
        expect(accommodation).toHaveProperty('price_per_night');
        expect(accommodation).toHaveProperty('capacity');
        expect(accommodation).toHaveProperty('is_active');
      }
    });

    it('includes nearby_attractions array', async () => {
      if (!validCampsiteId) {
        console.warn('Skipping test: No approved campsite found');
        return;
      }

      const response = await request(app).get(`/api/campsites/${validCampsiteId}`);
      const campsite = response.body.data;

      expect(campsite).toHaveProperty('nearby_attractions');
      expect(Array.isArray(campsite.nearby_attractions)).toBe(true);

      if (campsite.nearby_attractions.length > 0) {
        const attraction = campsite.nearby_attractions[0];
        expect(attraction).toHaveProperty('id');
        expect(attraction).toHaveProperty('campsite_id', validCampsiteId);
        expect(attraction).toHaveProperty('name');
        expect(attraction).toHaveProperty('distance_km');
        expect(typeof attraction.distance_km).toBe('number');
      }
    });

    it('includes review_summary with correct structure', async () => {
      if (!validCampsiteId) {
        console.warn('Skipping test: No approved campsite found');
        return;
      }

      const response = await request(app).get(`/api/campsites/${validCampsiteId}`);
      const campsite = response.body.data;

      expect(campsite).toHaveProperty('review_summary');

      if (campsite.review_summary) {
        expect(campsite.review_summary).toHaveProperty('average_rating');
        expect(campsite.review_summary).toHaveProperty('total_reviews');
        expect(campsite.review_summary).toHaveProperty('rating_distribution');

        if (campsite.review_summary.rating_distribution) {
          expect(campsite.review_summary.rating_distribution).toHaveProperty('1');
          expect(campsite.review_summary.rating_distribution).toHaveProperty('2');
          expect(campsite.review_summary.rating_distribution).toHaveProperty('3');
          expect(campsite.review_summary.rating_distribution).toHaveProperty('4');
          expect(campsite.review_summary.rating_distribution).toHaveProperty('5');
        }
      }
    });

    it('includes recent_reviews array', async () => {
      if (!validCampsiteId) {
        console.warn('Skipping test: No approved campsite found');
        return;
      }

      const response = await request(app).get(`/api/campsites/${validCampsiteId}`);
      const campsite = response.body.data;

      expect(campsite).toHaveProperty('recent_reviews');
      expect(Array.isArray(campsite.recent_reviews)).toBe(true);

      if (campsite.recent_reviews.length > 0) {
        const review = campsite.recent_reviews[0];
        expect(review).toHaveProperty('id');
        expect(review).toHaveProperty('campsite_id', validCampsiteId);
        expect(review).toHaveProperty('user_id');
        expect(review).toHaveProperty('rating');
        expect(review).toHaveProperty('review_text');
        expect(review).toHaveProperty('created_at');
      }

      // Should return max 5 recent reviews
      expect(campsite.recent_reviews.length).toBeLessThanOrEqual(5);
    });
  });

  // Test 5: Response time validation
  describe('Performance', () => {
    it('responds within acceptable time limit (< 1000ms)', async () => {
      if (!validCampsiteId) {
        console.warn('Skipping test: No approved campsite found');
        return;
      }

      const startTime = Date.now();
      const response = await request(app).get(`/api/campsites/${validCampsiteId}`);
      const responseTime = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(1000);
    });

    it('responds within acceptable time for multiple sequential requests', async () => {
      if (!validCampsiteId) {
        console.warn('Skipping test: No approved campsite found');
        return;
      }

      const requests = 3;
      const responseTimes: number[] = [];

      for (let i = 0; i < requests; i++) {
        const startTime = Date.now();
        await request(app).get(`/api/campsites/${validCampsiteId}`);
        responseTimes.push(Date.now() - startTime);
      }

      const averageTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      expect(averageTime).toBeLessThan(1000);

      // No single request should exceed 2 seconds
      responseTimes.forEach((time) => {
        expect(time).toBeLessThan(2000);
      });
    });
  });

  // Additional edge cases
  describe('Edge cases', () => {
    it('handles SQL injection attempts safely', async () => {
      const maliciousId = "'; DROP TABLE campsites; --";
      const response = await request(app).get(`/api/campsites/${maliciousId}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
    });

    it('handles very long invalid IDs', async () => {
      const longId = 'a'.repeat(1000);
      const response = await request(app).get(`/api/campsites/${longId}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
    });

    it('handles special characters in ID', async () => {
      const specialId = '!@#$%^&*()';
      const response = await request(app).get(`/api/campsites/${specialId}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
    });
  });
});
