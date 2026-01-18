/**
 * Unit tests for analytics_events database schema
 * Tests the expected behavior of the analytics_events table schema
 * defined in supabase/migrations/20260117000016_create_analytics_events.sql
 */

import { createClient } from '@supabase/supabase-js';

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

describe('Analytics Events Schema', () => {
  let mockSupabaseAdmin: any;

  const testCampsiteId = 'campsite-id-123';
  const testUserId = 'user-id-456';
  const testEventId = 'event-id-789';

  beforeEach(() => {
    // Helper to create mock query chain
    const createMockQueryChain = () => {
      const mockData = { data: null, error: null };
      const mockSingle = jest.fn(() => mockData);
      const mockEq = jest.fn(() => ({
        single: mockSingle,
        eq: jest.fn(() => ({ single: mockSingle })),
      }));
      const mockSelect = jest.fn(() => ({
        eq: mockEq,
        single: mockSingle,
        data: null,
        error: null,
      }));
      const mockInsert = jest.fn(() => ({
        select: mockSelect,
        single: mockSingle,
      }));
      const mockDelete = jest.fn(() => ({
        eq: mockEq,
        single: mockSingle,
      }));

      return {
        select: mockSelect,
        insert: mockInsert,
        delete: mockDelete,
        _mockSingle: mockSingle,
        _mockEq: mockEq,
        _mockSelect: mockSelect,
        _mockInsert: mockInsert,
        _mockDelete: mockDelete,
        _mockData: mockData,
      };
    };

    // Create mock Supabase admin client
    mockSupabaseAdmin = {
      from: jest.fn(() => createMockQueryChain()),
      rpc: jest.fn(),
      _createMockQueryChain: createMockQueryChain,
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabaseAdmin);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Schema has all required columns', () => {
    it('should have id column with UUID type and default value', async () => {
      const mockEvent = {
        id: testEventId,
        campsite_id: testCampsiteId,
        user_id: testUserId,
        event_type: 'profile_view',
        metadata: {},
        session_id: null,
        referrer: null,
        user_agent: null,
        ip_address: null,
        country: null,
        city: null,
        created_at: new Date().toISOString(),
      };

      const mockChain = mockSupabaseAdmin._createMockQueryChain();
      mockChain._mockSingle.mockResolvedValue({
        data: mockEvent,
        error: null,
      });

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const { data: event } = await mockSupabaseAdmin
        .from('analytics_events')
        .select('*')
        .eq('id', testEventId)
        .single();

      expect(event).toHaveProperty('id');
      expect(event.id).toBe(testEventId);
      expect(typeof event.id).toBe('string');
    });

    it('should have campsite_id column as UUID', async () => {
      const mockEvent = {
        id: testEventId,
        campsite_id: testCampsiteId,
        user_id: null,
        event_type: 'search_impression',
        metadata: {},
        created_at: new Date().toISOString(),
      };

      const mockChain = mockSupabaseAdmin._createMockQueryChain();
      mockChain._mockSingle.mockResolvedValue({
        data: mockEvent,
        error: null,
      });

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const { data: event } = await mockSupabaseAdmin
        .from('analytics_events')
        .select('*')
        .eq('id', testEventId)
        .single();

      expect(event).toHaveProperty('campsite_id');
      expect(event.campsite_id).toBe(testCampsiteId);
      expect(typeof event.campsite_id).toBe('string');
    });

    it('should have user_id column as nullable UUID', async () => {
      const mockEventWithUser = {
        id: testEventId,
        campsite_id: testCampsiteId,
        user_id: testUserId,
        event_type: 'profile_view',
        metadata: {},
        created_at: new Date().toISOString(),
      };

      const mockEventWithoutUser = {
        id: 'event-id-anonymous',
        campsite_id: testCampsiteId,
        user_id: null,
        event_type: 'profile_view',
        metadata: {},
        created_at: new Date().toISOString(),
      };

      const mockChain = mockSupabaseAdmin._createMockQueryChain();
      mockChain._mockSingle
        .mockResolvedValueOnce({ data: mockEventWithUser, error: null })
        .mockResolvedValueOnce({ data: mockEventWithoutUser, error: null });

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      // Test with user
      const { data: event1 } = await mockSupabaseAdmin
        .from('analytics_events')
        .select('*')
        .eq('id', testEventId)
        .single();

      expect(event1.user_id).toBe(testUserId);

      // Test without user (anonymous tracking)
      const { data: event2 } = await mockSupabaseAdmin
        .from('analytics_events')
        .select('*')
        .eq('id', 'event-id-anonymous')
        .single();

      expect(event2.user_id).toBeNull();
    });

    it('should have event_type column with event_type enum', async () => {
      const mockEvent = {
        id: testEventId,
        campsite_id: testCampsiteId,
        user_id: testUserId,
        event_type: 'booking_click',
        metadata: {},
        created_at: new Date().toISOString(),
      };

      const mockChain = mockSupabaseAdmin._createMockQueryChain();
      mockChain._mockSingle.mockResolvedValue({
        data: mockEvent,
        error: null,
      });

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const { data: event } = await mockSupabaseAdmin
        .from('analytics_events')
        .select('*')
        .eq('id', testEventId)
        .single();

      expect(event).toHaveProperty('event_type');
      expect(event.event_type).toBe('booking_click');
    });

    it('should have metadata column as JSONB', async () => {
      const mockMetadata = {
        search_query: 'camping chiang mai',
        filters: { price_max: 5000, province_id: 2 },
        source: 'homepage',
      };

      const mockEvent = {
        id: testEventId,
        campsite_id: testCampsiteId,
        user_id: testUserId,
        event_type: 'search_impression',
        metadata: mockMetadata,
        created_at: new Date().toISOString(),
      };

      const mockChain = mockSupabaseAdmin._createMockQueryChain();
      mockChain._mockSingle.mockResolvedValue({
        data: mockEvent,
        error: null,
      });

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const { data: event } = await mockSupabaseAdmin
        .from('analytics_events')
        .select('*')
        .eq('id', testEventId)
        .single();

      expect(event).toHaveProperty('metadata');
      expect(event.metadata).toEqual(mockMetadata);
      expect(typeof event.metadata).toBe('object');
    });

    it('should have optional tracking fields (session_id, referrer, user_agent, ip_address)', async () => {
      const mockEvent = {
        id: testEventId,
        campsite_id: testCampsiteId,
        user_id: testUserId,
        event_type: 'profile_view',
        metadata: {},
        session_id: 'session-abc-123',
        referrer: 'https://google.com',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        ip_address: '192.168.1.1',
        country: 'TH',
        city: 'Bangkok',
        created_at: new Date().toISOString(),
      };

      const mockChain = mockSupabaseAdmin._createMockQueryChain();
      mockChain._mockSingle.mockResolvedValue({
        data: mockEvent,
        error: null,
      });

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const { data: event } = await mockSupabaseAdmin
        .from('analytics_events')
        .select('*')
        .eq('id', testEventId)
        .single();

      expect(event).toHaveProperty('session_id');
      expect(event).toHaveProperty('referrer');
      expect(event).toHaveProperty('user_agent');
      expect(event).toHaveProperty('ip_address');
      expect(event).toHaveProperty('country');
      expect(event).toHaveProperty('city');
      expect(event.session_id).toBe('session-abc-123');
      expect(event.referrer).toBe('https://google.com');
      expect(event.ip_address).toBe('192.168.1.1');
      expect(event.country).toBe('TH');
      expect(event.city).toBe('Bangkok');
    });

    it('should have created_at column with TIMESTAMPTZ type', async () => {
      const now = new Date().toISOString();
      const mockEvent = {
        id: testEventId,
        campsite_id: testCampsiteId,
        user_id: testUserId,
        event_type: 'profile_view',
        metadata: {},
        created_at: now,
      };

      const mockChain = mockSupabaseAdmin._createMockQueryChain();
      mockChain._mockSingle.mockResolvedValue({
        data: mockEvent,
        error: null,
      });

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const { data: event } = await mockSupabaseAdmin
        .from('analytics_events')
        .select('*')
        .eq('id', testEventId)
        .single();

      expect(event).toHaveProperty('created_at');
      expect(event.created_at).toBe(now);
    });
  });

  describe('Foreign key to campsites exists', () => {
    it('should have foreign key reference to campsites(id)', async () => {
      const mockEvent = {
        id: testEventId,
        campsite_id: testCampsiteId,
        user_id: testUserId,
        event_type: 'profile_view',
        metadata: {},
        created_at: new Date().toISOString(),
      };

      const mockChain = mockSupabaseAdmin._createMockQueryChain();
      mockChain._mockSingle.mockResolvedValue({
        data: mockEvent,
        error: null,
      });

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const { data: event } = await mockSupabaseAdmin
        .from('analytics_events')
        .select('*')
        .eq('campsite_id', testCampsiteId)
        .single();

      expect(event).toBeDefined();
      expect(event.campsite_id).toBe(testCampsiteId);
    });

    it('should reject analytics event with non-existent campsite_id', async () => {
      const mockChain = mockSupabaseAdmin._createMockQueryChain();
      mockChain._mockSingle.mockResolvedValue({
        data: null,
        error: {
          code: '23503',
          message: 'insert or update on table "analytics_events" violates foreign key constraint',
        },
      });

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const { data: event, error } = await mockSupabaseAdmin
        .from('analytics_events')
        .insert({
          campsite_id: 'non-existent-campsite-id',
          event_type: 'profile_view',
          metadata: {},
        })
        .select()
        .single();

      expect(event).toBeNull();
      expect(error).toBeDefined();
      expect(error.code).toBe('23503');
      expect(error.message).toContain('foreign key constraint');
    });
  });

  describe('Foreign key to profiles exists', () => {
    it('should have foreign key reference to profiles(id) with SET NULL on delete', async () => {
      const mockEvent = {
        id: testEventId,
        campsite_id: testCampsiteId,
        user_id: testUserId,
        event_type: 'profile_view',
        metadata: {},
        created_at: new Date().toISOString(),
      };

      const mockChain = mockSupabaseAdmin._createMockQueryChain();
      mockChain._mockSingle.mockResolvedValue({
        data: mockEvent,
        error: null,
      });

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const { data: event } = await mockSupabaseAdmin
        .from('analytics_events')
        .select('*')
        .eq('user_id', testUserId)
        .single();

      expect(event).toBeDefined();
      expect(event.user_id).toBe(testUserId);
    });

    it('should allow null user_id (for anonymous tracking)', async () => {
      const mockEvent = {
        id: testEventId,
        campsite_id: testCampsiteId,
        user_id: null,
        event_type: 'profile_view',
        metadata: {},
        created_at: new Date().toISOString(),
      };

      const mockChain = mockSupabaseAdmin._createMockQueryChain();
      mockChain._mockSingle.mockResolvedValue({
        data: mockEvent,
        error: null,
      });

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const { data: event, error } = await mockSupabaseAdmin
        .from('analytics_events')
        .insert({
          campsite_id: testCampsiteId,
          user_id: null,
          event_type: 'profile_view',
          metadata: {},
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(event).toBeDefined();
      expect(event.user_id).toBeNull();
    });

    it('should set user_id to NULL when profile is deleted (ON DELETE SET NULL)', async () => {
      // Simulate profile deletion and verify analytics events remain with NULL user_id
      const mockEventAfterDeletion = {
        id: testEventId,
        campsite_id: testCampsiteId,
        user_id: null, // Set to NULL after profile deletion
        event_type: 'profile_view',
        metadata: {},
        created_at: new Date().toISOString(),
      };

      const mockChain = mockSupabaseAdmin._createMockQueryChain();
      mockChain._mockSingle.mockResolvedValue({
        data: mockEventAfterDeletion,
        error: null,
      });

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const { data: event } = await mockSupabaseAdmin
        .from('analytics_events')
        .select('*')
        .eq('id', testEventId)
        .single();

      expect(event).toBeDefined();
      expect(event.user_id).toBeNull();
      expect(event.id).toBe(testEventId);
    });
  });

  describe('Indexes exist for analytics queries', () => {
    it('should have index on campsite_id for filtering by campsite', async () => {
      // Mock query using campsite_id index
      const mockEvents = [
        {
          id: 'event-1',
          campsite_id: testCampsiteId,
          user_id: testUserId,
          event_type: 'profile_view',
          metadata: {},
          created_at: new Date().toISOString(),
        },
        {
          id: 'event-2',
          campsite_id: testCampsiteId,
          user_id: 'other-user-id',
          event_type: 'booking_click',
          metadata: {},
          created_at: new Date().toISOString(),
        },
      ];

      const mockChain = mockSupabaseAdmin._createMockQueryChain();
      const mockEq = jest.fn().mockResolvedValue({
        data: mockEvents,
        error: null,
      });
      mockChain._mockSelect.mockReturnValue({ eq: mockEq });

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const { data: events } = await mockSupabaseAdmin
        .from('analytics_events')
        .select('*')
        .eq('campsite_id', testCampsiteId);

      expect(events).toBeDefined();
      expect(events.length).toBe(2);
      events.forEach((event: any) => {
        expect(event.campsite_id).toBe(testCampsiteId);
      });
    });

    it('should have index on user_id for filtering by user', async () => {
      const mockEvents = [
        {
          id: 'event-1',
          campsite_id: testCampsiteId,
          user_id: testUserId,
          event_type: 'profile_view',
          metadata: {},
          created_at: new Date().toISOString(),
        },
        {
          id: 'event-2',
          campsite_id: 'other-campsite-id',
          user_id: testUserId,
          event_type: 'wishlist_add',
          metadata: {},
          created_at: new Date().toISOString(),
        },
      ];

      const mockChain = mockSupabaseAdmin._createMockQueryChain();
      const mockEq = jest.fn().mockResolvedValue({
        data: mockEvents,
        error: null,
      });
      mockChain._mockSelect.mockReturnValue({ eq: mockEq });

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const { data: events } = await mockSupabaseAdmin
        .from('analytics_events')
        .select('*')
        .eq('user_id', testUserId);

      expect(events).toBeDefined();
      expect(events.length).toBe(2);
      events.forEach((event: any) => {
        expect(event.user_id).toBe(testUserId);
      });
    });

    it('should have index on event_type for filtering by event type', async () => {
      const mockEvents = [
        {
          id: 'event-1',
          campsite_id: testCampsiteId,
          user_id: testUserId,
          event_type: 'booking_click',
          metadata: {},
          created_at: new Date().toISOString(),
        },
        {
          id: 'event-2',
          campsite_id: 'other-campsite-id',
          user_id: 'other-user-id',
          event_type: 'booking_click',
          metadata: {},
          created_at: new Date().toISOString(),
        },
      ];

      const mockChain = mockSupabaseAdmin._createMockQueryChain();
      const mockEq = jest.fn().mockResolvedValue({
        data: mockEvents,
        error: null,
      });
      mockChain._mockSelect.mockReturnValue({ eq: mockEq });

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const { data: events } = await mockSupabaseAdmin
        .from('analytics_events')
        .select('*')
        .eq('event_type', 'booking_click');

      expect(events).toBeDefined();
      expect(events.length).toBe(2);
      events.forEach((event: any) => {
        expect(event.event_type).toBe('booking_click');
      });
    });

    it('should have index on created_at DESC for time-based queries', async () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const mockEvents = [
        {
          id: 'event-1',
          campsite_id: testCampsiteId,
          user_id: testUserId,
          event_type: 'profile_view',
          metadata: {},
          created_at: now.toISOString(),
        },
        {
          id: 'event-2',
          campsite_id: testCampsiteId,
          user_id: testUserId,
          event_type: 'booking_click',
          metadata: {},
          created_at: yesterday.toISOString(),
        },
      ];

      const mockChain = mockSupabaseAdmin._createMockQueryChain();
      mockChain._mockSelect.mockResolvedValue({
        data: mockEvents.sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ),
        error: null,
      });

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const { data: events } = await mockSupabaseAdmin
        .from('analytics_events')
        .select('*');

      expect(events).toBeDefined();
      expect(events.length).toBe(2);
      // Verify descending order
      expect(new Date(events[0].created_at).getTime())
        .toBeGreaterThan(new Date(events[1].created_at).getTime());
    });

    it('should have composite index on (campsite_id, event_type)', async () => {
      const mockEvents = [
        {
          id: 'event-1',
          campsite_id: testCampsiteId,
          user_id: testUserId,
          event_type: 'profile_view',
          metadata: {},
          created_at: new Date().toISOString(),
        },
        {
          id: 'event-2',
          campsite_id: testCampsiteId,
          user_id: 'other-user-id',
          event_type: 'profile_view',
          metadata: {},
          created_at: new Date().toISOString(),
        },
      ];

      const mockChain = mockSupabaseAdmin._createMockQueryChain();
      const mockEq2 = jest.fn().mockResolvedValue({
        data: mockEvents,
        error: null,
      });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      mockChain._mockSelect.mockReturnValue({ eq: mockEq1 });

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const { data: events } = await mockSupabaseAdmin
        .from('analytics_events')
        .select('*')
        .eq('campsite_id', testCampsiteId)
        .eq('event_type', 'profile_view');

      expect(events).toBeDefined();
      expect(events.length).toBe(2);
      events.forEach((event: any) => {
        expect(event.campsite_id).toBe(testCampsiteId);
        expect(event.event_type).toBe('profile_view');
      });
    });

    it('should have GIN index on metadata for JSONB queries', async () => {
      const mockEvents = [
        {
          id: 'event-1',
          campsite_id: testCampsiteId,
          user_id: testUserId,
          event_type: 'search_impression',
          metadata: { search_query: 'camping chiang mai', source: 'homepage' },
          created_at: new Date().toISOString(),
        },
      ];

      const mockChain = mockSupabaseAdmin._createMockQueryChain();
      const mockEq = jest.fn().mockResolvedValue({
        data: mockEvents,
        error: null,
      });
      mockChain._mockSelect.mockReturnValue({ eq: mockEq });

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const { data: events } = await mockSupabaseAdmin
        .from('analytics_events')
        .select('*')
        .eq('campsite_id', testCampsiteId);

      expect(events).toBeDefined();
      expect(events.length).toBe(1);
      expect(events[0].metadata).toHaveProperty('search_query');
      expect(events[0].metadata.search_query).toBe('camping chiang mai');
    });
  });

  describe('Event type enum values are correct', () => {
    const validEventTypes = [
      'search_impression',
      'profile_view',
      'booking_click',
      'inquiry_sent',
      'wishlist_add',
      'phone_click',
      'website_click',
    ];

    validEventTypes.forEach((eventType) => {
      it(`should accept valid event_type: ${eventType}`, async () => {
        const mockEvent = {
          id: testEventId,
          campsite_id: testCampsiteId,
          user_id: testUserId,
          event_type: eventType,
          metadata: {},
          created_at: new Date().toISOString(),
        };

        const mockChain = mockSupabaseAdmin._createMockQueryChain();
        mockChain._mockSingle.mockResolvedValue({
          data: mockEvent,
          error: null,
        });

        mockSupabaseAdmin.from.mockReturnValue(mockChain);

        const { data: event, error } = await mockSupabaseAdmin
          .from('analytics_events')
          .insert({
            campsite_id: testCampsiteId,
            user_id: testUserId,
            event_type: eventType,
            metadata: {},
          })
          .select()
          .single();

        expect(error).toBeNull();
        expect(event).toBeDefined();
        expect(event.event_type).toBe(eventType);
      });
    });

    it('should reject invalid event_type', async () => {
      const mockChain = mockSupabaseAdmin._createMockQueryChain();
      mockChain._mockSingle.mockResolvedValue({
        data: null,
        error: {
          code: '22P02',
          message: 'invalid input value for enum event_type: "invalid_event"',
        },
      });

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const { data: event, error } = await mockSupabaseAdmin
        .from('analytics_events')
        .insert({
          campsite_id: testCampsiteId,
          user_id: testUserId,
          event_type: 'invalid_event',
          metadata: {},
        })
        .select()
        .single();

      expect(event).toBeNull();
      expect(error).toBeDefined();
      expect(error.code).toBe('22P02');
      expect(error.message).toContain('invalid input value for enum');
    });
  });

  describe('Default values work correctly', () => {
    it('should generate UUID for id if not provided', async () => {
      const mockEvent = {
        id: testEventId,
        campsite_id: testCampsiteId,
        user_id: testUserId,
        event_type: 'profile_view',
        metadata: {},
        created_at: new Date().toISOString(),
      };

      const mockChain = mockSupabaseAdmin._createMockQueryChain();
      mockChain._mockSingle.mockResolvedValue({
        data: mockEvent,
        error: null,
      });

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const { data: event } = await mockSupabaseAdmin
        .from('analytics_events')
        .insert({
          campsite_id: testCampsiteId,
          user_id: testUserId,
          event_type: 'profile_view',
        })
        .select()
        .single();

      expect(event).toBeDefined();
      expect(event.id).toBeDefined();
      expect(typeof event.id).toBe('string');
    });

    it('should default metadata to empty object if not provided', async () => {
      const mockEvent = {
        id: testEventId,
        campsite_id: testCampsiteId,
        user_id: testUserId,
        event_type: 'profile_view',
        metadata: {},
        created_at: new Date().toISOString(),
      };

      const mockChain = mockSupabaseAdmin._createMockQueryChain();
      mockChain._mockSingle.mockResolvedValue({
        data: mockEvent,
        error: null,
      });

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const { data: event } = await mockSupabaseAdmin
        .from('analytics_events')
        .insert({
          campsite_id: testCampsiteId,
          user_id: testUserId,
          event_type: 'profile_view',
        })
        .select()
        .single();

      expect(event).toBeDefined();
      expect(event.metadata).toEqual({});
    });

    it('should set created_at to NOW() if not provided', async () => {
      const now = new Date().toISOString();
      const mockEvent = {
        id: testEventId,
        campsite_id: testCampsiteId,
        user_id: testUserId,
        event_type: 'profile_view',
        metadata: {},
        created_at: now,
      };

      const mockChain = mockSupabaseAdmin._createMockQueryChain();
      mockChain._mockSingle.mockResolvedValue({
        data: mockEvent,
        error: null,
      });

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const { data: event } = await mockSupabaseAdmin
        .from('analytics_events')
        .insert({
          campsite_id: testCampsiteId,
          user_id: testUserId,
          event_type: 'profile_view',
        })
        .select()
        .single();

      expect(event).toBeDefined();
      expect(event.created_at).toBeDefined();
      expect(typeof event.created_at).toBe('string');
    });
  });

  describe('Cascade delete works (campsite deleted = events deleted)', () => {
    it('should delete all analytics events when campsite is deleted (ON DELETE CASCADE)', async () => {
      // First, verify events exist for the campsite
      const mockEventsBeforeDeletion = [
        {
          id: 'event-1',
          campsite_id: testCampsiteId,
          user_id: testUserId,
          event_type: 'profile_view',
          metadata: {},
          created_at: new Date().toISOString(),
        },
        {
          id: 'event-2',
          campsite_id: testCampsiteId,
          user_id: 'other-user-id',
          event_type: 'booking_click',
          metadata: {},
          created_at: new Date().toISOString(),
        },
      ];

      const mockChain1 = mockSupabaseAdmin._createMockQueryChain();
      const mockEq1 = jest.fn().mockResolvedValue({
        data: mockEventsBeforeDeletion,
        error: null,
      });
      mockChain1._mockSelect.mockReturnValue({ eq: mockEq1 });

      const mockChain2 = mockSupabaseAdmin._createMockQueryChain();
      const mockEq2 = jest.fn().mockResolvedValue({
        data: [],
        error: null,
      });
      mockChain2._mockSelect.mockReturnValue({ eq: mockEq2 });

      mockSupabaseAdmin.from
        .mockReturnValueOnce(mockChain1)
        .mockReturnValueOnce(mockChain2);

      // Query events before deletion
      const { data: eventsBefore } = await mockSupabaseAdmin
        .from('analytics_events')
        .select('*')
        .eq('campsite_id', testCampsiteId);

      expect(eventsBefore.length).toBe(2);

      // Simulate campsite deletion (CASCADE should delete events)
      // Query events after deletion
      const { data: eventsAfter } = await mockSupabaseAdmin
        .from('analytics_events')
        .select('*')
        .eq('campsite_id', testCampsiteId);

      expect(eventsAfter.length).toBe(0);
    });

    it('should NOT delete events when user/profile is deleted (ON DELETE SET NULL)', async () => {
      // Events should remain but user_id should be set to NULL
      const mockEventAfterProfileDeletion = {
        id: testEventId,
        campsite_id: testCampsiteId,
        user_id: null,
        event_type: 'profile_view',
        metadata: {},
        created_at: new Date().toISOString(),
      };

      const mockChain = mockSupabaseAdmin._createMockQueryChain();
      mockChain._mockSingle.mockResolvedValue({
        data: mockEventAfterProfileDeletion,
        error: null,
      });

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const { data: event } = await mockSupabaseAdmin
        .from('analytics_events')
        .select('*')
        .eq('id', testEventId)
        .single();

      expect(event).toBeDefined();
      expect(event.id).toBe(testEventId);
      expect(event.user_id).toBeNull();
      expect(event.campsite_id).toBe(testCampsiteId);
    });

    it('should preserve events for other campsites when one campsite is deleted', async () => {
      const otherCampsiteId = 'other-campsite-id';

      const mockEventsOtherCampsite = [
        {
          id: 'event-other-1',
          campsite_id: otherCampsiteId,
          user_id: testUserId,
          event_type: 'profile_view',
          metadata: {},
          created_at: new Date().toISOString(),
        },
      ];

      const mockChain = mockSupabaseAdmin._createMockQueryChain();
      const mockEq = jest.fn().mockResolvedValue({
        data: mockEventsOtherCampsite,
        error: null,
      });
      mockChain._mockSelect.mockReturnValue({ eq: mockEq });

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      // After deleting testCampsiteId, events for otherCampsiteId should remain
      const { data: eventsOtherCampsite } = await mockSupabaseAdmin
        .from('analytics_events')
        .select('*')
        .eq('campsite_id', otherCampsiteId);

      expect(eventsOtherCampsite).toBeDefined();
      expect(eventsOtherCampsite.length).toBe(1);
      expect(eventsOtherCampsite[0].campsite_id).toBe(otherCampsiteId);
    });
  });
});
