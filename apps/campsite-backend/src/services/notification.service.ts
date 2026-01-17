// Notification Service for Admin Dashboard
// Module 10: Admin Dashboard - Sends notifications to users on approval/rejection

import { supabaseAdmin } from '../lib/supabase';
import type { CreateNotificationInput } from '@campsite/shared';
import logger from '../utils/logger';

/**
 * Create a notification for a user
 */
export async function createNotification(input: CreateNotificationInput): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: input.user_id,
        type: input.type,
        title: input.title,
        message: input.message,
        entity_id: input.entity_id || null,
        read: false,
      });

    if (error) {
      logger.error('Failed to create notification', { error, input });
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    logger.error('Exception creating notification', { err, input });
    return { success: false, error: 'Failed to create notification' };
  }
}

/**
 * Notify owner when their campsite is approved
 */
export async function notifyCampsiteApproved(ownerId: string, campsiteName: string, campsiteId: string): Promise<void> {
  await createNotification({
    user_id: ownerId,
    type: 'campsite_approved',
    title: 'Campsite Approved',
    message: `Your campsite "${campsiteName}" has been approved and is now visible to the public.`,
    entity_id: campsiteId,
  });

  // TODO: Send email notification (future enhancement)
  logger.info('Campsite approved notification sent', { ownerId, campsiteName, campsiteId });
}

/**
 * Notify owner when their campsite is rejected
 */
export async function notifyCampsiteRejected(
  ownerId: string,
  campsiteName: string,
  campsiteId: string,
  reason: string
): Promise<void> {
  await createNotification({
    user_id: ownerId,
    type: 'campsite_rejected',
    title: 'Campsite Rejected',
    message: `Your campsite "${campsiteName}" was not approved. Reason: ${reason}`,
    entity_id: campsiteId,
  });

  // TODO: Send email notification (future enhancement)
  logger.info('Campsite rejected notification sent', { ownerId, campsiteName, campsiteId, reason });
}

/**
 * Notify user when their owner request is approved
 */
export async function notifyOwnerRequestApproved(userId: string, businessName: string, requestId: string): Promise<void> {
  await createNotification({
    user_id: userId,
    type: 'owner_approved',
    title: 'Owner Request Approved',
    message: `Your request to become an owner for "${businessName}" has been approved. You can now create campsites.`,
    entity_id: requestId,
  });

  // TODO: Send email notification (future enhancement)
  logger.info('Owner request approved notification sent', { userId, businessName, requestId });
}

/**
 * Notify user when their owner request is rejected
 */
export async function notifyOwnerRequestRejected(
  userId: string,
  businessName: string,
  requestId: string,
  reason: string
): Promise<void> {
  await createNotification({
    user_id: userId,
    type: 'owner_rejected',
    title: 'Owner Request Rejected',
    message: `Your request to become an owner for "${businessName}" was not approved. Reason: ${reason}`,
    entity_id: requestId,
  });

  // TODO: Send email notification (future enhancement)
  logger.info('Owner request rejected notification sent', { userId, businessName, requestId, reason });
}

/**
 * Notify user when their review is hidden by admin
 */
export async function notifyReviewHidden(
  userId: string,
  campsiteName: string,
  reviewId: string,
  reason: string
): Promise<void> {
  await createNotification({
    user_id: userId,
    type: 'review_hidden',
    title: 'Review Hidden',
    message: `Your review on "${campsiteName}" has been hidden by a moderator. Reason: ${reason}`,
    entity_id: reviewId,
  });

  // TODO: Send email notification (future enhancement)
  logger.info('Review hidden notification sent', { userId, campsiteName, reviewId, reason });
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false);

  if (error) {
    logger.error('Failed to get unread notification count', { error, userId });
    return 0;
  }

  return count || 0;
}

/**
 * Mark notification as read
 */
export async function markNotificationRead(notificationId: string, userId: string): Promise<{ success: boolean }> {
  const { error } = await supabaseAdmin
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)
    .eq('user_id', userId);

  if (error) {
    logger.error('Failed to mark notification as read', { error, notificationId, userId });
    return { success: false };
  }

  return { success: true };
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsRead(userId: string): Promise<{ success: boolean }> {
  const { error } = await supabaseAdmin
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);

  if (error) {
    logger.error('Failed to mark all notifications as read', { error, userId });
    return { success: false };
  }

  return { success: true };
}

/**
 * Get user notifications with pagination
 */
export async function getUserNotifications(
  userId: string,
  page = 1,
  limit = 20
): Promise<{ notifications: any[]; total: number }> {
  const offset = (page - 1) * limit;

  const { count } = await supabaseAdmin
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  const { data, error } = await supabaseAdmin
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    logger.error('Failed to get user notifications', { error, userId });
    return { notifications: [], total: 0 };
  }

  return { notifications: data || [], total: count || 0 };
}
