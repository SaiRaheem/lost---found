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

/**
 * Get all user transactions with user details for admin view
 */
export async function getUsersWithRewards() {
    try {
        console.log('🔍 Fetching user transactions for admin...');

        // Get all users first
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('id, name, email, phone, reward_balance');

        if (usersError) {
            console.error('❌ Error fetching users:', usersError);
            throw usersError;
        }
        console.log('✅ Users fetched:', users?.length || 0);
        console.log('📋 User IDs:', users?.map(u => ({ id: u.id, name: u.name })));

        // Get all purchases with user and shop item details
        const { data: purchases, error: purchasesError } = await supabase
            .from('purchases')
            .select(`
                id,
                user_id,
                points_spent,
                status,
                created_at,
                shop_item_id,
                shop_items(name, icon)
            `)
            .order('created_at', { ascending: false });

        if (purchasesError) {
            console.error('❌ Error fetching purchases:', purchasesError);
            throw purchasesError;
        }
        console.log('✅ Purchases fetched:', purchases?.length || 0, purchases);

        // Get all redemptions with user and gift card details
        const { data: redemptions, error: redemptionsError } = await supabase
            .from('redemptions')
            .select(`
                id,
                user_id,
                points_spent,
                created_at,
                gift_card_id,
                gift_cards(name, icon)
            `)
            .order('created_at', { ascending: false });

        if (redemptionsError) {
            console.error('❌ Error fetching redemptions:', redemptionsError);
            throw redemptionsError;
        }
        console.log('✅ Redemptions fetched:', redemptions?.length || 0);

        // Combine all transactions with user details
        const allTransactions = [
            ...(purchases || []).map((p: any) => {
                const user = users?.find(u => u.id === p.user_id);
                console.log(`🔍 Purchase user_id: ${p.user_id}, Found user:`, user ? user.name : 'NOT FOUND');
                return {
                    id: p.id,
                    userName: user?.name || 'Unknown',
                    userEmail: user?.email || user?.phone || '',
                    itemBought: p.shop_items?.name || 'Unknown Item',
                    icon: p.shop_items?.icon || '🛍️',
                    cost: p.points_spent,
                    availableBalance: user?.reward_balance || 0,
                    date: p.created_at,
                    type: 'Purchase'
                };
            }),
            ...(redemptions || []).map((r: any) => {
                const user = users?.find(u => u.id === r.user_id);
                return {
                    id: r.id,
                    userName: user?.name || 'Unknown',
                    userEmail: user?.email || user?.phone || '',
                    itemBought: r.gift_cards?.name || 'Unknown Card',
                    icon: r.gift_cards?.icon || '🎁',
                    cost: r.points_spent,
                    availableBalance: user?.reward_balance || 0,
                    date: r.created_at,
                    type: 'Redemption'
                };
            })
        ];

        console.log('✅ Total transactions combined:', allTransactions.length);

        // Sort by date (most recent first)
        const sorted = allTransactions.sort((a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        console.log('✅ Returning sorted transactions:', sorted.length);
        return sorted;
    } catch (error) {
        console.error('❌ Error fetching user transactions:', error);
        return [];
    }
}
