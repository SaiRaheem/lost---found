import { supabaseAdmin } from './admin';

export interface RejectionFeedback {
    reason: 'wrong_item' | 'wrong_brand' | 'wrong_location' | 'already_returned' | 'other';
    details?: string;
}

export interface RejectionStats {
    total_rejections: number;
    high_score_rejections: number;
    total_acceptances: number;
    suspicious_flag: boolean;
    rewards_disabled: boolean;
}

/**
 * Reject a match and add the pair to the blacklist
 */
export async function rejectMatch(
    matchId: string,
    userId: string,
    feedback?: RejectionFeedback
): Promise<{ success: boolean; nextMatch?: any; error?: string }> {
    try {
        console.log('rejectMatch called:', { matchId, userId, feedback });

        // 1. Get the match details
        const { data: match, error: matchError } = await supabaseAdmin
            .from('matches')
            .select('*')
            .eq('id', matchId)
            .maybeSingle();

        console.log('Match query result:', { match, matchError });

        if (matchError) {
            console.error('Match query error:', matchError);
            return { success: false, error: `Match query failed: ${matchError.message}` };
        }

        if (!match) {
            console.error('Match not found for ID:', matchId);
            return { success: false, error: 'Match not found' };
        }

        console.log('Match found:', match);

        // 2. Update match status to rejected
        const { error: updateError } = await supabaseAdmin
            .from('matches')
            .update({
                status: 'rejected',
                rejected_at: new Date().toISOString(),
                feedback: feedback || null,
                rejection_count: (match.rejection_count || 0) + 1
            })
            .eq('id', matchId);

        if (updateError) {
            console.error('Match update error:', updateError);
            return { success: false, error: updateError.message };
        }

        console.log('Match status updated to rejected');

        // 3. Update both items back to 'active' status
        console.log('Updating item statuses to active...');

        const { error: lostItemError } = await supabaseAdmin
            .from('lost_items')
            .update({ status: 'active' })
            .eq('id', match.lost_item_id);

        if (lostItemError) {
            console.error('Error updating lost item status:', lostItemError);
        } else {
            console.log('Lost item status updated to active');
        }

        const { error: foundItemError } = await supabaseAdmin
            .from('found_items')
            .update({ status: 'active' })
            .eq('id', match.found_item_id);

        if (foundItemError) {
            console.error('Error updating found item status:', foundItemError);
        } else {
            console.log('Found item status updated to active');
        }

        // 4. Add to rejected_pairs blacklist
        await addToRejectedPairs(
            match.lost_item_id,
            match.found_item_id,
            userId,
            feedback
        );

        // 5. Update rejection stats
        await updateRejectionStats(userId, match.match_score);

        // 6. Check for abuse
        const isAbusive = await checkForAbuse(userId);
        if (isAbusive) {
            console.warn(`User ${userId} flagged for suspicious rejection patterns`);
        }

        // 7. Find next best match
        const nextMatch = await findNextBestMatch(
            match.lost_item_id,
            match.found_item_id
        );

        return {
            success: true,
            nextMatch: nextMatch || undefined
        };
    } catch (error) {
        console.error('Error rejecting match:', error);
        return { success: false, error: 'Failed to reject match' };
    }
}

/**
 * Add a pair to the rejected_pairs blacklist
 */
export async function addToRejectedPairs(
    lostItemId: string,
    foundItemId: string,
    rejectedBy: string,
    feedback?: RejectionFeedback
): Promise<void> {
    console.log('Adding to rejected pairs:', { lostItemId, foundItemId, rejectedBy, feedback });

    const { data, error } = await supabaseAdmin
        .from('rejected_pairs')
        .insert({
            lost_item_id: lostItemId,
            found_item_id: foundItemId,
            rejected_by: rejectedBy,
            rejection_reason: feedback?.reason || null,
            feedback: feedback ? { reason: feedback.reason, details: feedback.details } : null
        })
        .select();

    if (error) {
        console.error('Error adding to rejected pairs:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        if (!error.message.includes('duplicate')) {
            throw error;
        }
    } else {
        console.log('Successfully added to rejected_pairs:', data);
    }
}

/**
 * Check if a specific pair has been rejected
 */
export async function isRejectedPair(
    lostItemId: string,
    foundItemId: string
): Promise<boolean> {
    const { data } = await supabaseAdmin
        .rpc('is_rejected_pair', {
            p_lost_item_id: lostItemId,
            p_found_item_id: foundItemId
        });

    return data === true;
}

/**
 * Get rejected pairs for an item
 */
export async function getRejectedPairsForItem(
    itemId: string,
    itemType: 'lost' | 'found'
): Promise<string[]> {
    const column = itemType === 'lost' ? 'lost_item_id' : 'found_item_id';
    const oppositeColumn = itemType === 'lost' ? 'found_item_id' : 'lost_item_id';

    const { data, error } = await supabaseAdmin
        .from('rejected_pairs')
        .select(oppositeColumn)
        .eq(column, itemId);

    if (error) {
        console.error('Error getting rejected pairs:', error);
        return [];
    }

    return data?.map(row => row[oppositeColumn]) || [];
}

/**
 * Update user rejection statistics
 */
async function updateRejectionStats(
    userId: string,
    matchScore?: number
): Promise<void> {
    console.log('Updating rejection stats:', { userId, matchScore });

    const { data, error } = await supabaseAdmin
        .rpc('update_rejection_stats', {
            p_user_id: userId,
            p_match_score: matchScore || null
        });

    if (error) {
        console.error('Error updating rejection stats:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
    } else {
        console.log('Successfully updated rejection stats');
    }
}

/**
 * Update user acceptance statistics
 */
export async function updateAcceptanceStats(userId: string): Promise<void> {
    const { error } = await supabaseAdmin
        .rpc('update_acceptance_stats', {
            p_user_id: userId
        });

    if (error) {
        console.error('Error updating acceptance stats:', error);
    }
}

/**
 * Get user rejection statistics
 */
export async function getUserRejectionStats(userId: string): Promise<RejectionStats | null> {
    const { data, error } = await supabaseAdmin
        .from('user_rejection_stats')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            // No stats yet
            return null;
        }
        console.error('Error getting rejection stats:', error);
        return null;
    }

    return data;
}

/**
 * Check if user has suspicious rejection patterns
 */
async function checkForAbuse(userId: string): Promise<boolean> {
    const stats = await getUserRejectionStats(userId);

    if (!stats) return false;

    return stats.suspicious_flag;
}

/**
 * Find the next best match for an item after rejection
 */
async function findNextBestMatch(
    lostItemId: string,
    foundItemId: string
): Promise<any | null> {
    // This will be implemented in Phase 3 with the matching service update
    // For now, return null
    return null;
}

/**
 * Get all rejected pairs (admin only)
 */
export async function getAllRejectedPairs(limit: number = 100): Promise<any[]> {
    const { data, error } = await supabaseAdmin
        .from('rejected_pairs')
        .select(`
            *,
            lost_item:lost_items(item_name, category),
            found_item:found_items(item_name, category),
            user:users(full_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error getting rejected pairs:', error);
        return [];
    }

    return data || [];
}

/**
 * Get users with suspicious rejection patterns (admin only)
 */
export async function getSuspiciousUsers(): Promise<any[]> {
    const { data, error } = await supabaseAdmin
        .from('user_rejection_stats')
        .select(`
            *,
            user:users(full_name, email, created_at)
        `)
        .eq('suspicious_flag', true)
        .order('updated_at', { ascending: false });

    if (error) {
        console.error('Error getting suspicious users:', error);
        return [];
    }

    return data || [];
}
