-- Add missing college column to both tables
ALTER TABLE lost_items ADD COLUMN IF NOT EXISTS college TEXT DEFAULT 'RVRJC';
ALTER TABLE found_items ADD COLUMN IF NOT EXISTS college TEXT DEFAULT 'RVRJC';

-- Add community_type column if missing
ALTER TABLE lost_items ADD COLUMN IF NOT EXISTS community_type TEXT DEFAULT 'college';
ALTER TABLE found_items ADD COLUMN IF NOT EXISTS community_type TEXT DEFAULT 'college';
