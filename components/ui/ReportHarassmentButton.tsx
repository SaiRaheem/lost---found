'use client';

import { useState } from 'react';
import HarassmentReportModal from '@/components/modals/HarassmentReportModal';

interface ReportHarassmentButtonProps {
    reportedUserId: string;
    reportedUserName?: string;
    matchId?: string;
    chatLogs?: any;
    variant?: 'icon' | 'button';
}

export default function ReportHarassmentButton({
    reportedUserId,
    reportedUserName,
    matchId,
    chatLogs,
    variant = 'icon'
}: ReportHarassmentButtonProps) {
    const [showModal, setShowModal] = useState(false);

    if (variant === 'icon') {
        return (
            <>
                <button
                    onClick={() => setShowModal(true)}
                    className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Report harassment"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </button>

                {showModal && (
                    <HarassmentReportModal
                        reportedUserId={reportedUserId}
                        reportedUserName={reportedUserName}
                        matchId={matchId}
                        chatLogs={chatLogs}
                        onClose={() => setShowModal(false)}
                    />
                )}
            </>
        );
    }

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg transition-colors"
            >
                🚨 Report Harassment
            </button>

            {showModal && (
                <HarassmentReportModal
                    reportedUserId={reportedUserId}
                    reportedUserName={reportedUserName}
                    matchId={matchId}
                    chatLogs={chatLogs}
                    onClose={() => setShowModal(false)}
                />
            )}
        </>
    );
}
