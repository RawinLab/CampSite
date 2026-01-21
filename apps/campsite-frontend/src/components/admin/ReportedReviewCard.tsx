'use client';

import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RejectDialog } from './RejectDialog';
import { StarRating } from '@/components/ui/StarRating';
import {
  User,
  Tent,
  Calendar,
  Flag,
  Eye,
  EyeOff,
  Trash2,
  XCircle,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
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
  campsite_slug: string | null;
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

interface ReportedReviewCardProps {
  review: ReportedReview;
  onHide: (id: string, reason: string) => Promise<void>;
  onDismiss: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isLoading?: boolean;
}

const reportReasonLabels: Record<ReportReason, string> = {
  spam: 'Spam',
  inappropriate: 'Inappropriate',
  fake: 'Fake Review',
  other: 'Other',
};

const reportReasonColors: Record<ReportReason, string> = {
  spam: 'bg-yellow-100 text-yellow-800',
  inappropriate: 'bg-red-100 text-red-800',
  fake: 'bg-orange-100 text-orange-800',
  other: 'bg-gray-100 text-gray-800',
};

export function ReportedReviewCard({
  review,
  onHide,
  onDismiss,
  onDelete,
  isLoading = false,
}: ReportedReviewCardProps) {
  const [hideDialogOpen, setHideDialogOpen] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleHide = async (reason: string) => {
    setActionLoading('hide');
    try {
      await onHide(review.id, reason);
      setHideDialogOpen(false);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDismiss = async () => {
    if (!confirm('Are you sure you want to dismiss all reports? The review will remain visible.')) {
      return;
    }
    setActionLoading('dismiss');
    try {
      await onDismiss(review.id);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to permanently delete this review? This cannot be undone.')) {
      return;
    }
    setActionLoading('delete');
    try {
      await onDelete(review.id);
    } finally {
      setActionLoading(null);
    }
  };

  const reviewDate = new Date(review.created_at);
  const timeAgo = formatDistanceToNow(reviewDate, { addSuffix: true });

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                {review.reviewer_avatar ? (
                  <img
                    src={review.reviewer_avatar}
                    alt={review.reviewer_name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <User className="h-5 w-5 text-gray-600" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {review.reviewer_name}
                </h3>
                <div className="flex items-center gap-2">
                  <StarRating rating={review.rating_overall} size="sm" />
                  <span className="text-sm text-gray-500">{timeAgo}</span>
                </div>
              </div>
            </div>
            <Badge variant="destructive" className="flex items-center gap-1">
              <Flag className="h-3 w-3" />
              {review.report_count} report{review.report_count !== 1 ? 's' : ''}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Campsite Info */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Tent className="h-4 w-4" />
            <span>Review for: </span>
            {review.campsite_slug ? (
              <Link
                href={`/campsites/${review.campsite_slug}`}
                target="_blank"
                className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
              >
                {review.campsite_name}
                <ExternalLink className="h-3 w-3" />
              </Link>
            ) : (
              <span className="font-medium text-gray-900">{review.campsite_name}</span>
            )}
          </div>

          {/* Review Content */}
          <div className="space-y-2">
            {review.title && (
              <h4 className="font-medium text-gray-900">{review.title}</h4>
            )}
            <p className="text-sm text-gray-700 line-clamp-4">{review.content}</p>
          </div>

          {/* Reports Summary */}
          <div className="rounded-lg bg-red-50 p-3">
            <button
              className="flex w-full items-center justify-between text-left"
              onClick={() => setShowReports(!showReports)}
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-800">
                  {review.report_count} Report{review.report_count !== 1 ? 's' : ''}
                </span>
              </div>
              <span className="text-xs text-red-600">
                {showReports ? 'Hide' : 'Show'} details
              </span>
            </button>

            {showReports && (
              <div className="mt-3 space-y-2 border-t border-red-200 pt-3">
                {review.reports.map((report) => (
                  <div
                    key={report.id}
                    className="rounded bg-white p-2 text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">
                        {report.reporter_name}
                      </span>
                      <Badge
                        variant="outline"
                        className={reportReasonColors[report.reason]}
                      >
                        {reportReasonLabels[report.reason]}
                      </Badge>
                    </div>
                    {report.details && (
                      <p className="mt-1 text-gray-600">{report.details}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-400">
                      {formatDistanceToNow(new Date(report.created_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex-wrap gap-2 border-t bg-gray-50 pt-4">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={handleDismiss}
            disabled={isLoading || actionLoading !== null}
          >
            <XCircle className="mr-2 h-4 w-4" />
            {actionLoading === 'dismiss' ? 'Dismissing...' : 'Dismiss'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 border-yellow-200 text-yellow-700 hover:bg-yellow-50"
            onClick={() => setHideDialogOpen(true)}
            disabled={isLoading || actionLoading !== null}
          >
            <EyeOff className="mr-2 h-4 w-4" />
            Hide
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
            onClick={handleDelete}
            disabled={isLoading || actionLoading !== null}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {actionLoading === 'delete' ? 'Deleting...' : 'Delete'}
          </Button>
        </CardFooter>
      </Card>

      <RejectDialog
        open={hideDialogOpen}
        onOpenChange={setHideDialogOpen}
        title="Hide Review"
        description="The review will be hidden from public view. Please provide a reason."
        itemName={`Review by ${review.reviewer_name}`}
        onConfirm={handleHide}
        isLoading={actionLoading === 'hide'}
        minReasonLength={5}
      />
    </>
  );
}
