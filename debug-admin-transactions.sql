-- Debug admin transactions - check if data is correct

-- 1. Check all reward transactions
SELECT 
    rt.id,
    rt.type,
    rt.points,
    rt.reason,
    rt.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata' as ist_time,
    u.name as user_name,
    u.reward_balance
FROM reward_transactions rt
JOIN users u ON u.id = rt.user_id
ORDER BY rt.created_at DESC
LIMIT 20;

-- 2. Check user balances
SELECT 
    u.id,
    u.name,
    u.reward_balance,
    COUNT(rt.id) as transaction_count,
    COALESCE(SUM(rt.points), 0) as calculated_balance
FROM users u
LEFT JOIN reward_transactions rt ON rt.user_id = u.id
GROUP BY u.id, u.name, u.reward_balance
HAVING u.reward_balance != 0 OR COUNT(rt.id) > 0
ORDER BY u.reward_balance DESC;

-- 3. Check purchases
SELECT 
    p.id,
    p.points_spent,
    p.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata' as ist_time,
    u.name as user_name,
    si.name as item_name
FROM purchases p
JOIN users u ON u.id = p.user_id
JOIN shop_items si ON si.id = p.shop_item_id
ORDER BY p.created_at DESC
LIMIT 10;
