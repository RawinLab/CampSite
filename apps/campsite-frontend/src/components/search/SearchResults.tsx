'use client';

import { CampsiteCard } from './CampsiteCard';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { CampsiteCard as CampsiteCardType } from '@campsite/shared';

interface SearchResultsProps {
  campsites: CampsiteCardType[];
  isLoading?: boolean;
  className?: string;
}

function CampsiteCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl bg-brand-bg">
      <Skeleton className="aspect-[4/3] w-full" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <div className="flex justify-between pt-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-5 w-20" />
        </div>
      </div>
    </div>
  );
}

function EmptyResults() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
      <svg
        className="h-16 w-16 text-muted-foreground/40"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
        <line x1="8" y1="11" x2="14" y2="11" />
      </svg>
      <h3 className="mt-4 text-lg font-medium text-brand-text">
        ไม่พบแคมป์ปิ้งที่ตรงกับการค้นหา
      </h3>
      <p className="mt-2 text-sm text-muted-foreground">
        ลองปรับเปลี่ยนตัวกรองหรือค้นหาด้วยคำอื่น
      </p>
      <ul className="mt-4 text-sm text-muted-foreground">
        <li>- ลองลดจำนวนตัวกรองที่เลือก</li>
        <li>- ขยายช่วงราคา</li>
        <li>- ค้นหาในจังหวัดอื่น</li>
      </ul>
    </div>
  );
}

export function SearchResults({ campsites, isLoading, className }: SearchResultsProps) {
  if (isLoading) {
    return (
      <div
        className={cn(
          'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3',
          className
        )}
      >
        {[...Array(6)].map((_, i) => (
          <CampsiteCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!campsites || campsites.length === 0) {
    return <EmptyResults />;
  }

  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3',
        className
      )}
    >
      {campsites.map((campsite) => (
        <CampsiteCard key={campsite.id} campsite={campsite} />
      ))}
    </div>
  );
}

export default SearchResults;
