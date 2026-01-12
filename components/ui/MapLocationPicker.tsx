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
            alert('Geolocation not supported');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude: lat, longitude: lng } = pos.coords;
                setLatitude(lat.toString());
                setLongitude(lng.toString());
                onLocationSelect(lat, lng);
            },
            (error) => {
                console.error('Geolocation error:', error);
                alert('Unable to get location. Please enable location access.');
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
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
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
            >
                📍 Use Current Location (GPS)
            </button>

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
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
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
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                </div>
            </div>

            {/* Selected Coordinates Display */}
            <div className="text-sm text-gray-700 dark:text-gray-300 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                <strong>📍 Selected:</strong> {latitude}, {longitude}
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400">
                💡 <strong>Tip:</strong> Click "Use Current Location" or enter coordinates manually
            </p>
        </div>
    );
}
