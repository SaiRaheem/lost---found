'use client';

import { useState } from 'react';

interface MapLocationPickerProps {
    onLocationSelect: (latitude: number, longitude: number) => void;
    initialLat?: number;
    initialLng?: number;
}

export default function MapLocationPicker({ onLocationSelect, initialLat = 17.385044, initialLng = 78.486671 }: MapLocationPickerProps) {
    const [latitude, setLatitude] = useState(initialLat.toString());
    const [longitude, setLongitude] = useState(initialLng.toString());
    const [isGettingLocation, setIsGettingLocation] = useState(false);
    const [locationCaptured, setLocationCaptured] = useState(false);
    const [accuracy, setAccuracy] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleLatitudeChange = (value: string) => {
        setLatitude(value);
        const lat = parseFloat(value);
        const lng = parseFloat(longitude);
        if (!isNaN(lat) && !isNaN(lng)) {
            onLocationSelect(lat, lng);
        }
    };

    const handleLongitudeChange = (value: string) => {
        setLongitude(value);
        const lat = parseFloat(latitude);
        const lng = parseFloat(value);
        if (!isNaN(lat) && !isNaN(lng)) {
            onLocationSelect(lat, lng);
        }
    };

    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) {
            setError('❌ Geolocation is not supported by your browser');
            return;
        }

        setIsGettingLocation(true);
        setError(null);
        setLocationCaptured(false);

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude: lat, longitude: lng, accuracy: acc } = pos.coords;
                setLatitude(lat.toFixed(6));
                setLongitude(lng.toFixed(6));
                setAccuracy(acc);
                setLocationCaptured(true);
                setIsGettingLocation(false);
                onLocationSelect(lat, lng);
                console.log('✅ Location captured:', { lat, lng, accuracy: acc });
            },
            (error) => {
                console.error('Geolocation error:', error);
                setIsGettingLocation(false);
                setLocationCaptured(false);

                // Provide specific error messages
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        setError('❌ Location access denied. Please allow location access in your browser settings.');
                        break;
                    case error.POSITION_UNAVAILABLE:
                        setError('❌ Location information unavailable. Please try again.');
                        break;
                    case error.TIMEOUT:
                        setError('⏱️ Location request timed out. Please try again.');
                        break;
                    default:
                        setError('❌ Unable to get location. Please try again or enter manually.');
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 15000, // Increased to 15 seconds
                maximumAge: 0
            }
        );
    };

    return (
        <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                📍 Location Coordinates
            </label>

            {/* GPS Button */}
            <button
                type="button"
                onClick={handleGetCurrentLocation}
                disabled={isGettingLocation}
                className={`w-full px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors ${isGettingLocation
                        ? 'bg-gray-400 cursor-not-allowed'
                        : locationCaptured
                            ? 'bg-green-600 hover:bg-green-700'
                            : 'bg-primary hover:bg-primary/90'
                    } text-white disabled:opacity-70`}
            >
                {isGettingLocation ? (
                    <>
                        <span className="animate-spin">📡</span> Getting location...
                    </>
                ) : locationCaptured ? (
                    <>
                        ✅ Location Captured - Update
                    </>
                ) : (
                    <>
                        📍 Use Current Location (GPS)
                    </>
                )}
            </button>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                    <p className="text-sm text-red-600 dark:text-red-400">
                        {error}
                    </p>
                </div>
            )}

            {/* Success Message with Accuracy */}
            {locationCaptured && accuracy && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                    <p className="text-sm font-medium text-green-700 dark:text-green-400">
                        ✅ GPS location captured successfully!
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                        Accuracy: ±{Math.round(accuracy)} meters
                        {accuracy < 20 && ' (Excellent)'}
                        {accuracy >= 20 && accuracy < 50 && ' (Good)'}
                        {accuracy >= 50 && accuracy < 100 && ' (Fair)'}
                        {accuracy >= 100 && ' (Poor - try again?)'}
                    </p>
                </div>
            )}

            {/* Manual Input Fields */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Latitude
                    </label>
                    <input
                        type="number"
                        step="any"
                        value={latitude}
                        onChange={(e) => handleLatitudeChange(e.target.value)}
                        placeholder="17.385044"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Longitude
                    </label>
                    <input
                        type="number"
                        step="any"
                        value={longitude}
                        onChange={(e) => handleLongitudeChange(e.target.value)}
                        placeholder="78.486671"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary"
                    />
                </div>
            </div>

            {/* Selected Coordinates Display */}
            <div className="text-sm text-gray-700 dark:text-gray-300 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                <strong>📍 Selected:</strong> {latitude}, {longitude}
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400">
                💡 <strong>Tip:</strong> Click "Use Current Location" for GPS or enter coordinates manually
            </p>
        </div>
    );
}
