-- Add geolocation columns to lost_items and found_items tables

-- Add to lost_items
ALTER TABLE lost_items ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE lost_items ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);
ALTER TABLE lost_items ADD COLUMN IF NOT EXISTS location_accuracy DECIMAL(10, 2); -- in meters

-- Add to found_items
ALTER TABLE found_items ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE found_items ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);
ALTER TABLE found_items ADD COLUMN IF NOT EXISTS location_accuracy DECIMAL(10, 2); -- in meters

-- Create indexes for faster geospatial queries
CREATE INDEX IF NOT EXISTS idx_lost_items_location ON lost_items(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_found_items_location ON found_items(latitude, longitude);

-- Comments
COMMENT ON COLUMN lost_items.latitude IS 'Latitude coordinate where item was lost';
COMMENT ON COLUMN lost_items.longitude IS 'Longitude coordinate where item was lost';
COMMENT ON COLUMN lost_items.location_accuracy IS 'GPS accuracy in meters';
COMMENT ON COLUMN found_items.latitude IS 'Latitude coordinate where item was found';
COMMENT ON COLUMN found_items.longitude IS 'Longitude coordinate where item was found';
COMMENT ON COLUMN found_items.location_accuracy IS 'GPS accuracy in meters';
