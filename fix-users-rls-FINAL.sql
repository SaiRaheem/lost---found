-- CORRECT FIX for admin viewing all users
-- The issue: the policy was checking is_admin on the ROW, not the current user

-- Drop the incorrect policy
DROP POLICY IF EXISTS "Users can view own profile and admins can view all" ON users;

-- Create the CORRECT policy
-- This checks if the CURRENT USER (auth.uid()) is an admin
CREATE POLICY "Users can view own profile and admins can view all"
ON users
FOR SELECT
TO authenticated
USING (
    -- Users can see their own record
    id = auth.uid()
    OR
    -- OR if the current user is an admin, they can see all records
    (
        SELECT is_admin 
        FROM users 
        WHERE id = auth.uid()
        LIMIT 1
    ) = true
);

-- Verify
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'users' AND cmd = 'SELECT';
