import { createReview } from '../../src/services/reviewService';
import type { CreateReviewInput } from '@campsite/shared';

// Mock Supabase
jest.mock('../../src/lib/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(),
  },
}));

import { supabaseAdmin } from '../../src/lib/supabase';

describe('ReviewService - Create Review (Auto-Approved per Q11)', () => {
  let mockFrom: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFrom = supabaseAdmin.from as jest.Mock;
  });

  describe('createReview - Auto-Approval', () => {
    const validInput: CreateReviewInput = {
      campsite_id: 'campsite-123',
      rating_overall: 4,
      rating_cleanliness: 5,
      rating_staff: 4,
      rating_facilities: 4,
      rating_value: 3,
      rating_location: 5,
      reviewer_type: 'family',
      title: 'Great family camping experience',
      content: 'We had a wonderful time at this campsite. Clean facilities and friendly staff.',
      pros: 'Clean, friendly staff, great location',
      cons: 'A bit pricey',
      visited_at: '2024-01-10',
    };

    const userId = 'user-456';

    it('should create review without pending status (auto-approved)', async () => {
      const mockCreatedReview = {
        id: 'review-789',
        campsite_id: validInput.campsite_id,
        user_id: userId,
        rating_overall: validInput.rating_overall,
        rating_cleanliness: validInput.rating_cleanliness,
        rating_staff: validInput.rating_staff,
        rating_facilities: validInput.rating_facilities,
        rating_value: validInput.rating_value,
        rating_location: validInput.rating_location,
        reviewer_type: validInput.reviewer_type,
        title: validInput.title,
        content: validInput.content,
        pros: validInput.pros,
        cons: validInput.cons,
        visited_at: validInput.visited_at,
        helpful_count: 0,
        is_reported: false,
        report_count: 0,
        is_hidden: false,
        hidden_reason: null,
        hidden_at: null,
        hidden_by: null,
        owner_response: null,
        owner_response_at: null,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
        reviewer: { full_name: 'John Doe', avatar_url: 'https://example.com/avatar.jpg' },
      };

      // Mock existing review check - no duplicate
      const existingSingle = jest.fn().mockResolvedValue({ data: null, error: null });
      const existingEq2 = jest.fn().mockReturnValue({ single: existingSingle });
      const existingEq1 = jest.fn().mockReturnValue({ eq: existingEq2 });
      const existingSelect = jest.fn().mockReturnValue({ eq: existingEq1 });

      // Mock campsite verification - approved campsite
      const campsiteSingle = jest.fn().mockResolvedValue({
        data: { id: 'campsite-123', status: 'approved' },
        error: null,
      });
      const campsiteEq = jest.fn().mockReturnValue({ single: campsiteSingle });
      const campsiteSelect = jest.fn().mockReturnValue({ eq: campsiteEq });

      // Mock insert - review created
      const insertSingle = jest.fn().mockResolvedValue({ data: mockCreatedReview, error: null });
      const insertSelect = jest.fn().mockReturnValue({ single: insertSingle });
      const insertInsert = jest.fn().mockReturnValue({ select: insertSelect });

      // Mock complete review fetch - with photos array
      const completeSingle = jest.fn().mockResolvedValue({
        data: { ...mockCreatedReview, photos: [] },
        error: null,
      });
      const completeEq = jest.fn().mockReturnValue({ single: completeSingle });
      const completeSelect = jest.fn().mockReturnValue({ eq: completeEq });

      mockFrom
        .mockReturnValueOnce({ select: existingSelect }) // Check duplicate
        .mockReturnValueOnce({ select: campsiteSelect }) // Verify campsite
        .mockReturnValueOnce({ insert: insertInsert }) // Insert review
        .mockReturnValueOnce({ select: completeSelect }); // Fetch complete review

      const result = await createReview(validInput, userId);

      expect(result.success).toBe(true);
      expect(result.review).toBeDefined();
      expect(result.review?.id).toBe('review-789');

      // Verify no status field exists (auto-approved, no pending status)
      expect((result.review as any).status).toBeUndefined();
    });

    it('should make review immediately visible (no approval needed)', async () => {
      const mockCreatedReview = {
        id: 'review-visible',
        campsite_id: validInput.campsite_id,
        user_id: userId,
        rating_overall: validInput.rating_overall,
        rating_cleanliness: validInput.rating_cleanliness,
        rating_staff: validInput.rating_staff,
        rating_facilities: validInput.rating_facilities,
        rating_value: validInput.rating_value,
        rating_location: validInput.rating_location,
        reviewer_type: validInput.reviewer_type,
        title: validInput.title,
        content: validInput.content,
        pros: validInput.pros,
        cons: validInput.cons,
        visited_at: validInput.visited_at,
        helpful_count: 0,
        is_reported: false,
        report_count: 0,
        is_hidden: false, // Immediately visible
        hidden_reason: null,
        hidden_at: null,
        hidden_by: null,
        owner_response: null,
        owner_response_at: null,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
        reviewer: { full_name: 'Jane Smith', avatar_url: null },
      };

      // Setup mocks
      const existingSingle = jest.fn().mockResolvedValue({ data: null, error: null });
      const existingEq2 = jest.fn().mockReturnValue({ single: existingSingle });
      const existingEq1 = jest.fn().mockReturnValue({ eq: existingEq2 });
      const existingSelect = jest.fn().mockReturnValue({ eq: existingEq1 });

      const campsiteSingle = jest.fn().mockResolvedValue({
        data: { id: 'campsite-123', status: 'approved' },
        error: null,
      });
      const campsiteEq = jest.fn().mockReturnValue({ single: campsiteSingle });
      const campsiteSelect = jest.fn().mockReturnValue({ eq: campsiteEq });

      const insertSingle = jest.fn().mockResolvedValue({ data: mockCreatedReview, error: null });
      const insertSelect = jest.fn().mockReturnValue({ single: insertSingle });
      const insertInsert = jest.fn().mockReturnValue({ select: insertSelect });

      const completeSingle = jest.fn().mockResolvedValue({
        data: { ...mockCreatedReview, photos: [] },
        error: null,
      });
      const completeEq = jest.fn().mockReturnValue({ single: completeSingle });
      const completeSelect = jest.fn().mockReturnValue({ eq: completeEq });

      mockFrom
        .mockReturnValueOnce({ select: existingSelect })
        .mockReturnValueOnce({ select: campsiteSelect })
        .mockReturnValueOnce({ insert: insertInsert })
        .mockReturnValueOnce({ select: completeSelect });

      const result = await createReview(validInput, userId);

      expect(result.success).toBe(true);
      expect(result.review?.is_hidden).toBe(false); // Review is visible
      expect(result.review?.hidden_reason).toBeNull();
      expect(result.review?.hidden_at).toBeNull();
    });

    it('should save all required fields correctly', async () => {
      const minimalInput: CreateReviewInput = {
        campsite_id: 'campsite-123',
        rating_overall: 5,
        reviewer_type: 'solo',
        content: 'Great place!',
      };

      const mockCreatedReview = {
        id: 'review-fields',
        campsite_id: minimalInput.campsite_id,
        user_id: userId,
        rating_overall: minimalInput.rating_overall,
        reviewer_type: minimalInput.reviewer_type,
        content: minimalInput.content,
        rating_cleanliness: null,
        rating_staff: null,
        rating_facilities: null,
        rating_value: null,
        rating_location: null,
        title: null,
        pros: null,
        cons: null,
        visited_at: null,
        helpful_count: 0,
        is_reported: false,
        report_count: 0,
        is_hidden: false,
        hidden_reason: null,
        hidden_at: null,
        hidden_by: null,
        owner_response: null,
        owner_response_at: null,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
        reviewer: { full_name: 'Test User', avatar_url: null },
      };

      // Setup mocks
      const existingSingle = jest.fn().mockResolvedValue({ data: null, error: null });
      const existingEq2 = jest.fn().mockReturnValue({ single: existingSingle });
      const existingEq1 = jest.fn().mockReturnValue({ eq: existingEq2 });
      const existingSelect = jest.fn().mockReturnValue({ eq: existingEq1 });

      const campsiteSingle = jest.fn().mockResolvedValue({
        data: { id: 'campsite-123', status: 'approved' },
        error: null,
      });
      const campsiteEq = jest.fn().mockReturnValue({ single: campsiteSingle });
      const campsiteSelect = jest.fn().mockReturnValue({ eq: campsiteEq });

      const insertSingle = jest.fn().mockResolvedValue({ data: mockCreatedReview, error: null });
      const insertSelect = jest.fn().mockReturnValue({ single: insertSingle });
      const insertInsert = jest.fn().mockReturnValue({ select: insertSelect });

      const completeSingle = jest.fn().mockResolvedValue({
        data: { ...mockCreatedReview, photos: [] },
        error: null,
      });
      const completeEq = jest.fn().mockReturnValue({ single: completeSingle });
      const completeSelect = jest.fn().mockReturnValue({ eq: completeEq });

      mockFrom
        .mockReturnValueOnce({ select: existingSelect })
        .mockReturnValueOnce({ select: campsiteSelect })
        .mockReturnValueOnce({ insert: insertInsert })
        .mockReturnValueOnce({ select: completeSelect });

      const result = await createReview(minimalInput, userId);

      expect(result.success).toBe(true);
      expect(result.review?.rating_overall).toBe(5);
      expect(result.review?.reviewer_type).toBe('solo');
      expect(result.review?.content).toBe('Great place!');
    });

    it('should save optional fields when provided', async () => {
      const mockCreatedReview = {
        id: 'review-optional',
        campsite_id: validInput.campsite_id,
        user_id: userId,
        rating_overall: validInput.rating_overall,
        rating_cleanliness: validInput.rating_cleanliness,
        rating_staff: validInput.rating_staff,
        rating_facilities: validInput.rating_facilities,
        rating_value: validInput.rating_value,
        rating_location: validInput.rating_location,
        reviewer_type: validInput.reviewer_type,
        title: validInput.title,
        content: validInput.content,
        pros: validInput.pros,
        cons: validInput.cons,
        visited_at: validInput.visited_at,
        helpful_count: 0,
        is_reported: false,
        report_count: 0,
        is_hidden: false,
        hidden_reason: null,
        hidden_at: null,
        hidden_by: null,
        owner_response: null,
        owner_response_at: null,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
        reviewer: { full_name: 'Detailed Reviewer', avatar_url: null },
      };

      // Setup mocks
      const existingSingle = jest.fn().mockResolvedValue({ data: null, error: null });
      const existingEq2 = jest.fn().mockReturnValue({ single: existingSingle });
      const existingEq1 = jest.fn().mockReturnValue({ eq: existingEq2 });
      const existingSelect = jest.fn().mockReturnValue({ eq: existingEq1 });

      const campsiteSingle = jest.fn().mockResolvedValue({
        data: { id: 'campsite-123', status: 'approved' },
        error: null,
      });
      const campsiteEq = jest.fn().mockReturnValue({ single: campsiteSingle });
      const campsiteSelect = jest.fn().mockReturnValue({ eq: campsiteEq });

      const insertSingle = jest.fn().mockResolvedValue({ data: mockCreatedReview, error: null });
      const insertSelect = jest.fn().mockReturnValue({ single: insertSingle });
      const insertInsert = jest.fn().mockReturnValue({ select: insertSelect });

      const completeSingle = jest.fn().mockResolvedValue({
        data: { ...mockCreatedReview, photos: [] },
        error: null,
      });
      const completeEq = jest.fn().mockReturnValue({ single: completeSingle });
      const completeSelect = jest.fn().mockReturnValue({ eq: completeEq });

      mockFrom
        .mockReturnValueOnce({ select: existingSelect })
        .mockReturnValueOnce({ select: campsiteSelect })
        .mockReturnValueOnce({ insert: insertInsert })
        .mockReturnValueOnce({ select: completeSelect });

      const result = await createReview(validInput, userId);

      expect(result.success).toBe(true);
      expect(result.review?.rating_cleanliness).toBe(5);
      expect(result.review?.rating_staff).toBe(4);
      expect(result.review?.rating_facilities).toBe(4);
      expect(result.review?.rating_value).toBe(3);
      expect(result.review?.rating_location).toBe(5);
      expect(result.review?.title).toBe('Great family camping experience');
      expect(result.review?.pros).toBe('Clean, friendly staff, great location');
      expect(result.review?.cons).toBe('A bit pricey');
      expect(result.review?.visited_at).toBe('2024-01-10');
    });

    it('should properly link user_id and campsite_id', async () => {
      const testUserId = 'user-999';
      const testCampsiteId = 'campsite-888';

      const mockCreatedReview = {
        id: 'review-linked',
        campsite_id: testCampsiteId,
        user_id: testUserId,
        rating_overall: 4,
        reviewer_type: 'couple',
        content: 'Nice spot',
        rating_cleanliness: null,
        rating_staff: null,
        rating_facilities: null,
        rating_value: null,
        rating_location: null,
        title: null,
        pros: null,
        cons: null,
        visited_at: null,
        helpful_count: 0,
        is_reported: false,
        report_count: 0,
        is_hidden: false,
        hidden_reason: null,
        hidden_at: null,
        hidden_by: null,
        owner_response: null,
        owner_response_at: null,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
        reviewer: { full_name: 'Couple Reviewer', avatar_url: null },
      };

      const linkInput: CreateReviewInput = {
        campsite_id: testCampsiteId,
        rating_overall: 4,
        reviewer_type: 'couple',
        content: 'Nice spot',
      };

      // Setup mocks
      const existingSingle = jest.fn().mockResolvedValue({ data: null, error: null });
      const existingEq2 = jest.fn().mockReturnValue({ single: existingSingle });
      const existingEq1 = jest.fn().mockReturnValue({ eq: existingEq2 });
      const existingSelect = jest.fn().mockReturnValue({ eq: existingEq1 });

      const campsiteSingle = jest.fn().mockResolvedValue({
        data: { id: testCampsiteId, status: 'approved' },
        error: null,
      });
      const campsiteEq = jest.fn().mockReturnValue({ single: campsiteSingle });
      const campsiteSelect = jest.fn().mockReturnValue({ eq: campsiteEq });

      const insertSingle = jest.fn().mockResolvedValue({ data: mockCreatedReview, error: null });
      const insertSelect = jest.fn().mockReturnValue({ single: insertSingle });
      const insertInsert = jest.fn().mockReturnValue({ select: insertSelect });

      const completeSingle = jest.fn().mockResolvedValue({
        data: { ...mockCreatedReview, photos: [] },
        error: null,
      });
      const completeEq = jest.fn().mockReturnValue({ single: completeSingle });
      const completeSelect = jest.fn().mockReturnValue({ eq: completeEq });

      mockFrom
        .mockReturnValueOnce({ select: existingSelect })
        .mockReturnValueOnce({ select: campsiteSelect })
        .mockReturnValueOnce({ insert: insertInsert })
        .mockReturnValueOnce({ select: completeSelect });

      const result = await createReview(linkInput, testUserId);

      expect(result.success).toBe(true);
      expect(result.review?.user_id).toBe(testUserId);
      expect(result.review?.campsite_id).toBe(testCampsiteId);
    });

    it('should set created_at timestamp', async () => {
      const mockCreatedReview = {
        id: 'review-timestamp',
        campsite_id: validInput.campsite_id,
        user_id: userId,
        rating_overall: validInput.rating_overall,
        reviewer_type: validInput.reviewer_type,
        content: validInput.content,
        rating_cleanliness: null,
        rating_staff: null,
        rating_facilities: null,
        rating_value: null,
        rating_location: null,
        title: null,
        pros: null,
        cons: null,
        visited_at: null,
        helpful_count: 0,
        is_reported: false,
        report_count: 0,
        is_hidden: false,
        hidden_reason: null,
        hidden_at: null,
        hidden_by: null,
        owner_response: null,
        owner_response_at: null,
        created_at: '2024-01-15T10:30:00Z',
        updated_at: '2024-01-15T10:30:00Z',
        reviewer: { full_name: 'Time Tester', avatar_url: null },
      };

      const minimalInput: CreateReviewInput = {
        campsite_id: 'campsite-123',
        rating_overall: 5,
        reviewer_type: 'solo',
        content: 'Good',
      };

      // Setup mocks
      const existingSingle = jest.fn().mockResolvedValue({ data: null, error: null });
      const existingEq2 = jest.fn().mockReturnValue({ single: existingSingle });
      const existingEq1 = jest.fn().mockReturnValue({ eq: existingEq2 });
      const existingSelect = jest.fn().mockReturnValue({ eq: existingEq1 });

      const campsiteSingle = jest.fn().mockResolvedValue({
        data: { id: 'campsite-123', status: 'approved' },
        error: null,
      });
      const campsiteEq = jest.fn().mockReturnValue({ single: campsiteSingle });
      const campsiteSelect = jest.fn().mockReturnValue({ eq: campsiteEq });

      const insertSingle = jest.fn().mockResolvedValue({ data: mockCreatedReview, error: null });
      const insertSelect = jest.fn().mockReturnValue({ single: insertSingle });
      const insertInsert = jest.fn().mockReturnValue({ select: insertSelect });

      const completeSingle = jest.fn().mockResolvedValue({
        data: { ...mockCreatedReview, photos: [] },
        error: null,
      });
      const completeEq = jest.fn().mockReturnValue({ single: completeSingle });
      const completeSelect = jest.fn().mockReturnValue({ eq: completeEq });

      mockFrom
        .mockReturnValueOnce({ select: existingSelect })
        .mockReturnValueOnce({ select: campsiteSelect })
        .mockReturnValueOnce({ insert: insertInsert })
        .mockReturnValueOnce({ select: completeSelect });

      const result = await createReview(minimalInput, userId);

      expect(result.success).toBe(true);
      expect(result.review?.created_at).toBeDefined();
      expect(result.review?.created_at).toBe('2024-01-15T10:30:00Z');
    });

    it('should set default values correctly', async () => {
      const mockCreatedReview = {
        id: 'review-defaults',
        campsite_id: validInput.campsite_id,
        user_id: userId,
        rating_overall: validInput.rating_overall,
        reviewer_type: validInput.reviewer_type,
        content: validInput.content,
        rating_cleanliness: null,
        rating_staff: null,
        rating_facilities: null,
        rating_value: null,
        rating_location: null,
        title: null,
        pros: null,
        cons: null,
        visited_at: null,
        helpful_count: 0, // Default
        is_reported: false, // Default
        report_count: 0, // Default
        is_hidden: false, // Default
        hidden_reason: null,
        hidden_at: null,
        hidden_by: null,
        owner_response: null,
        owner_response_at: null,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
        reviewer: { full_name: 'Default User', avatar_url: null },
      };

      const minimalInput: CreateReviewInput = {
        campsite_id: 'campsite-123',
        rating_overall: 4,
        reviewer_type: 'group',
        content: 'Decent',
      };

      // Setup mocks
      const existingSingle = jest.fn().mockResolvedValue({ data: null, error: null });
      const existingEq2 = jest.fn().mockReturnValue({ single: existingSingle });
      const existingEq1 = jest.fn().mockReturnValue({ eq: existingEq2 });
      const existingSelect = jest.fn().mockReturnValue({ eq: existingEq1 });

      const campsiteSingle = jest.fn().mockResolvedValue({
        data: { id: 'campsite-123', status: 'approved' },
        error: null,
      });
      const campsiteEq = jest.fn().mockReturnValue({ single: campsiteSingle });
      const campsiteSelect = jest.fn().mockReturnValue({ eq: campsiteEq });

      const insertSingle = jest.fn().mockResolvedValue({ data: mockCreatedReview, error: null });
      const insertSelect = jest.fn().mockReturnValue({ single: insertSingle });
      const insertInsert = jest.fn().mockReturnValue({ select: insertSelect });

      const completeSingle = jest.fn().mockResolvedValue({
        data: { ...mockCreatedReview, photos: [] },
        error: null,
      });
      const completeEq = jest.fn().mockReturnValue({ single: completeSingle });
      const completeSelect = jest.fn().mockReturnValue({ eq: completeEq });

      mockFrom
        .mockReturnValueOnce({ select: existingSelect })
        .mockReturnValueOnce({ select: campsiteSelect })
        .mockReturnValueOnce({ insert: insertInsert })
        .mockReturnValueOnce({ select: completeSelect });

      const result = await createReview(minimalInput, userId);

      expect(result.success).toBe(true);
      expect(result.review?.is_hidden).toBe(false); // Default value
      expect(result.review?.is_reported).toBe(false); // Default value
      expect(result.review?.report_count).toBe(0); // Default value
      expect(result.review?.helpful_count).toBe(0); // Default value
    });

    it('should handle photo URLs when provided', async () => {
      const inputWithPhotos: CreateReviewInput = {
        campsite_id: 'campsite-123',
        rating_overall: 5,
        reviewer_type: 'family',
        content: 'Amazing views!',
        photo_urls: [
          'https://example.com/photo1.jpg',
          'https://example.com/photo2.jpg',
          'https://example.com/photo3.jpg',
        ],
      };

      const mockCreatedReview = {
        id: 'review-with-photos',
        campsite_id: inputWithPhotos.campsite_id,
        user_id: userId,
        rating_overall: inputWithPhotos.rating_overall,
        reviewer_type: inputWithPhotos.reviewer_type,
        content: inputWithPhotos.content,
        rating_cleanliness: null,
        rating_staff: null,
        rating_facilities: null,
        rating_value: null,
        rating_location: null,
        title: null,
        pros: null,
        cons: null,
        visited_at: null,
        helpful_count: 0,
        is_reported: false,
        report_count: 0,
        is_hidden: false,
        hidden_reason: null,
        hidden_at: null,
        hidden_by: null,
        owner_response: null,
        owner_response_at: null,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
        reviewer: { full_name: 'Photo User', avatar_url: null },
      };

      const mockPhotos = [
        { id: 'photo-1', review_id: 'review-with-photos', url: 'https://example.com/photo1.jpg', sort_order: 0 },
        { id: 'photo-2', review_id: 'review-with-photos', url: 'https://example.com/photo2.jpg', sort_order: 1 },
        { id: 'photo-3', review_id: 'review-with-photos', url: 'https://example.com/photo3.jpg', sort_order: 2 },
      ];

      // Setup mocks
      const existingSingle = jest.fn().mockResolvedValue({ data: null, error: null });
      const existingEq2 = jest.fn().mockReturnValue({ single: existingSingle });
      const existingEq1 = jest.fn().mockReturnValue({ eq: existingEq2 });
      const existingSelect = jest.fn().mockReturnValue({ eq: existingEq1 });

      const campsiteSingle = jest.fn().mockResolvedValue({
        data: { id: 'campsite-123', status: 'approved' },
        error: null,
      });
      const campsiteEq = jest.fn().mockReturnValue({ single: campsiteSingle });
      const campsiteSelect = jest.fn().mockReturnValue({ eq: campsiteEq });

      const insertSingle = jest.fn().mockResolvedValue({ data: mockCreatedReview, error: null });
      const insertSelect = jest.fn().mockReturnValue({ single: insertSingle });
      const insertInsert = jest.fn().mockReturnValue({ select: insertSelect });

      // Mock photo insert
      const photoInsertMock = jest.fn().mockResolvedValue({ error: null });

      const completeSingle = jest.fn().mockResolvedValue({
        data: { ...mockCreatedReview, photos: mockPhotos },
        error: null,
      });
      const completeEq = jest.fn().mockReturnValue({ single: completeSingle });
      const completeSelect = jest.fn().mockReturnValue({ eq: completeEq });

      mockFrom
        .mockReturnValueOnce({ select: existingSelect }) // Check duplicate
        .mockReturnValueOnce({ select: campsiteSelect }) // Verify campsite
        .mockReturnValueOnce({ insert: insertInsert }) // Insert review
        .mockReturnValueOnce({ insert: photoInsertMock }) // Insert photos
        .mockReturnValueOnce({ select: completeSelect }); // Fetch complete review

      const result = await createReview(inputWithPhotos, userId);

      expect(result.success).toBe(true);
      expect(result.review?.photos).toHaveLength(3);
      expect(photoInsertMock).toHaveBeenCalled();
    });
  });
});
