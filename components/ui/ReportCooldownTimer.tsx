'use client';

import { useState, useEffect } from 'react';
import { canUserReport } from '@/services/supabase/security.service';
import { getCurrentUser } from '@/services/supabase/client';

export default function ReportCooldownTimer() {
    const [cooldown, setCooldown] = useState<number | null>(null);
    const [nextAvailableTime, setNextAvailableTime] = useState<Date | null>(null);

    useEffect(() => {
        const checkCooldown = async () => {
            const user = await getCurrentUser();
            if (!user) return;

            const status = await canUserReport(user.id);
            if (!status.canReport && status.remainingSeconds) {
                setCooldown(status.remainingSeconds);
                setNextAvailableTime(status.nextAvailableTime || null);
            } else {
                setCooldown(null);
                setNextAvailableTime(null);
            }
        };

        checkCooldown();
        const interval = setInterval(checkCooldown, 1000);
        return () => clearInterval(interval);
    }, []);

    if (!cooldown) return null;

    const minutes = Math.floor(cooldown / 60);
    const seconds = cooldown % 60;

    return (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-400 dark:border-yellow-600 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                    <h3 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-1">
                        Report Cooldown Active
                    </h3>
                    <p className="text-sm text-yellow-700 dark:text-yellow-400">
                        Please wait <strong>{minutes}:{seconds.toString().padStart(2, '0')}</strong> before submitting another report.
                    </p>
                    {nextAvailableTime && (
                        <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-1">
                            Next available: {nextAvailableTime.toLocaleTimeString()}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
