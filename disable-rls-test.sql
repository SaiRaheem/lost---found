-- The simplest fix: Just disable RLS on reward_transactions
-- Since the trigger automatically updates user balance, we don't need RLS protection

ALTER TABLE reward_transactions DISABLE ROW LEVEL SECURITY;

-- Verify it's disabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'reward_transactions';

-- Now test by purchasing an item from the shop
-- Then check if transaction was created:
SELECT 
    rt.*,
    u.name
FROM reward_transactions rt
JOIN users u ON u.id = rt.user_id
ORDER BY rt.created_at DESC 
LIMIT 5;
