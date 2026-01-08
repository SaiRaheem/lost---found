import { LostItem, FoundItem, MatchBreakdown } from '@/types/database.types';
import { MATCHING } from '@/utils/constants';
import { calculateDateProximity } from '@/utils/date-utils';
import { calculateTFIDFSimilarity } from './tfidf';
import { fuzzyMatch } from './fuzzy';
import { extractBrands, extractColors, extractModels } from './nlp-utils';

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
 * Calculate attribute match score (0-10 points)
 */
function calculateAttributeScore(lostItem: LostItem, foundItem: FoundItem): number {
    let score = 0;

    const lostText = `${lostItem.item_name} ${lostItem.description}`;
    const foundText = `${foundItem.item_name} ${foundItem.description}`;

    // Extract attributes
    const lostBrands = extractBrands(lostText);
    const foundBrands = extractBrands(foundText);
    const lostColors = extractColors(lostText);
    const foundColors = extractColors(foundText);
    const lostModels = extractModels(lostText);
    const foundModels = extractModels(foundText);

    // Brand match (5 points)
    const brandMatch = lostBrands.some(b => foundBrands.includes(b));
    if (brandMatch) score += 5;

    // Color match (5 points)
    const colorMatch = lostColors.some(c => foundColors.includes(c));
    if (colorMatch) score += 5;

    // Model match (5 points)
    const modelMatch = lostModels.some(m => foundModels.includes(m));
    if (modelMatch) score += 5;

    return Math.min(score, MATCHING.WEIGHTS.ATTRIBUTES);
}

/**
 * Calculate overall match score
 */
export function calculateMatchScore(lostItem: LostItem, foundItem: FoundItem): MatchBreakdown {
    const category_score = calculateCategoryScore(lostItem, foundItem);
    const location_score = calculateLocationScore(lostItem, foundItem);

    const tfidf_score = calculateTFIDFSimilarity(
        lostItem.description,
        foundItem.description
    );

    const fuzzy_score = fuzzyMatch(lostItem.item_name, foundItem.item_name);

    const attribute_score = calculateAttributeScore(lostItem, foundItem);

    const date_score = calculateDateProximity(
        lostItem.datetime_lost,
        foundItem.datetime_found
    );

    const total_score = category_score + location_score + tfidf_score +
        fuzzy_score + attribute_score + date_score;

    return {
        category_score,
        location_score,
        tfidf_score,
        fuzzy_score,
        attribute_score,
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
    const matches = foundItems
        .map(foundItem => ({
            foundItem,
            breakdown: calculateMatchScore(lostItem, foundItem),
        }))
        .filter(match => isValidMatch(match.breakdown))
        .sort((a, b) => b.breakdown.total_score - a.breakdown.total_score);

    return matches;
}
