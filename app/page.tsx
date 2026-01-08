'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/services/supabase/client';

export default function Home() {
    const router = useRouter();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const user = await getCurrentUser();

                if (user) {
                    // User is logged in, redirect to home
                    router.push('/home');
                } else {
                    // User is not logged in, redirect to auth
                    router.push('/auth');
                }
            } catch (error) {
                // Error checking auth, redirect to auth page
                router.push('/auth');
            }
        };

        checkAuth();
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-light-bg via-white to-light-bg dark:from-dark-bg dark:via-gray-900 dark:to-dark-bg">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
    );
}
