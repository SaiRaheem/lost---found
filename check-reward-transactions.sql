-- Check if reward_transactions table has any data
SELECT COUNT(*) as total_transactions FROM reward_transactions;

-- Check purchases table
SELECT 
    p.id,
    p.user_id,
    p.points_spent,
    p.created_at,
    u.name,
    u.reward_balance
FROM purchases p
JOIN users u ON u.id = p.user_id
ORDER BY p.created_at DESC
LIMIT 5;

-- Check if there's a mismatch
SELECT 
    u.name,
    u.reward_balance,
    (SELECT COUNT(*) FROM purchases WHERE user_id = u.id) as purchase_count,
    (SELECT COUNT(*) FROM reward_transactions WHERE user_id = u.id) as transaction_count,
    (SELECT COALESCE(SUM(points_spent), 0) FROM purchases WHERE user_id = u.id) as total_spent
FROM users u
WHERE u.name = 'Bad';
