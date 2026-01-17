'use client';

import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { StarRating } from '@/components/ui/StarRating';
import { ReviewPhotos } from './ReviewPhotos';
import { HelpfulButton } from './HelpfulButton';
import type { ReviewWithUser, ReviewerType } from '@campsite/shared';

interface ReviewCardProps {
  review: ReviewWithUser;
  isAuthenticated?: boolean;
  currentUserId?: string;
  onHelpfulVote?: (reviewId: string) => Promise<void>;
  onReport?: (reviewId: string) => void;
  className?: string;
}

const reviewerTypeLabels: Record<ReviewerType, string> = {
  family: 'Family',
  couple: 'Couple',
  solo: 'Solo Traveler',
  group: 'Group',
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function ReviewCard({
  review,
  isAuthenticated = false,
  currentUserId,
  onHelpfulVote,
  onReport,
  className,
}: ReviewCardProps) {
  const isOwnReview = currentUserId === review.user_id;

  return (
    <div className={cn('border-b border-gray-200 pb-6', className)}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
            {review.reviewer_avatar ? (
              <Image
                src={review.reviewer_avatar}
                alt={review.reviewer_name}
                fill
                sizes="40px"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500 text-lg font-medium">
                {review.reviewer_name?.charAt(0)?.toUpperCase() || 'A'}
              </div>
            )}
          </div>

          {/* Reviewer info */}
          <div>
            <div className="font-medium text-gray-900">{review.reviewer_name}</div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>{reviewerTypeLabels[review.reviewer_type]}</span>
              <span>-</span>
              <span>{formatDate(review.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Rating */}
        <StarRating rating={review.rating_overall} size="sm" />
      </div>

      {/* Title */}
      {review.title && (
        <h4 className="mt-3 font-medium text-gray-900">{review.title}</h4>
      )}

      {/* Content */}
      <p className="mt-2 text-gray-700 whitespace-pre-wrap">{review.content}</p>

      {/* Pros & Cons */}
      {(review.pros || review.cons) && (
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {review.pros && (
            <div className="flex gap-2">
              <span className="text-green-600 flex-shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <div className="text-sm text-gray-600">{review.pros}</div>
            </div>
          )}
          {review.cons && (
            <div className="flex gap-2">
              <span className="text-red-500 flex-shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </span>
              <div className="text-sm text-gray-600">{review.cons}</div>
            </div>
          )}
        </div>
      )}

      {/* Photos */}
      {review.photos && review.photos.length > 0 && (
        <ReviewPhotos photos={review.photos} className="mt-3" />
      )}

      {/* Owner Response */}
      {review.owner_response && (
        <div className="mt-4 bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
            <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            Response from owner
          </div>
          <p className="mt-2 text-sm text-gray-700">{review.owner_response}</p>
          {review.owner_response_at && (
            <div className="mt-2 text-xs text-gray-500">
              {formatDate(review.owner_response_at)}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex items-center gap-3">
        <HelpfulButton
          reviewId={review.id}
          helpfulCount={review.helpful_count}
          userVoted={review.user_helpful_vote}
          isAuthenticated={isAuthenticated}
          onVote={onHelpfulVote}
        />

        {/* Report button - hidden for own reviews */}
        {!isOwnReview && isAuthenticated && onReport && (
          <button
            onClick={() => onReport(review.id)}
            className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
          >
            Report
          </button>
        )}
      </div>
    </div>
  );
}

export default ReviewCard;
