'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { signOut } from '@/services/supabase/auth.service';
import { getUnreadNotifications, subscribeToNotifications, markAsRead, type Notification } from '@/services/supabase/notifications.service';
import { getCurrentUser, supabase } from '@/services/supabase/client';
import NotificationDropdown from '@/components/notifications/NotificationDropdown';

interface HeaderProps {
    showNotifications?: boolean;
    showLogo?: boolean;
}

const Header: React.FC<HeaderProps> = ({ showNotifications = false, showLogo = true }) => {
    const router = useRouter();
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);

    // Fetch unread notification count
    useEffect(() => {
        if (!showNotifications) return;

        const fetchUnreadCount = async () => {
            const notifs = await getUnreadNotifications();
            setNotifications(notifs);
            setUnreadCount(notifs.length);
        };

        fetchUnreadCount();

        // Subscribe to real-time updates
        const setupSubscription = async () => {
            const user = await getCurrentUser();
            if (!user) return;

            const channel = subscribeToNotifications(user.id, () => {
                // Refresh count when new notification arrives
                fetchUnreadCount();
            });

            // Also listen for updates (when notifications are marked as read)
            const updateChannel = supabase
                .channel(`notifications-updates:${user.id}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'user_notifications',
                        filter: `user_id=eq.${user.id}`,
                    },
                    () => {
                        // Refresh count when notifications are marked as read
                        fetchUnreadCount();
                    }
                )
                .subscribe();

            return () => {
                channel.unsubscribe();
                updateChannel.unsubscribe();
            };
        };

        setupSubscription();
    }, [showNotifications]);

    const handleNotificationClick = async (notification: Notification) => {
        // Mark as read
        await markAsRead(notification.id);

        // Navigate to item detail
        router.push(`/report-detail/${notification.item_type}/${notification.item_id}`);

        // Close dropdown
        setShowDropdown(false);
    };

    return (
        <header className="sticky top-0 z-40 w-full glass-card border-b border-gray-200/20 dark:border-gray-700/20">
            <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    {showLogo && (
                        <Link href="/home" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <span className="text-xl font-bold text-gradient hidden sm:block">
                                Lost & Found
                            </span>
                        </Link>
                    )}

                    {/* Center - Navigation */}
                    <nav className="hidden md:flex items-center gap-1">
                        <Link href="/home">
                            <button className="px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-medium">
                                Home
                            </button>
                        </Link>
                        <Link href="/my-reports">
                            <button className="px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-medium">
                                My Reports
                            </button>
                        </Link>
                        <Link href="/settings">
                            <button className="px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-medium">
                                Settings
                            </button>
                        </Link>
                        <Link href="/rewards">
                            <button className="px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-medium">
                                Rewards
                            </button>
                        </Link>
                    </nav>

                    {/* Right Side */}
                    <div className="flex items-center gap-3">
                        {/* Theme Toggle */}
                        <ThemeToggle />

                        {/* Notification Bell */}
                        {showNotifications && (
                            <div className="relative">
                                <button
                                    onClick={() => setShowDropdown(!showDropdown)}
                                    className="p-3 rounded-xl glass-card hover:shadow-glow transition-all duration-200 active:scale-95 relative"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                    </svg>
                                    {/* Unread count badge */}
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                    )}
                                </button>

                                {/* Dropdown */}
                                {showDropdown && (
                                    <NotificationDropdown
                                        notifications={notifications}
                                        onClose={() => setShowDropdown(false)}
                                        onNotificationClick={handleNotificationClick}
                                    />
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
