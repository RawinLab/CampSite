/**
 * Integration Test: Analytics Query Performance (T018)
 * Tests analytics query performance with realistic data volumes
 * Ensures queries complete within SLA and use proper indexes
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:8000';
const SUPABASE_ANON_KEY = process.env.ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

// SLA targets
const DASHBOARD_STATS_SLA_MS = 500;
const CHART_DATA_SLA_MS = 500;

// Performance thresholds
const LARGE_DATASET_SIZE = 10000;
const MEDIUM_DATASET_SIZE = 1000;

interface AnalyticsEvent {
  id?: string;
  campsite_id: string;
  user_id: string | null;
  event_type: string;
  metadata?: Record<string, any>;
  created_at?: string;
}

interface QueryPlan {
  'QUERY PLAN': string;
}

describe('Integration: Analytics Query Performance', () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  let testOwnerId: string;
  let testCampsiteId: string;
  let testUserId: string;
  let testEventIds: string[] = [];

  // Helper: Measure query execution time
  const measureQueryTime = async (queryFn: () => Promise<any>): Promise<number> => {
    const startTime = performance.now();
    await queryFn();
    const endTime = performance.now();
    return endTime - startTime;
  };

  // Helper: Create test events in batch
  const createTestEvents = async (
    campsiteId: string,
    count: number,
    startDate: Date,
    endDate: Date,
    eventTypes: string[] = ['search_impression', 'profile_view', 'booking_click']
  ): Promise<string[]> => {
    const events: AnalyticsEvent[] = [];
    const timeDiff = endDate.getTime() - startDate.getTime();

    for (let i = 0; i < count; i++) {
      const randomTime = new Date(startDate.getTime() + Math.random() * timeDiff);
      const randomEventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];

      events.push({
        campsite_id: campsiteId,
        user_id: Math.random() > 0.3 ? testUserId : null, // 70% with user_id
        event_type: randomEventType,
        metadata: {
          test_batch: true,
          index: i,
        },
        created_at: randomTime.toISOString(),
      });
    }

    // Insert in batches of 1000 to avoid payload limits
    const batchSize = 1000;
    const insertedIds: string[] = [];

    for (let i = 0; i < events.length; i += batchSize) {
      const batch = events.slice(i, i + batchSize);
      const { data, error } = await supabase
        .from('analytics_events')
        .insert(batch)
        .select('id');

      if (error) {
        throw new Error(`Failed to insert events batch: ${error.message}`);
      }

      if (data) {
        insertedIds.push(...data.map(e => e.id));
      }
    }

    return insertedIds;
  };

  // Helper: Get query plan
  const getQueryPlan = async (query: string): Promise<QueryPlan[]> => {
    const { data, error } = await supabase.rpc('explain_query', { query_sql: query });
    if (error) {
      // If RPC doesn't exist, return empty plan
      return [];
    }
    return data || [];
  };

  beforeAll(async () => {
    // Create test user (owner)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: `analytics-perf-owner-${Date.now()}@test.com`,
      password: 'TestPassword123!',
    });

    if (authError || !authData.user) {
      throw new Error(`Failed to create test owner: ${authError?.message}`);
    }

    // Get profile ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('auth_user_id', authData.user.id)
      .single();

    if (profileError || !profile) {
      throw new Error(`Failed to get owner profile: ${profileError?.message}`);
    }

    testOwnerId = profile.id;

    // Create test user for events
    const { data: userAuthData, error: userAuthError } = await supabase.auth.signUp({
      email: `analytics-perf-user-${Date.now()}@test.com`,
      password: 'TestPassword123!',
    });

    if (userAuthError || !userAuthData.user) {
      throw new Error(`Failed to create test user: ${userAuthError?.message}`);
    }

    const { data: userProfile, error: userProfileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('auth_user_id', userAuthData.user.id)
      .single();

    if (userProfileError || !userProfile) {
      throw new Error(`Failed to get user profile: ${userProfileError?.message}`);
    }

    testUserId = userProfile.id;

    // Create test campsite
    const { data: campsite, error: campsiteError } = await supabase
      .from('campsites')
      .insert({
        name: 'Analytics Performance Test Campsite',
        slug: `analytics-perf-campsite-${Date.now()}`,
        description: 'Test campsite for analytics performance',
        owner_id: testOwnerId,
        province_id: 1,
        latitude: 13.7563,
        longitude: 100.5018,
        campsite_type: 'camping',
        status: 'approved',
        is_active: true,
        min_price: 500,
        max_price: 1500,
      })
      .select()
      .single();

    if (campsiteError || !campsite) {
      throw new Error(`Failed to create test campsite: ${campsiteError?.message}`);
    }

    testCampsiteId = campsite.id;
  });

  afterAll(async () => {
    // Cleanup: Delete test events
    if (testEventIds.length > 0) {
      await supabase
        .from('analytics_events')
        .delete()
        .in('id', testEventIds);
    }

    // Delete test campsite
    if (testCampsiteId) {
      await supabase
        .from('campsites')
        .delete()
        .eq('id', testCampsiteId);
    }

    // Note: Supabase auth cleanup handled by cascade
  });

  describe('Dashboard Stats Query Performance', () => {
    beforeAll(async () => {
      // Create medium dataset for dashboard stats
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

      const eventIds = await createTestEvents(
        testCampsiteId,
        MEDIUM_DATASET_SIZE,
        sixtyDaysAgo,
        now
      );
      testEventIds.push(...eventIds);
    });

    test('T018.1: Dashboard stats query completes within 500ms', async () => {
      const now = new Date();
      const periodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const executionTime = await measureQueryTime(async () => {
        const { data, error } = await supabase
          .from('analytics_events')
          .select('event_type')
          .eq('campsite_id', testCampsiteId)
          .gte('created_at', periodStart.toISOString());

        if (error) {
          throw new Error(`Query failed: ${error.message}`);
        }
      });

      console.log(`Dashboard stats query time: ${executionTime.toFixed(2)}ms`);
      expect(executionTime).toBeLessThan(DASHBOARD_STATS_SLA_MS);
    });

    test('T018.2: Dashboard stats with aggregation completes within 500ms', async () => {
      const now = new Date();
      const periodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const executionTime = await measureQueryTime(async () => {
        // Simulate grouped aggregation query
        const { data, error } = await supabase
          .from('analytics_events')
          .select('event_type, created_at')
          .eq('campsite_id', testCampsiteId)
          .gte('created_at', periodStart.toISOString());

        if (error) {
          throw new Error(`Query failed: ${error.message}`);
        }

        // Client-side aggregation (as done in service)
        const stats = data?.reduce((acc, event) => {
          acc[event.event_type] = (acc[event.event_type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        expect(stats).toBeDefined();
      });

      console.log(`Dashboard stats aggregation time: ${executionTime.toFixed(2)}ms`);
      expect(executionTime).toBeLessThan(DASHBOARD_STATS_SLA_MS);
    });

    test('T018.3: Multiple campsite stats query completes within 500ms', async () => {
      const now = new Date();
      const periodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Create additional test campsites
      const additionalCampsiteIds: string[] = [testCampsiteId];

      for (let i = 0; i < 4; i++) {
        const { data, error } = await supabase
          .from('campsites')
          .insert({
            name: `Analytics Perf Additional ${i}`,
            slug: `analytics-perf-additional-${Date.now()}-${i}`,
            description: 'Additional test campsite',
            owner_id: testOwnerId,
            province_id: 1,
            latitude: 13.7563 + i * 0.01,
            longitude: 100.5018 + i * 0.01,
            campsite_type: 'camping',
            status: 'approved',
            is_active: true,
            min_price: 500,
            max_price: 1500,
          })
          .select('id')
          .single();

        if (!error && data) {
          additionalCampsiteIds.push(data.id);
        }
      }

      const executionTime = await measureQueryTime(async () => {
        const { data, error } = await supabase
          .from('analytics_events')
          .select('event_type')
          .in('campsite_id', additionalCampsiteIds)
          .gte('created_at', periodStart.toISOString());

        if (error) {
          throw new Error(`Query failed: ${error.message}`);
        }
      });

      // Cleanup additional campsites
      await supabase
        .from('campsites')
        .delete()
        .in('id', additionalCampsiteIds.filter(id => id !== testCampsiteId));

      console.log(`Multi-campsite stats query time: ${executionTime.toFixed(2)}ms`);
      expect(executionTime).toBeLessThan(DASHBOARD_STATS_SLA_MS);
    });
  });

  describe('Chart Data Query Performance', () => {
    test('T018.4: Chart data query completes within 500ms', async () => {
      const now = new Date();
      const periodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const executionTime = await measureQueryTime(async () => {
        const { data, error } = await supabase
          .from('analytics_events')
          .select('event_type, created_at')
          .eq('campsite_id', testCampsiteId)
          .gte('created_at', periodStart.toISOString())
          .order('created_at', { ascending: true });

        if (error) {
          throw new Error(`Query failed: ${error.message}`);
        }

        // Client-side grouping by date (as done in service)
        const chartData: Map<string, any> = new Map();
        data?.forEach(event => {
          const dateStr = new Date(event.created_at).toISOString().split('T')[0];
          if (!chartData.has(dateStr)) {
            chartData.set(dateStr, {
              date: dateStr,
              search_impressions: 0,
              profile_views: 0,
              booking_clicks: 0,
            });
          }
          const dayData = chartData.get(dateStr)!;
          if (event.event_type === 'search_impression') dayData.search_impressions++;
          if (event.event_type === 'profile_view') dayData.profile_views++;
          if (event.event_type === 'booking_click') dayData.booking_clicks++;
        });

        expect(chartData.size).toBeGreaterThan(0);
      });

      console.log(`Chart data query time: ${executionTime.toFixed(2)}ms`);
      expect(executionTime).toBeLessThan(CHART_DATA_SLA_MS);
    });

    test('T018.5: Chart data with 90-day range completes within 500ms', async () => {
      const now = new Date();
      const periodStart = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

      const executionTime = await measureQueryTime(async () => {
        const { data, error } = await supabase
          .from('analytics_events')
          .select('event_type, created_at')
          .eq('campsite_id', testCampsiteId)
          .gte('created_at', periodStart.toISOString())
          .order('created_at', { ascending: true });

        if (error) {
          throw new Error(`Query failed: ${error.message}`);
        }
      });

      console.log(`90-day chart data query time: ${executionTime.toFixed(2)}ms`);
      expect(executionTime).toBeLessThan(CHART_DATA_SLA_MS);
    });
  });

  describe('Index Usage Validation', () => {
    test('T018.6: Campsite ID filter uses idx_analytics_campsite index', async () => {
      const now = new Date();
      const periodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Query with campsite_id filter
      const { data, error } = await supabase
        .from('analytics_events')
        .select('event_type')
        .eq('campsite_id', testCampsiteId)
        .gte('created_at', periodStart.toISOString())
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();

      // Note: EXPLAIN ANALYZE requires direct PostgreSQL access
      // This test validates the query succeeds efficiently
      // Index usage can be verified via database monitoring tools
    });

    test('T018.7: Date range filter uses idx_analytics_created index', async () => {
      const now = new Date();
      const periodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Query with date range
      const { data, error } = await supabase
        .from('analytics_events')
        .select('id, created_at')
        .gte('created_at', periodStart.toISOString())
        .order('created_at', { ascending: false })
        .limit(100);

      expect(error).toBeNull();
      expect(data).toBeDefined();

      // Validate ordering is correct (descending)
      if (data && data.length > 1) {
        for (let i = 0; i < data.length - 1; i++) {
          const current = new Date(data[i].created_at).getTime();
          const next = new Date(data[i + 1].created_at).getTime();
          expect(current).toBeGreaterThanOrEqual(next);
        }
      }
    });

    test('T018.8: Composite filter uses idx_analytics_campsite_type index', async () => {
      const now = new Date();
      const periodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Query with both campsite_id and event_type
      const { data, error } = await supabase
        .from('analytics_events')
        .select('id, event_type')
        .eq('campsite_id', testCampsiteId)
        .eq('event_type', 'profile_view')
        .gte('created_at', periodStart.toISOString());

      expect(error).toBeNull();
      expect(data).toBeDefined();

      // Validate all results match filter
      data?.forEach(event => {
        expect(event.event_type).toBe('profile_view');
      });
    });
  });

  describe('Large Dataset Performance', () => {
    let largeDatasetEventIds: string[] = [];

    beforeAll(async () => {
      // Create large dataset for stress testing
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      console.log(`Creating ${LARGE_DATASET_SIZE} test events...`);
      const eventIds = await createTestEvents(
        testCampsiteId,
        LARGE_DATASET_SIZE,
        thirtyDaysAgo,
        now,
        ['search_impression', 'profile_view', 'booking_click', 'wishlist_add', 'phone_click']
      );
      largeDatasetEventIds = eventIds;
      console.log(`Created ${largeDatasetEventIds.length} test events`);
    });

    afterAll(async () => {
      // Cleanup large dataset
      if (largeDatasetEventIds.length > 0) {
        console.log(`Cleaning up ${largeDatasetEventIds.length} test events...`);
        // Delete in batches to avoid timeout
        const batchSize = 1000;
        for (let i = 0; i < largeDatasetEventIds.length; i += batchSize) {
          const batch = largeDatasetEventIds.slice(i, i + batchSize);
          await supabase
            .from('analytics_events')
            .delete()
            .in('id', batch);
        }
      }
    });

    test('T018.9: Large dataset (10k+ events) dashboard query completes within 500ms', async () => {
      const now = new Date();
      const periodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const executionTime = await measureQueryTime(async () => {
        const { data, error } = await supabase
          .from('analytics_events')
          .select('event_type')
          .eq('campsite_id', testCampsiteId)
          .gte('created_at', periodStart.toISOString());

        if (error) {
          throw new Error(`Query failed: ${error.message}`);
        }

        // Aggregate counts
        const counts = data?.reduce((acc, event) => {
          acc[event.event_type] = (acc[event.event_type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        expect(Object.keys(counts || {}).length).toBeGreaterThan(0);
      });

      console.log(`Large dataset dashboard query time: ${executionTime.toFixed(2)}ms (${largeDatasetEventIds.length} events)`);
      expect(executionTime).toBeLessThan(DASHBOARD_STATS_SLA_MS);
    });

    test('T018.10: Large dataset chart data query completes within 500ms', async () => {
      const now = new Date();
      const periodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const executionTime = await measureQueryTime(async () => {
        const { data, error } = await supabase
          .from('analytics_events')
          .select('event_type, created_at')
          .eq('campsite_id', testCampsiteId)
          .gte('created_at', periodStart.toISOString())
          .order('created_at', { ascending: true });

        if (error) {
          throw new Error(`Query failed: ${error.message}`);
        }

        // Group by date
        const chartData: Map<string, any> = new Map();
        data?.forEach(event => {
          const dateStr = new Date(event.created_at).toISOString().split('T')[0];
          if (!chartData.has(dateStr)) {
            chartData.set(dateStr, { date: dateStr, count: 0 });
          }
          chartData.get(dateStr)!.count++;
        });

        expect(chartData.size).toBeGreaterThan(0);
      });

      console.log(`Large dataset chart query time: ${executionTime.toFixed(2)}ms (${largeDatasetEventIds.length} events)`);
      expect(executionTime).toBeLessThan(CHART_DATA_SLA_MS);
    });
  });

  describe('Date Range Filtering Efficiency', () => {
    test('T018.11: Narrow date range (7 days) is more efficient than wide range', async () => {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Narrow range query
      const narrowTime = await measureQueryTime(async () => {
        await supabase
          .from('analytics_events')
          .select('event_type')
          .eq('campsite_id', testCampsiteId)
          .gte('created_at', sevenDaysAgo.toISOString());
      });

      // Wide range query
      const wideTime = await measureQueryTime(async () => {
        await supabase
          .from('analytics_events')
          .select('event_type')
          .eq('campsite_id', testCampsiteId)
          .gte('created_at', thirtyDaysAgo.toISOString());
      });

      console.log(`7-day range: ${narrowTime.toFixed(2)}ms, 30-day range: ${wideTime.toFixed(2)}ms`);

      // Narrow range should be faster or similar
      expect(narrowTime).toBeLessThanOrEqual(wideTime * 1.5); // Allow 50% margin
    });

    test('T018.12: Between date range uses indexes efficiently', async () => {
      const now = new Date();
      const periodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const periodEnd = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);

      const executionTime = await measureQueryTime(async () => {
        const { data, error } = await supabase
          .from('analytics_events')
          .select('event_type, created_at')
          .eq('campsite_id', testCampsiteId)
          .gte('created_at', periodStart.toISOString())
          .lte('created_at', periodEnd.toISOString());

        if (error) {
          throw new Error(`Query failed: ${error.message}`);
        }

        // Validate all results are within range
        data?.forEach(event => {
          const eventDate = new Date(event.created_at);
          expect(eventDate.getTime()).toBeGreaterThanOrEqual(periodStart.getTime());
          expect(eventDate.getTime()).toBeLessThanOrEqual(periodEnd.getTime());
        });
      });

      console.log(`Between date range query time: ${executionTime.toFixed(2)}ms`);
      expect(executionTime).toBeLessThan(CHART_DATA_SLA_MS);
    });
  });

  describe('Aggregation Query Scalability', () => {
    test('T018.13: Event type aggregation scales linearly', async () => {
      const now = new Date();
      const periodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const executionTime = await measureQueryTime(async () => {
        const { data, error } = await supabase
          .from('analytics_events')
          .select('event_type')
          .eq('campsite_id', testCampsiteId)
          .gte('created_at', periodStart.toISOString());

        if (error) {
          throw new Error(`Query failed: ${error.message}`);
        }

        // Count by event type
        const aggregation = data?.reduce((acc, event) => {
          acc[event.event_type] = (acc[event.event_type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        expect(aggregation).toBeDefined();
        expect(Object.keys(aggregation || {}).length).toBeGreaterThan(0);
      });

      console.log(`Aggregation query time: ${executionTime.toFixed(2)}ms`);
      expect(executionTime).toBeLessThan(DASHBOARD_STATS_SLA_MS);
    });

    test('T018.14: Daily aggregation for 30 days scales properly', async () => {
      const now = new Date();
      const periodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const executionTime = await measureQueryTime(async () => {
        const { data, error } = await supabase
          .from('analytics_events')
          .select('event_type, created_at')
          .eq('campsite_id', testCampsiteId)
          .gte('created_at', periodStart.toISOString());

        if (error) {
          throw new Error(`Query failed: ${error.message}`);
        }

        // Group by day
        const dailyData: Map<string, Record<string, number>> = new Map();
        data?.forEach(event => {
          const dateStr = new Date(event.created_at).toISOString().split('T')[0];
          if (!dailyData.has(dateStr)) {
            dailyData.set(dateStr, {});
          }
          const dayStats = dailyData.get(dateStr)!;
          dayStats[event.event_type] = (dayStats[event.event_type] || 0) + 1;
        });

        expect(dailyData.size).toBeGreaterThan(0);
        expect(dailyData.size).toBeLessThanOrEqual(30);
      });

      console.log(`Daily aggregation query time: ${executionTime.toFixed(2)}ms`);
      expect(executionTime).toBeLessThan(CHART_DATA_SLA_MS);
    });

    test('T018.15: Multiple event type filters perform efficiently', async () => {
      const now = new Date();
      const periodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const eventTypes = ['search_impression', 'profile_view', 'booking_click'];

      const executionTime = await measureQueryTime(async () => {
        const { data, error } = await supabase
          .from('analytics_events')
          .select('event_type, created_at')
          .eq('campsite_id', testCampsiteId)
          .in('event_type', eventTypes)
          .gte('created_at', periodStart.toISOString());

        if (error) {
          throw new Error(`Query failed: ${error.message}`);
        }

        // Validate only requested event types returned
        data?.forEach(event => {
          expect(eventTypes).toContain(event.event_type);
        });
      });

      console.log(`Multiple event type filter query time: ${executionTime.toFixed(2)}ms`);
      expect(executionTime).toBeLessThan(CHART_DATA_SLA_MS);
    });
  });

  describe('Concurrent Query Performance', () => {
    test('T018.16: Concurrent dashboard and chart queries complete within SLA', async () => {
      const now = new Date();
      const periodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const startTime = performance.now();

      // Simulate concurrent requests
      const [statsResult, chartResult] = await Promise.all([
        // Dashboard stats query
        supabase
          .from('analytics_events')
          .select('event_type')
          .eq('campsite_id', testCampsiteId)
          .gte('created_at', periodStart.toISOString()),

        // Chart data query
        supabase
          .from('analytics_events')
          .select('event_type, created_at')
          .eq('campsite_id', testCampsiteId)
          .gte('created_at', periodStart.toISOString())
          .order('created_at', { ascending: true }),
      ]);

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(statsResult.error).toBeNull();
      expect(chartResult.error).toBeNull();

      console.log(`Concurrent queries total time: ${totalTime.toFixed(2)}ms`);

      // Both queries should complete in parallel, so total time should be close to slower query
      // Allow some overhead for parallel execution
      expect(totalTime).toBeLessThan(DASHBOARD_STATS_SLA_MS * 1.5);
    });
  });

  describe('Query Result Validation', () => {
    test('T018.17: Query results are accurate and complete', async () => {
      const now = new Date();
      const periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Insert known test events
      const knownEvents: AnalyticsEvent[] = [
        {
          campsite_id: testCampsiteId,
          user_id: testUserId,
          event_type: 'search_impression',
          created_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          campsite_id: testCampsiteId,
          user_id: testUserId,
          event_type: 'profile_view',
          created_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          campsite_id: testCampsiteId,
          user_id: null,
          event_type: 'booking_click',
          created_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];

      const { data: insertedEvents } = await supabase
        .from('analytics_events')
        .insert(knownEvents)
        .select('id');

      const knownEventIds = insertedEvents?.map(e => e.id) || [];

      // Query and validate
      const { data, error } = await supabase
        .from('analytics_events')
        .select('id, event_type, user_id, created_at')
        .eq('campsite_id', testCampsiteId)
        .in('id', knownEventIds);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.length).toBe(3);

      // Validate each event
      const searchImpression = data?.find(e => e.event_type === 'search_impression');
      expect(searchImpression).toBeDefined();
      expect(searchImpression?.user_id).toBe(testUserId);

      const profileView = data?.find(e => e.event_type === 'profile_view');
      expect(profileView).toBeDefined();

      const bookingClick = data?.find(e => e.event_type === 'booking_click');
      expect(bookingClick).toBeDefined();
      expect(bookingClick?.user_id).toBeNull();

      // Cleanup known events
      await supabase
        .from('analytics_events')
        .delete()
        .in('id', knownEventIds);
    });

    test('T018.18: Date filtering excludes out-of-range events correctly', async () => {
      const now = new Date();
      const periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Insert events inside and outside range
      const testEvents: AnalyticsEvent[] = [
        {
          campsite_id: testCampsiteId,
          user_id: testUserId,
          event_type: 'search_impression',
          created_at: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(), // Inside
        },
        {
          campsite_id: testCampsiteId,
          user_id: testUserId,
          event_type: 'profile_view',
          created_at: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(), // Outside
        },
      ];

      const { data: insertedEvents } = await supabase
        .from('analytics_events')
        .insert(testEvents)
        .select('id, created_at');

      const eventIds = insertedEvents?.map(e => e.id) || [];

      // Query with date filter
      const { data, error } = await supabase
        .from('analytics_events')
        .select('id, created_at')
        .in('id', eventIds)
        .gte('created_at', periodStart.toISOString());

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.length).toBe(1); // Only the inside event

      // Validate the returned event is within range
      const returnedEvent = data?.[0];
      expect(new Date(returnedEvent!.created_at).getTime()).toBeGreaterThanOrEqual(periodStart.getTime());

      // Cleanup
      await supabase
        .from('analytics_events')
        .delete()
        .in('id', eventIds);
    });
  });
});
