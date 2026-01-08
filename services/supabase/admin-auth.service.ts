import { supabase } from './client';

/**
 * Check if the current user is an admin
 */
export async function isAdmin(userId: string): Promise<boolean> {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('is_admin')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Error checking admin status:', error);
            return false;
        }

        return data?.is_admin === true;
    } catch (error) {
        console.error('Error in isAdmin:', error);
        return false;
    }
}

/**
 * Check if current logged-in user is admin
 */
export async function checkCurrentUserIsAdmin(): Promise<boolean> {
    try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return false;
        }

        return await isAdmin(user.id);
    } catch (error) {
        console.error('Error checking current user admin status:', error);
        return false;
    }
}
