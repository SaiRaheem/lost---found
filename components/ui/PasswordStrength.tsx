import React from 'react';
import { validatePassword } from '@/services/supabase/auth.service';

interface PasswordStrengthProps {
    password: string;
}

const PasswordStrength: React.FC<PasswordStrengthProps> = ({ password }) => {
    if (!password) return null;

    const { strength, errors } = validatePassword(password);

    const getStrengthColor = () => {
        switch (strength) {
            case 'strong':
                return 'bg-green-500';
            case 'medium':
                return 'bg-yellow-500';
            default:
                return 'bg-red-500';
        }
    };

    const getStrengthWidth = () => {
        switch (strength) {
            case 'strong':
                return 'w-full';
            case 'medium':
                return 'w-2/3';
            default:
                return 'w-1/3';
        }
    };

    return (
        <div className="space-y-2">
            {/* Strength Bar */}
            <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all duration-300 ${getStrengthColor()} ${getStrengthWidth()}`}
                    />
                </div>
                <span className={`text-sm font-medium capitalize ${strength === 'strong' ? 'text-green-600 dark:text-green-400' :
                        strength === 'medium' ? 'text-yellow-600 dark:text-yellow-400' :
                            'text-red-600 dark:text-red-400'
                    }`}>
                    {strength}
                </span>
            </div>

            {/* Requirements */}
            {errors.length > 0 && (
                <div className="text-xs space-y-1">
                    <p className="text-gray-600 dark:text-gray-400">Password must have:</p>
                    <ul className="space-y-0.5">
                        {errors.map((error, index) => (
                            <li key={index} className="flex items-center gap-1 text-red-600 dark:text-red-400">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                {error}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default PasswordStrength;
