// Inquiry Service for Camping Thailand Platform
// Handles inquiry creation, retrieval, and replies
// Rate limiting: 5 inquiries per user per 24 hours (Q18)

import { supabaseAdmin } from '../lib/supabase';
import logger from '../utils/logger';
import {
  sendInquiryNotification,
  sendInquiryConfirmation,
  sendInquiryReplyNotification,
} from './emailService';
import type {
  CreateInquiryInput,
  InquiryStatus,
  InquiryListQuery,
} from '@campsite/shared';

// Inquiry service result types
interface CreateInquiryResult {
  success: boolean;
  inquiry?: { id: string };
  error?: string;
}

interface GetInquiriesResult {
  inquiries: any[];
  total: number;
  unread_count: number;
}

interface UpdateInquiryResult {
  success: boolean;
  error?: string;
}

/**
 * Create a new inquiry
 * Sends email notifications to owner and confirmation to guest
 */
export async function createInquiry(
  input: CreateInquiryInput,
  userId?: string
): Promise<CreateInquiryResult> {
  try {
    // Get campsite info for email notification
    const { data: campsite, error: campsiteError } = await supabaseAdmin
      .from('campsites')
      .select(`
        id,
        name,
        owner_id,
        profiles:owner_id (
          id,
          full_name,
          email
        )
      `)
      .eq('id', input.campsite_id)
      .single();

    if (campsiteError || !campsite) {
      logger.error('Campsite not found for inquiry', { campsiteId: input.campsite_id, error: campsiteError });
      return { success: false, error: 'Campsite not found' };
    }

    // Insert inquiry
    const { data: inquiry, error: insertError } = await supabaseAdmin
      .from('inquiries')
      .insert({
        campsite_id: input.campsite_id,
        user_id: userId || null,
        guest_name: input.guest_name,
        guest_email: input.guest_email,
        guest_phone: input.guest_phone || null,
        inquiry_type: input.inquiry_type || 'general',
        subject: input.subject || null,
        message: input.message,
        check_in_date: input.check_in_date || null,
        check_out_date: input.check_out_date || null,
        guest_count: input.guest_count || null,
        accommodation_type_id: input.accommodation_type_id || null,
        status: 'new',
      })
      .select('id')
      .single();

    if (insertError || !inquiry) {
      logger.error('Failed to create inquiry', { error: insertError, input });
      return { success: false, error: 'Failed to create inquiry' };
    }

    // Track analytics event
    await supabaseAdmin
      .from('analytics_events')
      .insert({
        campsite_id: input.campsite_id,
        user_id: userId || null,
        event_type: 'inquiry_sent',
        metadata: {
          inquiry_type: input.inquiry_type,
          has_dates: !!(input.check_in_date && input.check_out_date),
        },
      });

    // Send email notifications (non-blocking)
    // profiles can be a single object or array depending on the join
    const profilesData = campsite.profiles;
    const ownerProfile = Array.isArray(profilesData)
      ? profilesData[0] as { id: string; full_name: string; email?: string } | undefined
      : profilesData as { id: string; full_name: string; email?: string } | null;
    const ownerEmail = ownerProfile?.email;
    const ownerName = ownerProfile?.full_name || 'Owner';

    // Get owner email from auth.users if not in profile
    let finalOwnerEmail = ownerEmail;
    if (!finalOwnerEmail && campsite.owner_id) {
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(campsite.owner_id);
      finalOwnerEmail = authUser?.user?.email;
    }

    // Send notification to owner (async, don't wait)
    if (finalOwnerEmail) {
      sendInquiryNotification(finalOwnerEmail, {
        ownerName,
        campsiteName: campsite.name,
        guestName: input.guest_name,
        guestEmail: input.guest_email,
        guestPhone: input.guest_phone,
        inquiryType: input.inquiry_type || 'general',
        message: input.message,
        checkInDate: input.check_in_date,
        checkOutDate: input.check_out_date,
        inquiryId: inquiry.id,
      }).catch(err => {
        logger.error('Failed to send owner notification', { error: err, inquiryId: inquiry.id });
      });
    }

    // Send confirmation to guest (async, don't wait)
    sendInquiryConfirmation(input.guest_email, {
      guestName: input.guest_name,
      campsiteName: campsite.name,
      message: input.message,
      checkInDate: input.check_in_date,
      checkOutDate: input.check_out_date,
    }).catch(err => {
      logger.error('Failed to send guest confirmation', { error: err, inquiryId: inquiry.id });
    });

    logger.info('Inquiry created successfully', { inquiryId: inquiry.id, campsiteId: input.campsite_id });

    return { success: true, inquiry: { id: inquiry.id } };
  } catch (error) {
    logger.error('Exception creating inquiry', { error, input });
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Get inquiries for owner (with filtering and pagination)
 */
export async function getOwnerInquiries(
  ownerId: string,
  query: InquiryListQuery
): Promise<GetInquiriesResult> {
  try {
    const { status, campsite_id, page, limit, sort, order } = query;
    const offset = (page - 1) * limit;

    // Build query
    let dbQuery = supabaseAdmin
      .from('inquiries')
      .select(`
        *,
        campsite:campsites!inner (
          id,
          name,
          owner_id,
          campsite_photos (
            url,
            is_primary
          )
        )
      `, { count: 'exact' })
      .eq('campsite.owner_id', ownerId);

    // Filter by status
    if (status && status !== 'all') {
      dbQuery = dbQuery.eq('status', status);
    }

    // Filter by campsite
    if (campsite_id) {
      dbQuery = dbQuery.eq('campsite_id', campsite_id);
    }

    // Apply sorting
    const ascending = order === 'asc';
    dbQuery = dbQuery.order(sort, { ascending });

    // Apply pagination
    dbQuery = dbQuery.range(offset, offset + limit - 1);

    const { data: inquiries, error, count } = await dbQuery;

    if (error) {
      logger.error('Failed to get owner inquiries', { error, ownerId });
      return { inquiries: [], total: 0, unread_count: 0 };
    }

    // Get unread count
    const { count: unreadCount } = await supabaseAdmin
      .from('inquiries')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'new')
      .in('campsite_id', (inquiries || []).map(i => i.campsite_id));

    // Transform data to include thumbnail
    const transformedInquiries = (inquiries || []).map(inquiry => {
      const campsite = inquiry.campsite as any;
      const primaryPhoto = campsite?.campsite_photos?.find((p: any) => p.is_primary);
      const firstPhoto = campsite?.campsite_photos?.[0];

      return {
        ...inquiry,
        campsite: {
          id: campsite?.id,
          name: campsite?.name,
          thumbnail_url: primaryPhoto?.url || firstPhoto?.url || null,
        },
      };
    });

    return {
      inquiries: transformedInquiries,
      total: count || 0,
      unread_count: unreadCount || 0,
    };
  } catch (error) {
    logger.error('Exception getting owner inquiries', { error, ownerId });
    return { inquiries: [], total: 0, unread_count: 0 };
  }
}

/**
 * Get single inquiry by ID (for owner)
 */
export async function getInquiryById(
  inquiryId: string,
  ownerId: string
): Promise<{ inquiry: any | null; error?: string }> {
  try {
    const { data: inquiry, error } = await supabaseAdmin
      .from('inquiries')
      .select(`
        *,
        campsite:campsites!inner (
          id,
          name,
          owner_id,
          campsite_photos (
            url,
            is_primary
          )
        ),
        accommodation_type:accommodation_types (
          id,
          name,
          price_per_night
        )
      `)
      .eq('id', inquiryId)
      .eq('campsite.owner_id', ownerId)
      .single();

    if (error || !inquiry) {
      return { inquiry: null, error: 'Inquiry not found' };
    }

    // Mark as read if new
    if (inquiry.read_at === null) {
      await supabaseAdmin
        .from('inquiries')
        .update({ read_at: new Date().toISOString() })
        .eq('id', inquiryId);
    }

    // Transform campsite data
    const campsite = inquiry.campsite as any;
    const primaryPhoto = campsite?.campsite_photos?.find((p: any) => p.is_primary);
    const firstPhoto = campsite?.campsite_photos?.[0];

    return {
      inquiry: {
        ...inquiry,
        campsite: {
          id: campsite?.id,
          name: campsite?.name,
          thumbnail_url: primaryPhoto?.url || firstPhoto?.url || null,
        },
      },
    };
  } catch (error) {
    logger.error('Exception getting inquiry by ID', { error, inquiryId });
    return { inquiry: null, error: 'Failed to get inquiry' };
  }
}

/**
 * Reply to an inquiry
 * Updates the inquiry and sends email notification to guest
 */
export async function replyToInquiry(
  inquiryId: string,
  ownerId: string,
  reply: string
): Promise<UpdateInquiryResult> {
  try {
    // Get inquiry with campsite and verify ownership
    const { data: inquiry, error: fetchError } = await supabaseAdmin
      .from('inquiries')
      .select(`
        *,
        campsite:campsites!inner (
          id,
          name,
          owner_id
        )
      `)
      .eq('id', inquiryId)
      .eq('campsite.owner_id', ownerId)
      .single();

    if (fetchError || !inquiry) {
      return { success: false, error: 'Inquiry not found or access denied' };
    }

    // Update inquiry with reply
    const { error: updateError } = await supabaseAdmin
      .from('inquiries')
      .update({
        owner_reply: reply,
        replied_at: new Date().toISOString(),
        status: 'resolved',
      })
      .eq('id', inquiryId);

    if (updateError) {
      logger.error('Failed to update inquiry reply', { error: updateError, inquiryId });
      return { success: false, error: 'Failed to save reply' };
    }

    // Send email notification to guest (async)
    const campsite = inquiry.campsite as { name: string };
    sendInquiryReplyNotification(inquiry.guest_email, {
      guestName: inquiry.guest_name,
      campsiteName: campsite.name,
      ownerReply: reply,
      originalMessage: inquiry.message,
    }).catch(err => {
      logger.error('Failed to send reply notification', { error: err, inquiryId });
    });

    logger.info('Inquiry reply sent', { inquiryId, ownerId });

    return { success: true };
  } catch (error) {
    logger.error('Exception replying to inquiry', { error, inquiryId });
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Update inquiry status
 */
export async function updateInquiryStatus(
  inquiryId: string,
  ownerId: string,
  status: InquiryStatus
): Promise<UpdateInquiryResult> {
  try {
    // Verify ownership
    const { data: inquiry, error: fetchError } = await supabaseAdmin
      .from('inquiries')
      .select(`
        id,
        campsite:campsites!inner (
          owner_id
        )
      `)
      .eq('id', inquiryId)
      .eq('campsite.owner_id', ownerId)
      .single();

    if (fetchError || !inquiry) {
      return { success: false, error: 'Inquiry not found or access denied' };
    }

    // Update status
    const { error: updateError } = await supabaseAdmin
      .from('inquiries')
      .update({ status })
      .eq('id', inquiryId);

    if (updateError) {
      logger.error('Failed to update inquiry status', { error: updateError, inquiryId });
      return { success: false, error: 'Failed to update status' };
    }

    logger.info('Inquiry status updated', { inquiryId, status });

    return { success: true };
  } catch (error) {
    logger.error('Exception updating inquiry status', { error, inquiryId });
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Get user's inquiries (their sent inquiries)
 */
export async function getUserInquiries(
  userId: string,
  page = 1,
  limit = 10
): Promise<{ inquiries: any[]; total: number }> {
  try {
    const offset = (page - 1) * limit;

    const { data: inquiries, error, count } = await supabaseAdmin
      .from('inquiries')
      .select(`
        *,
        campsite:campsites (
          id,
          name,
          campsite_photos (
            url,
            is_primary
          )
        )
      `, { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error('Failed to get user inquiries', { error, userId });
      return { inquiries: [], total: 0 };
    }

    // Transform data
    const transformedInquiries = (inquiries || []).map(inquiry => {
      const campsite = inquiry.campsite as any;
      const primaryPhoto = campsite?.campsite_photos?.find((p: any) => p.is_primary);
      const firstPhoto = campsite?.campsite_photos?.[0];

      return {
        ...inquiry,
        campsite: {
          id: campsite?.id,
          name: campsite?.name,
          thumbnail_url: primaryPhoto?.url || firstPhoto?.url || null,
        },
      };
    });

    return {
      inquiries: transformedInquiries,
      total: count || 0,
    };
  } catch (error) {
    logger.error('Exception getting user inquiries', { error, userId });
    return { inquiries: [], total: 0 };
  }
}
