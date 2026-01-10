import { supabase } from './client';

/**
 * Check if user can submit a report (20-minute cooldown)
 */
export async function canUserReport(userId: string): Promise<{
    canReport: boolean;
    nextAvailableTime?: Date;
    remainingSeconds?: number;
}> {
    const { data: user, error } = await supabase
        .from('users')
        .select('last_report_time')
        .eq('id', userId)
        .single();

    if (error || !user) {
        return { canReport: true };
    }

    if (!user.last_report_time) {
        return { canReport: true };
    }

    const cooldownMinutes = 20;
    const lastReport = new Date(user.last_report_time);
    const now = new Date();
    const minutesSinceLastReport = (now.getTime() - lastReport.getTime()) / 1000 / 60;

    if (minutesSinceLastReport < cooldownMinutes) {
        const remainingSeconds = Math.ceil(
            (cooldownMinutes * 60) - (minutesSinceLastReport * 60)
        );
        const nextAvailableTime = new Date(
            lastReport.getTime() + (cooldownMinutes * 60 * 1000)
        );

        return {
            canReport: false,
            nextAvailableTime,
            remainingSeconds
        };
    }

    return { canReport: true };
}

/**
 * Update user's last report time
 */
export async function updateLastReportTime(userId: string) {
    const { error } = await supabase
        .from('users')
        .update({ last_report_time: new Date().toISOString() })
        .eq('id', userId);

    if (error) throw error;
}

/**
 * Check if user can change password (3-day minimum)
 */
export async function canChangePassword(userId: string): Promise<{
    canChange: boolean;
    nextAvailableDate?: Date;
    daysRemaining?: number;
}> {
    const { data: user, error } = await supabase
        .from('users')
        .select('last_password_change')
        .eq('id', userId)
        .single();

    if (error || !user) {
        return { canChange: true };
    }

    if (!user.last_password_change) {
        return { canChange: true };
    }

    const minDays = 3;
    const lastChange = new Date(user.last_password_change);
    const now = new Date();
    const daysSinceLastChange = (now.getTime() - lastChange.getTime()) / 1000 / 60 / 60 / 24;

    if (daysSinceLastChange < minDays) {
        const daysRemaining = Math.ceil(minDays - daysSinceLastChange);
        const nextAvailableDate = new Date(
            lastChange.getTime() + (minDays * 24 * 60 * 60 * 1000)
        );

        return {
            canChange: false,
            nextAvailableDate,
            daysRemaining
        };
    }

    return { canChange: true };
}

/**
 * Update user's last password change timestamp
 */
export async function updateLastPasswordChange(userId: string) {
    const { error } = await supabase
        .from('users')
        .update({ last_password_change: new Date().toISOString() })
        .eq('id', userId);

    if (error) throw error;
}

/**
 * Submit harassment report
 */
export interface HarassmentReport {
    reported_user_id: string;
    match_id?: string;
    report_type: 'harassment' | 'scam' | 'inappropriate' | 'threatening' | 'other';
    description: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    chat_logs?: any;
    screenshots?: string[];
    additional_evidence?: string;
}

export async function submitHarassmentReport(
    reporterId: string,
    report: HarassmentReport
) {
    const { data, error } = await supabase
        .from('harassment_reports')
        .insert({
            reporter_id: reporterId,
            ...report,
            severity: report.severity || 'medium'
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Check if user has already reported a specific match
 */
export async function hasUserReportedMatch(
    userId: string,
    matchId: string
): Promise<boolean> {
    const { data, error } = await supabase
        .from('harassment_reports')
        .select('id')
        .eq('reporter_id', userId)
        .eq('match_id', matchId)
        .limit(1);

    if (error) {
        console.error('Error checking report status:', error);
        return false;
    }

    return (data && data.length > 0);
}

/**
 * Get harassment reports for admin
 */
export async function getHarassmentReports(status?: string) {
    let query = supabase
        .from('harassment_reports')
        .select(`
            *,
            reporter:reporter_id(id, name, email),
            reported_user:reported_user_id(id, name, email),
            match:match_id(id, status)
        `)
        .order('created_at', { ascending: false });

    if (status) {
        query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
}

/**
 * Update harassment report status (admin only)
 */
export async function updateHarassmentReport(
    reportId: string,
    updates: {
        status?: string;
        admin_notes?: string;
        action_taken?: string;
        reviewed_by?: string;
    }
) {
    const { data, error } = await supabase
        .from('harassment_reports')
        .update({
            ...updates,
            reviewed_at: new Date().toISOString()
        })
        .eq('id', reportId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Detect suspicious matches
 */
export async function detectSuspiciousMatch(
    lostItemId: string,
    foundItemId: string
) {
    // Get both items
    const { data: lostItem } = await supabase
        .from('lost_items')
        .select('*')
        .eq('id', lostItemId)
        .single();

    const { data: foundItem } = await supabase
        .from('found_items')
        .select('*')
        .eq('id', foundItemId)
        .single();

    if (!lostItem || !foundItem) return;

    // Calculate time difference
    const timeDiff = Math.abs(
        new Date(lostItem.created_at).getTime() - new Date(foundItem.created_at).getTime()
    ) / 1000; // seconds

    // Flag if submitted within 5 minutes (300 seconds)
    if (timeDiff < 300) {
        const matchingFields = [];
        let suspicionScore = 50; // Base score for time proximity

        // Check matching details
        if (lostItem.location === foundItem.location) {
            matchingFields.push('location');
            suspicionScore += 15;
        }

        if (lostItem.description === foundItem.description) {
            matchingFields.push('description');
            suspicionScore += 20;
        }

        if (lostItem.item_category === foundItem.item_category) {
            matchingFields.push('category');
            suspicionScore += 10;
        }

        // Create suspicious match record if score is high
        if (suspicionScore >= 60) {
            const { data, error } = await supabase
                .from('suspicious_matches')
                .insert({
                    lost_item_id: lostItemId,
                    found_item_id: foundItemId,
                    owner_id: lostItem.user_id,
                    finder_id: foundItem.user_id,
                    time_difference_seconds: Math.round(timeDiff),
                    matching_fields: matchingFields,
                    suspicion_score: suspicionScore
                })
                .select()
                .single();

            if (error) {
                console.error('Error creating suspicious match:', error);
            }

            return data;
        }
    }

    return null;
}

/**
 * Get suspicious matches for admin review
 */
export async function getSuspiciousMatches(status?: string) {
    let query = supabase
        .from('suspicious_matches')
        .select(`
            *,
            lost_item:lost_item_id(*),
            found_item:found_item_id(*),
            owner:owner_id(id, name, email),
            finder:finder_id(id, name, email)
        `)
        .order('created_at', { ascending: false });

    if (status) {
        query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
}
