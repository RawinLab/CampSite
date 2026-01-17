'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, GitCompare, List, Grid3X3 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useWishlist } from '@/hooks/useWishlist';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  WishlistGrid,
  WishlistEmpty,
  WishlistCompareBar,
} from '@/components/wishlist';
import { cn } from '@/lib/utils';
import Link from 'next/link';

type SortOption = 'newest' | 'oldest' | 'name';
type ViewMode = 'grid' | 'list';

export default function WishlistPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { wishlist, isLoading, count, removeItem } = useWishlist();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Toggle selection for comparison
  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (next.size >= 3) {
          // Show toast warning
          return prev;
        }
        next.add(id);
      }
      return next;
    });
  }, []);

  // Handle compare button click
  const handleCompare = useCallback(() => {
    if (selectedIds.size >= 2) {
      const ids = Array.from(selectedIds).join(',');
      router.push(`/compare?ids=${ids}`);
    }
  }, [selectedIds, router]);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setSelectionMode(false);
  }, []);

  // Handle remove from wishlist
  const handleRemove = useCallback(
    async (campsiteId: string) => {
      try {
        await removeItem(campsiteId);
        // Also remove from selection if selected
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(campsiteId);
          return next;
        });
      } catch (error) {
        console.error('Failed to remove from wishlist:', error);
      }
    },
    [removeItem]
  );

  // Sort wishlist items
  const sortedWishlist = [...wishlist].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    if (sortBy === 'oldest') {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    }
    if (sortBy === 'name') {
      return a.campsite.name.localeCompare(b.campsite.name);
    }
    return 0;
  });

  // Auth check - redirect to login if not authenticated
  if (!authLoading && !user) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-md text-center">
          <Heart className="mx-auto mb-4 h-16 w-16 text-gray-300" />
          <h1 className="mb-2 text-2xl font-bold">Sign in to view your wishlist</h1>
          <p className="mb-6 text-gray-500">
            Save your favorite campsites and access them from any device.
          </p>
          <Button asChild>
            <Link href="/auth/login">Sign in</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="overflow-hidden rounded-lg border">
              <Skeleton className="aspect-[4/3] w-full" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (wishlist.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold">My Wishlist</h1>
        <WishlistEmpty />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">
          My Wishlist ({count})
        </h1>

        <div className="flex flex-wrap items-center gap-3">
          {/* Compare toggle */}
          <Button
            variant={selectionMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setSelectionMode(!selectionMode);
              if (selectionMode) {
                clearSelection();
              }
            }}
            className="gap-2"
          >
            <GitCompare className="h-4 w-4" />
            {selectionMode ? 'Cancel' : 'Compare'}
          </Button>

          {/* Sort dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="name">Name A-Z</option>
          </select>

          {/* View toggle */}
          <div className="hidden sm:flex items-center rounded-md border border-gray-300">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2 transition-colors',
                viewMode === 'grid' ? 'bg-gray-100' : 'hover:bg-gray-50'
              )}
              aria-label="Grid view"
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-2 transition-colors',
                viewMode === 'list' ? 'bg-gray-100' : 'hover:bg-gray-50'
              )}
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Selection hint */}
      {selectionMode && (
        <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
          Click on campsites to select them for comparison (2-3 campsites).
        </div>
      )}

      {/* Wishlist grid */}
      <WishlistGrid
        items={sortedWishlist}
        selectedIds={selectedIds}
        selectionMode={selectionMode}
        onToggleSelection={toggleSelection}
        onRemove={handleRemove}
      />

      {/* Compare bar */}
      <WishlistCompareBar
        count={selectedIds.size}
        maxCount={3}
        onCompare={handleCompare}
        onClear={clearSelection}
      />

      {/* Spacer for compare bar */}
      {selectedIds.size > 0 && <div className="h-24" />}
    </div>
  );
}
