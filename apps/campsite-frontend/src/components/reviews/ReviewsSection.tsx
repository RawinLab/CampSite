'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ReviewSummary } from './ReviewSummary';
import { RatingBreakdown } from './RatingBreakdown';
import { ReviewFilters } from './ReviewFilters';
import { ReviewList } from './ReviewList';
import { WriteReviewForm } from './WriteReviewForm';
import { ReportReviewDialog } from './ReportReviewDialog';
import type {
  ReviewSummary as ReviewSummaryType,
  ReviewWithUser,
  ReviewSortBy,
  ReviewerType,
  ReportReason,
  CreateReviewInput,
} from '@campsite/shared';

interface ReviewsSectionProps {
  campsiteId: string;
  summary: ReviewSummaryType;
  initialReviews: ReviewWithUser[];
  totalReviews: number;
  isAuthenticated?: boolean;
  currentUserId?: string;
  hasReviewed?: boolean;
  className?: string;
}

export function ReviewsSection({
  campsiteId,
  summary,
  initialReviews,
  totalReviews,
  isAuthenticated = false,
  currentUserId,
  hasReviewed = false,
  className,
}: ReviewsSectionProps) {
  // State
  const [reviews, setReviews] = React.useState(initialReviews);
  const [total, setTotal] = React.useState(totalReviews);
  const [page, setPage] = React.useState(1);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);

  // Filters
  const [sortBy, setSortBy] = React.useState<ReviewSortBy>('newest');
  const [reviewerType, setReviewerType] = React.useState<ReviewerType | undefined>();

  // Write review form
  const [showWriteForm, setShowWriteForm] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Report dialog
  const [reportingReviewId, setReportingReviewId] = React.useState<string | null>(null);

  const limit = 5;
  const hasMore = reviews.length < total;

  // Fetch reviews
  const fetchReviews = React.useCallback(
    async (reset = false) => {
      const newPage = reset ? 1 : page;
      setIsLoading(reset);
      setIsLoadingMore(!reset);

      try {
        const params = new URLSearchParams({
          page: newPage.toString(),
          limit: limit.toString(),
          sort_by: sortBy,
          ...(reviewerType && { reviewer_type: reviewerType }),
        });

        const response = await fetch(`/api/reviews/campsite/${campsiteId}?${params}`);
        const data = await response.json();

        if (data.success) {
          if (reset) {
            setReviews(data.data);
          } else {
            setReviews((prev) => [...prev, ...data.data]);
          }
          setTotal(data.pagination.total);
          setPage(newPage + 1);
        }
      } catch (error) {
        console.error('Failed to fetch reviews:', error);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [campsiteId, page, sortBy, reviewerType, limit]
  );

  // Handle filter changes
  const handleSortChange = (newSort: ReviewSortBy) => {
    setSortBy(newSort);
    setPage(1);
  };

  const handleReviewerTypeChange = (newType?: ReviewerType) => {
    setReviewerType(newType);
    setPage(1);
  };

  // Refetch when filters change
  React.useEffect(() => {
    fetchReviews(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, reviewerType]);

  // Handle helpful vote
  const handleHelpfulVote = async (reviewId: string) => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}/helpful`, {
        method: 'POST',
      });
      const data = await response.json();

      if (data.success) {
        setReviews((prev) =>
          prev.map((review) =>
            review.id === reviewId
              ? {
                  ...review,
                  helpful_count: data.data.helpful_count,
                  user_helpful_vote: data.data.user_voted,
                }
              : review
          )
        );
      }
    } catch (error) {
      console.error('Failed to toggle helpful vote:', error);
      throw error;
    }
  };

  // Handle submit review
  const handleSubmitReview = async (data: CreateReviewInput) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();

      if (result.success) {
        // Add the new review to the top of the list
        setReviews((prev) => [result.data, ...prev]);
        setTotal((prev) => prev + 1);
        setShowWriteForm(false);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to submit review:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle report review
  const handleReportReview = async (reason: ReportReason, details?: string) => {
    if (!reportingReviewId) return;

    try {
      const response = await fetch(`/api/reviews/${reportingReviewId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, details }),
      });
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to report review:', error);
      throw error;
    }
  };

  return (
    <section className={cn('space-y-6', className)}>
      {/* Header with write review button */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-brand-text">
          รีวิว ({total})
        </h2>
        {isAuthenticated && !hasReviewed && !showWriteForm && (
          <Button className="bg-brand-green hover:bg-forest-700 rounded-xl transition-all duration-300" onClick={() => setShowWriteForm(true)}>
            เขียนรีวิว
          </Button>
        )}
      </div>

      {/* Write Review Form */}
      {showWriteForm && (
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-brand-text">เขียนรีวิวของคุณ</CardTitle>
          </CardHeader>
          <CardContent>
            <WriteReviewForm
              campsiteId={campsiteId}
              onSubmit={handleSubmitReview}
              onCancel={() => setShowWriteForm(false)}
              isSubmitting={isSubmitting}
            />
          </CardContent>
        </Card>
      )}

      {/* Summary and Breakdown */}
      {total > 0 && (
        <Card className="rounded-2xl">
          <CardContent className="pt-6">
            <ReviewSummary summary={summary} />
            <div className="mt-6 pt-6 border-t">
              <RatingBreakdown categoryAverages={summary.category_averages} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      {total > 0 && (
        <ReviewFilters
          sortBy={sortBy}
          reviewerType={reviewerType}
          onSortChange={handleSortChange}
          onReviewerTypeChange={handleReviewerTypeChange}
        />
      )}

      {/* Review List */}
      <ReviewList
        reviews={reviews}
        isLoading={isLoading}
        hasMore={hasMore}
        onLoadMore={() => fetchReviews(false)}
        isLoadingMore={isLoadingMore}
        isAuthenticated={isAuthenticated}
        currentUserId={currentUserId}
        onHelpfulVote={handleHelpfulVote}
        onReport={(reviewId) => setReportingReviewId(reviewId)}
      />

      {/* Report Dialog */}
      <ReportReviewDialog
        isOpen={!!reportingReviewId}
        onClose={() => setReportingReviewId(null)}
        onSubmit={handleReportReview}
      />
    </section>
  );
}

export default ReviewsSection;
