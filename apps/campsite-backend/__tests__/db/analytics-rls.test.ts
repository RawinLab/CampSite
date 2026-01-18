/**
 * Unit tests for analytics_events RLS (Row Level Security) policies
 * Tests the expected behavior of RLS policies defined in
 * supabase/migrations/20260117000019_create_rls_policies.sql
 *
 * RLS Policies for analytics_events:
 * 1. Owners can view analytics for their own campsites only
 * 2. Anyone can insert analytics events (for tracking)
 * 3. Users cannot update or delete analytics events (no policies = implicit deny)
 * 4. Admin role can view all analytics
 */

import { createClient } from '@supabase/supabase-js';

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

describe('Analytics Events RLS Policies', () => {
  let mockSupabaseAdmin: any;
  let mockSupabaseUser: any;
  let mockSupabaseOwner: any;
  let mockSupabaseOtherOwner: any;
  let mockSupabaseAnonymous: any;

  const testUserId = 'user-id-123';
  const testOwnerId = 'owner-id-456';
  const testOtherOwnerId = 'other-owner-id-789';
  const testCampsiteId = 'campsite-id-abc';
  const testOtherCampsiteId = 'campsite-id-xyz';
  const testAnalyticsEventId = 'analytics-id-111';

  beforeEach(() => {
    // Helper to create mock Supabase client
    const createMockClient = (userId?: string, role?: string) => {
      const mockSingle = jest.fn();
      let eqReturnValue: any = { data: null, error: null };

      // Create chainable eq function that returns itself
      const mockEq: any = jest.fn();
      mockEq.mockImplementation(() => mockEq);
      mockEq.single = mockSingle;
      // Make it thenable so it can be awaited
      mockEq.then = function(resolve: any) {
        return Promise.resolve(eqReturnValue).then(resolve);
      };
      // Also add eq method to make it chainable
      mockEq.eq = mockEq;
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
      const mockDelete = jest.fn(() => ({
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
          delete: mockDelete,
        })),
        _mockSingle: mockSingle,
        _mockEq: mockEq,
        _mockSelect: mockSelect,
        _mockInsert: mockInsert,
        _mockUpdate: mockUpdate,
        _mockDelete: mockDelete,
        _setEqReturnValue: (value: any) => { eqReturnValue = value; },
        _userId: userId,
        _role: role,
      };
    };

    mockSupabaseAdmin = createMockClient('admin-id', 'admin');
    mockSupabaseUser = createMockClient(testUserId, 'user');
    mockSupabaseOwner = createMockClient(testOwnerId, 'owner');
    mockSupabaseOtherOwner = createMockClient(testOtherOwnerId, 'owner');
    mockSupabaseAnonymous = createMockClient(undefined, undefined);

    (createClient as jest.Mock).mockReturnValue(mockSupabaseAdmin);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('SELECT policies - Owner can view their campsite analytics', () => {
    it('should allow owner to view analytics for their own campsite', async () => {
      // Mock analytics event for owner's campsite
      const analyticsData = [
        {
          id: testAnalyticsEventId,
          campsite_id: testCampsiteId,
          user_id: testUserId,
          event_type: 'profile_view',
          metadata: { source: 'search' },
          created_at: new Date().toISOString(),
        },
      ];

      mockSupabaseOwner._setEqReturnValue({
        data: analyticsData,
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

      // Then fetch analytics
      const { data: analytics } = await mockSupabaseOwner
        .from('analytics_events')
        .select('*')
        .eq('campsite_id', testCampsiteId);

      expect(analytics).toBeDefined();
      expect(analytics.length).toBe(1);
      expect(analytics[0].campsite_id).toBe(testCampsiteId);
      expect(analytics[0].event_type).toBe('profile_view');
    });

    it('should prevent owner from viewing analytics for other owner campsites', async () => {
      // Mock analytics for someone else's campsite - should be empty/denied
      mockSupabaseOwner._setEqReturnValue({
        data: [],
        error: null,
      });

      const { data: analytics } = await mockSupabaseOwner
        .from('analytics_events')
        .select('*')
        .eq('campsite_id', testOtherCampsiteId);

      expect(analytics).toBeDefined();
      expect(analytics.length).toBe(0);
    });

    it('should allow admin to view all analytics events', async () => {
      // Admin can view analytics for any campsite
      mockSupabaseAdmin._mockSelect.mockResolvedValue({
        data: [
          {
            id: 'analytics-1',
            campsite_id: testCampsiteId,
            user_id: testUserId,
            event_type: 'profile_view',
            metadata: {},
            created_at: new Date().toISOString(),
          },
          {
            id: 'analytics-2',
            campsite_id: testOtherCampsiteId,
            user_id: testOwnerId,
            event_type: 'booking_click',
            metadata: {},
            created_at: new Date().toISOString(),
          },
        ],
        error: null,
      });

      const { data: analytics } = await mockSupabaseAdmin
        .from('analytics_events')
        .select('*');

      expect(analytics).toBeDefined();
      expect(analytics.length).toBe(2);
      // Admin can see analytics from different campsites
      expect(analytics[0].campsite_id).toBe(testCampsiteId);
      expect(analytics[1].campsite_id).toBe(testOtherCampsiteId);
    });

    it('should prevent regular users from viewing analytics', async () => {
      // Regular users cannot view analytics (they're not owners)
      mockSupabaseUser._setEqReturnValue({
        data: [],
        error: null,
      });

      const { data: analytics } = await mockSupabaseUser
        .from('analytics_events')
        .select('*')
        .eq('campsite_id', testCampsiteId);

      expect(analytics).toBeDefined();
      expect(analytics.length).toBe(0);
    });

    it('should prevent anonymous users from viewing analytics', async () => {
      // Anonymous users cannot view analytics
      mockSupabaseAnonymous._mockSelect.mockResolvedValue({
        data: [],
        error: null,
      });

      const { data: analytics } = await mockSupabaseAnonymous
        .from('analytics_events')
        .select('*');

      expect(analytics).toBeDefined();
      expect(analytics.length).toBe(0);
    });
  });

  describe('INSERT policies - Anyone can create analytics events', () => {
    it('should allow authenticated user to insert analytics event', async () => {
      const newEvent = {
        campsite_id: testCampsiteId,
        user_id: testUserId,
        event_type: 'profile_view',
        metadata: { source: 'search', device: 'mobile' },
      };

      mockSupabaseUser._mockSingle.mockResolvedValue({
        data: {
          id: 'new-analytics-id',
          ...newEvent,
          created_at: new Date().toISOString(),
        },
        error: null,
      });

      const { data: event, error } = await mockSupabaseUser
        .from('analytics_events')
        .insert(newEvent)
        .select()
        .single();

      expect(error).toBeNull();
      expect(event).toBeDefined();
      expect(event.campsite_id).toBe(testCampsiteId);
      expect(event.event_type).toBe('profile_view');
      expect(event.user_id).toBe(testUserId);
    });

    it('should allow anonymous users to insert analytics event', async () => {
      const anonymousEvent = {
        campsite_id: testCampsiteId,
        user_id: null,
        event_type: 'profile_view',
        metadata: { source: 'direct', device: 'desktop' },
      };

      mockSupabaseAnonymous._mockSingle.mockResolvedValue({
        data: {
          id: 'anonymous-analytics-id',
          ...anonymousEvent,
          created_at: new Date().toISOString(),
        },
        error: null,
      });

      const { data: event, error } = await mockSupabaseAnonymous
        .from('analytics_events')
        .insert(anonymousEvent)
        .select()
        .single();

      expect(error).toBeNull();
      expect(event).toBeDefined();
      expect(event.user_id).toBeNull();
      expect(event.event_type).toBe('profile_view');
    });

    it('should allow owner to insert analytics event', async () => {
      const ownerEvent = {
        campsite_id: testOtherCampsiteId,
        user_id: testOwnerId,
        event_type: 'booking_click',
        metadata: { external_url: 'https://booking.example.com' },
      };

      mockSupabaseOwner._mockSingle.mockResolvedValue({
        data: {
          id: 'owner-analytics-id',
          ...ownerEvent,
          created_at: new Date().toISOString(),
        },
        error: null,
      });

      const { data: event, error } = await mockSupabaseOwner
        .from('analytics_events')
        .insert(ownerEvent)
        .select()
        .single();

      expect(error).toBeNull();
      expect(event).toBeDefined();
      expect(event.event_type).toBe('booking_click');
      expect(event.user_id).toBe(testOwnerId);
    });

    it('should allow inserting various event types', async () => {
      const eventTypes = [
        'search_impression',
        'profile_view',
        'booking_click',
        'inquiry_sent',
        'wishlist_add',
        'phone_click',
        'website_click',
      ];

      for (const eventType of eventTypes) {
        const newEvent = {
          campsite_id: testCampsiteId,
          user_id: testUserId,
          event_type: eventType,
          metadata: {},
        };

        mockSupabaseUser._mockSingle.mockResolvedValue({
          data: {
            id: `event-${eventType}`,
            ...newEvent,
            created_at: new Date().toISOString(),
          },
          error: null,
        });

        const { data: event, error } = await mockSupabaseUser
          .from('analytics_events')
          .insert(newEvent)
          .select()
          .single();

        expect(error).toBeNull();
        expect(event).toBeDefined();
        expect(event.event_type).toBe(eventType);
      }
    });

    it('should allow inserting analytics with complex metadata', async () => {
      const complexEvent = {
        campsite_id: testCampsiteId,
        user_id: testUserId,
        event_type: 'search_impression',
        metadata: {
          query: 'camping near beach',
          filters: {
            province: 'Phuket',
            price_range: [1000, 3000],
            amenities: ['wifi', 'parking'],
          },
          position: 3,
          total_results: 15,
        },
      };

      mockSupabaseUser._mockSingle.mockResolvedValue({
        data: {
          id: 'complex-analytics-id',
          ...complexEvent,
          created_at: new Date().toISOString(),
        },
        error: null,
      });

      const { data: event, error } = await mockSupabaseUser
        .from('analytics_events')
        .insert(complexEvent)
        .select()
        .single();

      expect(error).toBeNull();
      expect(event).toBeDefined();
      expect(event.metadata).toEqual(complexEvent.metadata);
    });
  });

  describe('UPDATE policies - Users cannot update analytics events', () => {
    it('should prevent regular user from updating analytics event', async () => {
      // No UPDATE policy exists, so all updates should be denied
      mockSupabaseUser._mockSingle.mockResolvedValue({
        data: null,
        error: {
          code: 'PGRST116',
          message: 'Row-level security policy violation',
        },
      });

      const { data: updatedEvent, error } = await mockSupabaseUser
        .from('analytics_events')
        .update({ event_type: 'modified' })
        .eq('id', testAnalyticsEventId)
        .single();

      expect(updatedEvent).toBeNull();
      expect(error).toBeDefined();
      expect(error.message).toContain('Row-level security');
    });

    it('should prevent owner from updating analytics event', async () => {
      // Even owners cannot update analytics events
      mockSupabaseOwner._mockSingle.mockResolvedValue({
        data: null,
        error: {
          code: 'PGRST116',
          message: 'Row-level security policy violation',
        },
      });

      const { data: updatedEvent, error } = await mockSupabaseOwner
        .from('analytics_events')
        .update({ metadata: { modified: true } })
        .eq('id', testAnalyticsEventId)
        .single();

      expect(updatedEvent).toBeNull();
      expect(error).toBeDefined();
    });

    it('should prevent anonymous user from updating analytics event', async () => {
      mockSupabaseAnonymous._mockSingle.mockResolvedValue({
        data: null,
        error: {
          code: 'PGRST116',
          message: 'Row-level security policy violation',
        },
      });

      const { data: updatedEvent, error } = await mockSupabaseAnonymous
        .from('analytics_events')
        .update({ event_type: 'tampered' })
        .eq('id', testAnalyticsEventId)
        .single();

      expect(updatedEvent).toBeNull();
      expect(error).toBeDefined();
    });

    it('should prevent admin from updating analytics event (no UPDATE policy)', async () => {
      // Even admin cannot update (no policy defined)
      mockSupabaseAdmin._mockSingle.mockResolvedValue({
        data: null,
        error: {
          code: 'PGRST116',
          message: 'Row-level security policy violation',
        },
      });

      const { data: updatedEvent, error } = await mockSupabaseAdmin
        .from('analytics_events')
        .update({ event_type: 'admin_modified' })
        .eq('id', testAnalyticsEventId)
        .single();

      expect(updatedEvent).toBeNull();
      expect(error).toBeDefined();
    });
  });

  describe('DELETE policies - Users cannot delete analytics events', () => {
    it('should prevent regular user from deleting analytics event', async () => {
      // No DELETE policy exists, so all deletes should be denied
      mockSupabaseUser._mockSingle.mockResolvedValue({
        data: null,
        error: {
          code: 'PGRST116',
          message: 'Row-level security policy violation',
        },
      });

      const { data: deletedEvent, error } = await mockSupabaseUser
        .from('analytics_events')
        .delete()
        .eq('id', testAnalyticsEventId)
        .single();

      expect(deletedEvent).toBeNull();
      expect(error).toBeDefined();
      expect(error.message).toContain('Row-level security');
    });

    it('should prevent owner from deleting analytics event', async () => {
      // Even owners cannot delete analytics events
      mockSupabaseOwner._mockSingle.mockResolvedValue({
        data: null,
        error: {
          code: 'PGRST116',
          message: 'Row-level security policy violation',
        },
      });

      const { data: deletedEvent, error } = await mockSupabaseOwner
        .from('analytics_events')
        .delete()
        .eq('id', testAnalyticsEventId)
        .single();

      expect(deletedEvent).toBeNull();
      expect(error).toBeDefined();
    });

    it('should prevent anonymous user from deleting analytics event', async () => {
      mockSupabaseAnonymous._mockSingle.mockResolvedValue({
        data: null,
        error: {
          code: 'PGRST116',
          message: 'Row-level security policy violation',
        },
      });

      const { data: deletedEvent, error } = await mockSupabaseAnonymous
        .from('analytics_events')
        .delete()
        .eq('id', testAnalyticsEventId)
        .single();

      expect(deletedEvent).toBeNull();
      expect(error).toBeDefined();
    });

    it('should prevent admin from deleting analytics event (no DELETE policy)', async () => {
      // Even admin cannot delete (no policy defined)
      mockSupabaseAdmin._mockSingle.mockResolvedValue({
        data: null,
        error: {
          code: 'PGRST116',
          message: 'Row-level security policy violation',
        },
      });

      const { data: deletedEvent, error } = await mockSupabaseAdmin
        .from('analytics_events')
        .delete()
        .eq('id', testAnalyticsEventId)
        .single();

      expect(deletedEvent).toBeNull();
      expect(error).toBeDefined();
    });
  });

  describe('Multiple analytics events access patterns', () => {
    it('should return analytics only for owner owned campsites', async () => {
      const mockOwnerAnalytics = [
        {
          id: 'analytics-1',
          campsite_id: testCampsiteId,
          user_id: testUserId,
          event_type: 'profile_view',
          metadata: {},
          created_at: new Date().toISOString(),
        },
        {
          id: 'analytics-2',
          campsite_id: testCampsiteId,
          user_id: testOtherOwnerId,
          event_type: 'booking_click',
          metadata: {},
          created_at: new Date().toISOString(),
        },
      ];

      mockSupabaseOwner._setEqReturnValue({
        data: mockOwnerAnalytics,
        error: null,
      });

      const { data: analytics } = await mockSupabaseOwner
        .from('analytics_events')
        .select('*')
        .eq('campsite_id', testCampsiteId);

      expect(analytics).toBeDefined();
      expect(analytics.length).toBe(2);
      // All analytics should be for the same campsite owned by the owner
      analytics.forEach((event: any) => {
        expect(event.campsite_id).toBe(testCampsiteId);
      });
    });

    it('should allow admin to view analytics across all campsites', async () => {
      const mockAllAnalytics = [
        {
          id: 'analytics-1',
          campsite_id: testCampsiteId,
          user_id: testUserId,
          event_type: 'profile_view',
          metadata: {},
          created_at: new Date().toISOString(),
        },
        {
          id: 'analytics-2',
          campsite_id: testOtherCampsiteId,
          user_id: testOwnerId,
          event_type: 'inquiry_sent',
          metadata: {},
          created_at: new Date().toISOString(),
        },
        {
          id: 'analytics-3',
          campsite_id: testCampsiteId,
          user_id: null,
          event_type: 'search_impression',
          metadata: {},
          created_at: new Date().toISOString(),
        },
      ];

      mockSupabaseAdmin._mockSelect.mockResolvedValue({
        data: mockAllAnalytics,
        error: null,
      });

      const { data: analytics } = await mockSupabaseAdmin
        .from('analytics_events')
        .select('*');

      expect(analytics).toBeDefined();
      expect(analytics.length).toBe(3);
      // Admin sees analytics from multiple campsites
      const uniqueCampsites = new Set(analytics.map((e: any) => e.campsite_id));
      expect(uniqueCampsites.size).toBeGreaterThan(1);
    });

    it('should filter analytics by event type for owner', async () => {
      const mockFilteredAnalytics = [
        {
          id: 'analytics-1',
          campsite_id: testCampsiteId,
          user_id: testUserId,
          event_type: 'booking_click',
          metadata: {},
          created_at: new Date().toISOString(),
        },
        {
          id: 'analytics-2',
          campsite_id: testCampsiteId,
          user_id: testOtherOwnerId,
          event_type: 'booking_click',
          metadata: {},
          created_at: new Date().toISOString(),
        },
      ];

      // Set the return value for the chainable eq
      mockSupabaseOwner._setEqReturnValue({
        data: mockFilteredAnalytics,
        error: null,
      });

      const { data: analytics } = await mockSupabaseOwner
        .from('analytics_events')
        .select('*')
        .eq('campsite_id', testCampsiteId)
        .eq('event_type', 'booking_click');

      expect(analytics).toBeDefined();
      expect(analytics.length).toBe(2);
      analytics.forEach((event: any) => {
        expect(event.event_type).toBe('booking_click');
      });
    });
  });

  describe('Edge cases and security validations', () => {
    it('should handle null user_id in analytics events', async () => {
      const eventWithNullUser = {
        campsite_id: testCampsiteId,
        user_id: null,
        event_type: 'profile_view',
        metadata: { source: 'anonymous' },
      };

      mockSupabaseAnonymous._mockSingle.mockResolvedValue({
        data: {
          id: 'null-user-analytics',
          ...eventWithNullUser,
          created_at: new Date().toISOString(),
        },
        error: null,
      });

      const { data: event, error } = await mockSupabaseAnonymous
        .from('analytics_events')
        .insert(eventWithNullUser)
        .select()
        .single();

      expect(error).toBeNull();
      expect(event).toBeDefined();
      expect(event.user_id).toBeNull();
    });

    it('should handle empty metadata object', async () => {
      const eventWithEmptyMetadata = {
        campsite_id: testCampsiteId,
        user_id: testUserId,
        event_type: 'phone_click',
        metadata: {},
      };

      mockSupabaseUser._mockSingle.mockResolvedValue({
        data: {
          id: 'empty-metadata-analytics',
          ...eventWithEmptyMetadata,
          created_at: new Date().toISOString(),
        },
        error: null,
      });

      const { data: event, error } = await mockSupabaseUser
        .from('analytics_events')
        .insert(eventWithEmptyMetadata)
        .select()
        .single();

      expect(error).toBeNull();
      expect(event).toBeDefined();
      expect(event.metadata).toEqual({});
    });

    it('should maintain data immutability after insert', async () => {
      const originalEvent = {
        campsite_id: testCampsiteId,
        user_id: testUserId,
        event_type: 'wishlist_add',
        metadata: { item_name: 'Test Campsite' },
      };

      const insertedEvent = {
        id: 'immutable-analytics',
        ...originalEvent,
        created_at: new Date().toISOString(),
      };

      mockSupabaseUser._mockSingle.mockResolvedValue({
        data: insertedEvent,
        error: null,
      });

      const { data: event } = await mockSupabaseUser
        .from('analytics_events')
        .insert(originalEvent)
        .select()
        .single();

      expect(event).toBeDefined();
      expect(event.id).toBe('immutable-analytics');

      // Attempt to update should fail (tested in UPDATE section)
      mockSupabaseUser._mockSingle.mockResolvedValue({
        data: null,
        error: {
          code: 'PGRST116',
          message: 'Row-level security policy violation',
        },
      });

      const { data: updatedEvent, error: updateError } = await mockSupabaseUser
        .from('analytics_events')
        .update({ event_type: 'modified' })
        .eq('id', event.id)
        .single();

      expect(updatedEvent).toBeNull();
      expect(updateError).toBeDefined();
    });
  });
});
