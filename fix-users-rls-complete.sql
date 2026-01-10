-- COMPLETE FIX: Drop all conflicting policies and recreate properly

-- Step 1: Drop the problematic policy
DROP POLICY IF EXISTS "Admins can view all users" ON users;

-- Step 2: Check if there's a "Users can view own profile" policy
-- If it exists, we'll keep it and add admin access to it
DROP POLICY IF EXISTS "Users can view own profile" ON users;

-- Step 3: Create a single comprehensive policy
CREATE POLICY "Users can view own profile and admins can view all"
ON users
FOR SELECT
TO authenticated
USING (
    -- Users can see their own record
    id = auth.uid()
    OR
    -- OR admins can see all records
    is_admin = true
);

-- Verify
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'users';
