'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface HelpfulButtonProps {
  reviewId: string;
  helpfulCount: number;
  userVoted?: boolean;
  isAuthenticated?: boolean;
  onVote?: (reviewId: string) => Promise<void>;
  className?: string;
}

export function HelpfulButton({
  reviewId,
  helpfulCount: initialCount,
  userVoted: initialVoted = false,
  isAuthenticated = false,
  onVote,
  className,
}: HelpfulButtonProps) {
  const [helpfulCount, setHelpfulCount] = React.useState(initialCount);
  const [userVoted, setUserVoted] = React.useState(initialVoted);
  const [isLoading, setIsLoading] = React.useState(false);

  // Sync with props when they change
  React.useEffect(() => {
    setHelpfulCount(initialCount);
    setUserVoted(initialVoted);
  }, [initialCount, initialVoted]);

  const handleClick = async () => {
    if (!isAuthenticated) {
      // Could trigger login modal here
      return;
    }

    if (isLoading) return;

    // Optimistic update
    const wasVoted = userVoted;
    setUserVoted(!wasVoted);
    setHelpfulCount((prev) => (wasVoted ? prev - 1 : prev + 1));

    setIsLoading(true);

    try {
      if (onVote) {
        await onVote(reviewId);
      }
    } catch (error) {
      // Revert on error
      setUserVoted(wasVoted);
      setHelpfulCount((prev) => (wasVoted ? prev + 1 : prev - 1));
      console.error('Failed to toggle helpful vote:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={userVoted ? 'default' : 'outline'}
      size="sm"
      onClick={handleClick}
      disabled={isLoading}
      className={cn(
        'gap-1.5 text-xs',
        userVoted && 'bg-green-600 hover:bg-green-700',
        className
      )}
      title={isAuthenticated ? (userVoted ? 'Remove helpful vote' : 'Mark as helpful') : 'Login to vote'}
    >
      <ThumbsUpIcon className={cn('w-3.5 h-3.5', userVoted && 'fill-current')} />
      <span>Helpful</span>
      {helpfulCount > 0 && (
        <span className="ml-0.5">({helpfulCount})</span>
      )}
    </Button>
  );
}

function ThumbsUpIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
    </svg>
  );
}

export default HelpfulButton;
