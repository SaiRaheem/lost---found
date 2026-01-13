-- Check if there's a trigger to update user balance when transaction is created
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'reward_transactions';

-- Check current user balances
SELECT 
    u.id,
    u.email,
    u.reward_balance,
    COUNT(rt.id) as transaction_count,
    SUM(CASE WHEN rt.type = 'earned' THEN rt.points ELSE 0 END) as total_earned,
    SUM(CASE WHEN rt.type = 'spent' THEN rt.points ELSE 0 END) as total_spent
FROM users u
LEFT JOIN reward_transactions rt ON u.id = rt.user_id
GROUP BY u.id, u.email, u.reward_balance
ORDER BY u.email;
