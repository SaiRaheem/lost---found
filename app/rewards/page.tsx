'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import Button from '@/components/ui/Button';
import { useAuthProtection } from '@/hooks/useAuthProtection';

export default function RewardsPage() {
    useAuthProtection(); // Protect this route
    const router = useRouter();

    return (
        <Layout showHeader showNotifications>
            <div className="max-w-4xl mx-auto py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gradient mb-2">Rewards</h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Earn rewards for helping others find their lost items
                    </p>
                </div>

                {/* Coming Soon Card */}
                <div className="glass-card p-12 text-center animate-slide-up">
                    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                        </svg>
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        Coming Soon!
                    </h2>

                    <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                        We're working on an exciting rewards system to recognize and thank our most helpful community members.
                    </p>

                    <div className="glass-card p-6 max-w-md mx-auto mb-8">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                            What to Expect:
                        </h3>
                        <ul className="text-left space-y-2 text-gray-600 dark:text-gray-400">
                            <li className="flex items-start gap-2">
                                <span className="text-primary mt-1">✓</span>
                                <span>Points for reporting found items</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary mt-1">✓</span>
                                <span>Badges for successful returns</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary mt-1">✓</span>
                                <span>Leaderboard rankings</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary mt-1">✓</span>
                                <span>Special perks and recognition</span>
                            </li>
                        </ul>
                    </div>

                    <Button onClick={() => router.push('/home')}>
                        Back to Home
                    </Button>
                </div>
            </div>
        </Layout>
    );
}
