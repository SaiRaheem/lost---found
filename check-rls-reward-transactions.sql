-- Check RLS policies on reward_transactions
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'reward_transactions';

-- Check if RLS is enabled
SELECT 
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'reward_transactions';

-- Try to insert a test transaction manually
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    -- Get Bad user's ID
    SELECT id INTO test_user_id FROM users WHERE name = 'Bad';
    
    -- Try to insert
    INSERT INTO reward_transactions (user_id, points, type, reason)
    VALUES (test_user_id, -10, 'redeemed', 'Test transaction');
    
    RAISE NOTICE 'Insert successful!';
    
    -- Clean up
    DELETE FROM reward_transactions WHERE reason = 'Test transaction';
END $$;
