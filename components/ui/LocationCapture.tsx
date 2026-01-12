'use client';

import { useState, useEffect } from 'react';
import { getCurrentLocation } from '@/utils/geolocation';

interface LocationCaptureProps {
    onLocationCaptured: (location: { latitude: number; longitude: number; accuracy: number } | null) => void;
    className?: string;
}

export default function LocationCapture({ onLocationCaptured, className = '' }: LocationCaptureProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [location, setLocation] = useState<{ latitude: number; longitude: number; accuracy: number } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const captureLocation = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const coords = await getCurrentLocation();

            if (coords) {
                setLocation(coords);
                onLocationCaptured(coords);
            } else {
                setError('Unable to get location. Please enable location services.');
                onLocationCaptured(null);
            }
        } catch (err) {
            setError('Failed to capture location');
            onLocationCaptured(null);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={className}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                📍 Location (for better matching)
            </label>

            {!location ? (
                <button
                    type="button"
                    onClick={captureLocation}
                    disabled={isLoading}
                    className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? '📡 Getting location...' : '📍 Capture Current Location'}
                </button>
            ) : (
                <div className="glass-card p-3">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">
                                ✓ Location captured
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                Lat: {location.latitude.toFixed(6)}, Lng: {location.longitude.toFixed(6)}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                                Accuracy: ±{Math.round(location.accuracy)}m
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={captureLocation}
                            className="text-xs text-primary hover:underline"
                        >
                            Update
                        </button>
                    </div>
                </div>
            )}

            {error && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                    ⚠️ {error}
                </p>
            )}

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                💡 We'll only match items within 1km of this location
            </p>
        </div>
    );
}
