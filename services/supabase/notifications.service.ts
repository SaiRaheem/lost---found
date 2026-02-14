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
    // Item details for richer notifications
    item_name?: string;
    item_category?: string;
    location?: string;
    // Other user's name for personalized messages
    other_user_name?: string;
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
 * Get all unread notifications for current user with item details and other user's name
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

    // Fetch item details and other user's name for each notification
    const notificationsWithDetails = await Promise.all(
        (data || []).map(async (notif) => {
            const table = notif.item_type === 'lost' ? 'lost_items' : 'found_items';

            // Fetch item details
            const { data: itemData } = await supabase
                .from(table)
                .select(`item_name, item_category, location, user_id`)
                .eq('id', notif.item_id)
                .single();

            // Fetch other user's name from related_id (match or message)
            let otherUserName = null;
            if (notif.related_id) {
                // Fetch match first
                const { data: matchData, error: matchError } = await supabase
                    .from('matches')
                    .select('lost_item_id, found_item_id')
                    .eq('id', notif.related_id)
                    .maybeSingle(); // Use maybeSingle to avoid error on 0 rows

                if (matchData && !matchError) {
                    // Now fetch the items separately
                    const { data: lostItemData } = await supabase
                        .from('lost_items')
                        .select('owner_name')
                        .eq('id', matchData.lost_item_id)
                        .maybeSingle();

                    const { data: foundItemData } = await supabase
                        .from('found_items')
                        .select('finder_name')
                        .eq('id', matchData.found_item_id)
                        .maybeSingle();

                    // Get the name of the OTHER user (not the current user)
                    const lostName = lostItemData?.owner_name;
                    const foundName = foundItemData?.finder_name;

                    // If current item is lost, get finder name; if found, get owner name
                    otherUserName = notif.item_type === 'lost' ? foundName : lostName;
                } else if (matchError) {
                    console.warn('Error fetching match data:', matchError);
                }
            }

            // If still no name, try to get from the item's user
            if (!otherUserName && itemData?.user_id && itemData.user_id !== user.id) {
                const { data: userData } = await supabase
                    .from('users')
                    .select('name')
                    .eq('id', itemData.user_id)
                    .single();

                otherUserName = userData?.name;
            }

            return {
                ...notif,
                item_name: itemData?.item_name,
                item_category: itemData?.item_category,
                location: itemData?.location,
                other_user_name: otherUserName,
            } as Notification;
        })
    );

    return notificationsWithDetails;
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
