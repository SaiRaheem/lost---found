import { supabase } from './client';
import { Match, MatchBreakdown } from '@/types/database.types';

/**
 * Create a match
 */
export async function createMatch(
    lostItemId: string,
    foundItemId: string,
    score: number,
    breakdown: MatchBreakdown
) {
    const { data, error } = await supabase
        .from('matches')
        .insert({
            lost_item_id: lostItemId,
            found_item_id: foundItemId,
            score,
            breakdown,
        })
        .select()
        .maybeSingle();

    if (error) throw error;
    return data;
}

/**
 * Get matches for a lost item
 */
export async function getMatchesForLostItem(lostItemId: string) {
    const { data, error } = await supabase
        .from('matches')
        .select(`
      *,
      lost_item:lost_items(*),
      found_item:found_items(*)
    `)
        .eq('lost_item_id', lostItemId)
        .order('score', { ascending: false });

    if (error) throw error;
    return data || [];
}

/**
 * Get matches for a found item
 */
export async function getMatchesForFoundItem(foundItemId: string) {
    const { data, error } = await supabase
        .from('matches')
        .select(`
      *,
      lost_item:lost_items(*),
      found_item:found_items(*)
    `)
        .eq('found_item_id', foundItemId)
        .order('score', { ascending: false });

    if (error) throw error;
    return data || [];
}

/**
 * Update match acceptance
 */
export async function updateMatchAcceptance(
    matchId: string,
    role: 'owner' | 'finder',
    accepted: boolean
) {
    const field = role === 'owner' ? 'owner_accepted' : 'finder_accepted';

    const { data, error } = await supabase
        .from('matches')
        .update({ [field]: accepted })
        .eq('id', matchId)
        .select()
        .maybeSingle();

    if (error) throw error;
    return data;
}

/**
 * Update match status
 */
export async function updateMatchStatus(matchId: string, status: string) {
    const { data, error } = await supabase
        .from('matches')
        .update({ status })
        .eq('id', matchId)
        .select()
        .maybeSingle();

    if (error) throw error;
    return data;
}

/**
 * Get matches for an item (works for both lost and found)
 */
export async function getMatchesForItem(itemId: string, itemType: 'lost' | 'found') {
    if (itemType === 'lost') {
        return getMatchesForLostItem(itemId);
    } else {
        return getMatchesForFoundItem(itemId);
    }
}

/**
 * Accept a match
 */
export async function acceptMatch(matchId: string, role: 'owner' | 'finder') {
    return updateMatchAcceptance(matchId, role, true);
}

/**
 * Reject a match
 */
export async function rejectMatch(matchId: string, role: 'owner' | 'finder') {
    return updateMatchAcceptance(matchId, role, false);
}
