-- Check why balance is showing 0

-- 1. Check the actual balance calculation
SELECT 
    u.id,
    u.name,
    u.reward_balance as stored_balance,
    COALESCE(SUM(rt.points), 0) as calculated_from_transactions,
    COUNT(rt.id) as transaction_count
FROM users u
LEFT JOIN reward_transactions rt ON rt.user_id = u.id
WHERE u.name = 'Bad'
GROUP BY u.id, u.name, u.reward_balance;

-- 2. Check all transactions for this user
SELECT 
    type,
    points,
    reason,
    created_at,
    created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata' as ist_time
FROM reward_transactions
WHERE user_id = (SELECT id FROM users WHERE name = 'Bad')
ORDER BY created_at;

-- 3. Check if trigger is updating balance
SELECT 
    id,
    name,
    reward_balance,
    (SELECT COALESCE(SUM(points), 0) FROM reward_transactions WHERE user_id = users.id) as should_be
FROM users
WHERE name = 'Bad';
