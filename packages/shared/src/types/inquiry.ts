// Inquiry Types for the Camping Thailand platform
// Rate limiting: 5 inquiries per user per 24 hours (Q18)
// Email notifications: Mailgun for owner notification and user confirmation (Q12)

export type InquiryType = 'booking' | 'general' | 'complaint' | 'other';
export type InquiryStatus = 'new' | 'in_progress' | 'resolved' | 'closed';

export interface Inquiry {
  id: string;
  campsite_id: string;
  user_id: string | null;
  guest_name: string;
  guest_email: string;
  guest_phone: string | null;
  inquiry_type: InquiryType;
  subject: string | null;
  message: string;
  check_in_date: string | null;
  check_out_date: string | null;
  guest_count: number | null;
  accommodation_type_id: string | null;
  status: InquiryStatus;
  owner_reply: string | null;
  replied_at: string | null;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface InquiryWithCampsite extends Inquiry {
  campsite: {
    id: string;
    name: string;
    thumbnail_url: string | null;
  };
}

export interface InquiryListResponse {
  inquiries: InquiryWithCampsite[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  unread_count: number;
}

export interface InquiryDetailResponse extends InquiryWithCampsite {
  accommodation_type?: {
    id: string;
    name: string;
    price_per_night: number;
  } | null;
}

export interface InquiryReplyInput {
  reply: string;
}

export interface InquiryStatusUpdateInput {
  status: InquiryStatus;
}

// Create inquiry input for frontend form
export interface CreateInquiryInput {
  campsite_id: string;
  guest_name: string;
  guest_email: string;
  guest_phone?: string | null;
  inquiry_type: InquiryType;
  subject?: string | null;
  message: string;
  check_in_date?: string | null;
  check_out_date?: string | null;
  guest_count?: number | null;
  accommodation_type_id?: string | null;
}

// Rate limit info response
export interface InquiryRateLimitInfo {
  remaining: number;
  limit: number;
  resetAt: string;
}

export interface InquiryRateLimitResponse {
  success: boolean;
  data: InquiryRateLimitInfo;
}

// API response types
export interface CreateInquiryResponse {
  success: boolean;
  message: string;
  data?: {
    id: string;
  };
  error?: string;
  rateLimitInfo?: InquiryRateLimitInfo;
}
