'use client';

import { X, GitCompare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface WishlistCompareBarProps {
  count: number;
  maxCount?: number;
  onCompare: () => void;
  onClear: () => void;
  className?: string;
}

export function WishlistCompareBar({
  count,
  maxCount = 3,
  onCompare,
  onClear,
  className,
}: WishlistCompareBarProps) {
  const canCompare = count >= 2;

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg',
        'transform transition-transform duration-300',
        count > 0 ? 'translate-y-0' : 'translate-y-full',
        className
      )}
    >
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
            <GitCompare className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">
              {count} campsite{count !== 1 ? 's' : ''} selected
            </p>
            <p className="text-sm text-gray-500">
              {canCompare
                ? `Select up to ${maxCount - count} more or compare now`
                : `Select ${2 - count} more to compare`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onClear}
            className="gap-1"
          >
            <X className="h-4 w-4" />
            Clear
          </Button>

          <Button
            size="sm"
            onClick={onCompare}
            disabled={!canCompare}
            className="gap-1"
          >
            <GitCompare className="h-4 w-4" />
            Compare ({count})
          </Button>
        </div>
      </div>
    </div>
  );
}

export default WishlistCompareBar;
