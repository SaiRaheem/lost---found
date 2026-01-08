import { SynonymMap } from '@/types/matching.types';

/**
 * Synonym map for common item terms
 */
export const SYNONYMS: SynonymMap = {
    phone: ['mobile', 'smartphone', 'device', 'cellphone', 'cell'],
    laptop: ['notebook', 'computer', 'pc'],
    bag: ['backpack', 'satchel', 'purse', 'pouch'],
    wallet: ['purse', 'billfold'],
    keys: ['keychain', 'key'],
    watch: ['timepiece', 'wristwatch'],
    glasses: ['spectacles', 'eyeglasses', 'specs'],
    bottle: ['flask', 'container'],
    umbrella: ['parasol'],
    charger: ['adapter', 'cable'],
    earphones: ['headphones', 'earbuds', 'airpods'],
    book: ['notebook', 'textbook', 'novel'],
};

/**
 * Common phone brands
 */
export const PHONE_BRANDS = [
    'samsung', 'apple', 'iphone', 'oppo', 'vivo', 'xiaomi', 'redmi',
    'oneplus', 'realme', 'nokia', 'motorola', 'huawei', 'honor', 'asus',
    'lenovo', 'lg', 'sony', 'google', 'pixel'
];

/**
 * Common laptop brands
 */
export const LAPTOP_BRANDS = [
    'dell', 'hp', 'lenovo', 'asus', 'acer', 'apple', 'macbook',
    'msi', 'razer', 'alienware', 'surface', 'microsoft', 'samsung',
    'lg', 'huawei', 'thinkpad'
];

/**
 * Common colors
 */
export const COLORS = [
    'black', 'white', 'red', 'blue', 'green', 'yellow', 'orange',
    'purple', 'pink', 'brown', 'gray', 'grey', 'silver', 'gold',
    'rose', 'navy', 'maroon', 'beige', 'cream', 'dark', 'light'
];

/**
 * Extract brands from text
 */
export function extractBrands(text: string): string[] {
    const lowerText = text.toLowerCase();
    const brands: string[] = [];

    // Check phone brands
    PHONE_BRANDS.forEach(brand => {
        if (lowerText.includes(brand)) {
            brands.push(brand);
        }
    });

    // Check laptop brands
    LAPTOP_BRANDS.forEach(brand => {
        if (lowerText.includes(brand)) {
            brands.push(brand);
        }
    });

    return [...new Set(brands)]; // Remove duplicates
}

/**
 * Extract colors from text
 */
export function extractColors(text: string): string[] {
    const lowerText = text.toLowerCase();
    const colors: string[] = [];

    COLORS.forEach(color => {
        if (lowerText.includes(color)) {
            colors.push(color);
        }
    });

    return [...new Set(colors)];
}

/**
 * Extract model numbers (simple pattern matching)
 */
export function extractModels(text: string): string[] {
    const models: string[] = [];

    // Pattern for model numbers like "iPhone 12", "Galaxy S21", "A52", etc.
    const modelPatterns = [
        /\b[A-Z]\d{1,3}\b/g,           // A52, S21, etc.
        /\b\d{1,2}(s|pro|plus|max)?\b/gi,  // 12, 13 Pro, 14 Plus, etc.
    ];

    modelPatterns.forEach(pattern => {
        const matches = text.match(pattern);
        if (matches) {
            models.push(...matches);
        }
    });

    return [...new Set(models)];
}

/**
 * Expand text with synonyms
 */
export function expandWithSynonyms(text: string): string {
    let expanded = text.toLowerCase();

    Object.entries(SYNONYMS).forEach(([word, synonyms]) => {
        if (expanded.includes(word)) {
            expanded += ' ' + synonyms.join(' ');
        }
        synonyms.forEach(synonym => {
            if (expanded.includes(synonym)) {
                expanded += ' ' + word + ' ' + synonyms.filter(s => s !== synonym).join(' ');
            }
        });
    });

    return expanded;
}

/**
 * Check if text implies a phone
 */
export function impliesPhone(text: string): boolean {
    const lowerText = text.toLowerCase();
    return PHONE_BRANDS.some(brand => lowerText.includes(brand)) ||
        ['phone', 'mobile', 'smartphone', 'device', 'cellphone'].some(term => lowerText.includes(term));
}

/**
 * Check if text implies a laptop
 */
export function impliesLaptop(text: string): boolean {
    const lowerText = text.toLowerCase();
    return LAPTOP_BRANDS.some(brand => lowerText.includes(brand)) ||
        ['laptop', 'notebook', 'computer', 'pc', 'macbook'].some(term => lowerText.includes(term));
}

/**
 * Sanitize text for NLP processing
 */
export function sanitizeText(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')  // Remove special characters
        .replace(/\s+/g, ' ')       // Normalize spaces
        .trim();
}
