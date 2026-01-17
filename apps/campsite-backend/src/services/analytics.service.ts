import { createSupabaseClient } from '../lib/supabase';
import type {
  DashboardStats,
  AnalyticsChartData,
  AnalyticsResponse,
} from '@campsite/shared';

export class AnalyticsService {
  /**
   * Get dashboard stats for owner
   */
  async getDashboardStats(
    ownerId: string,
    periodDays: number = 30,
    supabaseToken?: string
  ): Promise<DashboardStats> {
    const supabase = createSupabaseClient(supabaseToken);

    // Get owner's campsite IDs
    const { data: campsites } = await supabase
      .from('campsites')
      .select('id, status')
      .eq('owner_id', ownerId);

    const campsiteIds = campsites?.map((c) => c.id) || [];

    if (campsiteIds.length === 0) {
      return {
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
    }

    const now = new Date();
    const periodStart = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
    const previousPeriodStart = new Date(periodStart.getTime() - periodDays * 24 * 60 * 60 * 1000);

    // Get current period stats
    const { data: currentStats } = await supabase
      .from('analytics_events')
      .select('event_type')
      .in('campsite_id', campsiteIds)
      .gte('created_at', periodStart.toISOString());

    // Get previous period stats for change calculation
    const { data: previousStats } = await supabase
      .from('analytics_events')
      .select('event_type')
      .in('campsite_id', campsiteIds)
      .gte('created_at', previousPeriodStart.toISOString())
      .lt('created_at', periodStart.toISOString());

    // Count events by type
    const countByType = (events: { event_type: string }[] | null, type: string) =>
      events?.filter((e) => e.event_type === type).length || 0;

    const currentSearchImpressions = countByType(currentStats, 'search_impression');
    const currentProfileViews = countByType(currentStats, 'profile_view');
    const currentBookingClicks = countByType(currentStats, 'booking_click');

    const previousSearchImpressions = countByType(previousStats, 'search_impression');
    const previousProfileViews = countByType(previousStats, 'profile_view');
    const previousBookingClicks = countByType(previousStats, 'booking_click');

    // Calculate percentage change
    const calcChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    // Get unread inquiries count
    const { count: newInquiries } = await supabase
      .from('inquiries')
      .select('*', { count: 'exact', head: true })
      .in('campsite_id', campsiteIds)
      .is('read_at', null);

    // Count campsites by status
    const totalCampsites = campsites?.length || 0;
    const activeCampsites = campsites?.filter((c) => c.status === 'approved').length || 0;
    const pendingCampsites = campsites?.filter((c) => c.status === 'pending').length || 0;

    return {
      search_impressions: currentSearchImpressions,
      search_impressions_change: calcChange(currentSearchImpressions, previousSearchImpressions),
      profile_views: currentProfileViews,
      profile_views_change: calcChange(currentProfileViews, previousProfileViews),
      booking_clicks: currentBookingClicks,
      booking_clicks_change: calcChange(currentBookingClicks, previousBookingClicks),
      new_inquiries: newInquiries || 0,
      total_campsites: totalCampsites,
      active_campsites: activeCampsites,
      pending_campsites: pendingCampsites,
    };
  }

  /**
   * Get analytics chart data for owner
   */
  async getChartData(
    ownerId: string,
    periodDays: number = 30,
    campsiteId?: string,
    supabaseToken?: string
  ): Promise<AnalyticsChartData[]> {
    const supabase = createSupabaseClient(supabaseToken);

    let campsiteIds: string[];

    if (campsiteId) {
      // Verify ownership
      const { data: campsite } = await supabase
        .from('campsites')
        .select('id')
        .eq('id', campsiteId)
        .eq('owner_id', ownerId)
        .single();

      if (!campsite) {
        throw new Error('Campsite not found or access denied');
      }
      campsiteIds = [campsiteId];
    } else {
      // Get all owner's campsites
      const { data: campsites } = await supabase
        .from('campsites')
        .select('id')
        .eq('owner_id', ownerId);

      campsiteIds = campsites?.map((c) => c.id) || [];
    }

    if (campsiteIds.length === 0) {
      return [];
    }

    const now = new Date();
    const periodStart = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);

    // Get all events in period
    const { data: events } = await supabase
      .from('analytics_events')
      .select('event_type, created_at')
      .in('campsite_id', campsiteIds)
      .gte('created_at', periodStart.toISOString())
      .order('created_at', { ascending: true });

    // Get inquiries in period
    const { data: inquiries } = await supabase
      .from('inquiries')
      .select('created_at')
      .in('campsite_id', campsiteIds)
      .gte('created_at', periodStart.toISOString());

    // Group by date
    const chartData: Map<string, AnalyticsChartData> = new Map();

    // Initialize all dates in period
    for (let i = 0; i < periodDays; i++) {
      const date = new Date(periodStart.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      chartData.set(dateStr, {
        date: dateStr,
        search_impressions: 0,
        profile_views: 0,
        booking_clicks: 0,
        inquiries: 0,
      });
    }

    // Aggregate events
    events?.forEach((event) => {
      const dateStr = new Date(event.created_at).toISOString().split('T')[0];
      const data = chartData.get(dateStr);
      if (data) {
        switch (event.event_type) {
          case 'search_impression':
            data.search_impressions++;
            break;
          case 'profile_view':
            data.profile_views++;
            break;
          case 'booking_click':
            data.booking_clicks++;
            break;
        }
      }
    });

    // Aggregate inquiries
    inquiries?.forEach((inquiry) => {
      const dateStr = new Date(inquiry.created_at).toISOString().split('T')[0];
      const data = chartData.get(dateStr);
      if (data) {
        data.inquiries++;
      }
    });

    return Array.from(chartData.values());
  }

  /**
   * Get full analytics response
   */
  async getAnalytics(
    ownerId: string,
    periodDays: number = 30,
    campsiteId?: string,
    supabaseToken?: string
  ): Promise<AnalyticsResponse> {
    const [stats, chartData] = await Promise.all([
      this.getDashboardStats(ownerId, periodDays, supabaseToken),
      this.getChartData(ownerId, periodDays, campsiteId, supabaseToken),
    ]);

    const now = new Date();
    const periodStart = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);

    return {
      stats,
      chartData,
      period: {
        start: periodStart.toISOString(),
        end: now.toISOString(),
        days: periodDays,
      },
    };
  }

  /**
   * Track an analytics event
   */
  async trackEvent(
    campsiteId: string,
    eventType: string,
    metadata?: Record<string, unknown>,
    userId?: string,
    sessionId?: string,
    referrer?: string,
    userAgent?: string,
    ipAddress?: string
  ): Promise<void> {
    const supabase = createSupabaseClient();

    await supabase.from('analytics_events').insert({
      campsite_id: campsiteId,
      user_id: userId || null,
      event_type: eventType,
      metadata: metadata || {},
      session_id: sessionId || null,
      referrer: referrer || null,
      user_agent: userAgent || null,
      ip_address: ipAddress || null,
    });
  }
}

export const analyticsService = new AnalyticsService();
