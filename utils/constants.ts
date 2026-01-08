// Item Categories
export const ITEM_CATEGORIES = [
    'Electronics',
    'Documents',
    'Accessories',
    'Clothing',
    'Bags',
    'Keys',
    'Wallet',
    'Books',
    'Jewelry',
    'Sports Equipment',
    'Other',
] as const;

// Community Types
export const COMMUNITY_TYPES = {
    COLLEGE: 'college',
    COMMON: 'common',
} as const;

// Colleges
export const COLLEGES = [
    'RVR & JC College',
    'Other',
] as const;

// Branches (for RVR & JC College)
export const BRANCHES = [
    'CSE',
    'ECE',
    'EEE',
    'MECH',
    'CIVIL',
    'IT',
    'AI & ML',
    'Data Science',
] as const;

// Years
export const YEARS = ['1', '2', '3', '4'] as const;

// Genders
export const GENDERS = ['male', 'female', 'other'] as const;

// Item Status
export const ITEM_STATUS = {
    PENDING: 'pending',
    ACTIVE: 'active',
    MATCHED: 'matched',
    RETURNED: 'returned',
} as const;

// Match Status
export const MATCH_STATUS = {
    PENDING: 'pending',
    ACTIVE: 'active',
    SUCCESS: 'success',
    CLOSED: 'closed',
} as const;

// Notification Types
export const NOTIFICATION_TYPES = {
    MATCH_FOUND: 'match_found',
    MATCH_ACCEPTED: 'match_accepted',
    CHAT_OPENED: 'chat_opened',
    NEW_MESSAGE: 'new_message',
    ITEM_RETURNED: 'item_returned',
    WELCOME: 'welcome',
} as const;

// Colors
export const COLORS = {
    PRIMARY: '#2ECC71',
    PRIMARY_HOVER: '#27AE60',
    ACCENT: '#F1C40F',
    ACCENT_HOVER: '#F39C12',
} as const;

// Matching Thresholds
export const MATCHING = {
    MIN_SCORE: 50, // Lowered to allow more matches (was 65)
    MIN_NAME_SIMILARITY: 3, // Lowered for more flexible name matching (was 4)
    WEIGHTS: {
        CATEGORY: 25, // Increased - category match is critical
        LOCATION: 20,
        TFIDF: 25,
        FUZZY: 15, // Increased - name similarity is important
        ATTRIBUTES: 10, // Reduced
        DATE: 5, // Reduced - less critical
    },
} as const;

// College Email Domain
export const COLLEGE_EMAIL_DOMAIN = '@rvrjc.ac.in';

// Date/Time Formats
export const DATE_FORMAT = 'yyyy-MM-dd';
export const DATETIME_FORMAT = "yyyy-MM-dd'T'HH:mm";
export const DISPLAY_DATE_FORMAT = 'MMM dd, yyyy';
export const DISPLAY_DATETIME_FORMAT = 'MMM dd, yyyy hh:mm a';
