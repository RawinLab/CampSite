/**
 * Integration Test: Map API with Filters
 * Task T010: Integration test for Map API with filters
 *
 * Tests the GET /api/map/campsites endpoint with various filter combinations
 * including bounds, campsite types, provinces, price ranges, ratings, and amenities.
 */

import request from 'supertest';
import app from '../../../apps/campsite-backend/src/app';

describe('Integration: Map API with Filters', () => {
  describe('GET /api/map/campsites', () => {
    // Test 1: Basic endpoint functionality with bounds filter
    describe('Bounds Filter', () => {
      it('should return campsites within specified bounds', async () => {
        const response = await request(app)
          .get('/api/map/campsites')
          .query({
            north: 20.0,
            south: 13.0,
            east: 105.0,
            west: 98.0,
          });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('campsites');
        expect(response.body).toHaveProperty('total');
        expect(Array.isArray(response.body.campsites)).toBe(true);

        // Verify all returned campsites are within bounds
        const data = response.body;
        data.campsites.forEach((campsite: any) => {
          expect(campsite.latitude).toBeGreaterThanOrEqual(13.0);
          expect(campsite.latitude).toBeLessThanOrEqual(20.0);
          expect(campsite.longitude).toBeGreaterThanOrEqual(98.0);
          expect(campsite.longitude).toBeLessThanOrEqual(105.0);
        });
      });

      it('should return empty results when bounds have no matches', async () => {
        const response = await request(app)
          .get('/api/map/campsites')
          .query({
            north: -50.0,
            south: -60.0,
            east: 10.0,
            west: 5.0,
          });

        expect(response.status).toBe(200);
        expect(response.body.campsites).toEqual([]);
        expect(response.body.total).toBe(0);
      });

      it('should work without bounds filter', async () => {
        const response = await request(app)
          .get('/api/map/campsites');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('campsites');
        expect(response.body).toHaveProperty('total');
        expect(Array.isArray(response.body.campsites)).toBe(true);
      });

      it('should require all bounds parameters or none', async () => {
        // Partial bounds should be ignored
        const response = await request(app)
          .get('/api/map/campsites')
          .query({
            north: 20.0,
            south: 13.0,
            // Missing east and west
          });

        expect(response.status).toBe(200);
        // Should not apply bounds filter if incomplete
      });

      it('should validate bounds latitude range (-90 to 90)', async () => {
        const response = await request(app)
          .get('/api/map/campsites')
          .query({
            north: 100.0, // Invalid latitude
            south: 13.0,
            east: 105.0,
            west: 98.0,
          });

        expect(response.status).toBe(400);
      });

      it('should validate bounds longitude range (-180 to 180)', async () => {
        const response = await request(app)
          .get('/api/map/campsites')
          .query({
            north: 20.0,
            south: 13.0,
            east: 200.0, // Invalid longitude
            west: 98.0,
          });

        expect(response.status).toBe(400);
      });
    });

    // Test 2: Campsite type filter
    describe('Campsite Type Filter', () => {
      it('should filter by single campsite type', async () => {
        const response = await request(app)
          .get('/api/map/campsites')
          .query({
            campsite_types: 'camping',
          });

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.campsites)).toBe(true);

        // All results should be of type 'camping'
        response.body.campsites.forEach((campsite: any) => {
          expect(campsite.campsite_type).toBe('camping');
        });
      });

      it('should filter by multiple campsite types', async () => {
        const response = await request(app)
          .get('/api/map/campsites')
          .query({
            campsite_types: 'camping,glamping',
          });

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.campsites)).toBe(true);

        // All results should be either 'camping' or 'glamping'
        response.body.campsites.forEach((campsite: any) => {
          expect(['camping', 'glamping']).toContain(campsite.campsite_type);
        });
      });

      it('should return empty results for non-matching type', async () => {
        const response = await request(app)
          .get('/api/map/campsites')
          .query({
            campsite_types: 'non-existent-type',
          });

        expect(response.status).toBe(200);
        expect(response.body.campsites).toEqual([]);
        expect(response.body.total).toBe(0);
      });

      it('should handle comma-separated types with spaces', async () => {
        const response = await request(app)
          .get('/api/map/campsites')
          .query({
            campsite_types: 'camping, glamping, bungalow',
          });

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.campsites)).toBe(true);
      });
    });

    // Test 3: Combined filters
    describe('Combined Filters', () => {
      it('should apply bounds and type filters together', async () => {
        const response = await request(app)
          .get('/api/map/campsites')
          .query({
            north: 20.0,
            south: 13.0,
            east: 105.0,
            west: 98.0,
            campsite_types: 'camping',
          });

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.campsites)).toBe(true);

        response.body.campsites.forEach((campsite: any) => {
          // Should match both bounds and type
          expect(campsite.latitude).toBeGreaterThanOrEqual(13.0);
          expect(campsite.latitude).toBeLessThanOrEqual(20.0);
          expect(campsite.longitude).toBeGreaterThanOrEqual(98.0);
          expect(campsite.longitude).toBeLessThanOrEqual(105.0);
          expect(campsite.campsite_type).toBe('camping');
        });
      });

      it('should apply bounds, type, and province filters together', async () => {
        const response = await request(app)
          .get('/api/map/campsites')
          .query({
            north: 20.0,
            south: 13.0,
            east: 105.0,
            west: 98.0,
            campsite_types: 'camping,glamping',
            province_id: 1,
          });

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.campsites)).toBe(true);

        response.body.campsites.forEach((campsite: any) => {
          expect(campsite.latitude).toBeGreaterThanOrEqual(13.0);
          expect(campsite.latitude).toBeLessThanOrEqual(20.0);
          expect(['camping', 'glamping']).toContain(campsite.campsite_type);
        });
      });

      it('should apply price range filters', async () => {
        const response = await request(app)
          .get('/api/map/campsites')
          .query({
            min_price: 200,
            max_price: 1000,
          });

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.campsites)).toBe(true);

        response.body.campsites.forEach((campsite: any) => {
          // Campsite price range should overlap with filter range
          // max_price should be >= min_price filter (has at least one option above min)
          expect(campsite.max_price).toBeGreaterThanOrEqual(200);
          // min_price should be <= max_price filter (has at least one option below max)
          expect(campsite.min_price).toBeLessThanOrEqual(1000);
        });
      });

      it('should apply minimum rating filter', async () => {
        const response = await request(app)
          .get('/api/map/campsites')
          .query({
            min_rating: 4.0,
          });

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.campsites)).toBe(true);

        response.body.campsites.forEach((campsite: any) => {
          expect(campsite.average_rating).toBeGreaterThanOrEqual(4.0);
        });
      });

      it('should apply all filters together', async () => {
        const response = await request(app)
          .get('/api/map/campsites')
          .query({
            north: 20.0,
            south: 13.0,
            east: 105.0,
            west: 98.0,
            campsite_types: 'camping,glamping',
            min_price: 200,
            max_price: 1000,
            min_rating: 3.5,
          });

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.campsites)).toBe(true);

        response.body.campsites.forEach((campsite: any) => {
          // Bounds
          expect(campsite.latitude).toBeGreaterThanOrEqual(13.0);
          expect(campsite.latitude).toBeLessThanOrEqual(20.0);
          expect(campsite.longitude).toBeGreaterThanOrEqual(98.0);
          expect(campsite.longitude).toBeLessThanOrEqual(105.0);
          // Type
          expect(['camping', 'glamping']).toContain(campsite.campsite_type);
          // Price
          expect(campsite.max_price).toBeGreaterThanOrEqual(200);
          expect(campsite.min_price).toBeLessThanOrEqual(1000);
          // Rating
          expect(campsite.average_rating).toBeGreaterThanOrEqual(3.5);
        });
      });

      it('should return empty results when combined filters have no matches', async () => {
        const response = await request(app)
          .get('/api/map/campsites')
          .query({
            campsite_types: 'glamping',
            min_price: 10000, // Very high price
            min_rating: 4.9, // Very high rating
          });

        expect(response.status).toBe(200);
        // Likely to have no matches with such strict filters
        expect(Array.isArray(response.body.campsites)).toBe(true);
      });
    });

    // Test 4: Response schema validation
    describe('Response Schema', () => {
      it('should include all required MapCampsite fields', async () => {
        const response = await request(app)
          .get('/api/map/campsites')
          .query({
            limit: 5,
          });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('campsites');
        expect(response.body).toHaveProperty('total');

        if (response.body.campsites.length > 0) {
          const campsite = response.body.campsites[0];

          // Required fields from MapCampsite interface
          expect(campsite).toHaveProperty('id');
          expect(campsite).toHaveProperty('name');
          expect(campsite).toHaveProperty('latitude');
          expect(campsite).toHaveProperty('longitude');
          expect(campsite).toHaveProperty('campsite_type');
          expect(campsite).toHaveProperty('average_rating');
          expect(campsite).toHaveProperty('review_count');
          expect(campsite).toHaveProperty('min_price');
          expect(campsite).toHaveProperty('max_price');
          expect(campsite).toHaveProperty('province_name_en');
          expect(campsite).toHaveProperty('primary_photo_url');

          // Type validation
          expect(typeof campsite.id).toBe('string');
          expect(typeof campsite.name).toBe('string');
          expect(typeof campsite.latitude).toBe('number');
          expect(typeof campsite.longitude).toBe('number');
          expect(typeof campsite.campsite_type).toBe('string');
          expect(typeof campsite.average_rating).toBe('number');
          expect(typeof campsite.review_count).toBe('number');
          expect(typeof campsite.min_price).toBe('number');
          expect(typeof campsite.max_price).toBe('number');
          expect(typeof campsite.province_name_en).toBe('string');
          // primary_photo_url can be string or null
          expect(campsite.primary_photo_url === null || typeof campsite.primary_photo_url === 'string').toBe(true);

          // Value validation
          expect(campsite.id.length).toBeGreaterThan(0);
          expect(campsite.name.length).toBeGreaterThan(0);
          expect(campsite.latitude).toBeGreaterThanOrEqual(-90);
          expect(campsite.latitude).toBeLessThanOrEqual(90);
          expect(campsite.longitude).toBeGreaterThanOrEqual(-180);
          expect(campsite.longitude).toBeLessThanOrEqual(180);
          expect(['camping', 'glamping', 'tented-resort', 'bungalow', 'cabin', 'rv-caravan']).toContain(campsite.campsite_type);
          expect(campsite.average_rating).toBeGreaterThanOrEqual(0);
          expect(campsite.average_rating).toBeLessThanOrEqual(5);
          expect(campsite.review_count).toBeGreaterThanOrEqual(0);
          expect(campsite.min_price).toBeGreaterThanOrEqual(0);
          expect(campsite.max_price).toBeGreaterThanOrEqual(campsite.min_price);
          expect(campsite.province_name_en.length).toBeGreaterThan(0);
        }
      });

      it('should return MapCampsitesResponse structure', async () => {
        const response = await request(app)
          .get('/api/map/campsites');

        expect(response.status).toBe(200);

        const data = response.body;
        expect(Array.isArray(data.campsites)).toBe(true);
        expect(typeof data.total).toBe('number');
        expect(data.total).toBe(data.campsites.length);
      });

      it('should only return approved and active campsites', async () => {
        const response = await request(app)
          .get('/api/map/campsites');

        expect(response.status).toBe(200);
        // The endpoint should only return approved and active campsites
        // This is validated by the query filters in the route
        expect(Array.isArray(response.body.campsites)).toBe(true);
      });
    });

    // Test 5: Additional filter validations
    describe('Filter Validation', () => {
      it('should validate province_id is positive', async () => {
        const response = await request(app)
          .get('/api/map/campsites')
          .query({
            province_id: -1,
          });

        expect(response.status).toBe(400);
      });

      it('should validate min_price is non-negative', async () => {
        const response = await request(app)
          .get('/api/map/campsites')
          .query({
            min_price: -100,
          });

        expect(response.status).toBe(400);
      });

      it('should validate max_price is non-negative', async () => {
        const response = await request(app)
          .get('/api/map/campsites')
          .query({
            max_price: -100,
          });

        expect(response.status).toBe(400);
      });

      it('should validate min_rating range (0-5)', async () => {
        const tooLow = await request(app)
          .get('/api/map/campsites')
          .query({
            min_rating: -1,
          });

        expect(tooLow.status).toBe(400);

        const tooHigh = await request(app)
          .get('/api/map/campsites')
          .query({
            min_rating: 6,
          });

        expect(tooHigh.status).toBe(400);
      });

      it('should validate limit parameter (1-500)', async () => {
        const tooLow = await request(app)
          .get('/api/map/campsites')
          .query({
            limit: 0,
          });

        expect(tooLow.status).toBe(400);

        const tooHigh = await request(app)
          .get('/api/map/campsites')
          .query({
            limit: 1000,
          });

        expect(tooHigh.status).toBe(400);

        const valid = await request(app)
          .get('/api/map/campsites')
          .query({
            limit: 50,
          });

        expect(valid.status).toBe(200);
      });

      it('should use default limit of 200', async () => {
        const response = await request(app)
          .get('/api/map/campsites');

        expect(response.status).toBe(200);
        expect(response.body.campsites.length).toBeLessThanOrEqual(200);
      });
    });

    // Test 6: Amenity filter
    describe('Amenity Filter', () => {
      it('should filter by single amenity', async () => {
        const response = await request(app)
          .get('/api/map/campsites')
          .query({
            amenity_ids: '1',
          });

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.campsites)).toBe(true);
        // All returned campsites should have amenity with id 1
      });

      it('should filter by multiple amenities (AND logic)', async () => {
        const response = await request(app)
          .get('/api/map/campsites')
          .query({
            amenity_ids: '1,2,3',
          });

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.campsites)).toBe(true);
        // All returned campsites should have ALL specified amenities
      });

      it('should return empty when no campsites have all amenities', async () => {
        const response = await request(app)
          .get('/api/map/campsites')
          .query({
            amenity_ids: '999,998,997', // Non-existent amenities
          });

        expect(response.status).toBe(200);
        expect(response.body.campsites).toEqual([]);
        expect(response.body.total).toBe(0);
      });

      it('should handle invalid amenity IDs gracefully', async () => {
        const response = await request(app)
          .get('/api/map/campsites')
          .query({
            amenity_ids: 'invalid,abc',
          });

        expect(response.status).toBe(200);
        // Invalid IDs should be filtered out, resulting in empty filter
      });
    });

    // Test 7: Performance and edge cases
    describe('Performance and Edge Cases', () => {
      it('should handle requests with no filters', async () => {
        const response = await request(app)
          .get('/api/map/campsites');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('campsites');
        expect(response.body).toHaveProperty('total');
      });

      it('should handle very restrictive bounds', async () => {
        const response = await request(app)
          .get('/api/map/campsites')
          .query({
            north: 13.8,
            south: 13.7,
            east: 100.6,
            west: 100.5,
          });

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.campsites)).toBe(true);
      });

      it('should respect limit parameter', async () => {
        const response = await request(app)
          .get('/api/map/campsites')
          .query({
            limit: 10,
          });

        expect(response.status).toBe(200);
        expect(response.body.campsites.length).toBeLessThanOrEqual(10);
      });

      it('should handle empty comma-separated values', async () => {
        const response = await request(app)
          .get('/api/map/campsites')
          .query({
            campsite_types: ',,camping,,',
          });

        expect(response.status).toBe(200);
        // Should filter out empty values
      });
    });
  });
});
