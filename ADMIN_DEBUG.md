# Admin Page Fixes - Quick Test

## Issue
- Balance showing 0
- Time showing UTC
- Not updating instantly

## Quick Fix Steps

**1. Hard Refresh Browser**
- Press `Ctrl + Shift + R` (Windows)
- Or `Ctrl + F5`
- This clears the cache

**2. Check Console**
- Press F12
- Go to Console tab
- Look for these logs:
  - "✅ Reward transactions fetched: X"
  - "✅ Total transactions combined: X"
  - Should see earned, bonus, purchase, redemption types

**3. Test Real-time**
- Keep admin page open
- In another tab, purchase an item
- Should see console log: "🔔 Purchases changed!"
- Table should update automatically

**4. Verify Balance Calculation**
- Check console for transaction details
- Balance should = sum of all points (earned - spent)

## If Still Not Working

Run this SQL to check data:
```sql
-- Check reward transactions
SELECT 
    rt.type,
    rt.points,
    rt.reason,
    rt.created_at,
    u.name
FROM reward_transactions rt
JOIN users u ON u.id = rt.user_id
ORDER BY rt.created_at DESC
LIMIT 10;

-- Check if trigger is working
SELECT id, name, reward_balance FROM users WHERE reward_balance != 0;
```

## Expected Output
- Earned transactions: +50 pts (green)
- Purchases: -50 pts (red)
- Time in IST format
- Balance = correct calculation
