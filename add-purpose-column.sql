-- Add 'purpose' column to lost_items and found_items tables
-- This field helps users describe what the item is used for, improving matching accuracy

ALTER TABLE lost_items ADD COLUMN IF NOT EXISTS purpose TEXT;
ALTER TABLE found_items ADD COLUMN IF NOT EXISTS purpose TEXT;

-- Add comments
COMMENT ON COLUMN lost_items.purpose IS 'Brief description of what the item is used for';
COMMENT ON COLUMN found_items.purpose IS 'Brief description of what the item is used for';
