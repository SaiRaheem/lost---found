'use client';

import React from 'react';
import Layout from '@/components/layout/Layout';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import { useAuthProtection } from '@/hooks/useAuthProtection';

export default function HomePage() {
    const isLoading = useAuthProtection(); // Protect this route

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }
    return (
        <Layout showHeader showNotifications>
            <div className="max-w-4xl mx-auto py-12">
                {/* Welcome Section */}
                <div className="text-center mb-12 animate-slide-up">
                    <h1 className="text-5xl font-bold text-gradient mb-4">
                        Lost & Found
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-400">
                        Help reunite lost items with their owners
                    </p>
                </div>

                {/* Action Cards */}
                <div className="grid md:grid-cols-2 gap-6">
                    {/* I Found Something */}
                    <Link href="/report?role=finder" className="group">
                        <div className="glass-card p-8 h-full hover:shadow-glow transition-all duration-300 active:scale-95 cursor-pointer">
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg group-hover:shadow-glow-accent transition-all">
                                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    I Found Something
                                </h2>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Report an item you found and help return it to its owner
                                </p>
                                <Button variant="primary" className="w-full">
                                    Report Found Item
                                </Button>
                            </div>
                        </div>
                    </Link>

                    {/* I Lost Something */}
                    <Link href="/report?role=owner" className="group">
                        <div className="glass-card p-8 h-full hover:shadow-glow transition-all duration-300 active:scale-95 cursor-pointer">
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:shadow-glow-accent transition-all">
                                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    I Lost Something
                                </h2>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Report your lost item and get matched with potential finds
                                </p>
                                <Button variant="accent" className="w-full">
                                    Report Lost Item
                                </Button>
                            </div>
                        </div>
                    </Link>
                </div>
            </div>
        </Layout>
    );
}
