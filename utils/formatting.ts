/**
 * Convert text to proper case (capitalize first letter of each word)
 * Example: "baji kumar" -> "Baji Kumar"
 */
export function toProperCase(text: string): string {
    return text
        .trim()
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

/**
 * Trim extra spaces (multiple spaces to single space)
 */
export function trimExtraSpaces(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
}

/**
 * Format phone number for display
 * Example: "1234567890" -> "(123) 456-7890"
 */
export function formatPhoneDisplay(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
}

/**
 * Format phone number for storage (remove formatting)
 */
export function formatPhoneStorage(phone: string): string {
    return phone.replace(/\D/g, '');
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - 3) + '...';
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Generate initials from name
 */
export function getInitials(name: string): string {
    return name
        .split(' ')
        .map(word => word.charAt(0).toUpperCase())
        .slice(0, 2)
        .join('');
}

/**
 * Sanitize text for search
 */
export function sanitizeForSearch(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s]/g, '');
}
