'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import Button from '@/components/ui/Button';
import { getCurrentUser } from '@/services/supabase/client';
import { getUserProfile } from '@/services/supabase/auth.service';
import { signOut } from '@/services/supabase/auth.service';

interface UserProfile {
    id: string;
    name: string;
    email: string;
    gender?: string;
    phone?: string;
    community_type?: string;
    college?: string;
    created_at: string;
}

export default function ProfilePage() {
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const user = await getCurrentUser();
                if (!user) {
                    router.push('/auth');
                    return;
                }

                const userProfile = await getUserProfile(user.id);
                if (userProfile) {
                    setProfile({
                        id: userProfile.id,
                        name: userProfile.name,
                        email: userProfile.email,
                        gender: userProfile.gender,
                        phone: userProfile.phone,
                        community_type: userProfile.community_type,
                        college: userProfile.college,
                        created_at: userProfile.created_at,
                    });
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, [router]);

    const handleSignOut = async () => {
        if (confirm('Are you sure you want to sign out?')) {
            try {
                await signOut();
                router.push('/auth');
            } catch (error) {
                console.error('Error signing out:', error);
                alert('Failed to sign out');
            }
        }
    };

    if (isLoading) {
        return (
            <Layout showHeader showNotifications>
                <div className="max-w-4xl mx-auto py-8">
                    <div className="glass-card p-12 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    if (!profile) {
        return (
            <Layout showHeader showNotifications>
                <div className="max-w-4xl mx-auto py-8">
                    <div className="glass-card p-12 text-center">
                        <p className="text-gray-600 dark:text-gray-400">Profile not found</p>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout showHeader showNotifications>
            <div className="max-w-4xl mx-auto py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gradient mb-2">My Profile</h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Manage your account information
                    </p>
                </div>

                {/* Profile Card */}
                <div className="glass-card p-8 mb-6 animate-slide-up">
                    {/* Avatar */}
                    <div className="flex items-center gap-6 mb-8 pb-8 border-b border-gray-200/20 dark:border-gray-700/20">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-3xl font-bold">
                            {profile.name?.charAt(0).toUpperCase() || profile.email?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                                {profile.name || 'User'}
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400">
                                Member since {new Date(profile.created_at).toLocaleDateString()}
                            </p>
                        </div>
                    </div>

                    {/* Profile Details */}
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                                Full Name
                            </label>
                            <div className="glass-card p-4">
                                <p className="text-gray-900 dark:text-white">{profile.name || 'Not provided'}</p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                                Gender
                            </label>
                            <div className="glass-card p-4">
                                <p className="text-gray-900 dark:text-white capitalize">{profile.gender || 'Not provided'}</p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                                Contact Number
                            </label>
                            <div className="glass-card p-4">
                                <p className="text-gray-900 dark:text-white">{profile.phone || 'Not provided'}</p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                                Email Address
                            </label>
                            <div className="glass-card p-4">
                                <p className="text-gray-900 dark:text-white">{profile.email}</p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                                User ID
                            </label>
                            <div className="glass-card p-4">
                                <p className="text-gray-900 dark:text-white font-mono text-sm">{profile.id}</p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                                Member Since
                            </label>
                            <div className="glass-card p-4">
                                <p className="text-gray-900 dark:text-white">
                                    {new Date(profile.created_at).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4">
                    <Button variant="secondary" onClick={() => router.push('/home')}>
                        Back to Home
                    </Button>
                    <Button variant="danger" onClick={handleSignOut}>
                        Sign Out
                    </Button>
                </div>
            </div>
        </Layout>
    );
}
