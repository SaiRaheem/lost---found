'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import Button from '@/components/ui/Button';
import { getCurrentUser } from '@/services/supabase/client';
import { getShopItems, purchaseShopItem, getUserRewardBalance } from '@/services/supabase/rewards.service';

interface ShopItem {
    id: string;
    name: string;
    description: string;
    points_cost: number;
    category: string;
    icon: string;
    duration_days: number | null;
    is_popular: boolean;
    stock: number;
}

export default function ShopPage() {
    const router = useRouter();
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [userBalance, setUserBalance] = useState(0);
    const [shopItems, setShopItems] = useState<ShopItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPurchasing, setIsPurchasing] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                const user = await getCurrentUser();
                if (!user) {
                    router.push('/auth');
                    return;
                }

                const [balance, items] = await Promise.all([
                    getUserRewardBalance(user.id),
                    getShopItems()
                ]);

                setUserBalance(balance);
                setShopItems(items || []);
            } catch (error) {
                console.error('Error loading shop items:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [router]);

    const categories = [
        { id: 'all', name: 'All', icon: '🛍️' },
        { id: 'boost', name: 'Boosts', icon: '🚀' },
        { id: 'badge', name: 'Badges', icon: '✓' },
        { id: 'premium', name: 'Premium', icon: '👑' },
        { id: 'customization', name: 'Customize', icon: '🎨' },
        { id: 'charity', name: 'Charity', icon: '❤️' }
    ];

    const filteredItems = selectedCategory === 'all'
        ? shopItems
        : shopItems.filter(item => item.category === selectedCategory);

    const handlePurchase = async (item: ShopItem) => {
        if (userBalance < item.points_cost) {
            alert(`❌ Insufficient points! You need ${item.points_cost - userBalance} more points.`);
            return;
        }

        if (!confirm(`Purchase ${item.name} for ${item.points_cost} points?`)) {
            return;
        }

        setIsPurchasing(true);
        try {
            const user = await getCurrentUser();
            if (!user) return;

            await purchaseShopItem(user.id, item.id);

            // Update balance
            setUserBalance(prev => prev - item.points_cost);

            alert(`🎉 Purchase successful!\n\n${item.name} has been added to your account.`);
        } catch (error: any) {
            alert(`❌ ${error.message || 'Failed to purchase item'}`);
        } finally {
            setIsPurchasing(false);
        }
    };

    if (isLoading) {
        return (
            <Layout>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-gray-600 dark:text-gray-400">Loading shop...</p>
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
                        🛍️ Rewards Shop
                    </h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Spend your points on amazing perks and features
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

                {/* Shop Items Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredItems.map(item => {
                        const canAfford = userBalance >= item.points_cost;

                        return (
                            <div
                                key={item.id}
                                className={`glass-card p-4 transition-all relative ${canAfford ? 'hover:shadow-lg hover:scale-105' : 'opacity-60'
                                    }`}
                            >
                                {item.is_popular && (
                                    <div className="absolute top-2 right-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs px-2 py-1 rounded-full">
                                        🔥 Popular
                                    </div>
                                )}

                                <div className="text-center mb-3">
                                    <div className="text-5xl mb-2">{item.icon}</div>
                                    <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                                        {item.name}
                                    </h3>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                        {item.description}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Cost</p>
                                        <p className="text-xl font-bold text-primary">
                                            {item.points_cost} pts
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {item.duration_days ? `${item.duration_days} days` : 'Permanent'}
                                        </p>
                                    </div>
                                </div>

                                <Button
                                    onClick={() => handlePurchase(item)}
                                    disabled={!canAfford || isPurchasing}
                                    className="w-full"
                                    variant={canAfford ? 'primary' : 'secondary'}
                                >
                                    {isPurchasing ? 'Processing...' : canAfford ? 'Purchase' : 'Insufficient Points'}
                                </Button>
                            </div>
                        );
                    })}
                </div>

                {filteredItems.length === 0 && (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">🛍️</div>
                        <p className="text-gray-600 dark:text-gray-400">
                            No items in this category
                        </p>
                    </div>
                )}
            </div>
        </Layout>
    );
}
