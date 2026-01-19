'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, Play, Settings, Users, Calendar, Database, ArrowRight } from 'lucide-react';
import { getAccessToken } from '@/lib/auth/token';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3091';

interface GooglePlacesStats {
  total_raw_places: number;
  pending_candidates: number;
  synced_last: string | null;
  total_imported: number;
}

export default function GooglePlacesPage() {
  const { user, role, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<GooglePlacesStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Check admin access
  useEffect(() => {
    if (!authLoading && (!user || role !== 'admin')) {
      window.location.href = '/auth/login?redirect=/admin/google-places';
    }
  }, [user, role, authLoading]);

  // Fetch stats
  useEffect(() => {
    async function fetchStats() {
      if (!user || role !== 'admin') return;

      try {
        const token = getAccessToken();
        const headers = {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };

        // Get candidate counts
        const [pendingRes, totalRes, lastSyncRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/admin/google-places/candidates?status=pending&limit=1`, {
            headers,
            credentials: 'include',
          }),
          fetch(`${API_BASE_URL}/api/admin/google-places/candidates?limit=1`, {
            headers,
            credentials: 'include',
          }),
          fetch(`${API_BASE_URL}/api/admin/google-places/sync/logs?limit=1`, {
            headers,
            credentials: 'include',
          }),
        ]);

        // Get total raw places count (we'll need this endpoint)
        const totalRaw = 0; // TODO: Add endpoint to get stats

        // Get imported campsites count
        const imported = 0; // TODO: Add endpoint to get stats

        let total = 0;
        if (pendingRes.ok) {
          const data = await pendingRes.json();
          if (data.success) {
            total = data.pagination?.total || 0;
          }
        }

        setStats({
          total_raw_places: totalRaw,
          pending_candidates: total,
          synced_last: null, // Will get from sync logs
          total_imported: imported,
        });
      } catch (error) {
        console.error('Failed to fetch Google Places stats', error);
      } finally {
        setStatsLoading(false);
      }
    }

    fetchStats();
  }, [user, role]);

  if (statsLoading || authLoading) {
    return (
      <div className="p-8">
        <Skeleton className="h-8 w-64 mb-4" />
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!user || role !== 'admin') {
    return null;
  }

  return (
    <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Google Places Integration</h1>
          <p className="text-muted-foreground">
            Manage Google Places API data ingestion and campsite imports
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <StatsCard
            title="Pending Candidates"
            value={stats?.pending_candidates || 0}
            description="Awaiting review"
            icon={<Users className="h-4 w-4" />}
            href="/admin/google-places/candidates"
          />
          <StatsCard
            title="Sync Status"
            value={stats?.synced_last ? 'Synced' : 'Pending'}
            description={stats?.synced_last ? `Last: ${new Date(stats.synced_last).toLocaleDateString()}` : 'Not synced yet'}
            icon={<Calendar className="h-4 w-4" />}
            href="/admin/google-places/sync"
          />
          <StatsCard
            title="Raw Places"
            value={stats?.total_raw_places || 0}
            description="In database"
            icon={<Database className="h-4 w-4" />}
            href="/admin/google-places/sync"
          />
          <StatsCard
            title="Imported Campsites"
            value={stats?.total_imported || 0}
            description="From Google Places"
            icon={<Settings className="h-4 w-4" />}
            href="/admin/google-places/candidates?status=imported"
          />
        </div>

        {/* Main Actions */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Manual Sync</CardTitle>
              <CardDescription>
                Trigger a manual sync with Google Places API
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => window.location.href = '/admin/google-places/sync'}
                className="w-full"
              >
                <Play className="h-4 w-4 mr-2" />
                Start Sync
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI Processing</CardTitle>
              <CardDescription>
                Process raw places with AI for deduplication and classification
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => handleAIProcess()}
                className="w-full"
                variant="outline"
              >
                <Settings className="h-4 w-4 mr-2" />
                Process with AI
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sync Configuration</CardTitle>
              <CardDescription>
                Configure sync schedule and limits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full"
                disabled
              >
                <Settings className="h-4 w-4 mr-2" />
                Configure (Coming Soon)
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Links */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Quick Links</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Link href="/admin/google-places/sync">
              <Card className="hover:bg-accent/5 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <RefreshCw className="h-5 w-5 mr-3" />
                      <div>
                        <h3 className="font-semibold">Sync Management</h3>
                        <p className="text-sm text-muted-foreground">
                          View sync history, trigger manual syncs
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/google-places/candidates">
              <Card className="hover:bg-accent/5 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Users className="h-5 w-5 mr-3" />
                      <div>
                        <h3 className="font-semibold">Import Candidates</h3>
                        <p className="text-sm text-muted-foreground">
                          Review and approve campsite imports
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
    </div>
  );
}

interface StatsCardProps {
  title: string;
  value: number | string;
  description: string;
  icon: React.ReactNode;
  href: string;
}

function StatsCard({ title, value, description, icon, href }: StatsCardProps) {
  return (
    <Link href={href}>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="p-2 bg-primary/10 rounded-lg">{icon}</div>
              <h3 className="font-semibold ml-3">{title}</h3>
            </div>
            <Badge variant={typeof value === 'number' ? (value > 0 ? 'destructive' : 'secondary') : 'default'}>
              {value}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-2">{description}</p>
          <div className="text-sm text-muted-foreground">
            {href.includes('sync') && (
              <span className="flex items-center text-sm">
                <RefreshCw className="h-3 w-3 mr-1" />
                View details
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

async function handleAIProcess() {
  try {
    const token = getAccessToken();
    const response = await fetch(`${API_BASE_URL}/api/admin/google-places/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
      body: JSON.stringify({ processAll: true }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        alert(`Started AI processing for ${data.placesToProcess} places`);
      } else {
        alert('Failed to start AI processing');
      }
    } else {
      alert('Failed to start AI processing');
    }
  } catch (error) {
    console.error('Failed to start AI processing:', error);
    alert('Failed to start AI processing');
  }
}
