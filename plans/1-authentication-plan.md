# Plan: Authentication (Module 1)

## Module Information
- **Module:** 1
- **Name:** Authentication & Authorization
- **Priority:** CRITICAL
- **Sprint:** 1
- **Story Points:** 14 (US-013: 8 + US-014: 6)
- **Dependencies:** Module 0 (Project Setup)
- **Related Clarifications:** Q1 (3 Roles: Admin, Owner, User), Q9 (Owner Registration Flow)

---

## Overview

Implement Supabase Auth with 3-role authorization system:
- **Admin:** Moderate reviews, manage all campsites, view platform analytics
- **Owner:** Manage own campsites, view own analytics, respond to inquiries
- **User:** Browse, search, review, wishlist, send inquiries

---

## Features

### 1.1 User Registration (US-013)
**Priority:** CRITICAL

**Flow:**
1. User fills signup form (email, password, full_name)
2. Supabase Auth creates user in auth.users
3. Trigger creates profile with `role = 'user'`
4. Verification email sent
5. User clicks verification link
6. Account activated

**Frontend Components:**
```
src/app/auth/signup/page.tsx          # Signup page
src/components/auth/SignupForm.tsx     # Form component
src/components/auth/PasswordStrength.tsx # Password indicator
```

**API Contracts:**
```typescript
// Supabase Auth handles signup directly
// POST /auth/v1/signup (Supabase internal)

// Profile is auto-created via trigger
// No custom API needed for basic signup
```

**Zod Schema:**
```typescript
// packages/shared/src/schemas/auth.ts
export const signupSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[0-9]/, 'Password must contain a number'),
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  phone: z.string().regex(/^0[0-9]{9}$/, 'Invalid Thai phone number').optional(),
});
```

### 1.2 User Login (US-014)
**Priority:** CRITICAL

**Flow:**
1. User enters email/password
2. Supabase Auth validates credentials
3. JWT access token (1h) + refresh token (7d) issued
4. Tokens stored in HTTP-only cookies via `@supabase/ssr`
5. User redirected to previous page or home

**Frontend Components:**
```
src/app/auth/login/page.tsx           # Login page
src/components/auth/LoginForm.tsx      # Form component
src/components/auth/ForgotPassword.tsx # Password reset
```

**Middleware (Route Protection):**
```typescript
// src/middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { /* cookie config */ } }
  );

  const { data: { session } } = await supabase.auth.getSession();

  // Protected routes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!session) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }

  return response;
}
```

### 1.3 Google OAuth
**Priority:** HIGH

**Flow:**
1. User clicks "Continue with Google"
2. Redirect to Google OAuth consent
3. User authorizes
4. Callback creates/links Supabase user
5. Profile auto-created if new
6. User logged in

**Configuration:**
```typescript
// Supabase Dashboard → Auth → Providers → Google
// Set Client ID and Secret from Google Cloud Console

// Frontend usage
const handleGoogleLogin = async () => {
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
};
```

### 1.4 Owner Registration Flow (Q9)
**Priority:** HIGH

**Flow:**
1. User clicks "Register as Owner"
2. Fills business verification form
3. Request stored with `status = 'pending'`
4. Admin reviews in dashboard
5. Approved → `role = 'owner'`
6. User can now create campsites

**Database Table:**
```sql
CREATE TABLE owner_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  business_name VARCHAR(200) NOT NULL,
  business_registration VARCHAR(50),
  contact_phone VARCHAR(20) NOT NULL,
  address TEXT,
  reason TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**API Endpoints:**
```typescript
// POST /api/auth/request-owner
interface OwnerRequestDto {
  business_name: string;
  business_registration?: string;
  contact_phone: string;
  address?: string;
  reason?: string;
}

interface OwnerRequestResponse {
  id: string;
  status: 'pending';
  message: string;
}

// GET /api/admin/owner-requests (admin only)
// PATCH /api/admin/owner-requests/:id (approve/reject)
```

### 1.5 Role-Based Access Control
**Priority:** CRITICAL

**RLS Policies:**
```sql
-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = auth_user_id);

-- Users can update own profile (except role)
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

-- Admin can read all profiles
CREATE POLICY "Admin can read all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE auth_user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admin can update any profile
CREATE POLICY "Admin can update any profile"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE auth_user_id = auth.uid() AND role = 'admin'
    )
  );
```

**Frontend Hook:**
```typescript
// src/hooks/useAuth.ts
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = profile?.role === 'admin';
  const isOwner = profile?.role === 'owner';
  const isUser = profile?.role === 'user';

  const canManageCampsite = (campsiteOwnerId: string) => {
    return isAdmin || (isOwner && profile?.id === campsiteOwnerId);
  };

  return { user, profile, loading, isAdmin, isOwner, isUser, canManageCampsite };
}
```

### 1.6 Password Reset
**Priority:** HIGH

**Flow:**
1. User clicks "Forgot Password"
2. Enters email address
3. Supabase sends reset email
4. User clicks link (valid 24h)
5. Sets new password
6. Redirected to login

---

## Technical Design

### Database Schema (from CLARIFICATIONS.md)
```sql
-- Already in DATABASE-SCHEMA.md
CREATE TYPE user_role AS ENUM ('admin', 'owner', 'user');

CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    avatar_url TEXT,
    bio TEXT,
    role user_role DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Frontend Components

```
src/
├── app/
│   └── auth/
│       ├── signup/
│       │   └── page.tsx
│       ├── login/
│       │   └── page.tsx
│       ├── callback/
│       │   └── route.ts        # OAuth callback handler
│       ├── reset-password/
│       │   └── page.tsx
│       └── become-owner/
│           └── page.tsx
├── components/
│   └── auth/
│       ├── SignupForm.tsx
│       ├── LoginForm.tsx
│       ├── ForgotPasswordForm.tsx
│       ├── ResetPasswordForm.tsx
│       ├── OwnerRequestForm.tsx
│       ├── PasswordStrength.tsx
│       └── AuthGuard.tsx       # Route protection wrapper
├── hooks/
│   └── useAuth.ts
└── lib/
    └── supabase/
        ├── client.ts           # Browser client
        └── server.ts           # Server client
```

### Backend Endpoints

```typescript
// apps/campsite-backend/src/routes/auth.ts

// POST /api/auth/request-owner
router.post('/request-owner', authMiddleware, async (req, res) => {
  const { user } = req;
  const body = ownerRequestSchema.parse(req.body);

  // Check if already owner or has pending request
  // Create owner_request record
  // Send email to admin
});

// GET /api/auth/profile
router.get('/profile', authMiddleware, async (req, res) => {
  // Return current user's profile with role
});
```

---

## Test Cases

### Unit Tests
- [ ] Signup schema validates correctly
- [ ] Login schema validates correctly
- [ ] Password strength validation works
- [ ] Phone number validation (Thai format)

### Integration Tests
- [ ] Supabase Auth signup creates user
- [ ] Profile trigger creates profile record
- [ ] Login returns valid session
- [ ] OAuth callback handles new/existing users
- [ ] Password reset email sends

### E2E Tests (Playwright)
- [ ] User can sign up with valid data
- [ ] User cannot sign up with invalid email
- [ ] User cannot sign up with weak password
- [ ] User can log in with correct credentials
- [ ] User cannot log in with wrong password
- [ ] Account locks after 5 failed attempts
- [ ] Password reset flow completes
- [ ] Google OAuth flow works
- [ ] User can request owner upgrade
- [ ] Protected routes redirect to login

---

## Definition of Done

- [ ] Signup form validates and creates user
- [ ] Verification email received within 1 minute
- [ ] Login works with valid credentials
- [ ] Invalid credentials fail gracefully
- [ ] OAuth redirects complete authorization flow
- [ ] Token refresh works transparently
- [ ] Role-based access enforced
- [ ] Owner request flow complete
- [ ] Unit tests >80% coverage
- [ ] E2E tests passing

---

## Security Considerations

1. **Password Storage:** Handled by Supabase (bcrypt)
2. **Token Security:** HTTP-only cookies, CSRF protection
3. **Rate Limiting:** Max 5 login attempts per 15 minutes
4. **Session Timeout:** 1 hour inactivity
5. **Email Verification:** Required before full access
6. **OAuth Security:** State parameter to prevent CSRF

---

## Estimated Effort

| Task | Effort |
|------|--------|
| Signup form & validation | 4 hours |
| Login form & session | 3 hours |
| Google OAuth setup | 2 hours |
| Password reset flow | 2 hours |
| Owner request flow | 4 hours |
| Role-based middleware | 3 hours |
| RLS policies | 2 hours |
| Testing | 4 hours |
| **Total** | **~24 hours (3 days)** |
