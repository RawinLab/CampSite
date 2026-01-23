'use client';

import { useState, useCallback } from 'react';
import { Heart } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useWishlist } from '@/hooks/useWishlist';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface WishlistButtonProps {
  campsiteId: string;
  initialWishlisted?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'icon' | 'button';
  className?: string;
  onToggle?: (isWishlisted: boolean) => void;
}

export function WishlistButton({
  campsiteId,
  initialWishlisted = false,
  size = 'md',
  variant = 'icon',
  className,
  onToggle,
}: WishlistButtonProps) {
  const { user, loading: authLoading } = useAuth();
  const { isInWishlist, toggleItem } = useWishlist();
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // Use local state for immediate UI feedback, fallback to hook state
  const isWishlisted = isInWishlist(campsiteId);

  const handleClick = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Allow click even when auth is loading - just show login prompt if no user
      if (!user) {
        setShowLoginPrompt(true);
        // Auto-hide prompt after 3 seconds
        setTimeout(() => setShowLoginPrompt(false), 3000);
        return;
      }

      if (isLoading || authLoading) return;

      setIsLoading(true);

      try {
        const newState = await toggleItem(campsiteId);
        onToggle?.(newState);
      } catch (error) {
        console.error('Failed to toggle wishlist:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [user, authLoading, isLoading, campsiteId, toggleItem, onToggle]
  );

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  if (variant === 'button') {
    return (
      <div className="relative">
        <Button
          variant={isWishlisted ? 'secondary' : 'outline'}
          size={size === 'lg' ? 'lg' : size === 'sm' ? 'sm' : 'default'}
          onClick={handleClick}
          disabled={isLoading}
          data-testid="wishlist-button"
          data-active={isWishlisted}
          className={cn('gap-2', className)}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
        >
          <Heart
            className={cn(
              iconSizes[size],
              'transition-all duration-200',
              isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600',
              isLoading && 'animate-pulse'
            )}
          />
          <span>{isWishlisted ? 'Saved' : 'Save'}</span>
        </Button>

        {showLoginPrompt && (
          <LoginPrompt onClose={() => setShowLoginPrompt(false)} />
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        disabled={isLoading}
        data-testid="wishlist-button"
        data-active={isWishlisted}
        className={cn(
          'rounded-full flex items-center justify-center transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2',
          sizeClasses[size],
          isWishlisted
            ? 'bg-red-100 hover:bg-red-200'
            : 'bg-white/80 hover:bg-white shadow-sm',
          isLoading && 'opacity-70 cursor-not-allowed',
          className
        )}
        aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        <Heart
          className={cn(
            'transition-all duration-200',
            iconSizes[size],
            isWishlisted
              ? 'fill-red-500 text-red-500 scale-110'
              : 'text-gray-600 hover:text-red-500',
            isLoading && 'animate-pulse'
          )}
        />
      </button>

      {showLoginPrompt && (
        <LoginPrompt onClose={() => setShowLoginPrompt(false)} />
      )}
    </div>
  );
}

function LoginPrompt({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-lg bg-white p-4 shadow-lg ring-1 ring-black/5" data-testid="wishlist-login-prompt">
      <p className="mb-3 text-sm text-gray-700">
        Please log in to save campsites to your wishlist.
      </p>
      <div className="flex gap-2">
        <Link
          href="/auth/login"
          className="flex-1 rounded-md bg-green-600 px-3 py-2 text-center text-sm font-medium text-white hover:bg-green-700"
        >
          Log in
        </Link>
        <button
          onClick={onClose}
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default WishlistButton;
