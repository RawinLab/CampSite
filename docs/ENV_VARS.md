# Environment Variables

This document describes all environment variables used in the Camping Thailand platform.

## Frontend (`apps/campsite-frontend/.env.local`)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL | `http://localhost:54321` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key (public) | `eyJhbGc...` |
| `NEXT_PUBLIC_API_URL` | Yes | Backend API URL | `http://localhost:4000` |
| `NEXT_PUBLIC_SITE_URL` | Yes | Frontend site URL | `http://localhost:3000` |

### Development Values

```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-local-anon-key>
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## Backend (`apps/campsite-backend/.env`)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `PORT` | No | Server port (default: 4000) | `4000` |
| `NODE_ENV` | No | Environment mode | `development` |
| `SUPABASE_URL` | Yes | Supabase project URL | `http://localhost:54321` |
| `SUPABASE_ANON_KEY` | Yes | Supabase anonymous key | `eyJhbGc...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (secret) | `eyJhbGc...` |
| `CORS_ORIGIN` | No | Allowed CORS origin | `http://localhost:3000` |
| `MAILGUN_API_KEY` | Yes | Mailgun API key for emails | `key-xxx` |
| `MAILGUN_DOMAIN` | Yes | Mailgun sending domain | `mg.example.com` |
| `RATE_LIMIT_WINDOW_MS` | No | Rate limit window (ms) | `900000` |
| `RATE_LIMIT_MAX_REQUESTS` | No | Max requests per window | `100` |

### Development Values

```env
PORT=4000
NODE_ENV=development
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=<your-local-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-local-service-key>
CORS_ORIGIN=http://localhost:3000
MAILGUN_API_KEY=<your-mailgun-key>
MAILGUN_DOMAIN=<your-mailgun-domain>
```

---

## Supabase Local Development

When running `supabase start`, you'll get local credentials:

```
API URL: http://localhost:54321
anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Studio URL: http://localhost:54323
```

Copy these values to your `.env` files.

---

## Production Deployment

### Vercel (Frontend)

Set these in Vercel project settings:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
- `NEXT_PUBLIC_API_URL` - Your Cloud Run API URL
- `NEXT_PUBLIC_SITE_URL` - Your production domain

### Cloud Run (Backend)

Set these as Cloud Run environment variables or secrets:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - (Secret) Your Supabase service role key
- `MAILGUN_API_KEY` - (Secret) Your Mailgun API key
- `MAILGUN_DOMAIN` - Your Mailgun domain
- `CORS_ORIGIN` - Your frontend production URL
- `NODE_ENV=production`

---

## Security Notes

1. **Never commit `.env` files** - They are in `.gitignore`
2. **Service role key is secret** - Only use on backend, never expose to frontend
3. **Use environment-specific values** - Different keys for dev/staging/prod
4. **Rotate keys periodically** - Especially after security incidents
