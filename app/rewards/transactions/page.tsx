'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import { getCurrentUser } from '@/services/supabase/client';
import { getUserRewardTransactions, getRewardStatistics, getUserRewardBalance } from '@/services/supabase/rewards.service';

interface Transaction {
    id: string;
    type: 'earned' | 'redeemed' | 'bonus' | 'penalty';
    points: number;
    reason: string;
    category?: string;
    time_multiplier?: number;
    created_at: string;
    metadata?: any;
}

export default function TransactionsPage() {
    const router = useRouter();
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({
        totalEarned: 0,
        totalRedeemed: 0,
        totalPenalties: 0,
        balance: 0
    });

    useEffect(() => {
        const loadData = async () => {
            try {
                const user = await getCurrentUser();
                if (!user) {
                    router.push('/auth');
                    return;
                }

                const [transactionsData, statsData, balance] = await Promise.all([
                    getUserRewardTransactions(user.id, 100),
                    getRewardStatistics(user.id),
                    getUserRewardBalance(user.id)
                ]);

                setTransactions(transactionsData || []);
                setStats({
                    ...statsData,
                    balance
                });
            } catch (error) {
                console.error('Error loading transactions:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
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

    const getStatusBadge = () => {
        return <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">✓ Completed</span>;
    };

    const filteredTransactions = transactions.filter(tx => {
        const matchesFilter = filter === 'all' || tx.type === filter;
        const matchesSearch = tx.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (tx.category?.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesFilter && matchesSearch;
    });

    if (isLoading) {
        return (
            <Layout>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-gray-600 dark:text-gray-400">Loading transactions...</p>
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
                        📊 Transaction History
                    </h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        View all your reward transactions
                    </p>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="glass-card p-4 text-center">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                            +{stats.totalEarned}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Earned</div>
                    </div>
                    <div className="glass-card p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            -{stats.totalRedeemed}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Redeemed</div>
                    </div>
                    <div className="glass-card p-4 text-center">
                        <div className="text-2xl font-bold text-primary">
                            {stats.balance}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Balance</div>
                    </div>
                </div>

                {/* Filters */}
                <div className="glass-card p-4 mb-6">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <input
                            type="text"
                            placeholder="Search transactions..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                        />
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                        >
                            <option value="all">All Types</option>
                            <option value="earned">Earned</option>
                            <option value="bonus">Bonus</option>
                            <option value="redeemed">Redeemed</option>
                            <option value="penalty">Penalties</option>
                        </select>
                    </div>
                </div>

                {/* Transactions List */}
                <div className="space-y-3">
                    {filteredTransactions.length === 0 ? (
                        <div className="glass-card p-12 text-center">
                            <div className="text-6xl mb-4">📭</div>
                            <p className="text-gray-600 dark:text-gray-400">No transactions found</p>
                        </div>
                    ) : (
                        filteredTransactions.map(tx => (
                            <div key={tx.id} className="glass-card p-4 hover:shadow-lg transition-shadow">
                                <div className="flex items-start gap-3">
                                    <div className="text-3xl">{getTypeIcon(tx.type)}</div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <div className="flex-1">
                                                <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                                                    {tx.reason}
                                                </h3>
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
                                                <div className={`text-2xl font-bold ${getTypeColor(tx.type)}`}>
                                                    {tx.points > 0 ? '+' : ''}{tx.points}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                                    {tx.type}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                            <div>
                                                📅 {new Date(tx.created_at).toLocaleDateString()} • 🕐 {new Date(tx.created_at).toLocaleTimeString()}
                                            </div>
                                            {getStatusBadge()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </Layout>
    );
}
