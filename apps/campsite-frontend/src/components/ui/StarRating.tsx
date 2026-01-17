'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'w-3.5 h-3.5',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

const textSizeClasses = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

export function StarRating({
  rating,
  maxRating = 5,
  size = 'md',
  showValue = false,
  className,
}: StarRatingProps) {
  const fullStars = Math.floor(rating);
  const partialFill = rating - fullStars;
  const emptyStars = maxRating - Math.ceil(rating);

  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {/* Full stars */}
      {Array.from({ length: fullStars }).map((_, i) => (
        <StarIcon
          key={`full-${i}`}
          className={cn(sizeClasses[size], 'text-yellow-400 fill-yellow-400')}
        />
      ))}

      {/* Partial star */}
      {partialFill > 0 && (
        <div className="relative">
          <StarIcon
            className={cn(sizeClasses[size], 'text-gray-300 fill-gray-300')}
          />
          <div
            className="absolute top-0 left-0 overflow-hidden"
            style={{ width: `${partialFill * 100}%` }}
          >
            <StarIcon
              className={cn(sizeClasses[size], 'text-yellow-400 fill-yellow-400')}
            />
          </div>
        </div>
      )}

      {/* Empty stars */}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <StarIcon
          key={`empty-${i}`}
          className={cn(sizeClasses[size], 'text-gray-300 fill-gray-300')}
        />
      ))}

      {/* Rating value */}
      {showValue && (
        <span className={cn('ml-1.5 font-medium text-gray-700', textSizeClasses[size])}>
          {rating.toFixed(1)}
        </span>
      )}
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

export default StarRating;
