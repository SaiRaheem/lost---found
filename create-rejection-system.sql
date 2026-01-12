-- Smart Rejection System - Database Schema
-- This migration creates the infrastructure for intelligent rejection handling

-- 1. Create rejected_pairs table
-- Stores blacklisted pairings that should never be matched again
CREATE TABLE IF NOT EXISTS rejected_pairs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lost_item_id UUID NOT NULL REFERENCES lost_items(id) ON DELETE CASCADE,
    found_item_id UUID NOT NULL REFERENCES found_items(id) ON DELETE CASCADE,
    rejected_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    rejection_reason TEXT,
    feedback JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_rejected_pair UNIQUE(lost_item_id, found_item_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_rejected_pairs_lost ON rejected_pairs(lost_item_id);
CREATE INDEX IF NOT EXISTS idx_rejected_pairs_found ON rejected_pairs(found_item_id);
CREATE INDEX IF NOT EXISTS idx_rejected_pairs_user ON rejected_pairs(rejected_by);
CREATE INDEX IF NOT EXISTS idx_rejected_pairs_created ON rejected_pairs(created_at DESC);

-- 2. Create user_rejection_stats table
-- Tracks user rejection patterns for abuse detection
CREATE TABLE IF NOT EXISTS user_rejection_stats (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    total_rejections INTEGER DEFAULT 0,
    high_score_rejections INTEGER DEFAULT 0,
    total_acceptances INTEGER DEFAULT 0,
    suspicious_flag BOOLEAN DEFAULT FALSE,
    rewards_disabled BOOLEAN DEFAULT FALSE,
    last_rejection_at TIMESTAMPTZ,
    last_acceptance_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_rejection_stats_suspicious ON user_rejection_stats(suspicious_flag) WHERE suspicious_flag = TRUE;
CREATE INDEX IF NOT EXISTS idx_user_rejection_stats_updated ON user_rejection_stats(updated_at DESC);

-- 3. Update matches table
-- Add feedback and rejection_count columns
ALTER TABLE matches 
ADD COLUMN IF NOT EXISTS feedback JSONB,
ADD COLUMN IF NOT EXISTS rejection_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;

-- 4. Create function to check if a pair is rejected
CREATE OR REPLACE FUNCTION is_rejected_pair(
    p_lost_item_id UUID,
    p_found_item_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM rejected_pairs
        WHERE lost_item_id = p_lost_item_id
        AND found_item_id = p_found_item_id
    );
END;
$$;

-- 5. Create function to get next best match (excluding rejected pairs)
CREATE OR REPLACE FUNCTION get_next_best_match(
    p_item_id UUID,
    p_item_type TEXT -- 'lost' or 'found'
)
RETURNS TABLE (
    match_lost_item_id UUID,
    match_found_item_id UUID,
    match_score INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
    IF p_item_type = 'lost' THEN
        RETURN QUERY
        SELECT 
            p_item_id as match_lost_item_id,
            fi.id as match_found_item_id,
            0 as match_score -- Score will be calculated by AI service
        FROM found_items fi
        WHERE fi.status = 'active'
        AND NOT EXISTS (
            SELECT 1 FROM rejected_pairs rp
            WHERE rp.lost_item_id = p_item_id
            AND rp.found_item_id = fi.id
        )
        AND NOT EXISTS (
            SELECT 1 FROM matches m
            WHERE m.lost_item_id = p_item_id
            AND m.found_item_id = fi.id
            AND m.status IN ('pending', 'accepted')
        )
        LIMIT 10; -- Return top 10 candidates for AI scoring
    ELSE
        RETURN QUERY
        SELECT 
            li.id as match_lost_item_id,
            p_item_id as match_found_item_id,
            0 as match_score
        FROM lost_items li
        WHERE li.status = 'active'
        AND NOT EXISTS (
            SELECT 1 FROM rejected_pairs rp
            WHERE rp.lost_item_id = li.id
            AND rp.found_item_id = p_item_id
        )
        AND NOT EXISTS (
            SELECT 1 FROM matches m
            WHERE m.lost_item_id = li.id
            AND m.found_item_id = p_item_id
            AND m.status IN ('pending', 'accepted')
        )
        LIMIT 10;
    END IF;
END;
$$;

-- 6. Create function to update rejection stats
CREATE OR REPLACE FUNCTION update_rejection_stats(
    p_user_id UUID,
    p_match_score INTEGER DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_high_score_threshold INTEGER := 80;
BEGIN
    -- Insert or update stats
    INSERT INTO user_rejection_stats (
        user_id,
        total_rejections,
        high_score_rejections,
        last_rejection_at,
        updated_at
    )
    VALUES (
        p_user_id,
        1,
        CASE WHEN p_match_score >= v_high_score_threshold THEN 1 ELSE 0 END,
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        total_rejections = user_rejection_stats.total_rejections + 1,
        high_score_rejections = user_rejection_stats.high_score_rejections + 
            CASE WHEN p_match_score >= v_high_score_threshold THEN 1 ELSE 0 END,
        last_rejection_at = NOW(),
        updated_at = NOW();
    
    -- Check for abuse patterns
    PERFORM check_rejection_abuse(p_user_id);
END;
$$;

-- 7. Create function to check for abuse
CREATE OR REPLACE FUNCTION check_rejection_abuse(
    p_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_stats RECORD;
    v_rejection_rate DECIMAL;
BEGIN
    SELECT * INTO v_stats
    FROM user_rejection_stats
    WHERE user_id = p_user_id;
    
    IF v_stats IS NULL THEN
        RETURN;
    END IF;
    
    -- Calculate rejection rate
    IF (v_stats.total_rejections + v_stats.total_acceptances) > 0 THEN
        v_rejection_rate := v_stats.total_rejections::DECIMAL / 
            (v_stats.total_rejections + v_stats.total_acceptances);
    ELSE
        v_rejection_rate := 0;
    END IF;
    
    -- Flag as suspicious if:
    -- 1. More than 5 high-score rejections AND >70% of rejections are high-score
    -- 2. More than 20 total rejections AND rejection rate > 90%
    IF (v_stats.high_score_rejections > 5 AND 
        v_stats.high_score_rejections::DECIMAL / v_stats.total_rejections > 0.7)
    OR (v_stats.total_rejections > 20 AND v_rejection_rate > 0.9) THEN
        UPDATE user_rejection_stats
        SET suspicious_flag = TRUE,
            rewards_disabled = TRUE,
            updated_at = NOW()
        WHERE user_id = p_user_id;
    END IF;
END;
$$;

-- 8. Create function to update acceptance stats
CREATE OR REPLACE FUNCTION update_acceptance_stats(
    p_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO user_rejection_stats (
        user_id,
        total_acceptances,
        last_acceptance_at,
        updated_at
    )
    VALUES (
        p_user_id,
        1,
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        total_acceptances = user_rejection_stats.total_acceptances + 1,
        last_acceptance_at = NOW(),
        updated_at = NOW();
END;
$$;

-- Enable Row Level Security
ALTER TABLE rejected_pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_rejection_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rejected_pairs
CREATE POLICY "Users can view their own rejected pairs"
    ON rejected_pairs FOR SELECT
    USING (
        rejected_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM lost_items li
            WHERE li.id = rejected_pairs.lost_item_id
            AND li.user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM found_items fi
            WHERE fi.id = rejected_pairs.found_item_id
            AND fi.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own rejections"
    ON rejected_pairs FOR INSERT
    WITH CHECK (rejected_by = auth.uid());

-- RLS Policies for user_rejection_stats
CREATE POLICY "Users can view their own stats"
    ON user_rejection_stats FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "System can manage stats"
    ON user_rejection_stats FOR ALL
    USING (true)
    WITH CHECK (true);

-- Grant permissions
GRANT SELECT, INSERT ON rejected_pairs TO authenticated;
GRANT SELECT ON user_rejection_stats TO authenticated;

-- Comments for documentation
COMMENT ON TABLE rejected_pairs IS 'Stores blacklisted item pairings that should never be matched again';
COMMENT ON TABLE user_rejection_stats IS 'Tracks user rejection patterns for abuse detection';
COMMENT ON FUNCTION is_rejected_pair IS 'Checks if a specific lost-found pair has been rejected';
COMMENT ON FUNCTION get_next_best_match IS 'Finds potential matches excluding rejected pairs';
COMMENT ON FUNCTION update_rejection_stats IS 'Updates user rejection statistics and checks for abuse';
COMMENT ON FUNCTION check_rejection_abuse IS 'Detects suspicious rejection patterns';
