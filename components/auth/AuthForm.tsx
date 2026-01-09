'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { isValidEmail, isValidPhone, isValidPassword, passwordsMatch, getPasswordStrengthMessage } from '@/utils/validation';
import { signUpWithEmail, signInWithEmail } from '@/services/supabase/auth.service';

type AuthMode = 'signin' | 'signup';

const AuthForm: React.FC = () => {
    const router = useRouter();
    const [mode, setMode] = useState<AuthMode>('signin');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Sign In fields
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Sign Up fields
    const [signupName, setSignupName] = useState('');
    const [signupGender, setSignupGender] = useState('');
    const [signupPhone, setSignupPhone] = useState('');
    const [signupEmail, setSignupEmail] = useState('');
    const [signupPassword, setSignupPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!isValidEmail(email)) {
            setError('Please enter a valid email address');
            return;
        }

        if (!password) {
            setError('Please enter your password');
            return;
        }

        setIsLoading(true);
        try {
            console.log('Attempting sign in...');
            const result = await signInWithEmail(email, password);
            console.log('Sign in successful:', result);

            // Small delay to ensure cookies are set
            await new Promise(resolve => setTimeout(resolve, 500));

            console.log('Redirecting to home...');
            window.location.href = '/home';
        } catch (err: any) {
            console.error('Sign in error:', err);
            setError(err.message || 'Invalid email or password');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!signupName.trim()) {
            setError('Please enter your name');
            return;
        }

        if (!signupGender) {
            setError('Please select your gender');
            return;
        }

        if (!signupPhone.trim()) {
            setError('Please enter your phone number');
            return;
        }

        if (!isValidEmail(signupEmail)) {
            setError('Please enter a valid email address');
            return;
        }

        if (signupPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        if (signupPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setIsLoading(true);
        try {
            const result = await signUpWithEmail(signupEmail, signupPassword, {
                name: signupName,
                gender: signupGender as 'male' | 'female' | 'other',
                phone: signupPhone,
            });

            if (result.user && !result.session) {
                // Email confirmation required
                alert('Please check your email to verify your account. Click the verification link to complete registration.');
                // Clear form
                setSignupName('');
                setSignupGender('');
                setSignupPhone('');
                setSignupEmail('');
                setSignupPassword('');
                setConfirmPassword('');
            } else if (result.session) {
                // Immediately logged in
                alert('✅ Sign up successful! You can now use the app.');
                window.location.href = '/home';
            }

            // Clear form
            setSignupName('');
            setSignupGender('');
            setSignupPhone('');
            setSignupEmail('');
            setSignupPassword('');
            setConfirmPassword('');
            setMode('signin');
        } catch (err: any) {
            console.error('Sign up error:', err);
            if (err.message && (err.message.includes('already registered') || err.message.includes('User already registered'))) {
                setError('⚠️ This email is already registered.\n\n👉 Please use the "Sign In" tab to log in with your password.');
            } else if (err.message && err.message.includes('email')) {
                setError('Invalid email address. Please check and try again.');
            } else if (err.message && err.message.includes('Failed to create profile')) {
                setError('Account created but profile setup failed. Please contact support.');
            } else {
                setError(err.message || 'Failed to sign up. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto glass-card p-8 animate-scale-in">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gradient mb-2">
                    {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                    {mode === 'signin'
                        ? 'Sign in to continue to Lost & Found'
                        : 'Join our Lost & Found community'}
                </p>
            </div>

            {/* Mode Toggle */}
            <div className="flex gap-2 p-1 glass-card mb-6">
                <button
                    type="button"
                    onClick={() => {
                        setMode('signin');
                        setError('');
                    }}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${mode === 'signin'
                        ? 'bg-primary text-white shadow-glow'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-700/50'
                        }`}
                >
                    Sign In
                </button>
                <button
                    type="button"
                    onClick={() => {
                        setMode('signup');
                        setError('');
                    }}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${mode === 'signup'
                        ? 'bg-primary text-white shadow-glow'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-700/50'
                        }`}
                >
                    Sign Up
                </button>
            </div>

            {/* Sign In Form */}
            {mode === 'signin' && (
                <form onSubmit={handleSignIn} className="space-y-5">
                    <Input
                        label="Email Address"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        error={error && error.includes('email') ? error : ''}
                    />

                    <div>
                        <Input
                            label="Password"
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            error={error && error.includes('password') ? error : ''}
                        />
                        <div className="text-right mt-1">
                            <a
                                href="/forgot-password"
                                className="text-sm text-primary hover:underline"
                            >
                                Forgot password?
                            </a>
                        </div>
                    </div>

                    <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
                        Sign In
                    </Button>
                </form>
            )}

            {/* Sign Up Form */}
            {mode === 'signup' && (
                <form onSubmit={handleSignUp} className="space-y-5">
                    <Input
                        label="Full Name"
                        required
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        placeholder="John Doe"
                    />

                    <Select
                        label="Gender"
                        required
                        value={signupGender}
                        onChange={(e) => setSignupGender(e.target.value)}
                        options={[
                            { value: 'male', label: 'Male' },
                            { value: 'female', label: 'Female' },
                            { value: 'other', label: 'Other' },
                        ]}
                    />

                    <Input
                        label="Phone Number"
                        type="tel"
                        required
                        value={signupPhone}
                        onChange={(e) => setSignupPhone(e.target.value)}
                        placeholder="1234567890"
                        helperText="10-digit phone number"
                    />

                    <Input
                        label="Email Address"
                        type="email"
                        required
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        placeholder="your@email.com"
                    />

                    <Input
                        label="Password"
                        type="password"
                        required
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        placeholder="Create a strong password"
                        helperText="Min 8 chars, 1 uppercase, 1 lowercase, 1 number"
                    />

                    <Input
                        label="Confirm Password"
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter your password"
                    />

                    {error && (
                        <div className="text-sm text-red-500 flex items-start gap-2">
                            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                    fillRule="evenodd"
                                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}

                    <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
                        Sign Up
                    </Button>
                </form>
            )}
        </div>
    );
};

export default AuthForm;
