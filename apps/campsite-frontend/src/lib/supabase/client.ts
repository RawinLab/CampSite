import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Singleton pattern to avoid creating multiple clients
let supabaseClient: ReturnType<typeof createSupabaseClient> | null = null;

export function createClient() {
  if (supabaseClient) {
    return supabaseClient;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  supabaseClient = createSupabaseClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'campsite-auth',
      flowType: 'implicit',
    },
  });

  return supabaseClient;
}
