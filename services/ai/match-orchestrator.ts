import { findMatches, calculateMatchScore } from './matching.service';
import { getAllFoundItems, getAllLostItems, updateItemStatus } from '../supabase/items.service';
import { createMatch } from '../supabase/matches.service';
import { LostItem, FoundItem } from '@/types/database.types';

/**
 * Run matching algorithm for a newly created lost item
 * Finds matching found items and creates match records
 */
export async function matchLostItem(lostItem: LostItem): Promise<number> {
    try {
        // Get all available found items
        const foundItems = await getAllFoundItems();

        // Filter by same community AND exclude items from the same user (prevent self-matching)
        const sameCommunity = foundItems.filter(f =>
            f.community === lostItem.community &&
            f.user_id !== lostItem.user_id  // Don't match with own items
        );

        // Find matches
        const matches = findMatches(lostItem, sameCommunity);

        console.log(`Found ${matches.length} potential matches for lost item ${lostItem.id}`);

        // Create match records in database
        for (const match of matches) {
            await createMatch(
                lostItem.id,
                match.foundItem.id,
                match.breakdown.total_score,
                match.breakdown
            );

            // Update the matched found item's status to 'matched'
            try {
                console.log(`Updating found item ${match.foundItem.id} status to matched...`);
                await updateItemStatus(match.foundItem.id, 'found', 'matched');
                console.log(`✅ Successfully updated found item ${match.foundItem.id} to matched`);
            } catch (error) {
                console.error(`❌ Failed to update found item ${match.foundItem.id} status:`, error);
            }
        }

        // Update the lost item status if matches found
        if (matches.length > 0) {
            try {
                console.log(`Updating lost item ${lostItem.id} status to matched...`);
                await updateItemStatus(lostItem.id, 'lost', 'matched');
                console.log(`✅ Successfully updated lost item ${lostItem.id} to matched`);
            } catch (error) {
                console.error(`❌ Failed to update lost item ${lostItem.id} status:`, error);
            }
        }

        return matches.length;
    } catch (error) {
        console.error('Error matching lost item:', error);
        throw error;
    }
}

/**
 * Run matching algorithm for a newly created found item
 * Finds matching lost items and creates match records
 */
export async function matchFoundItem(foundItem: FoundItem): Promise<number> {
    try {
        console.log('=== Matching Found Item ===');
        console.log('Found Item:', foundItem);

        // Get all available lost items
        const lostItems = await getAllLostItems();
        console.log(`Total lost items: ${lostItems.length}`);

        // Filter by same community AND exclude items from the same user (prevent self-matching)
        const sameCommunity = lostItems.filter(l =>
            l.community === foundItem.community &&
            l.user_id !== foundItem.user_id  // Don't match with own items
        );
        console.log(`Lost items in same community (${foundItem.community}): ${sameCommunity.length}`);

        // Find matches (we need to reverse the logic)
        const matches: Array<{ lostItem: LostItem; breakdown: any }> = [];

        for (const lostItem of sameCommunity) {
            const breakdown = calculateMatchScore(lostItem, foundItem);
            console.log(`\nComparing with lost item ${lostItem.id}:`);
            console.log('  Lost:', lostItem.item_name, '-', lostItem.description);
            console.log('  Found:', foundItem.item_name, '-', foundItem.description);
            console.log('  Score breakdown:', breakdown);
            console.log('  Total score:', breakdown.total_score);

            if (breakdown.total_score >= 50) { // MIN_SCORE
                console.log('  ✅ MATCH! (score >= 50)');
                matches.push({ lostItem, breakdown });
            } else {
                console.log('  ❌ No match (score < 50)');
            }
        }

        // Sort by score
        matches.sort((a, b) => b.breakdown.total_score - a.breakdown.total_score);

        console.log(`\nFound ${matches.length} potential matches for found item ${foundItem.id}`);

        // Create match records in database
        for (const match of matches) {
            await createMatch(
                match.lostItem.id,
                foundItem.id,
                match.breakdown.total_score,
                match.breakdown
            );

            // Update the matched lost item's status to 'matched'
            try {
                console.log(`Updating lost item ${match.lostItem.id} status to matched...`);
                await updateItemStatus(match.lostItem.id, 'lost', 'matched');
                console.log(`✅ Successfully updated lost item ${match.lostItem.id} to matched`);
            } catch (error) {
                console.error(`❌ Failed to update lost item ${match.lostItem.id} status:`, error);
            }
        }

        // Update the found item status if matches found
        if (matches.length > 0) {
            try {
                console.log(`Updating found item ${foundItem.id} status to matched...`);
                await updateItemStatus(foundItem.id, 'found', 'matched');
                console.log(`✅ Successfully updated found item ${foundItem.id} to matched`);
            } catch (error) {
                console.error(`❌ Failed to update found item ${foundItem.id} status:`, error);
            }
        }

        return matches.length;
    } catch (error) {
        console.error('Error matching found item:', error);
        throw error;
    }
}
