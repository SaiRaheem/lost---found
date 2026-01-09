/**
 * Calculate Levenshtein distance between two strings
 */
export function levenshteinDistance(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix: number[][] = [];

    // Initialize matrix
    for (let i = 0; i <= len1; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
        matrix[0][j] = j;
    }

    // Fill matrix
    for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
            const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,      // deletion
                matrix[i][j - 1] + 1,      // insertion
                matrix[i - 1][j - 1] + cost // substitution
            );
        }
    }

    return matrix[len1][len2];
}

/**
 * Calculate similarity score (0-1) based on Levenshtein distance
 */
export function calculateSimilarity(str1: string, str2: string): number {
    const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
    const maxLength = Math.max(str1.length, str2.length);

    if (maxLength === 0) return 1;

    return 1 - (distance / maxLength);
}

/**
 * Fuzzy match with typo tolerance
 * Returns score 0-15 points (matching FUZZY weight)
 */
export function fuzzyMatch(str1: string, str2: string): number {
    const similarity = calculateSimilarity(str1, str2);
    return Math.min(15, Math.round(similarity * 15));
}

/**
 * Check if strings are similar enough (threshold-based)
 */
export function isSimilar(str1: string, str2: string, threshold: number = 0.7): boolean {
    return calculateSimilarity(str1, str2) >= threshold;
}

/**
 * Find best match from array of strings
 */
export function findBestMatch(target: string, candidates: string[]): { match: string; score: number } | null {
    if (candidates.length === 0) return null;

    let bestMatch = candidates[0];
    let bestScore = calculateSimilarity(target, candidates[0]);

    for (let i = 1; i < candidates.length; i++) {
        const score = calculateSimilarity(target, candidates[i]);
        if (score > bestScore) {
            bestScore = score;
            bestMatch = candidates[i];
        }
    }

    return { match: bestMatch, score: bestScore };
}
