'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/services/supabase/client';

/**
 * Hook to protect routes - redirects to /auth if not authenticated
 * Returns isLoading state to prevent flash of protected content
 */
export function useAuthProtection() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const user = await getCurrentUser();
            if (!user) {
                router.replace('/auth'); // Use replace instead of push
            } else {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, [router]);

    return isLoading;
}
