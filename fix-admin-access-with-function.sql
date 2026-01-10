-- SIMPLE FIX: Remove the problematic policy and restore original
-- Then we'll use a different approach for admin access

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view own profile and admins can view all" ON users;

-- Drop and recreate the simple policy
DROP POLICY IF EXISTS "Users can read own profile" ON users;

CREATE POLICY "Users can read own profile"
ON users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Create a function that bypasses RLS to check admin status
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT COALESCE(is_admin, false)
    FROM users
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Now create the admin policy using the function
DROP POLICY IF EXISTS "Admins can view all users" ON users;

CREATE POLICY "Admins can view all users"
ON users
FOR SELECT
TO authenticated
USING (is_admin_user() = true);

-- Verify
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'users' AND cmd = 'SELECT';
