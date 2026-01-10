-- Check if the current admin user has is_admin set to true
SELECT id, name, email, is_admin
FROM users
WHERE id = auth.uid();

-- If is_admin is false or null, update it:
-- UPDATE users SET is_admin = true WHERE id = auth.uid();
