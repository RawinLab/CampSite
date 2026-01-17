import request from 'supertest';
import app from '../../../apps/campsite-backend/src/app';

/**
 * Integration tests for Search API (T044)
 * Tests all search parameters, filters, sorting, pagination, and validation
 */

describe('Integration: Search API - GET /api/search', () => {
  // Test 1: Default params return 200
  describe('Default parameters', () => {
    it('returns 200 with default params', async () => {
      const response = await request(app).get('/api/search');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
    });

    it('returns correct response structure with defaults', async () => {
      const response = await request(app).get('/api/search');

      expect(response.body.data).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data).toHaveProperty('filters');
      expect(response.body.data).toHaveProperty('sort');

      // Check pagination structure
      const { pagination } = response.body.data;
      expect(pagination).toHaveProperty('page', 1);
      expect(pagination).toHaveProperty('limit', 12);
      expect(pagination).toHaveProperty('total');
      expect(pagination).toHaveProperty('totalPages');
      expect(pagination).toHaveProperty('hasNext');
      expect(pagination).toHaveProperty('hasPrev', false);

      // Check data is array
      expect(Array.isArray(response.body.data.data)).toBe(true);
    });

    it('applies default sort by rating', async () => {
      const response = await request(app).get('/api/search');

      expect(response.body.data.sort).toBe('rating');
    });
  });

  // Test 2: Province filter
  describe('Province filter', () => {
    it('filters by provinceId correctly', async () => {
      const response = await request(app).get('/api/search?provinceId=1');

      expect(response.status).toBe(200);
      expect(response.body.data.filters).toHaveProperty('provinceId', 1);

      // All results should have province.id = 1
      const campsites = response.body.data.data;
      if (campsites.length > 0) {
        campsites.forEach((campsite: any) => {
          expect(campsite.province.id).toBe(1);
        });
      }
    });

    it('filters by provinceSlug correctly', async () => {
      const response = await request(app).get('/api/search?provinceSlug=bangkok');

      expect(response.status).toBe(200);

      // All results should have province.slug = 'bangkok'
      const campsites = response.body.data.data;
      if (campsites.length > 0) {
        campsites.forEach((campsite: any) => {
          expect(campsite.province.slug).toBe('bangkok');
        });
      }
    });

    it('returns empty results for non-existent province', async () => {
      const response = await request(app).get('/api/search?provinceId=99999');

      expect(response.status).toBe(200);
      expect(response.body.data.data).toEqual([]);
      expect(response.body.data.pagination.total).toBe(0);
    });
  });

  // Test 3: Type filter (single and multiple)
  describe('Type filter', () => {
    it('filters by single campsite type', async () => {
      const response = await request(app).get('/api/search?types=camping');

      expect(response.status).toBe(200);
      expect(response.body.data.filters.types).toEqual(['camping']);

      const campsites = response.body.data.data;
      if (campsites.length > 0) {
        campsites.forEach((campsite: any) => {
          expect(campsite.campsite_type).toBe('camping');
        });
      }
    });

    it('filters by multiple campsite types (comma-separated)', async () => {
      const response = await request(app).get('/api/search?types=camping,glamping');

      expect(response.status).toBe(200);
      expect(response.body.data.filters.types).toEqual(['camping', 'glamping']);

      const campsites = response.body.data.data;
      if (campsites.length > 0) {
        campsites.forEach((campsite: any) => {
          expect(['camping', 'glamping']).toContain(campsite.campsite_type);
        });
      }
    });

    it('filters by multiple campsite types (array)', async () => {
      const response = await request(app)
        .get('/api/search')
        .query({ types: ['glamping', 'tented-resort'] });

      expect(response.status).toBe(200);
      expect(response.body.data.filters.types).toEqual(['glamping', 'tented-resort']);

      const campsites = response.body.data.data;
      if (campsites.length > 0) {
        campsites.forEach((campsite: any) => {
          expect(['glamping', 'tented-resort']).toContain(campsite.campsite_type);
        });
      }
    });

    it('rejects invalid campsite type', async () => {
      const response = await request(app).get('/api/search?types=invalid-type');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  // Test 4: Price range filter
  describe('Price range filter', () => {
    it('filters by minimum price', async () => {
      const minPrice = 1000;
      const response = await request(app).get(`/api/search?minPrice=${minPrice}`);

      expect(response.status).toBe(200);
      expect(response.body.data.filters.minPrice).toBe(minPrice);

      const campsites = response.body.data.data;
      if (campsites.length > 0) {
        campsites.forEach((campsite: any) => {
          expect(campsite.min_price).toBeGreaterThanOrEqual(minPrice);
        });
      }
    });

    it('filters by maximum price', async () => {
      const maxPrice = 2000;
      const response = await request(app).get(`/api/search?maxPrice=${maxPrice}`);

      expect(response.status).toBe(200);
      expect(response.body.data.filters.maxPrice).toBe(maxPrice);

      const campsites = response.body.data.data;
      if (campsites.length > 0) {
        campsites.forEach((campsite: any) => {
          expect(campsite.max_price).toBeLessThanOrEqual(maxPrice);
        });
      }
    });

    it('filters by price range (min and max)', async () => {
      const minPrice = 500;
      const maxPrice = 3000;
      const response = await request(app).get(
        `/api/search?minPrice=${minPrice}&maxPrice=${maxPrice}`
      );

      expect(response.status).toBe(200);
      expect(response.body.data.filters.minPrice).toBe(minPrice);
      expect(response.body.data.filters.maxPrice).toBe(maxPrice);

      const campsites = response.body.data.data;
      if (campsites.length > 0) {
        campsites.forEach((campsite: any) => {
          expect(campsite.min_price).toBeGreaterThanOrEqual(minPrice);
          expect(campsite.max_price).toBeLessThanOrEqual(maxPrice);
        });
      }
    });

    it('rejects negative price values', async () => {
      const response = await request(app).get('/api/search?minPrice=-100');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('rejects price above maximum (100000)', async () => {
      const response = await request(app).get('/api/search?maxPrice=150000');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  // Test 5: Sorting options
  describe('Sorting options', () => {
    it('sorts by rating (default)', async () => {
      const response = await request(app).get('/api/search?sort=rating');

      expect(response.status).toBe(200);
      expect(response.body.data.sort).toBe('rating');

      const campsites = response.body.data.data;
      if (campsites.length > 1) {
        // Verify descending order
        for (let i = 0; i < campsites.length - 1; i++) {
          expect(campsites[i].average_rating).toBeGreaterThanOrEqual(
            campsites[i + 1].average_rating
          );
        }
      }
    });

    it('sorts by price ascending', async () => {
      const response = await request(app).get('/api/search?sort=price_asc');

      expect(response.status).toBe(200);
      expect(response.body.data.sort).toBe('price_asc');

      const campsites = response.body.data.data;
      if (campsites.length > 1) {
        // Verify ascending order
        for (let i = 0; i < campsites.length - 1; i++) {
          expect(campsites[i].min_price).toBeLessThanOrEqual(
            campsites[i + 1].min_price
          );
        }
      }
    });

    it('sorts by price descending', async () => {
      const response = await request(app).get('/api/search?sort=price_desc');

      expect(response.status).toBe(200);
      expect(response.body.data.sort).toBe('price_desc');

      const campsites = response.body.data.data;
      if (campsites.length > 1) {
        // Verify descending order
        for (let i = 0; i < campsites.length - 1; i++) {
          expect(campsites[i].min_price).toBeGreaterThanOrEqual(
            campsites[i + 1].min_price
          );
        }
      }
    });

    it('sorts by newest', async () => {
      const response = await request(app).get('/api/search?sort=newest');

      expect(response.status).toBe(200);
      expect(response.body.data.sort).toBe('newest');
    });

    it('rejects invalid sort option', async () => {
      const response = await request(app).get('/api/search?sort=invalid_sort');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  // Test 6: Pagination params
  describe('Pagination', () => {
    it('respects page parameter', async () => {
      const response = await request(app).get('/api/search?page=2');

      expect(response.status).toBe(200);
      expect(response.body.data.pagination.page).toBe(2);
      expect(response.body.data.pagination.hasPrev).toBe(true);
    });

    it('respects limit parameter', async () => {
      const limit = 5;
      const response = await request(app).get(`/api/search?limit=${limit}`);

      expect(response.status).toBe(200);
      expect(response.body.data.pagination.limit).toBe(limit);
      expect(response.body.data.data.length).toBeLessThanOrEqual(limit);
    });

    it('combines page and limit correctly', async () => {
      const response = await request(app).get('/api/search?page=1&limit=3');

      expect(response.status).toBe(200);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(3);
      expect(response.body.data.data.length).toBeLessThanOrEqual(3);
    });

    it('calculates totalPages correctly', async () => {
      const response = await request(app).get('/api/search?limit=5');

      expect(response.status).toBe(200);
      const { total, limit, totalPages } = response.body.data.pagination;
      expect(totalPages).toBe(Math.ceil(total / limit));
    });

    it('sets hasNext correctly on first page', async () => {
      const response = await request(app).get('/api/search?page=1&limit=5');

      expect(response.status).toBe(200);
      const { hasNext, totalPages } = response.body.data.pagination;
      if (totalPages > 1) {
        expect(hasNext).toBe(true);
      } else {
        expect(hasNext).toBe(false);
      }
    });

    it('rejects page less than 1', async () => {
      const response = await request(app).get('/api/search?page=0');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('rejects limit less than 1', async () => {
      const response = await request(app).get('/api/search?limit=0');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('rejects limit greater than 50', async () => {
      const response = await request(app).get('/api/search?limit=100');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  // Test 7: All filters combined
  describe('Combined filters', () => {
    it('combines all filter types correctly', async () => {
      const params = {
        provinceId: 1,
        types: 'camping,glamping',
        minPrice: 500,
        maxPrice: 3000,
        minRating: 4,
        sort: 'price_asc',
        page: 1,
        limit: 10,
      };

      const response = await request(app).get('/api/search').query(params);

      expect(response.status).toBe(200);

      // Verify all filters are applied
      expect(response.body.data.filters.provinceId).toBe(1);
      expect(response.body.data.filters.types).toEqual(['camping', 'glamping']);
      expect(response.body.data.filters.minPrice).toBe(500);
      expect(response.body.data.filters.maxPrice).toBe(3000);
      expect(response.body.data.filters.minRating).toBe(4);
      expect(response.body.data.sort).toBe('price_asc');

      const campsites = response.body.data.data;
      if (campsites.length > 0) {
        campsites.forEach((campsite: any) => {
          expect(campsite.province.id).toBe(1);
          expect(['camping', 'glamping']).toContain(campsite.campsite_type);
          expect(campsite.min_price).toBeGreaterThanOrEqual(500);
          expect(campsite.max_price).toBeLessThanOrEqual(3000);
          expect(campsite.average_rating).toBeGreaterThanOrEqual(4);
        });
      }
    });

    it('handles text search with other filters', async () => {
      const response = await request(app).get(
        '/api/search?q=camp&types=camping&sort=rating'
      );

      expect(response.status).toBe(200);
      expect(response.body.data.sort).toBe('rating');
    });

    it('handles featured filter with pagination', async () => {
      const response = await request(app).get('/api/search?featured=true&limit=5');

      expect(response.status).toBe(200);
      expect(response.body.data.pagination.limit).toBe(5);

      const campsites = response.body.data.data;
      if (campsites.length > 0) {
        campsites.forEach((campsite: any) => {
          expect(campsite.is_featured).toBe(true);
        });
      }
    });
  });

  // Test 8: Invalid params return 400
  describe('Invalid parameters validation', () => {
    it('returns 400 for invalid provinceId', async () => {
      const response = await request(app).get('/api/search?provinceId=invalid');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('returns 400 for negative provinceId', async () => {
      const response = await request(app).get('/api/search?provinceId=-1');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('returns 400 for non-numeric minPrice', async () => {
      const response = await request(app).get('/api/search?minPrice=abc');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('returns 400 for non-numeric page', async () => {
      const response = await request(app).get('/api/search?page=abc');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('returns 400 with error message for multiple invalid params', async () => {
      const response = await request(app).get(
        '/api/search?page=-1&limit=200&minPrice=-500&sort=invalid'
      );

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      expect(response.body.message).toBe('Invalid search parameters');
    });

    it('returns 400 for query string too long', async () => {
      const longQuery = 'a'.repeat(250);
      const response = await request(app).get(`/api/search?q=${longQuery}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  // Test 9: Response structure validation
  describe('Response structure validation', () => {
    it('has correct campsite card structure', async () => {
      const response = await request(app).get('/api/search?limit=1');

      expect(response.status).toBe(200);

      const campsites = response.body.data.data;
      if (campsites.length > 0) {
        const campsite = campsites[0];

        // Required fields
        expect(campsite).toHaveProperty('id');
        expect(campsite).toHaveProperty('name');
        expect(campsite).toHaveProperty('description');
        expect(campsite).toHaveProperty('slug');
        expect(campsite).toHaveProperty('campsite_type');
        expect(campsite).toHaveProperty('min_price');
        expect(campsite).toHaveProperty('max_price');
        expect(campsite).toHaveProperty('average_rating');
        expect(campsite).toHaveProperty('review_count');
        expect(campsite).toHaveProperty('is_featured');
        expect(campsite).toHaveProperty('thumbnail_url');
        expect(campsite).toHaveProperty('amenities');

        // Province nested structure
        expect(campsite).toHaveProperty('province');
        expect(campsite.province).toHaveProperty('id');
        expect(campsite.province).toHaveProperty('name_th');
        expect(campsite.province).toHaveProperty('name_en');
        expect(campsite.province).toHaveProperty('slug');

        // Type checks
        expect(typeof campsite.id).toBe('number');
        expect(typeof campsite.name).toBe('string');
        expect(typeof campsite.slug).toBe('string');
        expect(typeof campsite.min_price).toBe('number');
        expect(typeof campsite.average_rating).toBe('number');
        expect(typeof campsite.review_count).toBe('number');
        expect(typeof campsite.is_featured).toBe('boolean');
        expect(Array.isArray(campsite.amenities)).toBe(true);
      }
    });

    it('has complete pagination structure', async () => {
      const response = await request(app).get('/api/search');

      expect(response.status).toBe(200);
      const pagination = response.body.data.pagination;

      expect(typeof pagination.page).toBe('number');
      expect(typeof pagination.limit).toBe('number');
      expect(typeof pagination.total).toBe('number');
      expect(typeof pagination.totalPages).toBe('number');
      expect(typeof pagination.hasNext).toBe('boolean');
      expect(typeof pagination.hasPrev).toBe('boolean');
    });

    it('has correct filters structure', async () => {
      const response = await request(app).get(
        '/api/search?provinceId=1&types=camping&minPrice=500'
      );

      expect(response.status).toBe(200);
      const filters = response.body.data.filters;

      expect(filters).toHaveProperty('provinceId', 1);
      expect(filters).toHaveProperty('types', ['camping']);
      expect(filters).toHaveProperty('minPrice', 500);
    });
  });

  // Test 10: Empty results handling
  describe('Empty results handling', () => {
    it('returns empty array for impossible filter combination', async () => {
      const response = await request(app).get(
        '/api/search?provinceId=99999&types=camping&minPrice=99999'
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toEqual([]);
      expect(response.body.data.pagination.total).toBe(0);
      expect(response.body.data.pagination.totalPages).toBe(0);
      expect(response.body.data.pagination.hasNext).toBe(false);
      expect(response.body.data.pagination.hasPrev).toBe(false);
    });

    it('returns empty array with correct structure for no results', async () => {
      const response = await request(app).get('/api/search?q=xyznonexistentquery123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.data)).toBe(true);
      expect(response.body.data.data.length).toBe(0);
      expect(response.body.data.pagination.total).toBe(0);
    });

    it('maintains correct structure with high page number and no results', async () => {
      const response = await request(app).get('/api/search?page=9999');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toEqual([]);
      expect(response.body.data.pagination.page).toBe(9999);
    });
  });

  // Additional edge cases
  describe('Additional edge cases', () => {
    it('handles amenities filter correctly', async () => {
      const response = await request(app).get('/api/search?amenities=wifi,parking');

      expect(response.status).toBe(200);
      expect(response.body.data.filters.amenities).toEqual(['wifi', 'parking']);

      const campsites = response.body.data.data;
      if (campsites.length > 0) {
        campsites.forEach((campsite: any) => {
          expect(campsite.amenities).toContain('wifi');
          expect(campsite.amenities).toContain('parking');
        });
      }
    });

    it('handles minRating filter correctly', async () => {
      const response = await request(app).get('/api/search?minRating=4.5');

      expect(response.status).toBe(200);
      expect(response.body.data.filters.minRating).toBe(4.5);

      const campsites = response.body.data.data;
      if (campsites.length > 0) {
        campsites.forEach((campsite: any) => {
          expect(campsite.average_rating).toBeGreaterThanOrEqual(4.5);
        });
      }
    });

    it('rejects minRating above 5', async () => {
      const response = await request(app).get('/api/search?minRating=6');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('rejects negative minRating', async () => {
      const response = await request(app).get('/api/search?minRating=-1');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('handles text search correctly', async () => {
      const response = await request(app).get('/api/search?q=camping');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('handles featured boolean filter', async () => {
      const response1 = await request(app).get('/api/search?featured=true');
      const response2 = await request(app).get('/api/search?featured=false');

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);

      const featuredCampsites = response1.body.data.data;
      if (featuredCampsites.length > 0) {
        featuredCampsites.forEach((campsite: any) => {
          expect(campsite.is_featured).toBe(true);
        });
      }
    });
  });
});
