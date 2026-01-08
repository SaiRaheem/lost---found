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
 * Sign up with email and password
 * Creates profile immediately if email confirmation is disabled
 * Otherwise profile is created after email verification in callback
 */
export async function signUpWithEmail(email: string, password: string, profileData: Omit<ProfileData, 'id'>) {
    // Create auth user with email confirmation required
    const { data: authData, error: authError } = await supabase.auth.signUp({
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

    if (authError) throw authError;
    if (!authData.user) throw new Error('Failed to create user');

    // If user is immediately confirmed (email confirmation disabled in Supabase)
    // Create the profile now
    if (authData.session) {
        console.log('User confirmed immediately, creating profile...');
        const { error: profileError } = await supabase
            .from('users')
            .insert({
                id: authData.user.id,
                email: authData.user.email,
                name: profileData.name,
                gender: profileData.gender,
                phone: profileData.phone,
                community_type: profileData.community_type || 'common',
                updated_at: new Date().toISOString(),
            });

        if (profileError) {
            console.error('Profile creation error:', profileError);
            throw new Error(`Failed to create profile: ${profileError.message}`);
        }
        console.log('Profile created successfully');
    }
    // Otherwise, profile will be created in callback after email verification

    return authData;
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) throw error;
    return data;
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
 * Reset password (send reset email)
 */
export async function sendPasswordResetEmail(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) throw error;
}

/**
 * Update password
 */
export async function updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
        password: newPassword,
    });

    if (error) throw error;
}
