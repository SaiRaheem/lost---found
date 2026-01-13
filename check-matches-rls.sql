-- Check RLS policies on matches table
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
WHERE tablename = 'matches'
ORDER BY policyname;

-- Check if RLS is enabled on matches table
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'matches';
