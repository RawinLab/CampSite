'use client';

import Link from 'next/link';
import { Heart } from 'lucide-react';
import { useWishlistCount } from '@/hooks/useWishlist';
import { cn } from '@/lib/utils';

interface WishlistCounterProps {
  className?: string;
}

export function WishlistCounter({ className }: WishlistCounterProps) {
  const { count, isLoading } = useWishlistCount();

  return (
    <Link
      href="/wishlist"
      className={cn(
        'relative inline-flex items-center justify-center',
        'rounded-full p-2 hover:bg-gray-100 transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2',
        className
      )}
      aria-label={`Wishlist${count > 0 ? ` (${count} items)` : ''}`}
    >
      <Heart className="h-6 w-6 text-gray-700" />
      {count > 0 && !isLoading && (
        <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}

export default WishlistCounter;
