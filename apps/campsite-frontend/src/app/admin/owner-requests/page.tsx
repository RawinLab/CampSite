'use client';

import { useEffect, useState, useCallback } from 'react';
import { OwnerRequestCard } from '@/components/admin/OwnerRequestCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Users, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

interface OwnerRequest {
  id: string;
  user_id: string;
  business_name: string;
  business_description: string;
  contact_phone: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  rejection_reason?: string;
  user_full_name: string;
  user_avatar_url: string | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function OwnerRequestsPage() {
  const [requests, setRequests] = useState<OwnerRequest[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchRequests = useCallback(async (page: number) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/owner-requests?page=${page}&limit=10&status=pending`,
        { credentials: 'include' }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch owner requests');
      }

      const data = await response.json();
      if (data.success) {
        setRequests(data.data);
        setPagination(data.pagination);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests(currentPage);
  }, [fetchRequests, currentPage]);

  const handleApprove = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/owner-requests/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to approve request');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to approve');
      }

      // Remove from list
      setRequests((prev) => prev.filter((r) => r.id !== id));
      if (pagination) {
        setPagination({ ...pagination, total: pagination.total - 1 });
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to approve request');
    }
  };

  const handleReject = async (id: string, reason: string) => {
    try {
      const response = await fetch(`/api/admin/owner-requests/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejection_reason: reason }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to reject request');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to reject');
      }

      // Remove from list
      setRequests((prev) => prev.filter((r) => r.id !== id));
      if (pagination) {
        setPagination({ ...pagination, total: pagination.total - 1 });
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to reject request');
    }
  };

  const handleRefresh = () => {
    fetchRequests(currentPage);
  };

  if (loading && requests.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="mt-2 h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div>
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="mt-1 h-4 w-24" />
                  </div>
                </div>
                <Skeleton className="h-20 w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-10 flex-1" />
                  <Skeleton className="h-10 flex-1" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Owner Requests</h1>
          <p className="mt-1 text-gray-600">Review owner registration requests</p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-800">Error: {error}</p>
          <Button
            variant="outline"
            className="mt-2"
            onClick={() => fetchRequests(1)}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Owner Requests</h1>
          <p className="mt-1 text-gray-600">
            {pagination?.total || 0} request{(pagination?.total || 0) !== 1 ? 's' : ''} pending review
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Content */}
      {requests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-green-100 p-4">
              <Users className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              All caught up!
            </h3>
            <p className="mt-1 text-center text-gray-500">
              No pending owner requests to review.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {requests.map((request) => (
              <OwnerRequestCard
                key={request.id}
                request={request}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1 || loading}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))
                }
                disabled={currentPage === pagination.totalPages || loading}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
