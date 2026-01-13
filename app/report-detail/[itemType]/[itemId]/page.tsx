'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import MatchCard from '@/components/matches/MatchCard';
import ChatInterface from '@/components/chat/ChatInterface';
import Button from '@/components/ui/Button';
import { formatForDisplay } from '@/utils/date-utils';
import { getCurrentUser } from '@/services/supabase/client';
import { getLostItemById, getFoundItemById, updateItemStatus } from '@/services/supabase/items.service';
import { getMatchesForItem, acceptMatch, rejectMatch } from '@/services/supabase/matches.service';
import { getChatMessages, sendChatMessage, subscribeToChatMessages } from '@/services/supabase/chat.service';
import { markItemNotificationsAsRead } from '@/services/supabase/notifications.service';
import { supabase } from '@/services/supabase/client';
import type { LostItem, FoundItem, MatchWithItems, ChatMessage } from '@/types/database.types';
import { useAuthProtection } from '@/hooks/useAuthProtection';

export default function ReportDetailPage() {
    const params = useParams();
    const router = useRouter();
    const itemType = params.itemType as 'lost' | 'found';
    const itemId = params.itemId as string;

    const [item, setItem] = useState<LostItem | FoundItem | null>(null);
    const [matches, setMatches] = useState<MatchWithItems[]>([]);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
    const [isReturned, setIsReturned] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string>('');

    // Auth protection hook must be called before any conditional returns
    const isAuthLoading = useAuthProtection();


    // Fetch item details and matches
    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);

                // Get current user
                const user = await getCurrentUser();
                if (user) {
                    setCurrentUserId(user.id);
                }

                // Fetch item based on type
                let fetchedItem: LostItem | FoundItem | null = null;
                if (itemType === 'lost') {
                    fetchedItem = await getLostItemById(itemId);
                } else {
                    fetchedItem = await getFoundItemById(itemId);
                }

                if (!fetchedItem) {
                    alert('Item not found');
                    router.push('/my-reports');
                    return;
                }

                setItem(fetchedItem);
                setIsReturned(fetchedItem.status === 'returned');

                // Fetch matches
                const fetchedMatches = await getMatchesForItem(itemId, itemType);
                setMatches(fetchedMatches);

                // Select first accepted match for chat
                const acceptedMatch = fetchedMatches.find(m => m.owner_accepted && m.finder_accepted);
                if (acceptedMatch) {
                    setSelectedMatchId(acceptedMatch.id);
                }

                // Mark all notifications for this item as read
                try {
                    await markItemNotificationsAsRead(itemId, itemType);
                } catch (error) {
                    console.error('Error marking notifications as read:', error);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                alert('Failed to load item details');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();

        // Subscribe to match updates (both INSERT for new matches and UPDATE for acceptance changes)
        const matchChannel = supabase
            .channel(`match-updates-${itemId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'matches',
                },
                async (payload) => {
                    console.log('New match created:', payload);
                    const newMatch = payload.new as any;

                    // Check if this match involves our item
                    const isRelevant = newMatch.lost_item_id === itemId || newMatch.found_item_id === itemId;

                    if (isRelevant) {
                        console.log('New match found for this item! Refreshing...');
                        // Re-fetch matches to update UI with full data
                        const fetchedMatches = await getMatchesForItem(itemId, itemType);
                        setMatches(fetchedMatches);

                        // Show notification
                        alert('🎯 New potential match found! Check the matches section below.');
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'matches',
                },
                async (payload) => {
                    console.log('Match updated:', payload);
                    const updatedMatch = payload.new as any;

                    // Check if this match involves our item
                    const isRelevant = updatedMatch.lost_item_id === itemId || updatedMatch.found_item_id === itemId;

                    if (isRelevant) {
                        console.log('Match status changed! Refreshing...');
                        // Re-fetch matches to update UI
                        const fetchedMatches = await getMatchesForItem(itemId, itemType);
                        setMatches(fetchedMatches);

                        // If both parties accepted, select for chat
                        if (updatedMatch.owner_accepted && updatedMatch.finder_accepted) {
                            console.log('Both sides accepted! Chat available.');
                            const acceptedMatch = fetchedMatches.find(m => m.id === updatedMatch.id);
                            if (acceptedMatch) {
                                setSelectedMatchId(acceptedMatch.id);
                            }
                        }
                    }
                }
            )
            .subscribe();

        // Subscribe to item status updates (for instant "returned" status sync)
        const itemTable = itemType === 'lost' ? 'lost_items' : 'found_items';
        const itemChannel = supabase
            .channel(`item-status-${itemId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: itemTable,
                    filter: `id=eq.${itemId}`,
                },
                async (payload) => {
                    console.log('Item status updated:', payload);
                    const updatedItem = payload.new as LostItem | FoundItem;

                    // Update local item state immediately
                    setItem(updatedItem);

                    // If marked as returned, update the returned flag and show alert
                    if (updatedItem.status === 'returned') {
                        setIsReturned(true);
                        alert('This item has been marked as returned. Chat is now closed.');
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(matchChannel);
            supabase.removeChannel(itemChannel);
        };
    }, [itemId, itemType]);

    // Fetch and subscribe to chat messages
    useEffect(() => {
        if (!selectedMatchId) return;

        const fetchMessages = async () => {
            try {
                const messages = await getChatMessages(selectedMatchId);
                setChatMessages(messages);
            } catch (error) {
                console.error('Error fetching messages:', error);
            }
        };

        fetchMessages();

        // Subscribe to real-time updates
        const channel = subscribeToChatMessages(selectedMatchId, (newMessage) => {
            // Only add if message doesn't already exist (prevents duplicates)
            setChatMessages(prev => {
                const exists = prev.some(msg => msg.id === newMessage.id);
                if (exists) return prev;
                return [...prev, newMessage];
            });
        });

        return () => {
            channel.unsubscribe();
        };
    }, [selectedMatchId]);

    const userRole = itemType === 'lost' ? 'owner' : 'finder';
    const hasAcceptedMatches = matches.some(m => m.owner_accepted && m.finder_accepted);

    const handleAcceptMatch = async (matchId: string) => {
        try {
            await acceptMatch(matchId, userRole);
            // Refresh matches
            const fetchedMatches = await getMatchesForItem(itemId, itemType);
            setMatches(fetchedMatches);
            alert('Match accepted! Waiting for the other party.');
        } catch (error) {
            console.error('Error accepting match:', error);
            alert('Failed to accept match');
        }
    };

    const [isRejecting, setIsRejecting] = useState(false);

    const handleRejectMatch = async (matchId: string) => {
        if (isRejecting) return; // Prevent duplicate clicks

        try {
            setIsRejecting(true);
            console.log('Rejecting match:', matchId);

            // Call the new rejection API
            const response = await fetch('/api/matches/reject', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    matchId,
                    userId: currentUserId
                })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Failed to reject match');
            }

            console.log('Match rejected successfully:', data);

            // Refresh matches to show updated status
            const fetchedMatches = await getMatchesForItem(itemId, itemType);
            setMatches(fetchedMatches);

            alert('Match rejected successfully. We\'ll keep looking for better matches!');
        } catch (error) {
            console.error('Error rejecting match:', error);
            alert('Failed to reject match. Please try again.');
        } finally {
            setIsRejecting(false);
        }
    };

    const handleSendMessage = async (message: string) => {
        if (!selectedMatchId) return;

        try {
            console.log('Sending message:', message);
            await sendChatMessage(selectedMatchId, message);
            // Message will appear via real-time subscription for both users
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message');
        }
    };

    const handleMarkReturned = async () => {
        if (confirm('Are you sure you want to mark this item as returned? This will issue rewards to the finder.')) {
            try {
                // Update current item to returned
                await updateItemStatus(itemId, itemType, 'returned');
                setIsReturned(true);
                if (item) {
                    setItem({ ...item, status: 'returned' });
                }

                // Update matched item(s) to returned and issue rewards
                const acceptedMatches = matches.filter(m => m.owner_accepted && m.finder_accepted);
                for (const match of acceptedMatches) {
                    try {
                        // Issue reward to finder
                        const finderId = itemType === 'lost' ? match.found_item?.user_id : match.lost_item?.user_id;
                        const lostItem = itemType === 'lost' ? item : match.lost_item;

                        if (finderId && lostItem) {
                            const itemCategory = lostItem.item_category || 'Other';
                            const itemLostAt = new Date(lostItem.datetime_lost);

                            const { issueMatchReward } = await import('@/services/supabase/rewards.service');
                            await issueMatchReward(
                                match.id,
                                finderId,
                                itemCategory,
                                itemLostAt,
                                0 // bonus points
                            );

                            console.log(`✅ Issued reward to finder ${finderId} for match ${match.id}`);
                        }

                        // Update matched item status
                        if (itemType === 'lost') {
                            await updateItemStatus(match.found_item_id, 'found', 'returned');
                            console.log(`✅ Updated matched found item ${match.found_item_id} to returned`);
                        } else {
                            await updateItemStatus(match.lost_item_id, 'lost', 'returned');
                            console.log(`✅ Updated matched lost item ${match.lost_item_id} to returned`);
                        }
                    } catch (error) {
                        console.error('Error updating matched item or issuing reward:', error);
                    }
                }

                alert('Item marked as returned! Rewards have been issued to the finder.');
            } catch (error) {
                console.error('Error marking as returned:', error);
                alert('Failed to mark item as returned');
            }
        }
    };

    if (isAuthLoading || isLoading) {
        return (
            <Layout showHeader showNotifications>
                <div className="max-w-4xl mx-auto py-8">
                    <div className="glass-card p-12 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-gray-600 dark:text-gray-400">
                            {isAuthLoading ? 'Checking permissions...' : 'Loading item details...'}
                        </p>
                    </div>
                </div>
            </Layout>
        );
    }

    if (!item) {
        return (
            <Layout showHeader showNotifications>
                <div className="max-w-4xl mx-auto py-8">
                    <div className="glass-card p-12 text-center">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            Item not found
                        </h3>
                        <Button onClick={() => router.push('/my-reports')}>
                            Back to My Reports
                        </Button>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout showHeader showNotifications>
            <div className="max-w-4xl mx-auto py-8 space-y-6">
                {/* Back Button */}
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to My Reports
                </button>

                {/* Item Details */}
                <div className="glass-card p-8 space-y-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gradient mb-2">{item.item_name}</h1>
                            <div className="flex items-center gap-3">
                                <span className={itemType === 'lost' ? 'badge-owner' : 'badge-finder'}>
                                    {itemType === 'lost' ? 'Lost Item' : 'Found Item'}
                                </span>
                                <span className={`badge-${item.status}`}>
                                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                                </span>
                            </div>
                        </div>
                        {/* Only show "Mark as Returned" for OWNER and only after match is accepted */}
                        {userRole === 'owner' && !isReturned && hasAcceptedMatches && (
                            <Button variant="primary" onClick={handleMarkReturned}>
                                Mark as Returned
                            </Button>
                        )}
                    </div>

                    {/* Item Image - Only show if NO accepted matches */}
                    {item.image_url && !hasAcceptedMatches && (
                        <div className="mt-6">
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Item Photo</h3>
                            <img
                                src={item.image_url}
                                alt={item.item_name}
                                className="w-full max-w-2xl mx-auto rounded-lg border-2 border-gray-200 dark:border-gray-700 object-cover"
                                style={{ maxHeight: '400px' }}
                            />
                        </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Category</h3>
                                <p className="text-gray-900 dark:text-white">{item.item_category}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Location</h3>
                                <p className="text-gray-900 dark:text-white">
                                    {item.location}
                                    {item.area && ` - ${item.area}`}
                                </p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    {itemType === 'lost' ? 'Date Lost' : 'Date Found'}
                                </h3>
                                <p className="text-gray-900 dark:text-white">
                                    {formatForDisplay('datetime_lost' in item ? item.datetime_lost : item.datetime_found, true)}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Contact Person</h3>
                                <p className="text-gray-900 dark:text-white">
                                    {'owner_name' in item ? item.owner_name : item.finder_name}
                                </p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Contact Number</h3>
                                <p className="text-gray-900 dark:text-white">
                                    {'owner_contact' in item ? item.owner_contact : item.finder_contact}
                                </p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Reported On</h3>
                                <p className="text-gray-900 dark:text-white">
                                    {formatForDisplay(item.created_at, true)}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Description</h3>
                        <p className="text-gray-900 dark:text-white leading-relaxed">{item.description}</p>
                    </div>
                </div>

                {/* Matches Section */}
                {matches.length > 0 && (
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Potential Matches ({matches.length})
                        </h2>
                        {matches.map((match) => (
                            <MatchCard
                                key={match.id}
                                match={match}
                                userRole={userRole}
                                onAccept={handleAcceptMatch}
                                onReject={handleRejectMatch}
                                disabled={isRejecting}
                            />
                        ))}
                    </div>
                )}

                {/* Chat Section */}
                {hasAcceptedMatches && selectedMatchId && (
                    <ChatInterface
                        matchId={selectedMatchId}
                        currentUserId={currentUserId}
                        messages={chatMessages}
                        onSendMessage={handleSendMessage}
                        disabled={isReturned}
                    />
                )}

                {/* No Matches */}
                {matches.length === 0 && (
                    <div className="glass-card p-12 text-center">
                        <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            No matches found yet
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            Our AI is continuously searching for potential matches. Check back later!
                        </p>
                    </div>
                )}
            </div>
        </Layout>
    );
}
