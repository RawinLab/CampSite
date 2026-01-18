import { AnalyticsService } from '../../src/services/analytics.service';
import type { DashboardStats, AnalyticsChartData } from '@campsite/shared';

// Mock Supabase
jest.mock('../../src/lib/supabase', () => ({
  createSupabaseClient: jest.fn(),
}));

import { createSupabaseClient } from '../../src/lib/supabase';

describe('AnalyticsService', () => {
  let analyticsService: AnalyticsService;
  let mockSupabase: any;

  beforeEach(() => {
    analyticsService = new AnalyticsService();
    jest.clearAllMocks();

    // Create mock Supabase client
    mockSupabase = {
      from: jest.fn(),
    };

    (createSupabaseClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  describe('getDashboardStats', () => {
    const ownerId = 'owner-123';
    const campsiteIds = ['campsite-1', 'campsite-2'];

    const createMockCampsites = (statuses: string[] = ['approved', 'approved']) =>
      statuses.map((status, idx) => ({
        id: `campsite-${idx + 1}`,
        status,
      }));

    const createMockAnalyticsEvents = (counts: { search?: number; profile?: number; booking?: number }) => {
      const events: { event_type: string }[] = [];

      for (let i = 0; i < (counts.search || 0); i++) {
        events.push({ event_type: 'search_impression' });
      }
      for (let i = 0; i < (counts.profile || 0); i++) {
        events.push({ event_type: 'profile_view' });
      }
      for (let i = 0; i < (counts.booking || 0); i++) {
        events.push({ event_type: 'booking_click' });
      }

      return events;
    };

    it('should calculate correct totals for dashboard stats', async () => {
      const mockCampsites = createMockCampsites(['approved', 'pending']);
      const currentEvents = createMockAnalyticsEvents({
        search: 100,
        profile: 50,
        booking: 10,
      });
      const previousEvents = createMockAnalyticsEvents({
        search: 80,
        profile: 40,
        booking: 8,
      });

      // Mock campsites query
      const mockCampsitesQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: mockCampsites }),
      };

      // Mock current period analytics events
      const mockCurrentEventsQuery = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        gte: jest.fn().mockResolvedValue({ data: currentEvents }),
      };

      // Mock previous period analytics events
      const mockPreviousEventsQuery = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lt: jest.fn().mockResolvedValue({ data: previousEvents }),
      };

      // Mock inquiries query
      const mockInquiriesQuery = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        is: jest.fn().mockResolvedValue({ count: 5 }),
      };

      mockSupabase.from
        .mockReturnValueOnce(mockCampsitesQuery)
        .mockReturnValueOnce(mockCurrentEventsQuery)
        .mockReturnValueOnce(mockPreviousEventsQuery)
        .mockReturnValueOnce(mockInquiriesQuery);

      const result = await analyticsService.getDashboardStats(ownerId, 30, 'token');

      expect(result).toEqual({
        search_impressions: 100,
        search_impressions_change: 25, // (100-80)/80 * 100 = 25%
        profile_views: 50,
        profile_views_change: 25, // (50-40)/40 * 100 = 25%
        booking_clicks: 10,
        booking_clicks_change: 25, // (10-8)/8 * 100 = 25%
        new_inquiries: 5,
        total_campsites: 2,
        active_campsites: 1,
        pending_campsites: 1,
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('campsites');
      expect(mockSupabase.from).toHaveBeenCalledWith('analytics_events');
      expect(mockSupabase.from).toHaveBeenCalledWith('inquiries');
      expect(createSupabaseClient).toHaveBeenCalledWith('token');
    });

    it('should calculate month-over-month changes correctly', async () => {
      const mockCampsites = createMockCampsites();

      // Current: 120, Previous: 100 = +20%
      const currentEvents = createMockAnalyticsEvents({
        search: 120,
        profile: 60,
        booking: 15,
      });
      const previousEvents = createMockAnalyticsEvents({
        search: 100,
        profile: 80, // Current 60, Previous 80 = -25%
        booking: 20, // Current 15, Previous 20 = -25%
      });

      const mockCampsitesQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: mockCampsites }),
      };

      const mockCurrentEventsQuery = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        gte: jest.fn().mockResolvedValue({ data: currentEvents }),
      };

      const mockPreviousEventsQuery = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lt: jest.fn().mockResolvedValue({ data: previousEvents }),
      };

      const mockInquiriesQuery = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        is: jest.fn().mockResolvedValue({ count: 3 }),
      };

      mockSupabase.from
        .mockReturnValueOnce(mockCampsitesQuery)
        .mockReturnValueOnce(mockCurrentEventsQuery)
        .mockReturnValueOnce(mockPreviousEventsQuery)
        .mockReturnValueOnce(mockInquiriesQuery);

      const result = await analyticsService.getDashboardStats(ownerId, 30);

      expect(result.search_impressions_change).toBe(20); // +20%
      expect(result.profile_views_change).toBe(-25); // -25%
      expect(result.booking_clicks_change).toBe(-25); // -25%
    });

    it('should handle empty data for new owner', async () => {
      // Owner has no campsites
      const mockCampsitesQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: [] }),
      };

      mockSupabase.from.mockReturnValueOnce(mockCampsitesQuery);

      const result = await analyticsService.getDashboardStats(ownerId, 30);

      expect(result).toEqual({
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
      });

      // Should only query campsites, not events/inquiries
      expect(mockSupabase.from).toHaveBeenCalledTimes(1);
      expect(mockSupabase.from).toHaveBeenCalledWith('campsites');
    });

    it('should handle zero previous period (100% increase)', async () => {
      const mockCampsites = createMockCampsites();
      const currentEvents = createMockAnalyticsEvents({
        search: 50,
        profile: 30,
        booking: 5,
      });
      const previousEvents: any[] = []; // No previous events

      const mockCampsitesQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: mockCampsites }),
      };

      const mockCurrentEventsQuery = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        gte: jest.fn().mockResolvedValue({ data: currentEvents }),
      };

      const mockPreviousEventsQuery = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lt: jest.fn().mockResolvedValue({ data: previousEvents }),
      };

      const mockInquiriesQuery = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        is: jest.fn().mockResolvedValue({ count: 2 }),
      };

      mockSupabase.from
        .mockReturnValueOnce(mockCampsitesQuery)
        .mockReturnValueOnce(mockCurrentEventsQuery)
        .mockReturnValueOnce(mockPreviousEventsQuery)
        .mockReturnValueOnce(mockInquiriesQuery);

      const result = await analyticsService.getDashboardStats(ownerId, 30);

      // When previous is 0 and current > 0, change should be 100%
      expect(result.search_impressions_change).toBe(100);
      expect(result.profile_views_change).toBe(100);
      expect(result.booking_clicks_change).toBe(100);
    });

    it('should handle zero current and previous (0% change)', async () => {
      const mockCampsites = createMockCampsites();
      const currentEvents: any[] = []; // No current events
      const previousEvents: any[] = []; // No previous events

      const mockCampsitesQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: mockCampsites }),
      };

      const mockCurrentEventsQuery = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        gte: jest.fn().mockResolvedValue({ data: currentEvents }),
      };

      const mockPreviousEventsQuery = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lt: jest.fn().mockResolvedValue({ data: previousEvents }),
      };

      const mockInquiriesQuery = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        is: jest.fn().mockResolvedValue({ count: 0 }),
      };

      mockSupabase.from
        .mockReturnValueOnce(mockCampsitesQuery)
        .mockReturnValueOnce(mockCurrentEventsQuery)
        .mockReturnValueOnce(mockPreviousEventsQuery)
        .mockReturnValueOnce(mockInquiriesQuery);

      const result = await analyticsService.getDashboardStats(ownerId, 30);

      // When both are 0, change should be 0%
      expect(result.search_impressions_change).toBe(0);
      expect(result.profile_views_change).toBe(0);
      expect(result.booking_clicks_change).toBe(0);
    });

    it('should only include data for owner\'s campsites', async () => {
      const mockCampsites = createMockCampsites();
      const currentEvents = createMockAnalyticsEvents({ search: 10 });
      const previousEvents = createMockAnalyticsEvents({ search: 5 });

      const mockCampsitesQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: mockCampsites }),
      };

      const mockCurrentEventsQuery = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        gte: jest.fn().mockResolvedValue({ data: currentEvents }),
      };

      const mockPreviousEventsQuery = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lt: jest.fn().mockResolvedValue({ data: previousEvents }),
      };

      const mockInquiriesQuery = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        is: jest.fn().mockResolvedValue({ count: 1 }),
      };

      mockSupabase.from
        .mockReturnValueOnce(mockCampsitesQuery)
        .mockReturnValueOnce(mockCurrentEventsQuery)
        .mockReturnValueOnce(mockPreviousEventsQuery)
        .mockReturnValueOnce(mockInquiriesQuery);

      await analyticsService.getDashboardStats(ownerId, 30);

      // Verify owner_id filter
      expect(mockCampsitesQuery.eq).toHaveBeenCalledWith('owner_id', ownerId);

      // Verify campsite_id filters
      expect(mockCurrentEventsQuery.in).toHaveBeenCalledWith('campsite_id', ['campsite-1', 'campsite-2']);
      expect(mockPreviousEventsQuery.in).toHaveBeenCalledWith('campsite_id', ['campsite-1', 'campsite-2']);
      expect(mockInquiriesQuery.in).toHaveBeenCalledWith('campsite_id', ['campsite-1', 'campsite-2']);
    });

    it('should handle multiple campsites aggregation', async () => {
      const mockCampsites = [
        { id: 'campsite-1', status: 'approved' },
        { id: 'campsite-2', status: 'approved' },
        { id: 'campsite-3', status: 'pending' },
        { id: 'campsite-4', status: 'rejected' },
      ];

      const currentEvents = createMockAnalyticsEvents({
        search: 200,
        profile: 100,
        booking: 20,
      });

      const previousEvents = createMockAnalyticsEvents({
        search: 150,
        profile: 75,
        booking: 15,
      });

      const mockCampsitesQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: mockCampsites }),
      };

      const mockCurrentEventsQuery = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        gte: jest.fn().mockResolvedValue({ data: currentEvents }),
      };

      const mockPreviousEventsQuery = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lt: jest.fn().mockResolvedValue({ data: previousEvents }),
      };

      const mockInquiriesQuery = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        is: jest.fn().mockResolvedValue({ count: 8 }),
      };

      mockSupabase.from
        .mockReturnValueOnce(mockCampsitesQuery)
        .mockReturnValueOnce(mockCurrentEventsQuery)
        .mockReturnValueOnce(mockPreviousEventsQuery)
        .mockReturnValueOnce(mockInquiriesQuery);

      const result = await analyticsService.getDashboardStats(ownerId, 30);

      expect(result.total_campsites).toBe(4);
      expect(result.active_campsites).toBe(2);
      expect(result.pending_campsites).toBe(1);
      expect(result.search_impressions).toBe(200);
      expect(result.profile_views).toBe(100);
      expect(result.booking_clicks).toBe(20);
      expect(result.new_inquiries).toBe(8);
    });

    it('should use custom period days parameter', async () => {
      const mockCampsites = createMockCampsites();
      const currentEvents = createMockAnalyticsEvents({ search: 10 });
      const previousEvents = createMockAnalyticsEvents({ search: 5 });

      const mockCampsitesQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: mockCampsites }),
      };

      const mockCurrentEventsQuery = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        gte: jest.fn().mockResolvedValue({ data: currentEvents }),
      };

      const mockPreviousEventsQuery = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lt: jest.fn().mockResolvedValue({ data: previousEvents }),
      };

      const mockInquiriesQuery = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        is: jest.fn().mockResolvedValue({ count: 1 }),
      };

      mockSupabase.from
        .mockReturnValueOnce(mockCampsitesQuery)
        .mockReturnValueOnce(mockCurrentEventsQuery)
        .mockReturnValueOnce(mockPreviousEventsQuery)
        .mockReturnValueOnce(mockInquiriesQuery);

      // Use 7 days instead of default 30
      await analyticsService.getDashboardStats(ownerId, 7);

      // Verify date range was calculated with 7 days
      expect(mockCurrentEventsQuery.gte).toHaveBeenCalled();
      expect(mockPreviousEventsQuery.gte).toHaveBeenCalled();
      expect(mockPreviousEventsQuery.lt).toHaveBeenCalled();
    });
  });

  describe('getChartData', () => {
    const ownerId = 'owner-123';
    const campsiteId = 'campsite-1';

    it('should return 30-day trend data', async () => {
      const mockCampsites = [{ id: campsiteId }];

      const now = new Date('2026-01-18T12:00:00Z');
      jest.useFakeTimers();
      jest.setSystemTime(now);

      const mockEvents = [
        { event_type: 'search_impression', created_at: '2025-12-20T10:00:00Z' },
        { event_type: 'profile_view', created_at: '2025-12-20T11:00:00Z' },
        { event_type: 'booking_click', created_at: '2025-12-20T12:00:00Z' },
        { event_type: 'search_impression', created_at: '2025-12-21T10:00:00Z' },
      ];

      const mockInquiries = [
        { created_at: '2025-12-20T13:00:00Z' },
      ];

      const mockCampsitesQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: mockCampsites }),
      };

      const mockEventsQuery = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockEvents }),
      };

      const mockInquiriesQuery = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        gte: jest.fn().mockResolvedValue({ data: mockInquiries }),
      };

      mockSupabase.from
        .mockReturnValueOnce(mockCampsitesQuery)
        .mockReturnValueOnce(mockEventsQuery)
        .mockReturnValueOnce(mockInquiriesQuery);

      const result = await analyticsService.getChartData(ownerId, 30);

      // Should return exactly 30 days of data
      expect(result).toHaveLength(30);

      // Each day should have the correct structure
      expect(result[0]).toHaveProperty('date');
      expect(result[0]).toHaveProperty('search_impressions');
      expect(result[0]).toHaveProperty('profile_views');
      expect(result[0]).toHaveProperty('booking_clicks');
      expect(result[0]).toHaveProperty('inquiries');

      // Verify date format (YYYY-MM-DD)
      expect(result[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/);

      jest.useRealTimers();
    });

    it('should group events by day correctly', async () => {
      const mockCampsites = [{ id: campsiteId }];

      const now = new Date('2026-01-18T12:00:00Z');
      jest.useFakeTimers();
      jest.setSystemTime(now);

      const mockEvents = [
        // Same day, multiple events
        { event_type: 'search_impression', created_at: '2025-12-20T08:00:00Z' },
        { event_type: 'search_impression', created_at: '2025-12-20T10:00:00Z' },
        { event_type: 'search_impression', created_at: '2025-12-20T15:00:00Z' },
        { event_type: 'profile_view', created_at: '2025-12-20T11:00:00Z' },
        { event_type: 'profile_view', created_at: '2025-12-20T14:00:00Z' },
        { event_type: 'booking_click', created_at: '2025-12-20T12:00:00Z' },

        // Different day
        { event_type: 'search_impression', created_at: '2025-12-21T10:00:00Z' },
        { event_type: 'profile_view', created_at: '2025-12-21T11:00:00Z' },
      ];

      const mockInquiries = [
        { created_at: '2025-12-20T13:00:00Z' },
        { created_at: '2025-12-20T16:00:00Z' },
        { created_at: '2025-12-21T14:00:00Z' },
      ];

      const mockCampsitesQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: mockCampsites }),
      };

      const mockEventsQuery = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockEvents }),
      };

      const mockInquiriesQuery = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        gte: jest.fn().mockResolvedValue({ data: mockInquiries }),
      };

      mockSupabase.from
        .mockReturnValueOnce(mockCampsitesQuery)
        .mockReturnValueOnce(mockEventsQuery)
        .mockReturnValueOnce(mockInquiriesQuery);

      const result = await analyticsService.getChartData(ownerId, 30);

      // Find the specific dates
      const dec20 = result.find(d => d.date === '2025-12-20');
      const dec21 = result.find(d => d.date === '2025-12-21');

      // Verify Dec 20 aggregation
      expect(dec20?.search_impressions).toBe(3);
      expect(dec20?.profile_views).toBe(2);
      expect(dec20?.booking_clicks).toBe(1);
      expect(dec20?.inquiries).toBe(2);

      // Verify Dec 21 aggregation
      expect(dec21?.search_impressions).toBe(1);
      expect(dec21?.profile_views).toBe(1);
      expect(dec21?.booking_clicks).toBe(0);
      expect(dec21?.inquiries).toBe(1);

      jest.useRealTimers();
    });

    it('should only include data for owner\'s campsites', async () => {
      const mockCampsites = [
        { id: 'campsite-1' },
        { id: 'campsite-2' },
      ];

      const mockCampsitesQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: mockCampsites }),
      };

      const mockEventsQuery = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [] }),
      };

      const mockInquiriesQuery = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        gte: jest.fn().mockResolvedValue({ data: [] }),
      };

      mockSupabase.from
        .mockReturnValueOnce(mockCampsitesQuery)
        .mockReturnValueOnce(mockEventsQuery)
        .mockReturnValueOnce(mockInquiriesQuery);

      await analyticsService.getChartData(ownerId, 30);

      // Verify owner_id filter
      expect(mockCampsitesQuery.eq).toHaveBeenCalledWith('owner_id', ownerId);

      // Verify campsite_id filters
      expect(mockEventsQuery.in).toHaveBeenCalledWith('campsite_id', ['campsite-1', 'campsite-2']);
      expect(mockInquiriesQuery.in).toHaveBeenCalledWith('campsite_id', ['campsite-1', 'campsite-2']);
    });

    it('should filter by specific campsite when provided', async () => {
      const mockCampsite = { id: campsiteId };

      const mockCampsiteQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockCampsite }),
      };

      const mockEventsQuery = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [] }),
      };

      const mockInquiriesQuery = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        gte: jest.fn().mockResolvedValue({ data: [] }),
      };

      mockSupabase.from
        .mockReturnValueOnce(mockCampsiteQuery)
        .mockReturnValueOnce(mockEventsQuery)
        .mockReturnValueOnce(mockInquiriesQuery);

      await analyticsService.getChartData(ownerId, 30, campsiteId);

      // Verify ownership check
      expect(mockCampsiteQuery.eq).toHaveBeenCalledWith('id', campsiteId);
      expect(mockCampsiteQuery.eq).toHaveBeenCalledWith('owner_id', ownerId);

      // Verify filtered to single campsite
      expect(mockEventsQuery.in).toHaveBeenCalledWith('campsite_id', [campsiteId]);
      expect(mockInquiriesQuery.in).toHaveBeenCalledWith('campsite_id', [campsiteId]);
    });

    it('should throw error if campsite not found or access denied', async () => {
      const mockCampsiteQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null }),
      };

      mockSupabase.from.mockReturnValueOnce(mockCampsiteQuery);

      await expect(
        analyticsService.getChartData(ownerId, 30, campsiteId)
      ).rejects.toThrow('Campsite not found or access denied');
    });

    it('should return empty array for owner with no campsites', async () => {
      const mockCampsitesQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: [] }),
      };

      mockSupabase.from.mockReturnValueOnce(mockCampsitesQuery);

      const result = await analyticsService.getChartData(ownerId, 30);

      expect(result).toEqual([]);

      // Should not query events/inquiries
      expect(mockSupabase.from).toHaveBeenCalledTimes(1);
    });

    it('should handle date range filtering correctly', async () => {
      const mockCampsites = [{ id: campsiteId }];

      const now = new Date('2026-01-18T12:00:00Z');
      jest.useFakeTimers();
      jest.setSystemTime(now);

      const mockCampsitesQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: mockCampsites }),
      };

      const mockEventsQuery = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [] }),
      };

      const mockInquiriesQuery = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        gte: jest.fn().mockResolvedValue({ data: [] }),
      };

      mockSupabase.from
        .mockReturnValueOnce(mockCampsitesQuery)
        .mockReturnValueOnce(mockEventsQuery)
        .mockReturnValueOnce(mockInquiriesQuery);

      await analyticsService.getChartData(ownerId, 7);

      // Verify gte was called with date string
      expect(mockEventsQuery.gte).toHaveBeenCalledWith('created_at', expect.any(String));
      expect(mockInquiriesQuery.gte).toHaveBeenCalledWith('created_at', expect.any(String));

      jest.useRealTimers();
    });

    it('should initialize all days with zero values', async () => {
      const mockCampsites = [{ id: campsiteId }];

      const now = new Date('2026-01-18T12:00:00Z');
      jest.useFakeTimers();
      jest.setSystemTime(now);

      const mockCampsitesQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: mockCampsites }),
      };

      const mockEventsQuery = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [] }),
      };

      const mockInquiriesQuery = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        gte: jest.fn().mockResolvedValue({ data: [] }),
      };

      mockSupabase.from
        .mockReturnValueOnce(mockCampsitesQuery)
        .mockReturnValueOnce(mockEventsQuery)
        .mockReturnValueOnce(mockInquiriesQuery);

      const result = await analyticsService.getChartData(ownerId, 30);

      // All days should have zero values
      result.forEach(day => {
        expect(day.search_impressions).toBe(0);
        expect(day.profile_views).toBe(0);
        expect(day.booking_clicks).toBe(0);
        expect(day.inquiries).toBe(0);
      });

      jest.useRealTimers();
    });

    it('should pass supabase token to client', async () => {
      const mockCampsites = [{ id: campsiteId }];
      const token = 'test-token';

      const mockCampsitesQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: mockCampsites }),
      };

      const mockEventsQuery = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [] }),
      };

      const mockInquiriesQuery = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        gte: jest.fn().mockResolvedValue({ data: [] }),
      };

      mockSupabase.from
        .mockReturnValueOnce(mockCampsitesQuery)
        .mockReturnValueOnce(mockEventsQuery)
        .mockReturnValueOnce(mockInquiriesQuery);

      await analyticsService.getChartData(ownerId, 30, undefined, token);

      expect(createSupabaseClient).toHaveBeenCalledWith(token);
    });
  });

  describe('trackEvent', () => {
    const campsiteId = 'campsite-123';
    const userId = 'user-456';
    const sessionId = 'session-789';

    it('should create analytics record with all parameters', async () => {
      const mockInsert = {
        insert: jest.fn().mockResolvedValue({ data: null, error: null }),
      };

      mockSupabase.from.mockReturnValue(mockInsert);

      const metadata = { source: 'search_page', query: 'beach camping' };
      const eventType = 'search_impression';
      const referrer = 'https://google.com';
      const userAgent = 'Mozilla/5.0';
      const ipAddress = '192.168.1.1';

      await analyticsService.trackEvent(
        campsiteId,
        eventType,
        metadata,
        userId,
        sessionId,
        referrer,
        userAgent,
        ipAddress
      );

      expect(mockSupabase.from).toHaveBeenCalledWith('analytics_events');
      expect(mockInsert.insert).toHaveBeenCalledWith({
        campsite_id: campsiteId,
        user_id: userId,
        event_type: eventType,
        metadata,
        session_id: sessionId,
        referrer,
        user_agent: userAgent,
        ip_address: ipAddress,
      });
    });

    it('should create analytics record with minimal parameters', async () => {
      const mockInsert = {
        insert: jest.fn().mockResolvedValue({ data: null, error: null }),
      };

      mockSupabase.from.mockReturnValue(mockInsert);

      await analyticsService.trackEvent(campsiteId, 'profile_view');

      expect(mockInsert.insert).toHaveBeenCalledWith({
        campsite_id: campsiteId,
        user_id: null,
        event_type: 'profile_view',
        metadata: {},
        session_id: null,
        referrer: null,
        user_agent: null,
        ip_address: null,
      });
    });

    it('should track search_impression events', async () => {
      const mockInsert = {
        insert: jest.fn().mockResolvedValue({ data: null, error: null }),
      };

      mockSupabase.from.mockReturnValue(mockInsert);

      await analyticsService.trackEvent(
        campsiteId,
        'search_impression',
        { position: 1, page: 1 }
      );

      expect(mockInsert.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          event_type: 'search_impression',
          metadata: { position: 1, page: 1 },
        })
      );
    });

    it('should track profile_view events', async () => {
      const mockInsert = {
        insert: jest.fn().mockResolvedValue({ data: null, error: null }),
      };

      mockSupabase.from.mockReturnValue(mockInsert);

      await analyticsService.trackEvent(
        campsiteId,
        'profile_view',
        { tab: 'overview' },
        userId
      );

      expect(mockInsert.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          event_type: 'profile_view',
          user_id: userId,
          metadata: { tab: 'overview' },
        })
      );
    });

    it('should track booking_click events', async () => {
      const mockInsert = {
        insert: jest.fn().mockResolvedValue({ data: null, error: null }),
      };

      mockSupabase.from.mockReturnValue(mockInsert);

      await analyticsService.trackEvent(
        campsiteId,
        'booking_click',
        { platform: 'booking.com' },
        userId
      );

      expect(mockInsert.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          event_type: 'booking_click',
          user_id: userId,
          metadata: { platform: 'booking.com' },
        })
      );
    });

    it('should handle null metadata', async () => {
      const mockInsert = {
        insert: jest.fn().mockResolvedValue({ data: null, error: null }),
      };

      mockSupabase.from.mockReturnValue(mockInsert);

      await analyticsService.trackEvent(campsiteId, 'profile_view', undefined);

      expect(mockInsert.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: {},
        })
      );
    });

    it('should use admin client (no token)', async () => {
      const mockInsert = {
        insert: jest.fn().mockResolvedValue({ data: null, error: null }),
      };

      mockSupabase.from.mockReturnValue(mockInsert);

      await analyticsService.trackEvent(campsiteId, 'search_impression');

      // Should be called with no token (undefined)
      expect(createSupabaseClient).toHaveBeenCalledWith();
    });

    it('should handle complex metadata objects', async () => {
      const mockInsert = {
        insert: jest.fn().mockResolvedValue({ data: null, error: null }),
      };

      mockSupabase.from.mockReturnValue(mockInsert);

      const complexMetadata = {
        search: {
          query: 'mountain camping',
          filters: {
            province: 'Chiang Mai',
            type: 'tent',
            amenities: ['wifi', 'parking'],
          },
          results: 25,
        },
        user: {
          isLoggedIn: true,
          preferences: ['mountain', 'nature'],
        },
      };

      await analyticsService.trackEvent(
        campsiteId,
        'search_impression',
        complexMetadata
      );

      expect(mockInsert.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: complexMetadata,
        })
      );
    });
  });

  describe('getAnalytics', () => {
    const ownerId = 'owner-123';

    it('should return combined stats and chart data', async () => {
      const mockStats: DashboardStats = {
        search_impressions: 100,
        search_impressions_change: 20,
        profile_views: 50,
        profile_views_change: 10,
        booking_clicks: 10,
        booking_clicks_change: 5,
        new_inquiries: 3,
        total_campsites: 2,
        active_campsites: 2,
        pending_campsites: 0,
      };

      const mockChartData: AnalyticsChartData[] = [
        {
          date: '2026-01-17',
          search_impressions: 10,
          profile_views: 5,
          booking_clicks: 1,
          inquiries: 0,
        },
        {
          date: '2026-01-18',
          search_impressions: 15,
          profile_views: 8,
          booking_clicks: 2,
          inquiries: 1,
        },
      ];

      jest.spyOn(analyticsService, 'getDashboardStats').mockResolvedValue(mockStats);
      jest.spyOn(analyticsService, 'getChartData').mockResolvedValue(mockChartData);

      const now = new Date('2026-01-18T12:00:00Z');
      jest.useFakeTimers();
      jest.setSystemTime(now);

      const result = await analyticsService.getAnalytics(ownerId, 30);

      expect(result.stats).toEqual(mockStats);
      expect(result.chartData).toEqual(mockChartData);
      expect(result.period.days).toBe(30);
      expect(result.period.start).toBeDefined();
      expect(result.period.end).toBeDefined();

      expect(analyticsService.getDashboardStats).toHaveBeenCalledWith(ownerId, 30, undefined);
      expect(analyticsService.getChartData).toHaveBeenCalledWith(ownerId, 30, undefined, undefined);

      jest.useRealTimers();
    });

    it('should pass campsite filter to getChartData', async () => {
      const mockStats: DashboardStats = {
        search_impressions: 50,
        search_impressions_change: 0,
        profile_views: 25,
        profile_views_change: 0,
        booking_clicks: 5,
        booking_clicks_change: 0,
        new_inquiries: 1,
        total_campsites: 1,
        active_campsites: 1,
        pending_campsites: 0,
      };

      const mockChartData: AnalyticsChartData[] = [];

      jest.spyOn(analyticsService, 'getDashboardStats').mockResolvedValue(mockStats);
      jest.spyOn(analyticsService, 'getChartData').mockResolvedValue(mockChartData);

      const campsiteId = 'campsite-123';
      await analyticsService.getAnalytics(ownerId, 30, campsiteId);

      expect(analyticsService.getChartData).toHaveBeenCalledWith(ownerId, 30, campsiteId, undefined);
    });

    it('should pass token to both methods', async () => {
      const mockStats: DashboardStats = {
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

      const mockChartData: AnalyticsChartData[] = [];

      jest.spyOn(analyticsService, 'getDashboardStats').mockResolvedValue(mockStats);
      jest.spyOn(analyticsService, 'getChartData').mockResolvedValue(mockChartData);

      const token = 'test-token';
      await analyticsService.getAnalytics(ownerId, 30, undefined, token);

      expect(analyticsService.getDashboardStats).toHaveBeenCalledWith(ownerId, 30, token);
      expect(analyticsService.getChartData).toHaveBeenCalledWith(ownerId, 30, undefined, token);
    });

    it('should calculate period dates correctly', async () => {
      const mockStats: DashboardStats = {
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

      jest.spyOn(analyticsService, 'getDashboardStats').mockResolvedValue(mockStats);
      jest.spyOn(analyticsService, 'getChartData').mockResolvedValue([]);

      const now = new Date('2026-01-18T12:00:00Z');
      jest.useFakeTimers();
      jest.setSystemTime(now);

      const result = await analyticsService.getAnalytics(ownerId, 7);

      const expectedStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      expect(result.period.start).toBe(expectedStart.toISOString());
      expect(result.period.end).toBe(now.toISOString());
      expect(result.period.days).toBe(7);

      jest.useRealTimers();
    });
  });
});
