-- Quick fix: Manually recalculate and update balance for Bad user

-- First check current state
SELECT 
    u.name,
    u.reward_balance,
    COALESCE(SUM(rt.points), 0) as actual_balance
FROM users u
LEFT JOIN reward_transactions rt ON rt.user_id = u.id
WHERE u.name = 'Bad'
GROUP BY u.id, u.name, u.reward_balance;

-- Update the balance manually
UPDATE users
SET reward_balance = (
    SELECT COALESCE(SUM(points), 0)
    FROM reward_transactions
    WHERE user_id = users.id
)
WHERE name = 'Bad';

-- Verify the fix
SELECT 
    name,
    reward_balance
FROM users
WHERE name = 'Bad';
