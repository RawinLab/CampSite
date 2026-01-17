'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface CampsiteCardSkeletonProps {
  className?: string;
}

/**
 * Skeleton loader for CampsiteCard component
 * Displays while campsite data is loading
 */
export function CampsiteCardSkeleton({ className }: CampsiteCardSkeletonProps) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      {/* Image Skeleton */}
      <Skeleton className="aspect-[4/3] w-full" />

      <CardContent className="p-4">
        {/* Name */}
        <Skeleton className="h-5 w-3/4 mb-2" />

        {/* Location */}
        <Skeleton className="h-4 w-1/2 mb-3" />

        {/* Description */}
        <div className="space-y-2 mb-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>

        {/* Footer: Rating & Price */}
        <div className="flex items-center justify-between border-t border-gray-100 pt-3">
          <div className="flex items-center gap-1">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-12" />
          </div>
          <div className="text-right">
            <Skeleton className="h-3 w-10 mb-1" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Grid of CampsiteCard skeletons
 */
export function CampsiteCardsGridSkeleton({
  count = 6,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3',
        className
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <CampsiteCardSkeleton key={i} />
      ))}
    </div>
  );
}

export default CampsiteCardSkeleton;
