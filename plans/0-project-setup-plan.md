# Plan: Project Setup (Module 0)

## Module Information
- **Module:** 0
- **Name:** Project Setup
- **Priority:** CRITICAL
- **Sprint:** 0 (Setup)
- **Story Points:** 5
- **Dependencies:** None
- **Related Clarifications:** Q4 (Tailwind + shadcn/ui), Q5 (Supabase Migrations)

---

## Overview

Set up Turborepo monorepo with pnpm workspaces, including:
- `apps/campsite-frontend` (Next.js 14+ App Router)
- `apps/campsite-backend` (Express + TypeScript)
- `packages/shared` (Zod schemas, types, utilities)
- Supabase configuration and initial migration
- Tailwind CSS + shadcn/ui setup

---

## Features

### 0.1 Turborepo Monorepo Structure
**Priority:** CRITICAL

```
campsite/
├── apps/
│   ├── campsite-frontend/    # Next.js 14+ (App Router)
│   │   ├── src/
│   │   │   ├── app/          # App Router pages
│   │   │   ├── components/   # UI components
│   │   │   ├── lib/          # Utilities
│   │   │   └── styles/       # Global styles
│   │   ├── public/
│   │   ├── package.json
│   │   └── next.config.js
│   └── campsite-backend/     # Express + TypeScript
│       ├── src/
│       │   ├── routes/       # API routes
│       │   ├── controllers/  # Route handlers
│       │   ├── services/     # Business logic
│       │   ├── middleware/   # Auth, validation, etc.
│       │   └── utils/        # Helpers
│       ├── package.json
│       └── tsconfig.json
├── packages/
│   ├── shared/               # Shared types, Zod schemas
│   │   ├── src/
│   │   │   ├── schemas/      # Zod validation schemas
│   │   │   ├── types/        # TypeScript types
│   │   │   └── utils/        # Shared utilities
│   │   └── package.json
│   └── config/               # Shared configs
│       ├── eslint/
│       ├── typescript/
│       └── package.json
├── supabase/
│   ├── migrations/           # SQL migration files
│   ├── seed.sql             # Seed data
│   └── config.toml
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
└── .gitignore
```

### 0.2 Package Dependencies

**Root package.json:**
```json
{
  "name": "campsite",
  "private": true,
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "test": "turbo test",
    "db:migrate": "supabase db push",
    "db:reset": "supabase db reset"
  },
  "devDependencies": {
    "turbo": "^2.0.0"
  },
  "packageManager": "pnpm@8.15.0"
}
```

**apps/campsite-frontend/package.json:**
```json
{
  "name": "campsite-frontend",
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "@supabase/supabase-js": "^2.45.0",
    "@supabase/ssr": "^0.5.0",
    "tailwindcss": "^3.4.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0",
    "lucide-react": "^0.400.0",
    "zod": "^3.23.0",
    "@campsite/shared": "workspace:*"
  }
}
```

**apps/campsite-backend/package.json:**
```json
{
  "name": "campsite-backend",
  "dependencies": {
    "express": "^4.19.0",
    "@supabase/supabase-js": "^2.45.0",
    "zod": "^3.23.0",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.2.0",
    "@campsite/shared": "workspace:*"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "typescript": "^5.4.0",
    "tsx": "^4.7.0"
  }
}
```

### 0.3 Supabase Configuration

**supabase/config.toml:**
```toml
[api]
enabled = true
port = 54321

[db]
port = 54322
major_version = 15

[studio]
enabled = true
port = 54323

[auth]
enabled = true
site_url = "http://localhost:3000"
additional_redirect_urls = ["http://localhost:3000/auth/callback"]

[auth.external.google]
enabled = true
client_id = "env(GOOGLE_CLIENT_ID)"
secret = "env(GOOGLE_CLIENT_SECRET)"
```

### 0.4 Tailwind + shadcn/ui Setup (Q4)

**tailwind.config.js:**
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Custom camping theme colors
        primary: {
          DEFAULT: "hsl(142, 76%, 36%)", // Forest green
          foreground: "hsl(0, 0%, 100%)",
        },
        secondary: {
          DEFAULT: "hsl(35, 78%, 47%)", // Earth brown
          foreground: "hsl(0, 0%, 100%)",
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

**shadcn/ui components to install:**
```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card dialog form input label textarea select checkbox radio-group tabs avatar badge skeleton toast dropdown-menu sheet separator
```

### 0.5 Environment Variables

**.env.local (frontend):**
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_API_URL=http://localhost:4000
```

**.env (backend):**
```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
MAILGUN_API_KEY=
MAILGUN_DOMAIN=
PORT=4000
NODE_ENV=development
```

---

## Technical Design

### API Contracts

**Health Check Endpoint:**
```typescript
// GET /api/health
interface HealthResponse {
  status: 'ok' | 'error';
  timestamp: string;
  version: string;
}
```

### Shared Types (packages/shared)

```typescript
// packages/shared/src/types/user.ts
export type UserRole = 'admin' | 'owner' | 'user';

export interface Profile {
  id: string;
  auth_user_id: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  bio?: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

// packages/shared/src/schemas/auth.ts
import { z } from 'zod';

export const signupSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
});

export type SignupInput = z.infer<typeof signupSchema>;
```

---

## Test Cases

### Unit Tests
- [ ] Turbo tasks execute correctly (dev, build, lint)
- [ ] pnpm workspaces link packages correctly
- [ ] Shared package exports types and schemas
- [ ] Environment variables load correctly

### Integration Tests
- [ ] Frontend connects to Supabase
- [ ] Backend connects to Supabase
- [ ] Hot reload works for both apps
- [ ] Build caching functional

### E2E Tests
- [ ] `pnpm install` completes without errors
- [ ] `pnpm dev` starts both apps
- [ ] `pnpm build` produces production builds
- [ ] Frontend accessible at localhost:3000
- [ ] Backend health check returns 200

---

## Definition of Done

- [ ] Turborepo configured with proper task dependencies
- [ ] pnpm workspaces configured
- [ ] Shared TypeScript configs working
- [ ] ESLint + Prettier shared configs
- [ ] Hot reload working for both apps
- [ ] Build caching functional
- [ ] Supabase CLI initialized
- [ ] Initial migration ready
- [ ] shadcn/ui components installed
- [ ] README with setup instructions
- [ ] Environment variables documented

---

## Implementation Steps

1. Initialize Turborepo with pnpm
2. Create apps/campsite-frontend with Next.js 14+
3. Create apps/campsite-backend with Express + TypeScript
4. Create packages/shared with types and Zod schemas
5. Create packages/config with shared ESLint/TypeScript configs
6. Configure turbo.json for task orchestration
7. Initialize Supabase in project root
8. Set up Tailwind CSS in frontend
9. Install shadcn/ui components
10. Create initial database migration from DATABASE-SCHEMA.md
11. Test dev, build, and lint commands
12. Document setup in README.md

---

## Estimated Effort

| Task | Effort |
|------|--------|
| Turborepo setup | 2 hours |
| Frontend scaffolding | 2 hours |
| Backend scaffolding | 2 hours |
| Shared packages | 1 hour |
| Supabase setup | 2 hours |
| shadcn/ui setup | 1 hour |
| Initial migration | 2 hours |
| Testing & docs | 2 hours |
| **Total** | **~14 hours (2 days)** |
