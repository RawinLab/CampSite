'use client';

import { useEffect, useState, useCallback } from 'react';
import { ReportedReviewCard } from '@/components/admin/ReportedReviewCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MessageSquareWarning, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import type { ReportReason } from '@campsite/shared';

interface ReviewReport {
  id: string;
  user_id: string;
  reporter_name: string;
  reason: ReportReason;
  details: string | null;
  created_at: string;
}

interface ReportedReview {
  id: string;
  campsite_id: string;
  campsite_name: string;
  user_id: string;
  rating_overall: number;
  reviewer_type: string;
  title: string | null;
  content: string;
  report_count: number;
  created_at: string;
  reviewer_name: string;
  reviewer_avatar: string | null;
  reports: ReviewReport[];
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function ReportedReviewsPage() {
  const [reviews, setReviews] = useState<ReportedReview[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchReviews = useCallback(async (page: number) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/reviews/reported?page=${page}&limit=10`,
        { credentials: 'include' }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch reported reviews');
      }

      const data = await response.json();
      if (data.success) {
        setReviews(data.data);
        setPagination(data.pagination);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews(currentPage);
  }, [fetchReviews, currentPage]);

  const handleHide = async (id: string, reason: string) => {
    try {
      const response = await fetch(`/api/admin/reviews/${id}/hide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hide_reason: reason }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to hide review');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to hide');
      }

      // Remove from list
      setReviews((prev) => prev.filter((r) => r.id !== id));
      if (pagination) {
        setPagination({ ...pagination, total: pagination.total - 1 });
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to hide review');
    }
  };

  const handleDismiss = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/reviews/${id}/dismiss`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to dismiss reports');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to dismiss');
      }

      // Remove from list (reports dismissed, review no longer reported)
      setReviews((prev) => prev.filter((r) => r.id !== id));
      if (pagination) {
        setPagination({ ...pagination, total: pagination.total - 1 });
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to dismiss reports');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/reviews/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete review');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to delete');
      }

      // Remove from list
      setReviews((prev) => prev.filter((r) => r.id !== id));
      if (pagination) {
        setPagination({ ...pagination, total: pagination.total - 1 });
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete review');
    }
  };

  const handleRefresh = () => {
    fetchReviews(currentPage);
  };

  if (loading && reviews.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="mt-2 h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div>
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="mt-1 h-4 w-24" />
                  </div>
                </div>
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-16 w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-9 flex-1" />
                  <Skeleton className="h-9 flex-1" />
                  <Skeleton className="h-9 flex-1" />
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
          <h1 className="text-3xl font-bold text-gray-900">Reported Reviews</h1>
          <p className="mt-1 text-gray-600">Moderate reported reviews</p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-800">Error: {error}</p>
          <Button
            variant="outline"
            className="mt-2"
            onClick={() => fetchReviews(1)}
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
          <h1 className="text-3xl font-bold text-gray-900">Reported Reviews</h1>
          <p className="mt-1 text-gray-600">
            {pagination?.total || 0} review{(pagination?.total || 0) !== 1 ? 's' : ''} need{(pagination?.total || 0) === 1 ? 's' : ''} moderation
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Content */}
      {reviews.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-green-100 p-4">
              <MessageSquareWarning className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              All caught up!
            </h3>
            <p className="mt-1 text-center text-gray-500">
              No reported reviews to moderate.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {reviews.map((review) => (
              <ReportedReviewCard
                key={review.id}
                review={review}
                onHide={handleHide}
                onDismiss={handleDismiss}
                onDelete={handleDelete}
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
