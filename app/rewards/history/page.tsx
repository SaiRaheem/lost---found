'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import { getCurrentUser } from '@/services/supabase/client';
import { getUserRedemptions, getUserPurchases } from '@/services/supabase/rewards.service';

interface Redemption {
    id: string;
    redemption_code: string;
    points_spent: number;
    status: string;
    created_at: string;
    gift_card: {
        name: string;
        brand: string;
        value_inr: number;
        icon: string;
    };
}

interface Purchase {
    id: string;
    points_spent: number;
    status: string;
    created_at: string;
    expires_at: string | null;
    shop_item: {
        name: string;
        description: string;
        icon: string;
        duration_days: number | null;
    };
}

export default function RedemptionHistoryPage() {
    const router = useRouter();
    const [redemptions, setRedemptions] = useState<Redemption[]>([]);
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'gift-cards' | 'purchases'>('gift-cards');

    useEffect(() => {
        const loadData = async () => {
            try {
                const user = await getCurrentUser();
                if (!user) {
                    router.push('/auth');
                    return;
                }

                const [redemptionsData, purchasesData] = await Promise.all([
                    getUserRedemptions(user.id),
                    getUserPurchases(user.id)
                ]);

                setRedemptions(redemptionsData || []);
                setPurchases(purchasesData || []);
            } catch (error) {
                console.error('Error loading redemption history:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [router]);

    if (isLoading) {
        return (
            <Layout>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-gray-600 dark:text-gray-400">Loading history...</p>
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
                        🎁 Redemption History
                    </h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        View all your redeemed gift cards and purchases
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setActiveTab('gift-cards')}
                        className={`flex-1 px-4 py-2 rounded-lg transition-colors ${activeTab === 'gift-cards'
                                ? 'bg-primary text-white'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                            }`}
                    >
                        🎁 Gift Cards ({redemptions.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('purchases')}
                        className={`flex-1 px-4 py-2 rounded-lg transition-colors ${activeTab === 'purchases'
                                ? 'bg-primary text-white'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                            }`}
                    >
                        🛍️ Purchases ({purchases.length})
                    </button>
                </div>

                {/* Gift Cards Tab */}
                {activeTab === 'gift-cards' && (
                    <div className="space-y-3">
                        {redemptions.length === 0 ? (
                            <div className="glass-card p-12 text-center">
                                <div className="text-6xl mb-4">🎁</div>
                                <p className="text-gray-600 dark:text-gray-400 mb-2">No gift cards redeemed yet</p>
                                <button
                                    onClick={() => router.push('/rewards/gift-cards')}
                                    className="text-primary hover:underline text-sm"
                                >
                                    Browse Gift Cards →
                                </button>
                            </div>
                        ) : (
                            redemptions.map(redemption => (
                                <div key={redemption.id} className="glass-card p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="text-4xl">{redemption.gift_card.icon}</div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-gray-900 dark:text-white">
                                                {redemption.gift_card.name}
                                            </h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                Value: ₹{redemption.gift_card.value_inr} • {redemption.points_spent} points
                                            </p>
                                            <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded">
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Redemption Code:</p>
                                                <p className="font-mono font-bold text-primary">{redemption.redemption_code}</p>
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                                {new Date(redemption.created_at).toLocaleDateString()} at{' '}
                                                {new Date(redemption.created_at).toLocaleTimeString()}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">
                                                {redemption.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Purchases Tab */}
                {activeTab === 'purchases' && (
                    <div className="space-y-3">
                        {purchases.length === 0 ? (
                            <div className="glass-card p-12 text-center">
                                <div className="text-6xl mb-4">🛍️</div>
                                <p className="text-gray-600 dark:text-gray-400 mb-2">No purchases yet</p>
                                <button
                                    onClick={() => router.push('/rewards/shop')}
                                    className="text-primary hover:underline text-sm"
                                >
                                    Browse Shop →
                                </button>
                            </div>
                        ) : (
                            purchases.map(purchase => {
                                const isExpired = purchase.expires_at && new Date(purchase.expires_at) < new Date();

                                return (
                                    <div key={purchase.id} className="glass-card p-4">
                                        <div className="flex items-start gap-3">
                                            <div className="text-4xl">{purchase.shop_item.icon}</div>
                                            <div className="flex-1">
                                                <h3 className="font-bold text-gray-900 dark:text-white">
                                                    {purchase.shop_item.name}
                                                </h3>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    {purchase.shop_item.description}
                                                </p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                    {purchase.points_spent} points
                                                </p>
                                                {purchase.expires_at && (
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                        {isExpired ? 'Expired on' : 'Expires on'}{' '}
                                                        {new Date(purchase.expires_at).toLocaleDateString()}
                                                    </p>
                                                )}
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    Purchased: {new Date(purchase.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div>
                                                <span className={`px-2 py-1 text-xs rounded-full ${isExpired
                                                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                                                        : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                                    }`}>
                                                    {isExpired ? 'expired' : purchase.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>
        </Layout>
    );
}
