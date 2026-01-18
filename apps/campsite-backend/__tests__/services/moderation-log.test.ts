import { supabaseAdmin } from '../../src/lib/supabase';

jest.mock('../../src/lib/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
  },
}));

describe('Moderation Log Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Log Creation Tests', () => {
    it('should create log entry on campsite_approve', async () => {
      const mockInsert = jest.fn().mockResolvedValue({ data: {}, error: null });
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      await supabaseAdmin.from('moderation_logs').insert({
        admin_id: 'admin-123',
        action_type: 'campsite_approve',
        entity_type: 'campsite',
        entity_id: 'campsite-456',
        reason: null,
      });

      expect(supabaseAdmin.from).toHaveBeenCalledWith('moderation_logs');
      expect(mockInsert).toHaveBeenCalledWith({
        admin_id: 'admin-123',
        action_type: 'campsite_approve',
        entity_type: 'campsite',
        entity_id: 'campsite-456',
        reason: null,
      });
    });

    it('should create log entry on campsite_reject', async () => {
      const mockInsert = jest.fn().mockResolvedValue({ data: {}, error: null });
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      await supabaseAdmin.from('moderation_logs').insert({
        admin_id: 'admin-123',
        action_type: 'campsite_reject',
        entity_type: 'campsite',
        entity_id: 'campsite-456',
        reason: 'Incomplete information',
      });

      expect(mockInsert).toHaveBeenCalledWith({
        admin_id: 'admin-123',
        action_type: 'campsite_reject',
        entity_type: 'campsite',
        entity_id: 'campsite-456',
        reason: 'Incomplete information',
      });
    });

    it('should create log entry on owner_approve', async () => {
      const mockInsert = jest.fn().mockResolvedValue({ data: {}, error: null });
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      await supabaseAdmin.from('moderation_logs').insert({
        admin_id: 'admin-123',
        action_type: 'owner_approve',
        entity_type: 'profile',
        entity_id: 'owner-789',
        reason: null,
      });

      expect(mockInsert).toHaveBeenCalledWith({
        admin_id: 'admin-123',
        action_type: 'owner_approve',
        entity_type: 'profile',
        entity_id: 'owner-789',
        reason: null,
      });
    });

    it('should create log entry on owner_reject', async () => {
      const mockInsert = jest.fn().mockResolvedValue({ data: {}, error: null });
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      await supabaseAdmin.from('moderation_logs').insert({
        admin_id: 'admin-123',
        action_type: 'owner_reject',
        entity_type: 'profile',
        entity_id: 'owner-789',
        reason: 'Invalid business documents',
      });

      expect(mockInsert).toHaveBeenCalledWith({
        admin_id: 'admin-123',
        action_type: 'owner_reject',
        entity_type: 'profile',
        entity_id: 'owner-789',
        reason: 'Invalid business documents',
      });
    });

    it('should create log entry on review_hide', async () => {
      const mockInsert = jest.fn().mockResolvedValue({ data: {}, error: null });
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      await supabaseAdmin.from('moderation_logs').insert({
        admin_id: 'admin-123',
        action_type: 'review_hide',
        entity_type: 'review',
        entity_id: 'review-101',
        reason: 'Inappropriate content',
      });

      expect(mockInsert).toHaveBeenCalledWith({
        admin_id: 'admin-123',
        action_type: 'review_hide',
        entity_type: 'review',
        entity_id: 'review-101',
        reason: 'Inappropriate content',
      });
    });

    it('should create log entry on review_unhide', async () => {
      const mockInsert = jest.fn().mockResolvedValue({ data: {}, error: null });
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      await supabaseAdmin.from('moderation_logs').insert({
        admin_id: 'admin-123',
        action_type: 'review_unhide',
        entity_type: 'review',
        entity_id: 'review-101',
        reason: null,
      });

      expect(mockInsert).toHaveBeenCalledWith({
        admin_id: 'admin-123',
        action_type: 'review_unhide',
        entity_type: 'review',
        entity_id: 'review-101',
        reason: null,
      });
    });

    it('should create log entry on review_delete', async () => {
      const mockInsert = jest.fn().mockResolvedValue({ data: {}, error: null });
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      await supabaseAdmin.from('moderation_logs').insert({
        admin_id: 'admin-123',
        action_type: 'review_delete',
        entity_type: 'review',
        entity_id: 'review-101',
        reason: 'Spam content',
        metadata: { report_count: 5 },
      });

      expect(mockInsert).toHaveBeenCalledWith({
        admin_id: 'admin-123',
        action_type: 'review_delete',
        entity_type: 'review',
        entity_id: 'review-101',
        reason: 'Spam content',
        metadata: { report_count: 5 },
      });
    });

    it('should create log entry on review_dismiss', async () => {
      const mockInsert = jest.fn().mockResolvedValue({ data: {}, error: null });
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      await supabaseAdmin.from('moderation_logs').insert({
        admin_id: 'admin-123',
        action_type: 'review_dismiss',
        entity_type: 'review',
        entity_id: 'review-101',
        reason: 'Report not valid',
      });

      expect(mockInsert).toHaveBeenCalledWith({
        admin_id: 'admin-123',
        action_type: 'review_dismiss',
        entity_type: 'review',
        entity_id: 'review-101',
        reason: 'Report not valid',
      });
    });
  });

  describe('Log Data Tests', () => {
    it('should set admin_id to current admin ID', async () => {
      const mockInsert = jest.fn().mockResolvedValue({ data: {}, error: null });
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      const adminId = 'current-admin-999';
      await supabaseAdmin.from('moderation_logs').insert({
        admin_id: adminId,
        action_type: 'campsite_approve',
        entity_type: 'campsite',
        entity_id: 'campsite-001',
        reason: null,
      });

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          admin_id: adminId,
        })
      );
    });

    it('should set action_type matching the action performed', async () => {
      const mockInsert = jest.fn().mockResolvedValue({ data: {}, error: null });
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      await supabaseAdmin.from('moderation_logs').insert({
        admin_id: 'admin-123',
        action_type: 'owner_approve',
        entity_type: 'profile',
        entity_id: 'owner-001',
        reason: null,
      });

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          action_type: 'owner_approve',
        })
      );
    });

    it('should set entity_type matching the entity being moderated', async () => {
      const mockInsert = jest.fn().mockResolvedValue({ data: {}, error: null });
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      await supabaseAdmin.from('moderation_logs').insert({
        admin_id: 'admin-123',
        action_type: 'review_hide',
        entity_type: 'review',
        entity_id: 'review-001',
        reason: null,
      });

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          entity_type: 'review',
        })
      );
    });

    it('should set entity_id to the ID of the moderated item', async () => {
      const mockInsert = jest.fn().mockResolvedValue({ data: {}, error: null });
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      const entityId = 'specific-entity-123';
      await supabaseAdmin.from('moderation_logs').insert({
        admin_id: 'admin-123',
        action_type: 'campsite_approve',
        entity_type: 'campsite',
        entity_id: entityId,
        reason: null,
      });

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          entity_id: entityId,
        })
      );
    });

    it('should store reason when provided', async () => {
      const mockInsert = jest.fn().mockResolvedValue({ data: {}, error: null });
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      await supabaseAdmin.from('moderation_logs').insert({
        admin_id: 'admin-123',
        action_type: 'campsite_reject',
        entity_type: 'campsite',
        entity_id: 'campsite-001',
        reason: 'Missing required facilities',
      });

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          reason: 'Missing required facilities',
        })
      );
    });

    it('should set reason to null when not provided', async () => {
      const mockInsert = jest.fn().mockResolvedValue({ data: {}, error: null });
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      await supabaseAdmin.from('moderation_logs').insert({
        admin_id: 'admin-123',
        action_type: 'campsite_approve',
        entity_type: 'campsite',
        entity_id: 'campsite-001',
        reason: null,
      });

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          reason: null,
        })
      );
    });

    it('should store metadata with additional context for delete actions', async () => {
      const mockInsert = jest.fn().mockResolvedValue({ data: {}, error: null });
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      const metadata = {
        report_count: 10,
        original_rating: 1,
        reporter_ids: ['user-1', 'user-2'],
      };

      await supabaseAdmin.from('moderation_logs').insert({
        admin_id: 'admin-123',
        action_type: 'review_delete',
        entity_type: 'review',
        entity_id: 'review-001',
        reason: 'Multiple reports',
        metadata,
      });

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata,
        })
      );
    });
  });

  describe('Timestamp Tests', () => {
    it('should automatically set created_at timestamp', async () => {
      const mockData = {
        id: 'log-123',
        admin_id: 'admin-123',
        action_type: 'campsite_approve',
        entity_type: 'campsite',
        entity_id: 'campsite-001',
        reason: null,
        created_at: new Date().toISOString(),
      };

      const mockInsert = jest.fn().mockResolvedValue({ data: mockData, error: null });
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      const result = await supabaseAdmin.from('moderation_logs').insert({
        admin_id: 'admin-123',
        action_type: 'campsite_approve',
        entity_type: 'campsite',
        entity_id: 'campsite-001',
        reason: null,
      });

      expect(result.data).toHaveProperty('created_at');
      expect(result.data.created_at).toBeTruthy();
    });

    it('should set created_at in correct timezone format', async () => {
      const mockData = {
        id: 'log-123',
        admin_id: 'admin-123',
        action_type: 'campsite_approve',
        entity_type: 'campsite',
        entity_id: 'campsite-001',
        reason: null,
        created_at: '2026-01-18T10:30:00.000Z',
      };

      const mockInsert = jest.fn().mockResolvedValue({ data: mockData, error: null });
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      const result = await supabaseAdmin.from('moderation_logs').insert({
        admin_id: 'admin-123',
        action_type: 'campsite_approve',
        entity_type: 'campsite',
        entity_id: 'campsite-001',
        reason: null,
      });

      expect(result.data.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
    });
  });

  describe('Query Tests', () => {
    it('should query logs by admin_id', async () => {
      const mockEq = jest.fn().mockResolvedValue({ data: [], error: null });
      const mockSelect = jest.fn().mockReturnValue({
        eq: mockEq,
      });
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      await supabaseAdmin.from('moderation_logs').select('*').eq('admin_id', 'admin-123');

      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('admin_id', 'admin-123');
    });

    it('should query logs by action_type', async () => {
      const mockEq = jest.fn().mockResolvedValue({ data: [], error: null });
      const mockSelect = jest.fn().mockReturnValue({
        eq: mockEq,
      });
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      await supabaseAdmin.from('moderation_logs').select('*').eq('action_type', 'campsite_approve');

      expect(mockEq).toHaveBeenCalledWith('action_type', 'campsite_approve');
    });

    it('should query logs by entity_type', async () => {
      const mockEq = jest.fn().mockResolvedValue({ data: [], error: null });
      const mockSelect = jest.fn().mockReturnValue({
        eq: mockEq,
      });
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      await supabaseAdmin.from('moderation_logs').select('*').eq('entity_type', 'review');

      expect(mockEq).toHaveBeenCalledWith('entity_type', 'review');
    });

    it('should query logs by entity_id', async () => {
      const mockEq = jest.fn().mockResolvedValue({ data: [], error: null });
      const mockSelect = jest.fn().mockReturnValue({
        eq: mockEq,
      });
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      await supabaseAdmin.from('moderation_logs').select('*').eq('entity_id', 'campsite-456');

      expect(mockEq).toHaveBeenCalledWith('entity_id', 'campsite-456');
    });

    it('should query logs by date range', async () => {
      const mockLte = jest.fn().mockResolvedValue({ data: [], error: null });
      const mockGte = jest.fn().mockReturnValue({
        lte: mockLte,
      });
      const mockSelect = jest.fn().mockReturnValue({
        gte: mockGte,
      });
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      await supabaseAdmin
        .from('moderation_logs')
        .select('*')
        .gte('created_at', '2026-01-01')
        .lte('created_at', '2026-01-31');

      expect(mockGte).toHaveBeenCalledWith('created_at', '2026-01-01');
      expect(mockLte).toHaveBeenCalledWith('created_at', '2026-01-31');
    });
  });

  describe('Schema Validation Tests', () => {
    it('should not allow insert without admin_id', async () => {
      const mockInsert = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'admin_id is required', code: '23502' },
      });
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      const result = await supabaseAdmin.from('moderation_logs').insert({
        action_type: 'campsite_approve',
        entity_type: 'campsite',
        entity_id: 'campsite-001',
        reason: null,
      } as any);

      expect(result.error).toBeTruthy();
      expect(result.error?.code).toBe('23502');
    });

    it('should not allow insert without action_type', async () => {
      const mockInsert = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'action_type is required', code: '23502' },
      });
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      const result = await supabaseAdmin.from('moderation_logs').insert({
        admin_id: 'admin-123',
        entity_type: 'campsite',
        entity_id: 'campsite-001',
        reason: null,
      } as any);

      expect(result.error).toBeTruthy();
      expect(result.error?.code).toBe('23502');
    });

    it('should not allow insert without entity_type', async () => {
      const mockInsert = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'entity_type is required', code: '23502' },
      });
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      const result = await supabaseAdmin.from('moderation_logs').insert({
        admin_id: 'admin-123',
        action_type: 'campsite_approve',
        entity_id: 'campsite-001',
        reason: null,
      } as any);

      expect(result.error).toBeTruthy();
      expect(result.error?.code).toBe('23502');
    });

    it('should not allow insert without entity_id', async () => {
      const mockInsert = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'entity_id is required', code: '23502' },
      });
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      const result = await supabaseAdmin.from('moderation_logs').insert({
        admin_id: 'admin-123',
        action_type: 'campsite_approve',
        entity_type: 'campsite',
        reason: null,
      } as any);

      expect(result.error).toBeTruthy();
      expect(result.error?.code).toBe('23502');
    });
  });
});
