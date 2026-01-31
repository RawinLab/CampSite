# Camping Thailand Platform

## Project Overview
Camping platform for Thailand - browse, search, review campsites. Three roles: Admin, Owner, User.

## Tech Stack
- **Frontend:** Next.js 14+ (App Router), Tailwind CSS, shadcn/ui
- **Backend:** Express + TypeScript (Cloud Run)
- **Database:** Supabase (PostgreSQL + Auth + Storage)
- **Monorepo:** Turborepo + pnpm workspaces

## Project Structure
```
apps/
  campsite-frontend/    # Next.js app
  campsite-backend/     # Express API
packages/
  shared/               # Types, Zod schemas
supabase/
  migrations/           # SQL migrations
```

## Key References

### Requirements (Read First)
- `requirements/CLARIFICATIONS.md` - 18 key technical decisions (Q1-Q18)
- `requirements/DATABASE-SCHEMA.md` - 15 tables, ERD, RLS policies
- `requirements/SRS-Camping.md` - Technical specifications
- `requirements/USER-STORIES-Camping.md` - 22 user stories
- `requirements/PRD-Camping.md` - Product requirements

### Development Plans
- `plans/00-master-todolist.md` - Master coordination (start here)
- `plans/{N}-{module}-plan.md` - Module design docs
- `plans/{N}-{module}-todolist.md` - Actionable tasks with tests

## Design System (MANDATORY)
**ทุกหน้าและทุก component ต้องใช้ Design System เสมอ** — ห้ามใช้สีหรือ style hardcode

### ขั้นตอนก่อนสร้าง/แก้ไข UI
1. อ่าน `design-system/camping-thailand/MASTER.md` ก่อนเริ่มงานเสมอ
2. ใช้ design tokens จาก `globals.css` และ `tailwind.config.js` เท่านั้น
3. ห้ามใช้ค่าสี hex/rgb โดยตรง — ใช้ `brand-green`, `brand-coral`, `brand-text`, `brand-bg` แทน
4. ตรวจสอบ component ที่มีอยู่ใน `components/ui/` ก่อนสร้างใหม่

### Brand Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `brand-green` | #2D5A3D | Primary actions, links, icons, prices |
| `brand-coral` | #E07A5F | CTA buttons (booking), accents, alerts |
| `brand-text` | #2B2D42 | Headings, body text |
| `brand-bg` / `background-warm` | #F7F5F0 | Page backgrounds |
| `forest-700` | #1e3d29 | Hover state for brand-green |

### Style Rules
- **Style:** Organic Biophilic — rounded corners, nature-inspired, warm earth tones
- **Typography:** Noto Sans Thai (primary), Outfit (English headings)
- **Icons:** Lucide React only — no emojis as UI icons
- **Border radius:** `rounded-2xl` (cards), `rounded-xl` (buttons/inputs), `rounded-3xl` (hero elements)
- **Transitions:** 150-300ms with `ease-organic` timing, use `transition-all duration-300`
- **Hover:** `hover:-translate-y-1 hover:shadow-xl` for cards, `hover:bg-forest-700` for green buttons
- **Accessibility:** WCAG AA, 4.5:1 contrast, `cursor-pointer` on all clickable elements
- **Thai-first:** All UI text in Thai, bilingual where needed
- **Images:** Use Next.js `<Image>` with `loading="lazy"` and proper `sizes` prop
- **Skeletons:** Use `<Skeleton>` from shadcn/ui for loading states

### Reference
- Full design system: `design-system/camping-thailand/MASTER.md`

## Architecture Rules
- **Frontend communicates through API only** - No direct Supabase/database calls from frontend
- All auth (login, register, logout, refresh) goes through Backend API
- All data queries go through Backend API
- Frontend only uses Supabase Storage URLs for images (CDN, no API calls)

## Key Decisions (from CLARIFICATIONS.md)
- Q1: 3 roles via `user_role` enum in profiles table
- Q5: Supabase migrations (not Prisma)
- Q8: Admin approval required for campsites
- Q11: Auto-approve reviews + report-based moderation
- Q17: Skeleton screens for loading states
- Q18: Rate limiting (5 inquiries/24h per user)

## Commands
```bash
pnpm dev          # Start dev servers
pnpm build        # Production build
pnpm test         # Run tests
pnpm db:migrate   # Apply migrations
```

## Execution
```bash
/rw-kit:execute plans/00-master-todolist.md   # Full project
/rw-kit:execute plans/{N}-{module}-todolist.md # Single module
```
