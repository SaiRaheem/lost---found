'use client';

import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import ReportCard from '@/components/reports/ReportCard';
import FilterOverlay, { FilterState } from '@/components/reports/FilterOverlay';
import Button from '@/components/ui/Button';
import { ReportItem } from '@/types/database.types';
import { getCurrentUser } from '@/services/supabase/client';
import { getUserLostItems, getUserFoundItems } from '@/services/supabase/items.service';
import { getUnreadCountForItem, subscribeToNotifications } from '@/services/supabase/notifications.service';
import { supabase } from '@/services/supabase/client';
import { useAuthProtection } from '@/hooks/useAuthProtection';

export default function MyReportsPage() {
    useAuthProtection(); // Protect this route
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filters, setFilters] = useState<FilterState>({ category: '', status: '', role: '' });
    const [reports, setReports] = useState<ReportItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch reports from Supabase
    useEffect(() => {
        const fetchReports = async () => {
            try {
                const user = await getCurrentUser();
                if (!user) {
                    setReports([]);
                    setIsLoading(false);
                    return;
                }

                // Fetch both lost and found items
                const [lostItems, foundItems] = await Promise.all([
                    getUserLostItems(user.id),
                    getUserFoundItems(user.id),
                ]);

                // Fetch match counts for each item
                const getNotificationCount = async (itemId: string, type: 'lost' | 'found') => {
                    return await getUnreadCountForItem(itemId, type);
                };

                // Convert to ReportItem format with unread notification counts
                const lostReports = lostItems.map((item) => ({
                    ...item,
                    role: 'owner' as const,
                    type: 'lost' as const,
                    unreadCount: 0,
                }));

                const foundReports = foundItems.map((item) => ({
                    ...item,
                    role: 'finder' as const,
                    type: 'found' as const,
                    unreadCount: 0,
                }));

                // Combine and sort by date (newest first)
                const allReports = [...lostReports, ...foundReports].sort(
                    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );

                setReports(allReports);
            } catch (error) {
                console.error('Error fetching reports:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchReports();

        // Subscribe to real-time updates for matches and item status
        const matchesChannel = supabase
            .channel('matches-updates')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => {
                console.log('Match updated, refreshing...');
                fetchReports();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'lost_items' }, () => {
                console.log('Lost item updated, refreshing...');
                fetchReports();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'found_items' }, () => {
                console.log('Found item updated, refreshing...');
                fetchReports();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'user_notifications' }, () => {
                console.log('Notification updated, refreshing...');
                fetchReports();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(matchesChannel);
        };
    }, []);

    // Apply filters
    const filteredReports = reports.filter(report => {
        if (filters.category && report.item_category !== filters.category) return false;
        if (filters.status && report.status !== filters.status) return false;
        if (filters.role && report.role !== filters.role) return false;
        return true;
    });

    const handleApplyFilters = (newFilters: FilterState) => {
        setFilters(newFilters);
    };

    return (
        <Layout showHeader showNotifications>
            <div className="max-w-4xl mx-auto py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gradient mb-2">My Reports</h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            {filteredReports.length} {filteredReports.length === 1 ? 'item' : 'items'}
                        </p>
                    </div>
                    <Button
                        variant="secondary"
                        onClick={() => setIsFilterOpen(true)}
                        className="flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                        Filters
                    </Button>
                </div>

                {/* Active Filters */}
                {(filters.category || filters.status || filters.role) && (
                    <div className="mb-6 flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Active filters:</span>
                        {filters.category && (
                            <span className="badge bg-primary/20 text-primary">
                                Category: {filters.category}
                            </span>
                        )}
                        {filters.status && (
                            <span className="badge bg-primary/20 text-primary">
                                Status: {filters.status}
                            </span>
                        )}
                        {filters.role && (
                            <span className="badge bg-primary/20 text-primary">
                                Role: {filters.role}
                            </span>
                        )}
                        <button
                            onClick={() => handleApplyFilters({ category: '', status: '', role: '' })}
                            className="text-sm text-red-500 hover:text-red-600 font-medium"
                        >
                            Clear all
                        </button>
                    </div>
                )}

                {/* Reports List */}
                {isLoading ? (
                    <div className="glass-card p-12 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-gray-600 dark:text-gray-400">Loading your reports...</p>
                    </div>
                ) : filteredReports.length > 0 ? (
                    <div className="space-y-4 animate-slide-up">
                        {filteredReports.map(report => (
                            <ReportCard key={report.id} report={report} />
                        ))}
                    </div>
                ) : (
                    <div className="glass-card p-12 text-center">
                        <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            No reports found
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            {filters.category || filters.status || filters.role
                                ? 'Try adjusting your filters'
                                : 'You haven\'t reported any items yet'}
                        </p>
                        <Button onClick={() => window.location.href = '/home'}>
                            Report an Item
                        </Button>
                    </div>
                )}
            </div>

            {/* Filter Overlay */}
            <FilterOverlay
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                onApply={handleApplyFilters}
            />
        </Layout>
    );
}
