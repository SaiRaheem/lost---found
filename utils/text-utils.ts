// Helper function to trim extra spaces
function trimExtraSpaces(str: string): string {
    return str.trim().replace(/\s+/g, ' ');
}

// Helper function to convert to proper case
function toProperCase(str: string): string {
    return str
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}
