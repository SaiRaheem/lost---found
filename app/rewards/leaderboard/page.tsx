'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';

interface LeaderboardUser {
    rank: number;
    id: string;
    name: string;
    points: number;
    itemsReturned: number;
    badge: string;
    avatar: string;
}

export default function LeaderboardPage() {
    const router = useRouter();
    const [timeframe, setTimeframe] = useState('all-time');
    const currentUserId = 'user-123'; // TODO: Get from auth

    // Mock data - TODO: Replace with API
    const leaderboard: LeaderboardUser[] = [
        { rank: 1, id: '1', name: 'Rahul Kumar', points: 2450, itemsReturned: 45, badge: '👑', avatar: '🧑' },
        { rank: 2, id: '2', name: 'Priya Sharma', points: 2100, itemsReturned: 38, badge: '🥈', avatar: '👩' },
        { rank: 3, id: '3', name: 'Amit Patel', points: 1850, itemsReturned: 32, badge: '🥉', avatar: '🧑' },
        { rank: 4, id: '4', name: 'Sneha Reddy', points: 1600, itemsReturned: 28, badge: '⭐', avatar: '👩' },
        { rank: 5, id: '5', name: 'Vikram Singh', points: 1400, itemsReturned: 24, badge: '⭐', avatar: '🧑' },
        { rank: 6, id: '6', name: 'Anjali Gupta', points: 1200, itemsReturned: 21, badge: '⭐', avatar: '👩' },
        { rank: 7, id: '7', name: 'Rohan Mehta', points: 1050, itemsReturned: 19, badge: '⭐', avatar: '🧑' },
        { rank: 8, id: '8', name: 'Kavya Iyer', points: 900, itemsReturned: 16, badge: '⭐', avatar: '👩' },
        { rank: 9, id: '9', name: 'Arjun Nair', points: 750, itemsReturned: 14, badge: '⭐', avatar: '🧑' },
        { rank: 10, id: '10', name: 'Divya Joshi', points: 650, itemsReturned: 12, badge: '⭐', avatar: '👩' },
        { rank: 11, id: currentUserId, name: 'You', points: 450, itemsReturned: 8, badge: '🌟', avatar: '😊' }
    ];

    const getRankColor = (rank: number) => {
        if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
        if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
        if (rank === 3) return 'bg-gradient-to-r from-orange-400 to-orange-600 text-white';
        return 'bg-gray-100 dark:bg-gray-800';
    };

    const currentUser = leaderboard.find(u => u.id === currentUserId);

    return (
        <Layout>
            <div className="container mx-auto px-4 py-6 max-w-4xl pb-24 md:pb-6">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => router.back()}
                        className="text-primary hover:underline mb-2 flex items-center gap-1"
                    >
                        ← Back
                    </button>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        🏆 Leaderboard
                    </h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Top helpers in our community
                    </p>
                </div>

                {/* Timeframe Filter */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                    {[
                        { id: 'all-time', label: 'All Time' },
                        { id: 'monthly', label: 'This Month' },
                        { id: 'weekly', label: 'This Week' }
                    ].map(tf => (
                        <button
                            key={tf.id}
                            onClick={() => setTimeframe(tf.id)}
                            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${timeframe === tf.id
                                    ? 'bg-primary text-white'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }`}
                        >
                            {tf.label}
                        </button>
                    ))}
                </div>

                {/* Your Rank Card */}
                {currentUser && (
                    <div className="glass-card p-4 mb-6 bg-gradient-to-br from-primary/10 to-purple-500/10">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="text-4xl">{currentUser.avatar}</div>
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Your Rank</p>
                                    <p className="text-2xl font-bold text-primary">#{currentUser.rank}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-gray-600 dark:text-gray-400">Points</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {currentUser.points}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Top 3 Podium */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                    {leaderboard.slice(0, 3).map(user => (
                        <div
                            key={user.id}
                            className={`glass-card p-4 text-center ${user.rank === 1 ? 'transform scale-110' : ''
                                }`}
                        >
                            <div className="text-3xl mb-2">{user.badge}</div>
                            <div className="text-2xl mb-2">{user.avatar}</div>
                            <p className="font-bold text-sm text-gray-900 dark:text-white truncate">
                                {user.name}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                                {user.itemsReturned} items
                            </p>
                            <p className="text-lg font-bold text-primary">
                                {user.points} pts
                            </p>
                        </div>
                    ))}
                </div>

                {/* Full Leaderboard */}
                <div className="glass-card p-4">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                        All Rankings
                    </h2>
                    <div className="space-y-2">
                        {leaderboard.map(user => (
                            <div
                                key={user.id}
                                className={`p-3 rounded-lg transition-all ${user.id === currentUserId
                                        ? 'bg-primary/10 border-2 border-primary'
                                        : 'bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${getRankColor(user.rank)}`}>
                                        {user.rank <= 3 ? user.badge : `#${user.rank}`}
                                    </div>
                                    <div className="text-2xl">{user.avatar}</div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-gray-900 dark:text-white truncate">
                                            {user.name}
                                            {user.id === currentUserId && (
                                                <span className="ml-2 text-xs bg-primary text-white px-2 py-0.5 rounded-full">
                                                    You
                                                </span>
                                            )}
                                        </p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                            {user.itemsReturned} items returned
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-bold text-primary">
                                            {user.points}
                                        </p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                            points
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Info Card */}
                <div className="glass-card p-4 mt-6 bg-gradient-to-br from-blue-500/10 to-purple-500/10">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-2">
                        💡 How to Climb the Leaderboard
                    </h3>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        <li>• Return items quickly (within 24hrs for max points)</li>
                        <li>• Help with high-value items (Electronics, Wallets)</li>
                        <li>• Maintain a good track record</li>
                        <li>• Be active and responsive</li>
                    </ul>
                </div>
            </div>
        </Layout>
    );
}
