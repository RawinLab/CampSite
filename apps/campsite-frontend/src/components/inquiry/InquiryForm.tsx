'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import type { InquiryType, CreateInquiryInput } from '@campsite/shared';

interface InquiryFormProps {
  campsiteId: string;
  campsiteName: string;
  onSubmit: (data: CreateInquiryInput) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
  className?: string;
}

const inquiryTypeOptions: { value: InquiryType; label: string }[] = [
  { value: 'booking', label: 'Booking Inquiry' },
  { value: 'general', label: 'General Question' },
  { value: 'complaint', label: 'Complaint' },
  { value: 'other', label: 'Other' },
];

const MIN_MESSAGE_LENGTH = 20;
const MAX_MESSAGE_LENGTH = 2000;

export function InquiryForm({
  campsiteId,
  campsiteName,
  onSubmit,
  onCancel,
  isSubmitting = false,
  className,
}: InquiryFormProps) {
  const { user, session } = useAuth();

  const [formData, setFormData] = React.useState({
    guest_name: '',
    guest_email: '',
    guest_phone: '',
    inquiry_type: 'general' as InquiryType,
    message: '',
    check_in_date: '',
    check_out_date: '',
  });

  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [showDates, setShowDates] = React.useState(false);

  // Pre-fill form data for logged-in users
  React.useEffect(() => {
    if (user && session) {
      setFormData((prev) => ({
        ...prev,
        guest_name: user.user_metadata?.full_name || prev.guest_name,
        guest_email: user.email || prev.guest_email,
        guest_phone: user.user_metadata?.phone || prev.guest_phone,
      }));
    }
  }, [user, session]);

  // Thai phone validation: 0 followed by 9 digits
  const validateThaiPhone = (phone: string): boolean => {
    if (!phone) return true; // Phone is optional
    const normalized = phone.replace(/[\s-]/g, '');
    return /^0\d{9}$/.test(normalized);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Name validation
    if (!formData.guest_name.trim()) {
      newErrors.guest_name = 'Name is required';
    } else if (formData.guest_name.length < 2) {
      newErrors.guest_name = 'Name must be at least 2 characters';
    }

    // Email validation
    if (!formData.guest_email.trim()) {
      newErrors.guest_email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.guest_email)) {
      newErrors.guest_email = 'Please enter a valid email address';
    }

    // Phone validation (optional, but if provided, must be valid Thai format)
    if (formData.guest_phone && !validateThaiPhone(formData.guest_phone)) {
      newErrors.guest_phone = 'Invalid Thai phone number (e.g., 0812345678)';
    }

    // Message validation
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.length < MIN_MESSAGE_LENGTH) {
      newErrors.message = `Message must be at least ${MIN_MESSAGE_LENGTH} characters`;
    } else if (formData.message.length > MAX_MESSAGE_LENGTH) {
      newErrors.message = `Message must be ${MAX_MESSAGE_LENGTH} characters or less`;
    }

    // Date validation (if dates are provided)
    if (formData.check_in_date && formData.check_out_date) {
      if (new Date(formData.check_out_date) <= new Date(formData.check_in_date)) {
        newErrors.check_out_date = 'Check-out date must be after check-in date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const submitData: CreateInquiryInput = {
      campsite_id: campsiteId,
      guest_name: formData.guest_name.trim(),
      guest_email: formData.guest_email.trim(),
      guest_phone: formData.guest_phone ? formData.guest_phone.replace(/[\s-]/g, '') : undefined,
      inquiry_type: formData.inquiry_type,
      message: formData.message.trim(),
      check_in_date: formData.check_in_date || undefined,
      check_out_date: formData.check_out_date || undefined,
    };

    await onSubmit(submitData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const messageLength = formData.message.length;
  const isMessageValid = messageLength >= MIN_MESSAGE_LENGTH && messageLength <= MAX_MESSAGE_LENGTH;

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-5', className)}>
      {/* Inquiry Type Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          Inquiry Type
        </label>
        <div className="flex flex-wrap gap-2">
          {inquiryTypeOptions.map((option) => (
            <Button
              key={option.value}
              type="button"
              variant={formData.inquiry_type === option.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleInputChange('inquiry_type', option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Name */}
      <div className="space-y-2">
        <label htmlFor="guest_name" className="text-sm font-medium text-gray-700">
          Your Name <span className="text-red-500">*</span>
        </label>
        <input
          id="guest_name"
          type="text"
          value={formData.guest_name}
          onChange={(e) => handleInputChange('guest_name', e.target.value)}
          placeholder="Enter your full name"
          maxLength={100}
          className={cn(
            'w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
            errors.guest_name ? 'border-red-500' : 'border-gray-200'
          )}
        />
        {errors.guest_name && (
          <p className="text-sm text-red-500">{errors.guest_name}</p>
        )}
      </div>

      {/* Email */}
      <div className="space-y-2">
        <label htmlFor="guest_email" className="text-sm font-medium text-gray-700">
          Email Address <span className="text-red-500">*</span>
        </label>
        <input
          id="guest_email"
          type="email"
          value={formData.guest_email}
          onChange={(e) => handleInputChange('guest_email', e.target.value)}
          placeholder="your.email@example.com"
          maxLength={255}
          className={cn(
            'w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
            errors.guest_email ? 'border-red-500' : 'border-gray-200'
          )}
        />
        {errors.guest_email && (
          <p className="text-sm text-red-500">{errors.guest_email}</p>
        )}
      </div>

      {/* Phone (Optional) */}
      <div className="space-y-2">
        <label htmlFor="guest_phone" className="text-sm font-medium text-gray-700">
          Phone Number <span className="text-gray-400">(optional)</span>
        </label>
        <input
          id="guest_phone"
          type="tel"
          value={formData.guest_phone}
          onChange={(e) => handleInputChange('guest_phone', e.target.value)}
          placeholder="081-234-5678"
          maxLength={20}
          className={cn(
            'w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
            errors.guest_phone ? 'border-red-500' : 'border-gray-200'
          )}
        />
        {errors.guest_phone && (
          <p className="text-sm text-red-500">{errors.guest_phone}</p>
        )}
      </div>

      {/* Dates Toggle */}
      <button
        type="button"
        onClick={() => setShowDates(!showDates)}
        className="text-sm text-primary hover:underline"
      >
        {showDates ? 'Hide dates' : 'Add check-in/out dates (optional)'}
      </button>

      {/* Check-in / Check-out Dates */}
      {showDates && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="space-y-2">
            <label htmlFor="check_in_date" className="text-sm font-medium text-gray-700">
              Check-in Date
            </label>
            <input
              id="check_in_date"
              type="date"
              value={formData.check_in_date}
              onChange={(e) => handleInputChange('check_in_date', e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="check_out_date" className="text-sm font-medium text-gray-700">
              Check-out Date
            </label>
            <input
              id="check_out_date"
              type="date"
              value={formData.check_out_date}
              onChange={(e) => handleInputChange('check_out_date', e.target.value)}
              min={formData.check_in_date || new Date().toISOString().split('T')[0]}
              className={cn(
                'w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
                errors.check_out_date ? 'border-red-500' : 'border-gray-200'
              )}
            />
            {errors.check_out_date && (
              <p className="text-sm text-red-500">{errors.check_out_date}</p>
            )}
          </div>
        </div>
      )}

      {/* Message */}
      <div className="space-y-2">
        <label htmlFor="message" className="text-sm font-medium text-gray-700">
          Your Message <span className="text-red-500">*</span>
        </label>
        <textarea
          id="message"
          value={formData.message}
          onChange={(e) => handleInputChange('message', e.target.value)}
          placeholder={`Hi, I'm interested in ${campsiteName}. I would like to ask about...`}
          rows={5}
          maxLength={MAX_MESSAGE_LENGTH}
          className={cn(
            'w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none',
            errors.message ? 'border-red-500' : 'border-gray-200'
          )}
        />
        <div className="flex justify-between text-xs">
          <span className={cn(
            messageLength < MIN_MESSAGE_LENGTH ? 'text-gray-500' : 'text-green-600'
          )}>
            {messageLength < MIN_MESSAGE_LENGTH
              ? `Minimum ${MIN_MESSAGE_LENGTH} characters`
              : 'Message length OK'}
          </span>
          <span className={cn(
            messageLength > MAX_MESSAGE_LENGTH ? 'text-red-500' : 'text-gray-500'
          )}>
            {messageLength}/{MAX_MESSAGE_LENGTH}
          </span>
        </div>
        {errors.message && (
          <p className="text-sm text-red-500">{errors.message}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={isSubmitting || !isMessageValid}
        >
          {isSubmitting ? 'Sending...' : 'Send Inquiry'}
        </Button>
      </div>
    </form>
  );
}

export default InquiryForm;
