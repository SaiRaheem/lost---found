import { supabase } from './client';
import { LostItem, FoundItem } from '@/types/database.types';

/**
 * Create a lost item report
 */
export async function createLostItem(item: Omit<LostItem, 'id' | 'created_at'>) {
    const { data, error } = await supabase
        .from('lost_items')
        .insert(item)
        .select()
        .maybeSingle();

    if (error) throw error;
    return data;
}

/**
 * Create a found item report
 */
export async function createFoundItem(item: Omit<FoundItem, 'id' | 'created_at'>) {
    const { data, error } = await supabase
        .from('found_items')
        .insert(item)
        .select()
        .maybeSingle();

    if (error) throw error;
    return data;
}

/**
 * Get user's lost items
 */
export async function getUserLostItems(userId: string) {
    const { data, error } = await supabase
        .from('lost_items')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

/**
 * Get user's found items
 */
export async function getUserFoundItems(userId: string) {
    const { data, error } = await supabase
        .from('found_items')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

/**
 * Get all found items (for matching)
 */
export async function getAllFoundItems() {
    const { data, error } = await supabase
        .from('found_items')
        .select('*')
        .in('status', ['pending', 'active']);

    if (error) throw error;
    return data || [];
}

/**
 * Get all lost items (for matching)
 */
export async function getAllLostItems() {
    const { data, error } = await supabase
        .from('lost_items')
        .select('*')
        .in('status', ['pending', 'active']);

    if (error) throw error;
    return data || [];
}

/**
 * Update item status
 */
export async function updateItemStatus(
    itemId: string,
    itemType: 'lost' | 'found',
    status: string
) {
    const table = itemType === 'lost' ? 'lost_items' : 'found_items';

    const { data, error } = await supabase
        .from(table)
        .update({ status })
        .eq('id', itemId)
        .select()
        .maybeSingle();

    if (error) throw error;
    return data;
}

/**
 * Get a single lost item by ID
 */
export async function getLostItemById(itemId: string) {
    const { data, error } = await supabase
        .from('lost_items')
        .select('*')
        .eq('id', itemId)
        .maybeSingle();

    if (error) throw error;
    return data;
}

/**
 * Get a single found item by ID
 */
export async function getFoundItemById(itemId: string) {
    const { data, error } = await supabase
        .from('found_items')
        .select('*')
        .eq('id', itemId)
        .maybeSingle();

    if (error) throw error;
    return data;
}
