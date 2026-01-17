'use client';

// Force dynamic rendering for pages using useSearchParams
export const dynamic = 'force-dynamic';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, GitCompare, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ComparisonTable, ComparisonCards } from '@/components/compare';
import { fetchCampsitesForComparison } from '@/lib/api/compare';
import type { CampsiteDetail } from '@campsite/shared';

function ComparePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idsParam = searchParams.get('ids');

  const [campsites, setCampsites] = useState<CampsiteDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCampsites() {
      if (!idsParam) {
        setError('No campsites selected for comparison');
        setIsLoading(false);
        return;
      }

      const ids = idsParam.split(',').filter(Boolean);

      if (ids.length < 2) {
        setError('At least 2 campsites are required for comparison');
        setIsLoading(false);
        return;
      }

      if (ids.length > 3) {
        // Trim to 3 campsites
        ids.splice(3);
      }

      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchCampsitesForComparison(ids);

        if (data.length < 2) {
          setError('Could not find enough valid campsites for comparison');
        } else {
          setCampsites(data);
        }
      } catch (err) {
        console.error('Failed to load comparison data:', err);
        setError('Failed to load comparison data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }

    loadCampsites();
  }, [idsParam]);

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-md text-center">
          <AlertCircle className="mx-auto mb-4 h-16 w-16 text-red-500" />
          <h1 className="mb-2 text-2xl font-bold">Comparison Error</h1>
          <p className="mb-6 text-gray-500">{error}</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild variant="outline">
              <Link href="/wishlist">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Wishlist
              </Link>
            </Button>
            <Button asChild>
              <Link href="/search">
                Browse Campsites
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Skeleton className="h-8 w-64" />
        </div>

        {/* Desktop skeleton */}
        <div className="hidden md:block">
          <div className="overflow-hidden rounded-lg border">
            <div className="bg-gray-50 p-4">
              <div className="flex gap-8 justify-center">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="text-center">
                    <Skeleton className="mx-auto h-32 w-48 rounded-lg" />
                    <Skeleton className="mx-auto mt-3 h-6 w-32" />
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 space-y-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex">
                  <Skeleton className="h-6 w-32" />
                  <div className="flex-1 flex justify-around">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile skeleton */}
        <div className="md:hidden space-y-4">
          <div className="flex gap-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-24 rounded-full" />
            ))}
          </div>
          <Skeleton className="aspect-video w-full rounded-lg" />
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/wishlist">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Compare Campsites</h1>
            <p className="text-sm text-gray-500">
              Comparing {campsites.length} campsites
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
          <GitCompare className="h-4 w-4" />
          Side-by-side comparison
        </div>
      </div>

      {/* Desktop: Table view */}
      <div className="hidden md:block">
        <ComparisonTable campsites={campsites} />
      </div>

      {/* Mobile: Card/Tab view */}
      <div className="md:hidden">
        <ComparisonCards campsites={campsites} />
      </div>

      {/* Back to wishlist link */}
      <div className="mt-8 text-center">
        <Link
          href="/wishlist"
          className="text-sm text-green-600 hover:text-green-700 hover:underline"
        >
          Back to wishlist
        </Link>
      </div>
    </div>
  );
}

// Loading fallback for Suspense
function ComparePageLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Skeleton className="h-8 w-64" />
      </div>
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

// Wrap in Suspense for useSearchParams
export default function ComparePage() {
  return (
    <Suspense fallback={<ComparePageLoading />}>
      <ComparePageContent />
    </Suspense>
  );
}
