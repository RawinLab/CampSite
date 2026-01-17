import { z } from 'zod';

// Dashboard Stats Query
export const dashboardStatsQuerySchema = z.object({
  period: z.coerce.number().min(7).max(90).default(30),
});

export type DashboardStatsQuery = z.infer<typeof dashboardStatsQuerySchema>;

// Analytics Chart Query
export const analyticsChartQuerySchema = z.object({
  period: z.coerce.number().min(7).max(90).default(30),
  campsite_id: z.string().uuid().optional(),
});

export type AnalyticsChartQuery = z.infer<typeof analyticsChartQuerySchema>;

// Owner Campsites List Query
export const ownerCampsitesQuerySchema = z.object({
  status: z.enum(['all', 'pending', 'approved', 'rejected']).default('all'),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
  sort: z.enum(['name', 'created_at', 'views', 'inquiries']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export type OwnerCampsitesQuery = z.infer<typeof ownerCampsitesQuerySchema>;

// Create Campsite (Owner)
export const createCampsiteSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(200),
  description: z.string().min(50, 'Description must be at least 50 characters').max(5000),
  province_id: z.coerce.number().positive(),
  address: z.string().min(10, 'Address must be at least 10 characters').max(500),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  campsite_type_id: z.coerce.number().positive(),
  check_in_time: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM format'),
  check_out_time: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM format'),
  phone: z.string().max(20).optional().nullable(),
  email: z.string().email('Invalid email').max(255).optional().nullable(),
  website: z.string().url('Invalid URL').max(500).optional().nullable(),
  booking_url: z.string().url('Invalid URL').max(500).optional().nullable(),
  min_price: z.coerce.number().min(0).default(0),
  max_price: z.coerce.number().min(0).default(0),
  amenity_ids: z.array(z.coerce.number()).optional().default([]),
});

export type CreateCampsiteInput = z.infer<typeof createCampsiteSchema>;

// Update Campsite (Owner)
export const updateCampsiteSchema = createCampsiteSchema.partial();

export type UpdateCampsiteInput = z.infer<typeof updateCampsiteSchema>;

// Photo Upload
export const photoUploadParamsSchema = z.object({
  campsite_id: z.string().uuid(),
});

export const photoMetadataSchema = z.object({
  alt_text: z.string().max(200).optional(),
  is_primary: z.boolean().optional().default(false),
  sort_order: z.coerce.number().min(0).optional(),
});

export type PhotoMetadata = z.infer<typeof photoMetadataSchema>;

// Photo Reorder
export const photoReorderSchema = z.object({
  photos: z.array(z.object({
    id: z.string().uuid(),
    sort_order: z.number().min(0),
  })),
});

export type PhotoReorderInput = z.infer<typeof photoReorderSchema>;

// Amenities Update
export const amenitiesUpdateSchema = z.object({
  amenity_ids: z.array(z.coerce.number()),
});

export type AmenitiesUpdateInput = z.infer<typeof amenitiesUpdateSchema>;
