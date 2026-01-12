-- Fix RLS Policies for reward_transactions table

-- 1. Enable RLS on reward_transactions
ALTER TABLE reward_transactions ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own transactions" ON reward_transactions;
DROP POLICY IF EXISTS "Users can insert their own transactions" ON reward_transactions;
DROP POLICY IF EXISTS "System can manage transactions" ON reward_transactions;

-- 3. Create proper RLS policies

-- Users can view their own reward transactions
CREATE POLICY "Users can view their own transactions"
    ON reward_transactions FOR SELECT
    USING (user_id = auth.uid());

-- System can insert transactions (for rewards)
CREATE POLICY "System can insert transactions"
    ON reward_transactions FOR INSERT
    WITH CHECK (true);

-- System can update transactions (for admin corrections)
CREATE POLICY "System can update transactions"
    ON reward_transactions FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Admins can view all transactions
CREATE POLICY "Admins can view all transactions"
    ON reward_transactions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Grant necessary permissions
GRANT SELECT ON reward_transactions TO authenticated;
GRANT INSERT ON reward_transactions TO authenticated;

-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'reward_transactions';
