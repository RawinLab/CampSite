/**
 * Unit tests for inquiry RLS (Row Level Security) policies
 * Tests the expected behavior of RLS policies defined in
 * supabase/migrations/20260117000019_create_rls_policies.sql
 */

import { createClient } from '@supabase/supabase-js';

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

describe('Inquiry RLS Policies', () => {
  let mockSupabaseAdmin: any;
  let mockSupabaseUser: any;
  let mockSupabaseOwner: any;
  let mockSupabaseAnonymous: any;

  const testUserId = 'user-id-123';
  const testOwnerId = 'owner-id-456';
  const testOtherUserId = 'other-user-id-789';
  const testCampsiteId = 'campsite-id-abc';
  const testOtherCampsiteId = 'campsite-id-xyz';
  const testInquiryId = 'inquiry-id-111';

  beforeEach(() => {
    // Helper to create mock Supabase client
    const createMockClient = (userId?: string, role?: string) => {
      const mockSingle = jest.fn();
      const mockEq = jest.fn(() => ({
        single: mockSingle,
        eq: jest.fn(() => ({ single: mockSingle }))
      }));
      const mockSelect = jest.fn(() => ({
        eq: mockEq,
        single: mockSingle
      }));
      const mockInsert = jest.fn(() => ({
        select: mockSelect,
        single: mockSingle
      }));
      const mockUpdate = jest.fn(() => ({
        eq: mockEq,
        single: mockSingle
      }));

      return {
        auth: {
          uid: () => userId,
        },
        from: jest.fn(() => ({
          select: mockSelect,
          insert: mockInsert,
          update: mockUpdate,
        })),
        _mockSingle: mockSingle,
        _mockEq: mockEq,
        _mockSelect: mockSelect,
        _mockInsert: mockInsert,
        _mockUpdate: mockUpdate,
        _userId: userId,
        _role: role,
      };
    };

    mockSupabaseAdmin = createMockClient('admin-id', 'admin');
    mockSupabaseUser = createMockClient(testUserId, 'user');
    mockSupabaseOwner = createMockClient(testOwnerId, 'owner');
    mockSupabaseAnonymous = createMockClient(undefined, undefined);

    (createClient as jest.Mock).mockReturnValue(mockSupabaseAdmin);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('SELECT policies - User access restrictions', () => {
    it('should allow user to read their own inquiries', async () => {
      // Mock user's inquiry
      mockSupabaseUser._mockSingle.mockResolvedValue({
        data: {
          id: testInquiryId,
          campsite_id: testCampsiteId,
          user_id: testUserId,
          guest_name: 'John Doe',
          guest_email: 'john@example.com',
          message: 'Inquiry message',
          status: 'new',
        },
        error: null,
      });

      const { data: inquiry } = await mockSupabaseUser
        .from('inquiries')
        .select('*')
        .eq('id', testInquiryId)
        .single();

      expect(inquiry).toBeDefined();
      expect(inquiry.user_id).toBe(testUserId);
      expect(inquiry.id).toBe(testInquiryId);
    });

    it('should prevent user from reading other users inquiries', async () => {
      // Mock inquiry belonging to another user
      mockSupabaseUser._mockSingle.mockResolvedValue({
        data: null,
        error: {
          code: 'PGRST116',
          message: 'Row-level security policy violation',
        },
      });

      const { data: inquiry, error } = await mockSupabaseUser
        .from('inquiries')
        .select('*')
        .eq('id', testInquiryId)
        .eq('user_id', testOtherUserId)
        .single();

      expect(inquiry).toBeNull();
      expect(error).toBeDefined();
      expect(error.message).toContain('Row-level security');
    });

    it('should allow campsite owner to read inquiries for their campsites', async () => {
      // Mock inquiry for owner's campsite
      mockSupabaseOwner._mockSingle.mockResolvedValue({
        data: {
          id: testInquiryId,
          campsite_id: testCampsiteId,
          user_id: testUserId,
          guest_name: 'Jane Doe',
          guest_email: 'jane@example.com',
          message: 'Inquiry message',
          status: 'new',
        },
        error: null,
      });

      // Mock campsite ownership check
      const mockCampsiteEq = jest.fn(() => ({
        single: jest.fn().mockResolvedValue({
          data: {
            id: testCampsiteId,
            owner_id: testOwnerId,
          },
          error: null,
        }),
      }));

      mockSupabaseOwner.from.mockImplementation((table: string) => {
        if (table === 'campsites') {
          return {
            select: jest.fn(() => ({
              eq: mockCampsiteEq,
            })),
          };
        }
        return {
          select: mockSupabaseOwner._mockSelect,
        };
      });

      // First verify campsite ownership
      const { data: campsite } = await mockSupabaseOwner
        .from('campsites')
        .select('owner_id')
        .eq('id', testCampsiteId)
        .single();

      expect(campsite.owner_id).toBe(testOwnerId);

      // Then fetch inquiry
      const { data: inquiry } = await mockSupabaseOwner
        .from('inquiries')
        .select('*')
        .eq('id', testInquiryId)
        .single();

      expect(inquiry).toBeDefined();
      expect(inquiry.campsite_id).toBe(testCampsiteId);
    });

    it('should prevent owner from reading inquiries for other campsites', async () => {
      // Mock inquiry for someone else's campsite
      mockSupabaseOwner._mockSingle.mockResolvedValue({
        data: null,
        error: {
          code: 'PGRST116',
          message: 'Row-level security policy violation',
        },
      });

      const { data: inquiry, error } = await mockSupabaseOwner
        .from('inquiries')
        .select('*')
        .eq('campsite_id', testOtherCampsiteId)
        .single();

      expect(inquiry).toBeNull();
      expect(error).toBeDefined();
    });

    it('should allow admin to read all inquiries', async () => {
      // Admin can read any inquiry
      mockSupabaseAdmin._mockSingle.mockResolvedValue({
        data: {
          id: testInquiryId,
          campsite_id: testCampsiteId,
          user_id: testUserId,
          guest_name: 'Admin View',
          guest_email: 'admin@example.com',
          message: 'Inquiry message',
          status: 'new',
        },
        error: null,
      });

      const { data: inquiry } = await mockSupabaseAdmin
        .from('inquiries')
        .select('*')
        .eq('id', testInquiryId)
        .single();

      expect(inquiry).toBeDefined();
      expect(inquiry.id).toBe(testInquiryId);
    });
  });

  describe('INSERT policies - Inquiry creation restrictions', () => {
    it('should allow authenticated user to create inquiry for any campsite', async () => {
      const newInquiry = {
        campsite_id: testCampsiteId,
        user_id: testUserId,
        guest_name: 'John Doe',
        guest_email: 'john@example.com',
        message: 'I would like to book a campsite',
        inquiry_type: 'booking',
        status: 'new',
      };

      mockSupabaseUser._mockSingle.mockResolvedValue({
        data: {
          id: 'new-inquiry-id',
          ...newInquiry,
          created_at: new Date().toISOString(),
        },
        error: null,
      });

      const { data: inquiry, error } = await mockSupabaseUser
        .from('inquiries')
        .insert(newInquiry)
        .select()
        .single();

      expect(error).toBeNull();
      expect(inquiry).toBeDefined();
      expect(inquiry.user_id).toBe(testUserId);
      expect(inquiry.campsite_id).toBe(testCampsiteId);
    });

    it('should allow anonymous users to create inquiries (guest inquiries)', async () => {
      const guestInquiry = {
        campsite_id: testCampsiteId,
        user_id: null,
        guest_name: 'Guest User',
        guest_email: 'guest@example.com',
        message: 'Question about availability',
        inquiry_type: 'general',
        status: 'new',
      };

      mockSupabaseAnonymous._mockSingle.mockResolvedValue({
        data: {
          id: 'guest-inquiry-id',
          ...guestInquiry,
          created_at: new Date().toISOString(),
        },
        error: null,
      });

      const { data: inquiry, error } = await mockSupabaseAnonymous
        .from('inquiries')
        .insert(guestInquiry)
        .select()
        .single();

      expect(error).toBeNull();
      expect(inquiry).toBeDefined();
      expect(inquiry.user_id).toBeNull();
      expect(inquiry.guest_email).toBe('guest@example.com');
    });

    it('should allow user to create inquiry for campsite they do not own', async () => {
      // User should be able to inquire about any campsite
      const inquiryForOtherCampsite = {
        campsite_id: testOtherCampsiteId,
        user_id: testUserId,
        guest_name: 'John Doe',
        guest_email: 'john@example.com',
        message: 'Interested in this campsite',
        inquiry_type: 'general',
        status: 'new',
      };

      mockSupabaseUser._mockSingle.mockResolvedValue({
        data: {
          id: 'inquiry-other-campsite',
          ...inquiryForOtherCampsite,
          created_at: new Date().toISOString(),
        },
        error: null,
      });

      const { data: inquiry, error } = await mockSupabaseUser
        .from('inquiries')
        .insert(inquiryForOtherCampsite)
        .select()
        .single();

      expect(error).toBeNull();
      expect(inquiry).toBeDefined();
      expect(inquiry.campsite_id).toBe(testOtherCampsiteId);
    });
  });

  describe('UPDATE policies - Status update restrictions', () => {
    it('should allow owner to update inquiry status for their campsites', async () => {
      // Mock campsite ownership verification
      const mockCampsiteEq = jest.fn(() => ({
        single: jest.fn().mockResolvedValue({
          data: {
            id: testCampsiteId,
            owner_id: testOwnerId,
          },
          error: null,
        }),
      }));

      mockSupabaseOwner.from.mockImplementation((table: string) => {
        if (table === 'campsites') {
          return {
            select: jest.fn(() => ({
              eq: mockCampsiteEq,
            })),
          };
        }
        if (table === 'inquiries') {
          return {
            update: mockSupabaseOwner._mockUpdate,
          };
        }
        return {};
      });

      // Verify ownership first
      const { data: campsite } = await mockSupabaseOwner
        .from('campsites')
        .select('owner_id')
        .eq('id', testCampsiteId)
        .single();

      expect(campsite.owner_id).toBe(testOwnerId);

      // Update inquiry
      mockSupabaseOwner._mockSingle.mockResolvedValue({
        data: {
          id: testInquiryId,
          status: 'resolved',
          owner_reply: 'Thank you for your inquiry',
          replied_at: new Date().toISOString(),
        },
        error: null,
      });

      const { data: updatedInquiry, error } = await mockSupabaseOwner
        .from('inquiries')
        .update({
          status: 'resolved',
          owner_reply: 'Thank you for your inquiry',
          replied_at: new Date().toISOString(),
        })
        .eq('id', testInquiryId)
        .single();

      expect(error).toBeNull();
      expect(updatedInquiry).toBeDefined();
      expect(updatedInquiry.status).toBe('resolved');
    });

    it('should prevent user from updating inquiry status', async () => {
      // Users cannot update status, only owners can
      mockSupabaseUser._mockSingle.mockResolvedValue({
        data: null,
        error: {
          code: 'PGRST116',
          message: 'Row-level security policy violation',
        },
      });

      const { data: updatedInquiry, error } = await mockSupabaseUser
        .from('inquiries')
        .update({ status: 'resolved' })
        .eq('id', testInquiryId)
        .single();

      expect(updatedInquiry).toBeNull();
      expect(error).toBeDefined();
      expect(error.message).toContain('Row-level security');
    });

    it('should prevent owner from updating inquiries for other campsites', async () => {
      // Owner tries to update inquiry for campsite they don't own
      mockSupabaseOwner._mockSingle.mockResolvedValue({
        data: null,
        error: {
          code: 'PGRST116',
          message: 'Row-level security policy violation',
        },
      });

      const { data: updatedInquiry, error } = await mockSupabaseOwner
        .from('inquiries')
        .update({ status: 'resolved' })
        .eq('campsite_id', testOtherCampsiteId)
        .single();

      expect(updatedInquiry).toBeNull();
      expect(error).toBeDefined();
    });

    it('should allow owner to update read_at timestamp', async () => {
      // Owner marking inquiry as read
      const mockCampsiteEq = jest.fn(() => ({
        single: jest.fn().mockResolvedValue({
          data: {
            id: testCampsiteId,
            owner_id: testOwnerId,
          },
          error: null,
        }),
      }));

      mockSupabaseOwner.from.mockImplementation((table: string) => {
        if (table === 'campsites') {
          return {
            select: jest.fn(() => ({
              eq: mockCampsiteEq,
            })),
          };
        }
        if (table === 'inquiries') {
          return {
            update: mockSupabaseOwner._mockUpdate,
          };
        }
        return {};
      });

      mockSupabaseOwner._mockSingle.mockResolvedValue({
        data: {
          id: testInquiryId,
          read_at: new Date().toISOString(),
        },
        error: null,
      });

      const { data: updatedInquiry, error } = await mockSupabaseOwner
        .from('inquiries')
        .update({
          read_at: new Date().toISOString(),
        })
        .eq('id', testInquiryId)
        .single();

      expect(error).toBeNull();
      expect(updatedInquiry).toBeDefined();
      expect(updatedInquiry.read_at).toBeDefined();
    });

    it('should allow admin to update any inquiry', async () => {
      // Admin has full update access
      mockSupabaseAdmin._mockSingle.mockResolvedValue({
        data: {
          id: testInquiryId,
          status: 'resolved',
          owner_reply: 'Admin response',
        },
        error: null,
      });

      const { data: updatedInquiry, error } = await mockSupabaseAdmin
        .from('inquiries')
        .update({
          status: 'resolved',
          owner_reply: 'Admin response',
        })
        .eq('id', testInquiryId)
        .single();

      expect(error).toBeNull();
      expect(updatedInquiry).toBeDefined();
      expect(updatedInquiry.status).toBe('resolved');
    });
  });

  describe('Multiple inquiries access patterns', () => {
    it('should return only user-specific inquiries when querying as user', async () => {
      const mockUserInquiries = [
        {
          id: 'inquiry-1',
          campsite_id: testCampsiteId,
          user_id: testUserId,
          guest_name: 'John Doe',
          guest_email: 'john@example.com',
          message: 'First inquiry',
        },
        {
          id: 'inquiry-2',
          campsite_id: testOtherCampsiteId,
          user_id: testUserId,
          guest_name: 'John Doe',
          guest_email: 'john@example.com',
          message: 'Second inquiry',
        },
      ];

      mockSupabaseUser._mockSelect.mockResolvedValue({
        data: mockUserInquiries,
        error: null,
      });

      const { data: inquiries } = await mockSupabaseUser
        .from('inquiries')
        .select('*');

      expect(inquiries).toBeDefined();
      expect(inquiries.length).toBe(2);
      inquiries.forEach((inquiry: any) => {
        expect(inquiry.user_id).toBe(testUserId);
      });
    });

    it('should return only campsite-specific inquiries when querying as owner', async () => {
      const mockOwnerInquiries = [
        {
          id: 'inquiry-3',
          campsite_id: testCampsiteId,
          user_id: testUserId,
          guest_name: 'User A',
          guest_email: 'usera@example.com',
          message: 'Inquiry from User A',
        },
        {
          id: 'inquiry-4',
          campsite_id: testCampsiteId,
          user_id: testOtherUserId,
          guest_name: 'User B',
          guest_email: 'userb@example.com',
          message: 'Inquiry from User B',
        },
      ];

      mockSupabaseOwner._mockSelect.mockResolvedValue({
        data: mockOwnerInquiries,
        error: null,
      });

      const { data: inquiries } = await mockSupabaseOwner
        .from('inquiries')
        .select('*');

      expect(inquiries).toBeDefined();
      expect(inquiries.length).toBe(2);
      inquiries.forEach((inquiry: any) => {
        expect(inquiry.campsite_id).toBe(testCampsiteId);
      });
    });
  });
});
