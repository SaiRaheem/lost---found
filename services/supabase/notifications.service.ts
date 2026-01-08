import { supabase } from './client';

export interface Notification {
    id: string;
    user_id: string;
    item_id: string;
    item_type: 'lost' | 'found';
    notification_type: 'new_match' | 'match_accepted' | 'new_message' | 'status_changed';
    related_id?: string;
    message: string;
    is_read: boolean;
    created_at: string;
}

/**
 * Get unread notification count for a specific item
 */
export async function getUnreadCountForItem(itemId: string, itemType: 'lost' | 'found'): Promise<number> {
    const { count, error } = await supabase
        .from('user_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('item_id', itemId)
        .eq('item_type', itemType)
        .eq('is_read', false);

    if (error) {
        console.error('Error getting unread count:', error);
        return 0;
    }

    return count || 0;
}

/**
 * Get all unread notifications for current user
 */
export async function getUnreadNotifications(): Promise<Notification[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('user_notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching notifications:', error);
        return [];
    }

    return data || [];
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId: string) {
    const { error } = await supabase
        .from('user_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

    if (error) throw error;
}

/**
 * Mark all notifications for an item as read
 */
export async function markItemNotificationsAsRead(itemId: string, itemType: 'lost' | 'found') {
    const { error } = await supabase
        .from('user_notifications')
        .update({ is_read: true })
        .eq('item_id', itemId)
        .eq('item_type', itemType)
        .eq('is_read', false);

    if (error) throw error;
}

/**
 * Subscribe to real-time notification updates
 */
export function subscribeToNotifications(userId: string, onNotification: (notification: Notification) => void) {
    const channel = supabase
        .channel(`notifications:${userId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'user_notifications',
                filter: `user_id=eq.${userId}`,
            },
            (payload) => {
                onNotification(payload.new as Notification);
            }
        )
        .subscribe();

    return channel;
}

/**
 * Delete old read notifications (cleanup)
 */
export async function deleteOldNotifications(daysOld: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const { error } = await supabase
        .from('user_notifications')
        .delete()
        .eq('is_read', true)
        .lt('created_at', cutoffDate.toISOString());

    if (error) throw error;
}
