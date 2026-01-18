'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DataTable } from '@/components/admin/data-table';
import {
  Check,
  X,
  Eye,
  MapPin,
  Star,
  Users,
  Clock,
  AlertCircle,
  ChevronRight,
  Play,
} from 'lucide-react';
import type { ImportCandidate, DuplicateComparison, ConfidenceBreakdown } from '@campsite/shared';

interface Column {
  key: string;
  header: string;
  cell: (row: ImportCandidate) => React.ReactNode;
}

interface CandidateDetail {
  id: string;
  googlePlaceRaw: {
    id: string;
    place_id: string;
    raw_data: any;
  };
  processedData: any;
  duplicateComparison: DuplicateComparison;
  confidenceBreakdown: ConfidenceBreakdown;
}

export default function CandidatesPage() {
  const { user, role, loading: authLoading } = useAuth();
  const router = useRouter();
  const [candidates, setCandidates] = useState<ImportCandidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Check admin access
  useEffect(() => {
    if (!authLoading && (!user || role !== 'admin')) {
      router.push('/auth/login?redirect=/admin/google-places/candidates');
    }
  }, [user, role, authLoading, router]);

  // Fetch candidates function
  async function fetchCandidates() {
    if (!user || role !== 'admin') return;

    setLoading(true);
    const queryParams = new URLSearchParams({
      limit: '50',
      offset: '0',
    });

    try {
      const res = await fetch(`/api/admin/google-places/candidates?${queryParams}`, {
        headers: {
          'content-type': 'application/json',
        },
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        setCandidates(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch candidates:', error);
    } finally {
      setLoading(false);
    }
  }

  // Fetch candidates on mount
  useEffect(() => {
    if (user && role === 'admin') {
      fetchCandidates();
    }
  }, [user, role]);

  function handleViewCandidate(candidate: ImportCandidate) {
    router.push(`/admin/google-places/candidates/${candidate.id}`);
  }

  async function handleApprove(candidateId: string) {
    if (!confirm('Approve and import this campsite?')) {
      return;
    }

    setActionLoading(true);

    try {
      const response = await fetch(`/api/admin/google-places/candidates/${candidateId}/approve`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (data.success) {
        alert('Campsite imported successfully! Campsite ID: ' + data.campsiteId);
        // Refresh the candidate list
        fetchCandidates();
      } else {
        alert('Failed to approve candidate: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to approve candidate:', error);
      alert('Failed to approve candidate');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject(candidateId: string) {
    const reason = prompt('Rejection reason:');
    if (!reason) return;

    setActionLoading(true);

    try {
      const response = await fetch(`/api/admin/google-places/candidates/${candidateId}/reject`, {
        method: 'POST',
        headers: {
          'content-type': 'import',
        },
        credentials: 'include',
        body: JSON.stringify({
          reason,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Candidate rejected');
        // Refresh the candidate list
        fetchCandidates();
      } else {
        alert('Failed to reject candidate: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to reject candidate:', error);
      alert('Failed to reject candidate');
    } finally {
      setActionLoading(false);
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'approved':
        return <Badge className="bg-green-500">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'imported':
        return <Badge className="bg-blue-500">Imported</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }

  function getConfidenceColor(score: number): string {
    if (score >= 0.9) return 'text-green-600 dark:text-green-400';
    if (score >= 0.7) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  }

  function getConfidenceBackground(score: number): string {
    if (score >= 0.9) return 'bg-green-100 dark:bg-green-900';
    if (score >= 0.7) return 'bg-yellow-100 dark:bg-yellow-900';
    return 'bg-red-100 dark:bg-red-900';
  }

  const columns: Column[] = [
    {
      key: 'name',
      header: 'Campsite',
      cell: (row) => (
        <div>
          <div className="font-medium">{row.name}</div>
          <div className="text-sm text-muted-foreground">{row.address}</div>
        </div>
      ),
    },
    {
      key: 'confidence_score',
      header: 'Confidence',
      cell: (row) => (
        <div>
          <div className={`font-semibold ${getConfidenceColor(row.confidence_score)} ${getConfidenceBackground(row.confidence_score)} px-2 py-1 rounded`}>
            {(row.confidence_score * 100).toFixed(0)}%
          </div>
        </div>
      ),
    },
    {
      key: 'is_duplicate',
      header: 'Duplicate',
      cell: (row) => (
        <div>
          {row.is_duplicate ? (
            <Badge variant="destructive">Duplicate</Badge>
          ) : (
            <Badge variant="outline" className="border-green-500">Unique</Badge>
          )}
        </div>
      ),
    },
    {
      key: 'rating',
      header: 'Rating',
      cell: (row) => (
        <div className="flex items-center">
          {row.rating ? (
            <>
              <Star className="h-4 w-4 mr-1 fill-yellow-400" />
              {row.rating.toFixed(1)}
              <span className="text-sm text-muted-foreground ml-1">({row.rating_count || 0} reviews)</span>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">No rating</span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => getStatusBadge(row.status),
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: (row) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewCandidate(row)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          {row.status === 'pending' && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleApprove(row.id)}
                disabled={actionLoading}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleReject(row.id)}
                disabled={actionLoading}
              >
                <X className="h-4 w-4" />
              </Button>
            </>
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
        <h1 className="text-3xl font-bold mb-2">Import Candidates</h1>
        <p className="text-muted-foreground">
          Review and approve campsites discovered by Google Places API
        </p>
      </div>

      {/* Stats Summary */}
      {candidates.length > 0 && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="text-sm text-muted-foreground mb-2">Total Candidates</div>
              <div className="text-2xl font-bold">{candidates.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-sm text-muted-foreground mb-2">Pending</div>
              <div className="text-2xl font-bold">
                {candidates.filter(c => c.status === 'pending').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-sm text-green-600 mb-2">High Confidence</div>
              <div className="text-2xl font-bold">
                {candidates.filter(c => c.confidence_score >= 0.9).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-red-600 mb-2">Duplicates</div>
              <div className="text-2xl font-bold">
                {candidates.filter(c => c.is_duplicate).length}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            <Badge
              variant="outline"
              className="cursor-pointer"
              onClick={() => router.push('/admin/google-places/candidates')}
            >
              All
            </Badge>
            <Badge
              variant="outline"
              className="cursor-pointer"
              onClick={() => router.push('/admin/google-places/candidates?status=pending')}
            >
              Pending
            </Badge>
            <Badge
              variant="outline"
              className="cursor-pointer"
              onClick={() => router.push('/admin/google-places/candidates?status=imported')}
            >
              Imported
            </Badge>
            <Badge
              variant="outline"
              className="cursor-pointer"
              onClick={() => router.push('/admin/google-places/candidates?isDuplicate=true')}
            >
              Duplicates Only
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Candidates Table */}
      {candidates.length > 0 ? (
        <Card>
          <CardContent className="p-6">
            <DataTable
              columns={columns}
              data={candidates}
              keyField="id"
              emptyMessage="No candidates found. Trigger a sync first."
              rowClassName="cursor-pointer hover:bg-accent/5"
              onRowClick={(row) => handleViewCandidate(row)}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No candidates found</h3>
              <p className="text-muted-foreground mb-6">
                Trigger a Google Places sync to discover camping sites in Thailand
              </p>
              <Button onClick={() => router.push('/admin/google-places/sync')}>
                <Play className="h-4 w-4 mr-2" />
                Start Sync
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
