'use client';

import React, { useState } from 'react';
import Button from '@/components/ui/Button';

interface LocationPickerProps {
    onLocationSelect: (latitude: number, longitude: number) => void;
    currentLatitude?: number;
    currentLongitude?: number;
}

const LocationPicker: React.FC<LocationPickerProps> = ({
    onLocationSelect,
    currentLatitude,
    currentLongitude,
}) => {
    const [isGettingLocation, setIsGettingLocation] = useState(false);
    const [error, setError] = useState<string>('');

    const handleGetCurrentLocation = () => {
        setError('');
        setIsGettingLocation(true);

        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            setIsGettingLocation(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                onLocationSelect(latitude, longitude);
                setIsGettingLocation(false);
            },
            (err) => {
                let errorMessage = 'Unable to get your location. ';

                if (err.code === 1) { // PERMISSION_DENIED
                    errorMessage += 'Please allow location access in your browser settings.';
                } else if (err.code === 2) { // POSITION_UNAVAILABLE
                    errorMessage += 'Location information is unavailable.';
                } else if (err.code === 3) { // TIMEOUT
                    errorMessage += 'Location request timed out.';
                } else {
                    errorMessage += 'An unknown error occurred.';
                }

                console.error('Geolocation error:', err.message);
                setError(errorMessage);
                setIsGettingLocation(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 30000,
                maximumAge: 0,
            }
        );
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-3">
                <Button
                    type="button"
                    variant="secondary"
                    onClick={handleGetCurrentLocation}
                    isLoading={isGettingLocation}
                    className="flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                    </svg>
                    {isGettingLocation ? 'Getting Location...' : 'Use Current Location'}
                </Button>

                {currentLatitude && currentLongitude && (
                    <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                            />
                        </svg>
                        Location captured
                    </div>
                )}
            </div>

            {currentLatitude && currentLongitude && (
                <div className="text-xs text-gray-500 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded">
                    Lat: {currentLatitude.toFixed(6)}, Long: {currentLongitude.toFixed(6)}
                </div>
            )}

            {error && (
                <div className="text-sm text-red-500 flex items-start gap-2">
                    <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                        />
                    </svg>
                    <span>{error}</span>
                </div>
            )}

            <p className="text-xs text-gray-500 dark:text-gray-400">
                📍 GPS coordinates help improve matching accuracy by considering location proximity
            </p>
        </div>
    );
};

export default LocationPicker;
