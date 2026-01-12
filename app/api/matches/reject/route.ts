import { NextRequest, NextResponse } from 'next/server';
import { rejectMatch, RejectionFeedback } from '@/services/supabase/rejection.service';

export async function POST(request: NextRequest) {
    try {
        // Parse request body
        const body = await request.json();
        const { matchId, userId, feedback } = body;

        if (!matchId) {
            return NextResponse.json(
                { error: 'Match ID is required' },
                { status: 400 }
            );
        }

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

        // Validate feedback if provided
        let validatedFeedback: RejectionFeedback | undefined;
        if (feedback) {
            const validReasons = ['wrong_item', 'wrong_brand', 'wrong_location', 'already_returned', 'other'];
            if (!validReasons.includes(feedback.reason)) {
                return NextResponse.json(
                    { error: 'Invalid rejection reason' },
                    { status: 400 }
                );
            }
            validatedFeedback = feedback;
        }

        console.log('Rejecting match:', matchId, 'for user:', userId);

        // Reject the match
        const result = await rejectMatch(matchId, userId, validatedFeedback);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error || 'Failed to reject match' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Match rejected successfully',
            nextMatch: result.nextMatch || null
        });

    } catch (error) {
        console.error('Error in reject API:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
