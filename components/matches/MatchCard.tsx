import React from 'react';
import { MatchWithItems } from '@/types/database.types';
import { formatForDisplay } from '@/utils/date-utils';

interface MatchCardProps {
    match: MatchWithItems;
    userRole: 'owner' | 'finder';
    onAccept: (matchId: string) => void;
    onReject: (matchId: string) => void;
}

const MatchCard: React.FC<MatchCardProps> = ({ match, userRole, onAccept, onReject }) => {
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
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        📸 Visual Comparison
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
                                    alt={match.lost_item.item_name}
                                    className="w-full h-48 object-cover rounded-lg border-2 border-red-200 dark:border-red-800"
                                />
                            ) : (
                                <div className="w-full h-48 bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
                                    <p className="text-sm text-gray-400">No image</p>
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
                                    alt={match.found_item.item_name}
                                    className="w-full h-48 object-cover rounded-lg border-2 border-green-200 dark:border-green-800"
                                />
                            ) : (
                                <div className="w-full h-48 bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
                                    <p className="text-sm text-gray-400">No image</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-2 text-sm">
                <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Category:</span>{' '}
                    <span className="text-gray-600 dark:text-gray-400">{otherItem.item_category}</span>
                </div>
                <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Location:</span>{' '}
                    <span className="text-gray-600 dark:text-gray-400">{otherItem.location}</span>
                </div>
                <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Date:</span>{' '}
                    <span className="text-gray-600 dark:text-gray-400">
                        {formatForDisplay('datetime_found' in otherItem ? otherItem.datetime_found : otherItem.datetime_lost, true)}
                    </span>
                </div>
                <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Description:</span>{' '}
                    <p className="text-gray-600 dark:text-gray-400 mt-1">{otherItem.description}</p>
                </div>
            </div>

            {/* Match Breakdown */}
            <details className="text-sm">
                <summary className="cursor-pointer font-medium text-gray-700 dark:text-gray-300 hover:text-primary">
                    View Match Details
                </summary>
                <div className="mt-3 space-y-2 pl-4">
                    <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Category Match:</span>
                        <span className="font-medium">{match.breakdown.category_score}/20</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Location Match:</span>
                        <span className="font-medium">{match.breakdown.location_score}/20</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Description Similarity:</span>
                        <span className="font-medium">{match.breakdown.tfidf_score}/25</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Name Similarity:</span>
                        <span className="font-medium">{match.breakdown.fuzzy_score}/10</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Attributes:</span>
                        <span className="font-medium">{match.breakdown.attribute_score}/15</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Date Proximity:</span>
                        <span className="font-medium">{match.breakdown.date_score}/10</span>
                    </div>
                </div>
            </details>

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
                            <span className={`font-medium ${userAccepted ? 'text-green-600' : 'text-gray-500'}`}>
                                {userAccepted ? '✓ Accepted' : 'Pending'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Other party:</span>
                            <span className={`font-medium ${otherAccepted ? 'text-green-600' : 'text-gray-500'}`}>
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
