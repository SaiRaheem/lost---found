import React, { useState } from 'react';
import { MatchWithItems } from '@/types/database.types';
import { formatForDisplay } from '@/utils/date-utils';
import ScoreBreakdown from './ScoreBreakdown';

interface MatchCardProps {
    match: MatchWithItems;
    userRole: 'owner' | 'finder';
    onAccept: (matchId: string) => void;
    onReject: (matchId: string) => void;
}

const MatchCard: React.FC<MatchCardProps> = ({ match, userRole, onAccept, onReject }) => {
    const [showBreakdown, setShowBreakdown] = useState(false);
    const otherItem = userRole === 'owner' ? match.found_item : match.lost_item;
    const userAccepted = userRole === 'owner' ? match.owner_accepted : match.finder_accepted;
    const otherAccepted = userRole === 'owner' ? match.finder_accepted : match.owner_accepted;
    const bothAccepted = userAccepted && otherAccepted;

    if (!otherItem) return null;

    return (
        <div className="glass-card p-6 space-y-4">
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            {otherItem.item_name}
                        </h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {otherItem.location} • {formatForDisplay('datetime_lost' in otherItem ? otherItem.datetime_lost : otherItem.datetime_found)}
                    </p>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-bold text-primary mb-1">
                        {Math.round(match.score)}%
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Match Score</p>
                </div>
            </div>

            {/* Side-by-side Image Comparison */}
            {(match.lost_item?.image_url || match.found_item?.image_url) && (
                <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        📸 Visual Comparison
                        {match.breakdown.image_score > 0 && (
                            <span className="px-2 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs rounded-full">
                                AI Matched
                            </span>
                        )}
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                        {/* Lost Item Image */}
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">
                                Lost Item
                            </p>
                            {match.lost_item?.image_url ? (
                                <img
                                    src={match.lost_item.image_url}
                                    alt="Lost item"
                                    className="w-full h-48 object-cover rounded-lg border-2 border-red-500/50"
                                />
                            ) : (
                                <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                    <span className="text-gray-400">No image</span>
                                </div>
                            )}
                        </div>
                        {/* Found Item Image */}
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">
                                Found Item
                            </p>
                            {match.found_item?.image_url ? (
                                <img
                                    src={match.found_item.image_url}
                                    alt="Found item"
                                    className="w-full h-48 object-cover rounded-lg border-2 border-green-500/50"
                                />
                            ) : (
                                <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                    <span className="text-gray-400">No image</span>
                                </div>
                            )}
                        </div>
                    </div>
                    {match.breakdown.image_score > 0 && (
                        <div className="mt-2 text-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                AI Image Similarity: <span className="font-bold text-purple-600 dark:text-purple-400">
                                    {match.breakdown.image_score}/15 points
                                </span>
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* Item Details */}
            <div className="space-y-2 text-sm">
                <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Category:</span>{' '}
                    <span className="text-gray-600 dark:text-gray-400">{otherItem.item_category}</span>
                </div>
                <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Description:</span>{' '}
                    <p className="text-gray-600 dark:text-gray-400 mt-1">{otherItem.description}</p>
                </div>
            </div>

            {/* Match Breakdown - New Component */}
            <div>
                <button
                    onClick={() => setShowBreakdown(!showBreakdown)}
                    className="w-full flex items-center justify-between px-4 py-2 glass-card rounded-lg hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-colors"
                >
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                        {showBreakdown ? '▼' : '▶'} View Detailed Score Breakdown
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        {showBreakdown ? 'Hide' : 'Show'} weightage
                    </span>
                </button>
                {showBreakdown && (
                    <div className="mt-4">
                        <ScoreBreakdown breakdown={match.breakdown} showDetails={true} />
                    </div>
                )}
            </div>

            {/* Acceptance Status */}
            <div className="pt-4 border-t border-gray-200/20 dark:border-gray-700/20">
                {bothAccepted ? (
                    <div className="text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-lg">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="font-medium">Both parties accepted - Chat available below</span>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Your status:</span>
                            <span className={`font - medium ${userAccepted ? 'text-green-600' : 'text-gray-500'} `}>
                                {userAccepted ? '✓ Accepted' : 'Pending'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Other party:</span>
                            <span className={`font - medium ${otherAccepted ? 'text-green-600' : 'text-gray-500'} `}>
                                {otherAccepted ? '✓ Accepted' : 'Pending'}
                            </span>
                        </div>

                        {!userAccepted && (
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => onAccept(match.id)}
                                    className="flex-1 btn-primary"
                                >
                                    Accept Match
                                </button>
                                <button
                                    onClick={() => onReject(match.id)}
                                    className="flex-1 btn-secondary"
                                >
                                    Reject
                                </button>
                            </div>
                        )}

                        {userAccepted && !otherAccepted && (
                            <p className="text-sm text-center text-gray-600 dark:text-gray-400 italic">
                                Waiting for the other party to accept...
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MatchCard;
