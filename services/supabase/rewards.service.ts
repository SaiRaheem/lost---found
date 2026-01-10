import { supabase } from './client';

/**
 * Reward points by item category
 */
const CATEGORY_POINTS = {
    'Electronics': 50,
    'Wallet/Money': 40,
    'ID/Cards': 30,
    'Books': 20,
    'Bag': 20,
    'Other': 10
} as const;

/**
 * Calculate time decay multiplier based on return time
 */
function calculateTimeDecay(itemReturnedAt: Date, itemLostAt: Date): number {
    const hoursDiff = (itemReturnedAt.getTime() - itemLostAt.getTime()) / (1000 * 60 * 60);

    if (hoursDiff < 24) return 1.0;  // 100% - within 24 hours
    if (hoursDiff < 72) return 0.8;  // 80% - 1-3 days
    if (hoursDiff < 168) return 0.5; // 50% - 3-7 days
    return 0; // 0% - over 7 days
}

/**
 * Calculate reward points for a match
 */
export function calculateRewardPoints(
    itemCategory: string,
    itemLostAt: Date,
    itemReturnedAt: Date,
    bonusPoints: number = 0
): { basePoints: number; timeMultiplier: number; finalPoints: number } {
    // Get base points for category
    const basePoints = CATEGORY_POINTS[itemCategory as keyof typeof CATEGORY_POINTS] || CATEGORY_POINTS['Other'];

    // Calculate time decay
    const timeMultiplier = calculateTimeDecay(itemReturnedAt, itemLostAt);

    // Calculate final points
    const finalPoints = Math.round((basePoints + bonusPoints) * timeMultiplier);

    return { basePoints, timeMultiplier, finalPoints };
}

/**
 * Issue reward for successful match
 */
export async function issueMatchReward(
    matchId: string,
    userId: string,
    itemCategory: string,
    itemLostAt: Date,
    bonusPoints: number = 0
) {
    const itemReturnedAt = new Date();

    // Calculate reward
    const { basePoints, timeMultiplier, finalPoints } = calculateRewardPoints(
        itemCategory,
        itemLostAt,
        itemReturnedAt,
        bonusPoints
    );

    // Create transaction
    const { data: transaction, error: txError } = await supabase
        .from('reward_transactions')
        .insert({
            user_id: userId,
            match_id: matchId,
            points: finalPoints,
            type: 'earned',
            category: itemCategory,
            time_multiplier: timeMultiplier,
            reason: `Reward for returning ${itemCategory}`,
            metadata: {
                base_points: basePoints,
                bonus_points: bonusPoints,
                time_multiplier: timeMultiplier
            }
        })
        .select()
        .single();

    if (txError) throw txError;

    // Update match
    const { error: matchError } = await supabase
        .from('matches')
        .update({
            reward_issued: true,
            reward_amount: finalPoints,
            item_returned_at: itemReturnedAt.toISOString()
        })
        .eq('id', matchId);

    if (matchError) throw matchError;

    return transaction;
}

/**
 * Get user's reward balance
 */
export async function getUserRewardBalance(userId: string): Promise<number> {
    const { data, error } = await supabase
        .from('users')
        .select('reward_balance')
        .eq('id', userId)
        .single();

    if (error) throw error;
    return data?.reward_balance || 0;
}

/**
 * Get user's reward transactions
 */
export async function getUserRewardTransactions(
    userId: string,
    limit: number = 50,
    type?: string
) {
    let query = supabase
        .from('reward_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (type) {
        query = query.eq('type', type);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
}

/**
 * Get reward statistics
 */
export async function getRewardStatistics(userId: string) {
    const { data, error } = await supabase
        .from('reward_transactions')
        .select('type, points')
        .eq('user_id', userId);

    if (error) throw error;

    const stats = {
        totalEarned: 0,
        totalRedeemed: 0,
        totalPenalties: 0,
        transactionCount: data?.length || 0
    };

    data?.forEach(tx => {
        if (tx.type === 'earned' || tx.type === 'bonus') {
            stats.totalEarned += tx.points;
        } else if (tx.type === 'redeemed') {
            stats.totalRedeemed += Math.abs(tx.points);
        } else if (tx.type === 'penalty') {
            stats.totalPenalties += Math.abs(tx.points);
        }
    });

    return stats;
}

/**
 * Get all gift cards
 */
export async function getGiftCards(category?: string) {
    let query = supabase
        .from('gift_cards')
        .select('*')
        .eq('is_active', true)
        .order('points_cost');

    if (category && category !== 'all') {
        query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
}

/**
 * Redeem gift card
 */
export async function redeemGiftCard(userId: string, giftCardId: string) {
    // Get user balance
    const balance = await getUserRewardBalance(userId);

    // Get gift card
    const { data: giftCard, error: cardError } = await supabase
        .from('gift_cards')
        .select('*')
        .eq('id', giftCardId)
        .single();

    if (cardError) throw cardError;
    if (!giftCard) throw new Error('Gift card not found');

    // Check balance
    if (balance < giftCard.points_cost) {
        throw new Error(`Insufficient points. You need ${giftCard.points_cost - balance} more points.`);
    }

    // Create redemption
    const redemptionCode = `GC-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const { data: redemption, error: redemptionError } = await supabase
        .from('redemptions')
        .insert({
            user_id: userId,
            gift_card_id: giftCardId,
            points_spent: giftCard.points_cost,
            redemption_code: redemptionCode,
            status: 'completed',
            completed_at: new Date().toISOString()
        })
        .select()
        .single();

    if (redemptionError) throw redemptionError;

    // Create transaction (negative points)
    const { error: txError } = await supabase
        .from('reward_transactions')
        .insert({
            user_id: userId,
            points: -giftCard.points_cost,
            type: 'redeemed',
            reason: `Redeemed ${giftCard.name}`,
            metadata: {
                gift_card_id: giftCardId,
                redemption_id: redemption.id,
                redemption_code: redemptionCode
            }
        });

    if (txError) throw txError;

    return { redemption, redemptionCode };
}

/**
 * Get all shop items
 */
export async function getShopItems(category?: string) {
    let query = supabase
        .from('shop_items')
        .select('*')
        .eq('is_active', true)
        .order('is_popular', { ascending: false })
        .order('points_cost');

    if (category && category !== 'all') {
        query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
}

/**
 * Purchase shop item
 */
export async function purchaseShopItem(userId: string, shopItemId: string) {
    // Get user balance
    const balance = await getUserRewardBalance(userId);

    // Get shop item
    const { data: shopItem, error: itemError } = await supabase
        .from('shop_items')
        .select('*')
        .eq('id', shopItemId)
        .single();

    if (itemError) throw itemError;
    if (!shopItem) throw new Error('Shop item not found');

    // Check balance
    if (balance < shopItem.points_cost) {
        throw new Error(`Insufficient points. You need ${shopItem.points_cost - balance} more points.`);
    }

    // Calculate expiry
    const expiresAt = shopItem.duration_days
        ? new Date(Date.now() + shopItem.duration_days * 24 * 60 * 60 * 1000).toISOString()
        : null;

    // Create purchase
    const { data: purchase, error: purchaseError } = await supabase
        .from('purchases')
        .insert({
            user_id: userId,
            shop_item_id: shopItemId,
            points_spent: shopItem.points_cost,
            status: 'active',
            expires_at: expiresAt
        })
        .select()
        .single();

    if (purchaseError) throw purchaseError;

    // Create transaction (negative points)
    const { error: txError } = await supabase
        .from('reward_transactions')
        .insert({
            user_id: userId,
            points: -shopItem.points_cost,
            type: 'redeemed',
            reason: `Purchased ${shopItem.name}`,
            metadata: {
                shop_item_id: shopItemId,
                purchase_id: purchase.id,
                expires_at: expiresAt
            }
        });

    if (txError) throw txError;

    return purchase;
}

/**
 * Get leaderboard
 */
export async function getLeaderboard(limit: number = 50) {
    const { data, error } = await supabase
        .from('users')
        .select('id, name, email, reward_balance')
        .order('reward_balance', { ascending: false })
        .limit(limit);

    if (error) throw error;

    // Get transaction counts for each user
    const leaderboard = await Promise.all(
        (data || []).map(async (user, index) => {
            const { data: transactions } = await supabase
                .from('reward_transactions')
                .select('id, type')
                .eq('user_id', user.id)
                .eq('type', 'earned');

            return {
                rank: index + 1,
                id: user.id,
                name: user.name || 'Anonymous',
                points: user.reward_balance || 0,
                itemsReturned: transactions?.length || 0
            };
        })
    );

    return leaderboard;
}

/**
 * Get user's redemptions
 */
export async function getUserRedemptions(userId: string) {
    const { data, error } = await supabase
        .from('redemptions')
        .select(`
            *,
            gift_card:gift_cards(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
}

/**
 * Get user's purchases
 */
export async function getUserPurchases(userId: string) {
    const { data, error } = await supabase
        .from('purchases')
        .select(`
            *,
            shop_item:shop_items(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
}
