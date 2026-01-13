'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import { getLeaderboard } from '@/services/supabase/rewards.service';
import { supabase } from '@/services/supabase/client';
import { useAuthProtection } from '@/hooks/useAuthProtection';

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
    const authLoading = useAuthProtection();
    const [timeframe, setTimeframe] = useState('all-time');
    const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    useEffect(() => {
        fetchLeaderboard();
        getCurrentUser();
    }, [timeframe]);

    const getCurrentUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUserId(user?.id || null);
    };

    const fetchLeaderboard = async () => {
        try {
            setLoading(true);
            setError('');

            const data = await getLeaderboard(50);

            // Assign badges and avatars
            const enrichedData = data.map((user: any) => ({
                ...user,
                badge: getBadge(user.rank),
                avatar: getAvatar(user.name)
            }));

            setLeaderboard(enrichedData);
        } catch (err) {
            console.error('Error fetching leaderboard:', err);
            setError('Failed to load leaderboard');
        } finally {
            setLoading(false);
        }
    };

    const getBadge = (rank: number): string => {
        if (rank === 1) return '👑';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        if (rank <= 10) return '⭐';
        return '🌟';
    };

    const getAvatar = (name: string): string => {
        // Simple avatar based on first letter
        const firstLetter = name.charAt(0).toUpperCase();
        const avatars = ['🧑', '👩', '👨', '🧒', '👦', '👧'];
        const index = firstLetter.charCodeAt(0) % avatars.length;
        return avatars[index];
    };

    const getRankColor = (rank: number) => {
        if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
        if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
        if (rank === 3) return 'bg-gradient-to-r from-orange-400 to-orange-600 text-white';
        return 'bg-gray-100 dark:bg-gray-800';
    };

    const currentUser = leaderboard.find(u => u.id === currentUserId);

    if (authLoading || loading) {
        return (
            <Layout>
                <div className="container mx-auto px-4 py-6 max-w-4xl pb-24 md:pb-6">
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                            <p className="text-gray-600 dark:text-gray-400">Loading leaderboard...</p>
                        </div>
                    </div>
                </div>
            </Layout>
        );
    }

    if (error) {
        return (
            <Layout>
                <div className="container mx-auto px-4 py-6 max-w-4xl pb-24 md:pb-6">
                    <div className="glass-card p-6 text-center">
                        <p className="text-red-600 dark:text-red-400 mb-4">❌ {error}</p>
                        <button
                            onClick={fetchLeaderboard}
                            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </Layout>
        );
    }

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
                {leaderboard.length >= 3 && (
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
                )}

                {/* Full Leaderboard */}
                <div className="glass-card p-4">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                        All Rankings
                    </h2>
                    {leaderboard.length === 0 ? (
                        <p className="text-center text-gray-600 dark:text-gray-400 py-8">
                            No users on the leaderboard yet
                        </p>
                    ) : (
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
                    )}
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
