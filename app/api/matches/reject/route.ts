import { NextRequest, NextResponse } from 'next/server';
import { rejectMatch, RejectionFeedback } from '@/services/supabase/rejection.service';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
    try {
        // Create server-side Supabase client with cookies
        const cookieStore = cookies();
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

        // Get auth token from cookies
        const authToken = cookieStore.get('sb-access-token')?.value ||
            cookieStore.get('sb-localhost-auth-token')?.value;

        if (!authToken) {
            console.error('No auth token found in cookies');
            return NextResponse.json(
                { error: 'Unauthorized - No auth token' },
                { status: 401 }
            );
        }

        // Create Supabase client with auth token
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
            global: {
                headers: {
                    Authorization: `Bearer ${authToken}`
                }
            }
        });

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            console.error('Auth error:', authError);
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        console.log('Authenticated user:', user.id);

        // Parse request body
        const body = await request.json();
        const { matchId, feedback } = body;

        if (!matchId) {
            return NextResponse.json(
                { error: 'Match ID is required' },
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

        // Reject the match
        const result = await rejectMatch(matchId, user.id, validatedFeedback);

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
