import React from 'react';
import Layout from '@/components/layout/Layout';
import AuthForm from '@/components/auth/AuthForm';

export default function AuthPage() {
    return (
        <Layout showHeader={false}>
            <div className="min-h-screen flex items-center justify-center py-12">
                <AuthForm />
            </div>
        </Layout>
    );
}
