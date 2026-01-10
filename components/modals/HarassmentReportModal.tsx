'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import { submitHarassmentReport, type HarassmentReport } from '@/services/supabase/security.service';
import { getCurrentUser } from '@/services/supabase/client';

interface HarassmentReportModalProps {
    reportedUserId: string;
    reportedUserName?: string;
    matchId?: string;
    chatLogs?: any;
    onClose: () => void;
}

export default function HarassmentReportModal({
    reportedUserId,
    reportedUserName,
    matchId,
    chatLogs,
    onClose
}: HarassmentReportModalProps) {
    const [reportType, setReportType] = useState<HarassmentReport['report_type']>('harassment');
    const [description, setDescription] = useState('');
    const [severity, setSeverity] = useState<HarassmentReport['severity']>('medium');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const reportTypes = [
        { value: 'harassment', label: 'Harassment or bullying' },
        { value: 'scam', label: 'Scam or fraud attempt' },
        { value: 'inappropriate', label: 'Inappropriate content' },
        { value: 'threatening', label: 'Threats or violence' },
        { value: 'other', label: 'Other' }
    ] as const;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            const user = await getCurrentUser();
            if (!user) {
                throw new Error('You must be logged in to report');
            }

            await submitHarassmentReport(user.id, {
                reported_user_id: reportedUserId,
                match_id: matchId,
                report_type: reportType,
                description,
                severity,
                chat_logs: chatLogs
            });

            alert('✅ Report submitted successfully. Our team will review it shortly.');
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to submit report. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Report Harassment
                            </h2>
                            {reportedUserName && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    Reporting: {reportedUserName}
                                </p>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                                <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
                            </div>
                        )}

                        {/* Report Type */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Type of Report *
                            </label>
                            <select
                                value={reportType}
                                onChange={(e) => setReportType(e.target.value as HarassmentReport['report_type'])}
                                required
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                                {reportTypes.map(type => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Severity */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Severity
                            </label>
                            <select
                                value={severity}
                                onChange={(e) => setSeverity(e.target.value as HarassmentReport['severity'])}
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="critical">Critical</option>
                            </select>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Description *
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                required
                                rows={4}
                                placeholder="Please describe what happened in detail..."
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Be as specific as possible. Include dates, times, and specific incidents.
                            </p>
                        </div>

                        {/* Evidence Notice */}
                        {chatLogs && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                                <div className="flex items-start gap-2">
                                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <p className="text-sm text-blue-800 dark:text-blue-300">
                                        Chat logs will be automatically included as evidence.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Warning */}
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                                <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <p className="text-xs text-yellow-800 dark:text-yellow-300">
                                    False reports may result in action against your account.
                                </p>
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <Button
                                type="submit"
                                variant="primary"
                                className="flex-1 bg-red-600 hover:bg-red-700"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit Report'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
