'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { StarRating } from '@/components/ui/StarRating';
import type { ReviewSummary as ReviewSummaryType } from '@campsite/shared';

interface ReviewSummaryProps {
  summary: ReviewSummaryType;
  className?: string;
}

export function ReviewSummary({ summary, className }: ReviewSummaryProps) {
  const { average_rating, total_count, rating_distribution, rating_percentages } = summary;

  return (
    <div className={cn('flex flex-col md:flex-row gap-6 md:gap-10', className)}>
      {/* Overall Rating */}
      <div className="flex flex-col items-center md:items-start">
        <div className="text-5xl font-bold text-gray-900">
          {average_rating.toFixed(1)}
        </div>
        <StarRating rating={average_rating} size="lg" className="mt-2" />
        <div className="mt-1 text-sm text-gray-500">
          {total_count} {total_count === 1 ? 'review' : 'reviews'}
        </div>
      </div>

      {/* Rating Distribution */}
      <div className="flex-1 space-y-2">
        {[5, 4, 3, 2, 1].map((stars) => {
          const count = rating_distribution[stars as keyof typeof rating_distribution];
          const percentage = rating_percentages[stars as keyof typeof rating_percentages];

          return (
            <div key={stars} className="flex items-center gap-2">
              <span className="w-3 text-sm text-gray-600">{stars}</span>
              <StarIcon className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-400 rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="w-8 text-xs text-gray-500 text-right">
                {count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className={className}
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

export default ReviewSummary;
