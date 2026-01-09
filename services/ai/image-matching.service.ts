import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';

let model: mobilenet.MobileNet | null = null;

/**
 * Load MobileNet model (call once on app initialization)
 */
export async function loadImageModel(): Promise<void> {
    if (model) return; // Already loaded

    try {
        console.log('Loading MobileNet model...');
        model = await mobilenet.load();
        console.log('MobileNet model loaded successfully');
    } catch (error) {
        console.error('Error loading MobileNet model:', error);
        throw error;
    }
}

/**
 * Extract image embedding (feature vector) from an image
 * @param imageElement - HTML Image element or File
 * @returns 1024-dimensional feature vector
 */
export async function extractImageEmbedding(
    imageElement: HTMLImageElement | File
): Promise<number[]> {
    try {
        // Ensure model is loaded
        if (!model) {
            await loadImageModel();
        }

        let img: HTMLImageElement;

        // Convert File to Image if needed
        if (imageElement instanceof File) {
            img = await fileToImage(imageElement);
        } else {
            img = imageElement;
        }

        // Get activation from second-to-last layer (embeddings)
        const activation = model!.infer(img, true) as tf.Tensor;

        // Convert to array
        const embeddingArray = await activation.data();

        // Clean up tensor
        activation.dispose();

        return Array.from(embeddingArray);
    } catch (error) {
        console.error('Error extracting image embedding:', error);
        throw error;
    }
}

/**
 * Calculate cosine similarity between two embeddings
 * @returns Similarity score between 0 and 1 (1 = identical)
 */
export function calculateCosineSimilarity(
    embedding1: number[],
    embedding2: number[]
): number {
    if (embedding1.length !== embedding2.length) {
        throw new Error('Embeddings must have the same length');
    }

    // Calculate dot product
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
        dotProduct += embedding1[i] * embedding2[i];
        norm1 += embedding1[i] * embedding1[i];
        norm2 += embedding2[i] * embedding2[i];
    }

    // Calculate cosine similarity
    const similarity = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));

    // Clamp between 0 and 1
    return Math.max(0, Math.min(1, similarity));
}

/**
 * Calculate image similarity score (0-100)
 * @param embedding1 - First image embedding
 * @param embedding2 - Second image embedding
 * @returns Similarity score from 0 to 100
 */
export function calculateImageSimilarityScore(
    embedding1: number[],
    embedding2: number[]
): number {
    const similarity = calculateCosineSimilarity(embedding1, embedding2);
    return Math.round(similarity * 100);
}

/**
 * Helper: Convert File to HTMLImageElement
 */
function fileToImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const img = new Image();

            img.onload = () => resolve(img);
            img.onerror = reject;

            img.src = e.target?.result as string;
        };

        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Helper: Convert base64 or URL to HTMLImageElement
 */
export function urlToImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous'; // Enable CORS

        img.onload = () => resolve(img);
        img.onerror = reject;

        img.src = url;
    });
}

/**
 * Batch process multiple images
 * @param images - Array of image files or elements
 * @returns Array of embeddings
 */
export async function batchExtractEmbeddings(
    images: (HTMLImageElement | File)[]
): Promise<number[][]> {
    const embeddings: number[][] = [];

    for (const image of images) {
        try {
            const embedding = await extractImageEmbedding(image);
            embeddings.push(embedding);
        } catch (error) {
            console.error('Error processing image:', error);
            embeddings.push([]); // Empty embedding on error
        }
    }

    return embeddings;
}

/**
 * Find most similar images from a list
 * @param queryEmbedding - Embedding to compare against
 * @param candidateEmbeddings - List of embeddings with IDs
 * @param topK - Number of top results to return
 * @returns Top K most similar items with scores
 */
export function findMostSimilar(
    queryEmbedding: number[],
    candidateEmbeddings: Array<{ id: string; embedding: number[] }>,
    topK: number = 10
): Array<{ id: string; score: number }> {
    const results = candidateEmbeddings
        .map(({ id, embedding }) => ({
            id,
            score: calculateImageSimilarityScore(queryEmbedding, embedding)
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);

    return results;
}
