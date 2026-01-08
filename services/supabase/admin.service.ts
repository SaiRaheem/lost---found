import { supabase } from './client';

/**
 * Get admin dashboard statistics
 */
export async function getAdminStats() {
    try {
        // Get counts for all tables
        const [lostItemsCount, foundItemsCount, matchesCount, usersCount] = await Promise.all([
            supabase.from('lost_items').select('*', { count: 'exact', head: true }),
            supabase.from('found_items').select('*', { count: 'exact', head: true }),
            supabase.from('matches').select('*', { count: 'exact', head: true }),
            supabase.from('users').select('*', { count: 'exact', head: true }),
        ]);

        // Get returned items count
        const { count: returnedCount } = await supabase
            .from('lost_items')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'returned');

        return {
            totalLostItems: lostItemsCount.count || 0,
            totalFoundItems: foundItemsCount.count || 0,
            totalMatches: matchesCount.count || 0,
            successfulReturns: returnedCount || 0,
            activeUsers: usersCount.count || 0,
        };
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        throw error;
    }
}

/**
 * Get all lost items
 */
export async function getAllLostItems() {
    const { data, error } = await supabase
        .from('lost_items')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

/**
 * Get all found items
 */
export async function getAllFoundItems() {
    const { data, error } = await supabase
        .from('found_items')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

/**
 * Get all matches with item details
 */
export async function getAllMatches() {
    const { data, error } = await supabase
        .from('matches')
        .select(`
            *,
            lost_items (
                id,
                item_name,
                item_category,
                owner_name
            ),
            found_items (
                id,
                item_name,
                item_category,
                finder_name
            )
        `)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

/**
 * Get all users
 */
export async function getAllUsers() {
    const { data, error } = await supabase
        .from('users')
        .select('id, name, email, phone, gender, community_type, college, created_at')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

/**
 * Delete an item (admin only)
 */
export async function deleteItem(itemId: string, itemType: 'lost' | 'found') {
    const table = itemType === 'lost' ? 'lost_items' : 'found_items';

    const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', itemId);

    if (error) throw error;
}

/**
 * Get recent activity (last 10 items/matches)
 */
export async function getRecentActivity() {
    try {
        const [lostItems, foundItems, matches] = await Promise.all([
            supabase
                .from('lost_items')
                .select('id, item_name, created_at')
                .order('created_at', { ascending: false })
                .limit(5),
            supabase
                .from('found_items')
                .select('id, item_name, created_at')
                .order('created_at', { ascending: false })
                .limit(5),
            supabase
                .from('matches')
                .select(`
                    id,
                    created_at,
                    lost_items (item_name),
                    found_items (item_name)
                `)
                .order('created_at', { ascending: false })
                .limit(5),
        ]);

        // Combine and sort all activities
        const activities = [
            ...(lostItems.data || []).map(item => ({
                type: 'lost' as const,
                message: `New lost item reported: "${item.item_name}"`,
                timestamp: item.created_at,
            })),
            ...(foundItems.data || []).map(item => ({
                type: 'found' as const,
                message: `New found item reported: "${item.item_name}"`,
                timestamp: item.created_at,
            })),
            ...(matches.data || []).map(match => ({
                type: 'match' as const,
                message: `New match found for "${(match.lost_items as any)?.item_name || 'item'}"`,
                timestamp: match.created_at,
            })),
        ];

        // Sort by timestamp and return top 10
        return activities
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 10);
    } catch (error) {
        console.error('Error fetching recent activity:', error);
        return [];
    }
}
