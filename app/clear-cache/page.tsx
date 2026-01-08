'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/services/supabase/client';

export default function ClearCachePage() {
    const router = useRouter();

    useEffect(() => {
        const clearAllCache = async () => {
            try {
                // Sign out from Supabase
                await supabase.auth.signOut();

                // Clear all local storage
                localStorage.clear();

                // Clear session storage
                sessionStorage.clear();

                // Clear Supabase specific storage
                const supabaseKeys = Object.keys(localStorage).filter(key =>
                    key.startsWith('sb-') || key.includes('supabase')
                );
                supabaseKeys.forEach(key => localStorage.removeItem(key));

                alert('All cached data cleared! Redirecting to auth page...');

                // Redirect to auth page
                setTimeout(() => {
                    router.push('/auth');
                }, 1000);
            } catch (error) {
                console.error('Error clearing cache:', error);
                alert('Cache cleared with some errors. Please refresh the page.');
            }
        };

        clearAllCache();
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-light-bg via-white to-light-bg dark:from-dark-bg dark:via-gray-900 dark:to-dark-bg">
            <div className="glass-card p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Clearing Cache...
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                    Removing all cached authentication data
                </p>
            </div>
        </div>
    );
}
