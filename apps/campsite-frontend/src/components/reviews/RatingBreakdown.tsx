'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import type { ReviewSummary } from '@campsite/shared';

interface RatingBreakdownProps {
  categoryAverages: ReviewSummary['category_averages'];
  className?: string;
}

const categoryLabels: Record<string, string> = {
  cleanliness: 'Cleanliness',
  staff: 'Staff',
  facilities: 'Facilities',
  value: 'Value for Money',
  location: 'Location',
};

const categoryIcons: Record<string, React.ReactNode> = {
  cleanliness: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
  staff: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  facilities: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  value: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  location: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
};

function getRatingColor(rating: number): string {
  if (rating >= 4.5) return 'bg-green-500';
  if (rating >= 4) return 'bg-green-400';
  if (rating >= 3.5) return 'bg-yellow-400';
  if (rating >= 3) return 'bg-yellow-500';
  if (rating >= 2) return 'bg-orange-400';
  return 'bg-red-400';
}

export function RatingBreakdown({ categoryAverages, className }: RatingBreakdownProps) {
  const categories = Object.entries(categoryAverages).filter(
    ([, value]) => value !== null
  );

  if (categories.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-3', className)}>
      <h4 className="text-sm font-medium text-gray-700">Rating by Category</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {categories.map(([key, value]) => {
          const rating = value as number;
          const percentage = (rating / 5) * 100;

          return (
            <div key={key} className="flex items-center gap-2">
              <div className="text-gray-500">
                {categoryIcons[key]}
              </div>
              <div className="flex-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{categoryLabels[key]}</span>
                  <span className="font-medium text-gray-900">{rating.toFixed(1)}</span>
                </div>
                <div className="mt-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all duration-300', getRatingColor(rating))}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default RatingBreakdown;
