/**
 * Integration Test: Province Autocomplete API Endpoint
 * Task T005: Integration test for autocomplete API endpoint
 *
 * Tests the GET /api/provinces/autocomplete endpoint with various scenarios
 * including Thai and English language support, query validation, and result limits.
 */

import request from 'supertest';
import app from '../../../apps/campsite-backend/src/app';

describe('Integration: Province Autocomplete API', () => {
  describe('GET /api/provinces/autocomplete', () => {
    // Test 1: Returns 200 status code
    it('should return 200 status code for valid query', async () => {
      const response = await request(app)
        .get('/api/provinces/autocomplete')
        .query({ q: 'bang' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
    });

    // Test 2: Returns provinces matching query parameter
    it('should return provinces matching the query parameter', async () => {
      const response = await request(app)
        .get('/api/provinces/autocomplete')
        .query({ q: 'chiang' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data.data)).toBe(true);

      // All results should contain 'chiang' in name_en or name_th
      const results = response.body.data.data;
      if (results.length > 0) {
        results.forEach((province: any) => {
          const matchesQuery =
            province.name_en.toLowerCase().includes('chiang') ||
            province.name_th.includes('เชียง');
          expect(matchesQuery).toBe(true);
        });
      }
    });

    // Test 3: Returns maximum 10 results by default
    it('should return maximum 10 results by default', async () => {
      const response = await request(app)
        .get('/api/provinces/autocomplete')
        .query({ q: 'a' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const results = response.body.data.data;
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeLessThanOrEqual(10);
    });

    it('should respect custom limit parameter', async () => {
      const response = await request(app)
        .get('/api/provinces/autocomplete')
        .query({ q: 'a', limit: 5 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const results = response.body.data.data;
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeLessThanOrEqual(5);
    });

    // Test 4: Case-insensitive matching works
    it('should perform case-insensitive matching', async () => {
      const lowercaseResponse = await request(app)
        .get('/api/provinces/autocomplete')
        .query({ q: 'bangkok' });

      const uppercaseResponse = await request(app)
        .get('/api/provinces/autocomplete')
        .query({ q: 'BANGKOK' });

      const mixedCaseResponse = await request(app)
        .get('/api/provinces/autocomplete')
        .query({ q: 'BaNgKoK' });

      expect(lowercaseResponse.status).toBe(200);
      expect(uppercaseResponse.status).toBe(200);
      expect(mixedCaseResponse.status).toBe(200);

      // All should return the same results
      const lowercaseData = lowercaseResponse.body.data.data;
      const uppercaseData = uppercaseResponse.body.data.data;
      const mixedCaseData = mixedCaseResponse.body.data.data;

      expect(lowercaseData.length).toBeGreaterThan(0);
      expect(lowercaseData.length).toBe(uppercaseData.length);
      expect(lowercaseData.length).toBe(mixedCaseData.length);
    });

    // Test 5: Thai language search works
    it('should search using Thai language characters', async () => {
      const response = await request(app)
        .get('/api/provinces/autocomplete')
        .query({ q: 'กรุงเทพ' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const results = response.body.data.data;
      expect(Array.isArray(results)).toBe(true);

      if (results.length > 0) {
        // At least one result should match Thai characters
        const hasThaiMatch = results.some((province: any) =>
          province.name_th.includes('กรุงเทพ')
        );
        expect(hasThaiMatch).toBe(true);
      }
    });

    it('should search using Thai province names', async () => {
      const response = await request(app)
        .get('/api/provinces/autocomplete')
        .query({ q: 'เชียง' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const results = response.body.data.data;
      expect(Array.isArray(results)).toBe(true);

      if (results.length > 0) {
        results.forEach((province: any) => {
          const matchesThai = province.name_th.includes('เชียง');
          expect(matchesThai).toBe(true);
        });
      }
    });

    // Test 6: English language search works
    it('should search using English language characters', async () => {
      const response = await request(app)
        .get('/api/provinces/autocomplete')
        .query({ q: 'phuket' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const results = response.body.data.data;
      expect(Array.isArray(results)).toBe(true);

      if (results.length > 0) {
        const hasEnglishMatch = results.some((province: any) =>
          province.name_en.toLowerCase().includes('phuket')
        );
        expect(hasEnglishMatch).toBe(true);
      }
    });

    it('should search using partial English words', async () => {
      const response = await request(app)
        .get('/api/provinces/autocomplete')
        .query({ q: 'bang' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const results = response.body.data.data;
      expect(Array.isArray(results)).toBe(true);

      if (results.length > 0) {
        results.forEach((province: any) => {
          const matchesEnglish = province.name_en.toLowerCase().includes('bang');
          expect(matchesEnglish).toBe(true);
        });
      }
    });

    // Test 7: Empty query returns validation error
    it('should return validation error for empty query', async () => {
      const response = await request(app)
        .get('/api/provinces/autocomplete')
        .query({ q: '' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid query parameters');
    });

    it('should return validation error when query parameter is missing', async () => {
      const response = await request(app)
        .get('/api/provinces/autocomplete');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid query parameters');
    });

    // Test 8: Query under 2 characters returns validation error
    it('should return validation error for single character query', async () => {
      const response = await request(app)
        .get('/api/provinces/autocomplete')
        .query({ q: 'a' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid query parameters');
    });

    it('should accept query with exactly 2 characters', async () => {
      const response = await request(app)
        .get('/api/provinces/autocomplete')
        .query({ q: 'ab' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    // Test 9: Returns proper province structure
    it('should return provinces with proper structure (id, name_en, name_th)', async () => {
      const response = await request(app)
        .get('/api/provinces/autocomplete')
        .query({ q: 'bangkok' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const results = response.body.data.data;
      expect(Array.isArray(results)).toBe(true);

      if (results.length > 0) {
        results.forEach((province: any) => {
          // Check required fields
          expect(province).toHaveProperty('id');
          expect(province).toHaveProperty('name_en');
          expect(province).toHaveProperty('name_th');

          // Validate field types
          expect(typeof province.id).toBe('number');
          expect(typeof province.name_en).toBe('string');
          expect(typeof province.name_th).toBe('string');

          // Check non-empty strings
          expect(province.name_en.length).toBeGreaterThan(0);
          expect(province.name_th.length).toBeGreaterThan(0);
        });
      }
    });

    it('should include slug and region in province structure', async () => {
      const response = await request(app)
        .get('/api/provinces/autocomplete')
        .query({ q: 'chiang' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const results = response.body.data.data;

      if (results.length > 0) {
        results.forEach((province: any) => {
          // Additional fields from ProvinceSuggestion type
          expect(province).toHaveProperty('slug');
          expect(province).toHaveProperty('region');

          expect(typeof province.slug).toBe('string');
          expect(typeof province.region).toBe('string');
          expect(province.slug.length).toBeGreaterThan(0);
          expect(province.region.length).toBeGreaterThan(0);
        });
      }
    });

    // Additional edge cases
    it('should handle queries with special characters gracefully', async () => {
      const response = await request(app)
        .get('/api/provinces/autocomplete')
        .query({ q: 'test-province' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.data)).toBe(true);
    });

    it('should return empty results for non-matching queries', async () => {
      const response = await request(app)
        .get('/api/provinces/autocomplete')
        .query({ q: 'zzzzzzzzz' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const results = response.body.data.data;
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    });

    it('should validate limit parameter bounds', async () => {
      const tooLargeResponse = await request(app)
        .get('/api/provinces/autocomplete')
        .query({ q: 'test', limit: 100 });

      expect(tooLargeResponse.status).toBe(400);
      expect(tooLargeResponse.body.success).toBe(false);
    });

    it('should reject negative limit values', async () => {
      const response = await request(app)
        .get('/api/provinces/autocomplete')
        .query({ q: 'test', limit: -1 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject zero limit values', async () => {
      const response = await request(app)
        .get('/api/provinces/autocomplete')
        .query({ q: 'test', limit: 0 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should include count in response metadata', async () => {
      const response = await request(app)
        .get('/api/provinces/autocomplete')
        .query({ q: 'chiang' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('count');
      expect(typeof response.body.data.count).toBe('number');
      expect(response.body.data.count).toBe(response.body.data.data.length);
    });
  });
});
