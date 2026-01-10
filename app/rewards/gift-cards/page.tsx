'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import Button from '@/components/ui/Button';
import { getCurrentUser } from '@/services/supabase/client';
import { getGiftCards, redeemGiftCard, getUserRewardBalance } from '@/services/supabase/rewards.service';

interface GiftCard {
    id: string;
    name: string;
    brand: string;
    points_cost: number;
    value_inr: number;
    icon: string;
    description: string;
    category: string;
}

export default function GiftCardsPage() {
    const router = useRouter();
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [userBalance, setUserBalance] = useState(0);
    const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRedeeming, setIsRedeeming] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                const user = await getCurrentUser();
                if (!user) {
                    router.push('/auth');
                    return;
                }

                const [balance, cards] = await Promise.all([
                    getUserRewardBalance(user.id),
                    getGiftCards()
                ]);

                setUserBalance(balance);
                setGiftCards(cards || []);
            } catch (error) {
                console.error('Error loading gift cards:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [router]);

    const categories = [
        { id: 'all', name: 'All', icon: '🎁' },
        { id: 'shopping', name: 'Shopping', icon: '🛍️' },
        { id: 'food', name: 'Food', icon: '🍕' },
        { id: 'entertainment', name: 'Entertainment', icon: '🎬' },
        { id: 'wallet', name: 'Wallet', icon: '💳' }
    ];

    const filteredCards = selectedCategory === 'all'
        ? giftCards
        : giftCards.filter(card => card.category === selectedCategory);

    const handleRedeem = async (card: GiftCard) => {
        if (userBalance < card.points_cost) {
            alert(`❌ Insufficient points! You need ${card.points_cost - userBalance} more points.`);
            return;
        }

        if (!confirm(`Redeem ${card.name} for ${card.points_cost} points?\n\nYou will receive: ₹${card.value_inr} ${card.brand} voucher`)) {
            return;
        }

        setIsRedeeming(true);
        try {
            const user = await getCurrentUser();
            if (!user) return;

            const result = await redeemGiftCard(user.id, card.id);

            // Update balance
            setUserBalance(prev => prev - card.points_cost);

            alert(`🎉 Success!\n\nRedemption Code: ${result.redemptionCode}\n\nSave this code to claim your ${card.name}!`);
        } catch (error: any) {
            alert(`❌ ${error.message || 'Failed to redeem gift card'}`);
        } finally {
            setIsRedeeming(false);
        }
    };

    if (isLoading) {
        return (
            <Layout>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-gray-600 dark:text-gray-400">Loading gift cards...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="container mx-auto px-4 py-6 max-w-6xl pb-24 md:pb-6">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => router.back()}
                        className="text-primary hover:underline mb-2 flex items-center gap-1"
                    >
                        ← Back
                    </button>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        🎁 Redeem Gift Cards
                    </h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Exchange your points for amazing rewards
                    </p>
                </div>

                {/* Balance Card */}
                <div className="glass-card p-4 mb-6 bg-gradient-to-br from-primary/10 to-purple-500/10">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Your Balance</p>
                            <p className="text-3xl font-bold text-primary">{userBalance} pts</p>
                        </div>
                        <div className="text-4xl">💎</div>
                    </div>
                </div>

                {/* Category Filter */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${selectedCategory === cat.id
                                    ? 'bg-primary text-white'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }`}
                        >
                            {cat.icon} {cat.name}
                        </button>
                    ))}
                </div>

                {/* Gift Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredCards.map(card => {
                        const canAfford = userBalance >= card.points_cost;

                        return (
                            <div
                                key={card.id}
                                className={`glass-card p-4 transition-all ${canAfford ? 'hover:shadow-lg hover:scale-105' : 'opacity-60'
                                    }`}
                            >
                                <div className="text-center mb-3">
                                    <div className="text-5xl mb-2">{card.icon}</div>
                                    <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                                        {card.name}
                                    </h3>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                        {card.description}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Value</p>
                                        <p className="text-lg font-bold text-green-600 dark:text-green-400">
                                            ₹{card.value_inr}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Cost</p>
                                        <p className="text-lg font-bold text-primary">
                                            {card.points_cost} pts
                                        </p>
                                    </div>
                                </div>

                                <Button
                                    onClick={() => handleRedeem(card)}
                                    disabled={!canAfford || isRedeeming}
                                    className="w-full"
                                    variant={canAfford ? 'primary' : 'secondary'}
                                >
                                    {isRedeeming ? 'Processing...' : canAfford ? 'Redeem Now' : 'Insufficient Points'}
                                </Button>
                            </div>
                        );
                    })}
                </div>

                {filteredCards.length === 0 && (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">🎁</div>
                        <p className="text-gray-600 dark:text-gray-400">
                            No gift cards in this category
                        </p>
                    </div>
                )}
            </div>
        </Layout>
    );
}
