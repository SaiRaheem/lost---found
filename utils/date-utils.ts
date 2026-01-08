import { format, formatDistanceToNow, parseISO, differenceInDays, differenceInHours } from 'date-fns';
import { DATE_FORMAT, DATETIME_FORMAT, DISPLAY_DATE_FORMAT, DISPLAY_DATETIME_FORMAT } from './constants';

/**
 * Format datetime for database storage (ISO 8601)
 * Converts datetime-local input (which is in local timezone) to UTC
 */
export function formatForDatabase(datetime: string): string {
    if (!datetime) return '';

    // datetime-local gives us "2026-01-07T14:30" WITHOUT timezone info
    // new Date() will interpret this as LOCAL time (IST in your case)
    // Then toISOString() converts it to UTC
    // Example: "2026-01-07T09:46" (IST) -> "2026-01-07T04:16:00.000Z" (UTC)
    const date = new Date(datetime);

    return date.toISOString();
}

/**
 * Format date for display
 */
export function formatForDisplay(date: string | Date, includeTime = false): string {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, includeTime ? DISPLAY_DATETIME_FORMAT : DISPLAY_DATE_FORMAT);
}

/**
 * Get relative time (e.g., "2 hours ago")
 */
export function getRelativeTime(date: string | Date): string {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return formatDistanceToNow(dateObj, { addSuffix: true });
}

/**
 * Calculate date proximity score (0-10 points)
 * Closer dates get higher scores
 */
export function calculateDateProximity(date1: string | Date, date2: string | Date): number {
    const d1 = typeof date1 === 'string' ? parseISO(date1) : date1;
    const d2 = typeof date2 === 'string' ? parseISO(date2) : date2;

    const daysDiff = Math.abs(differenceInDays(d1, d2));

    // Scoring logic:
    // Same day: 10 points
    // 1 day: 9 points
    // 2 days: 8 points
    // 3 days: 7 points
    // 4-7 days: 5 points
    // 8-14 days: 3 points
    // 15-30 days: 1 point
    // > 30 days: 0 points

    if (daysDiff === 0) return 10;
    if (daysDiff === 1) return 9;
    if (daysDiff === 2) return 8;
    if (daysDiff === 3) return 7;
    if (daysDiff <= 7) return 5;
    if (daysDiff <= 14) return 3;
    if (daysDiff <= 30) return 1;
    return 0;
}

/**
 * Check if date is in the future
 */
export function isFutureDate(date: Date | string): boolean {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return dateObj > new Date();
}

/**
 * Get current datetime in database format
 */
export function getCurrentDateTime(): string {
    return new Date().toISOString();
}

/**
 * Parse datetime string to Date object
 */
export function parseDateTime(dateStr: string): Date {
    return parseISO(dateStr);
}

/**
 * Get max datetime for input (current datetime)
 */
export function getMaxDateTime(): string {
    return format(new Date(), DATETIME_FORMAT);
}
