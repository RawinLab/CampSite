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
