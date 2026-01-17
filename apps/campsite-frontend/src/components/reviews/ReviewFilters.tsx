'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { ReviewSortBy, ReviewerType } from '@campsite/shared';

interface ReviewFiltersProps {
  sortBy: ReviewSortBy;
  reviewerType?: ReviewerType;
  onSortChange: (sort: ReviewSortBy) => void;
  onReviewerTypeChange: (type?: ReviewerType) => void;
  className?: string;
}

const sortOptions: { value: ReviewSortBy; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'helpful', label: 'Most Helpful' },
  { value: 'rating_high', label: 'Highest Rating' },
  { value: 'rating_low', label: 'Lowest Rating' },
];

const reviewerTypeOptions: { value: ReviewerType | ''; label: string }[] = [
  { value: '', label: 'All Types' },
  { value: 'family', label: 'Family' },
  { value: 'couple', label: 'Couple' },
  { value: 'solo', label: 'Solo' },
  { value: 'group', label: 'Group' },
];

export function ReviewFilters({
  sortBy,
  reviewerType,
  onSortChange,
  onReviewerTypeChange,
  className,
}: ReviewFiltersProps) {
  return (
    <div className={cn('flex flex-col sm:flex-row gap-3', className)}>
      {/* Sort dropdown */}
      <div className="flex items-center gap-2">
        <label htmlFor="sort-by" className="text-sm text-gray-600 whitespace-nowrap">
          Sort by:
        </label>
        <select
          id="sort-by"
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as ReviewSortBy)}
          className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Reviewer type filter buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-gray-600 whitespace-nowrap">Filter:</span>
        {reviewerTypeOptions.map((option) => (
          <Button
            key={option.value || 'all'}
            variant={
              (option.value === '' && !reviewerType) ||
              option.value === reviewerType
                ? 'default'
                : 'outline'
            }
            size="sm"
            onClick={() =>
              onReviewerTypeChange(
                option.value === '' ? undefined : (option.value as ReviewerType)
              )
            }
            className="text-xs"
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

export default ReviewFilters;
