'use client';

import * as React from 'react';
import { AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { InquiryRateLimitInfo } from '@campsite/shared';

interface InquiryRateLimitProps {
  rateLimitInfo: InquiryRateLimitInfo;
  onClose: () => void;
}

export function InquiryRateLimit({
  rateLimitInfo,
  onClose,
}: InquiryRateLimitProps) {
  const [timeRemaining, setTimeRemaining] = React.useState<string>('');

  // Calculate and update time remaining
  React.useEffect(() => {
    const updateTimeRemaining = () => {
      if (!rateLimitInfo.resetAt) {
        setTimeRemaining('24 hours');
        return;
      }

      const resetTime = new Date(rateLimitInfo.resetAt).getTime();
      const now = Date.now();
      const diff = resetTime - now;

      if (diff <= 0) {
        setTimeRemaining('soon');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m`);
      } else {
        setTimeRemaining(`${minutes} minutes`);
      }
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [rateLimitInfo.resetAt]);

  return (
    <div className="flex flex-col items-center text-center py-6">
      {/* Warning Icon */}
      <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
        <AlertCircle className="w-10 h-10 text-amber-600" />
      </div>

      {/* Title */}
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        Daily Limit Reached
      </h2>

      {/* Description */}
      <p className="text-gray-600 mb-6 max-w-sm">
        You have reached the maximum of {rateLimitInfo.limit} inquiries per day. This limit helps prevent spam and ensures all inquiries get proper attention.
      </p>

      {/* Time Remaining Card */}
      <div className="w-full p-4 bg-gray-50 rounded-lg mb-6">
        <div className="flex items-center justify-center gap-2 text-gray-700">
          <Clock className="w-5 h-5" />
          <span className="text-sm">
            Your limit resets in <span className="font-semibold">{timeRemaining}</span>
          </span>
        </div>
      </div>

      {/* Info Text */}
      <p className="text-xs text-gray-500 mb-6">
        You can still browse campsites and add them to your wishlist while waiting.
      </p>

      {/* Close Button */}
      <Button onClick={onClose} variant="outline" className="w-full sm:w-auto">
        I understand
      </Button>
    </div>
  );
}

export default InquiryRateLimit;
