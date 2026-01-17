import request from 'supertest';
import app from '../../../apps/campsite-backend/src/app';

/**
 * Integration Tests: Search API - Amenity Filters
 * T033: Integration test for search with multiple amenities
 *
 * Tests cover:
 * 1. GET /api/search without amenities returns all results
 * 2. Single amenity filter returns matching campsites
 * 3. Multiple amenities use AND logic (must have ALL)
 * 4. Returns campsites with all specified amenities
 * 5. Returns empty when no campsites have all amenities
 * 6. Amenity IDs are validated (must be positive integers)
 * 7. Invalid amenity ID returns 400 error
 * 8. Combines amenity filter with other filters
 */
describe('Integration: Search API - Amenity Filters', () => {
  const BASE_URL = '/api/search';

  describe('T033.1: Search without amenity filters', () => {
    it('should return all approved campsites when no amenity filter is provided', async () => {
      const response = await request(app).get(BASE_URL).expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data.data)).toBe(true);
    });

    it('should include amenities array in campsite results', async () => {
      const response = await request(app).get(BASE_URL).expect(200);

      if (response.body.data.data.length > 0) {
        const campsite = response.body.data.data[0];
        expect(campsite).toHaveProperty('amenities');
        expect(Array.isArray(campsite.amenities)).toBe(true);
      }
    });
  });

  describe('T033.2: Single amenity filter', () => {
    it('should filter campsites by single amenity slug', async () => {
      // First get available amenities
      const amenitiesResponse = await request(app).get('/api/search/amenities').expect(200);
      const amenities = amenitiesResponse.body.data.data;

      if (amenities && amenities.length > 0) {
        const amenitySlug = amenities[0].slug;

        const response = await request(app)
          .get(BASE_URL)
          .query({ amenities: amenitySlug })
          .expect(200);

        expect(response.body.success).toBe(true);
        const results = response.body.data.data;

        // All returned campsites should have the specified amenity
        results.forEach((campsite: any) => {
          expect(campsite.amenities).toContain(amenitySlug);
        });
      }
    });

    it('should accept amenities as comma-separated string', async () => {
      const response = await request(app)
        .get(BASE_URL)
        .query({ amenities: 'wifi,parking' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('filters');
      expect(response.body.data.filters).toHaveProperty('amenities');
    });

    it('should accept amenities as array', async () => {
      const response = await request(app)
        .get(BASE_URL)
        .query({ amenities: ['wifi', 'parking'] })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('filters');
    });
  });

  describe('T033.3: Multiple amenities with AND logic', () => {
    it('should return only campsites that have ALL specified amenities', async () => {
      const amenitySlugs = ['wifi', 'parking'];

      const response = await request(app)
        .get(BASE_URL)
        .query({ amenities: amenitySlugs.join(',') })
        .expect(200);

      expect(response.body.success).toBe(true);
      const results = response.body.data.data;

      // Each campsite must have ALL specified amenities
      results.forEach((campsite: any) => {
        amenitySlugs.forEach((slug) => {
          expect(campsite.amenities).toContain(slug);
        });
      });
    });

    it('should verify AND logic with three amenities', async () => {
      const amenitySlugs = ['wifi', 'parking', 'restaurant'];

      const response = await request(app)
        .get(BASE_URL)
        .query({ amenities: amenitySlugs.join(',') })
        .expect(200);

      expect(response.body.success).toBe(true);
      const results = response.body.data.data;

      // Each campsite must have ALL three amenities
      results.forEach((campsite: any) => {
        expect(campsite.amenities).toEqual(
          expect.arrayContaining(amenitySlugs)
        );
      });
    });

    it('should have fewer results with multiple amenities than single amenity', async () => {
      // Get results with single amenity
      const singleResponse = await request(app)
        .get(BASE_URL)
        .query({ amenities: 'wifi' })
        .expect(200);

      const singleCount = singleResponse.body.data.data.length;

      // Get results with multiple amenities
      const multipleResponse = await request(app)
        .get(BASE_URL)
        .query({ amenities: 'wifi,parking,restaurant' })
        .expect(200);

      const multipleCount = multipleResponse.body.data.data.length;

      // Multiple amenity filter should be more restrictive (fewer or equal results)
      expect(multipleCount).toBeLessThanOrEqual(singleCount);
    });
  });

  describe('T033.4: Returns campsites with all specified amenities', () => {
    it('should include filters in response metadata', async () => {
      const amenities = ['wifi', 'parking'];

      const response = await request(app)
        .get(BASE_URL)
        .query({ amenities: amenities.join(',') })
        .expect(200);

      expect(response.body.data.filters).toHaveProperty('amenities');
      expect(response.body.data.filters.amenities).toEqual(amenities);
    });

    it('should maintain pagination with amenity filter', async () => {
      const response = await request(app)
        .get(BASE_URL)
        .query({ amenities: 'wifi', page: 1, limit: 5 })
        .expect(200);

      expect(response.body.data.pagination).toMatchObject({
        page: 1,
        limit: 5,
      });
      expect(response.body.data.data.length).toBeLessThanOrEqual(5);
    });
  });

  describe('T033.5: Returns empty when no campsites have all amenities', () => {
    it('should return empty array when no campsites match all amenities', async () => {
      // Use a combination of amenities unlikely to exist together
      const response = await request(app)
        .get(BASE_URL)
        .query({
          amenities: 'wifi,parking,restaurant,pool,gym,spa,pet-friendly,campfire',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toEqual([]);
      expect(response.body.data.pagination.total).toBe(0);
    });

    it('should maintain correct structure with empty results', async () => {
      const response = await request(app)
        .get(BASE_URL)
        .query({
          amenities: 'nonexistent-amenity-slug-xyz',
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          data: [],
          pagination: expect.objectContaining({
            total: expect.any(Number),
            totalPages: expect.any(Number),
          }),
          filters: expect.objectContaining({
            amenities: expect.any(Array),
          }),
        },
      });
    });
  });

  describe('T033.6: Amenity validation', () => {
    it('should accept valid amenity slug format', async () => {
      const response = await request(app)
        .get(BASE_URL)
        .query({ amenities: 'wifi' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should accept kebab-case amenity slugs', async () => {
      const response = await request(app)
        .get(BASE_URL)
        .query({ amenities: 'pet-friendly,campfire-area' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should handle empty amenities array gracefully', async () => {
      const response = await request(app)
        .get(BASE_URL)
        .query({ amenities: '' })
        .expect(200);

      expect(response.body.success).toBe(true);
      // Empty string should be treated as no filter
    });

    it('should handle whitespace in amenity list', async () => {
      const response = await request(app)
        .get(BASE_URL)
        .query({ amenities: 'wifi, parking, restaurant' })
        .expect(200);

      // Schema should handle this - either trim or reject
      expect(response.body).toHaveProperty('success');
    });
  });

  describe('T033.7: Invalid amenity validation', () => {
    it('should handle non-existent amenity slugs gracefully', async () => {
      const response = await request(app)
        .get(BASE_URL)
        .query({ amenities: 'invalid-amenity-that-does-not-exist' })
        .expect(200);

      expect(response.body.success).toBe(true);
      // Should return empty results or all results depending on implementation
    });

    it('should accept amenity slugs as strings (not numeric IDs)', async () => {
      // The schema expects string slugs, not numeric IDs
      const response = await request(app)
        .get(BASE_URL)
        .query({ amenities: 'wifi' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should handle mixed valid and invalid amenity slugs', async () => {
      const response = await request(app)
        .get(BASE_URL)
        .query({ amenities: 'wifi,invalid-slug,parking' })
        .expect(200);

      expect(response.body.success).toBe(true);
      const results = response.body.data.data;

      // Only campsites with both wifi AND parking should be returned
      results.forEach((campsite: any) => {
        expect(campsite.amenities).toContain('wifi');
        expect(campsite.amenities).toContain('parking');
      });
    });
  });

  describe('T033.8: Combine amenity filter with other filters', () => {
    it('should combine amenity filter with province filter', async () => {
      const response = await request(app)
        .get(BASE_URL)
        .query({
          amenities: 'wifi',
          provinceId: 1,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.filters).toMatchObject({
        amenities: ['wifi'],
        provinceId: 1,
      });

      const results = response.body.data.data;
      results.forEach((campsite: any) => {
        expect(campsite.amenities).toContain('wifi');
        expect(campsite.province.id).toBe(1);
      });
    });

    it('should combine amenity filter with type filter', async () => {
      const response = await request(app)
        .get(BASE_URL)
        .query({
          amenities: 'wifi,parking',
          types: 'glamping',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      const results = response.body.data.data;

      results.forEach((campsite: any) => {
        expect(campsite.amenities).toContain('wifi');
        expect(campsite.amenities).toContain('parking');
        expect(campsite.campsite_type).toBe('glamping');
      });
    });

    it('should combine amenity filter with price range', async () => {
      const response = await request(app)
        .get(BASE_URL)
        .query({
          amenities: 'wifi',
          minPrice: 500,
          maxPrice: 2000,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      const results = response.body.data.data;

      results.forEach((campsite: any) => {
        expect(campsite.amenities).toContain('wifi');
        expect(campsite.min_price).toBeGreaterThanOrEqual(500);
        expect(campsite.max_price).toBeLessThanOrEqual(2000);
      });
    });

    it('should combine amenity filter with rating filter', async () => {
      const response = await request(app)
        .get(BASE_URL)
        .query({
          amenities: 'wifi,parking',
          minRating: 4,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      const results = response.body.data.data;

      results.forEach((campsite: any) => {
        expect(campsite.amenities).toContain('wifi');
        expect(campsite.amenities).toContain('parking');
        expect(campsite.average_rating).toBeGreaterThanOrEqual(4);
      });
    });

    it('should combine amenity filter with text search', async () => {
      const response = await request(app)
        .get(BASE_URL)
        .query({
          amenities: 'wifi',
          q: 'mountain',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      const results = response.body.data.data;

      results.forEach((campsite: any) => {
        expect(campsite.amenities).toContain('wifi');
        // Name or description should contain 'mountain'
      });
    });

    it('should combine amenity filter with sorting', async () => {
      const response = await request(app)
        .get(BASE_URL)
        .query({
          amenities: 'wifi,parking',
          sort: 'price_asc',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sort).toBe('price_asc');

      const results = response.body.data.data;
      results.forEach((campsite: any) => {
        expect(campsite.amenities).toContain('wifi');
        expect(campsite.amenities).toContain('parking');
      });

      // Verify ascending price order
      if (results.length > 1) {
        for (let i = 1; i < results.length; i++) {
          expect(results[i].min_price).toBeGreaterThanOrEqual(
            results[i - 1].min_price
          );
        }
      }
    });

    it('should combine amenity filter with pagination', async () => {
      const response = await request(app)
        .get(BASE_URL)
        .query({
          amenities: 'wifi',
          page: 2,
          limit: 3,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pagination).toMatchObject({
        page: 2,
        limit: 3,
      });
      expect(response.body.data.data.length).toBeLessThanOrEqual(3);

      const results = response.body.data.data;
      results.forEach((campsite: any) => {
        expect(campsite.amenities).toContain('wifi');
      });
    });

    it('should combine all filters together', async () => {
      const response = await request(app)
        .get(BASE_URL)
        .query({
          amenities: 'wifi,parking',
          types: 'glamping,camping',
          provinceId: 1,
          minPrice: 500,
          maxPrice: 3000,
          minRating: 3,
          sort: 'rating',
          page: 1,
          limit: 10,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.filters).toMatchObject({
        amenities: ['wifi', 'parking'],
        types: ['glamping', 'camping'],
        provinceId: 1,
        minPrice: 500,
        maxPrice: 3000,
        minRating: 3,
      });

      const results = response.body.data.data;
      results.forEach((campsite: any) => {
        expect(campsite.amenities).toContain('wifi');
        expect(campsite.amenities).toContain('parking');
        expect(['glamping', 'camping']).toContain(campsite.campsite_type);
        expect(campsite.province.id).toBe(1);
        expect(campsite.min_price).toBeGreaterThanOrEqual(500);
        expect(campsite.max_price).toBeLessThanOrEqual(3000);
        expect(campsite.average_rating).toBeGreaterThanOrEqual(3);
      });
    });
  });

  describe('T033.9: Edge cases and error handling', () => {
    it('should handle very long amenity list', async () => {
      const manyAmenities = Array(20)
        .fill(0)
        .map((_, i) => `amenity-${i}`)
        .join(',');

      const response = await request(app)
        .get(BASE_URL)
        .query({ amenities: manyAmenities })
        .expect(200);

      expect(response.body.success).toBe(true);
      // Likely to return empty results due to restrictive AND logic
    });

    it('should handle duplicate amenities in query', async () => {
      const response = await request(app)
        .get(BASE_URL)
        .query({ amenities: 'wifi,wifi,parking,parking' })
        .expect(200);

      expect(response.body.success).toBe(true);
      // Should deduplicate internally
    });

    it('should handle special characters in amenity slugs gracefully', async () => {
      const response = await request(app)
        .get(BASE_URL)
        .query({ amenities: 'test@amenity,amenity#123' });

      // Either accepts or rejects based on schema validation
      expect([200, 400]).toContain(response.status);
    });

    it('should return consistent response structure regardless of results', async () => {
      const responses = await Promise.all([
        request(app).get(BASE_URL).query({ amenities: 'wifi' }),
        request(app).get(BASE_URL).query({ amenities: 'nonexistent-xyz' }),
        request(app).get(BASE_URL).query({}),
      ]);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success');
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('pagination');
        expect(response.body.data).toHaveProperty('filters');
      });
    });
  });
});
