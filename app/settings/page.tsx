'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import PasswordStrength from '@/components/ui/PasswordStrength';
import { changePassword, validatePassword } from '@/services/supabase/auth.service';
import { supabase } from '@/services/supabase/client';

export default function SettingsPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Password change form
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPasswords, setShowPasswords] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/auth');
                return;
            }
            setUser(user);
            setIsLoading(false);
        };
        checkUser();
    }, [router]);

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validate passwords match
        if (newPassword !== confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        // Validate password strength
        const validation = validatePassword(newPassword);
        if (!validation.isValid) {
            setError('Please meet all password requirements');
            return;
        }

        // Check if new password is different from current
        if (currentPassword === newPassword) {
            setError('New password must be different from current password');
            return;
        }

        setIsChangingPassword(true);

        try {
            await changePassword(currentPassword, newPassword);
            setSuccess('Password changed successfully!');

            // Clear form
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');

            // Auto-hide success message after 5 seconds
            setTimeout(() => setSuccess(''), 5000);
        } catch (err: any) {
            setError(err.message || 'Failed to change password');
        } finally {
            setIsChangingPassword(false);
        }
    };

    if (isLoading) {
        return (
            <Layout showHeader showNotifications>
                <div className="max-w-4xl mx-auto py-8 px-4">
                    <div className="glass-card p-12 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout showHeader showNotifications>
            <div className="max-w-4xl mx-auto py-4 sm:py-8 px-4 space-y-4 sm:space-y-6 pb-20 md:pb-8">
                {/* Header */}
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gradient mb-2">Settings</h1>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                        Manage your account settings and preferences
                    </p>
                </div>

                {/* Account Information */}
                <div className="glass-card p-4 sm:p-6">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4">
                        Account Information
                    </h2>
                    <div className="space-y-3">
                        <div>
                            <label className="text-sm text-gray-600 dark:text-gray-400">Email</label>
                            <p className="text-gray-900 dark:text-white font-medium break-all">{user?.email}</p>
                        </div>
                        <div>
                            <label className="text-sm text-gray-600 dark:text-gray-400">User ID</label>
                            <p className="text-gray-900 dark:text-white font-mono text-xs sm:text-sm break-all">{user?.id}</p>
                        </div>
                    </div>
                </div>

                {/* Change Password */}
                <div className="glass-card p-4 sm:p-6">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4">
                        Change Password
                    </h2>

                    <form onSubmit={handleChangePassword} className="space-y-6">
                        {error && (
                            <div className="p-4 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                                <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
                            </div>
                        )}

                        {success && (
                            <div className="p-4 bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
                                <p className="text-sm text-green-800 dark:text-green-300">{success}</p>
                            </div>
                        )}

                        <Input
                            label="Current Password"
                            type={showPasswords ? 'text' : 'password'}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Enter current password"
                            required
                        />

                        <div>
                            <Input
                                label="New Password"
                                type={showPasswords ? 'text' : 'password'}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Enter new password"
                                required
                            />
                            <div className="mt-2">
                                <PasswordStrength password={newPassword} />
                            </div>
                        </div>

                        <Input
                            label="Confirm New Password"
                            type={showPasswords ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm new password"
                            required
                        />

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="showPasswords"
                                checked={showPasswords}
                                onChange={(e) => setShowPasswords(e.target.checked)}
                                className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary dark:focus:ring-primary dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                            />
                            <label htmlFor="showPasswords" className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                                Show passwords
                            </label>
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            className="w-full"
                            disabled={isChangingPassword}
                        >
                            {isChangingPassword ? 'Changing Password...' : 'Change Password'}
                        </Button>
                    </form>
                </div>

                {/* Danger Zone */}
                <div className="glass-card p-6 border-2 border-red-200 dark:border-red-800">
                    <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-4">
                        Danger Zone
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Need to reset your password? Use the forgot password feature on the login page.
                    </p>
                    <a href="/forgot-password">
                        <Button variant="secondary" className="w-full sm:w-auto">
                            Reset Password via Email
                        </Button>
                    </a>
                </div>
            </div>
        </Layout>
    );
}
