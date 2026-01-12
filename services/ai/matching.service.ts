import { LostItem, FoundItem, MatchBreakdown } from '@/types/database.types';
import { MATCHING } from '@/utils/constants';
import { calculateDateProximity } from '@/utils/date-utils';
import { calculateTFIDFSimilarity } from './tfidf';
import { fuzzyMatch } from './fuzzy';
import { extractBrands, extractColors, extractModels } from './nlp-utils';
import { calculateCosineSimilarity } from './image-matching.service';

/**
 * Calculate category match score (0-25 points)
 */
function calculateCategoryScore(lostItem: LostItem, foundItem: FoundItem): number {
    return lostItem.item_category === foundItem.item_category ? MATCHING.WEIGHTS.CATEGORY : 0;
}

/**
 * Calculate location match score (0-20 points)
 * Prioritizes manual text location over GPS coordinates
 */
function calculateLocationScore(lostItem: LostItem, foundItem: FoundItem): number {
    const lostLocation = lostItem.location.toLowerCase();
    const foundLocation = foundItem.location.toLowerCase();

    // Exact text match - highest priority (20 points)
    if (lostLocation === foundLocation) {
        return MATCHING.WEIGHTS.LOCATION;
    }

    // Partial text match (contains) - high priority (14 points)
    if (lostLocation.includes(foundLocation) || foundLocation.includes(lostLocation)) {
        return Math.round(MATCHING.WEIGHTS.LOCATION * 0.7);
    }

    // Check if areas match - medium priority (10 points)
    if (lostItem.area && foundItem.area) {
        const lostArea = lostItem.area.toLowerCase();
        const foundArea = foundItem.area.toLowerCase();
        if (lostArea === foundArea) {
            return Math.round(MATCHING.WEIGHTS.LOCATION * 0.5);
        }
    }

    // GPS proximity - LOW priority (only when text locations don't match)
    // GPS is less reliable since people report from wherever they are, not the actual location
    if (lostItem.gps_latitude && lostItem.gps_longitude &&
        foundItem.gps_latitude && foundItem.gps_longitude) {
        const distance = calculateGPSDistance(
            lostItem.gps_latitude, lostItem.gps_longitude,
            foundItem.gps_latitude, foundItem.gps_longitude
        );

        // Reduced GPS scoring (max 6 points - much less than text location):
        // 0-50m: 6 points (very close)
        // 50-100m: 4 points (nearby)
        // 100-200m: 3 points (close)
        // 200-500m: 2 points (same area)
        // >500m: 0 points (too far)

        if (distance <= 0.05) return 6;  // Within 50 meters
        if (distance <= 0.1) return 4;   // Within 100 meters
        if (distance <= 0.2) return 3;   // Within 200 meters
        if (distance <= 0.5) return 2;   // Within 500 meters
    }

    return 0;
}

/**
 * Calculate GPS distance in km using Haversine formula
 */
function calculateGPSDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
}

/**
 * Calculate attribute match score (0-5 points)
 * Extracts and compares colors, brands, and models
 */
function calculateAttributeScore(lostItem: LostItem, foundItem: FoundItem): number {
    let score = 0;

    // Extract attributes from descriptions
    const lostColors = extractColors(lostItem.description);
    const foundColors = extractColors(foundItem.description);
    const lostBrands = extractBrands(lostItem.description);
    const foundBrands = extractBrands(foundItem.description);
    const lostModels = extractModels(lostItem.description);
    const foundModels = extractModels(foundItem.description);

    // Color match (2 points)
    if (lostColors.length > 0 && foundColors.length > 0) {
        const colorMatch = lostColors.some(c => foundColors.includes(c));
        if (colorMatch) score += 2;
    }

    // Brand match (2 points)
    if (lostBrands.length > 0 && foundBrands.length > 0) {
        const brandMatch = lostBrands.some(b => foundBrands.includes(b));
        if (brandMatch) score += 2;
    }

    // Model match (1 point)
    if (lostModels.length > 0 && foundModels.length > 0) {
        const modelMatch = lostModels.some(m => foundModels.includes(m));
        if (modelMatch) score += 1;
    }

    return Math.min(score, MATCHING.WEIGHTS.ATTRIBUTES);
}

/**
 * Calculate purpose match score (0-10 points)
 * Compares what the item is used for using TF-IDF similarity
 */
function calculatePurposeScore(lostItem: LostItem, foundItem: FoundItem): number {
    // If both have purpose filled, compare them
    if (lostItem.purpose && foundItem.purpose) {
        const similarity = calculateTFIDFSimilarity(lostItem.purpose, foundItem.purpose);
        return Math.round(similarity * MATCHING.WEIGHTS.PURPOSE);
    }

    // If only one has purpose, give partial credit (30% of max score)
    if (lostItem.purpose || foundItem.purpose) {
        return Math.round(MATCHING.WEIGHTS.PURPOSE * 0.3);
    }

    // If neither has purpose, give 50% credit (neutral)
    return Math.round(MATCHING.WEIGHTS.PURPOSE * 0.5);
}

/**
 * Calculate image similarity score (0-15 points)
 * Uses cosine similarity of image embeddings from MobileNet
 */
function calculateImageScore(lostItem: LostItem, foundItem: FoundItem): number {
    // If either item doesn't have an image embedding, return 0
    if (!lostItem.image_embedding || !foundItem.image_embedding) {
        return 0;
    }

    // Both must have valid embeddings
    if (lostItem.image_embedding.length === 0 || foundItem.image_embedding.length === 0) {
        return 0;
    }

    try {
        // Calculate cosine similarity (0-1)
        const similarity = calculateCosineSimilarity(
            lostItem.image_embedding,
            foundItem.image_embedding
        );

        // Convert to score (0-15 points)
        return Math.round(similarity * MATCHING.WEIGHTS.IMAGE);
    } catch (error) {
        console.error('Error calculating image similarity:', error);
        return 0;
    }
}

/**
 * Calculate overall match score
 */
export function calculateMatchScore(lostItem: LostItem, foundItem: FoundItem): MatchBreakdown {
    const category_score = calculateCategoryScore(lostItem, foundItem);
    const location_score = calculateLocationScore(lostItem, foundItem);

    // TF-IDF already returns 0-25 (weighted)
    const tfidf_score = calculateTFIDFSimilarity(
        lostItem.description,
        foundItem.description
    );

    // Fuzzy already returns 0-10 (weighted)  
    const fuzzy_score = fuzzyMatch(lostItem.item_name, foundItem.item_name);

    const attribute_score = calculateAttributeScore(lostItem, foundItem);

    const purpose_score = calculatePurposeScore(lostItem, foundItem);

    const image_score = calculateImageScore(lostItem, foundItem);

    const dateProximity = calculateDateProximity(
        lostItem.datetime_lost,
        foundItem.datetime_found
    );
    const date_score = Math.round((dateProximity / 10) * MATCHING.WEIGHTS.DATE);

    // Calculate total (scores are already weighted, no need to multiply again)
    const total_score = Math.min(100, Math.round(
        category_score +
        location_score +
        tfidf_score +
        fuzzy_score +
        attribute_score +
        purpose_score +
        image_score +
        date_score
    ));

    return {
        category_score,
        location_score,
        tfidf_score,
        fuzzy_score,
        attribute_score,
        purpose_score,
        image_score,
        date_score,
        total_score,
    };
}

/**
 * Check if match score meets minimum threshold
 * Also requires minimum name similarity to reduce false positives
 */
export function isValidMatch(breakdown: MatchBreakdown): boolean {
    // Must meet minimum total score
    if (breakdown.total_score < MATCHING.MIN_SCORE) {
        return false;
    }

    // Must have some name similarity (prevents completely different items from matching)
    if (breakdown.fuzzy_score < MATCHING.MIN_NAME_SIMILARITY) {
        return false;
    }

    return true;
}

/**
 * Find all potential matches for a lost item
 */
export function findMatches(
    lostItem: LostItem,
    foundItems: FoundItem[]
): Array<{ foundItem: FoundItem; breakdown: MatchBreakdown }> {
    const matches: Array<{ foundItem: FoundItem; breakdown: MatchBreakdown }> = [];

    for (const foundItem of foundItems) {
        // OPTIMIZATION: Pre-filter by location (1km radius)
        // Skip items outside 1km range to reduce unnecessary calculations
        if (lostItem.gps_latitude && lostItem.gps_longitude && foundItem.gps_latitude && foundItem.gps_longitude) {
            const distance = calculateGPSDistance(
                lostItem.gps_latitude,
                lostItem.gps_longitude,
                foundItem.gps_latitude,
                foundItem.gps_longitude
            );

            // Skip if beyond 1km - don't even check other properties
            if (distance > 1.0) {
                console.log(`⏭️ Skipping item (${distance.toFixed(2)}km away, beyond 1km radius)`);
                continue;
            }

            console.log(`✅ Item within range (${distance.toFixed(2)}km), checking match score...`);
        }

        // Calculate full match score only for items within 1km
        const breakdown = calculateMatchScore(lostItem, foundItem);

        if (isValidMatch(breakdown)) {
            matches.push({ foundItem, breakdown });
        }
    }

    // Sort by total score (highest first)
    return matches.sort((a, b) => b.breakdown.total_score - a.breakdown.total_score);
}
