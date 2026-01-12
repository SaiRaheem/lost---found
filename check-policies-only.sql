-- Just check the policies
SELECT 
    policyname,
    cmd,
    with_check
FROM pg_policies
WHERE tablename = 'reward_transactions';
