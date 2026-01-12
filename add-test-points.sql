-- Add 2000 test points to Bad user account

-- Insert a bonus transaction
INSERT INTO reward_transactions (user_id, points, type, reason, metadata)
VALUES (
    (SELECT id FROM users WHERE name = 'Bad'),
    2000,
    'bonus',
    'Testing credit - 2000 points',
    '{"test": true, "purpose": "testing purchases and redemptions"}'::jsonb
);

-- Verify the balance updated
SELECT 
    u.name,
    u.reward_balance,
    COUNT(rt.id) as transaction_count,
    COALESCE(SUM(rt.points), 0) as calculated_balance
FROM users u
LEFT JOIN reward_transactions rt ON rt.user_id = u.id
WHERE u.name = 'Bad'
GROUP BY u.id, u.name, u.reward_balance;

-- Check recent transactions
SELECT 
    type,
    points,
    reason,
    created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata' as ist_time
FROM reward_transactions
WHERE user_id = (SELECT id FROM users WHERE name = 'Bad')
ORDER BY created_at DESC
LIMIT 5;
