describe('Supabase Client', () => {
  beforeEach(() => {
    jest.resetModules();
    // Set test environment variables
    process.env.SUPABASE_URL = 'http://localhost:54321';
    process.env.SUPABASE_ANON_KEY = 'test-anon-key';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
  });

  it('creates admin client with service role key', () => {
    const { supabaseAdmin } = require('../../src/lib/supabase');
    expect(supabaseAdmin).toBeDefined();
  });

  it('createSupabaseClient returns admin client when no token', () => {
    const { createSupabaseClient, supabaseAdmin } = require('../../src/lib/supabase');
    const client = createSupabaseClient();
    expect(client).toBe(supabaseAdmin);
  });

  it('createSupabaseClient creates new client with token', () => {
    const { createSupabaseClient, supabaseAdmin } = require('../../src/lib/supabase');
    const client = createSupabaseClient('user-token');
    expect(client).not.toBe(supabaseAdmin);
    expect(client).toBeDefined();
  });
});
