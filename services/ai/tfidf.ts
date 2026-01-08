import { sanitizeText, expandWithSynonyms } from './nlp-utils';

/**
 * Calculate term frequency
 */
function calculateTF(term: string, document: string[]): number {
    const termCount = document.filter(word => word === term).length;
    return termCount / document.length;
}

/**
 * Calculate inverse document frequency
 */
function calculateIDF(term: string, documents: string[][]): number {
    const docsWithTerm = documents.filter(doc => doc.includes(term)).length;
    return Math.log((documents.length + 1) / (docsWithTerm + 1)) + 1;
}

/**
 * Tokenize text into words
 */
function tokenize(text: string): string[] {
    return sanitizeText(text).split(/\s+/).filter(word => word.length > 2);
}

/**
 * Calculate TF-IDF vector for a document
 */
function calculateTFIDF(document: string[], allDocuments: string[][], vocabulary: string[]): number[] {
    return vocabulary.map(term => {
        const tf = calculateTF(term, document);
        const idf = calculateIDF(term, allDocuments);
        return tf * idf;
    });
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) return 0;

    let dotProduct = 0;
    let mag1 = 0;
    let mag2 = 0;

    for (let i = 0; i < vec1.length; i++) {
        dotProduct += vec1[i] * vec2[i];
        mag1 += vec1[i] * vec1[i];
        mag2 += vec2[i] * vec2[i];
    }

    mag1 = Math.sqrt(mag1);
    mag2 = Math.sqrt(mag2);

    if (mag1 === 0 || mag2 === 0) return 0;

    return dotProduct / (mag1 * mag2);
}

/**
 * Calculate TF-IDF similarity between two texts
 * Returns score out of 25 (as per matching requirements)
 */
export function calculateTFIDFSimilarity(text1: string, text2: string): number {
    // Expand with synonyms for better matching
    const expandedText1 = expandWithSynonyms(text1);
    const expandedText2 = expandWithSynonyms(text2);

    // Tokenize
    const doc1 = tokenize(expandedText1);
    const doc2 = tokenize(expandedText2);

    // Create vocabulary (unique terms from both documents)
    const vocabulary = [...new Set([...doc1, ...doc2])];

    // Calculate TF-IDF vectors
    const allDocs = [doc1, doc2];
    const vec1 = calculateTFIDF(doc1, allDocs, vocabulary);
    const vec2 = calculateTFIDF(doc2, allDocs, vocabulary);

    // Calculate cosine similarity
    const similarity = cosineSimilarity(vec1, vec2);

    // Convert to score out of 25
    return Math.round(similarity * 25);
}

/**
 * Calculate TF-IDF similarity for multiple document pairs
 */
export function calculateBatchTFIDF(pairs: Array<{ text1: string; text2: string }>): number[] {
    return pairs.map(pair => calculateTFIDFSimilarity(pair.text1, pair.text2));
}
