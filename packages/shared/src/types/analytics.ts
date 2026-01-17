// Analytics Types for Owner Dashboard

export type EventType =
  | 'search_impression'
  | 'profile_view'
  | 'booking_click'
  | 'inquiry_sent'
  | 'wishlist_add'
  | 'phone_click'
  | 'website_click';

export interface AnalyticsEvent {
  id: string;
  campsite_id: string | null;
  user_id: string | null;
  event_type: EventType;
  metadata: Record<string, unknown>;
  session_id: string | null;
  referrer: string | null;
  user_agent: string | null;
  ip_address: string | null;
  country: string | null;
  city: string | null;
  created_at: string;
}

export interface DashboardStats {
  search_impressions: number;
  search_impressions_change: number;
  profile_views: number;
  profile_views_change: number;
  booking_clicks: number;
  booking_clicks_change: number;
  new_inquiries: number;
  total_campsites: number;
  active_campsites: number;
  pending_campsites: number;
}

export interface AnalyticsChartData {
  date: string;
  search_impressions: number;
  profile_views: number;
  booking_clicks: number;
  inquiries: number;
}

export interface AnalyticsResponse {
  stats: DashboardStats;
  chartData: AnalyticsChartData[];
  period: {
    start: string;
    end: string;
    days: number;
  };
}

export interface OwnerCampsiteSummary {
  id: string;
  name: string;
  status: 'pending' | 'approved' | 'rejected';
  thumbnail_url: string | null;
  average_rating: number;
  review_count: number;
  views_this_month: number;
  inquiries_this_month: number;
  created_at: string;
  updated_at: string;
}

export interface OwnerCampsitesResponse {
  campsites: OwnerCampsiteSummary[];
  total: number;
}
