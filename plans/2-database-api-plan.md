# Plan: Database & API Foundation (Module 2)

## Module Information
- **Module:** 2
- **Name:** Database & API Foundation
- **Priority:** CRITICAL
- **Sprint:** 1
- **Story Points:** 8
- **Dependencies:** Module 0 (Project Setup)
- **Related Clarifications:** Q5 (Supabase Migrations), Q7 (Simple text search)

---

## Overview

Implement complete database schema and Express API foundation:
- Execute all migrations from DATABASE-SCHEMA.md
- Set up RLS policies
- Create base Express API structure
- Implement core CRUD endpoints

---

## Features

### 2.1 Database Migrations (Q5)
**Priority:** CRITICAL

Execute migrations in order using Supabase CLI:

```bash
supabase/migrations/
├── 00001_create_enums.sql
├── 00002_create_provinces.sql
├── 00003_create_campsite_types.sql
├── 00004_create_amenities.sql
├── 00005_create_profiles.sql
├── 00006_create_campsites.sql
├── 00007_create_campsite_amenities.sql
├── 00008_create_accommodation_types.sql
├── 00009_create_campsite_photos.sql
├── 00010_create_reviews.sql
├── 00011_create_review_photos.sql
├── 00012_create_review_helpful.sql
├── 00013_create_wishlists.sql
├── 00014_create_inquiries.sql
├── 00015_create_nearby_attractions.sql
├── 00016_create_analytics_events.sql
├── 00017_create_owner_requests.sql
├── 00018_create_indexes.sql
├── 00019_enable_rls.sql
├── 00020_create_policies.sql
├── 00021_create_functions.sql
├── 00022_create_triggers.sql
└── 00023_seed_data.sql
```

**Key Migration: 00001_create_enums.sql**
```sql
-- User role enum (Q1)
CREATE TYPE user_role AS ENUM ('admin', 'owner', 'user');

-- Campsite status enum (Q8)
CREATE TYPE campsite_status AS ENUM ('pending', 'approved', 'rejected');

-- Other enums
CREATE TYPE reviewer_type AS ENUM ('family', 'couple', 'solo', 'group');
CREATE TYPE inquiry_type AS ENUM ('booking', 'general', 'complaint', 'other');
CREATE TYPE inquiry_status AS ENUM ('new', 'in_progress', 'resolved', 'closed');
CREATE TYPE attraction_category AS ENUM ('hiking', 'waterfall', 'temple', 'viewpoint', 'lake', 'cave', 'market', 'other');
CREATE TYPE difficulty_level AS ENUM ('easy', 'moderate', 'hard');
CREATE TYPE event_type AS ENUM (
    'page_view', 'search', 'campsite_view',
    'inquiry_sent', 'booking_click', 'wishlist_add'
);
```

### 2.2 Seed Data
**Priority:** HIGH

**Provinces (77 Thai provinces):**
```sql
-- supabase/migrations/00023_seed_data.sql
INSERT INTO provinces (name_th, name_en, slug, latitude, longitude, region) VALUES
('กรุงเทพมหานคร', 'Bangkok', 'bangkok', 13.7563, 100.5018, 'central'),
('เชียงใหม่', 'Chiang Mai', 'chiang-mai', 18.7883, 98.9853, 'north'),
('เชียงราย', 'Chiang Rai', 'chiang-rai', 19.9105, 99.8406, 'north'),
-- ... all 77 provinces
```

**Campsite Types:**
```sql
INSERT INTO campsite_types (name_th, name_en, slug, color_hex) VALUES
('แคมป์ปิ้ง', 'Camping', 'camping', '#FF4444'),
('แกลมปิ้ง', 'Glamping', 'glamping', '#44FF44'),
('รีสอร์ทเต็นท์', 'Tented Resort', 'tented-resort', '#FF8844'),
('บังกะโล', 'Bungalow', 'bungalow', '#FFFF44');
```

**Amenities:**
```sql
INSERT INTO amenities (name_th, name_en, slug, icon) VALUES
('WiFi', 'WiFi', 'wifi', 'wifi'),
('ไฟฟ้า', 'Electricity', 'electricity', 'zap'),
('แอร์', 'Air Conditioning', 'ac', 'snowflake'),
('น้ำอุ่น', 'Hot Water', 'hot-water', 'droplet'),
('ห้องน้ำส่วนตัว', 'Private Bathroom', 'private-bathroom', 'bath'),
('ร้านอาหาร', 'Restaurant', 'restaurant', 'utensils'),
('ห้องครัว', 'Kitchen', 'kitchen', 'chef-hat'),
('ที่จอดรถ', 'Parking', 'parking', 'car');
```

### 2.3 Express API Structure
**Priority:** CRITICAL

```
apps/campsite-backend/src/
├── index.ts                # Entry point
├── app.ts                  # Express app setup
├── routes/
│   ├── index.ts           # Route aggregator
│   ├── auth.ts            # Auth routes
│   ├── campsites.ts       # Campsite routes
│   ├── reviews.ts         # Review routes
│   ├── wishlists.ts       # Wishlist routes
│   ├── inquiries.ts       # Inquiry routes
│   ├── search.ts          # Search routes
│   └── admin.ts           # Admin routes
├── controllers/
│   ├── campsiteController.ts
│   ├── reviewController.ts
│   ├── wishlistController.ts
│   ├── inquiryController.ts
│   └── searchController.ts
├── services/
│   ├── campsiteService.ts
│   ├── reviewService.ts
│   ├── searchService.ts
│   └── emailService.ts
├── middleware/
│   ├── auth.ts            # JWT validation
│   ├── roleGuard.ts       # Role-based access
│   ├── validate.ts        # Zod validation
│   ├── rateLimit.ts       # Rate limiting
│   └── errorHandler.ts    # Error handling
├── utils/
│   ├── supabase.ts        # Supabase client
│   ├── logger.ts          # Winston logger
│   └── response.ts        # Response helpers
└── types/
    └── express.d.ts       # Express type extensions
```

### 2.4 Core API Endpoints
**Priority:** CRITICAL

**Campsites:**
```typescript
// GET /api/campsites
interface CampsitesQuery {
  province?: string;
  type?: string[];
  priceMin?: number;
  priceMax?: number;
  amenities?: string[];
  sort?: 'rating' | 'price_asc' | 'price_desc' | 'newest';
  page?: number;
  limit?: number;
}

interface CampsitesResponse {
  data: CampsiteCard[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// GET /api/campsites/:id
interface CampsiteDetailResponse {
  campsite: CampsiteDetail;
  accommodations: AccommodationType[];
  photos: CampsitePhoto[];
  amenities: Amenity[];
  nearbyAttractions: NearbyAttraction[];
  reviewSummary: ReviewSummary;
}

// POST /api/campsites (owner only)
// PATCH /api/campsites/:id (owner only)
// DELETE /api/campsites/:id (owner only)
```

**Reviews:**
```typescript
// GET /api/campsites/:id/reviews
interface ReviewsQuery {
  sort?: 'newest' | 'helpful' | 'rating_high' | 'rating_low';
  reviewerType?: ReviewerType;
  page?: number;
  limit?: number;
}

// POST /api/campsites/:id/reviews (authenticated)
interface CreateReviewDto {
  rating_overall: number;
  rating_cleanliness?: number;
  rating_staff?: number;
  rating_facilities?: number;
  rating_value?: number;
  reviewer_type: ReviewerType;
  title?: string;
  content: string;
  visited_at?: string;
  // photos uploaded separately
}
```

**Search (Q7: Simple text match):**
```typescript
// GET /api/search
interface SearchQuery {
  q: string;  // Search query
  province?: string;
  type?: string[];
  priceMin?: number;
  priceMax?: number;
  amenities?: string[];
  sort?: 'rating' | 'price_asc' | 'price_desc' | 'newest';
  page?: number;
  limit?: number;
}

// Implementation uses PostgreSQL ILIKE or tsvector
// User chooses sort order (no complex relevance scoring)
```

### 2.5 Middleware Implementation
**Priority:** CRITICAL

**Auth Middleware:**
```typescript
// src/middleware/auth.ts
import { createClient } from '@supabase/supabase-js';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
  );

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  // Fetch profile with role
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('auth_user_id', user.id)
    .single();

  req.user = user;
  req.profile = profile;
  next();
};
```

**Role Guard:**
```typescript
// src/middleware/roleGuard.ts
export const requireRole = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.profile || !roles.includes(req.profile.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

// Usage: router.post('/admin/approve', requireRole('admin'), controller);
```

**Validation Middleware:**
```typescript
// src/middleware/validate.ts
import { ZodSchema } from 'zod';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors
      });
    }
  };
};
```

**Rate Limiting:**
```typescript
// src/middleware/rateLimit.ts
import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: { error: 'Too many requests, please try again later' },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // 10 auth attempts per window
  message: { error: 'Too many auth attempts' },
});

export const inquiryLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 5, // 5 inquiries per day (Q18)
  keyGenerator: (req) => req.profile?.id || req.ip,
});
```

---

## Technical Design

### Shared Schemas (packages/shared)

```typescript
// packages/shared/src/schemas/campsite.ts
import { z } from 'zod';

export const campsiteCardSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  price_min: z.number(),
  price_max: z.number(),
  rating_average: z.number(),
  review_count: z.number(),
  province: z.object({
    name_th: z.string(),
    name_en: z.string(),
    slug: z.string(),
  }),
  type: z.object({
    name_th: z.string(),
    name_en: z.string(),
    slug: z.string(),
    color_hex: z.string(),
  }),
  primary_photo: z.string().nullable(),
  amenities: z.array(z.string()),
});

export const searchQuerySchema = z.object({
  q: z.string().optional(),
  province: z.string().optional(),
  type: z.array(z.string()).optional(),
  priceMin: z.coerce.number().min(0).optional(),
  priceMax: z.coerce.number().max(100000).optional(),
  amenities: z.array(z.string()).optional(),
  sort: z.enum(['rating', 'price_asc', 'price_desc', 'newest']).default('rating'),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
});
```

### Supabase Client Setup

```typescript
// apps/campsite-backend/src/utils/supabase.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@campsite/shared/types/database';

export const supabaseAdmin = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// For user-context queries (respects RLS)
export const createUserClient = (accessToken: string) => {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    }
  );
};
```

---

## Test Cases

### Unit Tests
- [ ] All Zod schemas validate correctly
- [ ] Middleware functions work as expected
- [ ] Service functions handle errors

### Integration Tests
- [ ] Database migrations execute without errors
- [ ] RLS policies enforce access correctly
- [ ] API endpoints return correct data
- [ ] Rate limiting works

### E2E Tests
- [ ] Search returns paginated results
- [ ] Filters work correctly
- [ ] Sort options work
- [ ] Authentication protects routes
- [ ] Role-based access enforced

---

## Definition of Done

- [ ] All 23 migrations executed successfully
- [ ] Seed data populated (provinces, types, amenities)
- [ ] Express app starts without errors
- [ ] Core CRUD endpoints working
- [ ] Auth middleware validates tokens
- [ ] Role guard protects routes
- [ ] Validation middleware rejects invalid data
- [ ] Rate limiting configured
- [ ] Error handling consistent
- [ ] OpenAPI documentation generated
- [ ] Unit tests >80% coverage

---

## Estimated Effort

| Task | Effort |
|------|--------|
| Create all migrations | 4 hours |
| Seed data | 2 hours |
| Express app setup | 2 hours |
| Middleware implementation | 3 hours |
| Core endpoints | 6 hours |
| Shared schemas | 2 hours |
| Testing | 4 hours |
| Documentation | 2 hours |
| **Total** | **~25 hours (3 days)** |
