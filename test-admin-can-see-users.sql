-- Test if admin can see all users
-- Run this while logged in as the admin user

SELECT id, name, email, phone, reward_balance, is_admin
FROM users
ORDER BY created_at DESC;

-- This should return ALL users if RLS is working correctly
-- If it only returns 1 user (the admin), then RLS is still blocking
