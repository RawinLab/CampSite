'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DataTable } from '@/components/admin/data-table';
import { Calendar, Clock, MapPin, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import type { SyncLog } from '@campsite/shared';

interface Column {
  key: string;
  header: string;
  cell: (row: SyncLog) => React.ReactNode;
}

export default function SyncManagementPage() {
  const { user, role, loading: authLoading } = useAuth();
  const router = useRouter();
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'running' | 'error'>('idle');
  const [currentSync, setCurrentSync] = useState<SyncLog | null>(null);

  // Check admin access
  useEffect(() => {
    if (!authLoading && (!user || role !== 'admin')) {
      router.push('/auth/login?redirect=/admin/google-places/sync');
    }
  }, [user, role, authLoading, router]);

  // Fetch sync logs and current sync status
  useEffect(() => {
    if (!user || role !== 'admin') return;

    function fetchSyncLogs() {
      fetch(`/api/admin/google-places/sync/logs?limit=10`, {
        headers: {
          'content-type': 'application/json',
        },
        credentials: 'include',
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setLogs(data.data);
          }
        })
        .catch((error) => {
          console.error('Failed to fetch sync logs:', error);
        })
        .finally(() => {
          setLoading(false);
        });
    }

    function fetchCurrentSyncStatus() {
      fetch('/api/admin/google-places/sync/status', {
        credentials: 'include',
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            setCurrentSync(data.data);
            setSyncStatus('running');
          } else {
            setCurrentSync(null);
            setSyncStatus('idle');
          }
        })
        .catch((error) => {
          console.error('Failed to fetch sync status:', error);
          setSyncStatus('idle');
        });
    }

    fetchSyncLogs();
    fetchCurrentSyncStatus();

    // Poll for sync status updates when running
    const interval = setInterval(() => {
      if (syncStatus === 'running') {
        fetchCurrentSyncStatus();
      } else {
        clearInterval(interval);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [user, role, syncStatus]);

  async function handleTriggerSync() {
    if (!confirm('Start a new Google Places sync? This may take 15-30 minutes.')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/google-places/sync/trigger', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          syncType: 'incremental',
          maxPlaces: 100, // Start with small sync
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Sync started! Sync Log ID: ' + data.syncLogId);
        // Refresh the page after a short delay
        setTimeout(() => {
          router.push(router.pathname); // Reload page
        }, 2000);
      } else {
        alert('Failed to start sync: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to trigger sync:', error);
      alert('Failed to start sync');
    }
  }

  async function handleCancelSync() {
    if (!currentSync || !currentSync.id) {
      alert('No sync is currently running');
      return;
    }

    if (!confirm('Cancel the current sync?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/google-places/sync/cancel`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          syncLogId: currentSync.id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Sync cancelled');
        setCurrentSync(null);
        setSyncStatus('idle');
        // Refresh the page
        setTimeout(() => {
          router.push(router.pathname);
        }, 1000);
      } else {
        alert('Failed to cancel sync: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to cancel sync:', error);
      alert('Failed to cancel sync');
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      case 'processing':
        return <Badge className="bg-blue-500"><Clock className="h-3 w-3 mr-1 animate-pulse" />Processing</Badge>;
      default:
        return <Badge variant="outline"><AlertCircle className="h-3 w-3 mr-1" />Unknown</Badge>;
    }
  }

  function formatDuration(seconds?: number): string {
    if (!seconds) return '-';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0) parts.push(`${secs}s`);
    return parts.length > 0 ? parts.join(' ') : '-';
  }

  function formatCost(cost?: number): string {
    if (!cost) return '-';
    return `$${cost.toFixed(2)}`;
  }

  const columns: Column[] = [
    {
      key: 'started_at',
      header: 'Started',
      cell: (row) => (
        <div className="flex items-center">
          <Calendar className="h-4 w-4 mr-2" />
          {new Date(row.started_at).toLocaleString()}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => getStatusBadge(row.status),
    },
    {
      key: 'duration',
      header: 'Duration',
      cell: (row) => formatDuration(row.duration_seconds),
    },
    {
      key: 'places_found',
      header: 'Places Found',
      cell: (row) => row.places_found.toLocaleString(),
    },
    {
      key: 'places_updated',
      header: 'Updated',
      cell: (row) => row.places_updated.toLocaleString(),
    },
    {
      key: 'api_requests',
      header: 'API Requests',
      cell: (row) => row.api_requests_made.toLocaleString(),
    },
    {
      key: 'estimated_cost',
      header: 'Cost',
      cell: (row) => formatCost(row.estimated_cost_usd),
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: (row) => (
        <div className="flex gap-2">
          {row.status === 'processing' && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleCancelSync()}
            >
              Cancel
            </Button>
          )}
          {row.error_message && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => alert(`Error: ${row.error_message}\n\nDetails: ${JSON.stringify(row.error_details, null, 2)}`)}
            >
              View Error
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (loading || authLoading) {
    return (
      <div className="p-8">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Sync Management</h1>
        <p className="text-muted-foreground">
          View sync history, trigger manual syncs, and manage sync operations
        </p>
      </div>

      {/* Current Sync Status */}
      {syncStatus === 'running' && currentSync && (
        <Card className="mb-6 border-blue-500 bg-blue-50 dark:bg-blue-950">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg">Sync In Progress</h3>
                <p className="text-sm text-muted-foreground">
                  Started: {new Date(currentSync.started_at).toLocaleString()}
                </p>
              </div>
              <Badge className="bg-blue-500"><Clock className="h-3 w-3 mr-1" animate-pulse />Running</Badge>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-4">
              <div>
                <div className="text-sm text-muted-foreground">Places Found</div>
                <div className="text-2xl font-bold">{currentSync.places_found || 0}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Places Updated</div>
                <div className="text-2xl font-bold">{currentSync.places_updated || 0}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Photos</div>
                <div className="text-2xl font-bold">{currentSync.photos_downloaded || 0}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Cost</div>
                <div className="text-2xl font-bold">${currentSync.estimated_cost_usd?.toFixed(2) || '0.00'}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trigger Manual Sync */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Manual Sync</CardTitle>
          <CardDescription>
            Trigger a manual sync with Google Places API
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Sync type: <strong>Incremental</strong> (only new/updated places)
              </p>
              <p className="text-sm text-muted-foreground">
                Max places: <strong>100</strong> (test run)
              </p>
            </div>
            <Button onClick={handleTriggerSync} disabled={syncStatus === 'running'}>
              <Play className="h-4 w-4 mr-2" />
              {syncStatus === 'running' ? 'Sync Running...' : 'Start Sync'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sync Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sync History</CardTitle>
          <CardDescription>
            Recent Google Places API sync operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={logs}
            keyField="id"
            emptyMessage="No sync history yet"
          />
        </CardContent>
      </Card>
    </div>
  );
}
