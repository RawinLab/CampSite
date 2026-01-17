'use client';

import * as React from 'react';
import { MessageSquare } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { InquiryForm } from './InquiryForm';
import { InquiryConfirmation } from './InquiryConfirmation';
import { InquiryRateLimit } from './InquiryRateLimit';
import type { CreateInquiryInput, InquiryRateLimitInfo } from '@campsite/shared';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface InquiryDialogProps {
  campsiteId: string;
  campsiteName: string;
  isOpen: boolean;
  onClose: () => void;
}

type DialogState = 'form' | 'success' | 'rate_limited';

export function InquiryDialog({
  campsiteId,
  campsiteName,
  isOpen,
  onClose,
}: InquiryDialogProps) {
  const [state, setState] = React.useState<DialogState>('form');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [rateLimitInfo, setRateLimitInfo] = React.useState<InquiryRateLimitInfo | null>(null);

  // Reset state when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      setState('form');
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleSubmit = async (data: CreateInquiryInput) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/inquiries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.status === 429) {
        // Rate limited
        setRateLimitInfo(result.rateLimitInfo || {
          remaining: 0,
          limit: 5,
          resetAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        });
        setState('rate_limited');
        return;
      }

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send inquiry');
      }

      // Update rate limit info if provided
      if (result.rateLimitInfo) {
        setRateLimitInfo(result.rateLimitInfo);
      }

      setState('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset to form state for next open
    setState('form');
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        {state === 'form' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                Send Inquiry
              </DialogTitle>
              <DialogDescription>
                Ask the owner about availability, facilities, or booking details for {campsiteName}.
              </DialogDescription>
            </DialogHeader>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            <InquiryForm
              campsiteId={campsiteId}
              campsiteName={campsiteName}
              onSubmit={handleSubmit}
              onCancel={handleClose}
              isSubmitting={isSubmitting}
            />
          </>
        )}

        {state === 'success' && (
          <InquiryConfirmation
            campsiteName={campsiteName}
            rateLimitInfo={rateLimitInfo}
            onClose={handleClose}
          />
        )}

        {state === 'rate_limited' && rateLimitInfo && (
          <InquiryRateLimit
            rateLimitInfo={rateLimitInfo}
            onClose={handleClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

export default InquiryDialog;
