'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Header from './Header';
import BottomNav from './BottomNav';

interface LayoutProps {
    children: React.ReactNode;
    showHeader?: boolean;
    showNotifications?: boolean;
}

const Layout: React.FC<LayoutProps> = ({
    children,
    showHeader = true,
    showNotifications = false
}) => {
    const pathname = usePathname();

    // Hide BottomNav on auth pages and landing page
    const hideBottomNav = pathname === '/' || pathname === '/auth' || pathname?.startsWith('/auth');

    return (
        <div className="min-h-screen bg-gradient-to-br from-light-bg via-white to-light-bg dark:from-dark-bg dark:via-gray-900 dark:to-dark-bg">
            {showHeader && <Header showNotifications={showNotifications} />}
            <main className="container mx-auto px-4 py-8 pb-20 md:pb-8">
                {children}
            </main>
            {!hideBottomNav && <BottomNav />}
        </div>
    );
};

export default Layout;
