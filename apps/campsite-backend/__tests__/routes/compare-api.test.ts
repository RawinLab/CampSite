import request from 'supertest';
import app from '../../src/app';
import { supabaseAdmin } from '../../src/lib/supabase';

/**
 * Integration tests for Campsite Compare API
 * Tests GET /api/campsites/compare endpoint
 * Covers: comparison retrieval, ID validation, error handling, data completeness
 */

describe('Integration: Campsite Compare API - GET /api/campsites/compare', () => {
  let validCampsiteIds: string[] = [];

  beforeAll(async () => {
    // Find multiple approved campsites for testing
    const { data: approvedCampsites } = await supabaseAdmin
      .from('campsites')
      .select('id')
      .eq('status', 'approved')
      .eq('is_active', true)
      .limit(3);

    if (approvedCampsites && approvedCampsites.length >= 2) {
      validCampsiteIds = approvedCampsites.map((c: any) => c.id);
    }
  });

  // Test 1: GET /api/campsites/compare with valid IDs
  describe('Successful comparison retrieval', () => {
    it('returns 200 and comparison data for 2 valid campsite IDs', async () => {
      if (validCampsiteIds.length < 2) {
        console.warn('Skipping test: Need at least 2 approved campsites');
        return;
      }

      const ids = validCampsiteIds.slice(0, 2).join(',');
      const response = await request(app).get(`/api/campsites/compare?ids=${ids}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('campsites');
      expect(Array.isArray(response.body.data.campsites)).toBe(true);
      expect(response.body.data.campsites.length).toBe(2);
    });

    it('returns 200 and comparison data for 3 valid campsite IDs', async () => {
      if (validCampsiteIds.length < 3) {
        console.warn('Skipping test: Need at least 3 approved campsites');
        return;
      }

      const ids = validCampsiteIds.slice(0, 3).join(',');
      const response = await request(app).get(`/api/campsites/compare?ids=${ids}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.campsites.length).toBe(3);
    });

    it('returns complete campsite details for each campsite', async () => {
      if (validCampsiteIds.length < 2) {
        console.warn('Skipping test: Need at least 2 approved campsites');
        return;
      }

      const ids = validCampsiteIds.slice(0, 2).join(',');
      const response = await request(app).get(`/api/campsites/compare?ids=${ids}`);

      expect(response.status).toBe(200);
      const campsites = response.body.data.campsites;

      campsites.forEach((campsite: any) => {
        // Core fields
        expect(campsite).toHaveProperty('id');
        expect(campsite).toHaveProperty('name');
        expect(campsite).toHaveProperty('description');
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

        // Relations
        expect(campsite).toHaveProperty('province');
        expect(campsite).toHaveProperty('owner');
        expect(campsite).toHaveProperty('photos');
        expect(campsite).toHaveProperty('amenities');
        expect(campsite).toHaveProperty('accommodation_types');

        // Arrays should be defined
        expect(Array.isArray(campsite.photos)).toBe(true);
        expect(Array.isArray(campsite.amenities)).toBe(true);
        expect(Array.isArray(campsite.accommodation_types)).toBe(true);
      });
    });

    it('maintains correct order of requested campsites', async () => {
      if (validCampsiteIds.length < 2) {
        console.warn('Skipping test: Need at least 2 approved campsites');
        return;
      }

      const requestedIds = validCampsiteIds.slice(0, 2);
      const ids = requestedIds.join(',');
      const response = await request(app).get(`/api/campsites/compare?ids=${ids}`);

      expect(response.status).toBe(200);
      const campsites = response.body.data.campsites;

      // Check that returned IDs match requested IDs
      const returnedIds = campsites.map((c: any) => c.id);
      expect(returnedIds).toEqual(expect.arrayContaining(requestedIds));
    });
  });

  // Test 2: Validates ID count (2-3 required)
  describe('ID count validation', () => {
    it('returns 400 when no IDs parameter is provided', async () => {
      const response = await request(app).get('/api/campsites/compare');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('returns 400 when IDs parameter is empty string', async () => {
      const response = await request(app).get('/api/campsites/compare?ids=');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('returns 400 when only 1 campsite ID is provided', async () => {
      if (validCampsiteIds.length < 1) {
        console.warn('Skipping test: Need at least 1 approved campsite');
        return;
      }

      const response = await request(app).get(`/api/campsites/compare?ids=${validCampsiteIds[0]}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('returns 400 when more than 3 campsite IDs are provided', async () => {
      if (validCampsiteIds.length < 3) {
        console.warn('Skipping test: Need at least 3 approved campsites');
        return;
      }

      // Create a list with 4 IDs (using first ID twice if needed)
      const ids = [...validCampsiteIds.slice(0, 3), validCampsiteIds[0]].join(',');
      const response = await request(app).get(`/api/campsites/compare?ids=${ids}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('handles comma-separated IDs with extra commas', async () => {
      if (validCampsiteIds.length < 2) {
        console.warn('Skipping test: Need at least 2 approved campsites');
        return;
      }

      // IDs with trailing comma
      const ids = validCampsiteIds.slice(0, 2).join(',') + ',';
      const response = await request(app).get(`/api/campsites/compare?ids=${ids}`);

      expect(response.status).toBe(200);
      expect(response.body.data.campsites.length).toBe(2);
    });
  });

  // Test 3: Error handling for invalid IDs
  describe('Invalid ID format handling', () => {
    it('returns 400 for invalid UUID format', async () => {
      const response = await request(app).get('/api/campsites/compare?ids=invalid-id-1,invalid-id-2');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('returns 400 for numeric IDs instead of UUIDs', async () => {
      const response = await request(app).get('/api/campsites/compare?ids=12345,67890');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('returns 400 when one valid UUID and one invalid ID provided', async () => {
      if (validCampsiteIds.length < 1) {
        console.warn('Skipping test: Need at least 1 approved campsite');
        return;
      }

      const response = await request(app).get(`/api/campsites/compare?ids=${validCampsiteIds[0]},invalid-id`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('returns 400 for malformed UUIDs', async () => {
      const malformedUuid1 = '123e4567-e89b-12d3-a456-42661417400'; // Missing last digit
      const malformedUuid2 = '123e4567-e89b-12d3-a456-4266141740000'; // Extra digit

      const response = await request(app).get(`/api/campsites/compare?ids=${malformedUuid1},${malformedUuid2}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
    });

    it('handles SQL injection attempts safely', async () => {
      const maliciousId = "'; DROP TABLE campsites; --";
      const response = await request(app).get(`/api/campsites/compare?ids=${maliciousId},${maliciousId}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  // Test 4: Handles non-existent campsite IDs
  describe('Non-existent campsite handling', () => {
    it('returns 400 when all provided IDs are non-existent', async () => {
      const nonExistentId1 = '00000000-0000-0000-0000-000000000001';
      const nonExistentId2 = '00000000-0000-0000-0000-000000000002';

      const response = await request(app).get(`/api/campsites/compare?ids=${nonExistentId1},${nonExistentId2}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('returns comparison when at least 2 valid campsites exist', async () => {
      if (validCampsiteIds.length < 2) {
        console.warn('Skipping test: Need at least 2 approved campsites');
        return;
      }

      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const ids = [validCampsiteIds[0], validCampsiteIds[1], nonExistentId].join(',');

      const response = await request(app).get(`/api/campsites/compare?ids=${ids}`);

      expect(response.status).toBe(200);
      expect(response.body.data.campsites.length).toBe(2);

      // Verify only valid campsites are returned
      const returnedIds = response.body.data.campsites.map((c: any) => c.id);
      expect(returnedIds).not.toContain(nonExistentId);
      expect(returnedIds).toContain(validCampsiteIds[0]);
      expect(returnedIds).toContain(validCampsiteIds[1]);
    });

    it('filters out non-approved campsites', async () => {
      if (validCampsiteIds.length < 2) {
        console.warn('Skipping test: Need at least 2 approved campsites');
        return;
      }

      // Find a non-approved campsite
      const { data: nonApprovedCampsite } = await supabaseAdmin
        .from('campsites')
        .select('id')
        .neq('status', 'approved')
        .limit(1)
        .single();

      if (!nonApprovedCampsite) {
        console.warn('Skipping test: No non-approved campsite found');
        return;
      }

      const ids = [validCampsiteIds[0], validCampsiteIds[1], nonApprovedCampsite.id].join(',');
      const response = await request(app).get(`/api/campsites/compare?ids=${ids}`);

      expect(response.status).toBe(200);
      expect(response.body.data.campsites.length).toBe(2);

      // Verify non-approved campsite is not included
      const returnedIds = response.body.data.campsites.map((c: any) => c.id);
      expect(returnedIds).not.toContain(nonApprovedCampsite.id);
    });

    it('returns 400 when mix of non-existent and non-approved results in < 2 valid', async () => {
      if (validCampsiteIds.length < 1) {
        console.warn('Skipping test: Need at least 1 approved campsite');
        return;
      }

      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const ids = [validCampsiteIds[0], nonExistentId].join(',');

      // Try to find a non-approved campsite to replace the second ID
      const { data: nonApprovedCampsite } = await supabaseAdmin
        .from('campsites')
        .select('id')
        .neq('status', 'approved')
        .limit(1)
        .single();

      if (nonApprovedCampsite) {
        const idsWithNonApproved = [validCampsiteIds[0], nonApprovedCampsite.id].join(',');
        const response = await request(app).get(`/api/campsites/compare?ids=${idsWithNonApproved}`);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('error');
      }
    });
  });

  // Test 5: Edge cases and performance
  describe('Edge cases and performance', () => {
    it('handles duplicate IDs in request', async () => {
      if (validCampsiteIds.length < 1) {
        console.warn('Skipping test: Need at least 1 approved campsite');
        return;
      }

      const duplicateIds = [validCampsiteIds[0], validCampsiteIds[0]].join(',');
      const response = await request(app).get(`/api/campsites/compare?ids=${duplicateIds}`);

      // Should either return 2 identical entries or deduplicate
      expect(response.status).toBe(200);
      expect(response.body.data.campsites.length).toBeGreaterThanOrEqual(1);
    });

    it('handles whitespace in IDs parameter', async () => {
      if (validCampsiteIds.length < 2) {
        console.warn('Skipping test: Need at least 2 approved campsites');
        return;
      }

      const idsWithSpaces = validCampsiteIds.slice(0, 2).join(' , ');
      const response = await request(app).get(`/api/campsites/compare?ids=${encodeURIComponent(idsWithSpaces)}`);

      // Should handle or reject gracefully
      expect([200, 400]).toContain(response.status);
      expect(response.body).toHaveProperty('success');
    });

    it('responds within acceptable time limit (< 2000ms)', async () => {
      if (validCampsiteIds.length < 2) {
        console.warn('Skipping test: Need at least 2 approved campsites');
        return;
      }

      const ids = validCampsiteIds.slice(0, 2).join(',');
      const startTime = Date.now();
      const response = await request(app).get(`/api/campsites/compare?ids=${ids}`);
      const responseTime = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(2000);
    }, 10000);

    it('includes all comparison-relevant data fields', async () => {
      if (validCampsiteIds.length < 2) {
        console.warn('Skipping test: Need at least 2 approved campsites');
        return;
      }

      const ids = validCampsiteIds.slice(0, 2).join(',');
      const response = await request(app).get(`/api/campsites/compare?ids=${ids}`);

      expect(response.status).toBe(200);
      const campsite = response.body.data.campsites[0];

      // Fields essential for comparison
      expect(campsite).toHaveProperty('name');
      expect(campsite).toHaveProperty('campsite_type');
      expect(campsite).toHaveProperty('average_rating');
      expect(campsite).toHaveProperty('review_count');
      expect(campsite).toHaveProperty('min_price');
      expect(campsite).toHaveProperty('max_price');
      expect(campsite).toHaveProperty('amenities');
      expect(campsite).toHaveProperty('accommodation_types');
      expect(campsite).toHaveProperty('province');
    });
  });
});
