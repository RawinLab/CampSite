import { z } from 'zod';

// T006: Owner request Zod schema
export const ownerRequestSchema = z.object({
  business_name: z
    .string()
    .min(3, 'Business name must be at least 3 characters')
    .max(255, 'Business name must be at most 255 characters'),
  business_description: z
    .string()
    .min(20, 'Description must be at least 20 characters')
    .max(2000, 'Description must be at most 2000 characters'),
  contact_phone: z
    .string()
    .regex(
      /^(0[2-9]\d{7,8}|08\d{8}|09\d{8})$/,
      'Invalid Thai phone number'
    ),
});

export const ownerRequestStatusSchema = z.enum(['pending', 'approved', 'rejected']);

export const ownerRequestResponseSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  business_name: z.string(),
  business_description: z.string(),
  contact_phone: z.string(),
  status: ownerRequestStatusSchema,
  rejection_reason: z.string().nullable(),
  created_at: z.string(),
  reviewed_at: z.string().nullable(),
  reviewed_by: z.string().uuid().nullable(),
});

export const adminReviewSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  rejection_reason: z.string().optional(),
});

export type OwnerRequestInput = z.infer<typeof ownerRequestSchema>;
export type OwnerRequestStatus = z.infer<typeof ownerRequestStatusSchema>;
export type OwnerRequestResponse = z.infer<typeof ownerRequestResponseSchema>;
export type AdminReviewInput = z.infer<typeof adminReviewSchema>;
