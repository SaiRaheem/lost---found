/**
 * Geolocation utilities for location-based matching
 */

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param lat1 Latitude of point 1
 * @param lon1 Longitude of point 1
 * @param lat2 Latitude of point 2
 * @param lon2 Longitude of point 2
 * @returns Distance in kilometers
 */
export function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
}

/**
 * Check if two locations are within a specified radius
 * @param lat1 Latitude of point 1
 * @param lon1 Longitude of point 1
 * @param lat2 Latitude of point 2
 * @param lon2 Longitude of point 2
 * @param radiusKm Maximum distance in kilometers
 * @returns true if within radius, false otherwise
 */
export function isWithinRadius(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
    radiusKm: number
): boolean {
    const distance = calculateDistance(lat1, lon1, lat2, lon2);
    return distance <= radiusKm;
}

/**
 * Calculate location score based on distance
 * @param distanceKm Distance in kilometers
 * @returns Score from 0-30 points
 */
export function getLocationScore(distanceKm: number): number {
    if (distanceKm <= 0.1) return 30; // Within 100 meters - same location
    if (distanceKm <= 0.3) return 25; // Within 300 meters - very close
    if (distanceKm <= 0.5) return 20; // Within 500 meters - close
    if (distanceKm <= 0.8) return 15; // Within 800 meters - nearby
    if (distanceKm <= 1.0) return 10; // Within 1 km - acceptable
    return 0; // Beyond 1km - too far
}

/**
 * Get user's current location using browser Geolocation API
 * @returns Promise with coordinates or null if denied/unavailable
 */
export async function getCurrentLocation(): Promise<{
    latitude: number;
    longitude: number;
    accuracy: number;
} | null> {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            console.warn('Geolocation is not supported by this browser');
            resolve(null);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                });
            },
            (error) => {
                console.error('Error getting location:', error.message);
                resolve(null);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );
    });
}

/**
 * Format distance for display
 * @param distanceKm Distance in kilometers
 * @returns Formatted string (e.g., "150m" or "1.2km")
 */
export function formatDistance(distanceKm: number): string {
    if (distanceKm < 1) {
        return `${Math.round(distanceKm * 1000)}m`;
    }
    return `${distanceKm.toFixed(1)}km`;
}
