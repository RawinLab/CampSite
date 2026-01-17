'use client';

import * as React from 'react';
import { CheckCircle, Mail, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { InquiryRateLimitInfo } from '@campsite/shared';

interface InquiryConfirmationProps {
  campsiteName: string;
  rateLimitInfo: InquiryRateLimitInfo | null;
  onClose: () => void;
}

export function InquiryConfirmation({
  campsiteName,
  rateLimitInfo,
  onClose,
}: InquiryConfirmationProps) {
  return (
    <div className="flex flex-col items-center text-center py-6">
      {/* Success Icon */}
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
        <CheckCircle className="w-10 h-10 text-green-600" />
      </div>

      {/* Title */}
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        Inquiry Sent Successfully!
      </h2>

      {/* Description */}
      <p className="text-gray-600 mb-6 max-w-sm">
        Your inquiry about <span className="font-medium">{campsiteName}</span> has been sent to the owner. They will respond as soon as possible.
      </p>

      {/* Info Cards */}
      <div className="w-full space-y-3 mb-6">
        {/* Email Notification */}
        <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg text-left">
          <Mail className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-900">
              Check your email
            </p>
            <p className="text-sm text-blue-700">
              A confirmation email has been sent to your inbox.
            </p>
          </div>
        </div>

        {/* Rate Limit Info */}
        {rateLimitInfo && rateLimitInfo.remaining < 5 && (
          <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg text-left">
            <Clock className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-900">
                Inquiry Limit
              </p>
              <p className="text-sm text-amber-700">
                You have {rateLimitInfo.remaining} of {rateLimitInfo.limit} inquiries remaining today.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Close Button */}
      <Button onClick={onClose} className="w-full sm:w-auto">
        Done
      </Button>
    </div>
  );
}

export default InquiryConfirmation;
