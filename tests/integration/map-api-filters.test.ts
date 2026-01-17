/**
 * Integration Test: Map API with Filters (T010)
 * Tests the /api/map/campsites endpoint with various filter combinations
 * against real Supabase instance
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:8000';
const SUPABASE_ANON_KEY = process.env.ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

// Type definitions
interface MapCampsite {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  campsite_type: string;
  average_rating: number;
  review_count: number;
  min_price: number;
  max_price: number;
  province_name_en: string;
  primary_photo_url: string | null;
}

interface MapCampsitesResponse {
  campsites: MapCampsite[];
  total: number;
}

describe('Integration: Map API with Filters', () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  let testCampsiteIds: string[] = [];
  let testProvinceId: number;

  beforeAll(async () => {
    // Setup: Create test province
    const { data: province, error: provinceError } = await supabase
      .from('provinces')
      .insert({
        name_th: 'เชียงใหม่ทดสอบ',
        name_en: 'Chiang Mai Test',
        slug: 'chiang-mai-test-map-api',
        region: 'north',
      })
      .select()
      .single();

    if (provinceError || !province) {
      throw new Error(`Failed to create test province: ${provinceError?.message}`);
    }

    testProvinceId = province.id;

    // Create test campsites with different types and locations
    const testCampsites = [
      {
        name: 'Map Test Camping Site',
        slug: 'map-test-camping-site',
        description: 'Test camping site for map filters',
        province_id: testProvinceId,
        latitude: 18.7883,
        longitude: 98.9853,
        campsite_type: 'camping',
        status: 'approved',
        is_active: true,
        min_price: 300,
        max_price: 800,
        average_rating: 4.5,
        review_count: 10,
      },
      {
        name: 'Map Test Glamping Site',
        slug: 'map-test-glamping-site',
        description: 'Test glamping site for map filters',
        province_id: testProvinceId,
        latitude: 18.8000,
        longitude: 99.0000,
        campsite_type: 'glamping',
        status: 'approved',
        is_active: true,
        min_price: 1500,
        max_price: 3000,
        average_rating: 4.8,
        review_count: 25,
      },
      {
        name: 'Map Test Bungalow',
        slug: 'map-test-bungalow',
        description: 'Test bungalow for map filters',
        province_id: testProvinceId,
        latitude: 18.7500,
        longitude: 98.9500,
        campsite_type: 'bungalow',
        status: 'approved',
        is_active: true,
        min_price: 800,
        max_price: 1200,
        average_rating: 4.2,
        review_count: 15,
      },
      {
        name: 'Map Test Tented Resort',
        slug: 'map-test-tented-resort',
        description: 'Test tented resort for map filters',
        province_id: testProvinceId,
        latitude: 18.8200,
        longitude: 99.0200,
        campsite_type: 'tented-resort',
        status: 'approved',
        is_active: true,
        min_price: 2000,
        max_price: 4000,
        average_rating: 4.9,
        review_count: 30,
      },
    ];

    const { data: campsites, error: campsiteError } = await supabase
      .from('campsites')
      .insert(testCampsites)
      .select('id');

    if (campsiteError || !campsites) {
      throw new Error(`Failed to create test campsites: ${campsiteError?.message}`);
    }

    testCampsiteIds = campsites.map((c: any) => c.id);
  }, 30000);

  afterAll(async () => {
    // Cleanup: Delete test campsites
    if (testCampsiteIds.length > 0) {
      await supabase.from('campsites').delete().in('id', testCampsiteIds);
    }

    // Delete test province
    if (testProvinceId) {
      await supabase.from('provinces').delete().eq('id', testProvinceId);
    }
  }, 30000);

  describe('Map API returns correct schema', () => {
    it('should return campsites array and total count', async () => {
      const response = await fetch(`${BACKEND_URL}/api/map/campsites`);
      expect(response.status).toBe(200);

      const data: MapCampsitesResponse = await response.json();

      expect(data).toHaveProperty('campsites');
      expect(data).toHaveProperty('total');
      expect(Array.isArray(data.campsites)).toBe(true);
      expect(typeof data.total).toBe('number');
    }, 10000);

    it('should return lightweight marker data with all required fields', async () => {
      const response = await fetch(
        `${BACKEND_URL}/api/map/campsites?province_id=${testProvinceId}`
      );
      expect(response.status).toBe(200);

      const data: MapCampsitesResponse = await response.json();

      expect(data.campsites.length).toBeGreaterThan(0);

      const campsite = data.campsites[0];

      // Verify all required fields
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

      // Verify data types
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
    }, 10000);
  });

  describe('Filter by campsite_types', () => {
    it('should filter by single type: camping', async () => {
      const response = await fetch(
        `${BACKEND_URL}/api/map/campsites?campsite_types=camping&province_id=${testProvinceId}`
      );
      expect(response.status).toBe(200);

      const data: MapCampsitesResponse = await response.json();

      expect(data.campsites.length).toBeGreaterThan(0);
      data.campsites.forEach((campsite) => {
        expect(campsite.campsite_type).toBe('camping');
      });
    }, 10000);

    it('should filter by single type: glamping', async () => {
      const response = await fetch(
        `${BACKEND_URL}/api/map/campsites?campsite_types=glamping&province_id=${testProvinceId}`
      );
      expect(response.status).toBe(200);

      const data: MapCampsitesResponse = await response.json();

      expect(data.campsites.length).toBeGreaterThan(0);
      data.campsites.forEach((campsite) => {
        expect(campsite.campsite_type).toBe('glamping');
      });
    }, 10000);

    it('should filter by single type: tented-resort', async () => {
      const response = await fetch(
        `${BACKEND_URL}/api/map/campsites?campsite_types=tented-resort&province_id=${testProvinceId}`
      );
      expect(response.status).toBe(200);

      const data: MapCampsitesResponse = await response.json();

      expect(data.campsites.length).toBeGreaterThan(0);
      data.campsites.forEach((campsite) => {
        expect(campsite.campsite_type).toBe('tented-resort');
      });
    }, 10000);

    it('should filter by single type: bungalow', async () => {
      const response = await fetch(
        `${BACKEND_URL}/api/map/campsites?campsite_types=bungalow&province_id=${testProvinceId}`
      );
      expect(response.status).toBe(200);

      const data: MapCampsitesResponse = await response.json();

      expect(data.campsites.length).toBeGreaterThan(0);
      data.campsites.forEach((campsite) => {
        expect(campsite.campsite_type).toBe('bungalow');
      });
    }, 10000);

    it('should filter by multiple types', async () => {
      const response = await fetch(
        `${BACKEND_URL}/api/map/campsites?campsite_types=camping,glamping&province_id=${testProvinceId}`
      );
      expect(response.status).toBe(200);

      const data: MapCampsitesResponse = await response.json();

      expect(data.campsites.length).toBeGreaterThan(0);
      data.campsites.forEach((campsite) => {
        expect(['camping', 'glamping']).toContain(campsite.campsite_type);
      });

      const types = data.campsites.map((c) => c.campsite_type);
      expect(types).toContain('camping');
      expect(types).toContain('glamping');
    }, 10000);
  });

  describe('Filter by province_id', () => {
    it('should filter campsites by province_id', async () => {
      const response = await fetch(
        `${BACKEND_URL}/api/map/campsites?province_id=${testProvinceId}`
      );
      expect(response.status).toBe(200);

      const data: MapCampsitesResponse = await response.json();

      expect(data.campsites.length).toBeGreaterThanOrEqual(4);
      data.campsites.forEach((campsite) => {
        expect(campsite.province_name_en).toBe('Chiang Mai Test');
      });
    }, 10000);

    it('should return empty array for non-existent province', async () => {
      const response = await fetch(
        `${BACKEND_URL}/api/map/campsites?province_id=99999`
      );
      expect(response.status).toBe(200);

      const data: MapCampsitesResponse = await response.json();

      expect(data.campsites).toEqual([]);
      expect(data.total).toBe(0);
    }, 10000);
  });

  describe('Filter by price range', () => {
    it('should filter by min_price', async () => {
      const response = await fetch(
        `${BACKEND_URL}/api/map/campsites?min_price=1000&province_id=${testProvinceId}`
      );
      expect(response.status).toBe(200);

      const data: MapCampsitesResponse = await response.json();

      expect(data.campsites.length).toBeGreaterThan(0);
      data.campsites.forEach((campsite) => {
        expect(campsite.max_price).toBeGreaterThanOrEqual(1000);
      });
    }, 10000);

    it('should filter by max_price', async () => {
      const response = await fetch(
        `${BACKEND_URL}/api/map/campsites?max_price=1000&province_id=${testProvinceId}`
      );
      expect(response.status).toBe(200);

      const data: MapCampsitesResponse = await response.json();

      expect(data.campsites.length).toBeGreaterThan(0);
      data.campsites.forEach((campsite) => {
        expect(campsite.min_price).toBeLessThanOrEqual(1000);
      });
    }, 10000);

    it('should filter by price range (min and max)', async () => {
      const response = await fetch(
        `${BACKEND_URL}/api/map/campsites?min_price=500&max_price=2000&province_id=${testProvinceId}`
      );
      expect(response.status).toBe(200);

      const data: MapCampsitesResponse = await response.json();

      expect(data.campsites.length).toBeGreaterThan(0);
      data.campsites.forEach((campsite) => {
        // Campsite's price range should overlap with [500, 2000]
        expect(campsite.max_price).toBeGreaterThanOrEqual(500);
        expect(campsite.min_price).toBeLessThanOrEqual(2000);
      });
    }, 10000);

    it('should return empty for impossible price range', async () => {
      const response = await fetch(
        `${BACKEND_URL}/api/map/campsites?min_price=10000&max_price=20000&province_id=${testProvinceId}`
      );
      expect(response.status).toBe(200);

      const data: MapCampsitesResponse = await response.json();

      expect(data.campsites).toEqual([]);
      expect(data.total).toBe(0);
    }, 10000);
  });

  describe('Filter by bounds', () => {
    it('should filter by geographic bounds', async () => {
      const response = await fetch(
        `${BACKEND_URL}/api/map/campsites?north=18.85&south=18.70&east=99.05&west=98.90&province_id=${testProvinceId}`
      );
      expect(response.status).toBe(200);

      const data: MapCampsitesResponse = await response.json();

      expect(data.campsites.length).toBeGreaterThan(0);
      data.campsites.forEach((campsite) => {
        expect(campsite.latitude).toBeGreaterThanOrEqual(18.70);
        expect(campsite.latitude).toBeLessThanOrEqual(18.85);
        expect(campsite.longitude).toBeGreaterThanOrEqual(98.90);
        expect(campsite.longitude).toBeLessThanOrEqual(99.05);
      });
    }, 10000);

    it('should return all campsites within wide bounds', async () => {
      const response = await fetch(
        `${BACKEND_URL}/api/map/campsites?north=19.0&south=18.5&east=99.5&west=98.5&province_id=${testProvinceId}`
      );
      expect(response.status).toBe(200);

      const data: MapCampsitesResponse = await response.json();

      expect(data.campsites.length).toBeGreaterThanOrEqual(4);
    }, 10000);

    it('should return empty for bounds outside test locations', async () => {
      const response = await fetch(
        `${BACKEND_URL}/api/map/campsites?north=20.0&south=19.5&east=100.0&west=99.5&province_id=${testProvinceId}`
      );
      expect(response.status).toBe(200);

      const data: MapCampsitesResponse = await response.json();

      expect(data.campsites).toEqual([]);
      expect(data.total).toBe(0);
    }, 10000);

    it('should ignore incomplete bounds parameters', async () => {
      const response = await fetch(
        `${BACKEND_URL}/api/map/campsites?north=19.0&south=18.5&province_id=${testProvinceId}`
      );
      expect(response.status).toBe(200);

      const data: MapCampsitesResponse = await response.json();

      // Should return all campsites in province when bounds are incomplete
      expect(data.campsites.length).toBeGreaterThanOrEqual(4);
    }, 10000);
  });

  describe('Combination of multiple filters', () => {
    it('should combine type and price filters', async () => {
      const response = await fetch(
        `${BACKEND_URL}/api/map/campsites?campsite_types=glamping,tented-resort&min_price=1000&province_id=${testProvinceId}`
      );
      expect(response.status).toBe(200);

      const data: MapCampsitesResponse = await response.json();

      expect(data.campsites.length).toBeGreaterThan(0);
      data.campsites.forEach((campsite) => {
        expect(['glamping', 'tented-resort']).toContain(campsite.campsite_type);
        expect(campsite.max_price).toBeGreaterThanOrEqual(1000);
      });
    }, 10000);

    it('should combine province, type, and price filters', async () => {
      const response = await fetch(
        `${BACKEND_URL}/api/map/campsites?province_id=${testProvinceId}&campsite_types=camping,bungalow&max_price=1500`
      );
      expect(response.status).toBe(200);

      const data: MapCampsitesResponse = await response.json();

      expect(data.campsites.length).toBeGreaterThan(0);
      data.campsites.forEach((campsite) => {
        expect(campsite.province_name_en).toBe('Chiang Mai Test');
        expect(['camping', 'bungalow']).toContain(campsite.campsite_type);
        expect(campsite.min_price).toBeLessThanOrEqual(1500);
      });
    }, 10000);

    it('should combine bounds, type, and price filters', async () => {
      const response = await fetch(
        `${BACKEND_URL}/api/map/campsites?north=18.85&south=18.70&east=99.05&west=98.90&campsite_types=glamping&min_price=1000&max_price=3500`
      );
      expect(response.status).toBe(200);

      const data: MapCampsitesResponse = await response.json();

      expect(data.campsites.length).toBeGreaterThan(0);
      data.campsites.forEach((campsite) => {
        expect(campsite.latitude).toBeGreaterThanOrEqual(18.70);
        expect(campsite.latitude).toBeLessThanOrEqual(18.85);
        expect(campsite.longitude).toBeGreaterThanOrEqual(98.90);
        expect(campsite.longitude).toBeLessThanOrEqual(99.05);
        expect(campsite.campsite_type).toBe('glamping');
        expect(campsite.max_price).toBeGreaterThanOrEqual(1000);
        expect(campsite.min_price).toBeLessThanOrEqual(3500);
      });
    }, 10000);

    it('should combine all filters: bounds, province, type, and price', async () => {
      const response = await fetch(
        `${BACKEND_URL}/api/map/campsites?north=19.0&south=18.5&east=99.5&west=98.5&province_id=${testProvinceId}&campsite_types=camping,glamping,bungalow,tented-resort&min_price=300&max_price=5000`
      );
      expect(response.status).toBe(200);

      const data: MapCampsitesResponse = await response.json();

      expect(data.campsites.length).toBeGreaterThanOrEqual(4);
      data.campsites.forEach((campsite) => {
        expect(campsite.latitude).toBeGreaterThanOrEqual(18.5);
        expect(campsite.latitude).toBeLessThanOrEqual(19.0);
        expect(campsite.longitude).toBeGreaterThanOrEqual(98.5);
        expect(campsite.longitude).toBeLessThanOrEqual(99.5);
        expect(campsite.province_name_en).toBe('Chiang Mai Test');
        expect(['camping', 'glamping', 'bungalow', 'tented-resort']).toContain(
          campsite.campsite_type
        );
        expect(campsite.max_price).toBeGreaterThanOrEqual(300);
        expect(campsite.min_price).toBeLessThanOrEqual(5000);
      });
    }, 10000);

    it('should return empty array when filters produce no matches', async () => {
      const response = await fetch(
        `${BACKEND_URL}/api/map/campsites?province_id=${testProvinceId}&campsite_types=camping&min_price=5000`
      );
      expect(response.status).toBe(200);

      const data: MapCampsitesResponse = await response.json();

      expect(data.campsites).toEqual([]);
      expect(data.total).toBe(0);
    }, 10000);
  });

  describe('Only approved and active campsites', () => {
    it('should only return approved and active campsites', async () => {
      // Create inactive campsite
      const { data: inactiveCampsite } = await supabase
        .from('campsites')
        .insert({
          name: 'Inactive Test Camp',
          slug: 'inactive-test-camp-map',
          description: 'Inactive campsite',
          province_id: testProvinceId,
          latitude: 18.7700,
          longitude: 98.9700,
          campsite_type: 'camping',
          status: 'approved',
          is_active: false,
          min_price: 500,
          max_price: 1000,
        })
        .select('id')
        .single();

      // Create pending campsite
      const { data: pendingCampsite } = await supabase
        .from('campsites')
        .insert({
          name: 'Pending Test Camp',
          slug: 'pending-test-camp-map',
          description: 'Pending campsite',
          province_id: testProvinceId,
          latitude: 18.7800,
          longitude: 98.9800,
          campsite_type: 'camping',
          status: 'pending',
          is_active: true,
          min_price: 500,
          max_price: 1000,
        })
        .select('id')
        .single();

      const response = await fetch(
        `${BACKEND_URL}/api/map/campsites?province_id=${testProvinceId}`
      );
      expect(response.status).toBe(200);

      const data: MapCampsitesResponse = await response.json();

      // Should only include the 4 original test campsites
      const campsiteNames = data.campsites.map((c) => c.name);
      expect(campsiteNames).not.toContain('Inactive Test Camp');
      expect(campsiteNames).not.toContain('Pending Test Camp');

      // Cleanup
      if (inactiveCampsite) {
        await supabase.from('campsites').delete().eq('id', inactiveCampsite.id);
      }
      if (pendingCampsite) {
        await supabase.from('campsites').delete().eq('id', pendingCampsite.id);
      }
    }, 10000);
  });

  describe('Error handling and validation', () => {
    it('should return 400 for invalid latitude bounds', async () => {
      const response = await fetch(
        `${BACKEND_URL}/api/map/campsites?north=100&south=18.5&east=99.5&west=98.5`
      );
      expect(response.status).toBe(400);
    }, 10000);

    it('should return 400 for invalid longitude bounds', async () => {
      const response = await fetch(
        `${BACKEND_URL}/api/map/campsites?north=19.0&south=18.5&east=200&west=98.5`
      );
      expect(response.status).toBe(400);
    }, 10000);

    it('should return 400 for invalid limit', async () => {
      const response = await fetch(
        `${BACKEND_URL}/api/map/campsites?limit=1000`
      );
      expect(response.status).toBe(400);
    }, 10000);

    it('should handle limit parameter correctly', async () => {
      const response = await fetch(
        `${BACKEND_URL}/api/map/campsites?province_id=${testProvinceId}&limit=2`
      );
      expect(response.status).toBe(200);

      const data: MapCampsitesResponse = await response.json();

      expect(data.campsites.length).toBeLessThanOrEqual(2);
    }, 10000);
  });
});
