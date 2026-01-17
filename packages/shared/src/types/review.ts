// Review types for the Camping Thailand platform
// Auto-approve reviews with report-based moderation (Q11)

export type ReviewerType = 'family' | 'couple' | 'solo' | 'group';

export type ReviewSortBy = 'newest' | 'helpful' | 'rating_high' | 'rating_low';

export type ReportReason = 'spam' | 'inappropriate' | 'fake' | 'other';

export interface ReviewRatings {
  overall: number;
  cleanliness?: number | null;
  staff?: number | null;
  facilities?: number | null;
  value?: number | null;
  location?: number | null;
}

export interface ReviewPhoto {
  id: string;
  review_id: string;
  url: string;
  sort_order: number;
}

export interface Review {
  id: string;
  campsite_id: string;
  user_id: string;
  rating_overall: number;
  rating_cleanliness: number | null;
  rating_staff: number | null;
  rating_facilities: number | null;
  rating_value: number | null;
  rating_location: number | null;
  reviewer_type: ReviewerType;
  title: string | null;
  content: string;
  pros: string | null;
  cons: string | null;
  helpful_count: number;
  is_reported: boolean;
  report_count: number;
  is_hidden: boolean;
  hidden_reason: string | null;
  hidden_at: string | null;
  hidden_by: string | null;
  owner_response: string | null;
  owner_response_at: string | null;
  visited_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReviewWithUser extends Review {
  reviewer_name: string;
  reviewer_avatar: string | null;
  photos: ReviewPhoto[];
  user_helpful_vote?: boolean; // Whether current user voted helpful
}

export interface ReviewSummary {
  average_rating: number;
  total_count: number;
  rating_distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  rating_percentages: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  category_averages: {
    cleanliness: number | null;
    staff: number | null;
    facilities: number | null;
    value: number | null;
    location: number | null;
  };
}

export interface ReviewListResponse {
  success: boolean;
  data: ReviewWithUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary?: ReviewSummary;
}

export interface CreateReviewInput {
  campsite_id: string;
  rating_overall: number;
  rating_cleanliness?: number;
  rating_staff?: number;
  rating_facilities?: number;
  rating_value?: number;
  rating_location?: number;
  reviewer_type: ReviewerType;
  title?: string;
  content: string;
  pros?: string;
  cons?: string;
  visited_at?: string;
  photo_urls?: string[];
}

export interface ReviewReport {
  id: string;
  review_id: string;
  user_id: string;
  reason: ReportReason;
  details: string | null;
  created_at: string;
}

export interface ReportReviewInput {
  review_id: string;
  reason: ReportReason;
  details?: string;
}

export interface HelpfulVoteResponse {
  success: boolean;
  helpful_count: number;
  user_voted: boolean;
}

export interface ReviewQueryParams {
  campsite_id: string;
  page?: number;
  limit?: number;
  sort_by?: ReviewSortBy;
  reviewer_type?: ReviewerType;
}
