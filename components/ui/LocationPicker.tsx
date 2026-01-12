'use client';

import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

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
    const [showManualInput, setShowManualInput] = useState(false);
    const [manualLat, setManualLat] = useState('');
    const [manualLng, setManualLng] = useState('');

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
                setShowManualInput(false);
            },
            (err) => {
                let errorMessage = 'Unable to get your location. ';

                if (err.code === 1) { // PERMISSION_DENIED
                    errorMessage += 'Please allow location access or enter manually.';
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

    const handleManualSubmit = () => {
        const lat = parseFloat(manualLat);
        const lng = parseFloat(manualLng);

        if (isNaN(lat) || isNaN(lng)) {
            setError('Please enter valid coordinates');
            return;
        }

        if (lat < -90 || lat > 90) {
            setError('Latitude must be between -90 and 90');
            return;
        }

        if (lng < -180 || lng > 180) {
            setError('Longitude must be between -180 and 180');
            return;
        }

        onLocationSelect(lat, lng);
        setError('');
        setShowManualInput(false);
    };

    return (
        <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                📍 Location (Required for matching)
            </label>

            <div className="flex items-center gap-3 flex-wrap">
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

                <button
                    type="button"
                    onClick={() => setShowManualInput(!showManualInput)}
                    className="text-sm text-primary hover:underline"
                >
                    {showManualInput ? 'Hide Manual Input' : 'Enter Manually'}
                </button>

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

            {showManualInput && (
                <div className="glass-card p-4 space-y-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Enter coordinates manually (you can get these from Google Maps)
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                        <Input
                            label="Latitude"
                            type="number"
                            step="any"
                            value={manualLat}
                            onChange={(e) => setManualLat(e.target.value)}
                            placeholder="e.g., 17.385044"
                        />
                        <Input
                            label="Longitude"
                            type="number"
                            step="any"
                            value={manualLng}
                            onChange={(e) => setManualLng(e.target.value)}
                            placeholder="e.g., 78.486671"
                        />
                    </div>
                    <Button
                        type="button"
                        onClick={handleManualSubmit}
                        className="w-full"
                    >
                        Set Location
                    </Button>
                </div>
            )}

            {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
            )}

            {currentLatitude && currentLongitude && (
                <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 p-2 rounded">
                    <strong>Current:</strong> {currentLatitude.toFixed(6)}, {currentLongitude.toFixed(6)}
                </div>
            )}

            <p className="text-xs text-gray-500 dark:text-gray-400">
                💡 We'll only match items within 1km of this location for better accuracy
            </p>
        </div>
    );
};

export default LocationPicker;
