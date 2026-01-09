-- Add image embedding columns to store feature vectors from MobileNet
-- Each embedding is a 1024-dimensional vector stored as an array of floats

-- Add to lost_items table
ALTER TABLE lost_items 
ADD COLUMN IF NOT EXISTS image_embedding FLOAT8[];

-- Add to found_items table
ALTER TABLE found_items 
ADD COLUMN IF NOT EXISTS image_embedding FLOAT8[];

-- Add index for faster queries (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_lost_items_embedding 
ON lost_items USING GIN (image_embedding);

CREATE INDEX IF NOT EXISTS idx_found_items_embedding 
ON found_items USING GIN (image_embedding);

-- Comments for documentation
COMMENT ON COLUMN lost_items.image_embedding IS 'MobileNet feature vector (1024 dimensions) for image similarity matching';
COMMENT ON COLUMN found_items.image_embedding IS 'MobileNet feature vector (1024 dimensions) for image similarity matching';
