// Item Categories - Expanded for better matching
export const ITEM_CATEGORIES = [
    // Electronics
    'Phone',
    'Laptop',
    'Tablet',
    'Headphones/Earphones',
    'Charger/Cable',
    'Power Bank',
    'Smartwatch',
    'Calculator',
    'USB Drive/Hard Drive',

    // Stationery
    'Pen',
    'Pencil',
    'Notebook',
    'Textbook',
    'File/Folder',
    'Eraser',
    'Ruler/Geometry Box',
    'Marker/Highlighter',

    // Personal Items
    'Wallet/Purse',
    'Keys',
    'ID Card',
    'Glasses/Sunglasses',
    'Watch',
    'Jewelry',
    'Umbrella',

    // Bags
    'Backpack',
    'Handbag',
    'Lunch Box/Tiffin',
    'Water Bottle',

    // Clothing
    'Jacket/Sweater',
    'Scarf',
    'Cap/Hat',
    'Shoes',

    // Sports Equipment
    'Sports Equipment',
    'Gym Bag',

    // Other
    'Documents',
    'Money',
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
    MIN_SCORE: 65, // Increased threshold - more strict matching
    MIN_NAME_SIMILARITY: 4, // Stricter name matching
    WEIGHTS: {
        LOCATION: 25, // Location is very important (unchanged)
        TFIDF: 25, // Description similarity (reduced from 28)
        FUZZY: 15, // Item name similarity (reduced from 18)
        IMAGE: 15, // NEW - Visual similarity from AI
        CATEGORY: 10, // Reduced from 12
        PURPOSE: 8, // Reduced from 10
        ATTRIBUTES: 4, // Reduced from 5
        DATE: 2, // Minimal - many items reported same day (unchanged)
    },
} as const;

// College Email Domain
export const COLLEGE_EMAIL_DOMAIN = '@rvrjc.ac.in';

// Date/Time Formats
export const DATE_FORMAT = 'yyyy-MM-dd';
export const DATETIME_FORMAT = "yyyy-MM-dd'T'HH:mm";
export const DISPLAY_DATE_FORMAT = 'MMM dd, yyyy';
export const DISPLAY_DATETIME_FORMAT = 'MMM dd, yyyy hh:mm a';
