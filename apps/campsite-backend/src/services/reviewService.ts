import { supabaseAdmin } from '../lib/supabase';
import type {
  ReviewSummary,
  ReviewWithUser,
  CreateReviewInput,
  ReviewerType,
  ReviewSortBy,
  ReportReason,
} from '@campsite/shared';

/**
 * Calculate review summary for a campsite
 */
export async function getReviewSummary(campsiteId: string): Promise<ReviewSummary> {
  // Get all non-hidden reviews
  const { data: reviews, error } = await supabaseAdmin
    .from('reviews')
    .select('rating_overall, rating_cleanliness, rating_staff, rating_facilities, rating_value, rating_location')
    .eq('campsite_id', campsiteId)
    .eq('is_hidden', false);

  if (error || !reviews || reviews.length === 0) {
    return {
      average_rating: 0,
      total_count: 0,
      rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      rating_percentages: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      category_averages: {
        cleanliness: null,
        staff: null,
        facilities: null,
        value: null,
        location: null,
      },
    };
  }

  // Calculate rating distribution
  const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<number, number>;
  let totalRating = 0;
  let cleanlinessSum = 0,
    cleanlinessCount = 0;
  let staffSum = 0,
    staffCount = 0;
  let facilitiesSum = 0,
    facilitiesCount = 0;
  let valueSum = 0,
    valueCount = 0;
  let locationSum = 0,
    locationCount = 0;

  for (const review of reviews) {
    const rating = review.rating_overall;
    if (rating >= 1 && rating <= 5) {
      ratingDistribution[rating]++;
      totalRating += rating;
    }

    if (review.rating_cleanliness) {
      cleanlinessSum += review.rating_cleanliness;
      cleanlinessCount++;
    }
    if (review.rating_staff) {
      staffSum += review.rating_staff;
      staffCount++;
    }
    if (review.rating_facilities) {
      facilitiesSum += review.rating_facilities;
      facilitiesCount++;
    }
    if (review.rating_value) {
      valueSum += review.rating_value;
      valueCount++;
    }
    if (review.rating_location) {
      locationSum += review.rating_location;
      locationCount++;
    }
  }

  const totalCount = reviews.length;
  const averageRating = totalCount > 0 ? Math.round((totalRating / totalCount) * 10) / 10 : 0;

  // Calculate percentages
  const ratingPercentages = {
    1: totalCount > 0 ? Math.round((ratingDistribution[1] / totalCount) * 100) : 0,
    2: totalCount > 0 ? Math.round((ratingDistribution[2] / totalCount) * 100) : 0,
    3: totalCount > 0 ? Math.round((ratingDistribution[3] / totalCount) * 100) : 0,
    4: totalCount > 0 ? Math.round((ratingDistribution[4] / totalCount) * 100) : 0,
    5: totalCount > 0 ? Math.round((ratingDistribution[5] / totalCount) * 100) : 0,
  };

  return {
    average_rating: averageRating,
    total_count: totalCount,
    rating_distribution: ratingDistribution as ReviewSummary['rating_distribution'],
    rating_percentages: ratingPercentages as ReviewSummary['rating_percentages'],
    category_averages: {
      cleanliness: cleanlinessCount > 0 ? Math.round((cleanlinessSum / cleanlinessCount) * 10) / 10 : null,
      staff: staffCount > 0 ? Math.round((staffSum / staffCount) * 10) / 10 : null,
      facilities: facilitiesCount > 0 ? Math.round((facilitiesSum / facilitiesCount) * 10) / 10 : null,
      value: valueCount > 0 ? Math.round((valueSum / valueCount) * 10) / 10 : null,
      location: locationCount > 0 ? Math.round((locationSum / locationCount) * 10) / 10 : null,
    },
  };
}

/**
 * Get recent reviews for a campsite with user info and photos
 */
export async function getRecentReviews(campsiteId: string, limit = 5): Promise<ReviewWithUser[]> {
  const { data: reviews, error } = await supabaseAdmin
    .from('reviews')
    .select(`
      *,
      reviewer:profiles!reviews_user_id_fkey(full_name, avatar_url),
      photos:review_photos(*)
    `)
    .eq('campsite_id', campsiteId)
    .eq('is_hidden', false)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching reviews:', error);
    return [];
  }

  return mapReviews(reviews || []);
}

/**
 * Get paginated reviews for a campsite with filters
 */
export async function getReviews(
  campsiteId: string,
  options: {
    page?: number;
    limit?: number;
    sortBy?: ReviewSortBy;
    reviewerType?: ReviewerType;
    userId?: string; // To check if current user voted helpful
  } = {}
): Promise<{ reviews: ReviewWithUser[]; total: number }> {
  const { page = 1, limit = 5, sortBy = 'newest', reviewerType, userId } = options;
  const offset = (page - 1) * limit;

  // Build order clause
  let orderColumn = 'created_at';
  let orderAscending = false;

  switch (sortBy) {
    case 'rating_high':
      orderColumn = 'rating_overall';
      orderAscending = false;
      break;
    case 'rating_low':
      orderColumn = 'rating_overall';
      orderAscending = true;
      break;
    case 'helpful':
      orderColumn = 'helpful_count';
      orderAscending = false;
      break;
    default:
      orderColumn = 'created_at';
      orderAscending = false;
  }

  // Build base query for count
  let countQuery = supabaseAdmin
    .from('reviews')
    .select('*', { count: 'exact', head: true })
    .eq('campsite_id', campsiteId)
    .eq('is_hidden', false);

  // Build base query for data
  let dataQuery = supabaseAdmin
    .from('reviews')
    .select(`
      *,
      reviewer:profiles!reviews_user_id_fkey(full_name, avatar_url),
      photos:review_photos(*)
    `)
    .eq('campsite_id', campsiteId)
    .eq('is_hidden', false);

  // Apply reviewer type filter
  if (reviewerType) {
    countQuery = countQuery.eq('reviewer_type', reviewerType);
    dataQuery = dataQuery.eq('reviewer_type', reviewerType);
  }

  // Get total count
  const { count } = await countQuery;

  // Get paginated reviews
  const { data: reviews, error } = await dataQuery
    .order(orderColumn, { ascending: orderAscending })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching reviews:', error);
    return { reviews: [], total: 0 };
  }

  // Get user's helpful votes if userId is provided
  let userHelpfulVotes: Set<string> = new Set();
  if (userId && reviews && reviews.length > 0) {
    const reviewIds = reviews.map((r: any) => r.id);
    const { data: helpfulVotes } = await supabaseAdmin
      .from('review_helpful')
      .select('review_id')
      .eq('user_id', userId)
      .in('review_id', reviewIds);

    if (helpfulVotes) {
      userHelpfulVotes = new Set(helpfulVotes.map((v: any) => v.review_id));
    }
  }

  const mappedReviews = mapReviews(reviews || [], userHelpfulVotes);
  return { reviews: mappedReviews, total: count || 0 };
}

/**
 * Create a new review (auto-approved per Q11)
 */
export async function createReview(
  input: CreateReviewInput,
  userId: string
): Promise<{ success: boolean; review?: ReviewWithUser; error?: string }> {
  // Check for duplicate review
  const { data: existing } = await supabaseAdmin
    .from('reviews')
    .select('id')
    .eq('campsite_id', input.campsite_id)
    .eq('user_id', userId)
    .single();

  if (existing) {
    return { success: false, error: 'You have already reviewed this campsite' };
  }

  // Verify campsite exists and is approved
  const { data: campsite } = await supabaseAdmin
    .from('campsites')
    .select('id, status')
    .eq('id', input.campsite_id)
    .single();

  if (!campsite || campsite.status !== 'approved') {
    return { success: false, error: 'Campsite not found or not available for reviews' };
  }

  // Create review (auto-approved - no status field needed per Q11)
  const { data: review, error } = await supabaseAdmin
    .from('reviews')
    .insert({
      campsite_id: input.campsite_id,
      user_id: userId,
      rating_overall: input.rating_overall,
      rating_cleanliness: input.rating_cleanliness,
      rating_staff: input.rating_staff,
      rating_facilities: input.rating_facilities,
      rating_value: input.rating_value,
      rating_location: input.rating_location,
      reviewer_type: input.reviewer_type,
      title: input.title,
      content: input.content,
      pros: input.pros,
      cons: input.cons,
      visited_at: input.visited_at,
    })
    .select(`
      *,
      reviewer:profiles!reviews_user_id_fkey(full_name, avatar_url)
    `)
    .single();

  if (error) {
    console.error('Error creating review:', error);
    return { success: false, error: 'Failed to create review' };
  }

  // Add photos if provided
  if (input.photo_urls && input.photo_urls.length > 0) {
    const photoInserts = input.photo_urls.map((url, index) => ({
      review_id: review.id,
      url,
      sort_order: index,
    }));

    await supabaseAdmin.from('review_photos').insert(photoInserts);
  }

  // Fetch the complete review with photos
  const { data: completeReview } = await supabaseAdmin
    .from('reviews')
    .select(`
      *,
      reviewer:profiles!reviews_user_id_fkey(full_name, avatar_url),
      photos:review_photos(*)
    `)
    .eq('id', review.id)
    .single();

  return {
    success: true,
    review: mapReviews([completeReview])[0],
  };
}

/**
 * Toggle helpful vote on a review
 */
export async function toggleHelpfulVote(
  reviewId: string,
  userId: string
): Promise<{ success: boolean; voted: boolean; helpfulCount: number }> {
  // Check if already voted
  const { data: existing } = await supabaseAdmin
    .from('review_helpful')
    .select('review_id')
    .eq('review_id', reviewId)
    .eq('user_id', userId)
    .single();

  if (existing) {
    // Remove the helpful vote
    const { error } = await supabaseAdmin
      .from('review_helpful')
      .delete()
      .eq('review_id', reviewId)
      .eq('user_id', userId);

    if (error) {
      return { success: false, voted: true, helpfulCount: 0 };
    }

    // Get updated count
    const { data: review } = await supabaseAdmin
      .from('reviews')
      .select('helpful_count')
      .eq('id', reviewId)
      .single();

    return { success: true, voted: false, helpfulCount: review?.helpful_count || 0 };
  }

  // Add helpful vote
  const { error } = await supabaseAdmin.from('review_helpful').insert({
    review_id: reviewId,
    user_id: userId,
  });

  if (error) {
    return { success: false, voted: false, helpfulCount: 0 };
  }

  // Get updated count
  const { data: review } = await supabaseAdmin
    .from('reviews')
    .select('helpful_count')
    .eq('id', reviewId)
    .single();

  return { success: true, voted: true, helpfulCount: review?.helpful_count || 0 };
}

/**
 * Report a review (Q11: report-based moderation)
 */
export async function reportReview(
  reviewId: string,
  userId: string,
  reason: ReportReason,
  details?: string
): Promise<{ success: boolean; error?: string }> {
  // Check if user already reported this review
  const { data: existing } = await supabaseAdmin
    .from('review_reports')
    .select('id')
    .eq('review_id', reviewId)
    .eq('user_id', userId)
    .single();

  if (existing) {
    return { success: false, error: 'You have already reported this review' };
  }

  // Check that user is not reporting their own review
  const { data: review } = await supabaseAdmin
    .from('reviews')
    .select('user_id')
    .eq('id', reviewId)
    .single();

  if (!review) {
    return { success: false, error: 'Review not found' };
  }

  if (review.user_id === userId) {
    return { success: false, error: 'You cannot report your own review' };
  }

  // Create report
  const { error } = await supabaseAdmin.from('review_reports').insert({
    review_id: reviewId,
    user_id: userId,
    reason,
    details,
  });

  if (error) {
    console.error('Error creating report:', error);
    return { success: false, error: 'Failed to submit report' };
  }

  return { success: true };
}

/**
 * Admin: Hide a review
 */
export async function hideReview(
  reviewId: string,
  adminId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabaseAdmin
    .from('reviews')
    .update({
      is_hidden: true,
      hidden_reason: reason,
      hidden_at: new Date().toISOString(),
      hidden_by: adminId,
    })
    .eq('id', reviewId);

  if (error) {
    console.error('Error hiding review:', error);
    return { success: false, error: 'Failed to hide review' };
  }

  return { success: true };
}

/**
 * Admin: Unhide a review
 */
export async function unhideReview(reviewId: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabaseAdmin
    .from('reviews')
    .update({
      is_hidden: false,
      hidden_reason: null,
      hidden_at: null,
      hidden_by: null,
    })
    .eq('id', reviewId);

  if (error) {
    console.error('Error unhiding review:', error);
    return { success: false, error: 'Failed to unhide review' };
  }

  return { success: true };
}

/**
 * Admin: Get reported reviews
 */
export async function getReportedReviews(
  page = 1,
  limit = 20
): Promise<{ reviews: ReviewWithUser[]; total: number }> {
  const offset = (page - 1) * limit;

  const { count } = await supabaseAdmin
    .from('reviews')
    .select('*', { count: 'exact', head: true })
    .eq('is_reported', true)
    .eq('is_hidden', false);

  const { data: reviews, error } = await supabaseAdmin
    .from('reviews')
    .select(`
      *,
      reviewer:profiles!reviews_user_id_fkey(full_name, avatar_url),
      photos:review_photos(*),
      campsite:campsites(id, name)
    `)
    .eq('is_reported', true)
    .eq('is_hidden', false)
    .order('report_count', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching reported reviews:', error);
    return { reviews: [], total: 0 };
  }

  return { reviews: mapReviews(reviews || []), total: count || 0 };
}

/**
 * Owner: Respond to a review
 */
export async function addOwnerResponse(
  reviewId: string,
  ownerId: string,
  response: string
): Promise<{ success: boolean; error?: string }> {
  // Verify owner owns the campsite this review belongs to
  const { data: review } = await supabaseAdmin
    .from('reviews')
    .select('campsite_id, campsite:campsites(owner_id)')
    .eq('id', reviewId)
    .single();

  if (!review) {
    return { success: false, error: 'Review not found' };
  }

  if ((review.campsite as any)?.owner_id !== ownerId) {
    return { success: false, error: 'You are not authorized to respond to this review' };
  }

  const { error } = await supabaseAdmin
    .from('reviews')
    .update({
      owner_response: response,
      owner_response_at: new Date().toISOString(),
    })
    .eq('id', reviewId);

  if (error) {
    console.error('Error adding owner response:', error);
    return { success: false, error: 'Failed to add response' };
  }

  return { success: true };
}

/**
 * Helper: Map raw review data to ReviewWithUser
 */
function mapReviews(reviews: any[], userHelpfulVotes: Set<string> = new Set()): ReviewWithUser[] {
  return reviews.map((review) => ({
    id: review.id,
    campsite_id: review.campsite_id,
    user_id: review.user_id,
    rating_overall: review.rating_overall,
    rating_cleanliness: review.rating_cleanliness,
    rating_staff: review.rating_staff,
    rating_facilities: review.rating_facilities,
    rating_value: review.rating_value,
    rating_location: review.rating_location,
    reviewer_type: review.reviewer_type,
    title: review.title,
    content: review.content,
    pros: review.pros,
    cons: review.cons,
    helpful_count: review.helpful_count,
    is_reported: review.is_reported,
    report_count: review.report_count,
    is_hidden: review.is_hidden,
    hidden_reason: review.hidden_reason,
    hidden_at: review.hidden_at,
    hidden_by: review.hidden_by,
    owner_response: review.owner_response,
    owner_response_at: review.owner_response_at,
    visited_at: review.visited_at,
    created_at: review.created_at,
    updated_at: review.updated_at,
    reviewer_name: review.reviewer?.full_name || 'Anonymous',
    reviewer_avatar: review.reviewer?.avatar_url || null,
    photos: review.photos || [],
    user_helpful_vote: userHelpfulVotes.has(review.id),
  }));
}
