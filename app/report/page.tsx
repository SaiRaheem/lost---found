'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import ImageUpload from '@/components/ui/ImageUpload';
import LocationPicker from '@/components/ui/LocationPicker';
import MapLocationPicker from '@/components/ui/MapLocationPicker';
import LocationCapture from '@/components/ui/LocationCapture';
import { ITEM_CATEGORIES } from '@/utils/constants';
import { toProperCase, trimExtraSpaces } from '@/utils/formatting';
import { isRequired, minLength, isNotFutureDate } from '@/utils/validation';
import { getMaxDateTime, formatForDatabase } from '@/utils/date-utils';
import { getCurrentUser } from '@/services/supabase/client';
import { getUserProfile } from '@/services/supabase/auth.service';
import { createLostItem, createFoundItem } from '@/services/supabase/items.service';
import { uploadItemImage } from '@/services/supabase/storage.service';
import { extractImageEmbedding, loadImageModel } from '@/services/ai/image-matching.service';

function ReportPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const role = searchParams.get('role'); // 'finder' or 'owner'

    const handleLocationSelect = (latitude: number, longitude: number) => {
        setFormData(prev => ({
            ...prev,
            gps_latitude: latitude,
            gps_longitude: longitude,
            latitude: latitude,
            longitude: longitude,
            // Note: location_accuracy will be added when we use getCurrentLocation with accuracy
        }));
    };

    const [formData, setFormData] = useState({
        item_name: '',
        item_category: '',
        description: '',
        purpose: '',
        location: '',
        area: '',
        datetime: '',
        community_type: '',
        college: '',
        gps_latitude: undefined as number | undefined,
        gps_longitude: undefined as number | undefined,
        latitude: undefined as number | undefined,
        longitude: undefined as number | undefined,
        location_accuracy: undefined as number | undefined,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imageEmbedding, setImageEmbedding] = useState<number[] | null>(null);
    const [isExtractingEmbedding, setIsExtractingEmbedding] = useState(false);

    // Load user profile
    useEffect(() => {
        const loadUserProfile = async () => {
            try {
                const user = await getCurrentUser();
                if (user) {
                    const profile = await getUserProfile(user.id);
                    if (profile) {
                        setUserProfile(profile);
                    } else {
                        // No profile found - redirect to auth
                        alert('Please complete your profile first');
                        router.push('/auth');
                    }
                }
            } catch (error) {
                console.error('Error loading user profile:', error);
            }
        };
        loadUserProfile();
    }, [router]);

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error when user types
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!isRequired(formData.community_type)) {
            newErrors.community_type = 'Please select a community type';
        }

        if (formData.community_type === 'college' && !isRequired(formData.college)) {
            newErrors.college = 'Please select your college';
        }

        if (!isRequired(formData.item_name)) {
            newErrors.item_name = 'Item name is required';
        } else if (!minLength(formData.item_name, 3)) {
            newErrors.item_name = 'Item name must be at least 3 characters';
        }

        if (!isRequired(formData.item_category)) {
            newErrors.item_category = 'Please select a category';
        }

        if (!isRequired(formData.description)) {
            newErrors.description = 'Description is required';
        } else if (!minLength(formData.description, 10)) {
            newErrors.description = 'Please provide more details (at least 10 characters)';
        }

        if (!isRequired(formData.location)) {
            newErrors.location = 'Location is required';
        }

        if (!isRequired(formData.datetime)) {
            newErrors.datetime = 'Date and time are required';
        } else if (!isNotFutureDate(formData.datetime)) {
            newErrors.datetime = 'Date cannot be in the future';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) {
            return;
        }

        setIsLoading(true);

        try {
            // Get current user
            const user = await getCurrentUser();
            if (!user) {
                alert('Please sign in to submit a report');
                router.push('/auth');
                return;
            }

            // Upload image if selected
            let imageUrl: string | undefined;
            let embedding: number[] | undefined;

            if (selectedImage) {
                try {
                    const tempId = `temp - ${Date.now()} `;
                    imageUrl = await uploadItemImage(selectedImage, user.id, tempId);

                    // Use pre-extracted embedding or extract now
                    if (imageEmbedding) {
                        embedding = imageEmbedding;
                    } else {
                        console.log('Extracting image embedding...');
                        embedding = await extractImageEmbedding(selectedImage);
                    }
                } catch (uploadError) {
                    console.error('Image upload error:', uploadError);
                    alert('Failed to upload image. Proceeding without image.');
                }
            }

            // Format data
            const formattedData = {
                user_id: user.id,
                item_name: toProperCase(trimExtraSpaces(formData.item_name)),
                item_category: formData.item_category,
                description: trimExtraSpaces(formData.description),
                purpose: formData.purpose ? trimExtraSpaces(formData.purpose) : '',
                location: toProperCase(trimExtraSpaces(formData.location)),
                area: formData.area || '', // Provide empty string if undefined
                community: formData.community_type === 'college' ? formData.college : 'Common Area',
                community_type: formData.community_type,
                college: formData.college,
                gps_latitude: formData.gps_latitude,
                gps_longitude: formData.gps_longitude,
                image_url: imageUrl,
                image_embedding: embedding,
                status: 'active' as const,
            };

            // Role-specific fields
            let createdItem;
            if (role === 'owner') {
                // Lost item
                createdItem = await createLostItem({
                    ...formattedData,
                    datetime_lost: formatForDatabase(formData.datetime),
                    owner_name: userProfile?.name || 'Unknown',
                    owner_gender: userProfile?.gender || 'other',
                    owner_contact: userProfile?.phone || 'N/A',
                });

                // Run matching algorithm for lost item
                if (createdItem) {
                    try {
                        const { matchLostItem } = await import('@/services/ai/match-orchestrator');
                        const matchCount = await matchLostItem(createdItem);
                        console.log(`Found ${matchCount} matches for lost item`);

                        if (matchCount > 0) {
                            alert(`✅ Report submitted!\n\n🎯 Found ${matchCount} potential match${matchCount > 1 ? 'es' : ''} !\n\nCheck "My Reports" to review matches.`);
                        } else {
                            alert('✅ Report submitted successfully!\n\nWe\'ll notify you if we find any matches.');
                        }
                    } catch (matchError) {
                        console.error('Matching error:', matchError);
                        alert('✅ Report submitted!\n\n⚠️ Matching will run in the background.');
                    }
                }
            } else {
                // Found item
                createdItem = await createFoundItem({
                    ...formattedData,
                    datetime_found: formatForDatabase(formData.datetime),
                    finder_name: userProfile?.name || 'Unknown',
                    finder_gender: userProfile?.gender || 'other',
                    finder_contact: userProfile?.phone || 'N/A',
                });

                // Run matching algorithm for found item
                if (createdItem) {
                    try {
                        const { matchFoundItem } = await import('@/services/ai/match-orchestrator');
                        const matchCount = await matchFoundItem(createdItem);
                        console.log(`Found ${matchCount} matches for found item`);

                        if (matchCount > 0) {
                            alert(`✅ Report submitted!\n\n🎯 Found ${matchCount} potential match${matchCount > 1 ? 'es' : ''} !\n\nCheck "My Reports" to review matches.`);
                        } else {
                            alert('✅ Report submitted successfully!\n\nWe\'ll notify you if we find any matches.');
                        }
                    } catch (matchError) {
                        console.error('Matching error:', matchError);
                        alert('✅ Report submitted!\n\n⚠️ Matching will run in the background.');
                    }
                }
            }

            // Redirect to my reports
            router.push('/my-reports');
        } catch (error: any) {
            console.error('Error submitting report:', error);
            alert(error.message || 'Failed to submit report. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!role || (role !== 'finder' && role !== 'owner')) {
        return (
            <Layout showHeader showNotifications>
                <div className="max-w-2xl mx-auto text-center py-12">
                    <h1 className="text-3xl font-bold text-red-500 mb-4">Invalid Request</h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Please select whether you found or lost an item.
                    </p>
                    <Button onClick={() => router.push('/home')}>Go to Home</Button>
                </div>
            </Layout>
        );
    }

    const isOwner = role === 'owner';
    const title = isOwner ? 'Report Lost Item' : 'Report Found Item';
    const dateLabel = isOwner ? 'When did you lose it?' : 'When did you find it?';

    return (
        <Layout showHeader showNotifications>
            <div className="max-w-3xl mx-auto py-8">
                <div className="glass-card p-8 animate-scale-in">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gradient mb-2">{title}</h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Provide as many details as possible to help match your item
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Community Type */}
                        <Select
                            label="Community Type"
                            required
                            value={formData.community_type}
                            onChange={(e) => handleChange('community_type', e.target.value)}
                            options={[
                                { value: 'college', label: 'College' },
                                { value: 'common', label: 'Common' },
                            ]}
                            error={errors.community_type}
                        />

                        {/* College Selection (only for college community) */}
                        {formData.community_type === 'college' && (
                            <Select
                                label="College"
                                required
                                value={formData.college}
                                onChange={(e) => handleChange('college', e.target.value)}
                                options={[
                                    { value: 'RVR & JC College', label: 'RVR & JC College' },
                                    { value: 'Other College', label: 'Other College' },
                                ]}
                                error={errors.college}
                            />
                        )}

                        {/* Item Name */}
                        <Input
                            label="Item Name"
                            required
                            value={formData.item_name}
                            onChange={(e) => handleChange('item_name', e.target.value)}
                            placeholder="e.g., Black Samsung Phone"
                            error={errors.item_name}
                        />

                        {/* Category */}
                        <Select
                            label="Category"
                            required
                            value={formData.item_category}
                            onChange={(e) => handleChange('item_category', e.target.value)}
                            options={ITEM_CATEGORIES.map(cat => ({ value: cat, label: cat }))}
                            error={errors.item_category}
                        />

                        {/* Description */}
                        <Textarea
                            label="Description"
                            required
                            value={formData.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            placeholder="Provide marks, color, brand, cracks, unique features, etc."
                            helperText="Be as detailed as possible - this helps our AI match your item"
                            error={errors.description}
                        />

                        {/* Purpose/Use */}
                        <Textarea
                            label="What is this item used for?"
                            value={formData.purpose || ''}
                            onChange={(e) => handleChange('purpose', e.target.value)}
                            placeholder="e.g., For taking notes in class, For listening to music, For carrying books"
                            helperText="Optional: Briefly describe what you use this item for"
                            rows={2}
                        />

                        {/* Image Upload */}
                        <ImageUpload
                            onImageSelect={setSelectedImage}
                            currentImage={null}
                        />

                        {/* Location */}
                        <Input
                            label="Location"
                            required
                            value={formData.location}
                            onChange={(e) => handleChange('location', e.target.value)}
                            placeholder="e.g., Main Building, Library, Cafeteria"
                            error={errors.location}
                        />

                        {/* Area (Optional) */}
                        <Input
                            label="Specific Area (Optional)"
                            value={formData.area}
                            onChange={(e) => handleChange('area', e.target.value)}
                            placeholder="e.g., 2nd Floor, Near Entrance"
                        />

                        {/* Map Location Picker with Search */}
                        <MapLocationPicker
                            onLocationSelect={handleLocationSelect}
                            initialLat={formData.latitude || formData.gps_latitude}
                            initialLng={formData.longitude || formData.gps_longitude}
                        />

                        {/* Date and Time */}
                        <Input
                            label={dateLabel}
                            type="datetime-local"
                            required
                            value={formData.datetime}
                            onChange={(e) => handleChange('datetime', e.target.value)}
                            max={getMaxDateTime()}
                            error={errors.datetime}
                            helperText="Click the calendar icon to select date and time"
                        />

                        {/* Submit Button */}
                        <div className="flex gap-4 pt-6">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => router.back()}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                isLoading={isLoading}
                                className="flex-1"
                            >
                                Submit Report
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
}

export default function ReportPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ReportPageContent />
        </Suspense>
    );
}
