# Camping Thailand - Clarified Requirements

**Document Version:** 1.0
**Last Updated:** January 17, 2026
**Clarified by:** /clarify command

---

## Clarifications Made

### Q1: Authorization - User Roles

**Question:** ระบบควรมี User Roles อะไรบ้าง?

**Answer:** **3 Roles: Admin, Owner, User**

**Impact:**
- Add `role` field to profiles table: `ENUM ('admin', 'owner', 'user')`
- Admin can: moderate reviews, manage all campsites, view platform analytics
- Owner can: manage own campsites, view own analytics, respond to inquiries
- User can: browse, search, review, wishlist, send inquiries

**Schema Change Required:**
```sql
CREATE TYPE user_role AS ENUM ('admin', 'owner', 'user');
ALTER TABLE profiles ADD COLUMN role user_role DEFAULT 'user';
-- Remove is_owner boolean, use role instead
```

---

### Q2: Business Logic - Premium/Featured Listings

**Question:** Premium/Featured Listings ควรทำอย่างไรใน MVP?

**Answer:** **Basic featured flag only**

**Impact:**
- Add `is_featured` boolean to campsites table
- Admin can mark/unmark featured status
- Featured campsites appear in homepage carousel
- No payment/subscription system in MVP

**Schema Change Required:**
```sql
ALTER TABLE campsites ADD COLUMN is_featured BOOLEAN DEFAULT FALSE;
CREATE INDEX idx_campsites_featured ON campsites(is_featured) WHERE is_featured = TRUE;
```

---

### Q3: Integration - Image Processing

**Question:** Image Processing ควรทำที่ไหน?

**Answer:** **Supabase Storage Transform**

**Impact:**
- Use Supabase Storage built-in image transformation
- No additional backend code for image processing
- Configure storage policies for size limits
- Use transform URLs for different sizes (thumbnail, gallery, full)

**Implementation:**
```javascript
// Example: Get transformed image URL
const thumbnailUrl = supabase.storage
  .from('campsite-photos')
  .getPublicUrl('photo.jpg', {
    transform: { width: 300, height: 200, resize: 'cover' }
  })
```

---

### Q4: UI/UX - Design System

**Question:** Frontend ควรใช้ Design System อะไร?

**Answer:** **Tailwind CSS + shadcn/ui**

**Impact:**
- Install Tailwind CSS in frontend
- Use shadcn/ui components (Button, Card, Dialog, Form, etc.)
- Customize theme in tailwind.config.js
- Components are copy-pasted, not npm dependency (easy to customize)

**Setup Required:**
```bash
# In apps/campsite-frontend
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card dialog form input
```

---

### Q5: Deployment - Database Migration Strategy

**Question:** Database Migration Strategy ใช้วิธีไหน?

**Answer:** **Supabase Migrations**

**Impact:**
- Use Supabase CLI for migrations
- SQL files in `supabase/migrations/` folder
- Use `supabase db diff` to generate migrations
- Use `supabase db push` for development
- Use `supabase db reset` to reset local database
- DATABASE-SCHEMA.md remains in SQL format

**Setup Required:**
```bash
# Install Supabase CLI
npm install -g supabase

# Initialize Supabase in project
supabase init

# Link to remote project
supabase link --project-ref <project-id>

# Generate migration from schema changes
supabase db diff -f <migration_name>

# Apply migrations
supabase db push
```

---

## Updated Tech Stack Summary

| Component | Technology | Notes |
|-----------|------------|-------|
| Architecture | Turborepo Monorepo (pnpm) | |
| Frontend | Next.js 14+ | App Router |
| UI Library | **Tailwind + shadcn/ui** | NEW |
| Backend | Express + TypeScript | |
| Database Client | **Supabase JS Client** | Direct queries |
| Migrations | **Supabase CLI** | supabase/migrations/ |
| Validation | Zod | Shared schemas |
| Auth | Supabase Auth | |
| Database | Supabase PostgreSQL | |
| Image Processing | **Supabase Storage Transform** | NEW |
| Hosting - Frontend | Firebase App Hosting | |
| Hosting - Backend | Cloud Run | |
| Maps | Leaflet + OpenStreetMap | |
| Email | Mailgun | |

---

## Schema Updates Required

### 1. Update profiles table - Add role enum

```sql
-- Create user_role enum (replaces is_owner boolean)
CREATE TYPE user_role AS ENUM ('admin', 'owner', 'user');

-- Add role column to profiles
ALTER TABLE profiles ADD COLUMN role user_role DEFAULT 'user';

-- Remove is_owner column (replaced by role)
ALTER TABLE profiles DROP COLUMN IF EXISTS is_owner;

-- Create index for role queries
CREATE INDEX idx_profiles_role ON profiles(role);
```

### 2. Update campsites table - Add featured and status

```sql
-- Create campsite_status enum
CREATE TYPE campsite_status AS ENUM ('pending', 'approved', 'rejected');

-- Add new columns to campsites
ALTER TABLE campsites ADD COLUMN is_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE campsites ADD COLUMN status campsite_status DEFAULT 'pending';

-- Create indexes
CREATE INDEX idx_campsites_featured ON campsites(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_campsites_status ON campsites(status);
```

### 3. Update reviews table - Change moderation approach

```sql
-- Remove status column (auto-approve approach)
ALTER TABLE reviews DROP COLUMN IF EXISTS status;

-- Add report tracking
ALTER TABLE reviews ADD COLUMN is_reported BOOLEAN DEFAULT FALSE;
ALTER TABLE reviews ADD COLUMN report_count INT DEFAULT 0;
ALTER TABLE reviews ADD COLUMN is_hidden BOOLEAN DEFAULT FALSE;

-- Create index for reported reviews
CREATE INDEX idx_reviews_reported ON reviews(is_reported) WHERE is_reported = TRUE;
```

---

## Assumptions Made

Based on clarifications, these assumptions are now confirmed:

1. **Admin Dashboard Access** - Only users with `role = 'admin'` can access admin features
2. **Owner Self-Service** - Owners can create and manage their own campsites without admin approval (but campsites may need verification)
3. **Review Moderation** - Admin approves reviews; auto-approve after owner has X verified reviews (future enhancement)
4. **Featured Rotation** - Manual admin selection for MVP; automated rotation in Phase 2
5. **Image Sizes** - Supabase Storage Transform handles: thumbnail (300x200), gallery (800x600), full (1920x1080)

---

### Q6: i18n - Language Support

**Question:** ระบบภาษา Thai/English ควรทำอย่างไร?

**Answer:** **Thai only for MVP**

**Impact:**
- No i18n setup needed in MVP
- All UI text in Thai
- Database fields with _th/_en suffixes ready for Phase 2
- English support added in Phase 2

---

### Q7: Search - Ranking Algorithm

**Question:** Search Algorithm ควรใช้วิธีไหนในการ rank ผลลัพธ์?

**Answer:** **Simple text match**

**Impact:**
- Use PostgreSQL ILIKE or tsvector for text search
- User chooses sort order: Rating, Newest, Price
- No complex relevance scoring in MVP

---

### Q8: Verification - Campsite Approval

**Question:** Campsite ใหม่ต้องผ่านการ verify จาก Admin ก่อนแสดงไหม?

**Answer:** **Admin approval required**

**Impact:**
- Add `status` enum to campsites: `pending`, `approved`, `rejected`
- New campsites default to `pending`
- Only `approved` campsites shown in search
- Admin dashboard shows pending campsites queue

**Schema Change Required:**
```sql
CREATE TYPE campsite_status AS ENUM ('pending', 'approved', 'rejected');
ALTER TABLE campsites ADD COLUMN status campsite_status DEFAULT 'pending';
```

---

### Q9: Registration - Owner Flow

**Question:** Owner สมัครเป็น Owner ได้อย่างไร?

**Answer:** **Self-service with verification**

**Impact:**
- User registers normally (role = 'user')
- User requests upgrade to Owner via form
- Admin reviews and approves/rejects
- Upon approval, role changes to 'owner'

**Flow:**
1. User clicks "Register as Owner"
2. Fills business verification form
3. Admin reviews in dashboard
4. Approved → role = 'owner'
5. Owner can now create campsites

---

### Q10: Data Model - Campsites per Owner

**Question:** Owner 1 คนสามารถมี Campsite ได้กี่แห่ง?

**Answer:** **Multiple campsites**

**Impact:**
- One owner can have unlimited campsites
- Dashboard shows list of owner's campsites
- No limit enforcement in MVP

---

### Q11: Moderation - Review Flow

**Question:** Review Moderation Flow ควรทำอย่างไร?

**Answer:** **Auto-approve, report to remove**

**Impact:**
- Reviews show immediately after submission
- Remove `status` = 'pending' workflow from reviews
- Add `is_reported` flag and report reason
- Admin can hide/delete reported reviews
- Simpler than original SRS specification

**Schema Change:**
```sql
-- Remove status column, add report tracking
ALTER TABLE reviews DROP COLUMN IF EXISTS status;
ALTER TABLE reviews ADD COLUMN is_reported BOOLEAN DEFAULT FALSE;
ALTER TABLE reviews ADD COLUMN report_count INT DEFAULT 0;
ALTER TABLE reviews ADD COLUMN is_hidden BOOLEAN DEFAULT FALSE;
```

---

### Q12: Notifications - Email Scope

**Question:** Email Notifications ควรส่งอะไรบ้างใน MVP?

**Answer:** **Essential only**

**Impact:**
- Email verification (signup)
- Inquiry received (to owner)
- Inquiry reply (to user)
- Password reset
- No marketing/reminder emails in MVP

---

### Q13: Analytics - Event Tracking

**Question:** Analytics Events ควร track อะไรบ้างใน MVP?

**Answer:** **Core metrics only**

**Impact:**
Track these events only:
- `page_view` - All pages
- `search` - Search queries
- `campsite_view` - Campsite detail page
- `inquiry_sent` - Inquiry submission
- `booking_click` - External booking link click
- `wishlist_add` - Add to wishlist

---

### Q14: State Management - Real-time

**Question:** Real-time Updates ต้องการใน MVP ไหม?

**Answer:** **No real-time in MVP**

**Impact:**
- No WebSocket/Supabase Realtime setup
- Standard request-response pattern
- Manual refresh for new data
- Real-time features in Phase 2

---

### Q15: SEO - Level

**Question:** SEO ควรทำระดับไหนใน MVP?

**Answer:** **Advanced SEO + AI Search support**

**Impact:**
- Meta tags (title, description, keywords)
- Open Graph / Twitter Cards
- JSON-LD structured data for:
  - Organization
  - LocalBusiness (each campsite)
  - Review (aggregate rating)
  - BreadcrumbList
- Dynamic sitemap.xml
- robots.txt
- Canonical URLs
- AI Search optimization (clear content structure)

---

### Q16: Error Handling - Error Pages

**Question:** Error Pages ควรทำอย่างไร?

**Answer:** **Custom branded pages**

**Impact:**
- Custom 404 page with search suggestions
- Custom 500 page with retry option
- Maintenance page template
- Branded design matching site theme

---

### Q17: UX - Loading States

**Question:** Loading States ควรแสดงแบบไหน?

**Answer:** **Skeleton screens**

**Impact:**
- Use skeleton placeholders during loading
- Skeleton for campsite cards, lists, detail sections
- Better perceived performance than spinners

---

### Q18: Security - Spam Protection

**Question:** Contact Form - รองรับ spam อย่างไร?

**Answer:** **Rate limiting only**

**Impact:**
- 5 inquiries per user per 24 hours (as in SRS)
- No CAPTCHA needed
- Rate limit by user ID (logged in) or IP (guest)

---

## Ambiguities Remaining (Truly Deferred)

These will be decided during implementation if needed:

1. **Email Template Design** - HTML template styling details
2. **Exact skeleton component designs** - Will match shadcn/ui patterns
3. **Admin notification preferences** - How admin gets notified of pending items

---

## Files to Update

Based on clarifications, these documents need updates:

- [x] CLARIFICATIONS.md (this file)
- [ ] DATABASE-SCHEMA.md - Add role enum, is_featured, update to Prisma format
- [ ] SRS-Camping.md - Add Tailwind + shadcn/ui, Prisma to tech stack
- [ ] PRD-Camping.md - Note about featured listings being manual in MVP

---

## Ready for Implementation

- [x] Critical ambiguities resolved (18/18)
- [x] Tech stack decisions finalized
- [x] Schema changes documented
- [x] Assumptions documented
- [x] Business flows clarified
- [x] UX patterns decided
- [x] SEO strategy defined

**Next Step:** Run `/plan-module` or start project setup

---

## Summary of All Clarifications

| # | Category | Decision |
|---|----------|----------|
| 1 | Authorization | 3 Roles: Admin, Owner, User |
| 2 | Business Logic | Basic featured flag (manual) |
| 3 | Integration | Supabase Storage Transform |
| 4 | UI/UX | Tailwind + shadcn/ui |
| 5 | Deployment | Supabase Migrations |
| 6 | i18n | Thai only for MVP |
| 7 | Search | Simple text match + user sort |
| 8 | Verification | Admin approval required |
| 9 | Registration | Self-service Owner upgrade |
| 10 | Data Model | Multiple campsites per owner |
| 11 | Moderation | Auto-approve + report system |
| 12 | Notifications | Essential emails only |
| 13 | Analytics | Core metrics only |
| 14 | State | No real-time in MVP |
| 15 | SEO | Advanced + AI Search ready |
| 16 | Error Pages | Custom branded |
| 17 | UX | Skeleton screens |
| 18 | Security | Rate limiting only |

---

**Clarified on:** January 17, 2026
**Clarified by:** /clarify command (extended)
