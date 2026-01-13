import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import 'leaflet/dist/leaflet.css';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Toaster } from '@/components/ui/use-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'Lost & Found - Find Your Lost Items',
    description: 'AI-powered lost and found system for communities and public spaces',
    manifest: '/manifest.json',
    themeColor: '#2ECC71',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: 'Lost & Found'
    },
    icons: {
        icon: '/icons/icon-192x192.png',
        apple: '/icons/apple-touch-icon.png'
    },
    viewport: {
        width: 'device-width',
        initialScale: 1,
        maximumScale: 5,
        userScalable: true
    }
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={inter.className}>
                <ThemeProvider>
                    <div className="gradient-mesh min-h-screen">
                        {children}
                    </div>
                    <Toaster />
                </ThemeProvider>
            </body>
        </html>
    );
}
