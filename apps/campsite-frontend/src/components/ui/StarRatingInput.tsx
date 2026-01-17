'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface StarRatingInputProps {
  value: number;
  onChange: (value: number) => void;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-10 h-10',
};

export function StarRatingInput({
  value,
  onChange,
  maxRating = 5,
  size = 'md',
  label,
  required = false,
  disabled = false,
  className,
}: StarRatingInputProps) {
  const [hoverValue, setHoverValue] = React.useState(0);

  const handleClick = (starValue: number) => {
    if (disabled) return;
    // Allow toggling off if clicking the same value
    onChange(value === starValue ? 0 : starValue);
  };

  const handleMouseEnter = (starValue: number) => {
    if (disabled) return;
    setHoverValue(starValue);
  };

  const handleMouseLeave = () => {
    setHoverValue(0);
  };

  const displayValue = hoverValue || value;

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div
        className="flex items-center gap-1"
        onMouseLeave={handleMouseLeave}
        role="radiogroup"
        aria-label={label || 'Rating'}
      >
        {Array.from({ length: maxRating }).map((_, index) => {
          const starValue = index + 1;
          const isFilled = starValue <= displayValue;

          return (
            <button
              key={index}
              type="button"
              onClick={() => handleClick(starValue)}
              onMouseEnter={() => handleMouseEnter(starValue)}
              disabled={disabled}
              className={cn(
                'transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 rounded',
                disabled && 'cursor-not-allowed opacity-50'
              )}
              role="radio"
              aria-checked={value === starValue}
              aria-label={`${starValue} star${starValue !== 1 ? 's' : ''}`}
            >
              <StarIcon
                className={cn(
                  sizeClasses[size],
                  isFilled
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-gray-300 fill-gray-300 hover:text-yellow-200 hover:fill-yellow-200'
                )}
              />
            </button>
          );
        })}
        {value > 0 && (
          <span className="ml-2 text-sm text-gray-600">
            {value} out of {maxRating}
          </span>
        )}
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

export default StarRatingInput;
