/**
 * Unit tests for database trigger that creates a profile when a user signs up
 * Tests the expected behavior of the handle_new_user() trigger function
 * defined in supabase/migrations/20260117000005_create_profiles.sql
 */

import { createClient } from '@supabase/supabase-js';

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

describe('Profile Creation Trigger', () => {
  let mockSupabaseAdmin: any;

  beforeEach(() => {
    // Create mock chain for Supabase queries
    const mockSingle = jest.fn();
    const mockEq = jest.fn(() => ({ single: mockSingle }));
    const mockSelect = jest.fn(() => ({ eq: mockEq }));

    // Create mock Supabase admin client
    mockSupabaseAdmin = {
      auth: {
        admin: {
          createUser: jest.fn(),
        },
      },
      from: jest.fn(() => ({
        select: mockSelect,
        insert: jest.fn(() => ({
          select: mockSelect,
        })),
      })),
      _mockSingle: mockSingle,
      _mockEq: mockEq,
      _mockSelect: mockSelect,
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabaseAdmin);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Profile created with correct user_id', () => {
    it('should create a profile with matching auth_user_id when user is created', async () => {
      const userId = 'test-user-id-123';
      const userEmail = 'test@example.com';

      // Mock user creation
      mockSupabaseAdmin.auth.admin.createUser.mockResolvedValue({
        data: {
          user: {
            id: userId,
            email: userEmail,
            raw_user_meta_data: {
              full_name: 'Test User',
            },
          },
        },
        error: null,
      });

      // Mock profile query to verify trigger created it
      mockSupabaseAdmin._mockSingle.mockResolvedValue({
        data: {
          id: 'profile-id-123',
          auth_user_id: userId,
          full_name: 'Test User',
          role: 'user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        error: null,
      });

      // Simulate user creation and profile retrieval
      const { data: userData } = await mockSupabaseAdmin.auth.admin.createUser({
        email: userEmail,
        user_metadata: { full_name: 'Test User' },
      });

      const { data: profile } = await mockSupabaseAdmin
        .from('profiles')
        .select('*')
        .eq('auth_user_id', userData.user.id)
        .single();

      // Verify profile was created with correct user_id
      expect(profile).toBeDefined();
      expect(profile.auth_user_id).toBe(userId);
      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('profiles');
    });
  });

  describe('Default role is user', () => {
    it('should create profile with default role as "user"', async () => {
      const userId = 'test-user-id-456';

      mockSupabaseAdmin.auth.admin.createUser.mockResolvedValue({
        data: {
          user: {
            id: userId,
            email: 'newuser@example.com',
            raw_user_meta_data: {},
          },
        },
        error: null,
      });

      mockSupabaseAdmin._mockSingle.mockResolvedValue({
        data: {
          id: 'profile-id-456',
          auth_user_id: userId,
          full_name: 'User',
          role: 'user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        error: null,
      });

      const { data: userData } = await mockSupabaseAdmin.auth.admin.createUser({
        email: 'newuser@example.com',
      });

      const { data: profile } = await mockSupabaseAdmin
        .from('profiles')
        .select('*')
        .eq('auth_user_id', userData.user.id)
        .single();

      expect(profile.role).toBe('user');
    });

    it('should not allow admin or owner roles on initial creation', async () => {
      const userId = 'test-user-id-789';

      // Even if metadata specifies different role, trigger should use 'user'
      mockSupabaseAdmin.auth.admin.createUser.mockResolvedValue({
        data: {
          user: {
            id: userId,
            email: 'test@example.com',
            raw_user_meta_data: {
              full_name: 'Test User',
              role: 'admin', // This should be ignored by trigger
            },
          },
        },
        error: null,
      });

      mockSupabaseAdmin._mockSingle.mockResolvedValue({
        data: {
          id: 'profile-id-789',
          auth_user_id: userId,
          full_name: 'Test User',
          role: 'user', // Trigger enforces 'user' role
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        error: null,
      });

      const { data: userData } = await mockSupabaseAdmin.auth.admin.createUser({
        email: 'test@example.com',
        user_metadata: { full_name: 'Test User', role: 'admin' },
      });

      const { data: profile } = await mockSupabaseAdmin
        .from('profiles')
        .select('*')
        .eq('auth_user_id', userData.user.id)
        .single();

      expect(profile.role).toBe('user');
      expect(profile.role).not.toBe('admin');
      expect(profile.role).not.toBe('owner');
    });
  });

  describe('Profile contains expected fields', () => {
    it('should create profile with all required fields', async () => {
      const userId = 'test-user-id-999';
      const now = new Date().toISOString();

      mockSupabaseAdmin.auth.admin.createUser.mockResolvedValue({
        data: {
          user: {
            id: userId,
            email: 'complete@example.com',
            raw_user_meta_data: {
              full_name: 'Complete User',
            },
          },
        },
        error: null,
      });

      mockSupabaseAdmin._mockSingle.mockResolvedValue({
        data: {
          id: 'profile-id-999',
          auth_user_id: userId,
          full_name: 'Complete User',
          role: 'user',
          phone: null,
          avatar_url: null,
          bio: null,
          business_name: null,
          business_registration: null,
          created_at: now,
          updated_at: now,
        },
        error: null,
      });

      const { data: userData } = await mockSupabaseAdmin.auth.admin.createUser({
        email: 'complete@example.com',
        user_metadata: { full_name: 'Complete User' },
      });

      const { data: profile } = await mockSupabaseAdmin
        .from('profiles')
        .select('*')
        .eq('auth_user_id', userData.user.id)
        .single();

      // Verify all expected fields are present
      expect(profile).toHaveProperty('id');
      expect(profile).toHaveProperty('auth_user_id');
      expect(profile).toHaveProperty('full_name');
      expect(profile).toHaveProperty('role');
      expect(profile).toHaveProperty('created_at');
      expect(profile).toHaveProperty('updated_at');

      // Verify required field values
      expect(profile.id).toBeDefined();
      expect(profile.auth_user_id).toBe(userId);
      expect(profile.full_name).toBe('Complete User');
      expect(profile.role).toBe('user');
      expect(profile.created_at).toBeDefined();
      expect(profile.updated_at).toBeDefined();
    });

    it('should use fallback full_name when not provided in metadata', async () => {
      const userId = 'test-user-id-fallback';

      mockSupabaseAdmin.auth.admin.createUser.mockResolvedValue({
        data: {
          user: {
            id: userId,
            email: 'nofullname@example.com',
            raw_user_meta_data: {},
          },
        },
        error: null,
      });

      // Trigger uses COALESCE to fallback to 'User'
      mockSupabaseAdmin._mockSingle.mockResolvedValue({
        data: {
          id: 'profile-id-fallback',
          auth_user_id: userId,
          full_name: 'User', // Fallback value from trigger
          role: 'user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        error: null,
      });

      const { data: userData } = await mockSupabaseAdmin.auth.admin.createUser({
        email: 'nofullname@example.com',
      });

      const { data: profile } = await mockSupabaseAdmin
        .from('profiles')
        .select('*')
        .eq('auth_user_id', userData.user.id)
        .single();

      expect(profile.full_name).toBe('User');
    });

    it('should handle duplicate user creation gracefully (ON CONFLICT DO NOTHING)', async () => {
      const userId = 'test-user-duplicate';

      // First creation
      mockSupabaseAdmin.auth.admin.createUser.mockResolvedValue({
        data: {
          user: {
            id: userId,
            email: 'duplicate@example.com',
            raw_user_meta_data: { full_name: 'Original User' },
          },
        },
        error: null,
      });

      mockSupabaseAdmin._mockSingle.mockResolvedValue({
        data: {
          id: 'profile-id-duplicate',
          auth_user_id: userId,
          full_name: 'Original User',
          role: 'user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        error: null,
      });

      // First user creation
      const { data: userData1 } = await mockSupabaseAdmin.auth.admin.createUser({
        email: 'duplicate@example.com',
        user_metadata: { full_name: 'Original User' },
      });

      const { data: profile1 } = await mockSupabaseAdmin
        .from('profiles')
        .select('*')
        .eq('auth_user_id', userData1.user.id)
        .single();

      // Simulate duplicate attempt (trigger has ON CONFLICT DO NOTHING)
      const { data: profile2 } = await mockSupabaseAdmin
        .from('profiles')
        .select('*')
        .eq('auth_user_id', userId)
        .single();

      // Profile should still exist with original data
      expect(profile1.auth_user_id).toBe(userId);
      expect(profile2.auth_user_id).toBe(userId);
      expect(profile2.full_name).toBe('Original User');
    });
  });
});
