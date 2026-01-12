'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/Card';
import { AlertCircle, Search, Zap, CheckCircle, Users } from 'lucide-react';
import type { LostItem, FoundItem } from '@/types/database.types';
import { formatForDisplay } from '@/utils/date-utils';
import {
    getAdminStats,
    getAllLostItems,
    getAllFoundItems,
    getAllMatches,
    getRecentActivity,
    getUsersWithRewards
} from '@/services/supabase/admin.service';
import { checkCurrentUserIsAdmin } from '@/services/supabase/admin-auth.service';
import { supabase } from '@/services/supabase/client';

export default function AdminPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [stats, setStats] = useState({
        totalLostItems: 0,
        totalFoundItems: 0,
        totalMatches: 0,
        successfulReturns: 0,
        activeUsers: 0,
    });

    const [lostItems, setLostItems] = useState<LostItem[]>([]);
    const [foundItems, setFoundItems] = useState<FoundItem[]>([]);
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [usersWithRewards, setUsersWithRewards] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'overview' | 'lost' | 'found' | 'matches' | 'users'>('overview');

    useEffect(() => {
        const checkAdminAndFetchData = async () => {
            try {
                setIsLoading(true);

                // Check if user is admin
                const isAdminUser = await checkCurrentUserIsAdmin();

                if (!isAdminUser) {
                    alert('Access denied. Admin privileges required.');
                    router.push('/home');
                    return;
                }

                setIsAuthorized(true);

                // Fetch all data in parallel
                const [statsData, lostData, foundData, activityData, usersData] = await Promise.all([
                    getAdminStats(),
                    getAllLostItems(),
                    getAllFoundItems(),
                    getRecentActivity(),
                    getUsersWithRewards(),
                ]);

                setStats(statsData);
                setLostItems(lostData);
                setFoundItems(foundData);
                setRecentActivity(activityData);
                setUsersWithRewards(usersData);
            } catch (error) {
                console.error('Error fetching admin data:', error);
                alert('Failed to load admin data');
            } finally {
                setIsLoading(false);
            }
        };

        checkAdminAndFetchData();
    }, [router]);

    // Real-time subscriptions for instant updates
    useEffect(() => {
        if (!isAuthorized) return;

        const fetchData = async () => {
            try {
                const [statsData, lostData, foundData, activityData, usersData] = await Promise.all([
                    getAdminStats(),
                    getAllLostItems(),
                    getAllFoundItems(),
                    getRecentActivity(),
                    getUsersWithRewards(),
                ]);

                setStats(statsData);
                setLostItems(lostData);
                setFoundItems(foundData);
                setRecentActivity(activityData);
                setUsersWithRewards(usersData);
            } catch (error) {
                console.error('Error refreshing admin data:', error);
            }
        };

        // Subscribe to lost items changes
        const lostChannel = supabase
            .channel('admin-lost-items')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'lost_items' }, () => {
                console.log('Lost items changed, refreshing...');
                fetchData();
            })
            .subscribe();

        // Subscribe to found items changes
        const foundChannel = supabase
            .channel('admin-found-items')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'found_items' }, () => {
                console.log('Found items changed, refreshing...');
                fetchData();
            })
            .subscribe();

        // Subscribe to matches changes
        const matchChannel = supabase
            .channel('admin-matches')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => {
                console.log('Matches changed, refreshing...');
                fetchData();
            })
            .subscribe();

        // Subscribe to purchases changes
        const purchasesChannel = supabase
            .channel('admin-purchases')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'purchases' }, (payload) => {
                console.log('🔔 Purchases changed!', payload);
                setTimeout(() => fetchData(), 500);
            })
            .subscribe((status) => {
                console.log('📡 Purchases subscription status:', status);
            });

        // Subscribe to redemptions changes
        const redemptionsChannel = supabase
            .channel('admin-redemptions')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'redemptions' }, (payload) => {
                console.log('🔔 Redemptions changed!', payload);
                setTimeout(() => fetchData(), 500);
            })
            .subscribe((status) => {
                console.log('📡 Redemptions subscription status:', status);
            });

        // Subscribe to reward_transactions changes (for earned points)
        const rewardTransactionsChannel = supabase
            .channel('admin-reward-transactions')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'reward_transactions' }, (payload) => {
                console.log('🔔 Reward transactions changed!', payload);
                // Small delay to ensure transaction is committed
                setTimeout(() => fetchData(), 500);
            })
            .subscribe((status) => {
                console.log('📡 Reward transactions subscription status:', status);
            });

        return () => {
            supabase.removeChannel(lostChannel);
            supabase.removeChannel(foundChannel);
            supabase.removeChannel(matchChannel);
            supabase.removeChannel(purchasesChannel);
            supabase.removeChannel(redemptionsChannel);
            supabase.removeChannel(rewardTransactionsChannel);
        };
    }, [isAuthorized]);

    if (isLoading) {
        return (
            <Layout showHeader showNotifications>
                <div className="max-w-7xl mx-auto py-8">
                    <div className="glass-card p-12 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-gray-600 dark:text-gray-400">
                            {isAuthorized ? 'Loading admin dashboard...' : 'Checking permissions...'}
                        </p>
                    </div>
                </div>
            </Layout>
        );
    }

    if (!isAuthorized) {
        return null; // Will redirect
    }

    return (
        <Layout showHeader showNotifications>
            <div className="max-w-7xl mx-auto py-8 px-4 space-y-6 pb-24 md:pb-8">
                {/* Header */}
                <div className="animate-fade-in">
                    <h1 className="text-3xl md:text-4xl font-bold text-gradient-rainbow mb-2">Admin Dashboard</h1>
                    <p className="text-muted-foreground">
                        Manage and monitor the Lost & Found system
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <Card variant="glass" hover className="animate-slide-up">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Lost Items</p>
                                    <p className="text-3xl font-bold">{stats.totalLostItems}</p>
                                </div>
                                <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                    <AlertCircle className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card variant="glass" hover className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Found Items</p>
                                    <p className="text-3xl font-bold">{stats.totalFoundItems}</p>
                                </div>
                                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                    <Search className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card variant="glass" hover className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Matches</p>
                                    <p className="text-3xl font-bold">{stats.totalMatches}</p>
                                </div>
                                <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                    <Zap className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card variant="glass" hover className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Returned</p>
                                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.successfulReturns}</p>
                                </div>
                                <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                    <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card variant="glass" hover className="animate-slide-up" style={{ animationDelay: '0.4s' }}>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Active Users</p>
                                    <p className="text-3xl font-bold text-gradient-primary">{stats.activeUsers}</p>
                                </div>
                                <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                    <Users className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs - Mobile Responsive */}
                <div className="glass-card p-2">
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`flex-shrink-0 py-2 px-4 sm:px-6 rounded-lg font-medium transition-all text-sm sm:text-base whitespace-nowrap ${activeTab === 'overview'
                                ? 'bg-primary text-white shadow-glow'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-700/50'
                                }`}
                        >
                            📊 Overview
                        </button>
                        <button
                            onClick={() => setActiveTab('lost')}
                            className={`flex-shrink-0 py-2 px-4 sm:px-6 rounded-lg font-medium transition-all text-sm sm:text-base whitespace-nowrap ${activeTab === 'lost'
                                ? 'bg-primary text-white shadow-glow'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-700/50'
                                }`}
                        >
                            🔍 Lost Items
                        </button>
                        <button
                            onClick={() => setActiveTab('found')}
                            className={`flex-shrink-0 py-2 px-4 sm:px-6 rounded-lg font-medium transition-all text-sm sm:text-base whitespace-nowrap ${activeTab === 'found'
                                ? 'bg-primary text-white shadow-glow'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-700/50'
                                }`}
                        >
                            ✅ Found Items
                        </button>
                        <button
                            onClick={() => setActiveTab('matches')}
                            className={`flex-shrink-0 py-2 px-4 sm:px-6 rounded-lg font-medium transition-all text-sm sm:text-base whitespace-nowrap ${activeTab === 'matches'
                                ? 'bg-primary text-white shadow-glow'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-700/50'
                                }`}
                        >
                            ⚡ Matches
                        </button>
                        <button
                            onClick={() => setActiveTab('users')}
                            className={`flex-shrink-0 py-2 px-4 sm:px-6 rounded-lg font-medium transition-all text-sm sm:text-base whitespace-nowrap ${activeTab === 'users'
                                ? 'bg-primary text-white shadow-glow'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-700/50'
                                }`}
                        >
                            👥 Users & Rewards
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="glass-card p-6">
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">System Overview</h2>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Recent Activity</h3>
                                    <div className="space-y-3">
                                        {recentActivity.length > 0 ? (
                                            recentActivity.map((activity, index) => (
                                                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                    <div className={`w-2 h-2 rounded-full ${activity.type === 'match' ? 'bg-green-500' :
                                                        activity.type === 'found' ? 'bg-blue-500' :
                                                            'bg-purple-500'
                                                        }`}></div>
                                                    <p className="text-sm text-gray-700 dark:text-gray-300">{activity.message}</p>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                                                No recent activity
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Success Rate</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex justify-between mb-2">
                                                <span className="text-sm text-gray-600 dark:text-gray-400">Items Returned</span>
                                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {Math.round((stats.successfulReturns / stats.totalLostItems) * 100)}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                <div
                                                    className="bg-primary h-2 rounded-full transition-all"
                                                    style={{ width: `${(stats.successfulReturns / stats.totalLostItems) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between mb-2">
                                                <span className="text-sm text-gray-600 dark:text-gray-400">Match Rate</span>
                                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {Math.round((stats.totalMatches / stats.totalLostItems) * 100)}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                <div
                                                    className="bg-accent h-2 rounded-full transition-all"
                                                    style={{ width: `${(stats.totalMatches / stats.totalLostItems) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'lost' && (
                        <div className="glass-card p-6">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Lost Items</h2>
                            <div className="overflow-x-auto -mx-6 px-6">
                                <table className="w-full min-w-[800px]">
                                    <thead className="border-b border-gray-200 dark:border-gray-700">
                                        <tr>
                                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Image</th>
                                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Item</th>
                                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Category</th>
                                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Description</th>
                                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Purpose</th>
                                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Location</th>
                                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Owner</th>
                                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Contact</th>
                                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Date Lost</th>
                                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {lostItems.length > 0 ? (
                                            lostItems.map((item) => (
                                                <tr key={item.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                    <td className="py-3 px-4">
                                                        {item.image_url ? (
                                                            <img src={item.image_url} alt={item.item_name} className="w-12 h-12 object-cover rounded" />
                                                        ) : (
                                                            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                                                                <span className="text-xs text-gray-400">No img</span>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-white font-medium">{item.item_name}</td>
                                                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{item.item_category}</td>
                                                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate" title={item.description}>
                                                        {item.description || 'N/A'}
                                                    </td>
                                                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate" title={item.purpose}>
                                                        {item.purpose || 'N/A'}
                                                    </td>
                                                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{item.location}</td>
                                                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{item.owner_name}</td>
                                                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{item.owner_contact}</td>
                                                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                                                        {formatForDisplay(item.datetime_lost, true)}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className={`badge-${item.status}`}>
                                                            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={8} className="py-8 text-center text-gray-500 dark:text-gray-400">
                                                    No lost items found
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'found' && (
                        <div className="space-y-4">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Found Items</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-200 dark:border-gray-700">
                                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Image</th>
                                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Item Name</th>
                                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Category</th>
                                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Description</th>
                                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Purpose</th>
                                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Location</th>
                                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Finder</th>
                                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Contact</th>
                                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Date Found</th>
                                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {foundItems.length > 0 ? (
                                            foundItems.map((item) => (
                                                <tr key={item.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                    <td className="py-3 px-4">
                                                        {item.image_url ? (
                                                            <img src={item.image_url} alt={item.item_name} className="w-12 h-12 object-cover rounded" />
                                                        ) : (
                                                            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                                                                <span className="text-xs text-gray-400">No img</span>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-white font-medium">{item.item_name}</td>
                                                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{item.item_category}</td>
                                                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate" title={item.description}>
                                                        {item.description || 'N/A'}
                                                    </td>
                                                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate" title={item.purpose}>
                                                        {item.purpose || 'N/A'}
                                                    </td>
                                                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{item.location}</td>
                                                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{item.finder_name}</td>
                                                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{item.finder_contact}</td>
                                                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                                                        {formatForDisplay(item.datetime_found, true)}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className={`badge-${item.status}`}>
                                                            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={8} className="py-8 text-center text-gray-500 dark:text-gray-400">
                                                    No found items
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'matches' && (
                        <div className="space-y-4">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Matches</h2>
                            <p className="text-gray-600 dark:text-gray-400">
                                Note: Chat messages are private and cannot be viewed by admins for privacy reasons.
                            </p>
                            <div className="text-center py-12">
                                <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                <p className="text-gray-500 dark:text-gray-400">Match details will be displayed here</p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'users' && (
                        <div className="space-y-4">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">User Transactions</h2>
                            <div className="overflow-x-auto -mx-6 px-6">
                                <table className="w-full min-w-[800px]">
                                    <thead className="border-b border-gray-200 dark:border-gray-700">
                                        <tr>
                                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Icon</th>
                                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">User Name</th>
                                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Item Bought</th>
                                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Cost</th>
                                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Available Balance</th>
                                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Type</th>
                                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {usersWithRewards.length > 0 ? (
                                            usersWithRewards.map((transaction: any) => (
                                                <tr key={transaction.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                    <td className="py-3 px-4 text-2xl">{transaction.icon}</td>
                                                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-white font-medium">
                                                        {transaction.userName}
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">{transaction.userEmail}</p>
                                                    </td>
                                                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">{transaction.itemBought}</td>
                                                    <td className={`py-3 px-4 text-sm font-bold ${transaction.cost > 0
                                                        ? 'text-green-600 dark:text-green-400'
                                                        : 'text-red-600 dark:text-red-400'
                                                        }`}>
                                                        {transaction.cost > 0 ? '+' : ''}{transaction.cost} pts
                                                    </td>
                                                    <td className="py-3 px-4 text-sm font-bold text-primary">{transaction.availableBalance} pts</td>
                                                    <td className="py-3 px-4">
                                                        <span className={`text-xs px-2 py-1 rounded-full ${transaction.type === 'Purchase'
                                                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                                                            : transaction.type === 'Redemption'
                                                                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                                                                : transaction.type === 'Earned'
                                                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                                                    : transaction.type === 'Bonus'
                                                                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                                                                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                                            }`}>
                                                            {transaction.type}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                                                        {new Date(transaction.date).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })} <br />
                                                        {new Date(transaction.date).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={7} className="py-8 text-center text-gray-500 dark:text-gray-400">
                                                    No transactions found
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
