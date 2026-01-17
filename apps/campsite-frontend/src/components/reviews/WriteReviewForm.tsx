'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { StarRatingInput } from '@/components/ui/StarRatingInput';
import type { CreateReviewInput, ReviewerType } from '@campsite/shared';

interface WriteReviewFormProps {
  campsiteId: string;
  onSubmit: (data: CreateReviewInput) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
  className?: string;
}

const reviewerTypeOptions: { value: ReviewerType; label: string }[] = [
  { value: 'solo', label: 'Solo Traveler' },
  { value: 'couple', label: 'Couple' },
  { value: 'family', label: 'Family' },
  { value: 'group', label: 'Group' },
];

export function WriteReviewForm({
  campsiteId,
  onSubmit,
  onCancel,
  isSubmitting = false,
  className,
}: WriteReviewFormProps) {
  const [formData, setFormData] = React.useState({
    rating_overall: 0,
    rating_cleanliness: 0,
    rating_staff: 0,
    rating_facilities: 0,
    rating_value: 0,
    rating_location: 0,
    reviewer_type: '' as ReviewerType | '',
    title: '',
    content: '',
    pros: '',
    cons: '',
    visited_at: '',
  });

  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [showSubRatings, setShowSubRatings] = React.useState(false);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.rating_overall < 1) {
      newErrors.rating_overall = 'Please select an overall rating';
    }

    if (!formData.reviewer_type) {
      newErrors.reviewer_type = 'Please select your travel type';
    }

    if (formData.content.length < 20) {
      newErrors.content = 'Review must be at least 20 characters';
    }

    if (formData.content.length > 2000) {
      newErrors.content = 'Review must be 2000 characters or less';
    }

    if (formData.title && formData.title.length > 100) {
      newErrors.title = 'Title must be 100 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const submitData: CreateReviewInput = {
      campsite_id: campsiteId,
      rating_overall: formData.rating_overall,
      reviewer_type: formData.reviewer_type as ReviewerType,
      content: formData.content,
      ...(formData.title && { title: formData.title }),
      ...(formData.rating_cleanliness > 0 && { rating_cleanliness: formData.rating_cleanliness }),
      ...(formData.rating_staff > 0 && { rating_staff: formData.rating_staff }),
      ...(formData.rating_facilities > 0 && { rating_facilities: formData.rating_facilities }),
      ...(formData.rating_value > 0 && { rating_value: formData.rating_value }),
      ...(formData.rating_location > 0 && { rating_location: formData.rating_location }),
      ...(formData.pros && { pros: formData.pros }),
      ...(formData.cons && { cons: formData.cons }),
      ...(formData.visited_at && { visited_at: formData.visited_at }),
    };

    await onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-6', className)}>
      {/* Overall Rating */}
      <div className="space-y-2">
        <StarRatingInput
          value={formData.rating_overall}
          onChange={(value) => {
            setFormData((prev) => ({ ...prev, rating_overall: value }));
            if (errors.rating_overall) {
              setErrors((prev) => ({ ...prev, rating_overall: '' }));
            }
          }}
          size="lg"
          label="Overall Rating"
          required
        />
        {errors.rating_overall && (
          <p className="text-sm text-red-500">{errors.rating_overall}</p>
        )}
      </div>

      {/* Sub-ratings toggle */}
      <button
        type="button"
        onClick={() => setShowSubRatings(!showSubRatings)}
        className="text-sm text-primary hover:underline"
      >
        {showSubRatings ? 'Hide detailed ratings' : 'Add detailed ratings (optional)'}
      </button>

      {/* Sub-ratings */}
      {showSubRatings && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
          <StarRatingInput
            value={formData.rating_cleanliness}
            onChange={(value) =>
              setFormData((prev) => ({ ...prev, rating_cleanliness: value }))
            }
            label="Cleanliness"
            size="md"
          />
          <StarRatingInput
            value={formData.rating_staff}
            onChange={(value) =>
              setFormData((prev) => ({ ...prev, rating_staff: value }))
            }
            label="Staff"
            size="md"
          />
          <StarRatingInput
            value={formData.rating_facilities}
            onChange={(value) =>
              setFormData((prev) => ({ ...prev, rating_facilities: value }))
            }
            label="Facilities"
            size="md"
          />
          <StarRatingInput
            value={formData.rating_value}
            onChange={(value) =>
              setFormData((prev) => ({ ...prev, rating_value: value }))
            }
            label="Value for Money"
            size="md"
          />
          <StarRatingInput
            value={formData.rating_location}
            onChange={(value) =>
              setFormData((prev) => ({ ...prev, rating_location: value }))
            }
            label="Location"
            size="md"
          />
        </div>
      )}

      {/* Reviewer Type */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          How did you travel? <span className="text-red-500">*</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {reviewerTypeOptions.map((option) => (
            <Button
              key={option.value}
              type="button"
              variant={formData.reviewer_type === option.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setFormData((prev) => ({ ...prev, reviewer_type: option.value }));
                if (errors.reviewer_type) {
                  setErrors((prev) => ({ ...prev, reviewer_type: '' }));
                }
              }}
            >
              {option.label}
            </Button>
          ))}
        </div>
        {errors.reviewer_type && (
          <p className="text-sm text-red-500">{errors.reviewer_type}</p>
        )}
      </div>

      {/* Title (optional) */}
      <div className="space-y-2">
        <label htmlFor="title" className="text-sm font-medium text-gray-700">
          Review Title (optional)
        </label>
        <input
          id="title"
          type="text"
          value={formData.title}
          onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
          placeholder="Summarize your experience"
          maxLength={100}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
        {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
      </div>

      {/* Content */}
      <div className="space-y-2">
        <label htmlFor="content" className="text-sm font-medium text-gray-700">
          Your Review <span className="text-red-500">*</span>
        </label>
        <textarea
          id="content"
          value={formData.content}
          onChange={(e) => {
            setFormData((prev) => ({ ...prev, content: e.target.value }));
            if (errors.content) {
              setErrors((prev) => ({ ...prev, content: '' }));
            }
          }}
          placeholder="Share your experience at this campsite. What did you like? What could be improved?"
          rows={5}
          maxLength={2000}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>Minimum 20 characters</span>
          <span>{formData.content.length}/2000</span>
        </div>
        {errors.content && <p className="text-sm text-red-500">{errors.content}</p>}
      </div>

      {/* Pros & Cons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="pros" className="text-sm font-medium text-green-700">
            What did you like? (optional)
          </label>
          <textarea
            id="pros"
            value={formData.pros}
            onChange={(e) => setFormData((prev) => ({ ...prev, pros: e.target.value }))}
            placeholder="The positives..."
            rows={2}
            maxLength={500}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="cons" className="text-sm font-medium text-red-700">
            What could be improved? (optional)
          </label>
          <textarea
            id="cons"
            value={formData.cons}
            onChange={(e) => setFormData((prev) => ({ ...prev, cons: e.target.value }))}
            placeholder="The negatives..."
            rows={2}
            maxLength={500}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
          />
        </div>
      </div>

      {/* Visit Date */}
      <div className="space-y-2">
        <label htmlFor="visited_at" className="text-sm font-medium text-gray-700">
          When did you visit? (optional)
        </label>
        <input
          id="visited_at"
          type="date"
          value={formData.visited_at}
          onChange={(e) => setFormData((prev) => ({ ...prev, visited_at: e.target.value }))}
          max={new Date().toISOString().split('T')[0]}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit Review'}
        </Button>
      </div>
    </form>
  );
}

export default WriteReviewForm;
