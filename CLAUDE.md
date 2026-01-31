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

## Design System
- **Always use the design system tokens** defined in `globals.css` and `tailwind.config.js` for consistency across all pages
- **Brand Colors:** `brand-green` (#2D5A3D), `brand-coral` (#E07A5F), `brand-text` (#2B2D42), `brand-bg` (#F7F5F0)
- **Style:** Organic Biophilic - rounded corners (16-24px), nature-inspired, warm earth tones
- **Typography:** Noto Sans Thai (primary), Outfit (English headings)
- **Icons:** Lucide React only - no emojis as UI icons
- **Border radius:** `rounded-2xl` (cards), `rounded-xl` (buttons/inputs), `rounded-3xl` (hero elements)
- **Transitions:** 150-300ms with `ease-organic` timing
- **Accessibility:** WCAG AA, 4.5:1 contrast, `cursor-pointer` on all clickable elements
- **Thai-first:** All UI text in Thai, use brand color tokens instead of hardcoded hex values
- **Images:** Use Next.js `<Image>` with `loading="lazy"` and proper `sizes` prop
- Reference: `design-system/camping-thailand/MASTER.md`

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
