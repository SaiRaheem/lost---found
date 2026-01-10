-- Add RLS policy for admins to view all users
-- Fixed to avoid circular reference

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Admins can view all users" ON users;

-- Create admin access policy for users table
-- This allows users to view their own record AND all records if they are admin
CREATE POLICY "Admins can view all users"
ON users
FOR SELECT
TO authenticated
USING (
    -- Users can always see their own record (needed for admin check)
    auth.uid() = id
    OR
    -- Admins can see all records
    (
        SELECT is_admin FROM users WHERE id = auth.uid()
    ) = true
);

-- Verify the policy was created
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'users' AND policyname = 'Admins can view all users';
