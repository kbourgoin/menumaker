-- Document tag indexes that appear "unused" but are actually needed
-- These indexes support the cuisine-tag hybrid system and user-specific tag queries

-- Add comments to explain why these indexes are important
COMMENT ON INDEX idx_tags_category IS 
'Index for filtering tags by category (cuisine vs general). Used by CuisineTagSelector and cuisine migration utilities.';

COMMENT ON INDEX idx_tags_user_category IS 
'Composite index for user-specific category queries. Optimizes common pattern of finding user''s cuisine tags.';

-- Check if idx_tags_name exists and document it if so
-- This might be used for tag name lookups or autocomplete
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tags_name') THEN
        EXECUTE 'COMMENT ON INDEX idx_tags_name IS ''Index for tag name lookups and search functionality.''';
    END IF;
END $$;

-- Note: These indexes may appear "unused" in Supabase lint reports because:
-- 1. The app may not have generated enough query volume yet
-- 2. Some queries might be using other indexes instead
-- 3. The features using these indexes might not be heavily used yet
-- However, they support legitimate app functionality and should be retained.