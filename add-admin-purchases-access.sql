-- Add RLS policies for admin access to purchases and redemptions tables

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view all purchases" ON purchases;
DROP POLICY IF EXISTS "Admins can view all redemptions" ON redemptions;

-- Create admin access policy for purchases table
CREATE POLICY "Admins can view all purchases"
ON purchases
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.is_admin = true
    )
);

-- Create admin access policy for redemptions table
CREATE POLICY "Admins can view all redemptions"
ON redemptions
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.is_admin = true
    )
);

-- Verify policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('purchases', 'redemptions')
ORDER BY tablename, policyname;
