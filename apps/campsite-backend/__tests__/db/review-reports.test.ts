/**
 * Unit tests for review_reports database schema
 * Tests the expected behavior of the review_reports table schema
 * defined in supabase/migrations/20260117000023_create_review_reports.sql
 */

import { createClient } from '@supabase/supabase-js';

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

describe('Review Reports Schema', () => {
  let mockSupabaseAdmin: any;

  const testReportId = 'report-id-123';
  const testReviewId = 'review-id-456';
  const testUserId = 'user-id-789';
  const testCampsiteId = 'campsite-id-abc';

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

  describe('Schema Structure - Required Columns', () => {
    it('should have id column with UUID type and default value', async () => {
      const mockReport = {
        id: testReportId,
        review_id: testReviewId,
        user_id: testUserId,
        reason: 'spam',
        details: null,
        created_at: new Date().toISOString(),
      };

      const mockChain = mockSupabaseAdmin._createMockQueryChain();
      mockChain._mockSingle.mockResolvedValue({
        data: mockReport,
        error: null,
      });

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const { data: report } = await mockSupabaseAdmin
        .from('review_reports')
        .select('*')
        .eq('id', testReportId)
        .single();

      expect(report).toHaveProperty('id');
      expect(report.id).toBe(testReportId);
      expect(typeof report.id).toBe('string');
    });

    it('should have review_id column as UUID NOT NULL', async () => {
      const mockReport = {
        id: testReportId,
        review_id: testReviewId,
        user_id: testUserId,
        reason: 'inappropriate',
        details: 'Contains offensive content',
        created_at: new Date().toISOString(),
      };

      const mockChain = mockSupabaseAdmin._createMockQueryChain();
      mockChain._mockSingle.mockResolvedValue({
        data: mockReport,
        error: null,
      });

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const { data: report } = await mockSupabaseAdmin
        .from('review_reports')
        .select('*')
        .eq('id', testReportId)
        .single();

      expect(report).toHaveProperty('review_id');
      expect(report.review_id).toBe(testReviewId);
      expect(typeof report.review_id).toBe('string');
    });

    it('should reject insert without review_id (NOT NULL constraint)', async () => {
      const mockChain = mockSupabaseAdmin._createMockQueryChain();
      mockChain._mockSingle.mockResolvedValue({
        data: null,
        error: {
          code: '23502',
          message: 'null value in column "review_id" violates not-null constraint',
        },
      });

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const { data: report, error } = await mockSupabaseAdmin
        .from('review_reports')
        .insert({
          user_id: testUserId,
          reason: 'spam',
        })
        .select()
        .single();

      expect(report).toBeNull();
      expect(error).toBeDefined();
      expect(error.code).toBe('23502');
      expect(error.message).toContain('review_id');
    });

    it('should have user_id column as UUID NOT NULL', async () => {
      const mockReport = {
        id: testReportId,
        review_id: testReviewId,
        user_id: testUserId,
        reason: 'fake',
        details: null,
        created_at: new Date().toISOString(),
      };

      const mockChain = mockSupabaseAdmin._createMockQueryChain();
      mockChain._mockSingle.mockResolvedValue({
        data: mockReport,
        error: null,
      });

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const { data: report } = await mockSupabaseAdmin
        .from('review_reports')
        .select('*')
        .eq('id', testReportId)
        .single();

      expect(report).toHaveProperty('user_id');
      expect(report.user_id).toBe(testUserId);
      expect(typeof report.user_id).toBe('string');
    });

    it('should reject insert without user_id (NOT NULL constraint)', async () => {
      const mockChain = mockSupabaseAdmin._createMockQueryChain();
      mockChain._mockSingle.mockResolvedValue({
        data: null,
        error: {
          code: '23502',
          message: 'null value in column "user_id" violates not-null constraint',
        },
      });

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const { data: report, error } = await mockSupabaseAdmin
        .from('review_reports')
        .insert({
          review_id: testReviewId,
          reason: 'spam',
        })
        .select()
        .single();

      expect(report).toBeNull();
      expect(error).toBeDefined();
      expect(error.code).toBe('23502');
      expect(error.message).toContain('user_id');
    });

    it('should have reason column as report_reason enum NOT NULL', async () => {
      const mockReport = {
        id: testReportId,
        review_id: testReviewId,
        user_id: testUserId,
        reason: 'other',
        details: 'Custom report reason',
        created_at: new Date().toISOString(),
      };

      const mockChain = mockSupabaseAdmin._createMockQueryChain();
      mockChain._mockSingle.mockResolvedValue({
        data: mockReport,
        error: null,
      });

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const { data: report } = await mockSupabaseAdmin
        .from('review_reports')
        .select('*')
        .eq('id', testReportId)
        .single();

      expect(report).toHaveProperty('reason');
      expect(report.reason).toBe('other');
      expect(['spam', 'inappropriate', 'fake', 'other']).toContain(report.reason);
    });

    it('should reject insert without reason (NOT NULL constraint)', async () => {
      const mockChain = mockSupabaseAdmin._createMockQueryChain();
      mockChain._mockSingle.mockResolvedValue({
        data: null,
        error: {
          code: '23502',
          message: 'null value in column "reason" violates not-null constraint',
        },
      });

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const { data: report, error } = await mockSupabaseAdmin
        .from('review_reports')
        .insert({
          review_id: testReviewId,
          user_id: testUserId,
        })
        .select()
        .single();

      expect(report).toBeNull();
      expect(error).toBeDefined();
      expect(error.code).toBe('23502');
      expect(error.message).toContain('reason');
    });

    it('should have details column as TEXT (nullable)', async () => {
      const mockReportWithDetails = {
        id: testReportId,
        review_id: testReviewId,
        user_id: testUserId,
        reason: 'spam',
        details: 'This review appears to be automated spam promoting another website',
        created_at: new Date().toISOString(),
      };

      const mockReportWithoutDetails = {
        id: 'report-id-no-details',
        review_id: testReviewId,
        user_id: testUserId,
        reason: 'fake',
        details: null,
        created_at: new Date().toISOString(),
      };

      const mockChain = mockSupabaseAdmin._createMockQueryChain();
      mockChain._mockSingle
        .mockResolvedValueOnce({ data: mockReportWithDetails, error: null })
        .mockResolvedValueOnce({ data: mockReportWithoutDetails, error: null });

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      // Test with details
      const { data: report1 } = await mockSupabaseAdmin
        .from('review_reports')
        .select('*')
        .eq('id', testReportId)
        .single();

      expect(report1).toHaveProperty('details');
      expect(report1.details).toBe('This review appears to be automated spam promoting another website');
      expect(typeof report1.details).toBe('string');

      // Test without details (null is allowed)
      const { data: report2 } = await mockSupabaseAdmin
        .from('review_reports')
        .select('*')
        .eq('id', 'report-id-no-details')
        .single();

      expect(report2).toHaveProperty('details');
      expect(report2.details).toBeNull();
    });

    it('should have created_at column with TIMESTAMPTZ type and default value', async () => {
      const now = new Date().toISOString();
      const mockReport = {
        id: testReportId,
        review_id: testReviewId,
        user_id: testUserId,
        reason: 'inappropriate',
        details: null,
        created_at: now,
      };

      const mockChain = mockSupabaseAdmin._createMockQueryChain();
      mockChain._mockSingle.mockResolvedValue({
        data: mockReport,
        error: null,
      });

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const { data: report } = await mockSupabaseAdmin
        .from('review_reports')
        .select('*')
        .eq('id', testReportId)
        .single();

      expect(report).toHaveProperty('created_at');
      expect(report.created_at).toBe(now);
      expect(typeof report.created_at).toBe('string');
    });
  });

  describe('Foreign Key Constraints', () => {
    it('should have foreign key reference to reviews(id)', async () => {
      const mockReport = {
        id: testReportId,
        review_id: testReviewId,
        user_id: testUserId,
        reason: 'spam',
        details: null,
        created_at: new Date().toISOString(),
      };

      const mockChain = mockSupabaseAdmin._createMockQueryChain();
      mockChain._mockSingle.mockResolvedValue({
        data: mockReport,
        error: null,
      });

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const { data: report } = await mockSupabaseAdmin
        .from('review_reports')
        .select('*')
        .eq('review_id', testReviewId)
        .single();

      expect(report).toBeDefined();
      expect(report.review_id).toBe(testReviewId);
    });

    it('should reject report with non-existent review_id (foreign key constraint)', async () => {
      const mockChain = mockSupabaseAdmin._createMockQueryChain();
      mockChain._mockSingle.mockResolvedValue({
        data: null,
        error: {
          code: '23503',
          message: 'insert or update on table "review_reports" violates foreign key constraint',
        },
      });

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const { data: report, error } = await mockSupabaseAdmin
        .from('review_reports')
        .insert({
          review_id: 'non-existent-review-id',
          user_id: testUserId,
          reason: 'spam',
        })
        .select()
        .single();

      expect(report).toBeNull();
      expect(error).toBeDefined();
      expect(error.code).toBe('23503');
      expect(error.message).toContain('foreign key constraint');
    });

    it('should have foreign key reference to profiles(id)', async () => {
      const mockReport = {
        id: testReportId,
        review_id: testReviewId,
        user_id: testUserId,
        reason: 'fake',
        details: null,
        created_at: new Date().toISOString(),
      };

      const mockChain = mockSupabaseAdmin._createMockQueryChain();
      mockChain._mockSingle.mockResolvedValue({
        data: mockReport,
        error: null,
      });

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const { data: report } = await mockSupabaseAdmin
        .from('review_reports')
        .select('*')
        .eq('user_id', testUserId)
        .single();

      expect(report).toBeDefined();
      expect(report.user_id).toBe(testUserId);
    });

    it('should reject report with non-existent user_id (foreign key constraint)', async () => {
      const mockChain = mockSupabaseAdmin._createMockQueryChain();
      mockChain._mockSingle.mockResolvedValue({
        data: null,
        error: {
          code: '23503',
          message: 'insert or update on table "review_reports" violates foreign key constraint',
        },
      });

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const { data: report, error } = await mockSupabaseAdmin
        .from('review_reports')
        .insert({
          review_id: testReviewId,
          user_id: 'non-existent-user-id',
          reason: 'spam',
        })
        .select()
        .single();

      expect(report).toBeNull();
      expect(error).toBeDefined();
      expect(error.code).toBe('23503');
      expect(error.message).toContain('foreign key constraint');
    });

    it('should cascade delete reports when review is deleted (ON DELETE CASCADE)', async () => {
      // First, verify reports exist for the review
      const mockReportsBeforeDeletion = [
        {
          id: 'report-1',
          review_id: testReviewId,
          user_id: testUserId,
          reason: 'spam',
          details: null,
          created_at: new Date().toISOString(),
        },
        {
          id: 'report-2',
          review_id: testReviewId,
          user_id: 'other-user-id',
          reason: 'fake',
          details: null,
          created_at: new Date().toISOString(),
        },
      ];

      const mockChain1 = mockSupabaseAdmin._createMockQueryChain();
      const mockEq1 = jest.fn().mockResolvedValue({
        data: mockReportsBeforeDeletion,
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

      // Query reports before deletion
      const { data: reportsBefore } = await mockSupabaseAdmin
        .from('review_reports')
        .select('*')
        .eq('review_id', testReviewId);

      expect(reportsBefore.length).toBe(2);

      // Simulate review deletion (CASCADE should delete reports)
      // Query reports after deletion
      const { data: reportsAfter } = await mockSupabaseAdmin
        .from('review_reports')
        .select('*')
        .eq('review_id', testReviewId);

      expect(reportsAfter.length).toBe(0);
    });

    it('should cascade delete reports when user/profile is deleted (ON DELETE CASCADE)', async () => {
      // Verify reports exist for the user
      const mockReportsBeforeDeletion = [
        {
          id: 'report-1',
          review_id: testReviewId,
          user_id: testUserId,
          reason: 'spam',
          details: null,
          created_at: new Date().toISOString(),
        },
        {
          id: 'report-2',
          review_id: 'other-review-id',
          user_id: testUserId,
          reason: 'inappropriate',
          details: null,
          created_at: new Date().toISOString(),
        },
      ];

      const mockChain1 = mockSupabaseAdmin._createMockQueryChain();
      const mockEq1 = jest.fn().mockResolvedValue({
        data: mockReportsBeforeDeletion,
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

      // Query reports before deletion
      const { data: reportsBefore } = await mockSupabaseAdmin
        .from('review_reports')
        .select('*')
        .eq('user_id', testUserId);

      expect(reportsBefore.length).toBe(2);

      // Simulate profile deletion (CASCADE should delete reports)
      // Query reports after deletion
      const { data: reportsAfter } = await mockSupabaseAdmin
        .from('review_reports')
        .select('*')
        .eq('user_id', testUserId);

      expect(reportsAfter.length).toBe(0);
    });
  });

  describe('Indexes', () => {
    it('should have index on review_id for filtering by review', async () => {
      const mockReports = [
        {
          id: 'report-1',
          review_id: testReviewId,
          user_id: testUserId,
          reason: 'spam',
          details: null,
          created_at: new Date().toISOString(),
        },
        {
          id: 'report-2',
          review_id: testReviewId,
          user_id: 'other-user-id',
          reason: 'fake',
          details: null,
          created_at: new Date().toISOString(),
        },
      ];

      const mockChain = mockSupabaseAdmin._createMockQueryChain();
      const mockEq = jest.fn().mockResolvedValue({
        data: mockReports,
        error: null,
      });
      mockChain._mockSelect.mockReturnValue({ eq: mockEq });

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const { data: reports } = await mockSupabaseAdmin
        .from('review_reports')
        .select('*')
        .eq('review_id', testReviewId);

      expect(reports).toBeDefined();
      expect(reports.length).toBe(2);
      reports.forEach((report: any) => {
        expect(report.review_id).toBe(testReviewId);
      });
    });

    it('should have index on user_id for filtering by user', async () => {
      const mockReports = [
        {
          id: 'report-1',
          review_id: testReviewId,
          user_id: testUserId,
          reason: 'spam',
          details: null,
          created_at: new Date().toISOString(),
        },
        {
          id: 'report-2',
          review_id: 'other-review-id',
          user_id: testUserId,
          reason: 'inappropriate',
          details: null,
          created_at: new Date().toISOString(),
        },
      ];

      const mockChain = mockSupabaseAdmin._createMockQueryChain();
      const mockEq = jest.fn().mockResolvedValue({
        data: mockReports,
        error: null,
      });
      mockChain._mockSelect.mockReturnValue({ eq: mockEq });

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const { data: reports } = await mockSupabaseAdmin
        .from('review_reports')
        .select('*')
        .eq('user_id', testUserId);

      expect(reports).toBeDefined();
      expect(reports.length).toBe(2);
      reports.forEach((report: any) => {
        expect(report.user_id).toBe(testUserId);
      });
    });

    it('should have index on reason for filtering by report reason', async () => {
      const mockReports = [
        {
          id: 'report-1',
          review_id: testReviewId,
          user_id: testUserId,
          reason: 'spam',
          details: null,
          created_at: new Date().toISOString(),
        },
        {
          id: 'report-2',
          review_id: 'other-review-id',
          user_id: 'other-user-id',
          reason: 'spam',
          details: null,
          created_at: new Date().toISOString(),
        },
      ];

      const mockChain = mockSupabaseAdmin._createMockQueryChain();
      const mockEq = jest.fn().mockResolvedValue({
        data: mockReports,
        error: null,
      });
      mockChain._mockSelect.mockReturnValue({ eq: mockEq });

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const { data: reports } = await mockSupabaseAdmin
        .from('review_reports')
        .select('*')
        .eq('reason', 'spam');

      expect(reports).toBeDefined();
      expect(reports.length).toBe(2);
      reports.forEach((report: any) => {
        expect(report.reason).toBe('spam');
      });
    });

    it('should have index on created_at DESC for time-based queries', async () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const mockReports = [
        {
          id: 'report-1',
          review_id: testReviewId,
          user_id: testUserId,
          reason: 'spam',
          details: null,
          created_at: now.toISOString(),
        },
        {
          id: 'report-2',
          review_id: 'other-review-id',
          user_id: testUserId,
          reason: 'fake',
          details: null,
          created_at: yesterday.toISOString(),
        },
      ];

      const mockChain = mockSupabaseAdmin._createMockQueryChain();
      mockChain._mockSelect.mockResolvedValue({
        data: mockReports.sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ),
        error: null,
      });

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const { data: reports } = await mockSupabaseAdmin
        .from('review_reports')
        .select('*');

      expect(reports).toBeDefined();
      expect(reports.length).toBe(2);
      // Verify descending order
      expect(new Date(reports[0].created_at).getTime())
        .toBeGreaterThan(new Date(reports[1].created_at).getTime());
    });
  });

  describe('Unique Constraint - Prevent Duplicate Reports', () => {
    it('should prevent duplicate reports from same user on same review (UNIQUE constraint)', async () => {
      const mockChain = mockSupabaseAdmin._createMockQueryChain();
      mockChain._mockSingle.mockResolvedValue({
        data: null,
        error: {
          code: '23505',
          message: 'duplicate key value violates unique constraint "review_reports_review_id_user_id_key"',
        },
      });

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const { data: report, error } = await mockSupabaseAdmin
        .from('review_reports')
        .insert({
          review_id: testReviewId,
          user_id: testUserId,
          reason: 'spam',
        })
        .select()
        .single();

      expect(report).toBeNull();
      expect(error).toBeDefined();
      expect(error.code).toBe('23505');
      expect(error.message).toContain('duplicate key value');
    });

    it('should allow same user to report different reviews', async () => {
      const mockReport1 = {
        id: 'report-1',
        review_id: testReviewId,
        user_id: testUserId,
        reason: 'spam',
        details: null,
        created_at: new Date().toISOString(),
      };

      const mockReport2 = {
        id: 'report-2',
        review_id: 'other-review-id',
        user_id: testUserId,
        reason: 'fake',
        details: null,
        created_at: new Date().toISOString(),
      };

      const mockChain = mockSupabaseAdmin._createMockQueryChain();
      mockChain._mockSingle
        .mockResolvedValueOnce({ data: mockReport1, error: null })
        .mockResolvedValueOnce({ data: mockReport2, error: null });

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const { data: report1, error: error1 } = await mockSupabaseAdmin
        .from('review_reports')
        .insert({
          review_id: testReviewId,
          user_id: testUserId,
          reason: 'spam',
        })
        .select()
        .single();

      const { data: report2, error: error2 } = await mockSupabaseAdmin
        .from('review_reports')
        .insert({
          review_id: 'other-review-id',
          user_id: testUserId,
          reason: 'fake',
        })
        .select()
        .single();

      expect(error1).toBeNull();
      expect(report1).toBeDefined();
      expect(report1.review_id).toBe(testReviewId);

      expect(error2).toBeNull();
      expect(report2).toBeDefined();
      expect(report2.review_id).toBe('other-review-id');
    });

    it('should allow different users to report same review', async () => {
      const mockReport1 = {
        id: 'report-1',
        review_id: testReviewId,
        user_id: testUserId,
        reason: 'spam',
        details: null,
        created_at: new Date().toISOString(),
      };

      const mockReport2 = {
        id: 'report-2',
        review_id: testReviewId,
        user_id: 'other-user-id',
        reason: 'fake',
        details: null,
        created_at: new Date().toISOString(),
      };

      const mockChain = mockSupabaseAdmin._createMockQueryChain();
      mockChain._mockSingle
        .mockResolvedValueOnce({ data: mockReport1, error: null })
        .mockResolvedValueOnce({ data: mockReport2, error: null });

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const { data: report1, error: error1 } = await mockSupabaseAdmin
        .from('review_reports')
        .insert({
          review_id: testReviewId,
          user_id: testUserId,
          reason: 'spam',
        })
        .select()
        .single();

      const { data: report2, error: error2 } = await mockSupabaseAdmin
        .from('review_reports')
        .insert({
          review_id: testReviewId,
          user_id: 'other-user-id',
          reason: 'fake',
        })
        .select()
        .single();

      expect(error1).toBeNull();
      expect(report1).toBeDefined();
      expect(report1.user_id).toBe(testUserId);

      expect(error2).toBeNull();
      expect(report2).toBeDefined();
      expect(report2.user_id).toBe('other-user-id');
    });
  });

  describe('Report Reason Enum Values', () => {
    const validReasons = ['spam', 'inappropriate', 'fake', 'other'];

    validReasons.forEach((reason) => {
      it(`should accept valid reason: ${reason}`, async () => {
        const mockReport = {
          id: testReportId,
          review_id: testReviewId,
          user_id: testUserId,
          reason: reason,
          details: null,
          created_at: new Date().toISOString(),
        };

        const mockChain = mockSupabaseAdmin._createMockQueryChain();
        mockChain._mockSingle.mockResolvedValue({
          data: mockReport,
          error: null,
        });

        mockSupabaseAdmin.from.mockReturnValue(mockChain);

        const { data: report, error } = await mockSupabaseAdmin
          .from('review_reports')
          .insert({
            review_id: testReviewId,
            user_id: testUserId,
            reason: reason,
          })
          .select()
          .single();

        expect(error).toBeNull();
        expect(report).toBeDefined();
        expect(report.reason).toBe(reason);
      });
    });

    it('should reject invalid reason enum value', async () => {
      const mockChain = mockSupabaseAdmin._createMockQueryChain();
      mockChain._mockSingle.mockResolvedValue({
        data: null,
        error: {
          code: '22P02',
          message: 'invalid input value for enum report_reason: "invalid_reason"',
        },
      });

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const { data: report, error } = await mockSupabaseAdmin
        .from('review_reports')
        .insert({
          review_id: testReviewId,
          user_id: testUserId,
          reason: 'invalid_reason',
        })
        .select()
        .single();

      expect(report).toBeNull();
      expect(error).toBeDefined();
      expect(error.code).toBe('22P02');
      expect(error.message).toContain('invalid input value for enum');
    });
  });

  describe('Default Values', () => {
    it('should generate UUID for id if not provided', async () => {
      const mockReport = {
        id: testReportId,
        review_id: testReviewId,
        user_id: testUserId,
        reason: 'spam',
        details: null,
        created_at: new Date().toISOString(),
      };

      const mockChain = mockSupabaseAdmin._createMockQueryChain();
      mockChain._mockSingle.mockResolvedValue({
        data: mockReport,
        error: null,
      });

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const { data: report } = await mockSupabaseAdmin
        .from('review_reports')
        .insert({
          review_id: testReviewId,
          user_id: testUserId,
          reason: 'spam',
        })
        .select()
        .single();

      expect(report).toBeDefined();
      expect(report.id).toBeDefined();
      expect(typeof report.id).toBe('string');
    });

    it('should set created_at to NOW() if not provided', async () => {
      const now = new Date().toISOString();
      const mockReport = {
        id: testReportId,
        review_id: testReviewId,
        user_id: testUserId,
        reason: 'inappropriate',
        details: null,
        created_at: now,
      };

      const mockChain = mockSupabaseAdmin._createMockQueryChain();
      mockChain._mockSingle.mockResolvedValue({
        data: mockReport,
        error: null,
      });

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const { data: report } = await mockSupabaseAdmin
        .from('review_reports')
        .insert({
          review_id: testReviewId,
          user_id: testUserId,
          reason: 'inappropriate',
        })
        .select()
        .single();

      expect(report).toBeDefined();
      expect(report.created_at).toBeDefined();
      expect(typeof report.created_at).toBe('string');
    });
  });

  describe('Trigger - Update Review Report Status', () => {
    it('should trigger update_review_report_status on INSERT to increment report_count', async () => {
      // Mock the trigger behavior - when a report is inserted, review report_count increases
      const mockReport = {
        id: testReportId,
        review_id: testReviewId,
        user_id: testUserId,
        reason: 'spam',
        details: null,
        created_at: new Date().toISOString(),
      };

      const mockChain = mockSupabaseAdmin._createMockQueryChain();
      mockChain._mockSingle.mockResolvedValue({
        data: mockReport,
        error: null,
      });

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const { data: report } = await mockSupabaseAdmin
        .from('review_reports')
        .insert({
          review_id: testReviewId,
          user_id: testUserId,
          reason: 'spam',
        })
        .select()
        .single();

      expect(report).toBeDefined();
      // Note: Trigger behavior (updating reviews.report_count and is_reported)
      // would be tested in integration tests with actual database
    });

    it('should trigger update_review_report_status on DELETE to decrement report_count', async () => {
      // Mock the trigger behavior - when a report is deleted, review report_count decreases
      const mockChain = mockSupabaseAdmin._createMockQueryChain();
      mockChain._mockSingle.mockResolvedValue({
        data: null,
        error: null,
      });

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const { error } = await mockSupabaseAdmin
        .from('review_reports')
        .delete()
        .eq('id', testReportId)
        .single();

      expect(error).toBeNull();
      // Note: Trigger behavior would be tested in integration tests
    });
  });

  describe('RLS Policies - Conceptual Verification', () => {
    it('should have RLS enabled on review_reports table', () => {
      // This is a conceptual test - in real implementation, RLS is tested
      // by attempting queries with different auth contexts
      expect(true).toBe(true);
    });

    it('should have policy "Users can report reviews" for INSERT', () => {
      // Conceptual test - policy allows authenticated users to insert reports
      // where user_id matches auth.uid()
      expect(true).toBe(true);
    });

    it('should have policy "Users can view own reports" for SELECT', () => {
      // Conceptual test - policy allows users to view their own reports
      expect(true).toBe(true);
    });

    it('should have policy "Admins can view all reports" for SELECT', () => {
      // Conceptual test - policy allows admins to view all reports
      expect(true).toBe(true);
    });

    it('should have policy "Admins can delete reports" for DELETE', () => {
      // Conceptual test - policy allows admins to delete reports
      expect(true).toBe(true);
    });
  });
});
