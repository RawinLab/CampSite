import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/dashboard/StatCard';
import { AnalyticsChart } from '@/components/dashboard/AnalyticsChart';
import { CampsiteTable } from '@/components/dashboard/CampsiteTable';
import { InquiryCard } from '@/components/dashboard/InquiryCard';
import { Search, Eye, MousePointer, MessageSquare, Plus } from 'lucide-react';
import type { DashboardStats, AnalyticsChartData, OwnerCampsiteSummary, InquiryWithCampsite } from '@campsite/shared';

async function getDashboardData(userId: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  try {
    // Get stats
    const statsRes = await fetch(`${apiUrl}/api/dashboard/stats?period=30`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Get analytics chart data
    const analyticsRes = await fetch(`${apiUrl}/api/dashboard/analytics?period=30`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Get campsites
    const campsitesRes = await fetch(`${apiUrl}/api/dashboard/campsites?limit=5`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Get recent inquiries
    const inquiriesRes = await fetch(`${apiUrl}/api/dashboard/inquiries?limit=5`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const stats = statsRes.ok ? (await statsRes.json()).data : null;
    const analytics = analyticsRes.ok ? (await analyticsRes.json()).data : null;
    const campsites = campsitesRes.ok ? (await campsitesRes.json()).data : [];
    const inquiriesData = inquiriesRes.ok ? await inquiriesRes.json() : { data: [], unread_count: 0 };

    return {
      stats,
      chartData: analytics?.chartData || [],
      campsites,
      inquiries: inquiriesData.data || [],
      unreadCount: inquiriesData.unread_count || 0,
    };
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error);
    return {
      stats: null,
      chartData: [],
      campsites: [],
      inquiries: [],
      unreadCount: 0,
    };
  }
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/auth/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', session.user.id)
    .single();

  const { stats, chartData, campsites, inquiries, unreadCount } = await getDashboardData(
    session.user.id
  );

  const defaultStats: DashboardStats = {
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

  const displayStats = stats || defaultStats;

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold">Welcome, {profile?.full_name || 'Owner'}</h1>
        <p className="text-muted-foreground">
          Here is an overview of your campsites performance
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Search Impressions"
          value={displayStats.search_impressions}
          change={displayStats.search_impressions_change}
          icon={Search}
        />
        <StatCard
          title="Profile Views"
          value={displayStats.profile_views}
          change={displayStats.profile_views_change}
          icon={Eye}
        />
        <StatCard
          title="Booking Clicks"
          value={displayStats.booking_clicks}
          change={displayStats.booking_clicks_change}
          icon={MousePointer}
        />
        <StatCard
          title="New Inquiries"
          value={displayStats.new_inquiries}
          icon={MessageSquare}
          highlight={displayStats.new_inquiries > 0}
        />
      </div>

      {/* Analytics Chart */}
      <AnalyticsChart data={chartData} title="30-Day Analytics" />

      {/* Recent Inquiries */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle>Recent Inquiries</CardTitle>
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-primary rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard/inquiries">View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {inquiries.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No inquiries yet. They will appear here when guests contact you.
            </p>
          ) : (
            <div className="space-y-4">
              {inquiries.slice(0, 5).map((inquiry: InquiryWithCampsite) => (
                <InquiryCard key={inquiry.id} inquiry={inquiry} compact />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Campsites Overview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Your Campsites ({displayStats.total_campsites})</CardTitle>
          <Button asChild>
            <Link href="/dashboard/campsites/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Campsite
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <CampsiteTable campsites={campsites} compact />
          {campsites.length > 0 && (
            <div className="mt-4 text-center">
              <Button asChild variant="outline">
                <Link href="/dashboard/campsites">View All Campsites</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
