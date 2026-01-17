import { z } from 'zod';

export const campsiteSearchSchema = z.object({
  query: z.string().optional(),
  province_id: z.coerce.number().optional(),
  type: z.enum(['camping', 'glamping', 'tented-resort', 'bungalow']).optional(),
  min_price: z.coerce.number().min(0).optional(),
  max_price: z.coerce.number().max(10000).optional(),
  amenities: z.array(z.number()).optional(),
  min_rating: z.coerce.number().min(0).max(5).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
  sort_by: z.enum(['rating', 'price_asc', 'price_desc', 'newest']).default('rating'),
});

export const campsiteCreateSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().min(50, 'Description must be at least 50 characters'),
  province_id: z.number(),
  address: z.string().min(10),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  campsite_type: z.enum(['camping', 'glamping', 'tented-resort', 'bungalow']),
  check_in_time: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM format'),
  check_out_time: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM format'),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  booking_url: z.string().url().optional(),
  amenity_ids: z.array(z.number()).optional(),
});

export type CampsiteSearchInput = z.infer<typeof campsiteSearchSchema>;
export type CampsiteCreateInput = z.infer<typeof campsiteCreateSchema>;
