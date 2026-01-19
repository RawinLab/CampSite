# Seeding Guide

คู่มือการสร้างข้อมูลทดสอบสำหรับ Camping Thailand Platform

## Overview

ระบบ Seeding ประกอบด้วย 2 ส่วนหลัก:
1. **User Seeding** - สร้าง test users (Admin, Owner, Regular User)
2. **Data Seeding** - สร้างข้อมูล campsites, reviews, inquiries, wishlists

## Quick Start

```bash
# 1. Start Supabase locally
cd supabase && npx supabase start

# 2. Seed test users
node scripts/seed-test-users.js

# 3. Seed comprehensive data (requires users first)
SUPABASE_URL=http://127.0.0.1:54321 \
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key> \
pnpm --filter="@campsite/backend" exec -- npx tsx ../../scripts/seed-data-final.ts
```

## Test Users

### Default Test Accounts

| Email | Password | Role | Purpose |
|-------|----------|------|---------|
| `admin@campsite.local` | `Admin123!` | admin | Admin dashboard testing |
| `admin2@campsite.local` | `Admin123!` | admin | Secondary admin |
| `owner@campsite.local` | `Owner123!` | owner | Owner dashboard testing |
| `owner2@campsite.local` | `Owner123!` | owner | Krabi campsites owner |
| `owner3@campsite.local` | `Owner123!` | owner | Khao Yai campsites owner |
| `user@campsite.local` | `User123!` | user | Regular user testing |
| `user2@campsite.local` | `User123!` | user | Review testing |
| `user3@campsite.local` | `User123!` | user | Regular camper |
| `user4@campsite.local` | `User123!` | user | Owner request testing |

### Create Users Script

```bash
# Using local Supabase
node scripts/seed-test-users.js

# Using remote Supabase
SUPABASE_URL=https://your-project.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=your-service-key \
node scripts/seed-test-users.js
```

## Seeding Data

### Comprehensive Seed Script

สร้างข้อมูลครบถ้วนสำหรับการทดสอบทุกระบบ:

```bash
# Local development
SUPABASE_URL=http://127.0.0.1:54321 \
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... \
pnpm --filter="@campsite/backend" exec -- npx tsx ../../scripts/seed-data-final.ts
```

### Data Created

| Entity | Count | Description |
|--------|-------|-------------|
| Campsites | 13 | 10 approved, 2 pending, 1 rejected |
| Reviews | 6 | Various ratings and comments |
| Inquiries | 5 | Different statuses |
| Wishlists | 12 | User favorites |
| Analytics Events | Multiple | Profile views, clicks |
| Owner Requests | 1 | Pending approval |

### Sample Campsites

ข้อมูลแคมป์ไซต์ที่สร้างขึ้นมาพร้อม GPS coordinates จริงในประเทศไทย:

| Name | Province | Status | Type |
|------|----------|--------|------|
| ม่อนแจ่ม แคมปิ้ง | เชียงใหม่ | approved | camping |
| ดอยอินทนนท์ รีสอร์ท แอนด์ แคมป์ | เชียงใหม่ | approved | glamping |
| ภูชี้ฟ้า รีสอร์ท | เชียงราย | approved | resort |
| ไร่เลย์ บีช แคมป์ | กระบี่ | approved | beach |
| เกาะลันตา แกลมปิ้ง | กระบี่ | approved | glamping |
| หาดสุรินทร์ ลักซ์ชัวรี่ เต็นท์ | ภูเก็ต | approved | glamping |
| เขาใหญ่ แคมปิ้ง กราวด์ | นครราชสีมา | approved | camping |
| เขาใหญ่ แกลมปิ้ง | นครราชสีมา | approved | glamping |
| ภูกระดึง เบส แคมป์ | เลย | approved | camping |
| แพริมน้ำแคว | กาญจนบุรี | approved | raft |
| ทดสอบ แคมป์ใหม่ | เชียงใหม่ | pending | camping |
| ทดสอบ แกลมปิ้ง | กระบี่ | pending | glamping |
| แคมป์ถูกปฏิเสธ | เชียงใหม่ | rejected | camping |

## E2E Testing Setup

### Prerequisites

```bash
# 1. Start Supabase
cd supabase && npx supabase start

# 2. Start backend (port 3091)
pnpm --filter="@campsite/backend" dev

# 3. Start frontend (port 3090)
pnpm --filter="@campsite/frontend" dev

# 4. Run E2E tests
pnpm test:e2e
```

### Environment Variables for E2E

```bash
# tests/e2e/utils/auth.ts uses:
API_BASE_URL=http://localhost:3091
FRONTEND_URL=http://localhost:3090

# Backend uses:
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-key
```

## Scripts Reference

### `/scripts/seed-test-users.js`

สร้าง test users ผ่าน Supabase Admin API:

```javascript
// Environment variables
SUPABASE_URL     // default: http://127.0.0.1:54321
SUPABASE_SERVICE_ROLE_KEY  // default: local demo key
```

### `/scripts/seed-data-final.ts`

สร้างข้อมูลทดสอบครบถ้วน:

```typescript
// Environment variables (required)
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

## Database Schema Notes

### Important ID Mappings

```
auth.users.id (auth_user_id) ≠ profiles.id (profile_id)
                           ↓
                    linked via profiles.auth_user_id
```

เมื่อทำงานกับ `campsites.owner_id`:
- `owner_id` references `profiles.id` (ไม่ใช่ `auth.users.id`)
- ต้อง lookup profile.id จาก auth_user_id ก่อนใช้งาน

### Column Names

| Table | Column | Note |
|-------|--------|------|
| campsites | `rating_average` | ไม่ใช่ `average_rating` |
| campsites | `review_count` | จำนวนรีวิว |
| profiles | `auth_user_id` | FK to auth.users.id |

## Troubleshooting

### RLS Policy Blocking Inserts

```
Error: new row violates row-level security policy
```

**Solution:** Use service role key ที่ bypass RLS หรือใช้ direct database connection

### User Not Found

```
Error: Owner test user not found. Run seed-test-users.ts first.
```

**Solution:** รัน user seeding script ก่อน data seeding

### Wrong Database

```
Error: Seeding to production instead of local
```

**Solution:** ตรวจสอบ environment variables:
```bash
echo $SUPABASE_URL  # Should be http://127.0.0.1:54321 for local
```

### JWT Signature Invalid

```
Error: invalid JWT: unable to parse or verify signature
```

**Solution:** Supabase version อาจใช้ key format ใหม่ ตรวจสอบ `npx supabase status` สำหรับ keys ที่ถูกต้อง

## Clean Up

### Delete All Seeded Data

```sql
-- Delete in order to respect foreign keys
DELETE FROM review_reports WHERE id LIKE 'e2e-test-%';
DELETE FROM reviews WHERE id LIKE 'e2e-test-%';
DELETE FROM inquiries WHERE id LIKE 'e2e-test-%';
DELETE FROM owner_requests WHERE id LIKE 'e2e-test-%';
DELETE FROM campsite_photos WHERE campsite_id IN (SELECT id FROM campsites WHERE id LIKE 'e2e-test-%');
DELETE FROM campsite_amenities WHERE campsite_id IN (SELECT id FROM campsites WHERE id LIKE 'e2e-test-%');
DELETE FROM campsites WHERE id LIKE 'e2e-test-%';
```

### Reset Database

```bash
pnpm db:reset  # Resets database and re-runs migrations
```

## Related Documentation

- [Database Schema](../requirements/DATABASE-SCHEMA.md)
- [E2E Test Utils](../tests/e2e/utils/)
- [Backend API Routes](../apps/campsite-backend/src/routes/)
