import React from 'react';
import { MatchBreakdown } from '@/types/database.types';

interface ScoreBreakdownProps {
    breakdown: MatchBreakdown;
    showDetails?: boolean;
}

const ScoreBreakdown: React.FC<ScoreBreakdownProps> = ({ breakdown, showDetails = true }) => {
    const scoreCategories = [
        {
            name: 'Location Match',
            score: breakdown.location_score,
            maxScore: 25,
            description: 'How well the locations match',
            color: 'bg-blue-500',
        },
        {
            name: 'Description Similarity',
            score: breakdown.tfidf_score,
            maxScore: 25,
            description: 'AI analysis of description text',
            color: 'bg-purple-500',
        },
        {
            name: 'Name Similarity',
            score: breakdown.fuzzy_score,
            maxScore: 15,
            description: 'How similar the item names are',
            color: 'bg-green-500',
        },
        {
            name: 'Image Similarity',
            score: breakdown.image_score,
            maxScore: 15,
            description: 'AI visual comparison of photos',
            color: 'bg-pink-500',
            isAI: true,
        },
        {
            name: 'Category Match',
            score: breakdown.category_score,
            maxScore: 10,
            description: 'Item category (Electronics, Books, etc.)',
            color: 'bg-yellow-500',
        },
        {
            name: 'Purpose Match',
            score: breakdown.purpose_score,
            maxScore: 8,
            description: 'What the item is used for',
            color: 'bg-indigo-500',
        },
        {
            name: 'Attributes Match',
            score: breakdown.attribute_score,
            maxScore: 4,
            description: 'Color, brand, model, etc.',
            color: 'bg-orange-500',
        },
        {
            name: 'Date Proximity',
            score: breakdown.date_score,
            maxScore: 2,
            description: 'How close the dates are',
            color: 'bg-gray-500',
        },
    ];

    const getScoreColor = (score: number, maxScore: number) => {
        const percentage = (score / maxScore) * 100;
        if (percentage >= 80) return 'text-green-600 dark:text-green-400';
        if (percentage >= 50) return 'text-yellow-600 dark:text-yellow-400';
        return 'text-red-600 dark:text-red-400';
    };

    const getProgressColor = (score: number, maxScore: number) => {
        const percentage = (score / maxScore) * 100;
        if (percentage >= 80) return 'bg-green-500';
        if (percentage >= 50) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    return (
        <div className="space-y-4">
            {/* Total Score */}
            <div className="glass-card p-4 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        Total Match Score
                    </h3>
                    <span className={`text-3xl font-bold ${getScoreColor(breakdown.total_score, 100)}`}>
                        {breakdown.total_score}%
                    </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div
                        className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(breakdown.total_score, 100)}`}
                        style={{ width: `${breakdown.total_score}%` }}
                    />
                </div>
            </div>

            {/* Detailed Breakdown */}
            {showDetails && (
                <div className="glass-card p-4 rounded-xl">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Score Breakdown
                    </h4>
                    <div className="space-y-3">
                        {scoreCategories.map((category, index) => (
                            <div key={index} className="space-y-1">
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {category.name}
                                        </span>
                                        {category.isAI && (
                                            <span className="px-2 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs rounded-full">
                                                AI
                                            </span>
                                        )}
                                    </div>
                                    <span className={`font-bold ${getScoreColor(category.score, category.maxScore)}`}>
                                        {category.score}/{category.maxScore}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full transition-all duration-300 ${category.color}`}
                                        style={{ width: `${(category.score / category.maxScore) * 100}%` }}
                                    />
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                    {category.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Score Legend */}
            <div className="glass-card p-3 rounded-xl">
                <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Score Guide
                </h4>
                <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        <span className="text-gray-600 dark:text-gray-400">Excellent (80%+)</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-yellow-500" />
                        <span className="text-gray-600 dark:text-gray-400">Good (50-79%)</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <span className="text-gray-600 dark:text-gray-400">Poor (&lt;50%)</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScoreBreakdown;
