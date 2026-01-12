-- Fix RLS Policies for rejected_pairs and user_rejection_stats
-- The issue is that the policies are too restrictive for inserts

-- 1. Fix rejected_pairs policies
DROP POLICY IF EXISTS "Users can insert their own rejections" ON rejected_pairs;

-- Allow authenticated users to insert rejections
CREATE POLICY "Authenticated users can insert rejections"
    ON rejected_pairs FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- 2. Fix user_rejection_stats policies  
DROP POLICY IF EXISTS "System can manage stats" ON user_rejection_stats;

-- Allow all operations on user_rejection_stats (managed by database functions)
CREATE POLICY "Allow all operations on stats"
    ON user_rejection_stats FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 3. Verify the policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('rejected_pairs', 'user_rejection_stats')
ORDER BY tablename, policyname;
