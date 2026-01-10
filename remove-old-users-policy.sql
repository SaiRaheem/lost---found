-- Remove the conflicting old policy
DROP POLICY IF EXISTS "Users can read own profile" ON users;

-- Verify only the correct policy remains
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'users' AND cmd = 'SELECT';
