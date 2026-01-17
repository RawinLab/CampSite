import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy initialization to ensure environment variables are loaded
let _supabaseAdmin: SupabaseClient | null = null;

function getSupabaseUrl(): string {
  const url = process.env.SUPABASE_URL;
  if (!url) {
    throw new Error('SUPABASE_URL environment variable is not set');
  }
  return url;
}

function getSupabaseServiceKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is not set');
  }
  return key;
}

// Admin client with service role key (bypasses RLS) - lazy loaded
export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient(getSupabaseUrl(), getSupabaseServiceKey(), {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return _supabaseAdmin;
}

// For backward compatibility
export const supabaseAdmin = {
  get from() { return getSupabaseAdmin().from.bind(getSupabaseAdmin()); },
  get auth() { return getSupabaseAdmin().auth; },
  get storage() { return getSupabaseAdmin().storage; },
  get rpc() { return getSupabaseAdmin().rpc.bind(getSupabaseAdmin()); },
};

// Create client with user's JWT token for RLS-enabled queries
export function createSupabaseClient(accessToken?: string): SupabaseClient {
  if (!accessToken) {
    return getSupabaseAdmin();
  }

  return createClient(getSupabaseUrl(), process.env.SUPABASE_ANON_KEY!, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}
