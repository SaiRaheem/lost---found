import { COLLEGE_EMAIL_DOMAIN } from './constants';

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate college email (must end with college domain)
 */
export function isValidCollegeEmail(email: string): boolean {
    return isValidEmail(email) && email.toLowerCase().endsWith(COLLEGE_EMAIL_DOMAIN);
}

/**
 * Validate phone number (10 digits)
 */
export function isValidPhone(phone: string): boolean {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
}

/**
 * Validate date is not in the future
 */
export function isNotFutureDate(date: Date | string): boolean {
    const inputDate = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    return inputDate <= now;
}

/**
 * Validate required field
 */
export function isRequired(value: any): boolean {
    if (typeof value === 'string') {
        return value.trim().length > 0;
    }
    return value !== null && value !== undefined;
}

/**
 * Validate minimum length
 */
export function minLength(value: string, min: number): boolean {
    return value.trim().length >= min;
}

/**
 * Validate maximum length
 */
export function maxLength(value: string, max: number): boolean {
    return value.trim().length <= max;
}

/**
 * Validate password strength
 * - Minimum 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 */
export function isValidPassword(password: string): boolean {
    if (password.length < 8) return false;
    if (!/[A-Z]/.test(password)) return false;
    if (!/[a-z]/.test(password)) return false;
    if (!/[0-9]/.test(password)) return false;
    return true;
}

/**
 * Check if passwords match
 */
export function passwordsMatch(password: string, confirmPassword: string): boolean {
    return password === confirmPassword;
}

/**
 * Get password strength message
 */
export function getPasswordStrengthMessage(password: string): string {
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(password)) return 'Password must contain at least 1 uppercase letter';
    if (!/[a-z]/.test(password)) return 'Password must contain at least 1 lowercase letter';
    if (!/[0-9]/.test(password)) return 'Password must contain at least 1 number';
    return '';
}
