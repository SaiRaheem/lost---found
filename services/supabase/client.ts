import { createClient } from '@supabase/supabase-js';

// Client-side Supabase client (with RLS)
export const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Listen for auth errors and handle invalid refresh tokens
if (typeof window !== 'undefined') {
    supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'TOKEN_REFRESHED') {
            console.log('[Auth] Token refreshed successfully');
        }

        // Handle refresh token errors
        if (event === 'SIGNED_OUT' && !session) {
            console.log('[Auth] Session expired or invalid');
        }
    });
}

/**
 * Clear all auth state - useful when refresh token is invalid
 */
export async function clearAuthState() {
    try {
        // Sign out from Supabase
        await supabase.auth.signOut();

        // Clear localStorage
        if (typeof window !== 'undefined') {
            const keysToRemove = Object.keys(localStorage).filter(
                key => key.includes('supabase') || key.includes('sb-') || key.includes('auth')
            );
            keysToRemove.forEach(key => localStorage.removeItem(key));
            console.log('[Auth] Cleared auth state from localStorage');
        }
    } catch (error) {
        console.error('[Auth] Error clearing auth state:', error);
    }
}

export async function getCurrentUser() {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();

        // Handle invalid refresh token
        if (error && error.message.includes('refresh_token_not_found')) {
            console.error('[Auth] Invalid refresh token detected, clearing auth state...');
            await clearAuthState();

            // Redirect to auth page if not already there
            if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth')) {
                window.location.href = '/auth?error=session_expired';
            }
            return null;
        }

        if (error) {
            console.error('[Auth] Error getting user:', error);
            return null;
        }

        return user;
    } catch (error) {
        console.error('[Auth] Unexpected error:', error);
        return null;
    }
}
