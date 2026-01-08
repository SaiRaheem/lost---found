'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/services/supabase/client';
import { getUserProfile } from '@/services/supabase/auth.service';

export default function AuthCallbackPage() {
    const router = useRouter();

    useEffect(() => {
        const handleAuthCallback = async () => {
            try {
                // Get the session from the URL
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) {
                    console.error('Auth callback error:', error);
                    router.push('/auth?error=authentication_failed');
                    return;
                }

                if (session) {
                    console.log('Session found:', session.user.id);

                    // Check if user profile exists
                    const profile = await getUserProfile(session.user.id);
                    console.log('Profile check:', profile);

                    // If no profile, create one from user metadata
                    if (!profile) {
                        console.log('Creating profile from metadata...');
                        const metadata = session.user.user_metadata;

                        const profileData = {
                            id: session.user.id,
                            email: session.user.email,
                            name: metadata.name || 'User',
                            gender: metadata.gender || 'other',
                            phone: metadata.phone || '',
                            community_type: 'common',
                            updated_at: new Date().toISOString(),
                        };

                        console.log('Profile data to insert:', profileData);

                        const { data, error: insertError } = await supabase
                            .from('users')
                            .insert(profileData)
                            .select()
                            .single();

                        if (insertError) {
                            console.error('Profile creation error:', insertError);
                            alert(`Failed to create profile: ${insertError.message}`);
                            router.push('/auth');
                            return;
                        }

                        console.log('Profile created successfully:', data);
                    }

                    // User is authenticated, redirect to home
                    router.push('/home');
                } else {
                    router.push('/auth');
                }
            } catch (error) {
                console.error('Unexpected error in auth callback:', error);
                alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
                router.push('/auth?error=unexpected_error');
            }
        };

        handleAuthCallback();
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-light-bg via-white to-light-bg dark:from-dark-bg dark:via-gray-900 dark:to-dark-bg">
            <div className="glass-card p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Verifying your email...</p>
            </div>
        </div>
    );
}
