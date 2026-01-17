'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { ReportReason } from '@campsite/shared';

interface ReportReviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: ReportReason, details?: string) => Promise<void>;
  className?: string;
}

const reportReasons: { value: ReportReason; label: string; description: string }[] = [
  {
    value: 'spam',
    label: 'Spam',
    description: 'This review contains spam or promotional content',
  },
  {
    value: 'inappropriate',
    label: 'Inappropriate Content',
    description: 'This review contains offensive or inappropriate language',
  },
  {
    value: 'fake',
    label: 'Fake Review',
    description: 'This review appears to be fake or from someone who did not visit',
  },
  {
    value: 'other',
    label: 'Other',
    description: 'This review violates guidelines for another reason',
  },
];

export function ReportReviewDialog({
  isOpen,
  onClose,
  onSubmit,
  className,
}: ReportReviewDialogProps) {
  const [selectedReason, setSelectedReason] = React.useState<ReportReason | null>(null);
  const [details, setDetails] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isOpen) {
      setSelectedReason(null);
      setDetails('');
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReason) {
      setError('Please select a reason');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(selectedReason, details || undefined);
      onClose();
    } catch (err) {
      setError('Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className={cn(
          'bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-auto',
          className
        )}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-dialog-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 id="report-dialog-title" className="text-lg font-semibold">
            Report Review
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <p className="text-sm text-gray-600">
            Help us understand what is wrong with this review. Your report will be reviewed by our moderation team.
          </p>

          {/* Reason selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Reason for reporting <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {reportReasons.map((reason) => (
                <label
                  key={reason.value}
                  className={cn(
                    'flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors',
                    selectedReason === reason.value
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <input
                    type="radio"
                    name="report-reason"
                    value={reason.value}
                    checked={selectedReason === reason.value}
                    onChange={() => setSelectedReason(reason.value)}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium text-sm">{reason.label}</div>
                    <div className="text-xs text-gray-500">{reason.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Additional details */}
          <div className="space-y-2">
            <label htmlFor="report-details" className="text-sm font-medium text-gray-700">
              Additional details (optional)
            </label>
            <textarea
              id="report-details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Provide any additional context that might help us review this report..."
              rows={3}
              maxLength={500}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            />
            <div className="text-xs text-gray-500 text-right">
              {details.length}/500 characters
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!selectedReason || isSubmitting}
              variant="destructive"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ReportReviewDialog;
