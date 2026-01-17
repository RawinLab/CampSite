import { z } from 'zod';

// Inquiry Status Enum
export const inquiryStatusSchema = z.enum(['new', 'in_progress', 'resolved', 'closed']);
export const inquiryTypeSchema = z.enum(['booking', 'general', 'complaint', 'other']);

// Thai phone validation regex: 0 followed by 9 digits (e.g., 0812345678)
// Accepts formats: 0812345678, 081-234-5678, 081 234 5678
export const thaiPhoneSchema = z.string()
  .transform(val => val.replace(/[\s-]/g, '')) // Remove spaces and dashes
  .refine(
    val => !val || /^0\d{9}$/.test(val),
    { message: 'Invalid Thai phone number format (e.g., 0812345678)' }
  )
  .optional()
  .nullable();

// Date validation for check-in/check-out
export const dateStringSchema = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
  .optional()
  .nullable();

// Inquiry List Query (Owner Dashboard)
export const inquiryListQuerySchema = z.object({
  status: z.enum(['all', 'new', 'in_progress', 'resolved', 'closed']).default('all'),
  campsite_id: z.string().uuid().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
  sort: z.enum(['created_at', 'status', 'inquiry_type']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export type InquiryListQuery = z.infer<typeof inquiryListQuerySchema>;

// Inquiry Reply (Owner)
export const inquiryReplySchema = z.object({
  reply: z.string()
    .min(10, 'Reply must be at least 10 characters')
    .max(2000, 'Reply must be at most 2000 characters'),
});

export type InquiryReplyInput = z.infer<typeof inquiryReplySchema>;

// Inquiry Status Update (Owner)
export const inquiryStatusUpdateSchema = z.object({
  status: inquiryStatusSchema,
});

export type InquiryStatusUpdateInput = z.infer<typeof inquiryStatusUpdateSchema>;

// Create Inquiry (User/Guest) - for contact form
export const createInquirySchema = z.object({
  campsite_id: z.string().uuid('Invalid campsite ID'),
  guest_name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters'),
  guest_email: z.string()
    .email('Invalid email address')
    .max(255, 'Email must be at most 255 characters'),
  guest_phone: thaiPhoneSchema,
  inquiry_type: inquiryTypeSchema.default('general'),
  subject: z.string().max(200).optional().nullable(),
  message: z.string()
    .min(20, 'Message must be at least 20 characters')
    .max(2000, 'Message must be at most 2000 characters'),
  check_in_date: dateStringSchema,
  check_out_date: dateStringSchema,
  guest_count: z.coerce.number().min(1).max(100).optional().nullable(),
  accommodation_type_id: z.string().uuid().optional().nullable(),
}).refine(
  (data) => {
    // Validate that check_out_date is after check_in_date if both are provided
    if (data.check_in_date && data.check_out_date) {
      return new Date(data.check_out_date) > new Date(data.check_in_date);
    }
    return true;
  },
  {
    message: 'Check-out date must be after check-in date',
    path: ['check_out_date'],
  }
);

export type CreateInquirySchemaInput = z.input<typeof createInquirySchema>;
// Note: CreateInquiryInput type is exported from types/inquiry.ts to avoid duplicate exports
