import React from 'react';
import Link from 'next/link';
import { ReportItem } from '@/types/database.types';
import { formatForDisplay } from '@/utils/date-utils';

interface ReportCardProps {
    report: ReportItem;
}

const ReportCard: React.FC<ReportCardProps> = ({ report }) => {
    const badgeClass = report.role === 'finder' ? 'badge-finder' : 'badge-owner';
    const badgeText = report.role === 'finder' ? 'Finder' : 'Owner';
    // Only show if unreadCount exists AND is greater than 0
    const hasNotifications = (report.unreadCount ?? 0) > 0;

    return (
        <Link href={`/report-detail/${report.type}/${report.id}`}>
            <div className="glass-card p-4 hover:shadow-glow transition-all duration-200 active:scale-98 cursor-pointer relative">
                {/* Unread Notification Badge */}
                {hasNotifications && (
                    <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm shadow-lg animate-pulse">
                        {report.unreadCount}
                    </div>
                )}

                <div className="flex items-start justify-between gap-4">
                    {/* Item Image */}
                    {report.image_url && (
                        <div className="flex-shrink-0">
                            <img
                                src={report.image_url}
                                alt={report.item_name}
                                className="w-20 h-20 object-cover rounded-lg border-2 border-gray-200 dark:border-gray-700"
                            />
                        </div>
                    )}

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                                {report.item_name}
                            </h3>
                            {hasNotifications && (
                                <svg className="w-5 h-5 text-red-500 flex-shrink-0 animate-bounce" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                                </svg>
                            )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className={badgeClass}>{badgeText}</span>
                            <span className={`badge-${report.status}`}>
                                {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                            </span>
                        </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {formatForDisplay(report.created_at)}
                        </p>
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default ReportCard;
