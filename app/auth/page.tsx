import React, { Suspense } from 'react';
import Layout from '@/components/layout/Layout';
import AuthForm from '@/components/auth/AuthForm';

export default function AuthPage() {
    return (
        <Layout showHeader={false}>
            <div className="min-h-screen flex items-center justify-center py-12">
                <Suspense fallback={
                    <div className="w-full max-w-md mx-auto glass-card p-8 animate-scale-in">
                        <div className="text-center">
                            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
                            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
                        </div>
                    </div>
                }>
                    <AuthForm />
                </Suspense>
            </div>
        </Layout>
    );
}
