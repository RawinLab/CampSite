'use client';

import Link from 'next/link';
import { Heart, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function WishlistEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="relative mb-6">
        <Heart className="h-24 w-24 text-gray-200" strokeWidth={1} />
        <Heart className="absolute inset-0 h-24 w-24 text-gray-300" strokeWidth={1} />
      </div>

      <h2 className="mb-2 text-xl font-semibold text-gray-900">
        Your wishlist is empty
      </h2>

      <p className="mb-6 max-w-md text-center text-gray-500">
        Start exploring campsites and tap the heart icon to save your favorites.
        Your saved campsites will appear here.
      </p>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild>
          <Link href="/search">
            <Search className="mr-2 h-4 w-4" />
            Explore Campsites
          </Link>
        </Button>

        <Button variant="outline" asChild>
          <Link href="/">
            View Homepage
          </Link>
        </Button>
      </div>
    </div>
  );
}

export default WishlistEmpty;
