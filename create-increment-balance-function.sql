-- Create function to increment user balance atomically
CREATE OR REPLACE FUNCTION increment_user_balance(p_user_id UUID, p_amount INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE users
    SET reward_balance = COALESCE(reward_balance, 0) + p_amount
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION increment_user_balance(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_user_balance(UUID, INTEGER) TO anon;
