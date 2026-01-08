import { supabase } from './client';

const BUCKET_NAME = 'item-images';

/**
 * Upload an item image to Supabase Storage
 */
export async function uploadItemImage(file: File, userId: string, itemId: string): Promise<string> {
    try {
        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/${itemId}.${fileExt}`;

        // Upload file to storage
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: true, // Replace if exists
            });

        if (error) throw error;

        // Get public URL
        const { data: urlData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(fileName);

        return urlData.publicUrl;
    } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
    }
}

/**
 * Delete an item image from storage
 */
export async function deleteItemImage(imageUrl: string): Promise<void> {
    try {
        // Extract file path from URL
        const urlParts = imageUrl.split(`/${BUCKET_NAME}/`);
        if (urlParts.length < 2) return;

        const filePath = urlParts[1];

        const { error } = await supabase.storage
            .from(BUCKET_NAME)
            .remove([filePath]);

        if (error) throw error;
    } catch (error) {
        console.error('Error deleting image:', error);
        // Don't throw - image deletion is not critical
    }
}

/**
 * Get public URL for an image path
 */
export function getImageUrl(path: string): string {
    const { data } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(path);

    return data.publicUrl;
}
