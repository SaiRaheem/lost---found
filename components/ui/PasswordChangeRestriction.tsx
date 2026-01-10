'use client';

import { useState, useEffect } from 'react';
import { canChangePassword } from '@/services/supabase/security.service';
import { getCurrentUser } from '@/services/supabase/client';

export default function PasswordChangeRestriction() {
    const [restriction, setRestriction] = useState<{
        canChange: boolean;
        daysRemaining?: number;
        nextAvailableDate?: Date;
    } | null>(null);

    useEffect(() => {
        const checkRestriction = async () => {
            const user = await getCurrentUser();
            if (!user) return;

            const status = await canChangePassword(user.id);
            setRestriction(status);
        };

        checkRestriction();
    }, []);

    if (!restriction || restriction.canChange) return null;

    return (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-400 dark:border-blue-600 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <div className="flex-1">
                    <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-1">
                        Password Change Restricted
                    </h3>
                    <p className="text-sm text-blue-700 dark:text-blue-400">
                        You can change your password again in <strong>{restriction.daysRemaining} day(s)</strong>.
                    </p>
                    {restriction.nextAvailableDate && (
                        <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">
                            Available after: {restriction.nextAvailableDate.toLocaleDateString()}
                        </p>
                    )}
                    <p className="text-xs text-blue-600 dark:text-blue-500 mt-2">
                        💡 This is a security measure to prevent account takeover.
                    </p>
                </div>
            </div>
        </div>
    );
}
