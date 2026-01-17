describe('Supabase Client', () => {
  beforeEach(() => {
    jest.resetModules();
    // Set test environment variables
    process.env.SUPABASE_URL = 'http://localhost:54321';
    process.env.SUPABASE_ANON_KEY = 'test-anon-key';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
  });

  it('creates admin client with service role key', () => {
    const { getSupabaseAdmin } = require('../../src/lib/supabase');
    const adminClient = getSupabaseAdmin();
    expect(adminClient).toBeDefined();
    expect(adminClient.from).toBeDefined();
    expect(adminClient.auth).toBeDefined();
  });

  it('supabaseAdmin proxy provides access to client methods', () => {
    const { supabaseAdmin } = require('../../src/lib/supabase');
    expect(supabaseAdmin).toBeDefined();
    expect(supabaseAdmin.from).toBeDefined();
    expect(supabaseAdmin.auth).toBeDefined();
  });

  it('createSupabaseClient returns admin client when no token', () => {
    const { createSupabaseClient, getSupabaseAdmin } = require('../../src/lib/supabase');
    const client = createSupabaseClient();
    const adminClient = getSupabaseAdmin();
    expect(client).toBe(adminClient);
  });

  it('createSupabaseClient creates new client with token', () => {
    const { createSupabaseClient, getSupabaseAdmin } = require('../../src/lib/supabase');
    const client = createSupabaseClient('user-token');
    const adminClient = getSupabaseAdmin();
    expect(client).not.toBe(adminClient);
    expect(client).toBeDefined();
  });
});
