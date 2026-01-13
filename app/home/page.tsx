'use client';

import React, { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { SkeletonCard } from '@/components/ui/Skeleton';
import Link from 'next/link';
import { useAuthProtection } from '@/hooks/useAuthProtection';
import { Search, AlertCircle, Package, TrendingUp, ArrowRight, Gift, Trophy } from 'lucide-react';
import { getUserRewardBalance } from '@/services/supabase/rewards.service';
import { supabase } from '@/services/supabase/client';
import InstallPrompt from '@/components/pwa/InstallPrompt';

export default function HomePage() {
    const isLoading = useAuthProtection();
    const [stats, setStats] = useState({ balance: 0, loading: true });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const balance = await getUserRewardBalance(user.id);
                setStats({ balance, loading: false });
            } catch (error) {
                console.error('Error fetching stats:', error);
                setStats({ balance: 0, loading: false });
            }
        };
        fetchStats();
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <Layout showHeader showNotifications>
            <div className="max-w-6xl mx-auto py-8 px-4 pb-24 md:pb-8">
                {/* Welcome Section */}
                <div className="mb-8 animate-fade-in">
                    <h1 className="text-4xl md:text-5xl font-bold text-gradient-rainbow mb-2">
                        Lost & Found
                    </h1>
                    <p className="text-lg text-muted-foreground">
                        Help reunite lost items with their owners 🎯
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    {/* Rewards Balance */}
                    {stats.loading ? (
                        <SkeletonCard />
                    ) : (
                        <Card variant="glass" className="animate-slide-up">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">
                                        Reward Points
                                    </CardTitle>
                                    <Gift className="h-4 w-4 text-amber-500" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-gradient-primary">
                                    {stats.balance}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Earn more by helping others
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Quick Stat 2 */}
                    <Card variant="glass" className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    Community Impact
                                </CardTitle>
                                <TrendingUp className="h-4 w-4 text-emerald-500" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                                Active
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Helping reunite items daily
                            </p>
                        </CardContent>
                    </Card>

                    {/* Quick Stat 3 */}
                    <Card variant="glass" className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    Leaderboard
                                </CardTitle>
                                <Trophy className="h-4 w-4 text-violet-500" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Link href="/rewards/leaderboard" className="text-3xl font-bold text-gradient-secondary hover:opacity-80 transition-opacity">
                                View Rank
                            </Link>
                            <p className="text-xs text-muted-foreground mt-1">
                                See top contributors
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Action Cards */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                    {/* I Found Something */}
                    <Link href="/report?role=finder" className="group">
                        <Card variant="premium" hover className="h-full">
                            <CardContent className="p-8">
                                <div className="flex flex-col items-center text-center space-y-4">
                                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg group-hover:shadow-glow-secondary transition-all group-hover:scale-110">
                                        <Search className="w-10 h-10 text-white" />
                                    </div>
                                    <h2 className="text-2xl font-bold">
                                        I Found Something
                                    </h2>
                                    <p className="text-muted-foreground">
                                        Report an item you found and help return it to its owner
                                    </p>
                                    <Button variant="primary" className="w-full" rightIcon={<ArrowRight />}>
                                        Report Found Item
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    {/* I Lost Something */}
                    <Link href="/report?role=owner" className="group">
                        <Card variant="premium" hover className="h-full">
                            <CardContent className="p-8">
                                <div className="flex flex-col items-center text-center space-y-4">
                                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:shadow-glow-accent transition-all group-hover:scale-110">
                                        <AlertCircle className="w-10 h-10 text-white" />
                                    </div>
                                    <h2 className="text-2xl font-bold">
                                        I Lost Something
                                    </h2>
                                    <p className="text-muted-foreground">
                                        Report your lost item and get matched with potential finds
                                    </p>
                                    <Button variant="secondary" className="w-full" rightIcon={<ArrowRight />}>
                                        Report Lost Item
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                </div>

                {/* Quick Links */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Link href="/my-reports">
                        <Card variant="outline" hover className="text-center p-4 cursor-pointer">
                            <Package className="h-8 w-8 mx-auto mb-2 text-primary" />
                            <p className="font-medium text-sm">My Reports</p>
                        </Card>
                    </Link>
                    <Link href="/rewards">
                        <Card variant="outline" hover className="text-center p-4 cursor-pointer">
                            <Gift className="h-8 w-8 mx-auto mb-2 text-amber-500" />
                            <p className="font-medium text-sm">Rewards</p>
                        </Card>
                    </Link>
                    <Link href="/rewards/shop">
                        <Card variant="outline" hover className="text-center p-4 cursor-pointer">
                            <Package className="h-8 w-8 mx-auto mb-2 text-violet-500" />
                            <p className="font-medium text-sm">Shop</p>
                        </Card>
                    </Link>
                    <Link href="/rewards/leaderboard">
                        <Card variant="outline" hover className="text-center p-4 cursor-pointer">
                            <Trophy className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
                            <p className="font-medium text-sm">Leaderboard</p>
                        </Card>
                    </Link>
                </div>
            </div>

            {/* PWA Install Prompt */}
            <InstallPrompt />
        </Layout>
    );
}
