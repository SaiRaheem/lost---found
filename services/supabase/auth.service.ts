import { supabase } from './client';

export interface ProfileData {
    id?: string;
    name: string;
    phone: string;
    gender: 'male' | 'female' | 'other';
    community_type?: 'college' | 'common';
    college?: string;
    branch?: string;
    year?: string;
    roll_no?: string;
}

/**
 * Retry helper with exponential backoff
 */
async function retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error: any) {
            lastError = error;

            // Don't retry on authentication errors (wrong password, etc)
            if (error?.message?.includes('Invalid login credentials') ||
                error?.message?.includes('Email not confirmed') ||
                error?.message?.includes('User already registered')) {
                throw error;
            }

            // Retry on network/service errors
            if (attempt < maxRetries &&
                (error?.name === 'AuthRetryableFetchError' ||
                    error?.message?.includes('503') ||
                    error?.message?.includes('Failed to fetch') ||
                    error?.message?.includes('Network'))) {
                const delay = baseDelay * Math.pow(2, attempt);
                console.log(`[Auth] Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }

            throw error;
        }
    }

    throw lastError;
}

/**
 * Sign up with email and password
 * Creates profile immediately if email confirmation is disabled
 * Otherwise profile is created after email verification in callback
 */
export async function signUpWithEmail(email: string, password: string, profileData: Omit<ProfileData, 'id'>) {
    // Create auth user with email confirmation required - with retry logic
    const authData = await retryOperation(async () => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`,
                data: {
                    // Store profile data in user metadata for later use
                    name: profileData.name,
                    gender: profileData.gender,
                    phone: profileData.phone,
                }
            },
        });

        if (error) throw error;
        if (!data.user) throw new Error('Failed to create user');
        return data;
    });

    // If user is immediately confirmed (email confirmation disabled in Supabase)
    // Create the profile now
    if (authData.session && authData.user) {
        console.log('User confirmed immediately, creating profile...');
        await retryOperation(async () => {
            const { error } = await supabase
                .from('users')
                .insert({
                    id: authData.user!.id,
                    email: authData.user!.email,
                    name: profileData.name,
                    gender: profileData.gender,
                    phone: profileData.phone,
                    community_type: profileData.community_type || 'common',
                    updated_at: new Date().toISOString(),
                });

            if (error) {
                console.error('Profile creation error:', error);
                throw new Error(`Failed to create profile: ${error.message}`);
            }
            console.log('Profile created successfully');
        });
    }
    // Otherwise, profile will be created in callback after email verification

    return authData;
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email: string, password: string) {
    return await retryOperation(async () => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;
        return data;
    });
}

/**
 * Sign out
 */
export async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}

/**
 * Get user profile
 */
export async function getUserProfile(userId: string) {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle(); // Use maybeSingle() instead of single() to avoid 406 errors

    if (error) {
        console.error('Error fetching user profile:', error);
        throw error;
    }

    return data; // Will be null if no profile exists
}

/**
 * Update user profile
 */
export async function upsertUserProfile(profileData: ProfileData) {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('No authenticated user');

    const { data, error } = await supabase
        .from('users')
        .upsert({
            id: user.id,
            email: user.email,
            ...profileData,
            updated_at: new Date().toISOString(),
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw error;
}

/**
 * Update password (for reset password flow)
 */
export async function updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
        password: newPassword,
    });

    if (error) throw error;
}

/**
 * Change password for logged-in user (verifies current password first)
 * Enforces 3-day minimum between password changes
 */
export async function changePassword(currentPassword: string, newPassword: string) {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) throw new Error('No user logged in');

    // Check if user can change password (3-day restriction)
    const { canChangePassword } = await import('./security.service');
    const { canChange, daysRemaining } = await canChangePassword(user.id);

    if (!canChange) {
        throw new Error(
            `You can change your password again in ${daysRemaining} day(s). This is a security measure to prevent account takeover.`
        );
    }

    // Verify current password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
    });

    if (signInError) {
        throw new Error('Current password is incorrect');
    }

    // Update to new password
    const { error } = await supabase.auth.updateUser({
        password: newPassword,
    });

    if (error) throw error;

    // Update last password change timestamp
    const { updateLastPasswordChange } = await import('./security.service');
    await updateLastPasswordChange(user.id);
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): {
    isValid: boolean;
    strength: 'weak' | 'medium' | 'strong';
    errors: string[];
} {
    const errors: string[] = [];

    if (password.length < 8) {
        errors.push('At least 8 characters');
    }
    if (!/[A-Z]/.test(password)) {
        errors.push('One uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
        errors.push('One lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
        errors.push('One number');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push('One special character');
    }

    let strength: 'weak' | 'medium' | 'strong' = 'weak';
    if (password.length >= 12 && errors.length === 0) {
        strength = 'strong';
    } else if (password.length >= 8 && errors.length <= 2) {
        strength = 'medium';
    }

    return {
        isValid: errors.length === 0,
        strength,
        errors,
    };
}
