'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Layout from '@/components/layout/Layout';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import PasswordStrength from '@/components/ui/PasswordStrength';
import { updatePassword, validatePassword } from '@/services/supabase/auth.service';
import { supabase } from '@/services/supabase/client';

export default function ResetPasswordPage() {
    const router = useRouter();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [hasSession, setHasSession] = useState(false);

    useEffect(() => {
        // Check if user has a valid session (from reset link)
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setError('Invalid or expired reset link. Please request a new one.');
            } else {
                setHasSession(true);
            }
        };
        checkSession();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validate passwords match
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        // Validate password strength
        const validation = validatePassword(newPassword);
        if (!validation.isValid) {
            setError('Please meet all password requirements');
            return;
        }

        setIsLoading(true);

        try {
            await updatePassword(newPassword);
            setSuccess(true);

            // Redirect to login after 2 seconds
            setTimeout(() => {
                router.push('/auth');
            }, 2000);
        } catch (err: any) {
            setError(err.message || 'Failed to reset password');
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <Layout showHeader={false} showNotifications={false}>
                <div className="min-h-screen flex items-center justify-center p-4">
                    <div className="glass-card p-8 max-w-md w-full text-center space-y-4">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Password Reset Successful!
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400">
                            Your password has been updated. Redirecting to login...
                        </p>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout showHeader={false} showNotifications={false}>
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="glass-card p-8 max-w-md w-full">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gradient mb-2">
                            Reset Password
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Enter your new password
                        </p>
                    </div>

                    {!hasSession ? (
                        <div className="space-y-4">
                            <div className="p-4 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                                <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
                            </div>
                            <Link href="/forgot-password">
                                <Button variant="primary" className="w-full">
                                    Request New Reset Link
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="p-4 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                                    <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
                                </div>
                            )}

                            <div>
                                <Input
                                    label="New Password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new password"
                                    required
                                    autoFocus
                                />
                                <div className="mt-2">
                                    <PasswordStrength password={newPassword} />
                                </div>
                            </div>

                            <Input
                                label="Confirm New Password"
                                type={showPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm new password"
                                required
                            />

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="showPassword"
                                    checked={showPassword}
                                    onChange={(e) => setShowPassword(e.target.checked)}
                                    className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary dark:focus:ring-primary dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                />
                                <label htmlFor="showPassword" className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                                    Show password
                                </label>
                            </div>

                            <Button
                                type="submit"
                                variant="primary"
                                className="w-full"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Resetting...' : 'Reset Password'}
                            </Button>
                        </form>
                    )}
                </div>
            </div>
        </Layout>
    );
}
