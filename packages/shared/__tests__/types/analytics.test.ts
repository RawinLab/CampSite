/**
 * TypeScript compilation tests for analytics types
 *
 * This test file verifies that:
 * 1. Type definitions compile correctly
 * 2. EventType union type values
 * 3. AnalyticsEvent interface structure
 * 4. DashboardStats interface structure
 * 5. AnalyticsChartData interface structure
 * 6. AnalyticsResponse nested structure
 * 7. OwnerCampsiteSummary interface structure
 * 8. Type compatibility with API responses
 *
 * These are compile-time checks ensuring types don't have errors.
 */

import type {
  EventType,
  AnalyticsEvent,
  DashboardStats,
  AnalyticsChartData,
  AnalyticsResponse,
  OwnerCampsiteSummary,
  OwnerCampsitesResponse,
} from '../../src/types/analytics';

describe('Analytics Types - Compilation Tests', () => {
  describe('EventType', () => {
    it('should accept all valid event types', () => {
      const validEventTypes: EventType[] = [
        'search_impression',
        'profile_view',
        'booking_click',
        'inquiry_sent',
        'wishlist_add',
        'phone_click',
        'website_click',
      ];

      expect(validEventTypes).toHaveLength(7);
    });

    it('should compile with individual event type values', () => {
      const searchImpression: EventType = 'search_impression';
      const profileView: EventType = 'profile_view';
      const bookingClick: EventType = 'booking_click';
      const inquirySent: EventType = 'inquiry_sent';
      const wishlistAdd: EventType = 'wishlist_add';
      const phoneClick: EventType = 'phone_click';
      const websiteClick: EventType = 'website_click';

      expect(searchImpression).toBe('search_impression');
      expect(profileView).toBe('profile_view');
      expect(bookingClick).toBe('booking_click');
      expect(inquirySent).toBe('inquiry_sent');
      expect(wishlistAdd).toBe('wishlist_add');
      expect(phoneClick).toBe('phone_click');
      expect(websiteClick).toBe('website_click');
    });
  });

  describe('AnalyticsEvent', () => {
    it('should compile with all required fields', () => {
      const event: AnalyticsEvent = {
        id: 'event-1',
        campsite_id: 'campsite-1',
        user_id: 'user-1',
        event_type: 'profile_view',
        metadata: { source: 'search_results', position: 3 },
        session_id: 'session-123',
        referrer: 'https://google.com',
        user_agent: 'Mozilla/5.0',
        ip_address: '192.168.1.1',
        country: 'Thailand',
        city: 'Bangkok',
        created_at: '2024-01-01T00:00:00Z',
      };

      expect(event.id).toBe('event-1');
      expect(event.event_type).toBe('profile_view');
      // Type compilation checks
      const eventType: EventType = event.event_type;
      const metadata: Record<string, unknown> = event.metadata;
      expect(eventType).toBe('profile_view');
      expect(metadata.source).toBe('search_results');
    });

    it('should allow null optional fields', () => {
      const event: AnalyticsEvent = {
        id: 'event-2',
        campsite_id: null,
        user_id: null,
        event_type: 'search_impression',
        metadata: {},
        session_id: null,
        referrer: null,
        user_agent: null,
        ip_address: null,
        country: null,
        city: null,
        created_at: '2024-01-01T00:00:00Z',
      };

      expect(event.campsite_id).toBeNull();
      expect(event.user_id).toBeNull();
      expect(event.session_id).toBeNull();
      expect(event.referrer).toBeNull();
      expect(event.user_agent).toBeNull();
      expect(event.ip_address).toBeNull();
      expect(event.country).toBeNull();
      expect(event.city).toBeNull();
    });

    it('should support various event types', () => {
      const bookingEvent: AnalyticsEvent = {
        id: 'e1',
        campsite_id: 'c1',
        user_id: 'u1',
        event_type: 'booking_click',
        metadata: { accommodation_type: 'tent' },
        session_id: 's1',
        referrer: null,
        user_agent: null,
        ip_address: null,
        country: null,
        city: null,
        created_at: '2024-01-01T00:00:00Z',
      };

      const wishlistEvent: AnalyticsEvent = {
        id: 'e2',
        campsite_id: 'c2',
        user_id: 'u2',
        event_type: 'wishlist_add',
        metadata: {},
        session_id: 's2',
        referrer: null,
        user_agent: null,
        ip_address: null,
        country: null,
        city: null,
        created_at: '2024-01-01T00:00:00Z',
      };

      expect(bookingEvent.event_type).toBe('booking_click');
      expect(wishlistEvent.event_type).toBe('wishlist_add');
    });

    it('should support flexible metadata structure', () => {
      const event: AnalyticsEvent = {
        id: 'e3',
        campsite_id: 'c3',
        user_id: 'u3',
        event_type: 'inquiry_sent',
        metadata: {
          message_length: 250,
          preferred_dates: ['2024-03-01', '2024-03-02'],
          guests: 4,
          has_pets: true,
          custom_data: { key: 'value' },
        },
        session_id: 's3',
        referrer: null,
        user_agent: null,
        ip_address: null,
        country: null,
        city: null,
        created_at: '2024-01-01T00:00:00Z',
      };

      // Type compilation check for flexible metadata
      const metadata: Record<string, unknown> = event.metadata;
      expect(metadata.message_length).toBe(250);
      expect(metadata.has_pets).toBe(true);
    });
  });

  describe('DashboardStats', () => {
    it('should compile with all required fields', () => {
      const stats: DashboardStats = {
        search_impressions: 1500,
        search_impressions_change: 12.5,
        profile_views: 850,
        profile_views_change: -5.2,
        booking_clicks: 320,
        booking_clicks_change: 8.7,
        new_inquiries: 45,
        total_campsites: 12,
        active_campsites: 10,
        pending_campsites: 2,
      };

      expect(stats.search_impressions).toBe(1500);
      expect(stats.profile_views).toBe(850);
      expect(stats.booking_clicks).toBe(320);
      expect(stats.new_inquiries).toBe(45);

      // Type compilation checks
      const searchImpressions: number = stats.search_impressions;
      const searchImpressionsChange: number = stats.search_impressions_change;
      const totalCampsites: number = stats.total_campsites;
      const activeCampsites: number = stats.active_campsites;
      const pendingCampsites: number = stats.pending_campsites;

      expect(searchImpressions).toBeGreaterThanOrEqual(0);
      expect(totalCampsites).toBe(12);
    });

    it('should support zero values', () => {
      const stats: DashboardStats = {
        search_impressions: 0,
        search_impressions_change: 0,
        profile_views: 0,
        profile_views_change: 0,
        booking_clicks: 0,
        booking_clicks_change: 0,
        new_inquiries: 0,
        total_campsites: 0,
        active_campsites: 0,
        pending_campsites: 0,
      };

      expect(stats.search_impressions).toBe(0);
      expect(stats.total_campsites).toBe(0);
    });

    it('should support negative change percentages', () => {
      const stats: DashboardStats = {
        search_impressions: 100,
        search_impressions_change: -15.5,
        profile_views: 50,
        profile_views_change: -20.0,
        booking_clicks: 25,
        booking_clicks_change: -10.5,
        new_inquiries: 5,
        total_campsites: 3,
        active_campsites: 2,
        pending_campsites: 1,
      };

      expect(stats.search_impressions_change).toBeLessThan(0);
      expect(stats.profile_views_change).toBeLessThan(0);
      expect(stats.booking_clicks_change).toBeLessThan(0);
    });
  });

  describe('AnalyticsChartData', () => {
    it('should compile with all required fields', () => {
      const chartData: AnalyticsChartData = {
        date: '2024-01-15',
        search_impressions: 120,
        profile_views: 85,
        booking_clicks: 32,
        inquiries: 5,
      };

      expect(chartData.date).toBe('2024-01-15');
      expect(chartData.search_impressions).toBe(120);

      // Type compilation checks
      const date: string = chartData.date;
      const searchImpressions: number = chartData.search_impressions;
      const profileViews: number = chartData.profile_views;
      const bookingClicks: number = chartData.booking_clicks;
      const inquiries: number = chartData.inquiries;

      expect(typeof date).toBe('string');
      expect(typeof searchImpressions).toBe('number');
    });

    it('should support zero metrics', () => {
      const chartData: AnalyticsChartData = {
        date: '2024-01-01',
        search_impressions: 0,
        profile_views: 0,
        booking_clicks: 0,
        inquiries: 0,
      };

      expect(chartData.search_impressions).toBe(0);
      expect(chartData.inquiries).toBe(0);
    });

    it('should work in arrays for time series data', () => {
      const chartDataArray: AnalyticsChartData[] = [
        {
          date: '2024-01-01',
          search_impressions: 100,
          profile_views: 50,
          booking_clicks: 20,
          inquiries: 3,
        },
        {
          date: '2024-01-02',
          search_impressions: 150,
          profile_views: 75,
          booking_clicks: 30,
          inquiries: 5,
        },
        {
          date: '2024-01-03',
          search_impressions: 130,
          profile_views: 65,
          booking_clicks: 25,
          inquiries: 4,
        },
      ];

      expect(chartDataArray).toHaveLength(3);
      expect(chartDataArray[0].date).toBe('2024-01-01');
      expect(chartDataArray[2].search_impressions).toBe(130);
    });
  });

  describe('AnalyticsResponse', () => {
    it('should compile with complete nested structure', () => {
      const response: AnalyticsResponse = {
        stats: {
          search_impressions: 1500,
          search_impressions_change: 12.5,
          profile_views: 850,
          profile_views_change: -5.2,
          booking_clicks: 320,
          booking_clicks_change: 8.7,
          new_inquiries: 45,
          total_campsites: 12,
          active_campsites: 10,
          pending_campsites: 2,
        },
        chartData: [
          {
            date: '2024-01-01',
            search_impressions: 100,
            profile_views: 50,
            booking_clicks: 20,
            inquiries: 3,
          },
          {
            date: '2024-01-02',
            search_impressions: 120,
            profile_views: 60,
            booking_clicks: 25,
            inquiries: 4,
          },
        ],
        period: {
          start: '2024-01-01',
          end: '2024-01-31',
          days: 31,
        },
      };

      expect(response.stats.search_impressions).toBe(1500);
      expect(response.chartData).toHaveLength(2);
      expect(response.period.days).toBe(31);

      // Type compilation checks for nested structure
      const stats: DashboardStats = response.stats;
      const chartData: AnalyticsChartData[] = response.chartData;
      const period: { start: string; end: string; days: number } = response.period;

      expect(stats.total_campsites).toBe(12);
      expect(chartData[0].date).toBe('2024-01-01');
      expect(period.start).toBe('2024-01-01');
    });

    it('should support empty chartData array', () => {
      const response: AnalyticsResponse = {
        stats: {
          search_impressions: 0,
          search_impressions_change: 0,
          profile_views: 0,
          profile_views_change: 0,
          booking_clicks: 0,
          booking_clicks_change: 0,
          new_inquiries: 0,
          total_campsites: 1,
          active_campsites: 0,
          pending_campsites: 1,
        },
        chartData: [],
        period: {
          start: '2024-01-01',
          end: '2024-01-01',
          days: 1,
        },
      };

      expect(response.chartData).toHaveLength(0);
      expect(response.period.days).toBe(1);
    });

    it('should support various date ranges', () => {
      const weekResponse: AnalyticsResponse = {
        stats: {
          search_impressions: 500,
          search_impressions_change: 5.0,
          profile_views: 250,
          profile_views_change: 3.5,
          booking_clicks: 100,
          booking_clicks_change: 2.0,
          new_inquiries: 15,
          total_campsites: 5,
          active_campsites: 4,
          pending_campsites: 1,
        },
        chartData: [],
        period: {
          start: '2024-01-01',
          end: '2024-01-07',
          days: 7,
        },
      };

      const monthResponse: AnalyticsResponse = {
        stats: {
          search_impressions: 2000,
          search_impressions_change: 10.0,
          profile_views: 1000,
          profile_views_change: 8.0,
          booking_clicks: 400,
          booking_clicks_change: 6.0,
          new_inquiries: 50,
          total_campsites: 10,
          active_campsites: 8,
          pending_campsites: 2,
        },
        chartData: [],
        period: {
          start: '2024-01-01',
          end: '2024-01-31',
          days: 31,
        },
      };

      expect(weekResponse.period.days).toBe(7);
      expect(monthResponse.period.days).toBe(31);
    });
  });

  describe('OwnerCampsiteSummary', () => {
    it('should compile with all required fields', () => {
      const summary: OwnerCampsiteSummary = {
        id: 'campsite-1',
        name: 'Mountain View Campsite',
        status: 'approved',
        thumbnail_url: 'https://example.com/thumb.jpg',
        average_rating: 4.5,
        review_count: 50,
        views_this_month: 850,
        inquiries_this_month: 45,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-15T00:00:00Z',
      };

      expect(summary.name).toBe('Mountain View Campsite');
      expect(summary.status).toBe('approved');

      // Type compilation checks
      const status: 'pending' | 'approved' | 'rejected' = summary.status;
      const thumbnailUrl: string | null = summary.thumbnail_url;
      const averageRating: number = summary.average_rating;
      const reviewCount: number = summary.review_count;
      const viewsThisMonth: number = summary.views_this_month;
      const inquiriesThisMonth: number = summary.inquiries_this_month;

      expect(status).toBe('approved');
      expect(averageRating).toBe(4.5);
    });

    it('should allow null thumbnail_url', () => {
      const summary: OwnerCampsiteSummary = {
        id: 'campsite-2',
        name: 'Test Campsite',
        status: 'pending',
        thumbnail_url: null,
        average_rating: 0,
        review_count: 0,
        views_this_month: 0,
        inquiries_this_month: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      expect(summary.thumbnail_url).toBeNull();
      expect(summary.status).toBe('pending');
    });

    it('should support all status values', () => {
      const approvedSummary: OwnerCampsiteSummary = {
        id: 'c1',
        name: 'Campsite 1',
        status: 'approved',
        thumbnail_url: null,
        average_rating: 4.0,
        review_count: 10,
        views_this_month: 100,
        inquiries_this_month: 5,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const pendingSummary: OwnerCampsiteSummary = {
        id: 'c2',
        name: 'Campsite 2',
        status: 'pending',
        thumbnail_url: null,
        average_rating: 0,
        review_count: 0,
        views_this_month: 0,
        inquiries_this_month: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const rejectedSummary: OwnerCampsiteSummary = {
        id: 'c3',
        name: 'Campsite 3',
        status: 'rejected',
        thumbnail_url: null,
        average_rating: 0,
        review_count: 0,
        views_this_month: 0,
        inquiries_this_month: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      expect(approvedSummary.status).toBe('approved');
      expect(pendingSummary.status).toBe('pending');
      expect(rejectedSummary.status).toBe('rejected');
    });

    it('should support zero metrics for new campsites', () => {
      const summary: OwnerCampsiteSummary = {
        id: 'campsite-new',
        name: 'New Campsite',
        status: 'pending',
        thumbnail_url: null,
        average_rating: 0,
        review_count: 0,
        views_this_month: 0,
        inquiries_this_month: 0,
        created_at: '2024-01-15T00:00:00Z',
        updated_at: '2024-01-15T00:00:00Z',
      };

      expect(summary.average_rating).toBe(0);
      expect(summary.review_count).toBe(0);
      expect(summary.views_this_month).toBe(0);
      expect(summary.inquiries_this_month).toBe(0);
    });
  });

  describe('OwnerCampsitesResponse', () => {
    it('should compile with campsites array', () => {
      const response: OwnerCampsitesResponse = {
        campsites: [
          {
            id: 'campsite-1',
            name: 'Campsite One',
            status: 'approved',
            thumbnail_url: 'https://example.com/thumb1.jpg',
            average_rating: 4.5,
            review_count: 50,
            views_this_month: 850,
            inquiries_this_month: 45,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-15T00:00:00Z',
          },
          {
            id: 'campsite-2',
            name: 'Campsite Two',
            status: 'pending',
            thumbnail_url: null,
            average_rating: 0,
            review_count: 0,
            views_this_month: 0,
            inquiries_this_month: 0,
            created_at: '2024-01-10T00:00:00Z',
            updated_at: '2024-01-10T00:00:00Z',
          },
        ],
        total: 2,
      };

      expect(response.campsites).toHaveLength(2);
      expect(response.total).toBe(2);

      // Type compilation checks
      const campsites: OwnerCampsiteSummary[] = response.campsites;
      const total: number = response.total;

      expect(campsites[0].name).toBe('Campsite One');
      expect(total).toBe(2);
    });

    it('should support empty campsites array', () => {
      const response: OwnerCampsitesResponse = {
        campsites: [],
        total: 0,
      };

      expect(response.campsites).toHaveLength(0);
      expect(response.total).toBe(0);
    });

    it('should support pagination scenarios', () => {
      const response: OwnerCampsitesResponse = {
        campsites: [
          {
            id: 'c1',
            name: 'Campsite 1',
            status: 'approved',
            thumbnail_url: null,
            average_rating: 4.0,
            review_count: 10,
            views_this_month: 100,
            inquiries_this_month: 5,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        ],
        total: 25, // Total count might be larger than returned items
      };

      expect(response.campsites).toHaveLength(1);
      expect(response.total).toBeGreaterThan(response.campsites.length);
    });
  });

  describe('Type compatibility with API responses', () => {
    it('should work with API response parsing', () => {
      // Simulating API response parsing
      const apiResponse = {
        stats: {
          search_impressions: 1500,
          search_impressions_change: 12.5,
          profile_views: 850,
          profile_views_change: -5.2,
          booking_clicks: 320,
          booking_clicks_change: 8.7,
          new_inquiries: 45,
          total_campsites: 12,
          active_campsites: 10,
          pending_campsites: 2,
        },
        chartData: [
          {
            date: '2024-01-01',
            search_impressions: 100,
            profile_views: 50,
            booking_clicks: 20,
            inquiries: 3,
          },
        ],
        period: {
          start: '2024-01-01',
          end: '2024-01-31',
          days: 31,
        },
      };

      // Type assertion to verify compatibility
      const typedResponse: AnalyticsResponse = apiResponse as AnalyticsResponse;

      expect(typedResponse.stats.search_impressions).toBe(1500);
      expect(typedResponse.chartData[0].date).toBe('2024-01-01');
    });

    it('should work with analytics event from database', () => {
      // Simulating database query result
      const dbEvent = {
        id: 'evt-123',
        campsite_id: 'camp-456',
        user_id: 'user-789',
        event_type: 'profile_view' as EventType,
        metadata: { source: 'search' },
        session_id: 'sess-abc',
        referrer: 'https://google.com',
        user_agent: 'Mozilla/5.0',
        ip_address: '192.168.1.1',
        country: 'Thailand',
        city: 'Bangkok',
        created_at: '2024-01-01T12:00:00Z',
      };

      // Type assertion to verify compatibility
      const typedEvent: AnalyticsEvent = dbEvent as AnalyticsEvent;

      expect(typedEvent.event_type).toBe('profile_view');
      expect(typedEvent.metadata.source).toBe('search');
    });

    it('should work with owner campsite list from API', () => {
      // Simulating API response
      const apiResponse = {
        campsites: [
          {
            id: 'c1',
            name: 'Test Campsite',
            status: 'approved' as const,
            thumbnail_url: 'https://example.com/thumb.jpg',
            average_rating: 4.5,
            review_count: 50,
            views_this_month: 850,
            inquiries_this_month: 45,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-15T00:00:00Z',
          },
        ],
        total: 1,
      };

      // Type assertion to verify compatibility
      const typedResponse: OwnerCampsitesResponse = apiResponse as OwnerCampsitesResponse;

      expect(typedResponse.campsites).toHaveLength(1);
      expect(typedResponse.total).toBe(1);
    });
  });

  describe('Type narrowing and guards', () => {
    it('should narrow event type based on event_type field', () => {
      const event: AnalyticsEvent = {
        id: 'e1',
        campsite_id: 'c1',
        user_id: 'u1',
        event_type: 'booking_click',
        metadata: { accommodation_id: 'acc-1' },
        session_id: 's1',
        referrer: null,
        user_agent: null,
        ip_address: null,
        country: null,
        city: null,
        created_at: '2024-01-01T00:00:00Z',
      };

      if (event.event_type === 'booking_click') {
        // Type should still be EventType here
        const eventType: EventType = event.event_type;
        expect(eventType).toBe('booking_click');
      }
    });

    it('should narrow status type for campsite summary', () => {
      const summary: OwnerCampsiteSummary = {
        id: 'c1',
        name: 'Test',
        status: 'approved',
        thumbnail_url: null,
        average_rating: 4.0,
        review_count: 10,
        views_this_month: 100,
        inquiries_this_month: 5,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      if (summary.status === 'approved') {
        const status: 'pending' | 'approved' | 'rejected' = summary.status;
        expect(status).toBe('approved');
      }
    });

    it('should handle null checks for optional fields', () => {
      const event: AnalyticsEvent = {
        id: 'e1',
        campsite_id: null,
        user_id: 'u1',
        event_type: 'search_impression',
        metadata: {},
        session_id: null,
        referrer: null,
        user_agent: null,
        ip_address: null,
        country: null,
        city: null,
        created_at: '2024-01-01T00:00:00Z',
      };

      if (event.campsite_id !== null) {
        // Type narrowing - should be string here
        const campsiteId: string = event.campsite_id;
        expect(campsiteId).toBeTruthy();
      } else {
        expect(event.campsite_id).toBeNull();
      }
    });
  });
});
