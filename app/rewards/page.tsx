'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import { getCurrentUser } from '@/services/supabase/client';
import { getUserRewardBalance, getUserRewardTransactions, getRewardStatistics } from '@/services/supabase/rewards.service';
import { useAuthProtection } from '@/hooks/useAuthProtection';

interface Transaction {
    id: string;
    points: number;
    type: string;
    category?: string;
    reason: string;
    time_multiplier?: number;
    created_at: string;
    metadata?: any;
}

export default function RewardsPage() {
    const router = useRouter();
    const authLoading = useAuthProtection();
    const [isLoading, setIsLoading] = useState(true);
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [stats, setStats] = useState({
        totalEarned: 0,
        totalRedeemed: 0,
        totalPenalties: 0,
        transactionCount: 0
    });
    const [filter, setFilter] = useState<string>('all');

    useEffect(() => {
        const loadRewardsData = async () => {
            try {
                const user = await getCurrentUser();
                if (!user) {
                    router.push('/auth');
                    return;
                }

                // Load balance, transactions, and stats
                const [balanceData, transactionsData, statsData] = await Promise.all([
                    getUserRewardBalance(user.id),
                    getUserRewardTransactions(user.id, 50),
                    getRewardStatistics(user.id)
                ]);

                setBalance(balanceData);
                setTransactions(transactionsData);
                setStats(statsData);
            } catch (error) {
                console.error('Error loading rewards:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadRewardsData();
    }, [router]);

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'earned':
            case 'bonus':
                return 'text-green-600 dark:text-green-400';
            case 'redeemed':
                return 'text-blue-600 dark:text-blue-400';
            case 'penalty':
                return 'text-red-600 dark:text-red-400';
            default:
                return 'text-gray-600 dark:text-gray-400';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'earned':
                return '💰';
            case 'bonus':
                return '🎁';
            case 'redeemed':
                return '🎯';
            case 'penalty':
                return '⚠️';
            default:
                return '📝';
        }
    };

    const filteredTransactions = filter === 'all'
        ? transactions
        : transactions.filter(tx => tx.type === filter);

    if (authLoading || isLoading) {
        return (
            <Layout showNotifications={true}>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-gray-600 dark:text-gray-400">Loading rewards...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout showNotifications={true}>
            <div className="container mx-auto px-4 py-6 max-w-4xl pb-24 md:pb-6">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        🏆 Your Rewards
                    </h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Earn points by helping others find their lost items
                    </p>
                </div>

                {/* Balance Card */}
                <div className="glass-card p-6 mb-6 bg-gradient-to-br from-primary/10 to-purple-500/10">
                    <div className="text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Points</p>
                        <div className="text-5xl font-bold text-primary mb-4">
                            {balance}
                        </div>
                        <div className="flex justify-center gap-4 text-sm flex-wrap">
                            <div>
                                <span className="text-gray-600 dark:text-gray-400">Earned: </span>
                                <span className="font-bold text-green-600 dark:text-green-400">
                                    +{stats.totalEarned}
                                </span>
                            </div>
                            {stats.totalRedeemed > 0 && (
                                <div>
                                    <span className="text-gray-600 dark:text-gray-400">Redeemed: </span>
                                    <span className="font-bold text-blue-600 dark:text-blue-400">
                                        -{stats.totalRedeemed}
                                    </span>
                                </div>
                            )}
                            {stats.totalPenalties > 0 && (
                                <div>
                                    <span className="text-gray-600 dark:text-gray-400">Penalties: </span>
                                    <span className="font-bold text-red-600 dark:text-red-400">
                                        -{stats.totalPenalties}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="glass-card p-4 text-center">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {stats.transactionCount}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Transactions</div>
                    </div>
                    <div className="glass-card p-4 text-center">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {stats.totalEarned}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Total Earned</div>
                    </div>
                    <div className="glass-card p-4 text-center">
                        <div className="text-2xl font-bold text-primary">
                            {balance}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Available</div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    <button
                        onClick={() => router.push('/rewards/gift-cards')}
                        className="glass-card p-4 text-center hover:shadow-lg hover:scale-105 transition-all"
                    >
                        <div className="text-3xl mb-2">🎁</div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">Gift Cards</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Redeem</p>
                    </button>
                    <button
                        onClick={() => router.push('/rewards/shop')}
                        className="glass-card p-4 text-center hover:shadow-lg hover:scale-105 transition-all"
                    >
                        <div className="text-3xl mb-2">🛍️</div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">Shop</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Perks & Boosts</p>
                    </button>
                    <button
                        onClick={() => router.push('/rewards/leaderboard')}
                        className="glass-card p-4 text-center hover:shadow-lg hover:scale-105 transition-all"
                    >
                        <div className="text-3xl mb-2">🏆</div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">Leaderboard</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Rankings</p>
                    </button>
                    <button
                        onClick={() => router.push('/rewards/transactions')}
                        className="glass-card p-4 text-center hover:shadow-lg hover:scale-105 transition-all"
                    >
                        <div className="text-3xl mb-2">📊</div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">History</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">All Transactions</p>
                    </button>
                </div>

                {/* Transaction History */}
                <div className="glass-card p-4 md:p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                            Recent Transactions
                        </h2>
                        <button
                            onClick={() => router.push('/rewards/transactions')}
                            className="text-sm text-primary hover:underline"
                        >
                            View All →
                        </button>
                    </div>

                    {transactions.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">🎁</div>
                            <p className="text-gray-600 dark:text-gray-400 mb-2">No transactions yet</p>
                            <p className="text-sm text-gray-500 dark:text-gray-500">
                                Start helping others find their items to earn rewards!
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {transactions.slice(0, 3).map((tx) => (
                                <div
                                    key={tx.id}
                                    className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                >
                                    <div className="text-2xl">{getTypeIcon(tx.type)}</div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900 dark:text-white text-sm">
                                                    {tx.reason}
                                                </p>
                                                {tx.category && (
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        Category: {tx.category}
                                                    </p>
                                                )}
                                                {tx.time_multiplier && tx.time_multiplier < 1 && (
                                                    <p className="text-xs text-yellow-600 dark:text-yellow-400">
                                                        Time decay: {(tx.time_multiplier * 100).toFixed(0)}%
                                                    </p>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <div className={`text-lg font-bold ${getTypeColor(tx.type)}`}>
                                                    {tx.points > 0 ? '+' : ''}{tx.points}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                                    {tx.type}
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            {new Date(tx.created_at).toLocaleDateString()} at{' '}
                                            {new Date(tx.created_at).toLocaleTimeString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Coming Soon */}
                <div className="glass-card p-6 mt-6 bg-gradient-to-br from-blue-500/10 to-purple-500/10">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                        🎯 Coming Soon
                    </h3>
                    <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <li>🎁 Redeem points for gift cards</li>
                        <li>⭐ Credibility score system</li>
                        <li>🏆 Leaderboard rankings</li>
                        <li>🎉 Special badges and achievements</li>
                    </ul>
                </div>
            </div>
        </Layout>
    );
}
